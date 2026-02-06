/**
 * Calendar & Meeting System Zod Validation Schemas
 * 
 * Defines validation rules for:
 * - Organizational roles and hierarchy
 * - Role relationships and permissions
 * - Meetings and scheduling
 * - Meeting approval workflows
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const RoleCategoryEnum = z.enum([
    'executive',
    'director',
    'coordinator',
    'manager',
    'specialist',
    'staff',
    'educator',
    'support'
]);

export const RelationshipTypeEnum = z.enum([
    'manages',
    'can_schedule',
    'can_request',
    'can_approve',
    'collaborates'
]);

export const MeetingTypeEnum = z.enum([
    'internal',
    'external',
    'trial_class',
    'parent_teacher',
    'one_on_one',
    'team',
    'all_hands',
    'training',
    'interview',
    'client'
]);

export const MeetingStatusEnum = z.enum([
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
]);

export const LocationTypeEnum = z.enum([
    'in_person',
    'video_call',
    'phone',
    'hybrid'
]);

export const ApprovalStatusEnum = z.enum([
    'pending',
    'approved',
    'rejected'
]);

export const ParticipantRoleEnum = z.enum([
    'organizer',
    'required',
    'optional',
    'resource',
    'observer'
]);

export const ResponseStatusEnum = z.enum([
    'pending',
    'accepted',
    'declined',
    'tentative'
]);

// ============================================================================
// ORGANIZATIONAL ROLE SCHEMAS
// ============================================================================

/**
 * Schema for creating a new organizational role
 */
export const CreateOrganizationalRoleSchema = z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters').max(100),
    slug: z.string()
        .min(2)
        .max(50)
        .regex(/^[a-z][a-z0-9_]*$/, 'Slug must be lowercase letters, numbers, and underscores'),
    description: z.string().max(500).optional(),

    hierarchyLevel: z.number()
        .int()
        .min(1, 'Hierarchy level must be at least 1')
        .max(99, 'Hierarchy level cannot exceed 99 (100 is reserved for owner)'),

    category: RoleCategoryEnum,
    department: z.string().max(50).optional(),

    permissions: z.array(z.string()).default([]),

    icon: z.string().default('IconUser'),
    color: z.string().default('blue'),

    canHaveReports: z.boolean().default(false),
});

export type CreateOrganizationalRole = z.infer<typeof CreateOrganizationalRoleSchema>;

/**
 * Schema for updating an organizational role
 */
export const UpdateOrganizationalRoleSchema = CreateOrganizationalRoleSchema.partial();

// ============================================================================
// ROLE RELATIONSHIP SCHEMAS
// ============================================================================

/**
 * Schema for creating a role relationship
 */
export const CreateRoleRelationshipSchema = z.object({
    fromRoleId: z.string().uuid('Invalid source role ID'),
    toRoleId: z.string().uuid('Invalid target role ID'),

    relationshipType: RelationshipTypeEnum,

    requiresApprovalFrom: z.string().uuid().optional(),

    allowedMeetingTypes: z.array(MeetingTypeEnum).default(['internal']),

    maxDurationMinutes: z.number().int().min(15).max(480).optional(),
    requiresNotice: z.boolean().default(false),
    noticeHours: z.number().int().min(1).max(168).default(24), // Max 1 week
}).refine(
    (data) => data.fromRoleId !== data.toRoleId,
    { message: 'A role cannot have a relationship with itself' }
);

export type CreateRoleRelationship = z.infer<typeof CreateRoleRelationshipSchema>;

// ============================================================================
// USER ROLE ASSIGNMENT SCHEMAS
// ============================================================================

export const ScopeTypeEnum = z.enum([
    'organization',
    'department',
    'team',
    'course'
]);

export const AssignUserRoleSchema = z.object({
    userId: z.string().min(1, 'User ID required'),
    roleId: z.string().uuid('Invalid role ID'),

    scopeType: ScopeTypeEnum.default('organization'),
    scopeId: z.string().optional(),

    reportsTo: z.string().optional(),
    isPrimary: z.boolean().default(false),

    effectiveFrom: z.number().int().optional(),
    effectiveUntil: z.number().int().optional(),
}).refine(
    (data) => {
        if (data.effectiveUntil && data.effectiveFrom) {
            return data.effectiveUntil > data.effectiveFrom;
        }
        return true;
    },
    { message: 'End date must be after start date' }
);

export type AssignUserRole = z.infer<typeof AssignUserRoleSchema>;

// ============================================================================
// MEETING SCHEMAS
// ============================================================================

/**
 * Recurrence configuration schema
 */
export const RecurrenceSchema = z.object({
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
    interval: z.number().int().min(1).max(12).default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0 = Sunday
    endDate: z.number().int().optional(),
    count: z.number().int().min(1).max(52).optional(), // Max 52 occurrences
}).refine(
    (data) => !(!data.endDate && !data.count),
    { message: 'Must specify either endDate or count for recurrence' }
);

/**
 * Participant schema for meeting creation
 */
