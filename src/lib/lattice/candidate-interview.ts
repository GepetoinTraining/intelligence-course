/**
 * Candidate Pre-Interview Engine
 * 
 * Uses Claude to interview candidates and build their lattice
 * Embeds key moments using Google Gemini for vector matching
 */

import Anthropic from '@anthropic-ai/sdk';
import { embedBatch } from '@/lib/embeddings/gemini';
import { SKILLS, SKILL_CATEGORIES } from './skills';
import type { ShapeData } from './schemas';

// ============================================================================
// Types
// ============================================================================

export interface CandidateInterview {
    id: string;
    jobId: string;
    candidateName: string;
    candidateEmail: string;
    status: 'in_progress' | 'complete' | 'cancelled';
    messages: CandidateMessage[];
    extractedLattice: ShapeData | null;
    matchScore: number | null;
    createdAt: Date;
    completedAt: Date | null;
}

export interface CandidateMessage {
    role: 'assistant' | 'user';
    content: string;
    timestamp: Date;
}

/**
 * Key moment extracted from interview conversation
 * Contains a summarized evidence point with its embedding
 */
export interface KeyMoment {
    content: string;           // Summarized evidence text
    context: string;           // Original context from conversation
    skillIds: string[];        // Related skill IDs
    embedding: number[];       // 768-dim Gemini embedding
    confidence: number;        // 0-1 confidence score
}

export interface CandidateExtractionResult {
    lattice: ShapeData;
    summary: string;
    keyStrengths: string[];
    potentialConcerns: string[];
    keyMoments: KeyMoment[];   // Embedded evidence points
}

// ============================================================================
// System Prompt for Candidate Interviewer
// ============================================================================

const CANDIDATE_INTERVIEWER_PROMPT = `You are a friendly, professional interviewer conducting a skills-based pre-screening interview. Your goal is to understand the candidate's real capabilities through natural conversation.

## Your Interview Style
- Be warm and encouraging but professional
- Ask ONE question at a time
- Follow up on interesting points for depth
- Look for EVIDENCE of skills, not just claims
- Ask for specific examples and situations
- Probe for both successes AND challenges/failures (reveals growth)

## What You're Assessing (45 skills across 9 categories)

1. COMMUNICATION: How do they express ideas? Listen? Adapt style?
2. ADAPTABILITY: How do they handle change, pressure, unexpected situations?
3. DIVERSITY: How do they work with different people, cultures, perspectives?
4. DIGITAL SKILLS: How comfortable with technology, online communication?
5. EMOTIONAL INTELLIGENCE: Self-awareness, empathy, conflict handling?
6. TIME MANAGEMENT: Prioritization, focus, deadline handling?
7. NETWORKING: Relationship building, collaboration patterns?
8. CONTINUOUS LEARNING: Curiosity, feedback acceptance, growth mindset?
9. LOGIC & REASONING: Problem-solving approach, analytical thinking?

## Interview Flow (aim for 8-12 exchanges)

1. **Opening** (1-2 Qs) - Put them at ease, understand context
2. **Experience** (2-3 Qs) - Recent roles, key achievements, challenges
3. **Scenarios** (3-4 Qs) - How they handled specific situations
4. **Collaboration** (1-2 Qs) - Team dynamics, conflict, communication
5. **Growth** (1-2 Qs) - Learning, feedback, development areas
6. **Closing** - Thank them, signal completion

## Signs You're Done
When you have enough evidence across multiple skill areas (usually after 8-12 exchanges), end with:
"Thank you so much for sharing! I have a really good picture of your strengths and experience now. Let me put together your profile."

## Important
- Don't ask about salary, location, or logistics - focus on skills/capabilities
- Don't make hiring decisions - you're gathering evidence
- Be encouraging even when probing weaknesses`;

// ============================================================================
// Extraction Prompt
// ============================================================================

const CANDIDATE_EXTRACTION_PROMPT = `You are a skill assessment system. Given an interview transcript, extract a candidate profile.

## Output Format
Return valid JSON:

{
  "positions": {
    "skill_id": position_number  // -2 to +2 scale
  },
  "categoryScores": {
    "category": average_score  // average of skills in category
  },
  "overallScore": 0-100,  // weighted overall assessment
  "summary": "2-3 sentence profile summary",
  "keyStrengths": ["skill_id", ...],  // top 5 demonstrated strengths
  "potentialConcerns": ["brief description", ...],  // any red flags or gaps
  "keyMoments": [  // IMPORTANT: Extract 5-8 key evidence moments
    {
      "content": "Summarized evidence statement (1-2 sentences, written in third person)",
      "context": "Original quote or paraphrase from the conversation",
      "skillIds": ["skill_id_1", "skill_id_2"],  // 1-3 most relevant skills
      "confidence": 0.0-1.0  // How confident is this evidence?
    }
  ]
}

## Key Moments Extraction Guidelines
- Extract 5-8 of the strongest evidence moments from the conversation
- Each moment should be a concrete example, story, or demonstrated behavior
- Summarize in third person: "Candidate led a team of 5..." not "I led..."
- Include context: what was the situation and what did they do?
- Rate confidence based on specificity and detail provided

## Skill IDs Available
${SKILLS.map(s => `${s.id}: ${s.name}`).join('\n')}

## Categories
${SKILL_CATEGORIES.join(', ')}

## Position Scale
+2 CORE: Exceptional, demonstrated repeatedly with strong examples
+1 DEEP: Above average, solid evidence
 0 MID: Average/neutral, little evidence either way
-1 SURFACE: Below average, concerning gaps
-2 SHADOW: Major weakness, could be liability

## Rules
1. Only rate skills with actual evidence from conversation
2. Default unmentioned skills to 0 (neutral)
3. Look for DEMONSTRATED behavior, not self-assessment
4. Weigh multiple examples higher than single mentions
5. Note inconsistencies (claims vs examples)
6. Key moments must be specific and verifiable stories/examples`;

