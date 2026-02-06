/**
 * Job Opening Interview Engine
 * 
 * Uses Claude to interview HR about the ideal candidate
 * Extracts skill requirements to generate the ideal lattice
 */

import Anthropic from '@anthropic-ai/sdk';
import { SKILLS, SKILL_CATEGORIES, type SkillCategory } from './skills';

// ============================================================================
// Types
// ============================================================================

export interface JobOpeningInterview {
    id: string;
    organizationId: string;
    createdBy: string;
    title: string;
    status: 'interviewing' | 'complete' | 'cancelled';
    messages: InterviewMessage[];
    extractedRequirements: SkillRequirement[] | null;
    idealLattice: IdealLattice | null;
    createdAt: Date;
    completedAt: Date | null;
}

export interface InterviewMessage {
    role: 'assistant' | 'user';
    content: string;
    timestamp: Date;
}

export interface SkillRequirement {
    skillId: string;
    importance: 'critical' | 'important' | 'nice_to_have';
    minPosition: number;  // -2 to +2
    shadowExclusion: boolean;  // If true, this skill in SHADOW is a hard no
    reason: string;
}

export interface IdealLattice {
    positions: Record<string, number>;
    categoryWeights: Record<SkillCategory, number>;
    mustHaveSkills: string[];
    mustNotHaveShadows: string[];
    overallProfile: string;
}

// ============================================================================
// System Prompt for Claude Interviewer
// ============================================================================

const INTERVIEWER_SYSTEM_PROMPT = `You are an expert HR interviewer helping to define the ideal candidate for a job opening. Your goal is to have a natural conversation that extracts detailed skill requirements.

## Your Interview Style
- Ask ONE focused question at a time
- Follow up on interesting points
- Probe for specifics, examples, and edge cases
- Uncover both positive requirements AND red flags (shadows)
- Be conversational but purposeful

## Skill Framework (45 skills in 9 categories)
You're mapping to this framework:

1. COMMUNICATION: verbal, written, non-verbal, assertive, digital, effective
2. ADAPTABILITY: change embrace, pivoting, creative problem-solving, critical thinking, resilience
3. DIVERSITY: cross-cultural, generational bridging, inclusive communication, org navigation
4. DIGITAL: personal branding, reputation, networking, privacy, content creation
5. EMOTIONAL INTELLIGENCE: self-awareness, regulation, empathy, social skills, conflict transformation
6. TIME MANAGEMENT: prioritization, goal-setting, focus, interruption handling, procrastination
7. NETWORKING: relationship building, mentorship, cultivation, partnerships, recognition
8. CONTINUOUS LEARNING: trend awareness, feedback acceptance, self-evaluation, learning plans, adaptation
9. LOGIC & REASONING: traversal, decomposition, abstraction, analogy, sequencing

## Position Scale
- CORE (+2): Must be exceptional, foundational requirement
- DEEP (+1): Should be well-developed
- MID (0): Functional level needed
- SURFACE (-1): OK if lacking, can develop
- SHADOW (-2): Avoid candidates with this as a liability

## Interview Structure
1. Role Overview (what, why, context)
2. Success Criteria (measurable outcomes)
3. Team Dynamics (collaboration patterns)
4. Challenge Scenarios (pressure points)
5. Red Flags (what would make someone fail)
6. Growth Path (where this leads)

## Your Current Goal
Conduct a thorough interview to understand the ideal candidate. After gathering enough information (usually 6-10 exchanges), indicate you're ready to generate requirements by saying: "I have a clear picture now. Let me summarize the ideal candidate profile."

Remember: You're interviewing the EMPLOYER about what they need, not interviewing a candidate.`;

// ============================================================================
// Extraction Prompt
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are a skill extraction system. Given a conversation between an HR interviewer and an employer, extract structured skill requirements.

## Output Format
Return a valid JSON object with this structure:

{
  "requirements": [
    {
      "skillId": "comm_verbal",
      "importance": "critical|important|nice_to_have",
      "minPosition": -2 to 2,
      "shadowExclusion": true/false,
      "reason": "brief explanation from conversation"
    }
  ],
  "idealLattice": {
    "positions": { "skillId": position_number, ... },
    "categoryWeights": { "category": 0-1 weight, ... },
    "mustHaveSkills": ["skill_ids that are non-negotiable"],
    "mustNotHaveShadows": ["skill_ids where shadow is disqualifying"],
    "overallProfile": "2-3 sentence summary of ideal candidate"
  }
}

