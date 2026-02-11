/**
 * Anunciação Settings API
 *
 * GET  /api/anunciacao-settings  — Get org settings (with defaults)
 * PUT  /api/anunciacao-settings  — Upsert org settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { orgAnunciacaoSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const timestamp = () => Math.floor(Date.now() / 1000);

// ── Defaults ──

const DEFAULT_SETTINGS = {
    enabled: 0,
    requiredForTeamAccess: 0,
    visibility: 'org_wide' as const,
    aiModelPreference: 'claude-sonnet-4-20250514',
};

// ── Validation ──

const UpdateSettingsSchema = z.object({
    enabled: z.union([z.number(), z.boolean()]).optional(),
    requiredForTeamAccess: z.union([z.number(), z.boolean()]).optional(),
    visibility: z.enum(['org_wide', 'leadership_only']).optional(),
    aiModelPreference: z.string().optional(),
});

// ── GET: Retrieve settings with defaults ──

export async function GET() {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [settings] = await db.select()
            .from(orgAnunciacaoSettings)
            .where(eq(orgAnunciacaoSettings.orgId, orgId))
            .limit(1);

        if (!settings) {
            return NextResponse.json({
                data: {
                    orgId,
                    ...DEFAULT_SETTINGS,
                    createdAt: null,
                    updatedAt: null,
                },
            });
        }

        return NextResponse.json({
            data: {
                ...settings,
                // Normalize integer booleans for frontend
                enabled: settings.enabled ?? 0,
                requiredForTeamAccess: settings.requiredForTeamAccess ?? 0,
            },
        });
    } catch (error) {
        console.error('Error fetching anunciacao settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// ── PUT: Upsert settings ──

export async function PUT(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = UpdateSettingsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Normalize booleans to integers for SQLite
        const updates: any = { updatedAt: timestamp() };
        if (data.enabled !== undefined) updates.enabled = data.enabled ? 1 : 0;
        if (data.requiredForTeamAccess !== undefined) updates.requiredForTeamAccess = data.requiredForTeamAccess ? 1 : 0;
        if (data.visibility !== undefined) updates.visibility = data.visibility;
        if (data.aiModelPreference !== undefined) updates.aiModelPreference = data.aiModelPreference;

        // Check if settings exist
        const [existing] = await db.select({ orgId: orgAnunciacaoSettings.orgId })
            .from(orgAnunciacaoSettings)
            .where(eq(orgAnunciacaoSettings.orgId, orgId))
            .limit(1);

        if (existing) {
            const [updated] = await db.update(orgAnunciacaoSettings)
                .set(updates)
                .where(eq(orgAnunciacaoSettings.orgId, orgId))
                .returning();
            return NextResponse.json({ data: updated });
        } else {
            const [created] = await db.insert(orgAnunciacaoSettings)
                .values({
                    orgId,
                    ...DEFAULT_SETTINGS,
                    ...updates,
                    createdAt: timestamp(),
                })
                .returning();
            return NextResponse.json({ data: created });
        }
    } catch (error) {
        console.error('Error updating anunciacao settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
