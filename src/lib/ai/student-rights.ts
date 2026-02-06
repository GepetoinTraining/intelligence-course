/**
 * Student Rights & Encryption System
 * 
 * LGPD-compliant implementation of student data rights:
 * - Right of Access (view all stored data)
 * - Right of Rectification (correct inaccuracies)
 * - Right of Deletion (remove memories with safety limits)
 * - Right of Portability (export in open format)
 * - Right of Negotiation (agreements on remembering)
 * 
 * Data Domain Separation:
 * - INSTITUTIONAL: grades, attendance - teachers/parents access
 * - RELATIONAL: memories, conversations - student-only decrypt
 * - SUPERVISION: metadata, alerts - auditor access
 */

import { z } from 'zod';

// ============================================================================
// DATA DOMAINS
// ============================================================================

export const DataDomainSchema = z.enum([
    'institutional',  // Grades, attendance - teachers/parents can access
    'relational',     // Memories, conversations - student-only decrypt
    'supervision',    // Metadata, alerts - auditor access only
]);

export type DataDomain = z.infer<typeof DataDomainSchema>;

// ============================================================================
// ENCRYPTION SCHEMAS
// ============================================================================

export const EncryptedPayloadSchema = z.object({
    ciphertext: z.string(),  // Base64-encoded encrypted data
    iv: z.string(),          // Initialization vector (Base64)
    salt: z.string(),        // Key derivation salt (Base64)
    version: z.number().int().default(1),
    algorithm: z.string().default('AES-GCM'),
    keyDerivation: z.string().default('PBKDF2'),
});

export type EncryptedPayload = z.infer<typeof EncryptedPayloadSchema>;

export const KeyDerivationConfigSchema = z.object({
    iterations: z.number().int().min(100000).default(250000),
    keyLength: z.number().int().default(256),
    hashAlgorithm: z.string().default('SHA-256'),
});

export type KeyDerivationConfig = z.infer<typeof KeyDerivationConfigSchema>;

// ============================================================================
// STUDENT RIGHTS SCHEMAS
// ============================================================================

export const DataAccessRequestSchema = z.object({
    studentId: z.string().uuid(),
    requestedAt: z.date(),
    domain: DataDomainSchema.optional(),  // If undefined, all domains
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
    includeMetadata: z.boolean().default(true),
    verificationMethod: z.enum(['password', 'otp', 'presential']),
});

export type DataAccessRequest = z.infer<typeof DataAccessRequestSchema>;

export const DataExportSchema = z.object({
    studentId: z.string().uuid(),
    exportedAt: z.date(),
    format: z.enum(['json', 'csv', 'pdf']),
    domains: z.array(DataDomainSchema),

    // Summary
    summary: z.object({
        totalNodes: z.number().int(),
        totalEdges: z.number().int(),
        totalLedgerEntries: z.number().int(),
        totalSessions: z.number().int(),
        dateRange: z.object({
            from: z.date(),
            to: z.date(),
        }),
    }),

    // Data (structured for portability)
    data: z.object({
        memories: z.array(z.object({
            id: z.string(),
            type: z.string(),
            content: z.string(),
            summary: z.string().optional(),
            createdAt: z.date(),
            privacyLevel: z.string(),
        })),
        ledger: z.array(z.object({
            id: z.string(),
            category: z.string(),
            title: z.string(),
            summary: z.string(),
            occurredAt: z.date(),
        })),
        preferences: z.record(z.string(), z.unknown()).optional(),
    }),

    // Integrity
    checksum: z.string(),
});

export type DataExport = z.infer<typeof DataExportSchema>;

export const DeletionRequestSchema = z.object({
    studentId: z.string().uuid(),
    requestedAt: z.date(),
    scope: z.enum([
        'specific_nodes',     // Delete specific memory nodes
        'time_range',         // Delete memories in date range
        'category',           // Delete by category
        'full_relational',    // Delete all relational data
        'full_account',       // Delete everything (account closure)
    ]),

    // Scope-specific parameters
    nodeIds: z.array(z.string()).optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    categories: z.array(z.string()).optional(),

    // Verification
    verificationMethod: z.enum(['password', 'otp', 'presential']),
    acknowledged: z.boolean(),  // Student acknowledged consequences

    // Safety
    retainAuditLog: z.boolean().default(true),  // Keep anonymized audit trail
    cooldownPeriod: z.number().int().default(72),  // Hours before execution
});