## Skill IDs Available
${SKILLS.map(s => `${s.id}: ${s.name}`).join('\n')}

## Categories
${SKILL_CATEGORIES.join(', ')}

## Rules
1. Only include skills explicitly or strongly implied in conversation
2. Set positions based on stated importance (critical=+2, important=+1, nice_to_have=0)
3. Shadow exclusions are for traits where the shadow would be disqualifying
4. Category weights should sum to approximately 1.0
5. Be conservative - don't invent requirements not supported by conversation`;

// ============================================================================
// Interview Engine
// ============================================================================

export class JobInterviewEngine {
    private client: Anthropic;

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required');
        }
        this.client = new Anthropic({ apiKey });
    }

    /**
     * Start a new job opening interview
     */
    async startInterview(jobTitle: string): Promise<{ message: string }> {
        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: INTERVIEWER_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `We're hiring for: ${jobTitle}. Please start the interview to understand what we need.`,
                }
            ],
        });

        const assistantMessage = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        return { message: assistantMessage };
    }

    /**
     * Continue the interview with a user response
     */
    async continueInterview(
        history: InterviewMessage[],
        userResponse: string
    ): Promise<{ message: string; isComplete: boolean }> {
        // Build messages array for Claude
        const messages = history.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }));

        // Add new user response
        messages.push({ role: 'user', content: userResponse });

        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: INTERVIEWER_SYSTEM_PROMPT,
            messages,
        });

        const assistantMessage = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        // Check if interview is complete
        const isComplete = assistantMessage.toLowerCase().includes('let me summarize') ||
            assistantMessage.toLowerCase().includes('clear picture') ||
            assistantMessage.toLowerCase().includes('ready to generate');

        return { message: assistantMessage, isComplete };
    }

    /**
     * Extract skill requirements from completed interview
     */
    async extractRequirements(
        history: InterviewMessage[]
    ): Promise<{ requirements: SkillRequirement[]; idealLattice: IdealLattice }> {
        const conversationText = history
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');

        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: EXTRACTION_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Extract skill requirements from this interview:\n\n${conversationText}`,
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
        return {
            requirements: parsed.requirements || [],
            idealLattice: parsed.idealLattice,
        };
    }
}

// ============================================================================
// Helper: Calculate Match Score
// ============================================================================

export function calculateCandidateMatch(
    candidateLattice: Record<string, number>,
    idealLattice: IdealLattice
): {
    score: number;
    gaps: Array<{ skillId: string; gap: number; severity: string }>;
    shadowWarnings: string[];
    strengths: string[];
} {
    let totalScore = 0;
    let maxScore = 0;
    const gaps: Array<{ skillId: string; gap: number; severity: string }> = [];
    const shadowWarnings: string[] = [];
    const strengths: string[] = [];

    // Check each required skill
    for (const [skillId, idealPosition] of Object.entries(idealLattice.positions)) {
        const candidatePosition = candidateLattice[skillId] || 0;
        const weight = idealLattice.mustHaveSkills.includes(skillId) ? 2 : 1;

        // Calculate skill match (0-1)
        const diff = Math.abs(candidatePosition - idealPosition);
        const skillScore = Math.max(0, 1 - (diff / 4)); // 4 is max diff

        totalScore += skillScore * weight;
        maxScore += weight;

        // Check for gaps
        if (candidatePosition < idealPosition - 1) {
            gaps.push({
                skillId,
                gap: idealPosition - candidatePosition,
                severity: idealLattice.mustHaveSkills.includes(skillId) ? 'critical' : 'moderate',
            });
        }

        // Check for strengths
        if (candidatePosition >= idealPosition) {
            strengths.push(skillId);
        }
    }

    // Check shadow exclusions
    for (const skillId of idealLattice.mustNotHaveShadows) {
        const candidatePosition = candidateLattice[skillId] || 0;
        if (candidatePosition <= -1.5) {
            shadowWarnings.push(skillId);
            totalScore -= 0.2 * maxScore; // Heavy penalty
        }
    }

    const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
        score: Math.max(0, Math.min(100, normalizedScore)),
        gaps: gaps.sort((a, b) => b.gap - a.gap).slice(0, 5),
        shadowWarnings,
        strengths: strengths.slice(0, 6),
    };
}

export default JobInterviewEngine;

