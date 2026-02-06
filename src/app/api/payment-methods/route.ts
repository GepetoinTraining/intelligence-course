import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentMethods } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/payment-methods - List payment methods for a user
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get('userId') || userId;
    const methodType = searchParams.get('type');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    try {
        const conditions = [eq(paymentMethods.userId, targetUserId)];

        if (methodType) {
            conditions.push(eq(paymentMethods.methodType, methodType as any));
        }

        if (activeOnly) {
            conditions.push(eq(paymentMethods.isActive, 1));
        }

        const result = await db
            .select({
                id: paymentMethods.id,
                userId: paymentMethods.userId,
                methodType: paymentMethods.methodType,
                label: paymentMethods.label,
                isDefault: paymentMethods.isDefault,
                isVerified: paymentMethods.isVerified,
                isActive: paymentMethods.isActive,
                // Bank account info (masked)
                bankName: paymentMethods.bankName,
                accountType: paymentMethods.accountType,
                // PIX info (masked)
                pixKeyType: paymentMethods.pixKeyType,
                // Card info (masked)
                cardBrand: paymentMethods.cardBrand,
                cardLast4: paymentMethods.cardLast4,
                // Wallet info
                walletProvider: paymentMethods.walletProvider,
                createdAt: paymentMethods.createdAt,
            })
            .from(paymentMethods)
            .where(and(...conditions))
            .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }
}

// POST /api/payment-methods - Register a new payment method
export async function POST(request: NextRequest) {
    const { userId: authUserId, orgId } = await getApiAuthWithOrg();
    if (!authUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const targetUserId = body.userId || authUserId;

        // If this is the first method for user, make it default
        const existingMethods = await db
            .select({ id: paymentMethods.id })
            .from(paymentMethods)
            .where(eq(paymentMethods.userId, targetUserId))
            .limit(1);

        const isDefault = existingMethods.length === 0 ? 1 : (body.isDefault ? 1 : 0);

        // If setting as default, unset other defaults
        if (isDefault) {
            await db
                .update(paymentMethods)
                .set({ isDefault: 0, updatedAt: Date.now() })
                .where(eq(paymentMethods.userId, targetUserId));
        }

        const newMethod = await db.insert(paymentMethods).values({
            userId: targetUserId,
            organizationId: orgId,
            methodType: body.methodType,
            label: body.label,
            isDefault,
            // Bank account
            bankCode: body.bankCode,
            bankName: body.bankName,
            accountType: body.accountType,
            accountNumber: body.accountNumber,
            accountDigit: body.accountDigit,
            branchNumber: body.branchNumber,
            branchDigit: body.branchDigit,
            holderName: body.holderName,
            holderDocument: body.holderDocument,
            // PIX
            pixKeyType: body.pixKeyType,
            pixKey: body.pixKey,
            // Card (tokenized)
            cardBrand: body.cardBrand,
            cardLast4: body.cardLast4,
            cardExpiry: body.cardExpiry,
            cardToken: body.cardToken,
            // Wallet
            walletProvider: body.walletProvider,
            walletAccountId: body.walletAccountId,
            // Status
            isVerified: body.methodType === 'cash' ? 1 : 0, // Cash is auto-verified
            isActive: 1,
        }).returning();

        return NextResponse.json({ data: newMethod[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating payment method:', error);
        return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
    }
}

