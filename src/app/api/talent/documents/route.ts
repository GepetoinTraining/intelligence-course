/**
 * Talent Documents API
 * 
 * POST /api/talent/documents - Upload a document for analysis
 * GET /api/talent/documents - List uploaded documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { talentProfiles, talentEvidenceDocuments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function GET() {
    try {
        const { userId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const documents = await db.select().from(talentEvidenceDocuments)
            .where(eq(talentEvidenceDocuments.userId, userId))
            .orderBy(desc(talentEvidenceDocuments.createdAt));

        return NextResponse.json({
            success: true,
            documents: documents.map(d => ({
                id: d.id,
                filename: d.filename,
                documentType: d.documentType,
                analysisStatus: d.analysisStatus,
                createdAt: d.createdAt,
                skillsExtracted: d.skillsExtracted ? JSON.parse(d.skillsExtracted) : [],
            })),
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Get profile ID
        let profile = await db.query.talentProfiles.findFirst({
            where: eq(talentProfiles.userId, userId),
        });

        if (!profile) {
            const [newProfile] = await db.insert(talentProfiles).values({
                userId,
                status: 'incomplete',
            }).returning();
            profile = newProfile;
        }

        // Read file content
        const fileBuffer = await file.arrayBuffer();
        const fileContent = new TextDecoder().decode(fileBuffer);

        // Determine document type from filename
        const filename = file.name.toLowerCase();
        let documentType: 'resume' | 'certificate' | 'diploma' | 'portfolio' | 'recommendation' | 'transcript' | 'other' = 'other';
        if (filename.includes('resume') || filename.includes('cv') || filename.includes('curriculo')) {
            documentType = 'resume';
        } else if (filename.includes('certificate') || filename.includes('certificado')) {
            documentType = 'certificate';
        } else if (filename.includes('diploma')) {
            documentType = 'diploma';
        } else if (filename.includes('portfolio') || filename.includes('project')) {
            documentType = 'portfolio';
        } else if (filename.includes('recommendation') || filename.includes('reference')) {
            documentType = 'recommendation';
        } else if (filename.includes('transcript') || filename.includes('historico')) {
            documentType = 'transcript';
        }

        // Create document record
        const [doc] = await db.insert(talentEvidenceDocuments).values({
            profileId: profile.id,
            userId,
            filename: file.name,
            fileType: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'text',
            fileContent: fileContent.slice(0, 50000), // Limit content size
            documentType,
            analysisStatus: 'processing',
        }).returning();

        // Analyze document asynchronously (in production, use a queue)
        analyzeDocumentAsync(doc.id, fileContent, profile.id);

        return NextResponse.json({
            success: true,
            documentId: doc.id,
            message: 'Document uploaded and being analyzed',
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json(
            { error: 'Failed to upload document' },
            { status: 500 }
        );
    }
}

// Async function to analyze document with AI
async function analyzeDocumentAsync(docId: string, content: string, profileId: string) {
    try {
        const SKILL_CATEGORIES = [
            'communication', 'logic', 'adaptability', 'diversity',
            'digital', 'eq', 'time_mgmt', 'networking', 'learning'
        ];

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: `You are an HR analyst expert at extracting skills from documents.
            
Analyze the provided document and extract evidence of skills across these categories:
${SKILL_CATEGORIES.join(', ')}

Return JSON with:
{
    "skills": {
        "categoryName": score (0-2 based on evidence strength)
    },
    "summary": "Brief summary of qualifications",
    "keyPoints": ["point1", "point2", ...]
}`,
            messages: [{
                role: 'user',
                content: `Analyze this document for skills evidence:\n\n${content.slice(0, 10000)}`,
            }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';

        // Parse JSON from response
        let analysis;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { skills: {}, summary: '', keyPoints: [] };
        } catch {
            analysis = { skills: {}, summary: '', keyPoints: [] };
        }

        // Update document with analysis
        await db.update(talentEvidenceDocuments)
            .set({
                analysisStatus: 'completed',
                analysisResult: JSON.stringify(analysis),
                skillsExtracted: JSON.stringify(Object.keys(analysis.skills || {})),
                contributedToLattice: 1,
                contributedAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(talentEvidenceDocuments.id, docId));

        // Update profile lattice
        await updateProfileLattice(profileId, analysis.skills);

    } catch (error) {
        console.error('Error analyzing document:', error);
        await db.update(talentEvidenceDocuments)
            .set({
                analysisStatus: 'failed',
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(talentEvidenceDocuments.id, docId));
    }
}

async function updateProfileLattice(profileId: string, newSkills: Record<string, number>) {
    try {
        const profile = await db.query.talentProfiles.findFirst({
            where: eq(talentProfiles.id, profileId),
        });

        if (!profile) return;

        const currentLattice = profile.currentLattice ? JSON.parse(profile.currentLattice) : {};

        // Merge skills (average if existing)
        for (const [skill, score] of Object.entries(newSkills)) {
            if (currentLattice[skill]) {
                currentLattice[skill] = (currentLattice[skill] + score) / 2;
            } else {
                currentLattice[skill] = score;
            }
        }

        // Count evidence
        const evidenceCount = await db.select().from(talentEvidenceDocuments)
            .where(eq(talentEvidenceDocuments.profileId, profileId));

        await db.update(talentProfiles)
            .set({
                currentLattice: JSON.stringify(currentLattice),
                evidenceCount: evidenceCount.length,
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(talentProfiles.id, profileId));

    } catch (error) {
        console.error('Error updating profile lattice:', error);
    }
}

