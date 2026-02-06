import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { userApiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, getKeyHint } from '@/lib/crypto';

// POST /api/api-keys - Add or update an API key
export async function POST(request: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { provider, apiKey } = body as {
            provider: string;
            apiKey: string;
        };

        // Validate
        if (!provider || !apiKey) {
            return NextResponse.json(
                { error: 'Missing required fields: provider, apiKey' },
                { status: 400 }
            );
        }

        const validProviders = ['anthropic', 'openai', 'google', 'groq'];
        if (!validProviders.includes(provider)) {
            return NextResponse.json(
                { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
                { status: 400 }
            );
        }

        // Basic validation for Anthropic keys
        if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
            return NextResponse.json(
                { error: 'Invalid Anthropic API key format (should start with sk-ant-)' },
                { status: 400 }
            );
        }

        // Encrypt the key
        const encryptedKey = encrypt(apiKey);
        const keyHint = getKeyHint(apiKey);

        // Check if key already exists for this provider
        const [existing] = await db
            .select()
            .from(userApiKeys)
            .where(
                and(
                    eq(userApiKeys.userId, userId),
                    eq(userApiKeys.provider, provider)
                )
            )
            .limit(1);

        if (existing) {
            // Update existing
            await db
                .update(userApiKeys)
                .set({
                    encryptedKey,
                    keyHint,
                })
                .where(eq(userApiKeys.id, existing.id));

            return NextResponse.json({
                success: true,
                message: 'API key updated',
                keyHint
            });
        } else {
            // Insert new
            await db.insert(userApiKeys).values({
                userId,
                provider,
                encryptedKey,
                keyHint,
            });

            return NextResponse.json({
                success: true,
                message: 'API key added',
                keyHint
            });
        }
    } catch (error) {
        console.error('API keys error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/api-keys - List user's configured API keys (just metadata, not the keys)
export async function GET() {
    try {
        const { userId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const keys = await db
            .select({
                id: userApiKeys.id,
                provider: userApiKeys.provider,
                keyHint: userApiKeys.keyHint,
                lastUsedAt: userApiKeys.lastUsedAt,
                totalRequests: userApiKeys.totalRequests,
                createdAt: userApiKeys.createdAt,
            })
            .from(userApiKeys)
            .where(eq(userApiKeys.userId, userId));

        return NextResponse.json({ keys });
    } catch (error) {
        console.error('List API keys error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/api-keys - Remove an API key
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const provider = url.searchParams.get('provider');

        if (!provider) {
            return NextResponse.json(
                { error: 'Missing provider parameter' },
                { status: 400 }
            );
        }

        await db
            .delete(userApiKeys)
            .where(
                and(
                    eq(userApiKeys.userId, userId),
                    eq(userApiKeys.provider, provider)
                )
            );

        return NextResponse.json({ success: true, message: 'API key removed' });
    } catch (error) {
        console.error('Delete API key error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

