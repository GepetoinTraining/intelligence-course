import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/products - List products
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const productType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (orgId) conditions.push(eq(products.organizationId, orgId));
        if (productType) {
            // Valid types: tuition, enrollment, material, exam, workshop, private, other
            conditions.push(eq(products.productType, productType as any));
        }

        const result = await db
            .select()
            .from(products)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(products.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized - organization required' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, productType, priceCents, currency, isRecurring, courseId } = body;

        if (!name || !productType || priceCents === undefined) {
            return NextResponse.json({ error: 'name, productType, and priceCents required' }, { status: 400 });
        }

        const newProduct = await db.insert(products).values({
            organizationId: orgId,
            name,
            description,
            productType,
            priceCents,
            currency,
            isRecurring: isRecurring ? 1 : 0,
            courseId,
        }).returning();

        return NextResponse.json({ data: newProduct[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}