export type DeletionRequest = z.infer<typeof DeletionRequestSchema>;

export const RememberingAgreementSchema = z.object({
    studentId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),

    // What the AI can remember
    preferences: z.object({
        rememberFacts: z.boolean().default(true),
        rememberPreferences: z.boolean().default(true),
        rememberGoals: z.boolean().default(true),
        rememberEmotions: z.boolean().default(true),
        rememberRelationships: z.boolean().default(true),
        rememberConfessions: z.boolean().default(false),  // Opt-in
        rememberAcademic: z.boolean().default(true),
    }),

    // Retention policies
    retention: z.object({
        autoDeleteAfterDays: z.number().int().optional(),  // Auto-cleanup
        keepLedgerForever: z.boolean().default(true),      // Important moments
        compressionLevel: z.enum(['aggressive', 'normal', 'minimal']).default('normal'),
    }),

    // Sharing
    sharing: z.object({
        shareWithParents: z.enum(['nothing', 'summary', 'partial', 'full']).default('summary'),
        shareWithTeachers: z.enum(['nothing', 'academic', 'wellbeing']).default('academic'),
        shareWithCounselors: z.enum(['nothing', 'summary', 'full']).default('summary'),
    }),

    // Consent
    consentVersion: z.string(),
    parentConsentRequired: z.boolean().default(true),  // For minors
    parentConsentGiven: z.boolean().default(false),
});

export type RememberingAgreement = z.infer<typeof RememberingAgreementSchema>;

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

const DEFAULT_KDF_CONFIG: KeyDerivationConfig = {
    iterations: 250000,
    keyLength: 256,
    hashAlgorithm: 'SHA-256',
};

/**
 * Derive encryption key from password + salt
 */
export async function deriveKey(
    password: string,
    salt: Uint8Array,
    config: KeyDerivationConfig = DEFAULT_KDF_CONFIG
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: config.iterations,
            hash: config.hashAlgorithm,
        },
        keyMaterial,
        { name: 'AES-GCM', length: config.keyLength },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Generate combined key from student password + institutional salt
 */
export async function generateStudentKey(
    studentPassword: string,
    institutionalSalt: string
): Promise<{ key: CryptoKey; salt: string }> {
    // Combine institutional salt with random component for extra security
    const randomSalt = crypto.getRandomValues(new Uint8Array(16));
    const combinedSalt = new Uint8Array([
        ...new TextEncoder().encode(institutionalSalt),
        ...randomSalt,
    ]);

    const key = await deriveKey(studentPassword, combinedSalt);

    return {
        key,
        salt: arrayBufferToBase64(randomSalt),
    };
}

/**
 * Encrypt content for relational domain
 */
export async function encryptRelationalData(
    plaintext: string,
    password: string,
    institutionalSalt: string
): Promise<EncryptedPayload> {
    const { key, salt } = await generateStudentKey(password, institutionalSalt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(plaintext)
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv),
        salt,
        version: 1,
        algorithm: 'AES-GCM',
        keyDerivation: 'PBKDF2',
    };
}

/**
 * Decrypt relational domain content
 */
export async function decryptRelationalData(
    payload: EncryptedPayload,
    password: string,
    institutionalSalt: string
): Promise<string> {
    const combinedSalt = new Uint8Array([
        ...new TextEncoder().encode(institutionalSalt),
        ...base64ToArrayBuffer(payload.salt),
    ]);

    const key = await deriveKey(password, combinedSalt);
    const iv = base64ToArrayBuffer(payload.iv);
    const ciphertext = base64ToArrayBuffer(payload.ciphertext);

    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        key,
        ciphertext.buffer as ArrayBuffer
    );

    return new TextDecoder().decode(plaintext);
}

// ============================================================================
// STUDENT RIGHTS IMPLEMENTATION
// ============================================================================

