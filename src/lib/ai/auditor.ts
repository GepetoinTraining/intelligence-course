/**
 * AI Auditor System - Ethics Policy Implementation
 * 
 * CRITICAL: This is an "outsider" AI that monitors metadata ONLY, never content.
 * 
 * Purpose:
 * - Monitor student wellbeing through anonymized metadata patterns
 * - Detect early warning signs of distress
 * - Escalate concerns through appropriate channels
 * - Maintain audit trail for accountability
 * 
 * Privacy Boundary:
 * The auditor NEVER accesses:
 * - Raw conversation content
 * - Memory node content
 * - Ledger entry summaries
 * - Confession details
 * 
 * The auditor ONLY sees:
 * - Session timestamps and durations
 * - Emotional indicator scores (aggregated, not content)
 * - Usage frequency patterns
 * - Node/edge counts (not content)
 * - System events (not content)
 */

import { z } from 'zod';

// NOTE: Database imports are available for future persistence
// For now, the auditor uses in-memory audit chain
// import { db } from '@/lib/db';
// import { memoryGraphs, memoryNodes, memoryLedger, users } from '@/lib/db/schema';

// ============================================================================
// ESCALATION LEVELS
// ============================================================================

export const EscalationLevelSchema = z.enum([
    'green',   // 🟢 Normal - Standard parent reports
    'yellow',  // 🟡 Attention - Notify parents + coordinators
    'orange',  // 🟠 Concern - Schedule meeting, suggest professional support
    'red',     // 🔴 Imminent - Immediate contact, ECA if required
]);

export type EscalationLevel = z.infer<typeof EscalationLevelSchema>;

// ============================================================================
// SCHEMAS
// ============================================================================

export const SessionMetadataSchema = z.object({
    sessionId: z.string().uuid(),
    studentId: z.string().uuid(),
    startedAt: z.date(),
    endedAt: z.date().optional(),
    durationMinutes: z.number().min(0),
    messageCount: z.number().int().min(0),

    // Emotional metadata (aggregated scores, no content)
    emotionalValence: z.number().min(-1).max(1).optional(), // -1=negative, 1=positive
    emotionalArousal: z.number().min(0).max(1).optional(),   // 0=calm, 1=excited
    emotionalStability: z.number().min(0).max(1).optional(), // consistency

    // Topic categories (not content, just categories)
    topicCategories: z.array(z.string()).optional(),

    // Warning flags (binary, no details)
    containsSensitiveContent: z.boolean().default(false),
    containsDistressIndicators: z.boolean().default(false),
});

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>;

export const RiskIndicatorSchema = z.object({
    category: z.enum([
        'emotional_distress',    // Severe emotional indicators
        'self_harm',             // Self-harm or suicidal signals
        'abuse_neglect',         // Signs of abuse or neglect
        'manipulation',          // System manipulation attempts
        'isolation',             // Social isolation patterns
        'academic_crisis',       // Sudden academic decline
        'behavioral_change',     // Rapid behavioral changes
    ]),
    severity: z.number().min(0).max(10),
    confidence: z.number().min(0).max(1),
    detectedAt: z.date(),
    patternDescription: z.string(), // Generic description, no content
    evidenceCount: z.number().int(), // How many data points
});

export type RiskIndicator = z.infer<typeof RiskIndicatorSchema>;

export const WellbeingReportSchema = z.object({
    studentId: z.string().uuid(),
    generatedAt: z.date(),
    periodStart: z.date(),
    periodEnd: z.date(),

    // Current status
    escalationLevel: EscalationLevelSchema,

    // Aggregated metrics (privacy-preserving)
    metrics: z.object({
        totalSessions: z.number().int(),
        avgSessionDuration: z.number(),
        avgMessagesPerSession: z.number(),
        avgEmotionalValence: z.number(),
        engagementTrend: z.enum(['increasing', 'stable', 'decreasing']),
        emotionalTrend: z.enum(['improving', 'stable', 'declining', 'volatile']),
    }),

    // Risk indicators (if any)
    riskIndicators: z.array(RiskIndicatorSchema),

    // Recommendations
    recommendations: z.array(z.string()),

    // Actions taken
    actionsTaken: z.array(z.object({
        action: z.string(),
        takenAt: z.date(),
        takenBy: z.string(),
    })),
});

