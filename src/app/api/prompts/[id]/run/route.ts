import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prompts, promptRuns, userApiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/prompts/[id]/run - Execute a prompt
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { userMessage, conversationHistory = [] } = body;

        // Get the prompt
        const prompt = await db
            .select()
            .from(prompts)
            .where(eq(prompts.id, id))
            .limit(1);

        if (prompt.length === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        const promptData = prompt[0];

        // Get user's API key or use default
        let apiKey = process.env.ANTHROPIC_API_KEY;

        const userKey = await db
            .select()
            .from(userApiKeys)
            .where(eq(userApiKeys.userId, userId))
            .limit(1);

        if (userKey.length > 0 && userKey[0].provider === 'anthropic') {
            // TODO: Decrypt the key
            // apiKey = decrypt(userKey[0].encryptedKey);
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'No API key configured' }, { status: 400 });
        }

        // Parse base messages if they exist
        let baseMessages: Anthropic.MessageParam[] = [];
        try {
            if (promptData.baseMessages) {
                baseMessages = JSON.parse(promptData.baseMessages);
            }
        } catch {
            // Invalid JSON, ignore
        }

        // Build messages array
        const messages: Anthropic.MessageParam[] = [
            ...baseMessages,
            ...conversationHistory,
            { role: 'user', content: userMessage },
        ];

        // Call Anthropic
        const anthropic = new Anthropic({ apiKey });
        const model = body.model || 'claude-sonnet-4-20250514';

        const response = await anthropic.messages.create({
            model,
            max_tokens: body.maxTokens || 4096,
            system: promptData.currentSystemPrompt || promptData.baseSystemPrompt || '',
            messages,
            temperature: body.temperature || 0.7,
        });

        const assistantMessage = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        const latencyMs = Date.now() - startTime;

        // Create the run record
        const run = await db.insert(promptRuns).values({
            promptId: id,
            userId,
            provider: 'anthropic',
            model,
            systemPrompt: promptData.currentSystemPrompt || promptData.baseSystemPrompt,
            messages: JSON.stringify([
                ...conversationHistory,
                { role: 'user', content: userMessage },
                { role: 'assistant', content: assistantMessage },
            ]),
            temperature: body.temperature || 0.7,
            maxTokens: body.maxTokens || 4096,
            output: assistantMessage,
            outputTokens: response.usage?.output_tokens || 0,
            inputTokens: response.usage?.input_tokens || 0,
            latencyMs,
        }).returning();

        return NextResponse.json({
            data: {
                runId: run[0].id,
                response: assistantMessage,
                usage: response.usage,
                latencyMs,
            }
        });
    } catch (error) {
        console.error('Error running prompt:', error);

        return NextResponse.json({
            error: 'Failed to run prompt',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