export const MeetingParticipantSchema = z.object({
    // Either userId (internal) or external info
    userId: z.string().optional(),
    externalEmail: z.string().email().optional(),
    externalName: z.string().max(100).optional(),
    externalPhone: z.string().max(20).optional(),

    role: ParticipantRoleEnum.default('required'),
}).refine(
    (data) => data.userId || data.externalEmail,
    { message: 'Must provide either userId or externalEmail' }
);

/**
 * Schema for creating a new meeting
 */
export const CreateMeetingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(2000).optional(),

    meetingType: MeetingTypeEnum,

    // Context linking (optional)
    contextType: z.string().max(50).optional(),
    contextId: z.string().optional(),

    // Scheduling
    scheduledStart: z.number().int().positive('Start time required'),
    scheduledEnd: z.number().int().positive('End time required'),
    timezone: z.string().default('America/Sao_Paulo'),
    isAllDay: z.boolean().default(false),

    // Recurrence
    recurrence: RecurrenceSchema.optional(),

    // Location
    locationType: LocationTypeEnum.default('video_call'),
    location: z.string().max(500).optional(),
    videoProvider: z.enum(['google_meet', 'zoom', 'teams', 'other']).optional(),

    // Participants
    participants: z.array(MeetingParticipantSchema).min(1, 'At least one participant required'),

    // Agenda
    agenda: z.string().max(5000).optional(),

    // For meetings that require approval
    requiresApproval: z.boolean().default(false),
    requestApprovalFrom: z.string().optional(), // User ID of approver
}).refine(
    (data) => data.scheduledEnd > data.scheduledStart,
    { message: 'End time must be after start time' }
).refine(
    (data) => {
        const durationMs = data.scheduledEnd - data.scheduledStart;
        const maxDuration = 24 * 60 * 60 * 1000; // 24 hours
        return durationMs <= maxDuration;
    },
    { message: 'Meeting cannot exceed 24 hours' }
);

export type CreateMeeting = z.infer<typeof CreateMeetingSchema>;

/**
 * Schema for updating a meeting
 */
export const UpdateMeetingSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).optional(),

    scheduledStart: z.number().int().positive().optional(),
    scheduledEnd: z.number().int().positive().optional(),

    locationType: LocationTypeEnum.optional(),
    location: z.string().max(500).optional(),
    videoLink: z.string().url().optional(),

    status: MeetingStatusEnum.optional(),

    agenda: z.string().max(5000).optional(),
    notes: z.string().max(10000).optional(),
    outcome: z.string().max(2000).optional(),
});

export type UpdateMeeting = z.infer<typeof UpdateMeetingSchema>;

/**
 * Schema for meeting approval/rejection
 */
export const MeetingApprovalSchema = z.object({
    approved: z.boolean(),
    notes: z.string().max(500).optional(),
});

export type MeetingApproval = z.infer<typeof MeetingApprovalSchema>;

/**
 * Schema for responding to a meeting invitation
 */
export const MeetingResponseSchema = z.object({
    response: ResponseStatusEnum,
    message: z.string().max(200).optional(),
});

export type MeetingResponse = z.infer<typeof MeetingResponseSchema>;

// ============================================================================
// MEETING TEMPLATE SCHEMAS
// ============================================================================

export const CreateMeetingTemplateSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),

    meetingType: MeetingTypeEnum,
    defaultDurationMinutes: z.number().int().min(15).max(480).default(60),
    defaultLocationType: LocationTypeEnum.optional(),

    defaultAgenda: z.string().max(5000).optional(),
    defaultDescription: z.string().max(2000).optional(),

    defaultReminders: z.array(z.object({
        type: z.enum(['email', 'push', 'sms']),
        beforeMinutes: z.number().int().min(5).max(10080), // Max 1 week
    })).default([]),

    allowedRoles: z.array(z.string().uuid()).default([]),
});

export type CreateMeetingTemplate = z.infer<typeof CreateMeetingTemplateSchema>;

// ============================================================================
// CALENDAR QUERY SCHEMAS
// ============================================================================

/**
 * Schema for calendar view queries
 */
export const CalendarQuerySchema = z.object({
    view: z.enum(['day', 'week', 'month', 'agenda']).default('week'),

    // Date range
    startDate: z.number().int().positive(),
    endDate: z.number().int().positive(),

    // Filters
    userId: z.string().optional(), // View specific user's calendar
    includeTeam: z.boolean().default(false),
    meetingTypes: z.array(MeetingTypeEnum).optional(),
    statusFilter: z.array(MeetingStatusEnum).optional(),

    // Include action items?
    includeActionItems: z.boolean().default(true),
}).refine(
    (data) => data.endDate > data.startDate,
    { message: 'End date must be after start date' }
);

export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;

// ============================================================================
// PERMISSION CHECK SCHEMAS
// ============================================================================

/**
 * Schema for checking if a user can schedule with another
 */