/**
 * Right of Access - Generate complete data export
 */
export async function exerciseRightOfAccess(
    request: DataAccessRequest,
    password: string,
    institutionalSalt: string
): Promise<DataExport> {
    console.log(`📂 Generating data export for ${request.studentId.substring(0, 8)}...`);

    // In production, this would:
    // 1. Verify identity through the specified method
    // 2. Fetch all data from database
    // 3. Decrypt relational domain data
    // 4. Format according to requested format

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const exportData: DataExport = {
        studentId: request.studentId,
        exportedAt: now,
        format: request.format,
        domains: request.domain ? [request.domain] : ['institutional', 'relational', 'supervision'],
        summary: {
            totalNodes: 0,
            totalEdges: 0,
            totalLedgerEntries: 0,
            totalSessions: 0,
            dateRange: {
                from: thirtyDaysAgo,
                to: now,
            },
        },
        data: {
            memories: [],
            ledger: [],
            preferences: {},
        },
        checksum: '',
    };

    // Calculate checksum for integrity
    exportData.checksum = await calculateChecksum(JSON.stringify(exportData.data));

    return exportData;
}

/**
 * Right of Rectification - Correct inaccuracies in stored data
 */
export async function exerciseRightOfRectification(
    studentId: string,
    nodeId: string,
    correction: {
        field: string;
        oldValue: any;
        newValue: any;
        reason: string;
    },
    password: string
): Promise<{ success: boolean; auditId: string }> {
    console.log(`✏️ Rectification request for node ${nodeId}`);

    // In production, this would:
    // 1. Verify student identity
    // 2. Validate the correction is for their data
    // 3. Create audit trail of the change
    // 4. Apply the correction
    // 5. Re-encrypt if in relational domain

    return {
        success: true,
        auditId: crypto.randomUUID(),
    };
}

/**
 * Right of Deletion - Remove memories with safety limits
 */
export async function exerciseRightOfDeletion(
    request: DeletionRequest,
    password: string
): Promise<{
    success: boolean;
    deletedNodes: number;
    retainedForSafety: number;
    scheduledAt: Date;
}> {
    console.log(`🗑️ Deletion request: ${request.scope} for ${request.studentId.substring(0, 8)}...`);

    // Safety checks
    const safetyLimits = await checkDeletionSafety(request);

    if (!safetyLimits.canProceed) {
        throw new Error(`Deletion blocked: ${safetyLimits.reason}`);
    }

    // Calculate scheduled execution (after cooldown)
    const scheduledAt = new Date(
        Date.now() + request.cooldownPeriod * 60 * 60 * 1000
    );

    // In production, this would:
    // 1. Queue deletion for after cooldown period
    // 2. Notify student of scheduled deletion
    // 3. Allow cancellation during cooldown
    // 4. Execute deletion after cooldown
    // 5. Retain anonymized audit log if requested

    return {
        success: true,
        deletedNodes: 0, // Will be updated after execution
        retainedForSafety: safetyLimits.retainedCount,
        scheduledAt,
    };
}

/**
 * Check safety limits before deletion
 */
async function checkDeletionSafety(request: DeletionRequest): Promise<{
    canProceed: boolean;
    reason?: string;
    retainedCount: number;
}> {
    // Safety rules:
    // 1. Cannot delete during active escalation (orange/red)
    // 2. Cannot delete data that's evidence of abuse/crisis
    // 3. Must retain anonymized audit trail
    // 4. Cooldown period is mandatory

    // Check for active escalation (would query auditor)
    const hasActiveEscalation = false; // Would check auditor

    if (hasActiveEscalation && request.scope !== 'specific_nodes') {
        return {
            canProceed: false,
            reason: 'Active wellbeing concern - please contact support',
            retainedCount: 0,
        };
    }

    return {
        canProceed: true,
        retainedCount: 0,
    };
}

/**
 * Right of Portability - Export in open format
 */
