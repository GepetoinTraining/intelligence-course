/**
 * Talent Profile API
 * 
 * GET /api/talent/profile - Get current user's talent profile
 * POST /api/talent/profile - Create/update profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, talentProfiles, talentEvidenceDocuments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create talent profile
        let profile = await db.query.talentProfiles.findFirst({
            where: eq(talentProfiles.userId, userId),
        });

        if (!profile) {
            // Create new profile
            const [newProfile] = await db.insert(talentProfiles).values({
                userId,
                status: 'incomplete',
            }).returning();
            profile = newProfile;
        }

        // Get documents
        const documents = await db.select().from(talentEvidenceDocuments)
            .where(eq(talentEvidenceDocuments.userId, userId))
            .orderBy(desc(talentEvidenceDocuments.createdAt));

        // Calculate skill gaps (skills with no evidence)
        const lattice = profile.currentLattice ? JSON.parse(profile.currentLattice) : null;
        const ALL_CATEGORIES = ['communication', 'logic', 'adaptability', 'diversity', 'digital', 'eq', 'time_mgmt', 'networking', 'learning'];
        const skillGaps = lattice
            ? ALL_CATEGORIES.filter(cat => !lattice[cat] || lattice[cat] < 0.5)
            : ALL_CATEGORIES;

        // Calculate profile completeness
        const interviewDone = profile.interviewCompletedAt ? 1 : 0;
        const docsAnalyzed = documents.filter(d => d.analysisStatus === 'completed').length;
        const completeness = Math.min(100, (interviewDone * 30) + (docsAnalyzed * 15) + (lattice ? 20 : 0));

        return NextResponse.json({
            success: true,
            profile: {
                id: profile.id,
                headline: profile.headline,
                summary: profile.summary,
                currentLattice: lattice,
                skillGaps,
                evidenceCount: documents.length,
                profileCompleteness: completeness,
                status: profile.status,
                documents: documents.map(d => ({
                    id: d.id,
                    filename: d.filename,
                    documentType: d.documentType,
                    analysisStatus: d.analysisStatus,
                    createdAt: d.createdAt,
                    skillsExtracted: d.skillsExtracted ? JSON.parse(d.skillsExtracted) : [],
                })),
            },
        });
    } catch (error) {
        console.error('Error fetching talent profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { headline, summary } = body;

        // Update profile
        await db.update(talentProfiles)
            .set({
                headline,
                summary,
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(talentProfiles.userId, userId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating talent profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}

