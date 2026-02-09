import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// ============================================================================
// NOTIFICATION SYSTEM — Core API
// Reusable notification engine for the entire platform
// ============================================================================

// For now, we'll use a dynamic table creation approach since schema push hasn't happened.
// The schema table should be added in a future migration.
// This API uses raw SQL for notifications until the schema tables are pushed.

const NOTIFICATION_TABLE = 'notifications';

// Ensure table exists (safe to call multiple times)
async function ensureNotificationTable() {
    await db.run(sql`
        CREATE TABLE IF NOT EXISTS ${sql.raw(NOTIFICATION_TABLE)} (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            recipient_id TEXT NOT NULL,
            
            -- Notification content
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            icon TEXT DEFAULT 'bell',
            color TEXT DEFAULT 'blue',
            
            -- Categorization
            category TEXT NOT NULL DEFAULT 'general',
            priority TEXT NOT NULL DEFAULT 'normal',
            
            -- Source (what created this notification)
            source_type TEXT,
            source_id TEXT,
            source_url TEXT,
            
            -- Action
            action_label TEXT,
            action_url TEXT,
            
            -- Status
            is_read INTEGER DEFAULT 0,
            read_at INTEGER,
            is_archived INTEGER DEFAULT 0,
            
            -- Timestamps
            created_at INTEGER DEFAULT (unixepoch()),
            expires_at INTEGER,
            
            FOREIGN KEY (recipient_id) REFERENCES persons(id)
        )
    `);

    // Create indexes if they don't exist
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notif_recipient ON ${sql.raw(NOTIFICATION_TABLE)} (recipient_id, is_read, created_at)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notif_org ON ${sql.raw(NOTIFICATION_TABLE)} (organization_id, category)`);
}

// ============================================================================
// GET /api/notifications — Fetch notifications for current user
// ============================================================================
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureNotificationTable();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    const category = searchParams.get('category');

    let query = `
        SELECT * FROM ${NOTIFICATION_TABLE}
        WHERE recipient_id = ? AND organization_id = ? AND is_archived = 0
    `;
    const params: any[] = [personId, orgId];

    if (unreadOnly) {
        query += ` AND is_read = 0`;
    }
    if (category) {
        query += ` AND category = ?`;
        params.push(category);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const notifications = await db.all(sql.raw(query));

    // Get unread count
    const unreadResult = await db.get(sql`
        SELECT COUNT(*) as count FROM ${sql.raw(NOTIFICATION_TABLE)}
        WHERE recipient_id = ${personId} AND organization_id = ${orgId} AND is_read = 0 AND is_archived = 0
    `) as any;

    return NextResponse.json({
        data: notifications,
        unreadCount: unreadResult?.count || 0,
    });
}

// ============================================================================
// POST /api/notifications — Create notification(s) or batch actions
// ============================================================================
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureNotificationTable();

    const body = await request.json();
    const { action } = body;

    // ================================================================
    // ACTION: mark_read — Mark one or all notifications as read
    // ================================================================
    if (action === 'mark_read') {
        const { notificationId, all } = body;

        if (all) {
            await db.run(sql`
                UPDATE ${sql.raw(NOTIFICATION_TABLE)}
                SET is_read = 1, read_at = unixepoch()
                WHERE recipient_id = ${personId} AND organization_id = ${orgId} AND is_read = 0
            `);
        } else if (notificationId) {
            await db.run(sql`
                UPDATE ${sql.raw(NOTIFICATION_TABLE)}
                SET is_read = 1, read_at = unixepoch()
                WHERE id = ${notificationId} AND recipient_id = ${personId}
            `);
        }

        return NextResponse.json({ success: true });
    }

    // ================================================================
    // ACTION: archive — Archive a notification
    // ================================================================
    if (action === 'archive') {
        const { notificationId } = body;
        await db.run(sql`
            UPDATE ${sql.raw(NOTIFICATION_TABLE)}
            SET is_archived = 1
            WHERE id = ${notificationId} AND recipient_id = ${personId}
        `);
        return NextResponse.json({ success: true });
    }

    // ================================================================
    // ACTION: send — Create new notification(s)
    // This is the main entry point for all systems to send notifications
    // ================================================================
    if (action === 'send') {
        const {
            recipients,          // string[] — person IDs to notify
            title,
            message,
            icon,
            color,
            category,            // 'enrollment' | 'contract' | 'payment' | 'academic' | etc.
            priority,            // 'low' | 'normal' | 'high' | 'urgent'
            sourceType,          // 'enrollment' | 'contract' | 'invoice' | 'lead' | etc.
            sourceId,
            sourceUrl,
            actionLabel,
            actionUrl,
            expiresInHours,
        } = body;

        if (!recipients?.length || !title || !message) {
            return NextResponse.json({ error: 'recipients, title, and message are required' }, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = expiresInHours ? now + (expiresInHours * 3600) : null;

        const created = [];
        for (const recipientId of recipients) {
            const id = crypto.randomUUID();
            await db.run(sql`
                INSERT INTO ${sql.raw(NOTIFICATION_TABLE)} (
                    id, organization_id, recipient_id,
                    title, message, icon, color,
                    category, priority,
                    source_type, source_id, source_url,
                    action_label, action_url,
                    created_at, expires_at
                ) VALUES (
                    ${id}, ${orgId}, ${recipientId},
                    ${title}, ${message}, ${icon || 'bell'}, ${color || 'blue'},
                    ${category || 'general'}, ${priority || 'normal'},
                    ${sourceType || null}, ${sourceId || null}, ${sourceUrl || null},
                    ${actionLabel || null}, ${actionUrl || null},
                    ${now}, ${expiresAt}
                )
            `);
            created.push({ id, recipientId });
        }

        return NextResponse.json({ data: created }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// ============================================================================
// PATCH /api/notifications — Bulk update
// ============================================================================
export async function PATCH(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureNotificationTable();

    const body = await request.json();
    const { ids, markRead, archive } = body;

    if (!ids?.length) {
        return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }

    const placeholders = ids.map(() => '?').join(',');

    if (markRead) {
        await db.run(sql.raw(
            `UPDATE ${NOTIFICATION_TABLE} SET is_read = 1, read_at = unixepoch() WHERE id IN (${placeholders}) AND recipient_id = ?`,
        ));
    }

    if (archive) {
        await db.run(sql.raw(
            `UPDATE ${NOTIFICATION_TABLE} SET is_archived = 1 WHERE id IN (${placeholders}) AND recipient_id = ?`,
        ));
    }

    return NextResponse.json({ success: true });
}