// ============================================================================
// Candidate Interview Engine
// ============================================================================

export class CandidateInterviewEngine {
    private client: Anthropic;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required');
        }
        this.client = new Anthropic({ apiKey });
    }

    /**
     * Start a new candidate interview
     */
    async startInterview(
        candidateName: string,
        jobTitle: string,
        jobDescription: string
    ): Promise<{ message: string }> {
        const systemPrompt = `${CANDIDATE_INTERVIEWER_PROMPT}

## Context for This Interview
The candidate is applying for: ${jobTitle}
Role description: ${jobDescription}

Tailor your questions to be relevant to this role while still assessing general capabilities.`;

        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: `Please start the interview. The candidate's name is ${candidateName}.`,
                }
            ],
        });

        const assistantMessage = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        return { message: assistantMessage };
    }

    /**
     * Continue the interview with candidate's response
     */
    async continueInterview(
        history: CandidateMessage[],
        candidateResponse: string,
        jobTitle: string,
        jobDescription: string
    ): Promise<{ message: string; isComplete: boolean }> {
        const systemPrompt = `${CANDIDATE_INTERVIEWER_PROMPT}

## Context for This Interview
The candidate is applying for: ${jobTitle}
Role description: ${jobDescription}`;

        const messages = history.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }));

        messages.push({ role: 'user', content: candidateResponse });

        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
        });

        const assistantMessage = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        // Check if interview is complete
        const isComplete =
            assistantMessage.toLowerCase().includes('good picture') ||
            assistantMessage.toLowerCase().includes('put together your profile') ||
            assistantMessage.toLowerCase().includes('thank you so much for sharing') ||
            messages.length >= 24; // Safety limit (12 exchanges)

        return { message: assistantMessage, isComplete };
    }

    /**
     * Extract candidate lattice from interview
     * Generates embeddings for key moments using Google Gemini
     */
    async extractLattice(
        history: CandidateMessage[]
    ): Promise<CandidateExtractionResult> {
        const conversationText = history
            .map(m => `${m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.content}`)
            .join('\n\n');

        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: CANDIDATE_EXTRACTION_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Extract the candidate profile from this interview:\n\n${conversationText}`,
                }
            ],
        });

        const responseText = response.content[0].type === 'text'
            ? response.content[0].text
            : '{}';

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Build ShapeData
        const lattice: ShapeData = {
            positions: parsed.positions || {},
            categoryScores: parsed.categoryScores || {},
            overallScore: parsed.overallScore || 50,
            totalEvidenceCount: history.filter(m => m.role === 'user').length,
            shadowRegions: Object.entries(parsed.positions || {})
                .filter(([, pos]) => (pos as number) <= -1.5)
                .map(([skillId, pos]) => ({
                    skillId,
                    intensity: Math.abs(pos as number),
                    affectedSkills: [],
                    impact: Math.abs(pos as number) * 0.5,
                })),
        };

        // Extract key moments and generate embeddings using Google Gemini
        const rawKeyMoments = parsed.keyMoments || [];
        const keyMoments: KeyMoment[] = [];

        if (rawKeyMoments.length > 0) {
            console.log(`[Talent Pool] Generating embeddings for ${rawKeyMoments.length} key moments...`);

            // Prepare texts for batch embedding
            const textsToEmbed = rawKeyMoments.map((m: { content: string; context: string }) =>
                `${m.content}\n\nContext: ${m.context}`
            );

            try {
                // Batch embed all key moments using Google Gemini
                const embeddings = await embedBatch(textsToEmbed);

                // Combine with original data
                for (let i = 0; i < rawKeyMoments.length; i++) {
                    const moment = rawKeyMoments[i];
                    keyMoments.push({
                        content: moment.content || '',
                        context: moment.context || '',
                        skillIds: moment.skillIds || [],
                        embedding: embeddings[i],
                        confidence: moment.confidence || 0.5,
                    });
                }

                console.log(`[Talent Pool] Successfully generated ${keyMoments.length} embeddings (768-dim each)`);
            } catch (embeddingError) {
                console.error('[Talent Pool] Failed to generate embeddings:', embeddingError);
                // Return key moments without embeddings as fallback
                for (const moment of rawKeyMoments) {
                    keyMoments.push({
                        content: moment.content || '',
                        context: moment.context || '',
                        skillIds: moment.skillIds || [],
                        embedding: [], // Empty embedding on failure
                        confidence: moment.confidence || 0.5,
                    });
                }
            }
        }

        return {
            lattice,
            summary: parsed.summary || '',
            keyStrengths: parsed.keyStrengths || [],
            potentialConcerns: parsed.potentialConcerns || [],
            keyMoments,
        };
    }
}

export default CandidateInterviewEngine;

