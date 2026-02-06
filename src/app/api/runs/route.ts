import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { promptRuns, userApiKeys } from '@/lib/db/schema';
import { runPrompt, type Message } from '@/lib/ai/anthropic';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            model,
            systemPrompt,
            messages,
            temperature,
            maxTokens,
            promptId
        } = body as {
            model: string;
            systemPrompt?: string;
            messages: Message[];
            temperature?: number;
            maxTokens?: number;
            promptId?: string;
        };

        // Validate required fields
        if (!model || !messages || messages.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: model, messages' },
                { status: 400 }
            );
        }

        // Get user's API key for Anthropic
        const [apiKeyRecord] = await db
            .select()
            .from(userApiKeys)
            .where(
                and(
                    eq(userApiKeys.userId, userId),
                    eq(userApiKeys.provider, 'anthropic')
                )
            )
            .limit(1);

        if (!apiKeyRecord) {
            return NextResponse.json(
                { error: 'No Anthropic API key configured. Please add your API key in settings.' },
                { status: 400 }
            );
        }

        // Decrypt the API key
        const apiKey = decrypt(apiKeyRecord.encryptedKey);

        // Run the prompt
        const result = await runPrompt(apiKey, {
            model,
            systemPrompt,
            messages,
            temperature,
            maxTokens,
        });

        // Log the run (immutable)
        const [run] = await db
            .insert(promptRuns)
            .values({
                userId,
                promptId: promptId || null,
                provider: 'anthropic',
                model,
                systemPrompt,
                messages: JSON.stringify(messages),
                temperature,
                maxTokens,
                output: result.output,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                latencyMs: result.latencyMs,
                errorCode: result.error?.code,
                errorMessage: result.error?.message,
            })
            .returning();

        // Update API key usage stats
        await db
            .update(userApiKeys)
            .set({
                lastUsedAt: Math.floor(Date.now() / 1000),
                totalRequests: (apiKeyRecord.totalRequests || 0) + 1,
            })
            .where(eq(userApiKeys.id, apiKeyRecord.id));

        return NextResponse.json({
            runId: run.id,
            output: result.output,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            latencyMs: result.latencyMs,
            error: result.error,
        });
    } catch (error) {
        console.error('Run API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/runs - List user's recent runs
export async function GET(request: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const promptId = url.searchParams.get('promptId');

        let query = db
            .select()
            .from(promptRuns)
            .where(eq(promptRuns.userId, userId))
            .orderBy(promptRuns.createdAt)
            .limit(limit);

        if (promptId) {
            query = db
                .select()
                .from(promptRuns)
                .where(
                    and(
                        eq(promptRuns.userId, userId),
                        eq(promptRuns.promptId, promptId)
                    )
                )
                .orderBy(promptRuns.createdAt)
                .limit(limit);
        }

        const runs = await query;

        return NextResponse.json({ runs });
    } catch (error) {
        console.error('List runs error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

