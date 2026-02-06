/**
 * Talent Gap Interview API
 * 
 * POST /api/talent/gap-interview
 * Generates targeted questions for skills lacking evidence
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { talentProfiles, talentGapInterviews } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const SKILL_DEFINITIONS: Record<string, string> = {
    communication: 'Written and verbal communication, presenting ideas, active listening',
    logic: 'Analytical thinking, problem-solving, systems thinking',
    adaptability: 'Handling change, pivoting strategies, flexibility',
    diversity: 'Cultural awareness, inclusive practices, global perspective',
    digital: 'Technology proficiency, digital tools, automation',
    eq: 'Emotional intelligence, self-awareness, empathy',
    time_mgmt: 'Prioritization, deadline management, efficiency',
    networking: 'Building relationships, mentorship, collaboration',
    learning: 'Continuous improvement, learning new skills, curiosity',
};

export async function POST(request: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, messages, response } = body;

        // Get profile
        const profile = await db.query.talentProfiles.findFirst({
            where: eq(talentProfiles.personId, personId),
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get current lattice to find gaps
        const currentLattice = profile.currentLattice ? JSON.parse(profile.currentLattice) : {};
        const allSkills = Object.keys(SKILL_DEFINITIONS);
        const gapSkills = allSkills.filter(skill =>
            !currentLattice[skill] || currentLattice[skill] < 0.5
        );

        if (gapSkills.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'All skills have sufficient evidence!',
                isComplete: true,
            });
        }

        switch (action) {
            case 'start': {
                // Create interview session
                const [interview] = await db.insert(talentGapInterviews).values({
                    profileId: profile.id,
                    targetSkills: JSON.stringify(gapSkills.slice(0, 3)), // Focus on 3 skills at a time
                    status: 'in_progress',
                }).returning();

                // Generate opening questions
                const targetSkillsDesc = gapSkills.slice(0, 3).map(s =>
                    `${s}: ${SKILL_DEFINITIONS[s]}`
                ).join('\n');

                const aiResponse = await anthropic.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    system: `You are a friendly career coach conducting a skill assessment interview.

Your goal is to gather evidence about these skills through natural conversation:
${targetSkillsDesc}

Guidelines:
- Be warm and encouraging
- Ask specific, behavioral questions (STAR method)
- One question at a time
- Relate to real work experiences`,
                    messages: [{
                        role: 'user',
                        content: 'Start the skill assessment interview.',
                    }],
                });

                const greeting = aiResponse.content[0].type === 'text'
                    ? aiResponse.content[0].text
                    : 'Let\'s explore your skills!';

                return NextResponse.json({
                    success: true,
                    message: greeting,
                    interviewId: interview.id,
                });
            }

            case 'continue': {
                if (!messages || !response) {
                    return NextResponse.json(
                        { error: 'messages and response required' },
                        { status: 400 }
                    );
                }

                // Get active interview
                const interview = await db.query.talentGapInterviews.findFirst({
                    where: and(
                        eq(talentGapInterviews.profileId, profile.id),
                        eq(talentGapInterviews.status, 'in_progress')
                    ),
                });

                if (!interview) {
                    return NextResponse.json({ error: 'No active interview' }, { status: 404 });
                }

                const targetSkills = JSON.parse(interview.targetSkills);
                const targetSkillsDesc = targetSkills.map((s: string) =>
                    `${s}: ${SKILL_DEFINITIONS[s]}`
                ).join('\n');

                // Convert messages for Claude
                const claudeMessages = messages.map((m: { role: string; content: string }) => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content,
                }));

                // Check if we have enough evidence (roughly 3-4 exchanges per skill)
                const exchangeCount = claudeMessages.filter((m: { role: string }) => m.role === 'user').length;
                const shouldComplete = exchangeCount >= targetSkills.length * 2;

                const systemPrompt = shouldComplete
                    ? `You are wrapping up a skill interview. The user has answered ${exchangeCount} questions.
                    
Thank them for their time and let them know you've gathered good evidence about: ${targetSkills.join(', ')}.

End with a brief, encouraging summary.`
                    : `You are a friendly career coach conducting a skill assessment interview.

Target skills to assess:
${targetSkillsDesc}

Continue the conversation naturally. Ask follow-up questions to dig deeper into specific experiences.
Focus on getting concrete examples with measurable outcomes.`;

                const aiResponse = await anthropic.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    system: systemPrompt,
                    messages: claudeMessages,
                });

                const reply = aiResponse.content[0].type === 'text'
                    ? aiResponse.content[0].text
                    : 'Thank you for sharing!';

                // Update interview messages
                await db.update(talentGapInterviews)
                    .set({
                        messages: JSON.stringify([...messages, { role: 'user', content: response }]),
                    })
                    .where(eq(talentGapInterviews.id, interview.id));

                if (shouldComplete) {
                    // Extract skills from conversation
                    await extractAndUpdateSkills(interview.id, profile.id, messages, targetSkills);
                }

                return NextResponse.json({
                    success: true,
                    message: reply,
                    isComplete: shouldComplete,
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: start, continue' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in gap interview:', error);
        return NextResponse.json(
            { error: 'Interview failed' },
            { status: 500 }
        );
    }
}

async function extractAndUpdateSkills(
    interviewId: string,
    profileId: string,
    messages: { role: string; content: string }[],
    targetSkills: string[]
) {
    try {
        const conversationText = messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n\n');

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: `Analyze this interview conversation and extract skill evidence.

Return JSON:
{
    "skills": {
        "skillName": score (0.0 to 2.0)
    },
    "evidence": {
        "skillName": "brief evidence summary"
    }
}

Only assess these skills: ${targetSkills.join(', ')}`,
            messages: [{
                role: 'user',
                content: conversationText,
            }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';

        let extraction;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            extraction = jsonMatch ? JSON.parse(jsonMatch[0]) : { skills: {} };
        } catch {
            extraction = { skills: {} };
        }

        // Update interview as complete
        await db.update(talentGapInterviews)
            .set({
                status: 'completed',
                skillsAssessed: JSON.stringify(extraction.skills),
                latticeContribution: JSON.stringify(extraction),
                completedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(talentGapInterviews.id, interviewId));

        // Update profile lattice
        const profile = await db.query.talentProfiles.findFirst({
            where: eq(talentProfiles.id, profileId),
        });

        if (profile) {
            const currentLattice = profile.currentLattice ? JSON.parse(profile.currentLattice) : {};

            for (const [skill, score] of Object.entries(extraction.skills)) {
                if (currentLattice[skill]) {
                    currentLattice[skill] = (currentLattice[skill] + (score as number)) / 2;
                } else {
                    currentLattice[skill] = score;
                }
            }

            await db.update(talentProfiles)
                .set({
                    currentLattice: JSON.stringify(currentLattice),
                    lastGapCheckAt: Math.floor(Date.now() / 1000),
                    updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(talentProfiles.id, profileId));
        }

    } catch (error) {
        console.error('Error extracting skills:', error);
    }
}



