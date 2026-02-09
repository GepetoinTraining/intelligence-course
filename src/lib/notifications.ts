import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// ============================================================================
// NOTIFICATION DISPATCHER
// Universal helper to send notifications from anywhere in the codebase
// ============================================================================

export interface NotificationPayload {
    orgId: string;
    recipients: string[];          // Person IDs
    title: string;
    message: string;
    icon?: string;                  // Tabler icon name (e.g., 'school', 'file-text', 'currency-real')
    color?: string;                 // Mantine color (e.g., 'blue', 'green', 'red')
    category?: NotificationCategory;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    sourceType?: string;            // 'enrollment' | 'contract' | 'invoice' | 'lead' | etc.
    sourceId?: string;              // ID of the source record
    sourceUrl?: string;             // URL to navigate to when clicked
    actionLabel?: string;           // CTA button label
    actionUrl?: string;             // CTA button URL
    expiresInHours?: number;
}

export type NotificationCategory =
    | 'enrollment'     // New enrollment, status change
    | 'contract'       // Contract generated, signed, expiring
    | 'payment'        // Invoice due, payment received, overdue
    | 'academic'       // Grades, attendance, progress
    | 'lead'           // New lead, conversion, follow-up
    | 'hr'             // Employee updates, schedule changes
    | 'communication'  // Messages, announcements
    | 'system'         // System alerts, maintenance
    | 'kaizen'         // Feedback, NPS, improvement
    | 'marketing'      // Campaign updates, analytics
    | 'general';       // Everything else

const NOTIFICATION_TABLE = 'notifications';

/**
 * Send notifications to one or more recipients.
 * This function creates the notification table if it doesn't exist (safe for first use).
 * 
 * @example
 * // Single notification
 * await sendNotification({
 *     orgId: 'org-123',
 *     recipients: ['person-456'],
 *     title: 'Nova Matrícula',
 *     message: 'João Silva foi matriculado na turma English A1',
 *     icon: 'school',
 *     color: 'green',
 *     category: 'enrollment',
 *     sourceType: 'enrollment',
 *     sourceId: 'enroll-789',
 *     actionLabel: 'Ver Matrícula',
 *     actionUrl: '/admin/operacional/matriculas',
 * });
 * 
 * // Broadcast to multiple staff
 * await sendNotification({
 *     orgId: 'org-123',
 *     recipients: ['admin-1', 'admin-2'],
 *     title: 'Contrato Assinado',
 *     message: 'Contrato MAT-202602-ABC123 foi assinado digitalmente',
 *     icon: 'file-text',
 *     color: 'violet',
 *     category: 'contract',
 *     priority: 'high',
 * });
 */