export async function exerciseRightOfPortability(
    studentId: string,
    format: 'json' | 'csv' | 'pdf',
    password: string,
    institutionalSalt: string
): Promise<{
    downloadUrl: string;
    expiresAt: Date;
    checksum: string;
}> {
    console.log(`📤 Generating portable export for ${studentId.substring(0, 8)}...`);

    // Generate export using Right of Access
    const exportData = await exerciseRightOfAccess(
        {
            studentId,
            requestedAt: new Date(),
            format,
            includeMetadata: true,
            verificationMethod: 'password',
        },
        password,
        institutionalSalt
    );

    // In production, this would:
    // 1. Convert to requested format
    // 2. Store temporarily with signed URL
    // 3. Notify student of download availability

    return {
        downloadUrl: `/api/student/exports/${exportData.checksum}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        checksum: exportData.checksum,
    };
}

/**
 * Right of Negotiation - Get/Update remembering agreement
 */
export async function getRememberingAgreement(
    studentId: string
): Promise<RememberingAgreement | null> {
    // In production, fetch from database
    return null;
}

export async function updateRememberingAgreement(
    studentId: string,
    updates: Partial<RememberingAgreement['preferences']>,
    password: string
): Promise<RememberingAgreement> {
    console.log(`📝 Updating remembering agreement for ${studentId.substring(0, 8)}...`);

    const existing = await getRememberingAgreement(studentId);

    const agreement: RememberingAgreement = {
        studentId,
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date(),
        preferences: {
            rememberFacts: updates.rememberFacts ?? existing?.preferences.rememberFacts ?? true,
            rememberPreferences: updates.rememberPreferences ?? existing?.preferences.rememberPreferences ?? true,
            rememberGoals: updates.rememberGoals ?? existing?.preferences.rememberGoals ?? true,
            rememberEmotions: updates.rememberEmotions ?? existing?.preferences.rememberEmotions ?? true,
            rememberRelationships: updates.rememberRelationships ?? existing?.preferences.rememberRelationships ?? true,
            rememberConfessions: updates.rememberConfessions ?? existing?.preferences.rememberConfessions ?? false,
            rememberAcademic: updates.rememberAcademic ?? existing?.preferences.rememberAcademic ?? true,
        },
        retention: existing?.retention ?? {
            autoDeleteAfterDays: undefined,
            keepLedgerForever: true,
            compressionLevel: 'normal',
        },
        sharing: existing?.sharing ?? {
            shareWithParents: 'summary',
            shareWithTeachers: 'academic',
            shareWithCounselors: 'summary',
        },
        consentVersion: '1.0',
        parentConsentRequired: true,
        parentConsentGiven: existing?.parentConsentGiven ?? false,
    };

    // In production, persist to database

    return agreement;
}

// ============================================================================
// RECOVERY SYSTEM
// ============================================================================

export interface RecoveryRequest {
    studentId: string;
    method: 'presential' | 'guardian' | 'institutional';
    requestedAt: Date;
    verifiedBy?: string;
    verificationDetails?: string;
}

/**
 * Initiate key recovery process (for presential verification)
 */
export async function initiateKeyRecovery(
    studentId: string,
    method: RecoveryRequest['method']
): Promise<{
    recoveryId: string;
    instructions: string[];
    expiresAt: Date;
}> {
    console.log(`🔑 Key recovery initiated for ${studentId.substring(0, 8)}...`);

    const recoveryId = crypto.randomUUID();

    const instructions = {
        presential: [
            '1. Compareça à secretaria da escola com documento de identidade',
            '2. Solicite o formulário de recuperação de acesso',
            '3. Apresente o código de recuperação: ' + recoveryId.substring(0, 8).toUpperCase(),
            '4. Aguarde verificação de identidade presencial',
            '5. Uma nova senha será gerada e entregue em envelope lacrado',
        ],
        guardian: [
            '1. O responsável legal deve comparecer à escola',
            '2. Apresentar documento de identidade e comprovante de guarda',
            '3. Assinar termo de responsabilidade',
            '4. O estudante deve estar presente para confirmação',
        ],
        institutional: [
            '1. Processo iniciado automaticamente',
            '2. Coordenação pedagógica será notificada',
            '3. Verificação de identidade por múltiplos fatores',
            '4. Nova senha enviada por canal seguro verificado',
        ],
    };

    return {
        recoveryId,
        instructions: instructions[method],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
}

/**
 * Complete key recovery after verification
 */
export async function completeKeyRecovery(
    recoveryId: string,
    verifiedBy: string,
    newPassword: string,
    institutionalSalt: string
): Promise<{
    success: boolean;
    newKeyGenerated: boolean;
}> {
    console.log(`✅ Completing key recovery ${recoveryId.substring(0, 8)}...`);

    // In production:
    // 1. Verify recovery request exists and is not expired
    // 2. Verify the verifier has appropriate permissions
    // 3. Generate new encryption key with new password
    // 4. Re-encrypt all relational domain data
    // 5. Invalidate old key
    // 6. Create audit entry

    return {
        success: true,
        newKeyGenerated: true,
    };
}

// ============================================================================
// DOMAIN ACCESS CONTROL
// ============================================================================

export interface AccessContext {
    requesterId: string;
    requesterRole: 'student' | 'parent' | 'teacher' | 'coordinator' | 'counselor' | 'auditor' | 'admin';
    targetStudentId: string;
    relationship?: 'self' | 'parent' | 'teacher' | 'none';
}

/**
 * Check if requester can access data in a specific domain
 */
export function canAccessDomain(context: AccessContext, domain: DataDomain): boolean {
    const { requesterRole, relationship } = context;

    switch (domain) {
        case 'institutional':
            // Teachers, parents, coordinators, admins can access
            return ['teacher', 'parent', 'coordinator', 'admin', 'student'].includes(requesterRole);

        case 'relational':
            // ONLY the student themselves can access
            return relationship === 'self';

        case 'supervision':
            // Auditor, coordinators, counselors can access metadata
            return ['auditor', 'coordinator', 'counselor', 'admin'].includes(requesterRole);

        default:
            return false;
    }
}

/**
 * Filter data based on domain access
 */
export function filterByDomainAccess<T extends { domain?: DataDomain }>(
    data: T[],
    context: AccessContext
): T[] {
    return data.filter(item => {
        const domain = item.domain || 'institutional';
        return canAccessDomain(context, domain);
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return arrayBufferToBase64(buffer);
}

// ============================================================================
// CONSENT MANAGEMENT
// ============================================================================

export interface ConsentRecord {
    studentId: string;
    parentId?: string;
    consentType: 'initial' | 'update' | 'withdrawal';
    version: string;
    grantedAt: Date;
    expiresAt?: Date;
    scope: string[];
    signature?: string;
}

/**
 * Record consent for minor students (requires parent)
 */
export async function recordParentConsent(
    studentId: string,
    parentId: string,
    scope: string[],
    signature: string
): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
        studentId,
        parentId,
        consentType: 'initial',
        version: '1.0',
        grantedAt: new Date(),
        scope,
        signature,
    };

    console.log(`📋 Parent consent recorded for ${studentId.substring(0, 8)}...`);

    // In production, persist to database

    return consent;
}

/**
 * Check if student has valid consent
 */
export async function hasValidConsent(studentId: string): Promise<{
    hasConsent: boolean;
    parentConsentRequired: boolean;
    parentConsentGiven: boolean;
    consentVersion: string;
}> {
    // In production, query database

    return {
        hasConsent: true,
        parentConsentRequired: true,
        parentConsentGiven: false,
        consentVersion: '1.0',
    };
}

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

export const StudentRights = {
    // Right of Access
    exerciseRightOfAccess,

    // Right of Rectification
    exerciseRightOfRectification,

    // Right of Deletion
    exerciseRightOfDeletion,

    // Right of Portability
    exerciseRightOfPortability,

    // Right of Negotiation
    getRememberingAgreement,
    updateRememberingAgreement,
};

export const Encryption = {
    deriveKey,
    generateStudentKey,
    encryptRelationalData,
    decryptRelationalData,
};

export const Recovery = {
    initiateKeyRecovery,
    completeKeyRecovery,
};

export const DomainAccess = {
    canAccessDomain,
    filterByDomainAccess,
};

export const Consent = {
    recordParentConsent,
    hasValidConsent,
};

