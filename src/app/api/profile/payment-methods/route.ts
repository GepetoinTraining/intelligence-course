import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// GET /api/profile/payment-methods - List payment methods
// Note: Payment methods would typically be managed via Stripe
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // In production, fetch from Stripe
        return NextResponse.json({
            data: [],
            note: 'Payment methods are managed through the payment provider (Stripe)'
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }
}

// POST /api/profile/payment-methods - Add payment method
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // In production, this would integrate with Stripe
        return NextResponse.json({
            data: {
                message: 'Payment method creation would be handled by Stripe',
                received: body,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding payment method:', error);
        return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 });
    }
}

// DELETE /api/profile/payment-methods - Delete payment method
export async function DELETE(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const methodId = searchParams.get('id');

    if (!methodId) {
        return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    try {
        // In production, delete from Stripe
        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
    }
}