export async function sendNotification(payload: NotificationPayload): Promise<string[]> {
    const {
        orgId,
        recipients,
        title,
        message,
        icon = 'bell',
        color = 'blue',
        category = 'general',
        priority = 'normal',
        sourceType,
        sourceId,
        sourceUrl,
        actionLabel,
        actionUrl,
        expiresInHours,
    } = payload;

    if (!recipients.length || !title || !message) {
        console.warn('[Notifications] Missing required fields:', { recipients: recipients.length, title: !!title, message: !!message });
        return [];
    }

    // Ensure table exists
    await ensureTable();

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = expiresInHours ? now + (expiresInHours * 3600) : null;
    const createdIds: string[] = [];

    for (const recipientId of recipients) {
        const id = crypto.randomUUID();

        try {
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
                    ${title}, ${message}, ${icon}, ${color},
                    ${category}, ${priority},
                    ${sourceType || null}, ${sourceId || null}, ${sourceUrl || null},
                    ${actionLabel || null}, ${actionUrl || null},
                    ${now}, ${expiresAt}
                )
            `);
            createdIds.push(id);
        } catch (error) {
            console.error(`[Notifications] Failed to create notification for ${recipientId}:`, error);
        }
    }

    return createdIds;
}

/**
 * Find staff members to notify from an organization.
 * Prioritizes: owner > admin > coordinator > teacher > staff
 */
export async function findStaffToNotify(
    orgId: string,
    excludePersonId?: string,
    limit: number = 2,
): Promise<string[]> {
    const result = await db.all(sql`
        SELECT person_id FROM organization_memberships
        WHERE organization_id = ${orgId}
          AND status = 'active'
          ${excludePersonId ? sql`AND person_id != ${excludePersonId}` : sql``}
        ORDER BY
            CASE 
                WHEN role = 'owner' THEN 1
                WHEN role = 'admin' THEN 2
                WHEN role = 'coordinator' THEN 3
                WHEN role = 'teacher' THEN 4
                ELSE 5
            END
        LIMIT ${limit}
    `) as any[];

    return result.map(r => r.person_id);
}

// ============================================================================
// PREDEFINED NOTIFICATION TEMPLATES
// These create standardized notifications for common events
// ============================================================================

export const NotificationTemplates = {
    /**
     * New enrollment created
     */
    enrollment: (orgId: string, recipients: string[], studentName: string, className: string, enrollmentId: string) =>
        sendNotification({
            orgId,
            recipients,
            title: '📚 Nova Matrícula',
            message: `${studentName} foi matriculado(a) na turma ${className}`,
            icon: 'school',
            color: 'green',
            category: 'enrollment',
            priority: 'normal',
            sourceType: 'enrollment',
            sourceId: enrollmentId,
            actionLabel: 'Ver Matrícula',
            actionUrl: '/admin/operacional/matriculas',
        }),

    /**
     * Contract generated and pending signature
     */
    contractGenerated: (orgId: string, recipients: string[], contractNumber: string, signerName: string, contractId: string) =>
        sendNotification({
            orgId,
            recipients,
            title: '📄 Contrato Gerado',
            message: `Contrato ${contractNumber} gerado para ${signerName}. Aguardando assinatura.`,
            icon: 'file-text',
            color: 'violet',
            category: 'contract',
            priority: 'normal',
            sourceType: 'contract',
            sourceId: contractId,
            actionLabel: 'Ver Contrato',
            actionUrl: '/admin/operacional/contratos',
        }),

    /**
     * Contract signed
     */
    contractSigned: (orgId: string, recipients: string[], contractNumber: string, signerName: string) =>
        sendNotification({
            orgId,
            recipients,
            title: '✅ Contrato Assinado',
            message: `${signerName} assinou o contrato ${contractNumber}`,
            icon: 'check',
            color: 'green',
            category: 'contract',
            priority: 'high',
        }),

    /**
     * Invoice overdue
     */
    invoiceOverdue: (orgId: string, recipients: string[], payerName: string, dueDate: string, amount: string) =>
        sendNotification({
            orgId,
            recipients,
            title: '⚠️ Fatura Vencida',
            message: `Fatura de ${payerName} (${amount}) venceu em ${dueDate}`,
            icon: 'alert-triangle',
            color: 'red',
            category: 'payment',
            priority: 'high',
        }),

    /**
     * Payment received
     */
    paymentReceived: (orgId: string, recipients: string[], payerName: string, amount: string) =>
        sendNotification({
            orgId,
            recipients,
            title: '💰 Pagamento Recebido',
            message: `Pagamento de ${amount} recebido de ${payerName}`,
            icon: 'currency-dollar',
            color: 'green',
            category: 'payment',
            priority: 'low',
        }),

    /**
     * Lead converted to student
     */
    leadConverted: (orgId: string, recipients: string[], leadName: string) =>
        sendNotification({
            orgId,
            recipients,
            title: '🎯 Lead Convertido',
            message: `${leadName} foi convertido(a) em aluno(a)!`,
            icon: 'target-arrow',
            color: 'teal',
            category: 'lead',
            priority: 'normal',
        }),

    /**
     * Contract expiring soon
     */
    contractExpiring: (orgId: string, recipients: string[], studentName: string, daysLeft: number, contractId: string) =>
        sendNotification({
            orgId,
            recipients,
            title: '⏰ Contrato Vencendo',
            message: `Contrato de ${studentName} vence em ${daysLeft} dias`,
            icon: 'clock',
            color: 'orange',
            category: 'contract',
            priority: daysLeft <= 7 ? 'high' : 'normal',
            sourceType: 'contract',
            sourceId: contractId,
            actionLabel: 'Ver Contrato',
            actionUrl: '/admin/operacional/contratos',
        }),
};

// ============================================================================
// INTERNAL
// ============================================================================

let tableEnsured = false;

async function ensureTable() {
    if (tableEnsured) return;

    try {
        await db.run(sql`
            CREATE TABLE IF NOT EXISTS ${sql.raw(NOTIFICATION_TABLE)} (
                id TEXT PRIMARY KEY,
                organization_id TEXT NOT NULL,
                recipient_id TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                icon TEXT DEFAULT 'bell',
                color TEXT DEFAULT 'blue',
                category TEXT NOT NULL DEFAULT 'general',
                priority TEXT NOT NULL DEFAULT 'normal',
                source_type TEXT,
                source_id TEXT,
                source_url TEXT,
                action_label TEXT,
                action_url TEXT,
                is_read INTEGER DEFAULT 0,
                read_at INTEGER,
                is_archived INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (unixepoch()),
                expires_at INTEGER
            )
        `);
        await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notif_recipient ON ${sql.raw(NOTIFICATION_TABLE)} (recipient_id, is_read, created_at)`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notif_org ON ${sql.raw(NOTIFICATION_TABLE)} (organization_id, category)`);
        tableEnsured = true;
    } catch (error) {
        console.error('[Notifications] Failed to ensure table:', error);
    }
}
