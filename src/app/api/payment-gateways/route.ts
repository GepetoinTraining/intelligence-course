import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentGateways } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';
import { encrypt, getKeyHint } from '@/lib/crypto';

// GET /api/payment-gateways - List payment gateways for org
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(paymentGateways.organizationId, orgId));
        }

        const result = await db
            .select({
                id: paymentGateways.id,
                organizationId: paymentGateways.organizationId,
                provider: paymentGateways.provider,
                accountId: paymentGateways.accountId,
                accountName: paymentGateways.accountName,
                isProduction: paymentGateways.isProduction,
                isDefault: paymentGateways.isDefault,
                supportsPix: paymentGateways.supportsPix,
                supportsBoleto: paymentGateways.supportsBoleto,
                supportsCard: paymentGateways.supportsCard,
                supportsSplit: paymentGateways.supportsSplit,
                pixFeePercent: paymentGateways.pixFeePercent,
                boletoFeeCents: paymentGateways.boletoFeeCents,
                cardFeePercent: paymentGateways.cardFeePercent,
                isActive: paymentGateways.isActive,
                createdAt: paymentGateways.createdAt,
                updatedAt: paymentGateways.updatedAt,
                // Encrypted fields — only return hints
                apiKeyEncrypted: paymentGateways.apiKeyEncrypted,
                secretKeyEncrypted: paymentGateways.secretKeyEncrypted,
            })
            .from(paymentGateways)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Replace encrypted keys with hints for UI display
        const safeResult = result.map((gw) => ({
            ...gw,
            apiKeyHint: gw.apiKeyEncrypted ? '••••' + getKeyHint(gw.apiKeyEncrypted) : null,
            secretKeyHint: gw.secretKeyEncrypted ? '••••' + getKeyHint(gw.secretKeyEncrypted) : null,
            apiKeyEncrypted: undefined,
            secretKeyEncrypted: undefined,
        }));

        return NextResponse.json({ data: safeResult });
    } catch (error) {
        console.error('Error fetching payment gateways:', error);
        return NextResponse.json({ error: 'Failed to fetch payment gateways' }, { status: 500 });
    }
}

// POST /api/payment-gateways - Add payment gateway
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Encrypt API credentials with AES-256-GCM before storing
        const apiKeyEncrypted = body.apiKey ? encrypt(body.apiKey) : null;
        const secretKeyEncrypted = body.secretKey ? encrypt(body.secretKey) : null;
        const webhookSecretEncrypted = body.webhookSecret ? encrypt(body.webhookSecret) : null;

        const newGateway = await db.insert(paymentGateways).values({
            organizationId: orgId,
            provider: body.provider,
            apiKeyEncrypted,
            secretKeyEncrypted,
            webhookSecret: webhookSecretEncrypted,
            accountId: body.accountId,
            accountName: body.accountName || `${body.provider} - ${orgId.slice(0, 8)}`,
            isProduction: body.isProduction ?? false,
            isDefault: body.isDefault ?? false,
            supportsPix: body.supportsPix ?? true,
            supportsBoleto: body.supportsBoleto ?? true,
            supportsCard: body.supportsCard ?? true,
            supportsSplit: body.supportsSplit ?? false,
            pixFeePercent: body.pixFeePercent,
            boletoFeeCents: body.boletoFeeCents,
            cardFeePercent: body.cardFeePercent,
        }).returning();

        // Return safe response (no encrypted data)
        const safe = {
            ...newGateway[0],
            apiKeyEncrypted: undefined,
            secretKeyEncrypted: undefined,
            webhookSecret: undefined,
            apiKeyHint: body.apiKey ? '••••' + getKeyHint(body.apiKey) : null,
        };

        return NextResponse.json({ data: safe }, { status: 201 });
    } catch (error) {
        console.error('Error creating payment gateway:', error);
        return NextResponse.json({ error: 'Failed to create payment gateway' }, { status: 500 });
    }
}