export const SchedulePermissionCheckSchema = z.object({
    organizerId: z.string().min(1),
    targetUserIds: z.array(z.string()).min(1),
    meetingType: MeetingTypeEnum,
});

export type SchedulePermissionCheck = z.infer<typeof SchedulePermissionCheckSchema>;

/**
 * Response schema for permission check
 */
export const SchedulePermissionResultSchema = z.object({
    canSchedule: z.boolean(),
    requiresApproval: z.boolean(),
    approverUserId: z.string().optional(),
    reason: z.string().optional(),
    constraints: z.object({
        maxDurationMinutes: z.number().optional(),
        requiresNotice: z.boolean(),
        noticeHours: z.number().optional(),
    }).optional(),
});

export type SchedulePermissionResult = z.infer<typeof SchedulePermissionResultSchema>;

// ============================================================================
// DEFAULT ROLE CONFIGURATIONS
// ============================================================================

/**
 * Default organizational role templates for new organizations
 */
export const DEFAULT_ORGANIZATIONAL_ROLES = [
    {
        slug: 'owner',
        name: 'Owner',
        hierarchyLevel: 100,
        category: 'executive' as const,
        permissions: ['*'], // Full access
        canHaveReports: true,
        isSystemRole: true,
    },
    {
        slug: 'director',
        name: 'Director',
        hierarchyLevel: 80,
        category: 'director' as const,
        permissions: [
            'schedule:all',
            'approve:meetings',
            'view:all_calendars',
            'manage:team',
        ],
        canHaveReports: true,
    },
    {
        slug: 'pedagogical_coordinator',
        name: 'Pedagogical Coordinator',
        hierarchyLevel: 60,
        category: 'coordinator' as const,
        department: 'pedagogical',
        permissions: [
            'schedule:team',
            'schedule:parent_teacher',
            'approve:parent_meetings',
            'view:team_calendar',
        ],
        canHaveReports: true,
    },
    {
        slug: 'administrative_coordinator',
        name: 'Administrative Coordinator',
        hierarchyLevel: 60,
        category: 'coordinator' as const,
        department: 'administrative',
        permissions: [
            'schedule:team',
            'view:team_calendar',
        ],
        canHaveReports: true,
    },
    {
        slug: 'marketing_manager',
        name: 'Marketing Manager',
        hierarchyLevel: 50,
        category: 'manager' as const,
        department: 'marketing',
        permissions: [
            'schedule:team',
            'schedule:external',
            'view:team_calendar',
        ],
        canHaveReports: true,
    },
    {
        slug: 'sales_manager',
        name: 'Sales Manager',
        hierarchyLevel: 50,
        category: 'manager' as const,
        department: 'sales',
        permissions: [
            'schedule:team',
            'schedule:trial',
            'view:team_calendar',
        ],
        canHaveReports: true,
    },
    {
        slug: 'teacher',
        name: 'Teacher',
        hierarchyLevel: 30,
        category: 'educator' as const,
        department: 'pedagogical',
        permissions: [
            'schedule:internal',
            'request:parent_meeting', // Needs coordinator approval
        ],
        canHaveReports: false,
    },
    {
        slug: 'sales_representative',
        name: 'Sales Representative',
        hierarchyLevel: 20,
        category: 'staff' as const,
        department: 'sales',
        permissions: [
            'schedule:trial',
            'schedule:internal',
        ],
        canHaveReports: false,
    },
    {
        slug: 'staff',
        name: 'Staff',
        hierarchyLevel: 10,
        category: 'staff' as const,
        permissions: [
            'schedule:internal',
        ],
        canHaveReports: false,
    },
];

/**
 * Default role relationships for new organizations
 */
export const DEFAULT_ROLE_RELATIONSHIPS = [
    // Owner can schedule with everyone
    { fromSlug: 'owner', toSlug: '*', type: 'can_schedule' },

    // Directors can schedule with coordinators and below
    { fromSlug: 'director', toSlug: 'pedagogical_coordinator', type: 'can_schedule' },
    { fromSlug: 'director', toSlug: 'administrative_coordinator', type: 'can_schedule' },
    { fromSlug: 'director', toSlug: 'marketing_manager', type: 'can_schedule' },
    { fromSlug: 'director', toSlug: 'sales_manager', type: 'can_schedule' },
    { fromSlug: 'director', toSlug: 'owner', type: 'can_schedule' }, // Directors can schedule with owner

    // Coordinators manage their teams
    { fromSlug: 'pedagogical_coordinator', toSlug: 'teacher', type: 'manages' },
    { fromSlug: 'sales_manager', toSlug: 'sales_representative', type: 'manages' },

    // Teachers can request parent meetings (needs coordinator approval)
    { fromSlug: 'teacher', toSlug: 'parent', type: 'can_request', approverSlug: 'pedagogical_coordinator' },

    // Collaborations
    { fromSlug: 'teacher', toSlug: 'teacher', type: 'collaborates' },
    { fromSlug: 'sales_representative', toSlug: 'sales_representative', type: 'collaborates' },
];