export type WellbeingReport = z.infer<typeof WellbeingReportSchema>;

export const AuditEntrySchema = z.object({
    id: z.string().uuid(),
    timestamp: z.date(),
    studentId: z.string().uuid(),

    // Event type
    eventType: z.enum([
        'session_started',
        'session_ended',
        'risk_detected',
        'escalation_triggered',
        'parent_notified',
        'coordinator_notified',
        'professional_referred',
        'integrity_check',
        'report_generated',
        'data_accessed',
    ]),

    // Metadata (never content)
    metadata: z.record(z.string(), z.unknown()),

    // Integrity
    hash: z.string(),
    previousHash: z.string().optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

// ============================================================================
// RISK DETECTION PATTERNS
// ============================================================================

interface RiskPattern {
    category: RiskIndicator['category'];
    name: string;
    description: string;
    detect: (metadata: StudentMetrics) => { detected: boolean; severity: number; confidence: number; evidence: string };
}

interface StudentMetrics {
    recentSessions: SessionMetadata[];
    totalSessions: number;
    avgValence: number;
    avgArousal: number;
    sessionsWithDistress: number;
    sessionFrequency: number; // per week
    lastSessionDaysAgo: number;
    emotionalVolatility: number;
    longestGap: number; // days between sessions
}

const RISK_PATTERNS: RiskPattern[] = [
    {
        category: 'emotional_distress',
        name: 'Persistent Negative Affect',
        description: 'Consistently negative emotional indicators across multiple sessions',
        detect: (m) => {
            const negativeSessions = m.recentSessions.filter(s => (s.emotionalValence ?? 0) < -0.3).length;
            const ratio = m.recentSessions.length > 0 ? negativeSessions / m.recentSessions.length : 0;
            return {
                detected: ratio > 0.6 && m.recentSessions.length >= 3,
                severity: Math.min(ratio * 10, 10),
                confidence: Math.min(m.recentSessions.length / 10, 1),
                evidence: `${negativeSessions}/${m.recentSessions.length} sessions with negative emotional indicators`,
            };
        },
    },
    {
        category: 'emotional_distress',
        name: 'Emotional Volatility',
        description: 'Rapid swings in emotional indicators',
        detect: (m) => {
            return {
                detected: m.emotionalVolatility > 0.7 && m.recentSessions.length >= 5,
                severity: m.emotionalVolatility * 8,
                confidence: Math.min(m.recentSessions.length / 10, 1),
                evidence: `Emotional stability score: ${(1 - m.emotionalVolatility).toFixed(2)}`,
            };
        },
    },
    {
        category: 'self_harm',
        name: 'Distress Flag Frequency',
        description: 'Multiple sessions flagged with distress indicators',
        detect: (m) => {
            const ratio = m.recentSessions.length > 0 ? m.sessionsWithDistress / m.recentSessions.length : 0;
            return {
                detected: m.sessionsWithDistress >= 2 && ratio > 0.3,
                severity: Math.min(m.sessionsWithDistress * 3, 10),
                confidence: Math.min(m.sessionsWithDistress / 5, 1),
                evidence: `${m.sessionsWithDistress} sessions with distress indicators in recent period`,
            };
        },
    },
    {
        category: 'isolation',
        name: 'Engagement Dropout',
        description: 'Sudden cessation of engagement after regular use',
        detect: (m) => {
            const wasActive = m.totalSessions > 10 && m.sessionFrequency > 2;
            const suddenStop = m.lastSessionDaysAgo > 14 && m.longestGap > 21;
            return {
                detected: wasActive && suddenStop,
                severity: Math.min(m.lastSessionDaysAgo / 3, 10),
                confidence: wasActive ? 0.8 : 0.3,
                evidence: `No sessions for ${m.lastSessionDaysAgo} days after regular engagement`,
            };
        },
    },
    {
        category: 'isolation',
        name: 'Session Duration Decline',
        description: 'Progressive shortening of sessions',
        detect: (m) => {
            if (m.recentSessions.length < 5) return { detected: false, severity: 0, confidence: 0, evidence: '' };

            const first = m.recentSessions.slice(0, 3);
            const last = m.recentSessions.slice(-3);
            const firstAvg = first.reduce((s, a) => s + a.durationMinutes, 0) / first.length;
            const lastAvg = last.reduce((s, a) => s + a.durationMinutes, 0) / last.length;
            const decline = (firstAvg - lastAvg) / firstAvg;

            return {
                detected: decline > 0.5 && firstAvg > 10,
                severity: decline * 6,
                confidence: 0.6,
                evidence: `Session duration declined ${(decline * 100).toFixed(0)}% from ${firstAvg.toFixed(0)}min to ${lastAvg.toFixed(0)}min`,
            };
        },
    },
    {
        category: 'behavioral_change',
        name: '急 Activity Pattern Change',
        description: 'Sudden shift in usage patterns',
        detect: (m) => {
            // Check for unusual session times or durations
            const avgDuration = m.recentSessions.reduce((s, a) => s + a.durationMinutes, 0) / (m.recentSessions.length || 1);
            const recentLongSessions = m.recentSessions.filter(s => s.durationMinutes > avgDuration * 2).length;
            const ratio = m.recentSessions.length > 0 ? recentLongSessions / m.recentSessions.length : 0;

            return {
                detected: ratio > 0.4 && m.recentSessions.length >= 5,
                severity: ratio * 5,
                confidence: 0.5,
                evidence: `${recentLongSessions} unusually long sessions detected`,
            };
        },
    },
    {
        category: 'manipulation',
        name: 'Anomalous Access Patterns',
        description: 'Unusual system access patterns',
        detect: (m) => {
            // High frequency in short time
            const hourlyRate = m.recentSessions.length / (m.longestGap || 1) * 24;
            return {
                detected: hourlyRate > 10 && m.recentSessions.length > 20,
                severity: Math.min(hourlyRate, 10),
                confidence: 0.7,
                evidence: `Unusual access rate: ${hourlyRate.toFixed(1)} sessions per hour`,
            };
        },
    },
];

// ============================================================================
// AUDITOR CLASS
// ============================================================================

export class AIAuditor {
    private auditChain: string[] = [];

    constructor() {
        // Initialize audit chain with genesis hash
        this.auditChain = ['genesis-' + Date.now()];
    }

    // ========================================================================
    // SESSION METADATA COLLECTION
    // ========================================================================

    /**
     * Record session metadata (NEVER content)
     */
    async recordSessionMetadata(metadata: SessionMetadata): Promise<void> {
        // Validate - ensure no content sneaks in
        const validated = SessionMetadataSchema.parse(metadata);

        // Create audit entry
        await this.createAuditEntry(validated.studentId, 'session_ended', {
            sessionId: validated.sessionId,
            durationMinutes: validated.durationMinutes,
            messageCount: validated.messageCount,
            emotionalValence: validated.emotionalValence,
            containsDistress: validated.containsDistressIndicators,
        });

        console.log(`📊 Auditor: Recorded session metadata for ${validated.studentId.substring(0, 8)}...`);
    }

    /**
     * Extract session metadata from session object (strips content)
     */
    extractSessionMetadata(session: {
        id: string;
        studentId: string;
        startedAt: Date;
        endedAt?: Date;
        messageCount: number;
        emotionalProfile?: {
            dominant?: string;
            valence?: number;
            arousal?: number;
            stability?: number;
        };
        sensitiveContent?: boolean;
        topicsDiscussed?: string[];
    }): SessionMetadata {
        const endedAt = session.endedAt || new Date();

        return {
            sessionId: session.id,
            studentId: session.studentId,
            startedAt: session.startedAt,
            endedAt,
            durationMinutes: (endedAt.getTime() - session.startedAt.getTime()) / 60000,
            messageCount: session.messageCount,
            emotionalValence: session.emotionalProfile?.valence,
            emotionalArousal: session.emotionalProfile?.arousal,
            emotionalStability: session.emotionalProfile?.stability,
            topicCategories: session.topicsDiscussed?.map(t => this.categorize(t)),
            containsSensitiveContent: session.sensitiveContent ?? false,
            containsDistressIndicators: this.detectDistressFromProfile(session.emotionalProfile),
        };
    }

    private categorize(topic: string): string {
        // Map specific topics to generic categories (privacy)
        const categories: Record<string, string> = {
            'school': 'academic',
            'grades': 'academic',
            'homework': 'academic',
            'friends': 'social',
            'family': 'family',
            'parents': 'family',
            'sad': 'emotional',
            'happy': 'emotional',
            'angry': 'emotional',
            'goal': 'aspiration',
            'dream': 'aspiration',
            'fear': 'concern',
            'worry': 'concern',
        };

        const lower = topic.toLowerCase();
        for (const [key, cat] of Object.entries(categories)) {
            if (lower.includes(key)) return cat;
        }
        return 'general';
    }

    private detectDistressFromProfile(profile?: {
        valence?: number;
        arousal?: number;
        stability?: number;
    }): boolean {
        if (!profile) return false;

        // High arousal + very negative valence = distress
        const valence = profile.valence ?? 0;
        const arousal = profile.arousal ?? 0;
        const stability = profile.stability ?? 1;

        return (valence < -0.6 && arousal > 0.7) || stability < 0.3;
    }

    // ========================================================================
    // RISK DETECTION
    // ========================================================================

    /**
     * Analyze student for risk indicators (metadata only)
     */
    async analyzeStudentRisk(studentId: string): Promise<RiskIndicator[]> {
        const metrics = await this.getStudentMetrics(studentId);
        const indicators: RiskIndicator[] = [];

        for (const pattern of RISK_PATTERNS) {
            const result = pattern.detect(metrics);

            if (result.detected) {
                indicators.push({
                    category: pattern.category,
                    severity: result.severity,
                    confidence: result.confidence,
                    detectedAt: new Date(),
                    patternDescription: pattern.description,
                    evidenceCount: metrics.recentSessions.length,
                });

                // Log detection
                await this.createAuditEntry(studentId, 'risk_detected', {
                    pattern: pattern.name,
                    severity: result.severity,
                    confidence: result.confidence,
                });
            }
        }

        return indicators.sort((a, b) => b.severity - a.severity);
    }

    private async getStudentMetrics(studentId: string): Promise<StudentMetrics> {
        // Get recent sessions from database
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        // This would query the actual session data
        // For now, return mock metrics
        const recentSessions: SessionMetadata[] = [];

        // Calculate derived metrics
        let totalValence = 0;
        let totalArousal = 0;
        let valenceValues: number[] = [];
        let distressCount = 0;

        for (const s of recentSessions) {
            if (s.emotionalValence !== undefined) {
                totalValence += s.emotionalValence;
                valenceValues.push(s.emotionalValence);
            }
            if (s.emotionalArousal !== undefined) {
                totalArousal += s.emotionalArousal;
            }
            if (s.containsDistressIndicators) {
                distressCount++;
            }
        }

        const avgValence = recentSessions.length > 0 ? totalValence / recentSessions.length : 0;
        const avgArousal = recentSessions.length > 0 ? totalArousal / recentSessions.length : 0;

        // Calculate volatility (standard deviation of valence)
        const volatility = valenceValues.length > 1
            ? Math.sqrt(valenceValues.reduce((s, v) => s + Math.pow(v - avgValence, 2), 0) / valenceValues.length)
            : 0;

        // Calculate session frequency
        const daySpan = recentSessions.length > 1
            ? (recentSessions[0].startedAt.getTime() - recentSessions[recentSessions.length - 1].startedAt.getTime()) / (1000 * 60 * 60 * 24)
            : 0;
        const frequency = daySpan > 0 ? recentSessions.length / (daySpan / 7) : 0;

        // Last session days ago
        const lastSession = recentSessions[0]?.endedAt || recentSessions[0]?.startedAt;
        const lastDaysAgo = lastSession
            ? (Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24)
            : 999;

        // Longest gap
        let longestGap = 0;
        for (let i = 1; i < recentSessions.length; i++) {
            const gap = (recentSessions[i - 1].startedAt.getTime() - recentSessions[i].endedAt!.getTime()) / (1000 * 60 * 60 * 24);
            if (gap > longestGap) longestGap = gap;
        }

        return {
            recentSessions,
            totalSessions: recentSessions.length,
            avgValence,
            avgArousal,
            sessionsWithDistress: distressCount,
            sessionFrequency: frequency,
            lastSessionDaysAgo: lastDaysAgo,
            emotionalVolatility: volatility,
            longestGap,
        };
    }

    // ========================================================================
    // ESCALATION LOGIC
    // ========================================================================

    /**
     * Determine escalation level based on risk indicators
     */
    determineEscalation(indicators: RiskIndicator[]): {
        level: EscalationLevel;
        reason: string;
        actions: string[];
    } {
        if (indicators.length === 0) {
            return {
                level: 'green',
                reason: 'No risk indicators detected',
                actions: ['Standard monitoring continues'],
            };
        }

        const maxSeverity = Math.max(...indicators.map(i => i.severity));
        const hasSelfHarm = indicators.some(i => i.category === 'self_harm' && i.severity > 5);
        const hasAbuse = indicators.some(i => i.category === 'abuse_neglect' && i.severity > 5);
        const distressCount = indicators.filter(i => i.category === 'emotional_distress').length;

        // 🔴 RED: Imminent risk
        if (hasSelfHarm || (hasAbuse && maxSeverity > 7)) {
            return {
                level: 'red',
                reason: 'Critical risk indicators detected requiring immediate attention',
                actions: [
                    'Immediate contact with parents/guardians',
                    'Notify school coordinator',
                    'Prepare ECA notification if required',
                    'Document all available metadata',
                    'Enable enhanced monitoring',
                ],
            };
        }

        // 🟠 ORANGE: Significant concern
        if (maxSeverity > 6 || distressCount >= 3) {
            return {
                level: 'orange',
                reason: 'Significant wellbeing concerns detected',
                actions: [
                    'Schedule meeting with parents',
                    'Notify school psychologist/counselor',
                    'Suggest professional support resources',
                    'Increase monitoring frequency',
                    'Prepare intervention plan',
                ],
            };
        }

        // 🟡 YELLOW: Attention needed
        if (maxSeverity > 3 || indicators.length >= 2) {
            return {
                level: 'yellow',
                reason: 'Mild wellbeing indicators detected',
                actions: [
                    'Include in next parent communication',
                    'Notify relevant coordinators',
                    'Continue monitoring with elevated attention',
                    'Review in 7 days',
                ],
            };
        }

        // 🟢 GREEN: Normal
        return {
            level: 'green',
            reason: 'Minor indicators within normal range',
            actions: ['Continue standard monitoring'],
        };
    }

    // ========================================================================
    // WELLBEING REPORTS
    // ========================================================================

    /**
     * Generate wellbeing report for parents (privacy-preserved)
     */
    async generateWellbeingReport(
        studentId: string,
        periodDays: number = 30
    ): Promise<WellbeingReport> {
        const periodEnd = new Date();
        const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

        const metrics = await this.getStudentMetrics(studentId);
        const indicators = await this.analyzeStudentRisk(studentId);
        const escalation = this.determineEscalation(indicators);

        // Calculate trends
        const engagementTrend = this.calculateEngagementTrend(metrics);
        const emotionalTrend = this.calculateEmotionalTrend(metrics);

        // Generate recommendations
        const recommendations = this.generateRecommendations(escalation.level, indicators);

        const report: WellbeingReport = {
            studentId,
            generatedAt: new Date(),
            periodStart,
            periodEnd,
            escalationLevel: escalation.level,
            metrics: {
                totalSessions: metrics.totalSessions,
                avgSessionDuration: metrics.recentSessions.reduce((s, a) => s + a.durationMinutes, 0) / (metrics.recentSessions.length || 1),
                avgMessagesPerSession: metrics.recentSessions.reduce((s, a) => s + a.messageCount, 0) / (metrics.recentSessions.length || 1),
                avgEmotionalValence: metrics.avgValence,
                engagementTrend,
                emotionalTrend,
            },
            riskIndicators: indicators.map(i => ({
                ...i,
                // Remove specific evidence for parent report
                patternDescription: this.sanitizeForParent(i.patternDescription),
            })),
            recommendations,
            actionsTaken: [],
        };

        // Log report generation
        await this.createAuditEntry(studentId, 'report_generated', {
            periodDays,
            escalationLevel: escalation.level,
            indicatorCount: indicators.length,
        });

        return report;
    }

    private calculateEngagementTrend(metrics: StudentMetrics): 'increasing' | 'stable' | 'decreasing' {
        if (metrics.recentSessions.length < 5) return 'stable';

        const first = metrics.recentSessions.slice(-5);
        const last = metrics.recentSessions.slice(0, 5);

        const firstFreq = first.length;
        const lastFreq = last.length;

        if (lastFreq > firstFreq * 1.2) return 'increasing';
        if (lastFreq < firstFreq * 0.8) return 'decreasing';
        return 'stable';
    }

    private calculateEmotionalTrend(metrics: StudentMetrics): 'improving' | 'stable' | 'declining' | 'volatile' {
        if (metrics.emotionalVolatility > 0.6) return 'volatile';
        if (metrics.recentSessions.length < 5) return 'stable';

        const first = metrics.recentSessions.slice(-5);
        const last = metrics.recentSessions.slice(0, 5);

        const firstAvg = first.reduce((s, a) => s + (a.emotionalValence ?? 0), 0) / first.length;
        const lastAvg = last.reduce((s, a) => s + (a.emotionalValence ?? 0), 0) / last.length;

        if (lastAvg > firstAvg + 0.2) return 'improving';
        if (lastAvg < firstAvg - 0.2) return 'declining';
        return 'stable';
    }

    private generateRecommendations(level: EscalationLevel, indicators: RiskIndicator[]): string[] {
        const recommendations: string[] = [];

        if (level === 'green') {
            recommendations.push('Continue supporting your child\'s learning journey');
            recommendations.push('Regular check-ins about school and friends are beneficial');
        }

        if (level === 'yellow') {
            recommendations.push('Consider having more frequent conversations about feelings');
            recommendations.push('Monitor for changes in sleep, appetite, or social behavior');
        }

        if (level === 'orange') {
            recommendations.push('Schedule a meeting with the school counselor');
            recommendations.push('Consider professional support if patterns persist');
            recommendations.push('Ensure your child knows they can talk to you about anything');
        }

        if (level === 'red') {
            recommendations.push('URGENT: Contact the school immediately');
            recommendations.push('Consider immediate professional evaluation');
            recommendations.push('Do not leave your child unsupervised if safety is a concern');
        }

        // Add indicator-specific recommendations
        for (const indicator of indicators) {
            if (indicator.category === 'isolation' && indicator.severity > 4) {
                recommendations.push('Encourage social activities and connections with peers');
            }
            if (indicator.category === 'academic_crisis' && indicator.severity > 4) {
                recommendations.push('Review academic workload and consider tutoring support');
            }
        }

        return [...new Set(recommendations)]; // Dedupe
    }

    private sanitizeForParent(description: string): string {
        // Remove any specific details, keep generic
        return description
            .replace(/\d+ sessions/g, 'multiple sessions')
            .replace(/\d+\.\d+/g, '---')
            .replace(/\d+min/g, '---min');
    }

    // ========================================================================
    // MEMORY INTEGRITY
    // ========================================================================

    /**
     * Verify memory graph integrity
     */
    async verifyMemoryIntegrity(studentId: string): Promise<{
        isValid: boolean;
        issues: string[];
        lastVerified: Date;
    }> {
        const issues: string[] = [];

        // Check for gaps in audit trail
        const auditGaps = await this.checkAuditGaps(studentId);
        if (auditGaps.length > 0) {
            issues.push(`Found ${auditGaps.length} gaps in audit trail`);
        }

        // Check for hash chain integrity
        const chainValid = this.verifyAuditChain();
        if (!chainValid) {
            issues.push('Audit chain integrity verification failed');
        }

        // Log integrity check
        await this.createAuditEntry(studentId, 'integrity_check', {
            isValid: issues.length === 0,
            issueCount: issues.length,
        });

        return {
            isValid: issues.length === 0,
            issues,
            lastVerified: new Date(),
        };
    }

    private async checkAuditGaps(studentId: string): Promise<{ start: Date; end: Date }[]> {
        // Would query audit log for gaps
        return [];
    }

    private verifyAuditChain(): boolean {
        // Verify hash chain is unbroken
        // In production, this would verify cryptographic hashes
        return this.auditChain.length > 0;
    }

    // ========================================================================
    // AUDIT LOG
    // ========================================================================

    /**
     * Create immutable audit entry
     */
    async createAuditEntry(
        studentId: string,
        eventType: AuditEntry['eventType'],
        metadata: Record<string, unknown>
    ): Promise<void> {
        const previousHash = this.auditChain[this.auditChain.length - 1];

        const entry: AuditEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            studentId,
            eventType,
            metadata: {
                ...metadata,
                // Never include content
                _sanitized: true,
            },
            hash: await this.calculateHash(studentId, eventType, metadata, previousHash),
            previousHash,
        };

        // Add to chain
        this.auditChain.push(entry.hash);

        // In production, persist to immutable log
        console.log(`📝 Audit: ${eventType} for ${studentId.substring(0, 8)}...`);
    }

    private async calculateHash(
        studentId: string,
        eventType: string,
        metadata: Record<string, unknown>,
        previousHash: string
    ): Promise<string> {
        const data = JSON.stringify({ studentId, eventType, metadata, previousHash });

        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }

        // Fallback for non-browser environments
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // ========================================================================
    // NOTIFICATIONS
    // ========================================================================

    /**
     * Trigger escalation notification
     */
    async triggerEscalation(
        studentId: string,
        level: EscalationLevel,
        reason: string,
        recipients: ('parent' | 'coordinator' | 'psychologist' | 'administration')[]
    ): Promise<void> {
        await this.createAuditEntry(studentId, 'escalation_triggered', {
            level,
            reason,
            recipients,
        });

        // In production, this would:
        // 1. Send notifications through the notification system
        // 2. Create tasks for relevant staff
        // 3. Schedule follow-up actions

        console.log(`🚨 Escalation ${level.toUpperCase()}: ${reason}`);
        console.log(`   → Notifying: ${recipients.join(', ')}`);

        for (const recipient of recipients) {
            await this.createAuditEntry(studentId,
                recipient === 'parent' ? 'parent_notified' : 'coordinator_notified',
                { level, reason }
            );
        }
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let auditorInstance: AIAuditor | null = null;

export function getAuditor(): AIAuditor {
    if (!auditorInstance) {
        auditorInstance = new AIAuditor();
    }
    return auditorInstance;
}

// ============================================================================
// INTEGRATION HOOKS
// ============================================================================

/**
 * Hook to be called after each AI session ends
 */
export async function onSessionEnd(session: {
    id: string;
    studentId: string;
    startedAt: Date;
    endedAt: Date;
    messageCount: number;
    emotionalProfile?: {
        dominant?: string;
        valence?: number;
        arousal?: number;
        stability?: number;
    };
    sensitiveContent?: boolean;
    topicsDiscussed?: string[];
}): Promise<void> {
    const auditor = getAuditor();

    // Extract and record metadata
    const metadata = auditor.extractSessionMetadata(session);
    await auditor.recordSessionMetadata(metadata);

    // Quick risk check
    const indicators = await auditor.analyzeStudentRisk(session.studentId);

    if (indicators.length > 0) {
        const escalation = auditor.determineEscalation(indicators);

        if (escalation.level !== 'green') {
            // Determine recipients based on level
            const recipients: ('parent' | 'coordinator' | 'psychologist' | 'administration')[] = [];

            if (escalation.level === 'yellow') {
                recipients.push('parent', 'coordinator');
            } else if (escalation.level === 'orange') {
                recipients.push('parent', 'coordinator', 'psychologist');
            } else if (escalation.level === 'red') {
                recipients.push('parent', 'coordinator', 'psychologist', 'administration');
            }

            await auditor.triggerEscalation(
                session.studentId,
                escalation.level,
                escalation.reason,
                recipients
            );
        }
    }
}

/**
 * Generate periodic wellbeing report for a student
 */
export async function generateStudentWellbeingReport(
    studentId: string,
    periodDays: number = 30
): Promise<WellbeingReport> {
    const auditor = getAuditor();
    return auditor.generateWellbeingReport(studentId, periodDays);
}

/**
 * Verify memory integrity for a student
 */
export async function verifyStudentMemoryIntegrity(studentId: string): Promise<{
    isValid: boolean;
    issues: string[];
    lastVerified: Date;
}> {
    const auditor = getAuditor();
    return auditor.verifyMemoryIntegrity(studentId);
}

