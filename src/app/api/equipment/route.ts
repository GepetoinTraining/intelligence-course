import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schoolEquipment } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/equipment — List all equipment (optional ?category= filter)
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let items;
        if (category) {
            items = await db.select().from(schoolEquipment)
                .where(and(
                    eq(schoolEquipment.organizationId, orgId),
                    eq(schoolEquipment.category, category as any),
                    eq(schoolEquipment.isActive, true),
                ));
        } else {
            items = await db.select().from(schoolEquipment)
                .where(and(
                    eq(schoolEquipment.organizationId, orgId),
                    eq(schoolEquipment.isActive, true),
                ));
        }

        const parsed = items.map(item => ({
            ...item,
            capabilities: (() => { try { return JSON.parse(item.capabilities || '[]'); } catch { return []; } })(),
            rules: (() => { try { return JSON.parse(item.rules || '{}'); } catch { return {}; } })(),
        }));

        return NextResponse.json({ data: parsed });
    } catch (error) {
        console.error('[equipment GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/equipment — Create equipment
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        const created = [];

        for (const item of items) {
            const [equipment] = await db.insert(schoolEquipment).values({
                organizationId: orgId,
                name: item.name,
                code: item.code,
                description: item.description,
                imageUrl: item.imageUrl,
                category: item.category,
                subcategory: item.subcategory,
                brand: item.brand,
                model: item.model,
                serialNumber: item.serialNumber,
                capabilities: JSON.stringify(item.capabilities || []),
                rules: JSON.stringify(item.rules || {}),
                defaultRoomId: item.defaultRoomId,
                defaultLocation: item.defaultLocation,
                isPortable: item.isPortable !== false,
                quantity: item.quantity || 1,
                condition: item.condition || 'good',
                purchaseDate: item.purchaseDate,
                warrantyExpires: item.warrantyExpires,
                purchaseCostCents: item.purchaseCostCents,
                status: item.status || 'available',
            }).returning();
            created.push(equipment);
        }

        return NextResponse.json({ data: created }, { status: 201 });
    } catch (error) {
        console.error('[equipment POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
