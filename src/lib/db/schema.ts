import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// ============================================================================
// HELPER: Generate UUID
// ============================================================================
const uuid = () => sql`(lower(hex(randomblob(16))))`;
const timestamp = () => sql`(unixepoch())`;

// ============================================================================
// ORGANIZATION: MULTI-TENANT FOUNDATION
// ============================================================================

/**
 * Organizations - The tenant entity
 * 
 * Two types:
 * - 'platform': NodeZero itself (manages all schools, billing, support)
 * - 'school': An actual school/tenant (customer of NodeZero)
 * 
 * Hierarchy: Platform → Schools
 */
export const organizations = sqliteTable('organizations', {
    id: text('id').primaryKey().default(uuid()),

    // Type & hierarchy
    type: text('type', { enum: ['platform', 'school'] }).default('school'),
    parentOrganizationId: text('parent_organization_id'),  // Schools point to platform

    // Identity
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),  // URL slug (e.g., "intelligence-course")
    displayName: text('display_name'),       // "Intelligence Course"

    // Clerk integration (optional)
    clerkOrgId: text('clerk_org_id').unique(),

    // ==========================================
    // BRANDING
    // ==========================================
    logoUrl: text('logo_url'),
    faviconUrl: text('favicon_url'),
    coverImageUrl: text('cover_image_url'),
    primaryColor: text('primary_color').default('#7048e8'),
    secondaryColor: text('secondary_color'),

    // ==========================================
    // CONTACT
    // ==========================================
    email: text('email'),
    phone: text('phone'),
    whatsapp: text('whatsapp'),
    website: text('website'),

    // ==========================================
    // ADDRESS
    // ==========================================
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    city: text('city'),
    state: text('state'),
    postalCode: text('postal_code'),
    country: text('country').default('BR'),

    // ==========================================
    // BRAZILIAN LEGAL (For schools)
    // ==========================================
    cnpj: text('cnpj'),
    razaoSocial: text('razao_social'),  // Legal name
    nomeFantasia: text('nome_fantasia'),  // Trade name
    inscricaoEstadual: text('inscricao_estadual'),
    inscricaoMunicipal: text('inscricao_municipal'),
    regimeTributario: text('regime_tributario', {
        enum: ['mei', 'simples', 'lucro_presumido', 'lucro_real']
    }),

    // ==========================================
    // SAAS PLAN
    // ==========================================
    plan: text('plan', {
        enum: ['trial', 'essentials', 'professional', 'enterprise', 'custom']
    }).default('trial'),
    planStartedAt: integer('plan_started_at'),
    planExpiresAt: integer('plan_expires_at'),
    trialEndsAt: integer('trial_ends_at'),

    // Feature flags (JSON array of enabled module names)
    enabledModules: text('enabled_modules').default('["management","pedagogical","payments","communications"]'),
    moduleConfig: text('module_config').default('{}'),  // JSON config per module

    // ==========================================
    // LIMITS
    // ==========================================
    maxStudents: integer('max_students').default(100),
    maxStaff: integer('max_staff').default(10),
    maxStorageMb: integer('max_storage_mb').default(1024),

    // ==========================================
    // STATUS
    // ==========================================
    status: text('status', {
        enum: ['active', 'trial', 'suspended', 'cancelled', 'pending_setup']
    }).default('pending_setup'),

    // Onboarding progress (JSON tracking which steps completed)
    onboardingProgress: text('onboarding_progress').default('{}'),
    onboardingCompletedAt: integer('onboarding_completed_at'),

    // ==========================================
    // SETTINGS
    // ==========================================
    timezone: text('timezone').default('America/Sao_Paulo'),
    locale: text('locale').default('pt-BR'),
    currency: text('currency').default('BRL'),

    // ==========================================
    // TIMESTAMPS
    // ==========================================
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_orgs_slug').on(table.slug),
    uniqueIndex('idx_orgs_clerk').on(table.clerkOrgId),
    index('idx_orgs_status').on(table.status),
    index('idx_orgs_type').on(table.type),
    index('idx_orgs_parent').on(table.parentOrganizationId),
]);

/**
 * Organization Memberships - Links persons to organizations with roles
 * 
 * A person can be a member of multiple organizations (e.g., a teacher at multiple schools).
 * A person can have different roles in the same organization.
 */
export const organizationMemberships = sqliteTable('organization_memberships', {
    id: text('id').primaryKey().default(uuid()),

    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull(),  // References persons.id (defined later)

    // Role in this organization
    role: text('role', {
        enum: ['owner', 'admin', 'teacher', 'student', 'parent', 'staff', 'accountant', 'support']
    }).notNull(),

    // Role-specific data reference (points to staffRoles, teacherRoles, etc.)
    roleRecordId: text('role_record_id'),

    // Status
    status: text('status', { enum: ['active', 'invited', 'suspended', 'left'] }).default('active'),
    invitedAt: integer('invited_at'),
    invitedBy: text('invited_by'),  // personId of inviter
    joinedAt: integer('joined_at'),
    leftAt: integer('left_at'),

    // Settings
    isDefaultOrg: integer('is_default_org').default(0),  // Default org for this person
    notificationPreferences: text('notification_preferences').default('{}'),

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_org_members_org').on(table.organizationId),
    index('idx_org_members_person').on(table.personId),
    index('idx_org_members_role').on(table.role),
    index('idx_org_members_status').on(table.status),
    uniqueIndex('idx_org_members_unique').on(table.organizationId, table.personId, table.role),
]);

/**
 * Extended branding settings for organizations
 * Separated from main org table to allow more detailed customization
 */
export const organizationBranding = sqliteTable('organization_branding', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').unique().notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),

    // ==========================================
    // LOGOS
    // ==========================================
    logoLightUrl: text('logo_light_url'),      // For dark backgrounds
    logoDarkUrl: text('logo_dark_url'),        // For light backgrounds
    logoIconUrl: text('logo_icon_url'),        // Small icon/mark version
    ogImageUrl: text('og_image_url'),          // Social share image (1200x630)

    // ==========================================
    // COLORS
    // ==========================================
    primaryColorLight: text('primary_color_light'),
    primaryColorDark: text('primary_color_dark'),

    secondaryColor: text('secondary_color').default('#1c7ed6'),
    accentColor: text('accent_color').default('#fd7e14'),

    backgroundColor: text('background_color').default('#ffffff'),
    backgroundColorDark: text('background_color_dark').default('#1a1b1e'),

    textColor: text('text_color').default('#212529'),
    textColorMuted: text('text_color_muted').default('#868e96'),

    successColor: text('success_color').default('#40c057'),
    warningColor: text('warning_color').default('#fab005'),
    errorColor: text('error_color').default('#fa5252'),

    // ==========================================
    // TYPOGRAPHY
    // ==========================================
    fontHeading: text('font_heading').default('Inter'),
    fontBody: text('font_body').default('Inter'),
    fontMono: text('font_mono').default('JetBrains Mono'),

    fontWeightNormal: integer('font_weight_normal').default(400),
    fontWeightMedium: integer('font_weight_medium').default(500),
    fontWeightBold: integer('font_weight_bold').default(700),

    // ==========================================
    // IMAGES & MEDIA
    // ==========================================
    heroImageUrl: text('hero_image_url'),
    heroVideoUrl: text('hero_video_url'),
    patternImageUrl: text('pattern_image_url'),

    // ==========================================
    // LAYOUT
    // ==========================================
    borderRadius: text('border_radius', {
        enum: ['none', 'sm', 'md', 'lg', 'xl']
    }).default('md'),
    containerWidth: text('container_width').default('1200px'),

    // ==========================================
    // SOCIAL
    // ==========================================
    socialInstagram: text('social_instagram'),
    socialYoutube: text('social_youtube'),
    socialLinkedin: text('social_linkedin'),
    socialTiktok: text('social_tiktok'),
    socialTwitter: text('social_twitter'),
    socialFacebook: text('social_facebook'),
    socialWhatsapp: text('social_whatsapp'),

    // ==========================================
    // FOOTER
    // ==========================================
    footerText: text('footer_text'),
    showPoweredBy: integer('show_powered_by').default(1),  // "Powered by NodeZero"

    // ==========================================
    // CUSTOM (Enterprise only)
    // ==========================================
    customCss: text('custom_css'),
    customHeadHtml: text('custom_head_html'),  // Analytics, etc.

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
});

/**
 * Custom domains for organizations
 * Allows schools to use their own domain (cursoai.com.br)
 */
export const organizationDomains = sqliteTable('organization_domains', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),

    // Domain info
    domain: text('domain').unique().notNull(),  // "cursoai.com.br"
    isPrimary: integer('is_primary').default(0),

    // Verification
    verificationStatus: text('verification_status', {
        enum: ['pending', 'verified', 'failed']
    }).default('pending'),
    verificationToken: text('verification_token'),  // TXT record value
    verifiedAt: integer('verified_at'),
    lastCheckAt: integer('last_check_at'),
    failureReason: text('failure_reason'),

    // SSL (auto-managed by Vercel/Cloudflare)
    sslStatus: text('ssl_status', {
        enum: ['pending', 'active', 'expired', 'error']
    }).default('pending'),
    sslExpiresAt: integer('ssl_expires_at'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_org_domains_org').on(table.organizationId),
    uniqueIndex('idx_org_domains_domain').on(table.domain),
]);

/**
 * Custom landing pages for marketing campaigns
 * /[orgSlug]/lp/[landingSlug]
 */
export const landingPages = sqliteTable('landing_pages', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),

    // Campaign/Course links
    campaignId: text('campaign_id'),              // Link to campaign
    courseId: text('course_id'),                  // If tied to specific course

    // Identity
    slug: text('slug').notNull(),  // "criancas", "empresas", "black-friday"
    title: text('title').notNull(),
    name: text('name'),                           // Internal name
    description: text('description'),

    // Page type
    pageType: text('page_type', {
        enum: ['capture', 'waitlist', 'event', 'sales', 'thank_you', 'course']
    }).default('capture'),

    // Target
    targetAudience: text('target_audience'),  // "kids", "professionals", "educators"

    // Template & Content (JSON schema for page builder sections)
    templateId: text('template_id'),
    content: text('content').default('{}'),
    customCss: text('custom_css'),
    customJs: text('custom_js'),

    // SEO
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    ogImage: text('og_image'),
    keywords: text('keywords'),  // Comma-separated

    // Conversion
    conversionGoal: text('conversion_goal', {
        enum: ['lead', 'trial', 'enrollment', 'waitlist', 'contact', 'download']
    }),
    formSlug: text('form_slug'),  // Which form to show
    ctaText: text('cta_text'),
    ctaUrl: text('cta_url'),

    // ==========================================
    // A/B Testing
    // ==========================================
    parentPageId: text('parent_page_id'),         // If variant, link to original
    isVariant: integer('is_variant', { mode: 'boolean' }).default(false),
    variantName: text('variant_name'),            // "A", "B", "Control", etc.
    trafficAllocation: integer('traffic_allocation').default(100),  // 0-100 percentage

    // Status
    status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
    publishedAt: integer('published_at'),
    archivedAt: integer('archived_at'),

    // Scheduling
    startsAt: integer('starts_at'),  // For timed campaigns
    endsAt: integer('ends_at'),

    // Analytics
    viewCount: integer('view_count').default(0),
    uniqueViewCount: integer('unique_view_count').default(0),
    conversionCount: integer('conversion_count').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_landing_slug').on(table.organizationId, table.slug),
    index('idx_landing_status').on(table.status),
    index('idx_landing_course').on(table.courseId),
    index('idx_landing_campaign').on(table.campaignId),
]);

// Type exports for organizations
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembership = typeof organizationMemberships.$inferInsert;
export type OrganizationBranding = typeof organizationBranding.$inferSelect;
export type NewOrganizationBranding = typeof organizationBranding.$inferInsert;
export type OrganizationDomain = typeof organizationDomains.$inferSelect;
export type LandingPage = typeof landingPages.$inferSelect;



// ============================================================================
// IDENTITY: PERSONS (Canonical Identity)
// ============================================================================

/**
 * The core person entity - represents a human being regardless of their role.
 * A person can be: student, parent, teacher, staff, lead, talent, owner - or multiple!
 * Everyone gets a Lattice interview on first AI conversation.
 */
export const persons = sqliteTable('persons', {
    id: text('id').primaryKey().default(uuid()),

    // Identity
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    displayName: text('display_name'),  // Override or computed

    // Primary contact (additional contacts in personContacts)
    primaryEmail: text('primary_email').unique(),
    primaryPhone: text('primary_phone'),

    // Brazilian tax identification
    taxId: text('tax_id'),  // CPF or CNPJ
    taxIdType: text('tax_id_type', { enum: ['cpf', 'cnpj'] }),

    // Demographics (LGPD: optional, can be encrypted)
    birthDate: integer('birth_date'),
    gender: text('gender', { enum: ['male', 'female', 'other', 'prefer_not_to_say'] }),

    // Avatar
    avatarUrl: text('avatar_url'),

    // Lattice (everyone gets mapped on first AI conversation!)
    latticeId: text('lattice_id'),  // Reference to their skill/value topology
    latticeInterviewCompleted: integer('lattice_interview_completed').default(0),
    latticeInterviewedAt: integer('lattice_interviewed_at'),

    // Status
    status: text('status', { enum: ['active', 'inactive', 'archived'] }).default('active'),

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_persons_email').on(table.primaryEmail),
    index('idx_persons_tax').on(table.taxId),
    index('idx_persons_lattice').on(table.latticeId),
]);

/**
 * Additional contact methods for a person
 */
export const personContacts = sqliteTable('person_contacts', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    contactType: text('contact_type', { enum: ['email', 'phone', 'whatsapp', 'address'] }).notNull(),
    contactValue: text('contact_value').notNull(),

    isPrimary: integer('is_primary').default(0),
    isVerified: integer('is_verified').default(0),
    verifiedAt: integer('verified_at'),
    label: text('label'),  // "Work", "Home", "Personal"

    // For addresses
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    city: text('city'),
    state: text('state'),
    postalCode: text('postal_code'),
    country: text('country').default('BR'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_person_contacts_person').on(table.personId),
]);

// ============================================================================
// IDENTITY: AUTH (Clerk-linked wrapper)
// ============================================================================

// NOTE: organizations table is defined at line 23 with full multi-tenant support


/**
 * User = Thin auth bridge linking Clerk to a Person
 * 
 * This table contains ONLY auth-related state. All identity data is in `persons`.
 * The id is the Clerk user_id, personId links to the canonical identity.
 * 
 * ⚠️ DEPRECATED COLUMNS BELOW: These are temporary shims for backward compatibility
 * during the identity migration. Code should use persons table for email/name/avatarUrl
 * and organizationMemberships for role/organizationId. See migration_plan_v2.md
 */
export const users = sqliteTable('users', {
    id: text('id').primaryKey(), // Clerk user_id
    personId: text('person_id').references(() => persons.id),  // Canonical identity (nullable during migration)

    // ⚠️ DEPRECATED SHIM COLUMNS - To be removed after Phase 5 migration complete
    // Use persons.primaryEmail, persons.firstName, persons.avatarUrl instead
    email: text('email'),  // DEPRECATED: use persons.primaryEmail
    name: text('name'),    // DEPRECATED: use persons.firstName
    avatarUrl: text('avatar_url'),  // DEPRECATED: use persons.avatarUrl
    role: text('role', { enum: ['student', 'parent', 'teacher', 'staff', 'admin', 'owner', 'talent'] }),  // DEPRECATED: use organizationMemberships
    organizationId: text('organization_id').references(() => organizations.id),  // DEPRECATED: use organizationMemberships

    // Onboarding state
    onboardingCompleted: integer('onboarding_completed').default(0),
    latticeInterviewPending: integer('lattice_interview_pending').default(1),  // First AI chat = interview

    // Client-side preferences (theme, layout, etc.)
    preferences: text('preferences').default('{}'),

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    lastSeenAt: integer('last_seen_at'),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_users_person').on(table.personId),
    index('idx_users_org').on(table.organizationId),  // Temp index for deprecated column
]);

/**
 * User API Keys - Personal AI provider keys
 * Now references personId (canonical identity) instead of userId
 */
export const userApiKeys = sqliteTable('user_api_keys', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    provider: text('provider').notNull(), // 'anthropic', 'openai', 'google', 'groq'
    encryptedKey: text('encrypted_key').notNull(),
    keyHint: text('key_hint'),

    lastUsedAt: integer('last_used_at'),
    totalRequests: integer('total_requests').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_user_api_keys_unique').on(table.personId, table.provider),
]);

// ============================================================================
// IDENTITY: ROLE JUNCTION TABLES
// ============================================================================

/**
 * Student role - person enrolled in courses
 */
export const studentRoles = sqliteTable('student_roles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organizations.id),

    studentNumber: text('student_number'),  // "2024-0042"
    enrolledAt: integer('enrolled_at').default(timestamp()),
    graduatedAt: integer('graduated_at'),

    currentLevelId: text('current_level_id'),  // References levels.id

    status: text('status', { enum: ['active', 'graduated', 'withdrawn', 'suspended'] }).default('active'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_student_roles_unique').on(table.personId, table.organizationId),
    index('idx_student_roles_org').on(table.organizationId),
]);

/**
 * Parent role - guardian relationship to students
 */
export const parentRoles = sqliteTable('parent_roles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    studentPersonId: text('student_person_id').notNull().references(() => persons.id),
    organizationId: text('organization_id').references(() => organizations.id),

    relationship: text('relationship', { enum: ['mother', 'father', 'guardian', 'grandparent', 'sibling', 'other'] }).default('guardian'),

    isPrimaryContact: integer('is_primary_contact').default(0),
    canPickup: integer('can_pickup').default(1),
    canViewGrades: integer('can_view_grades').default(1),
    canViewFinancial: integer('can_view_financial').default(1),
    canApproveActivities: integer('can_approve_activities').default(1),
    receiveNotifications: integer('receive_notifications').default(1),

    isFinancialResponsible: integer('is_financial_responsible').default(0),
    financialPercentage: real('financial_percentage').default(100),  // For split billing

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_parent_roles_unique').on(table.personId, table.studentPersonId),
    index('idx_parent_roles_student').on(table.studentPersonId),
]);

/**
 * Teacher role - person who teaches
 */
export const teacherRoles = sqliteTable('teacher_roles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organizations.id),

    hireDate: integer('hire_date'),

    paymentModel: text('payment_model', { enum: ['school_employee', 'hired_percentage', 'external_rental'] }).default('school_employee'),
    revenuePercentage: real('revenue_percentage').default(0),
    roomRentalFee: real('room_rental_fee').default(0),

    subscribedServices: text('subscribed_services').default('[]'),  // JSON array
    certifications: text('certifications').default('[]'),  // JSON array

    status: text('status', { enum: ['active', 'on_leave', 'terminated'] }).default('active'),
    terminatedAt: integer('terminated_at'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_teacher_roles_unique').on(table.personId, table.organizationId),
]);

/**
 * Staff role - non-teaching employee with full CLT/PJ compensation structure
 * Lucro Real compliant for Brazilian labor law
 */
export const staffRoles = sqliteTable('staff_roles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organizations.id),

    // Position
    positionTitle: text('position_title').notNull(),
    department: text('department', { enum: ['admin', 'marketing', 'sales', 'finance', 'operations', 'hr', 'it', 'pedagogy', 'other'] }),
    managerId: text('manager_id'),  // References another staffRoles.id

    // Employment type
    employmentType: text('employment_type', { enum: ['clt', 'pj', 'contractor', 'intern', 'apprentice'] }).default('clt'),
    hireDate: integer('hire_date'),
    trialEndDate: integer('trial_end_date'),  // Período de experiência (90 days)

    // Work schedule
    weeklyHours: integer('weekly_hours').default(44),  // CLT max 44h/week
    workSchedule: text('work_schedule').default('{}'),  // JSON: {mon: "09:00-18:00", ...}
    isRemote: integer('is_remote').default(0),

    // ==========================================
    // CLT COMPENSATION (Lucro Real)
    // ==========================================

    // Base salary (in centavos for precision)
    baseSalaryCents: integer('base_salary_cents'),  // Salário base
    currency: text('currency').default('BRL'),

    // FGTS (8% of gross - employer obligation)
    fgtsPercentage: real('fgts_percentage').default(8),  // Usually 8%

    // INSS bracket (employee contribution, deducted from salary)
    // Brackets: 7.5%, 9%, 12%, 14% - calculated based on salary range
    inssDeductionBracket: text('inss_deduction_bracket', { enum: ['7.5', '9', '12', '14'] }),

    // IRRF (income tax, withheld from salary)
    // Depends on salary and dependents
    irrfDependents: integer('irrf_dependents').default(0),  // Number of dependents for deduction

    // ==========================================
    // CARGO DE CONFIANÇA (Trust Position - CLT Art. 62)
    // ==========================================

    // Trust position status
    isCargoConfianca: integer('is_cargo_confianca').default(0),  // 1 = yes
    cargoConfiancaStartedAt: integer('cargo_confianca_started_at'),
    cargoConfiancaEndedAt: integer('cargo_confianca_ended_at'),  // If reverted

    // Gratificação de função - minimum 40% over base salary
    cargoConfiancaGratificacaoPercent: real('cargo_confianca_gratificacao_percent').default(40),  // Min 40%
    cargoConfiancaGratificacaoCents: integer('cargo_confianca_gratificacao_cents'),  // Calculated amount

    // Journey exemption (isenção de jornada)
    isJourneyExempt: integer('is_journey_exempt').default(0),  // 1 = no overtime tracking

    // CTPS registration (required for legal validity)
    cargoConfiancaRegisteredInCTPS: integer('cargo_confianca_registered_in_ctps').default(0),
    cargoConfiancaCTPSRegisteredAt: integer('cargo_confianca_ctps_registered_at'),

    // Management powers (poder de mando)
    hasHiringPower: integer('has_hiring_power').default(0),  // Can hire subordinates
    hasFiringPower: integer('has_firing_power').default(0),  // Can fire subordinates
    hasApprovalAuthority: integer('has_approval_authority').default(0),  // Budget/purchase approval

    // Subordinates reference (for 40% calculation validation)
    immediateSubordinatesCount: integer('immediate_subordinates_count').default(0),

    // Leadership trial period (90 days with 2 mandatory feedback meetings)
    cargoConfiancaTrialEndDate: integer('cargo_confianca_trial_end_date'),  // startedAt + 90 days
    cargoConfiancaTrialStatus: text('cargo_confianca_trial_status', {
        enum: ['in_trial', 'confirmed', 'reverted', 'extended']
    }),

    // Mandatory feedback meetings (2 during trial)
    cargoConfiancaFeedback1At: integer('cargo_confianca_feedback_1_at'),  // ~30 days
    cargoConfiancaFeedback1CompletedBy: text('cargo_confianca_feedback_1_completed_by'),  // personId
    cargoConfiancaFeedback1Notes: text('cargo_confianca_feedback_1_notes'),

    cargoConfiancaFeedback2At: integer('cargo_confianca_feedback_2_at'),  // ~60 days
    cargoConfiancaFeedback2CompletedBy: text('cargo_confianca_feedback_2_completed_by'),  // personId
    cargoConfiancaFeedback2Notes: text('cargo_confianca_feedback_2_notes'),

    // Previous position (for reversion)
    previousPositionTitle: text('previous_position_title'),
    previousBaseSalaryCents: integer('previous_base_salary_cents'),


    // ==========================================
    // BENEFITS (CLT common)
    // ==========================================

    // Vale Transporte (VT) - up to 6% deduction from salary
    vtEnabled: integer('vt_enabled').default(1),
    vtMonthlyValueCents: integer('vt_monthly_value_cents'),  // Employer cost

    // Vale Refeição (VR)
    vrEnabled: integer('vr_enabled').default(0),
    vrDailyValueCents: integer('vr_daily_value_cents'),

    // Vale Alimentação (VA)
    vaEnabled: integer('va_enabled').default(0),
    vaMonthlyValueCents: integer('va_monthly_value_cents'),

    // Health insurance (Plano de Saúde)
    healthInsuranceEnabled: integer('health_insurance_enabled').default(0),
    healthInsuranceMonthlyEmployerCents: integer('health_insurance_monthly_employer_cents'),
    healthInsuranceMonthlyEmployeeCents: integer('health_insurance_monthly_employee_cents'),  // Employee co-pay

    // Dental insurance
    dentalInsuranceEnabled: integer('dental_insurance_enabled').default(0),
    dentalInsuranceMonthlyEmployerCents: integer('dental_insurance_monthly_employer_cents'),

    // Life insurance (Seguro de Vida)
    lifeInsuranceEnabled: integer('life_insurance_enabled').default(0),
    lifeInsuranceMonthlyEmployerCents: integer('life_insurance_monthly_employer_cents'),

    // Other benefits (JSON for flexibility)
    otherBenefits: text('other_benefits').default('[]'),  // [{name, valueCents, type}]

    // ==========================================
    // 13TH SALARY & VACATION (CLT obligations)
    // ==========================================

    // 13º Salário - 1/12 accrued monthly
    thirteenthSalaryAccruedCents: integer('thirteenth_salary_accrued_cents').default(0),
    thirteenthSalaryPaidFirstHalfAt: integer('thirteenth_salary_paid_first_half_at'),  // Nov deadline
    thirteenthSalaryPaidSecondHalfAt: integer('thirteenth_salary_paid_second_half_at'),  // Dec deadline

    // Férias - 30 days per year, can sell 1/3
    vacationDaysAccrued: integer('vacation_days_accrued').default(0),
    vacationDaysUsed: integer('vacation_days_used').default(0),
    vacationDaysSold: integer('vacation_days_sold').default(0),  // Abono pecuniário
    lastVacationStartedAt: integer('last_vacation_started_at'),
    lastVacationEndedAt: integer('last_vacation_ended_at'),

    // ==========================================
    // PJ ALTERNATIVE (Contractor)
    // ==========================================

    // For PJ: fixed monthly fee instead of CLT structure
    pjMonthlyFeeCents: integer('pj_monthly_fee_cents'),
    pjCnpj: text('pj_cnpj'),
    pjCompanyName: text('pj_company_name'),
    pjInvoiceRequired: integer('pj_invoice_required').default(1),

    // ISS (service tax) - municipality dependent
    pjIssPercentage: real('pj_iss_percentage'),  // Usually 2-5%
    pjIssRetained: integer('pj_iss_retained').default(0),  // If org retains ISS

    // ==========================================
    // DISSÍDIO (Annual Obligatory Raise)
    // ==========================================

    // Dissídio coletivo - mandatory annual adjustment
    dissidioLastAppliedAt: integer('dissidio_last_applied_at'),
    dissidioCategoryCode: text('dissidio_category_code'),  // Union category code
    dissidioBaseDate: text('dissidio_base_date'),  // Month when dissídio applies (e.g., "05" for May)

    // ==========================================
    // 3x3 INSIGHTS (SCRM-style for Retention)
    // ==========================================

    // Dreams - future-pull (what they hope for professionally)
    insightDreams: text('insight_dreams').default('[]'),  // JSON: ["own business", "director role", "work abroad"]

    // Hobbies - present-choice (what they do freely, reveals stress outlets)
    insightHobbies: text('insight_hobbies').default('[]'),  // JSON: ["gaming", "cooking", "reading"]

    // Aspirations - identity-vector (who they're becoming)
    insightAspirations: text('insight_aspirations').default('[]'),  // JSON: ["MBA", "leadership", "teaching"]

    // AI-generated persona from 3x3
    aiPersona: text('ai_persona'),  // JSON: {communicationStyle, motivators, riskFactors}

    // ==========================================
    // RETENTION METRICS
    // ==========================================

    // Turnover risk (AI-computed from 3x3 + engagement + sentiment)
    turnoverRisk: text('turnover_risk', { enum: ['low', 'medium', 'high', 'critical'] }),
    turnoverRiskUpdatedAt: integer('turnover_risk_updated_at'),

    // Engagement score (0-100)
    engagementScore: integer('engagement_score'),
    lastEngagementAssessmentAt: integer('last_engagement_assessment_at'),

    // Last 1:1 meeting
    lastOneOnOneAt: integer('last_one_on_one_at'),
    nextOneOnOneAt: integer('next_one_on_one_at'),

    // Training hours
    trainingHoursYtd: integer('training_hours_ytd').default(0),
    lastTrainingAt: integer('last_training_at'),

    // ==========================================
    // STATUS
    // ==========================================

    status: text('status', { enum: ['active', 'on_leave', 'vacation', 'maternity_leave', 'sick_leave', 'terminated'] }).default('active'),
    terminatedAt: integer('terminated_at'),
    terminationReason: text('termination_reason', { enum: ['resignation', 'dismissal_just_cause', 'dismissal_without_cause', 'mutual_agreement', 'contract_end', 'death', 'retirement'] }),

    // Termination financials
    terminationNoticePeriodDays: integer('termination_notice_period_days'),  // Aviso prévio
    terminationFgtsMultiplier: real('termination_fgts_multiplier'),  // 40% for without cause

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_staff_roles_org').on(table.organizationId),
    index('idx_staff_roles_person').on(table.personId),
    index('idx_staff_roles_department').on(table.department),
    index('idx_staff_roles_turnover_risk').on(table.turnoverRisk),
]);

/**
 * Staff salary history - tracks all salary changes including dissídio
 */
export const staffSalaryHistory = sqliteTable('staff_salary_history', {
    id: text('id').primaryKey().default(uuid()),
    staffRoleId: text('staff_role_id').notNull().references(() => staffRoles.id, { onDelete: 'cascade' }),

    effectiveAt: integer('effective_at').notNull(),  // When this salary took effect

    previousSalaryCents: integer('previous_salary_cents'),
    newSalaryCents: integer('new_salary_cents').notNull(),
    changePercentage: real('change_percentage'),  // (new - old) / old * 100

    reason: text('reason', {
        enum: ['hire', 'dissidio', 'promotion', 'merit', 'adjustment', 'market_correction', 'demotion']
    }).notNull(),

    notes: text('notes'),
    approvedBy: text('approved_by'),  // personId of approver

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_staff_salary_history_role').on(table.staffRoleId),
    index('idx_staff_salary_history_date').on(table.effectiveAt),
]);

/**
 * Staff sentiment history - tracks emotional trajectory over time (SCRM-style)
 */
export const staffSentimentHistory = sqliteTable('staff_sentiment_history', {
    id: text('id').primaryKey().default(uuid()),
    staffRoleId: text('staff_role_id').notNull().references(() => staffRoles.id, { onDelete: 'cascade' }),

    recordedAt: integer('recorded_at').default(timestamp()),
    recordedBy: text('recorded_by'),  // personId of manager who recorded

    sentiment: text('sentiment', { enum: ['positive', 'neutral', 'hesitant', 'negative'] }).notNull(),
    source: text('source', { enum: ['one_on_one', 'performance_review', 'pulse_survey', 'observation', 'exit_interview'] }),

    notes: text('notes'),

    // Specific concerns flagged
    concernAreas: text('concern_areas').default('[]'),  // JSON: ["workload", "compensation", "growth", "team"]

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_staff_sentiment_role').on(table.staffRoleId),
    index('idx_staff_sentiment_date').on(table.recordedAt),
]);

/**
 * Staff insight communications - anchored to specific dreams/hobbies/aspirations (SCRM pattern)
 */
export const staffInsightCommunications = sqliteTable('staff_insight_communications', {
    id: text('id').primaryKey().default(uuid()),
    staffRoleId: text('staff_role_id').notNull().references(() => staffRoles.id, { onDelete: 'cascade' }),

    insightType: text('insight_type', { enum: ['dream', 'hobby', 'aspiration'] }).notNull(),
    insightValue: text('insight_value').notNull(),  // The specific insight this relates to

    recordedBy: text('recorded_by'),  // personId
    recordedAt: integer('recorded_at').default(timestamp()),

    message: text('message').notNull(),  // What was discussed
    outcome: text('outcome'),  // Any action taken or commitment made

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_staff_insight_comms_role').on(table.staffRoleId),
]);

/**
 * Staff training records - for retention analysis
 */
export const staffTrainingRecords = sqliteTable('staff_training_records', {
    id: text('id').primaryKey().default(uuid()),
    staffRoleId: text('staff_role_id').notNull().references(() => staffRoles.id, { onDelete: 'cascade' }),

    trainingName: text('training_name').notNull(),
    trainingType: text('training_type', { enum: ['onboarding', 'skill', 'compliance', 'leadership', 'certification', 'conference'] }),

    provider: text('provider'),  // Internal, external provider name
    hoursCompleted: real('hours_completed'),
    costCents: integer('cost_cents'),

    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),
    expiresAt: integer('expires_at'),  // For certifications

    status: text('status', { enum: ['planned', 'in_progress', 'completed', 'cancelled'] }).default('planned'),

    // Link to aspirations (training aligned with their goals = higher retention)
    linkedAspiration: text('linked_aspiration'),  // Which aspiration this training supports

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_staff_training_role').on(table.staffRoleId),
    index('idx_staff_training_status').on(table.status),
]);

/**
 * Lead role - potential customer tracked in CRM
 */
export const leadRoles = sqliteTable('lead_roles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organizations.id),

    // Funnel
    stage: text('stage', { enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] }).default('new'),
    temperature: text('temperature', { enum: ['cold', 'warm', 'hot'] }).default('cold'),
    leadScore: integer('lead_score').default(0),

    // Source
    source: text('source'),
    campaign: text('campaign'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),

    // Assignment
    assignedToUserId: text('assigned_to_user_id').references(() => persons.id),

    // Interests
    interestedCourses: text('interested_courses').default('[]'),  // JSON array
    notes: text('notes'),

    // Conversion tracking
    convertedAt: integer('converted_at'),
    convertedToStudentRoleId: text('converted_to_student_role_id').references(() => studentRoles.id),
    convertedToParentRoleId: text('converted_to_parent_role_id'),  // Will reference parentRoles.id

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_lead_roles_unique').on(table.personId, table.organizationId),
    index('idx_lead_roles_stage').on(table.stage),
    index('idx_lead_roles_assigned').on(table.assignedToUserId),
]);

/**
 * Owner role - organization owner
 */
export const ownerRoles = sqliteTable('owner_roles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    ownershipPercentage: real('ownership_percentage').default(100),
    isPrimaryOwner: integer('is_primary_owner').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_owner_roles_unique').on(table.personId, table.organizationId),
]);

// ============================================================================
// IDENTITY: PERSON LATTICE (Everyone gets skill-mapped!)
// ============================================================================

/**
 * Every person's skill/value topology from their Lattice interview.
 * Created during first AI conversation.
 */
export const personLattice = sqliteTable('person_lattice', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Interview metadata
    interviewSessionId: text('interview_session_id'),
    interviewedAt: integer('interviewed_at').default(timestamp()),
    interviewDurationSec: integer('interview_duration_sec'),

    // The 768-dim embedding of their full profile
    embedding: text('embedding'),  // JSON array of floats
    embeddingModel: text('embedding_model').default('gemini-embedding-exp-03-07'),

    // Skill assessments (from 45-skill framework)
    skillVector: text('skill_vector').default('[]'),  // JSON: [{skillId, score, evidence}]

    // Shadow model (behavioral liabilities)
    shadowVector: text('shadow_vector').default('[]'),  // JSON: [{shadow, severity, evidence}]

    // Values & style discovered
    discoveredValues: text('discovered_values').default('[]'),  // JSON array
    communicationStyle: text('communication_style'),  // 'analytical', 'expressive', etc.
    learningStyle: text('learning_style'),  // 'visual', 'kinesthetic', etc.

    // Goals (for students, parents, teachers - everyone has goals)
    statedGoals: text('stated_goals').default('[]'),  // JSON array
    inferredGoals: text('inferred_goals').default('[]'),  // AI-detected

    // Compatibility scores (computed)
    compatibilityVector: text('compatibility_vector').default('{}'),  // JSON

    // Version tracking
    version: integer('version').default(1),
    lastUpdatedAt: integer('last_updated_at').default(timestamp()),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_person_lattice_person').on(table.personId),
]);

// ============================================================================
// IDENTITY: PERSON BANK ACCOUNTS
// ============================================================================

/**
 * Bank accounts for persons (teachers, staff payouts).
 * Organization bank accounts are separate (fiscal/accounting section).
 */
export const personBankAccounts = sqliteTable('person_bank_accounts', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    accountName: text('account_name'),  // "Main Account", "Business Account"

    bankCode: text('bank_code'),  // Brazilian bank code (341 = Itaú, etc.)
    bankName: text('bank_name'),
    agency: text('agency'),
    accountNumber: text('account_number'),
    accountType: text('account_type', { enum: ['checking', 'savings', 'salary', 'pj'] }),

    // PIX
    pixKey: text('pix_key'),
    pixKeyType: text('pix_key_type', { enum: ['cpf', 'cnpj', 'email', 'phone', 'random'] }),

    // Verification
    isVerified: integer('is_verified').default(0),
    verifiedAt: integer('verified_at'),

    // Usage flags
    isPrimary: integer('is_primary').default(0),
    forPayroll: integer('for_payroll').default(1),
    forPayouts: integer('for_payouts').default(1),
    forRefunds: integer('for_refunds').default(1),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_person_bank_accounts_person').on(table.personId),
]);

// ============================================================================
// IDENTITY: TYPE EXPORTS
// ============================================================================

export type Person = typeof persons.$inferSelect;
export type PersonInsert = typeof persons.$inferInsert;
export type PersonContact = typeof personContacts.$inferSelect;
export type StudentRole = typeof studentRoles.$inferSelect;
export type ParentRole = typeof parentRoles.$inferSelect;
export type TeacherRole = typeof teacherRoles.$inferSelect;
export type StaffRole = typeof staffRoles.$inferSelect;
export type LeadRole = typeof leadRoles.$inferSelect;
export type OwnerRole = typeof ownerRoles.$inferSelect;
export type PersonLattice = typeof personLattice.$inferSelect;
export type PersonBankAccount = typeof personBankAccounts.$inferSelect;


// ============================================================================
// AI PROVIDERS & MODELS
// ============================================================================

export const aiProviders = sqliteTable('ai_providers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    models: text('models').notNull().default('[]'),
    isActive: integer('is_active').default(1),
    baseUrl: text('base_url'),
    updatedAt: integer('updated_at').default(timestamp()),
});

// ============================================================================
// CURRICULUM STRUCTURE
// ============================================================================

export const courses = sqliteTable('courses', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').references(() => organizations.id),
    createdBy: text('created_by').notNull().references(() => persons.id),

    title: text('title').notNull().default('{}'),
    description: text('description').default('{}'),

    isPublished: integer('is_published').default(0),
    isPublic: integer('is_public').default(0),

    version: text('version').default('1.0'),
    language: text('language').default('pt-BR'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_courses_org').on(table.organizationId),
]);

export const modules = sqliteTable('modules', {
    id: text('id').primaryKey().default(uuid()),
    courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),

    title: text('title').notNull().default('{}'),
    description: text('description').default('{}'),

    orderIndex: integer('order_index').notNull().default(0),
    estimatedHours: integer('estimated_hours'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_modules_course').on(table.courseId, table.orderIndex),
]);

export const lessons = sqliteTable('lessons', {
    id: text('id').primaryKey().default(uuid()),
    moduleId: text('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

    title: text('title').notNull().default('{}'),
    description: text('description').default('{}'),
    content: text('content'),
    contentFormat: text('content_format', { enum: ['markdown', 'typst', 'html'] }).default('markdown'),

    orderIndex: integer('order_index').notNull().default(0),
    lessonType: text('lesson_type', { enum: ['standard', 'practice', 'capstone'] }).default('standard'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_lessons_module').on(table.moduleId, table.orderIndex),
]);

export const tasks = sqliteTable('tasks', {
    id: text('id').primaryKey().default(uuid()),
    lessonId: text('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),

    title: text('title').notNull().default('{}'),
    instructions: text('instructions').default('{}'),

    taskType: text('task_type', {
        enum: ['prompt_single', 'prompt_compare', 'benchmark', 'reflection', 'schema_design', 'upload']
    }).notNull(),

    config: text('config').default('{}'),
    orderIndex: integer('order_index').notNull().default(0),
    maxPoints: integer('max_points').default(10),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_tasks_lesson').on(table.lessonId, table.orderIndex),
]);

// ============================================================================
// PROMPTS (Delta Versioned)
// ============================================================================

export const prompts = sqliteTable('prompts', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    organizationId: text('organization_id').references(() => organizations.id),

    name: text('name').notNull(),
    description: text('description'),
    tags: text('tags').default('[]'),

    baseSystemPrompt: text('base_system_prompt'),
    baseMessages: text('base_messages').default('[]'),

    currentSystemPrompt: text('current_system_prompt'),
    currentMessages: text('current_messages').default('[]'),
    currentVersion: integer('current_version').default(1),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forkedFrom: text('forked_from').references((): any => prompts.id),
    forkVersion: integer('fork_version'),

    sharedWith: text('shared_with', { enum: ['private', 'class', 'organization', 'public'] }).default('private'),
    shareToken: text('share_token').unique(),

    courseId: text('course_id').references(() => courses.id),
    moduleId: text('module_id').references(() => modules.id),
    lessonId: text('lesson_id').references(() => lessons.id),
    taskId: text('task_id').references(() => tasks.id),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_prompts_person').on(table.personId),
    index('idx_prompts_org').on(table.organizationId),
    index('idx_prompts_share').on(table.sharedWith),
    uniqueIndex('idx_prompts_token').on(table.shareToken),
]);

export const promptDeltas = sqliteTable('prompt_deltas', {
    id: text('id').primaryKey().default(uuid()),
    promptId: text('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),

    version: integer('version').notNull(),
    patch: text('patch').notNull(), // RFC 6902 JSON Patch

    changeSummary: text('change_summary'),
    changedBy: text('changed_by').references(() => persons.id),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_deltas_prompt_version').on(table.promptId, table.version),
]);

// ============================================================================
// PROMPT RUNS (Immutable)
// ============================================================================

export const promptRuns = sqliteTable('prompt_runs', {
    id: text('id').primaryKey().default(uuid()),
    promptId: text('prompt_id').references(() => prompts.id),
    personId: text('person_id').notNull().references(() => persons.id),

    provider: text('provider').notNull(),
    model: text('model').notNull(),
    systemPrompt: text('system_prompt'),
    messages: text('messages').notNull(), // JSON array

    temperature: real('temperature'),
    maxTokens: integer('max_tokens'),
    otherParams: text('other_params').default('{}'),

    output: text('output'),
    outputTokens: integer('output_tokens'),
    inputTokens: integer('input_tokens'),

    latencyMs: integer('latency_ms'),

    heldCharacter: integer('held_character'),
    userRating: integer('user_rating'),
    notes: text('notes'),

    errorCode: text('error_code'),
    errorMessage: text('error_message'),

    benchmarkId: text('benchmark_id'),
    benchmarkRunIndex: integer('benchmark_run_index'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_runs_prompt').on(table.promptId, table.createdAt),
    index('idx_runs_person').on(table.personId, table.createdAt),
    index('idx_runs_benchmark').on(table.benchmarkId),
]);

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export const progress = sqliteTable('progress', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    classId: text('class_id'),

    courseId: text('course_id').references(() => courses.id),
    moduleId: text('module_id').references(() => modules.id),
    lessonId: text('lesson_id').references(() => lessons.id),
    taskId: text('task_id').references(() => tasks.id),

    status: text('status', { enum: ['not_started', 'in_progress', 'completed', 'skipped'] }).default('not_started'),

    score: real('score'),
    maxScore: real('max_score'),

    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),
    timeSpentSec: integer('time_spent_sec').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_progress_unique').on(table.personId, table.classId, table.taskId),
    index('idx_progress_person').on(table.personId, table.classId),
]);

// ============================================================================
// STUDENT TOOLBOX: Prompt Library
// ============================================================================

export const studentPrompts = sqliteTable('student_prompts', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    systemPrompt: text('system_prompt'),
    userMessage: text('user_message'),

    // Tagging
    tags: text('tags').default('[]'), // JSON: ["orbit", "identity", "module1"]

    // Forking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forkedFrom: text('forked_from').references((): any => studentPrompts.id),

    // Sharing
    isPublic: integer('is_public').default(0), // Share with classmates

    // Stats (denormalized for quick display)
    runCount: integer('run_count').default(0),
    heldRate: real('held_rate').default(0), // 0-100%

    // Links to curriculum (optional)
    moduleId: text('module_id').references(() => modules.id),
    lessonId: text('lesson_id').references(() => lessons.id),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
}, (table) => [
    index('idx_student_prompts_person').on(table.personId),
    index('idx_student_prompts_public').on(table.isPublic, table.createdAt),
]);

// ============================================================================
// STUDENT TOOLBOX: Run Journal (Annotations)
// ============================================================================

export const runAnnotations = sqliteTable('run_annotations', {
    id: text('id').primaryKey().default(uuid()),
    runId: text('run_id').notNull().references(() => promptRuns.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    annotation: text('annotation').notNull(), // "This worked because..." or "Failed because..."

    // Classification
    annotationType: text('annotation_type', {
        enum: ['reflection', 'breakthrough', 'lesson_learned', 'question']
    }).default('reflection'),

    // Link to knowledge graph
    insightCaptured: integer('insight_captured').default(0),
    knowledgeNodeId: text('knowledge_node_id'), // Links to knowledge_nodes if insight captured

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_run_annotations_run').on(table.runId),
    index('idx_run_annotations_person').on(table.personId, table.createdAt),
]);

// ============================================================================
// STUDENT TOOLBOX: Character Graveyard
// ============================================================================

export const graveyardEntries = sqliteTable('graveyard_entries', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    runId: text('run_id').notNull().references(() => promptRuns.id),

    characterName: text('character_name').notNull(), // "Grumpy Blacksmith"
    causeOfDeath: text('cause_of_death'), // "Asked about WiFi routers, switched to modern speech"
    epitaph: text('epitaph'), // Student-written one-liner

    // Context
    moduleId: text('module_id').references(() => modules.id),
    technique: text('technique'), // 'orbit', 'slingshot', etc.

    // Resurrection tracking
    resurrectedAsId: text('resurrected_as_id').references(() => studentPrompts.id),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_graveyard_person').on(table.personId, table.createdAt),
]);

// ============================================================================
// STUDENT TOOLBOX: Technique Tracker
// ============================================================================

export const techniqueUsage = sqliteTable('technique_usage', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    runId: text('run_id').notNull().references(() => promptRuns.id),

    technique: text('technique', {
        enum: ['orbit', 'slingshot', 'black_hole', 'constellation', 'review', 'dark_matter', 'event_horizon', 'architect']
    }).notNull(),

    heldCharacter: integer('held_character').default(0), // 1 = success, 0 = fail

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_technique_person').on(table.personId, table.technique),
    index('idx_technique_run').on(table.runId),
]);

// ============================================================================
// STUDENT TOOLBOX: To-Do Cube (2D → 3D → 4D)
// ============================================================================

export const todoItems = sqliteTable('todo_items', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    description: text('description'),

    // 2D axes (Module 3+)
    priority: integer('priority').default(2), // 1=low, 2=medium, 3=high
    urgency: integer('urgency').default(2),   // 1=low, 2=medium, 3=high (Eisenhower)

    // 3D axis (Module 5+)
    energyCost: integer('energy_cost').default(2), // 1=low, 2=medium, 3=high

    // 4D axis (Module 7+)
    dependsOn: text('depends_on').default('[]'), // JSON array of todo_item ids
    futureImpact: integer('future_impact').default(1), // 1=week, 2=month, 3=year

    // Status
    status: text('status', { enum: ['active', 'completed', 'archived'] }).default('active'),
    completedAt: integer('completed_at'),

    // Optional curriculum link
    lessonId: text('lesson_id').references(() => lessons.id),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_todo_person').on(table.personId, table.status),
]);

// ============================================================================
// STUDENT TOOLBOX: Problem Workshop (Module 6+)
// ============================================================================

export const problemWorkshops = sqliteTable('problem_workshops', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Step 1: Raw Problem Capture
    rawProblem: text('raw_problem').notNull(), // Messy, emotional initial description

    // Step 2: 5 Whys
    whyChain: text('why_chain').default('[]'), // JSON: [{question, answer}, ...]
    rootCause: text('root_cause'), // Identified after 5 whys

    // Step 3: Sign Definition
    signName: text('sign_name'), // One-word or short phrase
    signDescription: text('sign_description'), // "If solved, the world looks like..."

    // Step 4: Gravity Mapping
    stakeholders: text('stakeholders').default('[]'), // JSON: [{who, why}, ...]

    // Step 5: Skill Stack
    requiredSkills: text('required_skills').default('[]'), // JSON array
    skillGaps: text('skill_gaps').default('[]'), // What they don't know yet

    // Step 6: Solution Sketch
    solutionShape: text('solution_shape'), // High-level approach
    aiAgentPotential: integer('ai_agent_potential'), // 1-5 scale: Could AI help?
    agentSketch: text('agent_sketch'), // If yes, rough idea

    // Status
    status: text('status', { enum: ['draft', 'in_progress', 'complete'] }).default('draft'),
    currentStep: integer('current_step').default(1), // 1-6

    // Capstone selection
    selectedForCapstone: integer('selected_for_capstone').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_workshop_person').on(table.personId, table.status),
]);

// ============================================================================
// STUDENT TOOLBOX: Capstone Submissions
// ============================================================================

export const capstoneSubmissions = sqliteTable('capstone_submissions', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    classId: text('class_id'),

    moduleId: text('module_id').notNull().references(() => modules.id),

    // Submission content
    title: text('title').notNull(),
    description: text('description'),

    // Links to evidence
    promptIds: text('prompt_ids').default('[]'), // JSON array of studentPrompt ids
    runIds: text('run_ids').default('[]'), // JSON array of promptRun ids
    workshopId: text('workshop_id').references(() => problemWorkshops.id), // For Module 8

    // Attachments
    attachments: text('attachments').default('[]'), // JSON: [{name, url, type}, ...]

    // Status
    status: text('status', {
        enum: ['draft', 'submitted', 'under_review', 'graded', 'returned']
    }).default('draft'),

    submittedAt: integer('submitted_at'),

    // Self-Assessment (weight: 1)
    selfScore: real('self_score'),
    selfFeedback: text('self_feedback'),
    selfRubric: text('self_rubric').default('{}'), // JSON: structured self-assessment by criterion

    // Teacher Grading (weight: 2)
    teacherScore: real('teacher_score'),
    teacherFeedback: text('teacher_feedback'),
    teacherRubric: text('teacher_rubric').default('{}'), // JSON: {criterion: score, ...}

    // Peer Reviews (weight: 1)
    peerScore: real('peer_score'), // Average from peer reviews
    peerCount: integer('peer_count').default(0), // Number of peer reviews

    // Final Weighted Score: (self * 1 + teacher * 2 + peer * 1) / 4
    finalScore: real('final_score'),

    gradedAt: integer('graded_at'),
    gradedBy: text('graded_by').references(() => persons.id),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_capstone_person').on(table.personId, table.moduleId),
    index('idx_capstone_class').on(table.classId, table.moduleId),
    index('idx_capstone_status').on(table.status),
]);

// ============================================================================
// STUDENT TOOLBOX: Peer Reviews
// ============================================================================

export const peerReviews = sqliteTable('peer_reviews', {
    id: text('id').primaryKey().default(uuid()),
    submissionId: text('submission_id').notNull().references(() => capstoneSubmissions.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id').notNull().references(() => persons.id),

    // Structured rubric (1-5 scale each)
    heldCharacter: integer('held_character'), // Did the AI stay in character?
    creativity: integer('creativity'),         // Was the approach creative?
    techniqueUsage: integer('technique_usage'), // Were course techniques applied?
    overall: integer('overall'),               // Overall impression

    // Optional written feedback
    feedback: text('feedback'),

    // Review quality (meta: affects reviewer's grade)
    qualityScore: real('quality_score'), // Set by teacher or algorithm

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_peer_review_unique').on(table.submissionId, table.reviewerId),
    index('idx_peer_review_reviewer').on(table.reviewerId),
]);

// ============================================================================
// STUDENT TOOLBOX: Challenge Board (Module 5+)
// ============================================================================

export const challenges = sqliteTable('challenges', {
    id: text('id').primaryKey().default(uuid()),
    authorId: text('author_id').notNull().references(() => persons.id),
    classId: text('class_id'), // Scope to class, or null for global

    title: text('title').notNull(),
    description: text('description').notNull(), // The impossible constraint

    techniqueRequired: text('technique_required', {
        enum: ['orbit', 'slingshot', 'black_hole', 'constellation', 'review', 'dark_matter', 'event_horizon', 'architect', 'any']
    }).default('any'),

    difficulty: integer('difficulty').default(3), // 1-5 stars

    // Stats
    attemptCount: integer('attempt_count').default(0),
    solveCount: integer('solve_count').default(0),

    isActive: integer('is_active').default(1),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_challenges_author').on(table.authorId),
    index('idx_challenges_class').on(table.classId, table.createdAt),
]);

export const challengeAttempts = sqliteTable('challenge_attempts', {
    id: text('id').primaryKey().default(uuid()),
    challengeId: text('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),
    runId: text('run_id').notNull().references(() => promptRuns.id),

    // Verification
    solved: integer('solved').default(0), // Verified by challenge author
    verifiedBy: text('verified_by').references(() => persons.id),
    verifiedAt: integer('verified_at'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_attempts_challenge').on(table.challengeId),
    index('idx_attempts_person').on(table.personId),
]);

// ============================================================================
// STUDENT TOOLBOX: Knowledge Graph (for Constellation)
// ============================================================================

export const knowledgeNodes = sqliteTable('knowledge_nodes', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Content
    title: text('title').notNull(),
    content: text('content'), // Longer description

    // Type determines visualization
    nodeType: text('node_type', {
        enum: ['concept', 'insight', 'pattern', 'question', 'skill', 'belief']
    }).notNull().default('concept'),

    // Depth (0 = core belief, higher = peripheral)
    depth: integer('depth').default(1),

    // Source tracking
    sourceRunId: text('source_run_id').references(() => promptRuns.id),
    sourceLessonId: text('source_lesson_id').references(() => lessons.id),

    // Module association
    moduleId: text('module_id').references(() => modules.id),
    technique: text('technique'), // Which technique this relates to

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_knowledge_person').on(table.personId, table.nodeType),
]);

export const knowledgeEdges = sqliteTable('knowledge_edges', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    fromNodeId: text('from_node_id').notNull().references(() => knowledgeNodes.id, { onDelete: 'cascade' }),
    toNodeId: text('to_node_id').notNull().references(() => knowledgeNodes.id, { onDelete: 'cascade' }),

    // Relationship type
    edgeType: text('edge_type', {
        enum: ['supports', 'contradicts', 'extends', 'requires', 'inspires', 'related']
    }).default('related'),

    // Weight (strength of connection)
    weight: real('weight').default(1),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_edge_unique').on(table.fromNodeId, table.toNodeId),
    index('idx_edge_person').on(table.personId),
]);

// ============================================================================
// STUDENT TOOLBOX: Badges & Achievements
// ============================================================================

export const badges = sqliteTable('badges', {
    id: text('id').primaryKey(),

    name: text('name').notNull(),
    description: text('description').notNull(),
    icon: text('icon'), // Emoji or icon name

    // Unlock criteria
    criteria: text('criteria').notNull(), // JSON describing unlock conditions
    category: text('category', {
        enum: ['graveyard', 'technique', 'social', 'completion', 'special']
    }).notNull(),

    // Rarity
    rarity: text('rarity', { enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] }).default('common'),

    createdAt: integer('created_at').default(timestamp()),
});

export const userBadges = sqliteTable('user_badges', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    badgeId: text('badge_id').notNull().references(() => badges.id),

    earnedAt: integer('earned_at').default(timestamp()),

    // Context for how it was earned
    context: text('context'), // JSON with details
}, (table) => [
    uniqueIndex('idx_user_badge_unique').on(table.personId, table.badgeId),
]);

// ============================================================================
// FINANCIAL: Teacher Payment Profiles
// ============================================================================

export const teacherProfiles = sqliteTable('teacher_profiles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organizations.id),

    // Payment model: 'school_employee' | 'hired_percentage' | 'external_rental'
    paymentModel: text('payment_model', {
        enum: ['school_employee', 'hired_percentage', 'external_rental']
    }).notNull().default('school_employee'),

    // For hired_percentage model: teacher's cut (e.g., 30 = 30%)
    revenuePercentage: real('revenue_percentage').default(0),

    // For external_rental model: fixed room rental fee per month
    roomRentalFee: real('room_rental_fee').default(0),

    // Services the teacher subscribes to (JSON array of service IDs)
    subscribedServices: text('subscribed_services').default('[]'),

    // Bank/PIX details for payouts
    bankName: text('bank_name'),
    bankAgency: text('bank_agency'),
    bankAccount: text('bank_account'),
    pixKey: text('pix_key'),
    pixKeyType: text('pix_key_type', { enum: ['cpf', 'cnpj', 'email', 'phone', 'random'] }),

    // Tax info
    taxId: text('tax_id'), // CPF or CNPJ
    taxIdType: text('tax_id_type', { enum: ['cpf', 'cnpj'] }),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_teacher_profiles_person').on(table.personId),
]);

// ============================================================================
// FINANCIAL: Course Pricing
// ============================================================================

export const coursePricing = sqliteTable('course_pricing', {
    id: text('id').primaryKey().default(uuid()),
    courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),

    // Base pricing
    fullPrice: real('full_price').notNull(),
    currency: text('currency').default('BRL'),

    // Installments
    maxInstallments: integer('max_installments').default(1),
    installmentPrice: real('installment_price'), // if null, calculated from fullPrice/maxInstallments

    // Discounts
    earlyPaymentDiscountPercent: real('early_payment_discount_percent').default(0),
    earlyPaymentDays: integer('early_payment_days').default(5),

    // Late fees
    latePaymentFeePercent: real('late_payment_fee_percent').default(2),
    latePaymentFeeFixed: real('late_payment_fee_fixed').default(0),

    // Payment split configuration (for courses taught by teachers)
    teacherId: text('teacher_id').references(() => persons.id),
    teacherPercentage: real('teacher_percentage').default(0), // Override from teacher profile
    schoolPercentage: real('school_percentage').default(100),

    // Platform fee (for external teachers)
    platformFeePercent: real('platform_fee_percent').default(5),
    transactionFeePercent: real('transaction_fee_percent').default(2.5),

    isActive: integer('is_active').default(1),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_course_pricing_course').on(table.courseId),
    index('idx_course_pricing_teacher').on(table.teacherId),
]);

// ============================================================================
// FINANCIAL: School Services (for external teachers)
// ============================================================================

export const schoolServices = sqliteTable('school_services', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').references(() => organizations.id),

    name: text('name').notNull(),
    description: text('description'),

    // Pricing
    priceType: text('price_type', { enum: ['fixed', 'percentage', 'per_student'] }).notNull(),
    price: real('price').notNull(),

    // Category
    category: text('category', {
        enum: ['room_rental', 'equipment', 'marketing', 'admin', 'platform', 'other']
    }).notNull(),

    isActive: integer('is_active').default(1),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
});

// ============================================================================
// ACCOUNTING: Chart of Accounts (Plano de Contas - Lucro Real)
// ============================================================================

export const chartOfAccounts = sqliteTable('chart_of_accounts', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Account code (e.g., "1.1.01.001" - hierarchical)
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),

    // Account type following Brazilian accounting standards
    accountType: text('account_type', {
        enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
    }).notNull(),

    // Account nature for double-entry
    nature: text('nature', { enum: ['debit', 'credit'] }).notNull(),

    // Account classification (Brazilian: Ativo Circulante, Passivo Não Circulante, etc.)
    classification: text('classification', {
        enum: [
            // Assets
            'current_asset', 'non_current_asset', 'fixed_asset', 'intangible_asset',
            // Liabilities
            'current_liability', 'non_current_liability',
            // Equity
            'capital', 'reserves', 'retained_earnings',
            // Revenue
            'operating_revenue', 'financial_revenue', 'other_revenue',
            // Expenses
            'cost_of_services', 'operating_expense', 'financial_expense', 'tax_expense', 'personnel_expense'
        ]
    }).notNull(),

    // Hierarchy
    parentId: text('parent_id'),
    level: integer('level').default(1), // 1 = group, 2 = subgroup, 3 = account, 4 = subaccount

    // Control flags
    allowsPosting: integer('allows_posting').default(1), // Can receive journal entries
    isSystem: integer('is_system').default(0), // System-generated, can't delete
    isActive: integer('is_active').default(1),

    // Tax integration
    cofinsApplicable: integer('cofins_applicable').default(0),
    pisApplicable: integer('pis_applicable').default(0),
    csllApplicable: integer('csll_applicable').default(0),
    irpjApplicable: integer('irpj_applicable').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_chart_accounts_org').on(table.organizationId),
    uniqueIndex('idx_chart_accounts_code').on(table.organizationId, table.code),
    index('idx_chart_accounts_type').on(table.accountType),
    index('idx_chart_accounts_parent').on(table.parentId),
]);

// ============================================================================
// ACCOUNTING: Cost Centers (Centros de Custo)
// ============================================================================

export const costCenters = sqliteTable('cost_centers', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),

    // Hierarchy
    parentId: text('parent_id'),
    level: integer('level').default(1),

    // Type
    centerType: text('center_type', {
        enum: ['department', 'project', 'branch', 'product_line', 'other']
    }).default('department'),

    // Responsible
    managerId: text('manager_id').references(() => persons.id),

    // Budget tracking
    annualBudgetCents: integer('annual_budget_cents'),
    monthlyBudgetCents: integer('monthly_budget_cents'),

    isActive: integer('is_active').default(1),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_cost_centers_org').on(table.organizationId),
    uniqueIndex('idx_cost_centers_code').on(table.organizationId, table.code),
]);

// ============================================================================
// ACCOUNTING: Journal Entries (Lançamentos Contábeis - Double Entry)
// ============================================================================

export const journalEntries = sqliteTable('journal_entries', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Entry identification
    entryNumber: integer('entry_number'), // Sequential within period
    referenceDate: integer('reference_date').notNull(), // Competência
    postingDate: integer('posting_date').notNull(), // Data de lançamento

    // Fiscal period
    fiscalYear: integer('fiscal_year').notNull(),
    fiscalMonth: integer('fiscal_month').notNull(),

    // Description and documentation
    description: text('description').notNull(),
    memo: text('memo'),

    // Source document type
    sourceType: text('source_type', {
        enum: ['invoice', 'payable', 'payroll', 'transfer', 'adjustment', 'opening', 'closing', 'manual']
    }).notNull(),
    sourceId: text('source_id'), // Reference to invoice, payable, payroll, etc.

    // Status
    status: text('status', {
        enum: ['draft', 'posted', 'reversed', 'cancelled']
    }).default('draft'),

    // Reversal info
    isReversal: integer('is_reversal').default(0),
    reversesEntryId: text('reverses_entry_id'),
    reversedByEntryId: text('reversed_by_entry_id'),

    // Audit trail
    createdBy: text('created_by').notNull().references(() => persons.id),
    postedBy: text('posted_by').references(() => persons.id),
    postedAt: integer('posted_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_journal_entries_org').on(table.organizationId, table.fiscalYear, table.fiscalMonth),
    index('idx_journal_entries_date').on(table.referenceDate),
    index('idx_journal_entries_source').on(table.sourceType, table.sourceId),
    index('idx_journal_entries_number').on(table.organizationId, table.entryNumber),
]);

// ============================================================================
// ACCOUNTING: Journal Entry Lines (Partidas - Debit/Credit)
// ============================================================================

export const journalEntryLines = sqliteTable('journal_entry_lines', {
    id: text('id').primaryKey().default(uuid()),
    entryId: text('entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),

    // Account
    accountId: text('account_id').notNull().references(() => chartOfAccounts.id),

    // Cost center (optional)
    costCenterId: text('cost_center_id').references(() => costCenters.id),

    // Amount (always positive, type determines debit/credit)
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').default('BRL'),

    // Debit or Credit
    entryType: text('entry_type', { enum: ['debit', 'credit'] }).notNull(),

    // Line description (can differ from main entry)
    description: text('description'),

    // Tax information
    taxCode: text('tax_code'),
    taxAmountCents: integer('tax_amount_cents'),

    // Document reference
    documentNumber: text('document_number'),
    documentDate: integer('document_date'),

    lineNumber: integer('line_number').notNull(),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_journal_lines_entry').on(table.entryId),
    index('idx_journal_lines_account').on(table.accountId),
    index('idx_journal_lines_cost_center').on(table.costCenterId),
]);

// ============================================================================
// FISCAL: Tax Documents (NF-e, NFS-e integration)
// ============================================================================

export const fiscalDocuments = sqliteTable('fiscal_documents', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Document type
    documentType: text('document_type', {
        enum: ['nfse', 'nfe', 'nfce', 'cte', 'recibo', 'other']
    }).notNull(),

    // Document info
    documentNumber: text('document_number'),
    series: text('series'),
    accessKey: text('access_key'), // Chave de acesso (44 digits for NF-e)
    verificationCode: text('verification_code'), // Código de verificação NFS-e

    // Dates
    issueDate: integer('issue_date').notNull(),
    competenceDate: integer('competence_date'), // For services (NFS-e)

    // Parties
    issuerId: text('issuer_id').references(() => persons.id), // Can be org or individual
    issuerDocument: text('issuer_document'), // CNPJ/CPF
    issuerName: text('issuer_name'),

    recipientId: text('recipient_id').references(() => persons.id),
    recipientDocument: text('recipient_document'),
    recipientName: text('recipient_name'),

    // Amounts
    totalAmountCents: integer('total_amount_cents').notNull(),
    netAmountCents: integer('net_amount_cents'),

    // Tax breakdown
    issAmountCents: integer('iss_amount_cents'),
    issRate: real('iss_rate'),
    pisAmountCents: integer('pis_amount_cents'),
    cofinsAmountCents: integer('cofins_amount_cents'),
    irAmountCents: integer('ir_amount_cents'),
    csllAmountCents: integer('csll_amount_cents'),
    inssAmountCents: integer('inss_amount_cents'),

    // Tax retention
    issWithheld: integer('iss_withheld').default(0),
    irWithheld: integer('ir_withheld').default(0),
    pisWithheld: integer('pis_withheld').default(0),
    cofinsWithheld: integer('cofins_withheld').default(0),
    csllWithheld: integer('csll_withheld').default(0),
    inssWithheld: integer('inss_withheld').default(0),

    // Service code (for NFS-e)
    serviceCode: text('service_code'),
    serviceDescription: text('service_description'),
    cityServiceCode: text('city_service_code'),

    // Status
    status: text('status', {
        enum: ['draft', 'processing', 'authorized', 'cancelled', 'rejected', 'denied']
    }).default('draft'),

    // Integration
    externalId: text('external_id'), // Provider's ID
    xmlUrl: text('xml_url'),
    pdfUrl: text('pdf_url'),

    // Cancellation
    cancelledAt: integer('cancelled_at'),
    cancellationReason: text('cancellation_reason'),

    // Linked records
    invoiceId: text('invoice_id'),
    payableId: text('payable_id'),
    payrollId: text('payroll_id'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_fiscal_docs_org').on(table.organizationId),
    index('idx_fiscal_docs_type').on(table.documentType, table.issueDate),
    index('idx_fiscal_docs_issuer').on(table.issuerDocument),
    index('idx_fiscal_docs_recipient').on(table.recipientDocument),
    uniqueIndex('idx_fiscal_docs_access_key').on(table.accessKey),
]);

// ============================================================================
// FISCAL: Tax Withholdings Register (DIRF preparation)
// ============================================================================

export const taxWithholdings = sqliteTable('tax_withholdings', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Period
    fiscalYear: integer('fiscal_year').notNull(),
    fiscalMonth: integer('fiscal_month').notNull(),

    // Beneficiary (recipient of payment)
    beneficiaryId: text('beneficiary_id').references(() => persons.id),
    beneficiaryDocument: text('beneficiary_document').notNull(), // CPF/CNPJ
    beneficiaryName: text('beneficiary_name').notNull(),

    // Tax type
    taxType: text('tax_type', {
        enum: ['irrf', 'pis', 'cofins', 'csll', 'inss', 'iss']
    }).notNull(),

    // Amounts
    grossAmountCents: integer('gross_amount_cents').notNull(),
    taxableBaseCents: integer('taxable_base_cents').notNull(),
    withheldAmountCents: integer('withheld_amount_cents').notNull(),
    taxRate: real('tax_rate'),

    // Tax code (DARF code for federal, etc.)
    taxCode: text('tax_code'),

    // Source document
    sourceType: text('source_type', {
        enum: ['invoice', 'payable', 'payroll', 'service_payment']
    }),
    sourceId: text('source_id'),
    fiscalDocumentId: text('fiscal_document_id').references(() => fiscalDocuments.id),

    // Payment info
    paymentDate: integer('payment_date'),
    darfNumber: text('darf_number'), // DARF payment reference
    darfPaidAt: integer('darf_paid_at'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_tax_withholdings_org').on(table.organizationId, table.fiscalYear, table.fiscalMonth),
    index('idx_tax_withholdings_beneficiary').on(table.beneficiaryDocument, table.fiscalYear),
    index('idx_tax_withholdings_type').on(table.taxType, table.fiscalMonth),
]);

// ============================================================================
// FINANCIAL: Invoices
// ============================================================================


export const invoices = sqliteTable('invoices', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').references(() => organizations.id),

    // Who pays
    payerUserId: text('payer_user_id').notNull().references(() => persons.id),
    payerName: text('payer_name').notNull(),
    payerEmail: text('payer_email'),
    payerTaxId: text('payer_tax_id'), // CPF/CNPJ

    // For whom (student)
    studentUserId: text('student_user_id').references(() => persons.id),
    studentName: text('student_name'),

    // What
    courseId: text('course_id').references(() => courses.id),
    description: text('description').notNull(),

    // Amounts
    grossAmount: real('gross_amount').notNull(),
    discountAmount: real('discount_amount').default(0),
    feeAmount: real('fee_amount').default(0),
    netAmount: real('net_amount').notNull(),
    currency: text('currency').default('BRL'),

    // Installment info
    installmentNumber: integer('installment_number'),
    totalInstallments: integer('total_installments'),

    // Dates
    dueDate: integer('due_date').notNull(),
    paidDate: integer('paid_date'),

    // Status
    status: text('status', {
        enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded']
    }).default('pending'),

    // Payment info
    paymentMethod: text('payment_method', { enum: ['pix', 'credit_card', 'boleto', 'transfer'] }),
    paymentProvider: text('payment_provider'), // 'internal', 'stripe', 'clerk', etc.
    externalPaymentId: text('external_payment_id'),

    // Split configuration at time of invoice
    splitConfig: text('split_config').default('{}'), // JSON with percentage splits

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_invoices_payer').on(table.payerUserId),
    index('idx_invoices_student').on(table.studentUserId),
    index('idx_invoices_course').on(table.courseId),
    index('idx_invoices_status').on(table.status, table.dueDate),
]);

// ============================================================================
// FINANCIAL: Transactions (payment splits)
// ============================================================================

export const transactions = sqliteTable('transactions', {
    id: text('id').primaryKey().default(uuid()),
    invoiceId: text('invoice_id').references(() => invoices.id),
    organizationId: text('organization_id').references(() => organizations.id),

    // Transaction type
    type: text('type', {
        enum: ['payment_received', 'teacher_payout', 'school_revenue', 'platform_fee', 'service_fee', 'refund']
    }).notNull(),

    // Related user (teacher for payouts, school for revenue)
    personId: text('person_id').references(() => persons.id),

    // Amounts
    amount: real('amount').notNull(),
    currency: text('currency').default('BRL'),

    // For service fees
    serviceId: text('service_id').references(() => schoolServices.id),

    // Status
    status: text('status', {
        enum: ['pending', 'completed', 'failed', 'cancelled']
    }).default('pending'),

    // Payout info (for teacher payouts)
    payoutMethod: text('payout_method', { enum: ['pix', 'transfer', 'manual'] }),
    payoutReference: text('payout_reference'),
    payoutDate: integer('payout_date'),

    description: text('description'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_transactions_invoice').on(table.invoiceId),
    index('idx_transactions_person').on(table.personId, table.createdAt),
    index('idx_transactions_type').on(table.type, table.status),
]);

// ============================================================================
// ============================================================================
// FINANCIAL MODULE - COMPLETE MONEY MANAGEMENT
// ============================================================================
// ============================================================================

// ============================================================================
// FINANCIAL: Payment Gateway Configurations
// Per-organization gateway setup (Pagar.me, Asaas, etc.)
// ============================================================================

export const paymentGateways = sqliteTable('payment_gateways', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Provider
    provider: text('provider', {
        enum: ['pagarme', 'asaas', 'iugu', 'pagbank', 'stripe', 'mercadopago', 'manual']
    }).notNull(),

    // Credentials (encrypted)
    apiKeyEncrypted: text('api_key_encrypted'),
    secretKeyEncrypted: text('secret_key_encrypted'),
    webhookSecret: text('webhook_secret'),

    // Account info
    accountId: text('account_id'),        // Provider's account/wallet ID
    accountName: text('account_name'),

    // Modes
    isProduction: integer('is_production', { mode: 'boolean' }).default(false),
    isDefault: integer('is_default', { mode: 'boolean' }).default(false),

    // Supported methods
    supportsPix: integer('supports_pix', { mode: 'boolean' }).default(true),
    supportsBoleto: integer('supports_boleto', { mode: 'boolean' }).default(true),
    supportsCard: integer('supports_card', { mode: 'boolean' }).default(true),
    supportsSplit: integer('supports_split', { mode: 'boolean' }).default(true),

    // Fees
    pixFeePercent: real('pix_fee_percent'),
    boletoFeeCents: integer('boleto_fee_cents'),
    cardFeePercent: real('card_fee_percent'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_payment_gateways_org').on(table.organizationId),
    index('idx_payment_gateways_provider').on(table.provider),
]);

// ============================================================================
// FINANCIAL: Split Recipients
// Bank accounts/wallets that receive automatic splits
// ============================================================================

export const splitRecipients = sqliteTable('split_recipients', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Who receives the split
    recipientType: text('recipient_type', {
        enum: [
            'teacher',           // Teacher commission
            'salesperson',       // Sales commission
            'franchisor',        // Franchise fee
            'partner',           // Business partner
            'platform',          // Platform fee (NodeZero)
            'owner',             // School owner
            'investor',          // Investor payout
            'employee',          // Employee bonus
            'other'
        ]
    }).notNull(),

    // User reference (if applicable)
    personId: text('person_id').references(() => persons.id),

    // Display
    name: text('name').notNull(),
    description: text('description'),

    // Gateway details
    gatewayId: text('gateway_id').references(() => paymentGateways.id),
    externalRecipientId: text('external_recipient_id'),  // Pagar.me recipient_id, Asaas wallet_id

    // Bank account details (for manual/backup)
    bankCode: text('bank_code'),
    bankName: text('bank_name'),
    accountType: text('account_type', {
        enum: ['checking', 'savings']
    }),
    branchNumber: text('branch_number'),
    accountNumber: text('account_number'),
    accountDigit: text('account_digit'),
    holderName: text('holder_name'),
    holderDocument: text('holder_document'),     // CPF/CNPJ
    holderType: text('holder_type', {
        enum: ['individual', 'company']
    }),

    // PIX key (preferred)
    pixKeyType: text('pix_key_type', {
        enum: ['cpf', 'cnpj', 'email', 'phone', 'random']
    }),
    pixKey: text('pix_key'),

    // Transfer settings
    automaticTransfer: integer('automatic_transfer', { mode: 'boolean' }).default(true),
    transferDay: integer('transfer_day'),         // Day of month for transfers
    minimumTransferCents: integer('minimum_transfer_cents'),

    // Verification
    isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
    verifiedAt: integer('verified_at'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_split_recipients_org').on(table.organizationId),
    index('idx_split_recipients_person').on(table.personId),
    index('idx_split_recipients_type').on(table.recipientType),
]);

// ============================================================================
// FINANCIAL: Split Rules
// Configurable split rules for automatic payment distribution
// ============================================================================

export const splitRules = sqliteTable('split_rules', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    description: text('description'),

    // What triggers this split
    triggerType: text('trigger_type', {
        enum: [
            'tuition',           // Monthly tuition
            'enrollment',        // Enrollment fee
            'material',          // Material purchase
            'exam',              // Exam fee
            'workshop',          // Workshop/event
            'all_revenue',       // All incoming revenue
            'specific_course',   // Specific course only
            'specific_program',  // Specific program only
            'other'
        ]
    }).notNull(),

    // Optional reference to what this applies to
    programId: text('program_id').references(() => schoolPrograms.id),

    // Priority (for rule matching)
    priority: integer('priority').default(0),

    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_split_rules_org').on(table.organizationId, table.isActive),
    index('idx_split_rules_trigger').on(table.triggerType),
]);

// ============================================================================
// FINANCIAL: Split Rule Items
// Individual recipients and percentages within a split rule
// ============================================================================

export const splitRuleItems = sqliteTable('split_rule_items', {
    id: text('id').primaryKey().default(uuid()),
    ruleId: text('rule_id').notNull().references(() => splitRules.id, { onDelete: 'cascade' }),

    // Recipient
    recipientId: text('recipient_id').notNull().references(() => splitRecipients.id),

    // Split type
    splitType: text('split_type', {
        enum: ['percentage', 'fixed', 'remainder']
    }).notNull(),

    // Amount
    percentValue: real('percent_value'),          // If percentage: 0-100
    fixedAmountCents: integer('fixed_amount_cents'), // If fixed

    // Order (for remainder calculation)
    orderIndex: integer('order_index').default(0),

    // Caps
    maxAmountCents: integer('max_amount_cents'),  // Maximum this recipient gets
    minAmountCents: integer('min_amount_cents'),  // Minimum this recipient gets

    // When the split gets executed
    chargeableOnPayment: integer('chargeable_on_payment', { mode: 'boolean' }).default(true),
    transferImmediately: integer('transfer_immediately', { mode: 'boolean' }).default(false),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_split_rule_items_rule').on(table.ruleId),
    index('idx_split_rule_items_recipient').on(table.recipientId),
]);

// ============================================================================
// FINANCIAL: Receivables (Student Installments)
// From contracts -> creates receivables
// ============================================================================

export const receivables = sqliteTable('receivables', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Source
    contractId: text('contract_id').references(() => contracts.id),
    enrollmentId: text('enrollment_id').references(() => enrollments.id),
    invoiceId: text('invoice_id').references(() => invoices.id),

    // Who owes / for whom
    payerUserId: text('payer_user_id').references(() => persons.id),  // Who pays (parent/guardian)
    studentUserId: text('student_user_id').references(() => persons.id),  // The student

    // Installment info
    installmentNumber: integer('installment_number'),
    totalInstallments: integer('total_installments'),

    // Description
    description: text('description').notNull(),
    referenceMonth: integer('reference_month'),   // Month this refers to

    // Amounts
    originalAmountCents: integer('original_amount_cents').notNull(),
    discountCents: integer('discount_cents').default(0),
    interestCents: integer('interest_cents').default(0),
    finesCents: integer('fines_cents').default(0),
    netAmountCents: integer('net_amount_cents').notNull(),   // After discounts

    // Payment status
    paidAmountCents: integer('paid_amount_cents').default(0),
    remainingAmountCents: integer('remaining_amount_cents'),

    // Dates
    dueDate: integer('due_date').notNull(),
    paymentDate: integer('payment_date'),
    competenceDate: integer('competence_date'),   // Accounting period

    // Status
    status: text('status', {
        enum: ['pending', 'paid', 'partial', 'overdue', 'negotiating', 'cancelled', 'refunded']
    }).default('pending'),

    // Payment info
    paymentMethod: text('payment_method', {
        enum: ['pix', 'boleto', 'credit_card', 'debit_card', 'cash', 'transfer', 'check']
    }),
    paymentGatewayId: text('payment_gateway_id').references(() => paymentGateways.id),
    externalPaymentId: text('external_payment_id'),
    externalBoletoUrl: text('external_boleto_url'),
    externalPixCode: text('external_pix_code'),

    // Split info (if automatic split applied)
    splitRuleId: text('split_rule_id').references(() => splitRules.id),
    splitExecuted: integer('split_executed', { mode: 'boolean' }).default(false),
    splitExecutedAt: integer('split_executed_at'),

    // Dunning
    daysOverdue: integer('days_overdue').default(0),
    remindersSent: integer('reminders_sent').default(0),
    lastReminderAt: integer('last_reminder_at'),

    // Notes
    notes: text('notes'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_receivables_org').on(table.organizationId, table.status),
    index('idx_receivables_payer').on(table.payerUserId),
    index('idx_receivables_student').on(table.studentUserId),
    index('idx_receivables_due').on(table.dueDate, table.status),
    index('idx_receivables_contract').on(table.contractId),
]);

// ============================================================================
// FINANCIAL: Receivable Payments
// Partial payments on receivables
// ============================================================================

export const receivablePayments = sqliteTable('receivable_payments', {
    id: text('id').primaryKey().default(uuid()),
    receivableId: text('receivable_id').notNull().references(() => receivables.id, { onDelete: 'cascade' }),

    // Amount
    amountCents: integer('amount_cents').notNull(),

    // Payment info
    paymentMethod: text('payment_method', {
        enum: ['pix', 'boleto', 'credit_card', 'debit_card', 'cash', 'transfer', 'check']
    }).notNull(),

    // Gateway processing
    gatewayId: text('gateway_id').references(() => paymentGateways.id),
    externalTransactionId: text('external_transaction_id'),
    gatewayResponse: text('gateway_response'),    // JSON response from gateway

    // Status
    status: text('status', {
        enum: ['initiated', 'processing', 'confirmed', 'failed', 'refunded']
    }).default('initiated'),

    // Timestamps
    initiatedAt: integer('initiated_at').default(timestamp()),
    confirmedAt: integer('confirmed_at'),
    failedAt: integer('failed_at'),
    failureReason: text('failure_reason'),

    // Received by (for cash/check)
    receivedBy: text('received_by').references(() => persons.id),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_receivable_payments_receivable').on(table.receivableId),
    index('idx_receivable_payments_external').on(table.externalTransactionId),
]);

// ============================================================================
// FINANCIAL: Money Flows (Chain of Custody)
// Track every movement of money through the system
// ============================================================================

export const moneyFlows = sqliteTable('money_flows', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Source and destination
    flowType: text('flow_type', {
        enum: [
            'payment_received',      // Customer paid
            'split_executed',        // Money split to recipient
            'transfer_out',          // Money sent to bank account
            'transfer_in',           // Money received from bank
            'refund_issued',         // Refund to customer
            'fee_charged',           // Gateway/platform fee
            'commission_paid',       // Commission payout
            'prize_paid',            // Prize/bonus payout
            'advance_issued',        // Salary advance
            'adjustment',            // Manual adjustment
            'opening_balance',       // Starting balance
        ]
    }).notNull(),

    // References
    receivableId: text('receivable_id').references(() => receivables.id),
    receivablePaymentId: text('receivable_payment_id').references(() => receivablePayments.id),
    splitRecipientId: text('split_recipient_id').references(() => splitRecipients.id),
    transactionId: text('transaction_id').references(() => transactions.id),

    // Amount
    amountCents: integer('amount_cents').notNull(),
    direction: text('direction', {
        enum: ['in', 'out']
    }).notNull(),

    // Balance tracking (running balance)
    balanceBeforeCents: integer('balance_before_cents'),
    balanceAfterCents: integer('balance_after_cents'),

    // Where's the money?
    location: text('location', {
        enum: [
            'gateway_pending',       // Waiting in gateway
            'gateway_available',     // Available in gateway
            'school_bank',           // School's bank account
            'recipient_pending',     // Pending transfer to recipient
            'recipient_paid',        // Paid to recipient
            'customer_refunded',     // Returned to customer
        ]
    }).notNull(),

    // Description
    description: text('description'),

    // Reconciliation
    isReconciled: integer('is_reconciled', { mode: 'boolean' }).default(false),
    reconciledAt: integer('reconciled_at'),
    reconciledBy: text('reconciled_by').references(() => persons.id),
    bankStatementRef: text('bank_statement_ref'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_money_flows_org').on(table.organizationId, table.createdAt),
    index('idx_money_flows_type').on(table.flowType),
    index('idx_money_flows_location').on(table.location),
    index('idx_money_flows_reconciled').on(table.isReconciled),
]);

// ============================================================================
// FINANCIAL: Commission Payouts
// Sales/teacher commissions and bonuses
// ============================================================================

export const commissionPayouts = sqliteTable('commission_payouts', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Recipient
    personId: text('person_id').notNull().references(() => persons.id),
    recipientId: text('recipient_id').references(() => splitRecipients.id),

    // Commission type
    commissionType: text('commission_type', {
        enum: [
            'enrollment',        // New student enrollment
            'renewal',           // Student renewal
            'material_sale',     // Material sales
            'referral',          // Referral bonus
            'class_taught',      // Per-class commission
            'performance',       // Performance bonus
            'prize',             // Contest/prize
            'other'
        ]
    }).notNull(),

    // Source reference
    enrollmentId: text('enrollment_id').references(() => enrollments.id),
    receivableId: text('receivable_id').references(() => receivables.id),
    sourceDescription: text('source_description'),

    // Calculation
    baseAmountCents: integer('base_amount_cents'),      // What the commission is calculated on
    commissionPercent: real('commission_percent'),
    fixedAmountCents: integer('fixed_amount_cents'),

    // Final amount
    grossAmountCents: integer('gross_amount_cents').notNull(),
    deductionsCents: integer('deductions_cents').default(0),
    netAmountCents: integer('net_amount_cents').notNull(),

    // Status
    status: text('status', {
        enum: ['pending', 'approved', 'scheduled', 'paid', 'cancelled']
    }).default('pending'),

    // Approval
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),

    // Payment
    paymentMethod: text('payment_method', {
        enum: ['split_automatic', 'pix', 'transfer', 'payroll', 'cash']
    }),
    paidAt: integer('paid_at'),
    paymentReference: text('payment_reference'),

    // Notes
    notes: text('notes'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_commission_payouts_person').on(table.personId, table.status),
    index('idx_commission_payouts_type').on(table.commissionType),
    index('idx_commission_payouts_status').on(table.status),
]);

// ============================================================================
// FINANCIAL: Financial Goals
// Budgets, targets, and projections
// ============================================================================

export const financialGoals = sqliteTable('financial_goals', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Period
    year: integer('year').notNull(),
    month: integer('month'),                      // Null = annual goal
    quarter: integer('quarter'),                  // 1-4 for quarterly goals

    // Goal type
    goalType: text('goal_type', {
        enum: [
            'revenue',           // Total revenue
            'enrollments',       // New enrollments count
            'renewals',          // Renewal count
            'collections',       // Money collected
            'expenses',          // Expense budget
            'profit',            // Net profit
            'student_count',     // Active students
            'cost_center',       // Specific cost center
            'sales_target',      // Sales team target
            'custom'
        ]
    }).notNull(),

    name: text('name').notNull(),
    description: text('description'),

    // For cost center specific goals
    costCenterId: text('cost_center_id').references(() => costCenters.id),

    // Target values
    targetAmountCents: integer('target_amount_cents'),
    targetCount: integer('target_count'),         // For count-based goals
    targetPercent: real('target_percent'),        // For percentage goals

    // Actual values (updated periodically)
    actualAmountCents: integer('actual_amount_cents'),
    actualCount: integer('actual_count'),
    actualPercent: real('actual_percent'),

    // Comparison
    previousPeriodAmountCents: integer('previous_period_amount_cents'),
    previousPeriodCount: integer('previous_period_count'),

    // Progress
    progressPercent: real('progress_percent').default(0),

    // Status
    status: text('status', {
        enum: ['draft', 'active', 'achieved', 'missed', 'archived']
    }).default('draft'),

    // Alerts
    alertThreshold: real('alert_threshold'),      // Percent of period elapsed when to alert
    alertSent: integer('alert_sent', { mode: 'boolean' }).default(false),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_financial_goals_org').on(table.organizationId, table.year),
    index('idx_financial_goals_type').on(table.goalType, table.status),
]);

// ============================================================================
// FINANCIAL: Organization Financial Settings
// Per-org financial preferences
// ============================================================================

export const organizationFinancialSettings = sqliteTable('organization_financial_settings', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Money management mode
    moneyManagementMode: text('money_management_mode', {
        enum: [
            'direct_split',          // Money goes directly to recipients (never touches school)
            'school_managed',        // School receives all, distributes manually
            'hybrid'                 // Some automatic, some manual
        ]
    }).default('school_managed'),

    // Default gateway
    defaultGatewayId: text('default_gateway_id').references(() => paymentGateways.id),

    // Default split rule (if any)
    defaultSplitRuleId: text('default_split_rule_id').references(() => splitRules.id),

    // Late payment settings
    lateFeeType: text('late_fee_type', {
        enum: ['none', 'percentage', 'fixed', 'daily_percent']
    }).default('percentage'),
    lateFeePercent: real('late_fee_percent').default(2),
    lateFeeCents: integer('late_fee_cents'),
    lateFeeInterestMonthly: real('late_fee_interest_monthly').default(1),  // Mora mensal

    // Early payment discount
    earlyPaymentDiscountPercent: real('early_payment_discount_percent'),
    earlyPaymentDays: integer('early_payment_days'),

    // Dunning settings
    reminderDays: text('reminder_days').default('[3, 7, 15, 30]'),   // Days before/after due date
    autoSendReminders: integer('auto_send_reminders', { mode: 'boolean' }).default(true),

    // Invoice settings
    invoiceDueDay: integer('invoice_due_day').default(10),           // Day of month invoices are due
    invoicePrefix: text('invoice_prefix'),
    nextInvoiceNumber: integer('next_invoice_number').default(1),

    // Bank account (for deposits)
    mainBankAccountId: text('main_bank_account_id').references(() => splitRecipients.id),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_org_financial_settings_org').on(table.organizationId),
]);

// ============================================================================
// FINANCIAL: Teacher Payouts (aggregated monthly)
// ============================================================================

export const teacherPayouts = sqliteTable('teacher_payouts', {
    id: text('id').primaryKey().default(uuid()),
    teacherId: text('teacher_id').notNull().references(() => persons.id),
    organizationId: text('organization_id').references(() => organizations.id),

    // Period
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),

    // Amounts
    grossAmount: real('gross_amount').notNull(),
    deductions: real('deductions').default(0), // Room rental, services, etc.
    netAmount: real('net_amount').notNull(),
    currency: text('currency').default('BRL'),

    // Breakdown (JSON)
    breakdown: text('breakdown').default('{}'),

    // Status
    status: text('status', {
        enum: ['calculating', 'pending_approval', 'approved', 'paid', 'disputed']
    }).default('calculating'),

    // Payment
    paidDate: integer('paid_date'),
    payoutReference: text('payout_reference'),

    // Approval
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_teacher_payouts_teacher').on(table.teacherId, table.periodStart),
    index('idx_teacher_payouts_status').on(table.status),
]);

// ============================================================================
// FINANCIAL: Payables (Accounts Payable - vendor bills, expenses)
// ============================================================================

export const payables = sqliteTable('payables', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Vendor info
    vendorName: text('vendor_name').notNull(),
    vendorDocument: text('vendor_document'), // CNPJ/CPF

    // Invoice details
    invoiceNumber: text('invoice_number'),
    invoiceUrl: text('invoice_url'), // Uploaded file URL
    description: text('description'),

    // Category
    category: text('category', {
        enum: ['rent', 'utilities', 'supplies', 'marketing', 'software', 'maintenance', 'insurance', 'taxes', 'payroll', 'other']
    }).notNull().default('other'),

    // Amounts
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').default('BRL'),

    // Dates
    issueDate: integer('issue_date'),
    dueDate: integer('due_date').notNull(),
    paidDate: integer('paid_date'),

    // Status
    status: text('status', {
        enum: ['pending', 'scheduled', 'paid', 'overdue', 'cancelled', 'disputed']
    }).default('pending'),

    // Payment details
    paymentMethod: text('payment_method'),
    paymentReference: text('payment_reference'),

    // Recurrence
    isRecurring: integer('is_recurring').default(0),
    recurrenceInterval: text('recurrence_interval', {
        enum: ['monthly', 'quarterly', 'annually']
    }),
    parentPayableId: text('parent_payable_id'),

    // Notes
    notes: text('notes'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_payables_org').on(table.organizationId),
    index('idx_payables_due').on(table.dueDate, table.status),
    index('idx_payables_category').on(table.category),
]);

// ============================================================================
// HR: Staff Contracts (non-teaching employees)
// ============================================================================

export const staffContracts = sqliteTable('staff_contracts', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),

    // Role and Department
    jobTitle: text('job_title').notNull(),
    department: text('department', {
        enum: ['admin', 'reception', 'marketing', 'finance', 'maintenance', 'it', 'management', 'other']
    }).notNull().default('admin'),

    // Contract type
    contractType: text('contract_type', {
        enum: ['clt', 'pj', 'freelance', 'intern', 'volunteer']
    }).notNull(),

    // Compensation
    salaryCents: integer('salary_cents'),
    hourlyRateCents: integer('hourly_rate_cents'),

    // Working hours
    weeklyHours: real('weekly_hours').default(40),
    workSchedule: text('work_schedule').default('{}'), // JSON: {mon: {start, end}, tue: {...}}

    // Access level
    accessLevel: text('access_level', {
        enum: ['basic', 'standard', 'admin', 'super_admin']
    }).default('basic'),

    // Dates
    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at'),

    // Status
    status: text('status', {
        enum: ['draft', 'active', 'on_leave', 'suspended', 'terminated']
    }).default('active'),

    // Benefits (JSON)
    benefits: text('benefits').default('{}'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_staff_contracts_person').on(table.personId),
    index('idx_staff_contracts_org').on(table.organizationId),
    index('idx_staff_contracts_dept').on(table.department),
]);

// ============================================================================
// HR: Staff Leave/Time Off
// ============================================================================

export const staffLeave = sqliteTable('staff_leave', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    contractId: text('contract_id').references(() => staffContracts.id),

    leaveType: text('leave_type', {
        enum: ['vacation', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'other']
    }).notNull(),

    startDate: integer('start_date').notNull(),
    endDate: integer('end_date').notNull(),

    status: text('status', {
        enum: ['pending', 'approved', 'rejected', 'cancelled']
    }).default('pending'),

    reason: text('reason'),
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_staff_leave_person').on(table.personId, table.startDate),
]);

// ============================================================================
// PAYROLL: Staff Payroll (receivables from org to staff)
// ============================================================================

export const staffPayroll = sqliteTable('staff_payroll', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    contractId: text('contract_id').notNull().references(() => staffContracts.id),
    personId: text('person_id').notNull().references(() => persons.id),

    // Period (for salary/hourly calculations)
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),
    paymentDueDate: integer('payment_due_date').notNull(),

    // Payroll type
    payrollType: text('payroll_type', {
        enum: ['salary', 'hourly', 'bonus', 'commission', 'reimbursement', 'advance', 'other']
    }).notNull().default('salary'),

    // Gross amounts (before deductions)
    grossAmountCents: integer('gross_amount_cents').notNull(),

    // Deductions breakdown (JSON: {inss: cents, irrf: cents, benefits: cents, ...})
    deductions: text('deductions').default('{}'),
    totalDeductionsCents: integer('total_deductions_cents').default(0),

    // Additions (overtime, bonuses)
    additions: text('additions').default('{}'),
    totalAdditionsCents: integer('total_additions_cents').default(0),

    // Net amount (what staff receives)
    netAmountCents: integer('net_amount_cents').notNull(),
    currency: text('currency').default('BRL'),

    // Hours worked (for hourly contracts)
    hoursWorked: real('hours_worked'),
    hourlyRateCents: integer('hourly_rate_cents'),

    // Attendance/timesheet reference
    timesheetId: text('timesheet_id'),

    // Status workflow
    status: text('status', {
        enum: ['draft', 'pending_approval', 'approved', 'scheduled', 'partially_paid', 'paid', 'cancelled', 'disputed']
    }).default('draft'),

    // Approval chain
    calculatedBy: text('calculated_by').references(() => persons.id),
    calculatedAt: integer('calculated_at'),
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),

    // Payment completion
    paidAt: integer('paid_at'),
    paidAmountCents: integer('paid_amount_cents').default(0), // Track partial payments

    // Notes and attachments
    notes: text('notes'),
    payslipUrl: text('payslip_url'), // Generated payslip PDF

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_staff_payroll_person').on(table.personId, table.periodStart),
    index('idx_staff_payroll_contract').on(table.contractId),
    index('idx_staff_payroll_status').on(table.status, table.paymentDueDate),
    index('idx_staff_payroll_org').on(table.organizationId, table.periodStart),
]);

// ============================================================================
// PAYROLL: Payment Methods (bank accounts, cards, PIX keys)
// ============================================================================

export const paymentMethods = sqliteTable('payment_methods', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    organizationId: text('organization_id').references(() => organizations.id), // Optional, for org-level methods

    // Method type
    methodType: text('method_type', {
        enum: ['bank_account', 'pix', 'credit_card', 'debit_card', 'cash', 'digital_wallet']
    }).notNull(),

    // Display name
    label: text('label').notNull(), // e.g., "Banco do Brasil - Conta Corrente"
    isDefault: integer('is_default').default(0),

    // Bank account details
    bankCode: text('bank_code'),
    bankName: text('bank_name'),
    accountType: text('account_type', { enum: ['checking', 'savings', 'salary'] }),
    accountNumber: text('account_number'),
    accountDigit: text('account_digit'),
    branchNumber: text('branch_number'),
    branchDigit: text('branch_digit'),
    holderName: text('holder_name'),
    holderDocument: text('holder_document'), // CPF/CNPJ

    // PIX details
    pixKeyType: text('pix_key_type', { enum: ['cpf', 'cnpj', 'email', 'phone', 'random'] }),
    pixKey: text('pix_key'),

    // Card details (tokenized, never store full card)
    cardBrand: text('card_brand'),
    cardLast4: text('card_last_4'),
    cardExpiry: text('card_expiry'),
    cardToken: text('card_token'), // Payment provider token

    // Digital wallet
    walletProvider: text('wallet_provider'), // 'mercado_pago', 'picpay', 'paypal'
    walletAccountId: text('wallet_account_id'),

    // Status
    isVerified: integer('is_verified').default(0),
    verifiedAt: integer('verified_at'),
    isActive: integer('is_active').default(1),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_payment_methods_person').on(table.personId, table.methodType),
    index('idx_payment_methods_org').on(table.organizationId),
]);

// ============================================================================
// PAYROLL: Payroll Payments (split payment tracking)
// ============================================================================

export const payrollPayments = sqliteTable('payroll_payments', {
    id: text('id').primaryKey().default(uuid()),
    payrollId: text('payroll_id').notNull().references(() => staffPayroll.id),
    personId: text('person_id').notNull().references(() => persons.id), // Recipient
    paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),

    // Amount for this specific payment
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').default('BRL'),

    // Payment method used (denormalized for history)
    methodType: text('method_type', {
        enum: ['bank_transfer', 'pix', 'credit_card', 'debit_card', 'cash', 'digital_wallet', 'check']
    }).notNull(),

    // Provider integration
    paymentProvider: text('payment_provider'), // 'internal', 'asaas', 'itau', 'bradesco', 'manual'
    externalPaymentId: text('external_payment_id'), // Provider's transaction ID
    externalBatchId: text('external_batch_id'), // For batch transfers

    // Status
    status: text('status', {
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']
    }).default('pending'),

    // Processing dates
    scheduledFor: integer('scheduled_for'),
    processedAt: integer('processed_at'),
    completedAt: integer('completed_at'),
    failedAt: integer('failed_at'),

    // Failure handling
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').default(0),

    // Receipt/proof
    receiptUrl: text('receipt_url'),
    receiptNumber: text('receipt_number'),

    // For cash/manual payments
    paidBy: text('paid_by').references(() => persons.id), // Who gave the cash
    confirmedBy: text('confirmed_by').references(() => persons.id), // Who confirmed receipt

    notes: text('notes'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_payroll_payments_payroll').on(table.payrollId),
    index('idx_payroll_payments_person').on(table.personId, table.status),
    index('idx_payroll_payments_status').on(table.status, table.scheduledFor),
    index('idx_payroll_payments_external').on(table.externalPaymentId),
]);

// ============================================================================
// ============================================================================
// HR MODULE - PEOPLE, TIME, ORG STRUCTURE, TERMINATION PLANNING
// ============================================================================
// ============================================================================

// ============================================================================
// HR: Organization Locations (for geo-fencing)
// ============================================================================

export const organizationLocations = sqliteTable('organization_locations', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),                   // "Sede Principal", "Filial Centro"
    locationType: text('location_type', {
        enum: ['headquarters', 'branch', 'classroom', 'office', 'warehouse', 'other']
    }).default('branch'),

    // Address
    address: text('address'),
    addressNumber: text('address_number'),
    complement: text('complement'),
    neighborhood: text('neighborhood'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    country: text('country').default('BR'),

    // Geo-fence for time logging
    latitude: real('latitude'),
    longitude: real('longitude'),
    geofenceRadiusMeters: integer('geofence_radius_meters').default(100), // 100m default
    allowClockInOutsideGeofence: integer('allow_clock_in_outside_geofence', { mode: 'boolean' }).default(false),

    // Working hours default for this location
    defaultWorkSchedule: text('default_work_schedule').default('{}'),  // JSON

    // Contact
    phone: text('phone'),
    email: text('email'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_org_locations_org').on(table.organizationId),
    index('idx_org_locations_geo').on(table.latitude, table.longitude),
]);

// ============================================================================
// HR: Time Clock Entries (GPS-based attendance)
// ============================================================================

export const timeClockEntries = sqliteTable('time_clock_entries', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),
    contractId: text('contract_id').references(() => staffContracts.id),

    // Clock type
    entryType: text('entry_type', {
        enum: ['clock_in', 'clock_out', 'break_start', 'break_end']
    }).notNull(),

    // Timestamp
    clockedAt: integer('clocked_at').notNull(),

    // GPS data
    latitude: real('latitude'),
    longitude: real('longitude'),
    accuracy: real('accuracy'),               // GPS accuracy in meters
    locationId: text('location_id').references(() => organizationLocations.id),

    // Geo-fence validation
    isWithinGeofence: integer('is_within_geofence', { mode: 'boolean' }),
    distanceFromLocationMeters: real('distance_from_location_meters'),

    // Device info
    deviceType: text('device_type', {
        enum: ['mobile', 'tablet', 'desktop', 'biometric', 'manual']
    }),
    deviceId: text('device_id'),
    ipAddress: text('ip_address'),

    // Override/correction
    isManualEntry: integer('is_manual_entry', { mode: 'boolean' }).default(false),
    manualEntryReason: text('manual_entry_reason'),
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),

    // Photo proof (optional selfie for verification)
    photoUrl: text('photo_url'),

    notes: text('notes'),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_time_clock_person').on(table.personId, table.clockedAt),
    index('idx_time_clock_org').on(table.organizationId, table.clockedAt),
    index('idx_time_clock_location').on(table.locationId),
]);

// ============================================================================
// HR: Time Sheets (daily/weekly summaries)
// ============================================================================

export const timeSheets = sqliteTable('time_sheets', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),
    contractId: text('contract_id').references(() => staffContracts.id),

    // Period
    periodType: text('period_type', {
        enum: ['daily', 'weekly', 'biweekly', 'monthly']
    }).default('monthly'),
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),

    // Hours summary
    scheduledHours: real('scheduled_hours'),           // Expected hours
    workedHours: real('worked_hours'),                 // Actual hours
    overtimeHours: real('overtime_hours').default(0),
    undertimeHours: real('undertime_hours').default(0),
    breakHours: real('break_hours').default(0),

    // Days breakdown
    daysWorked: integer('days_worked'),
    daysAbsent: integer('days_absent'),
    daysLate: integer('days_late'),

    // Status
    status: text('status', {
        enum: ['open', 'submitted', 'approved', 'rejected', 'processed']
    }).default('open'),

    // Approval
    submittedAt: integer('submitted_at'),
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),
    rejectionReason: text('rejection_reason'),

    // Linked payroll
    payrollId: text('payroll_id').references(() => staffPayroll.id),

    notes: text('notes'),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_time_sheets_person').on(table.personId, table.periodStart),
    index('idx_time_sheets_org').on(table.organizationId, table.periodStart),
    index('idx_time_sheets_status').on(table.status),
]);

// ============================================================================
// HR: Organization Chart (Org Structure)
// ============================================================================

export const orgChartPositions = sqliteTable('org_chart_positions', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Position identity
    title: text('title').notNull(),                  // "Diretor Pedagógico"
    code: text('code'),                              // Internal code

    // Hierarchy
    parentPositionId: text('parent_position_id'),    // Reports to
    level: integer('level').default(0),              // 0 = top, 1, 2, 3...

    // Department
    department: text('department'),

    // Classification
    positionType: text('position_type', {
        enum: ['leadership', 'management', 'specialist', 'operational', 'support', 'intern', 'contractor', 'other']
    }),

    // Headcount
    headcount: integer('headcount').default(1),      // How many people in this position

    // Compensation range
    minSalaryCents: integer('min_salary_cents'),
    maxSalaryCents: integer('max_salary_cents'),

    // Is this position currently filled?
    isFilled: integer('is_filled', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    description: text('description'),
    responsibilities: text('responsibilities'),       // JSON array

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_org_positions_org').on(table.organizationId),
    index('idx_org_positions_parent').on(table.parentPositionId),
]);

// ============================================================================
// HR: Position Assignments (who holds what position)
// ============================================================================

export const positionAssignments = sqliteTable('position_assignments', {
    id: text('id').primaryKey().default(uuid()),
    positionId: text('position_id').notNull().references(() => orgChartPositions.id),
    personId: text('person_id').notNull().references(() => persons.id),
    contractId: text('contract_id').references(() => staffContracts.id),

    // Assignment period
    startDate: integer('start_date').notNull(),
    endDate: integer('end_date'),

    // Is this their primary position?
    isPrimary: integer('is_primary', { mode: 'boolean' }).default(true),

    // Status
    status: text('status', {
        enum: ['active', 'on_leave', 'ended']
    }).default('active'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_position_assignments_position').on(table.positionId),
    index('idx_position_assignments_person').on(table.personId),
]);

// ============================================================================
// HR: Teams & Team Members
// NOTE: Teams infrastructure is defined in the Lattice HR section
// See: teams, teamPositions, teamAssignments tables
// ============================================================================

// ============================================================================
// HR: Talent Pool (Job Candidates)
// ============================================================================

export const talentPoolCandidates = sqliteTable('talent_pool_candidates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Basic info
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    whatsapp: text('whatsapp'),

    // Documents
    cpf: text('cpf'),
    rg: text('rg'),

    // Resume/CV
    resumeUrl: text('resume_url'),
    linkedinUrl: text('linkedin_url'),
    portfolioUrl: text('portfolio_url'),

    // What they're applying for
    desiredPositionId: text('desired_position_id').references(() => orgChartPositions.id),
    desiredRole: text('desired_role'),              // Free text if no position
    desiredSalaryCents: integer('desired_salary_cents'),

    // Source
    source: text('source', {
        enum: ['job_board', 'referral', 'direct', 'linkedin', 'agency', 'internal', 'other']
    }),
    referredBy: text('referred_by').references(() => persons.id),

    // Evaluation
    evaluationScore: integer('evaluation_score'),    // 1-100
    evaluationNotes: text('evaluation_notes'),
    interviewNotes: text('interview_notes'),         // JSON array of interview notes

    // Skills (JSON array)
    skills: text('skills').default('[]'),

    // Status
    status: text('status', {
        enum: ['new', 'screening', 'interviewing', 'offer', 'hired', 'rejected', 'withdrawn', 'on_hold']
    }).default('new'),

    // If hired
    hiredAsUserId: text('hired_as_user_id').references(() => persons.id),
    hiredAt: integer('hired_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_talent_pool_org').on(table.organizationId, table.status),
    index('idx_talent_pool_position').on(table.desiredPositionId),
]);

// ============================================================================
// HR: Brazilian Labor Provisions (Provisões Trabalhistas)
// ============================================================================

export const laborProvisionSettings = sqliteTable('labor_provision_settings', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // 13th Salary Provisioning
    provision13th: integer('provision_13th', { mode: 'boolean' }).default(true),
    provision13thPercent: real('provision_13th_percent').default(8.33),  // 1/12 = 8.33%

    // Vacation Provisioning (Férias + 1/3)
    provisionVacation: integer('provision_vacation', { mode: 'boolean' }).default(true),
    provisionVacationPercent: real('provision_vacation_percent').default(11.11), // 1/12 + 1/3 = 11.11%

    // Termination Provisioning (FGTS multa + aviso prévio)
    provisionTermination: integer('provision_termination', { mode: 'boolean' }).default(false),
    provisionTerminationPercent: real('provision_termination_percent').default(4.0), // Estimated

    // FGTS (required by law)
    fgtsPercent: real('fgts_percent').default(8.0),

    // INSS employer contribution
    inssEmployerPercent: real('inss_employer_percent').default(20.0),

    // Other provisions
    otherProvisionsJson: text('other_provisions_json').default('[]'),

    // Calculation method
    calculateMonthly: integer('calculate_monthly', { mode: 'boolean' }).default(true),
    calculateOnPayroll: integer('calculate_on_payroll', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_labor_provisions_org').on(table.organizationId),
]);

// ============================================================================
// HR: Labor Provision Balances (per employee)
// ============================================================================

export const laborProvisionBalances = sqliteTable('labor_provision_balances', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),
    contractId: text('contract_id').notNull().references(() => staffContracts.id),

    // Reference month
    year: integer('year').notNull(),
    month: integer('month').notNull(),

    // 13th salary accrued
    provision13thCents: integer('provision_13th_cents').default(0),
    provision13thPaidCents: integer('provision_13th_paid_cents').default(0),

    // Vacation accrued
    provisionVacationCents: integer('provision_vacation_cents').default(0),
    provisionVacationPaidCents: integer('provision_vacation_paid_cents').default(0),
    vacationDaysAccrued: real('vacation_days_accrued').default(0),
    vacationDaysTaken: real('vacation_days_taken').default(0),

    // Termination reserve
    provisionTerminationCents: integer('provision_termination_cents').default(0),

    // FGTS deposited
    fgtsDepositedCents: integer('fgts_deposited_cents').default(0),

    // Running totals (cumulative for accounting)
    totalProvisionsCents: integer('total_provisions_cents').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_provision_balances_unique').on(table.contractId, table.year, table.month),
    index('idx_provision_balances_person').on(table.personId),
    index('idx_provision_balances_period').on(table.year, table.month),
]);

// ============================================================================
// HR: Termination Planning ("Plan to Fire")
// ============================================================================

export const terminationPlans = sqliteTable('termination_plans', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),
    contractId: text('contract_id').notNull().references(() => staffContracts.id),

    // Who created the plan
    createdBy: text('created_by').notNull().references(() => persons.id),

    // Planned termination type
    terminationType: text('termination_type', {
        enum: [
            'dismissal_without_cause',    // Demissão sem justa causa
            'dismissal_with_cause',       // Demissão por justa causa
            'resignation',                // Pedido de demissão
            'mutual_agreement',           // Acordo
            'contract_end',               // Fim de contrato
            'retirement'                  // Aposentadoria
        ]
    }).notNull(),

    // Planned date
    plannedTerminationDate: integer('planned_termination_date'),

    // Reason
    reason: text('reason'),
    detailedJustification: text('detailed_justification'),

    // Cost simulation (calculated)
    // Notice period
    noticePeriodDays: integer('notice_period_days'),
    noticePeriodCents: integer('notice_period_cents'),          // Aviso prévio

    // Accrued vacation
    accruedVacationDays: real('accrued_vacation_days'),
    accruedVacationCents: integer('accrued_vacation_cents'),
    vacationBonusCents: integer('vacation_bonus_cents'),        // 1/3 de férias

    // 13th salary
    accrued13thMonths: real('accrued_13th_months'),
    accrued13thCents: integer('accrued_13th_cents'),

    // FGTS
    fgtsBalanceCents: integer('fgts_balance_cents'),
    fgtsMultiplierPercent: real('fgts_multiplier_percent'),     // 40% or 20%
    fgtsMultiplierCents: integer('fgts_multiplier_cents'),

    // Other costs
    otherCostsCents: integer('other_costs_cents'),
    otherCostsDescription: text('other_costs_description'),

    // Total cost
    totalTerminationCostCents: integer('total_termination_cost_cents'),

    // Comparison: monthly salary
    monthlySalaryCents: integer('monthly_salary_cents'),
    monthsOfSalaryEquivalent: real('months_of_salary_equivalent'),

    // Status
    status: text('status', {
        enum: ['draft', 'simulating', 'pending_approval', 'approved', 'executing', 'executed', 'cancelled']
    }).default('draft'),

    // Approval chain
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),

    // Execution
    executedAt: integer('executed_at'),
    actualTerminationDate: integer('actual_termination_date'),

    // Notes and attachments
    notes: text('notes'),
    documentationUrls: text('documentation_urls').default('[]'),  // JSON array

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_termination_plans_org').on(table.organizationId, table.status),
    index('idx_termination_plans_person').on(table.personId),
    index('idx_termination_plans_contract').on(table.contractId),
]);

// ============================================================================
// HR: Work Schedule Templates
// ============================================================================

export const workScheduleTemplates = sqliteTable('work_schedule_templates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),                    // "Comercial 8h", "Part-time Manhã"
    description: text('description'),

    // Weekly schedule (JSON)
    // { "mon": { "start": "08:00", "end": "18:00", "break": 60 }, ... }
    weeklySchedule: text('weekly_schedule').notNull(),

    // Total hours
    weeklyHours: real('weekly_hours'),

    // Type
    scheduleType: text('schedule_type', {
        enum: ['full_time', 'part_time', 'contractor', 'intern', 'volunteer']
    }).default('full_time'),

    isDefault: integer('is_default', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_schedule_templates_org').on(table.organizationId),
]);

// ============================================================================
// HR: Employee Benefits
// ============================================================================

export const employeeBenefits = sqliteTable('employee_benefits', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),
    contractId: text('contract_id').references(() => staffContracts.id),

    // Benefit type
    benefitType: text('benefit_type', {
        enum: [
            'vale_refeicao',      // VR
            'vale_alimentacao',   // VA
            'vale_transporte',    // VT
            'plano_saude',        // Health insurance
            'plano_odonto',       // Dental
            'seguro_vida',        // Life insurance
            'gympass',            // Gym
            'auxilio_creche',     // Daycare
            'auxilio_educacao',   // Education
            'bonus',              // Bonus
            'participacao_lucros', // PLR
            'other'
        ]
    }).notNull(),

    // Provider
    providerName: text('provider_name'),
    planName: text('plan_name'),
    cardNumber: text('card_number'),

    // Values
    valueCents: integer('value_cents'),              // Monthly value
    employeeContributionCents: integer('employee_contribution_cents'), // Employee pays
    employerContributionCents: integer('employer_contribution_cents'), // Employer pays

    // Coverage (for health/dental)
    coversDependents: integer('covers_dependents', { mode: 'boolean' }).default(false),
    dependentCount: integer('dependent_count'),

    // Period
    startsAt: integer('starts_at'),
    endsAt: integer('ends_at'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_employee_benefits_person').on(table.personId),
    index('idx_employee_benefits_type').on(table.benefitType),
]);

// ============================================================================
// SCHOOL OPERATIONS: Physical Spaces
// ============================================================================

export const rooms = sqliteTable('rooms', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    capacity: integer('capacity').default(15),

    roomType: text('room_type', {
        enum: ['classroom', 'lab', 'auditorium', 'online', 'external']
    }).default('classroom'),

    defaultMeetUrl: text('default_meet_url'),
    floor: text('floor'),
    building: text('building'),
    amenities: text('amenities').default('[]'),

    isActive: integer('is_active').default(1),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_rooms_org').on(table.organizationId),
]);

// ============================================================================
// SCHOOL OPERATIONS: Terms / Enrollment Periods
// ============================================================================

export const terms = sqliteTable('terms', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),

    enrollmentOpens: integer('enrollment_opens'),
    enrollmentCloses: integer('enrollment_closes'),
    classesStart: integer('classes_start'),
    classesEnd: integer('classes_end'),

    status: text('status', {
        enum: ['planning', 'enrollment', 'active', 'completed']
    }).default('planning'),

    isCurrent: integer('is_current').default(0),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_terms_org').on(table.organizationId),
    index('idx_terms_current').on(table.organizationId, table.isCurrent),
]);

// ============================================================================
// SCHOOL OPERATIONS: Course Types & Levels (Language School)
// ============================================================================

export const courseTypes = sqliteTable('course_types', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),

    hasLevels: integer('has_levels').default(0),
    hasModules: integer('has_modules').default(1),

    defaultDurationWeeks: integer('default_duration_weeks').default(24),
    defaultHoursPerWeek: real('default_hours_per_week').default(2),
    defaultMonthlyPrice: integer('default_monthly_price'),

    createdAt: integer('created_at').default(timestamp()),
});

export const levels = sqliteTable('levels', {
    id: text('id').primaryKey().default(uuid()),
    courseTypeId: text('course_type_id').notNull().references(() => courseTypes.id),

    code: text('code').notNull(),
    name: text('name').notNull(),
    orderIndex: integer('order_index').notNull(),

    prerequisiteLevelId: text('prerequisite_level_id'),
    estimatedHours: integer('estimated_hours'),
}, (table) => [
    uniqueIndex('idx_levels_unique').on(table.courseTypeId, table.code),
]);

// ============================================================================
// SCHOOL OPERATIONS: Classes (Physical class instances)
// ============================================================================

export const classes = sqliteTable('classes', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    courseId: text('course_id').references(() => courses.id),
    courseTypeId: text('course_type_id').references(() => courseTypes.id),
    levelId: text('level_id').references(() => levels.id),
    termId: text('term_id').references(() => terms.id),

    teacherId: text('teacher_id').references(() => persons.id),

    maxStudents: integer('max_students').default(15),
    currentStudents: integer('current_students').default(0),

    status: text('status', {
        enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled']
    }).default('draft'),

    startsAt: integer('starts_at'),
    endsAt: integer('ends_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_classes_org').on(table.organizationId),
    index('idx_classes_teacher').on(table.teacherId),
    index('idx_classes_term').on(table.termId),
]);

// ============================================================================
// SCHOOL OPERATIONS: Scheduling
// ============================================================================

export const schedules = sqliteTable('schedules', {
    id: text('id').primaryKey().default(uuid()),
    classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    roomId: text('room_id').references(() => rooms.id),

    dayOfWeek: integer('day_of_week').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),

    validFrom: integer('valid_from'),
    validUntil: integer('valid_until'),

    isActive: integer('is_active').default(1),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_schedules_class').on(table.classId),
    index('idx_schedules_room').on(table.roomId, table.dayOfWeek),
]);

export const scheduleExceptions = sqliteTable('schedule_exceptions', {
    id: text('id').primaryKey().default(uuid()),
    scheduleId: text('schedule_id').references(() => schedules.id),
    classId: text('class_id').references(() => classes.id),

    exceptionDate: integer('exception_date').notNull(),

    exceptionType: text('exception_type', {
        enum: ['cancelled', 'rescheduled', 'makeup', 'holiday', 'room_change']
    }).notNull(),

    newRoomId: text('new_room_id').references(() => rooms.id),
    newStartTime: text('new_start_time'),
    newEndTime: text('new_end_time'),

    reason: text('reason'),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_exceptions_date').on(table.exceptionDate),
    index('idx_exceptions_class').on(table.classId),
]);

// ============================================================================
// SCHOOL OPERATIONS: Class Sessions & Attendance
// ============================================================================

export const classSessions = sqliteTable('class_sessions', {
    id: text('id').primaryKey().default(uuid()),
    classId: text('class_id').notNull().references(() => classes.id),
    scheduleId: text('schedule_id').references(() => schedules.id),

    sessionDate: integer('session_date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),

    roomId: text('room_id').references(() => rooms.id),

    status: text('status', {
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled']
    }).default('scheduled'),

    lessonId: text('lesson_id').references(() => lessons.id),
    notes: text('notes'),
    teacherId: text('teacher_id').references(() => persons.id),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_sessions_class').on(table.classId, table.sessionDate),
    index('idx_sessions_date').on(table.sessionDate),
    index('idx_sessions_teacher').on(table.teacherId, table.sessionDate),
]);

export const attendance = sqliteTable('attendance', {
    id: text('id').primaryKey().default(uuid()),
    sessionId: text('session_id').notNull().references(() => classSessions.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    status: text('status', {
        enum: ['present', 'absent', 'late', 'excused', 'makeup']
    }).notNull(),

    arrivedAt: integer('arrived_at'),
    leftAt: integer('left_at'),

    notes: text('notes'),
    excuseReason: text('excuse_reason'),

    markedBy: text('marked_by').references(() => persons.id),
    markedAt: integer('marked_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_attendance_unique').on(table.sessionId, table.personId),
    index('idx_attendance_person').on(table.personId, table.status),
]);

// ============================================================================
// SCHOOL OPERATIONS: Placement Tests
// ============================================================================

export const placementTests = sqliteTable('placement_tests', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    courseTypeId: text('course_type_id').notNull().references(() => courseTypes.id),

    name: text('name').notNull(),
    description: text('description'),

    sections: text('sections').notNull(),
    maxScore: integer('max_score').notNull(),
    levelThresholds: text('level_thresholds').notNull(),

    isActive: integer('is_active').default(1),
    createdAt: integer('created_at').default(timestamp()),
});

export const placementResults = sqliteTable('placement_results', {
    id: text('id').primaryKey().default(uuid()),
    testId: text('test_id').notNull().references(() => placementTests.id),
    personId: text('person_id').notNull().references(() => persons.id),

    score: integer('score').notNull(),
    maxScore: integer('max_score').notNull(),

    recommendedLevelId: text('recommended_level_id').references(() => levels.id),
    sectionScores: text('section_scores'),

    finalLevelId: text('final_level_id').references(() => levels.id),
    overrideReason: text('override_reason'),
    overriddenBy: text('overridden_by').references(() => persons.id),

    takenAt: integer('taken_at').default(timestamp()),
}, (table) => [
    index('idx_placement_person').on(table.personId),
]);

// ============================================================================
// FINANCIAL: Products & Pricing
// ============================================================================

export const products = sqliteTable('products', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    description: text('description'),

    productType: text('product_type', {
        enum: ['tuition', 'enrollment', 'material', 'exam', 'workshop', 'private', 'other']
    }).notNull(),

    priceCents: integer('price_cents').notNull(),
    currency: text('currency').default('BRL'),

    isRecurring: integer('is_recurring').default(0),
    recurrenceInterval: text('recurrence_interval'),

    courseId: text('course_id').references(() => courses.id),
    courseTypeId: text('course_type_id').references(() => courseTypes.id),
    levelId: text('level_id').references(() => levels.id),

    isActive: integer('is_active').default(1),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_products_org').on(table.organizationId),
    index('idx_products_type').on(table.productType),
]);

// ============================================================================
// FINANCIAL: Discounts & Promotions
// ============================================================================

export const discounts = sqliteTable('discounts', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    code: text('code').unique(),

    discountType: text('discount_type', {
        enum: ['percentage', 'fixed', 'family', 'early_bird', 'referral', 'scholarship', 'loyalty']
    }).notNull(),

    percentage: real('percentage'),
    fixedAmount: integer('fixed_amount'),

    minPurchase: integer('min_purchase'),
    appliesTo: text('applies_to').default('[]'),

    maxUses: integer('max_uses'),
    maxUsesPerUser: integer('max_uses_per_user').default(1),
    currentUses: integer('current_uses').default(0),

    validFrom: integer('valid_from'),
    validUntil: integer('valid_until'),

    isActive: integer('is_active').default(1),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_discounts_code').on(table.code),
]);

// ============================================================================
// FINANCIAL: Invoice Items
// ============================================================================

export const invoiceItems = sqliteTable('invoice_items', {
    id: text('id').primaryKey().default(uuid()),
    invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),

    description: text('description').notNull(),
    productId: text('product_id').references(() => products.id),

    quantity: integer('quantity').default(1),
    unitPriceCents: integer('unit_price_cents').notNull(),
    totalCents: integer('total_cents').notNull(),

    periodStart: integer('period_start'),
    periodEnd: integer('period_end'),

    classId: text('class_id').references(() => classes.id),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_invoice_items').on(table.invoiceId),
]);

// ============================================================================
// FINANCIAL: Teacher Contracts
// ============================================================================

export const teacherContracts = sqliteTable('teacher_contracts', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teacherId: text('teacher_id').notNull().references(() => persons.id),

    contractType: text('contract_type', {
        enum: ['clt', 'pj', 'freelance', 'volunteer']
    }).notNull(),

    baseSalaryCents: integer('base_salary_cents'),
    hourlyRateCents: integer('hourly_rate_cents'),
    commissionRate: real('commission_rate'),

    minHoursWeek: real('min_hours_week'),
    maxHoursWeek: real('max_hours_week'),

    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at'),

    status: text('status', {
        enum: ['draft', 'active', 'suspended', 'terminated']
    }).default('active'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_contracts_teacher').on(table.teacherId),
]);

// ============================================================================
// CRM: Leads
// ============================================================================

export const leads = sqliteTable('leads', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    whatsapp: text('whatsapp'),

    source: text('source', {
        enum: ['website', 'instagram', 'facebook', 'google', 'referral', 'walk_in', 'event', 'partner', 'other']
    }),
    sourceDetail: text('source_detail'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    utmTerm: text('utm_term'),

    // ==========================================
    // Multi-Touch Attribution
    // ==========================================
    // First touch (how they discovered us)
    firstSource: text('first_source'),
    firstMedium: text('first_medium'),
    firstCampaignId: text('first_campaign_id').references(() => campaigns.id),
    firstLandingPage: text('first_landing_page'),

    // Last touch (what converted them)
    lastSource: text('last_source'),
    lastMedium: text('last_medium'),
    lastCampaignId: text('last_campaign_id').references(() => campaigns.id),
    lastLandingPage: text('last_landing_page'),

    // Visitor tracking link
    visitorId: text('visitor_id'),

    interestedIn: text('interested_in').default('[]'),
    currentLevel: text('current_level'),
    preferredSchedule: text('preferred_schedule'),

    // Legacy status (kept for backwards compatibility)
    status: text('status', {
        enum: ['new', 'contacted', 'qualified', 'trial_scheduled', 'trial_completed', 'proposal_sent', 'enrolled', 'lost', 'inactive']
    }).default('new'),

    // ==========================================
    // SCRM: 11-Stage Funnel Position
    // ==========================================
    funnelStage: text('funnel_stage', {
        enum: [
            'small_engagement', 'comments_conversations', 'interested',     // TOFU
            'qualifying', 'more_information', 'events_invitations',          // MOFU
            'appointments', 'negotiation', 'counters',                       // BOFU
            'won', 'lost'                                                    // Outcomes
        ]
    }).default('small_engagement'),

    funnelSegment: text('funnel_segment', {
        enum: ['tofu', 'mofu', 'bofu', 'outcome']
    }).default('tofu'),

    // ==========================================
    // SCRM: Current Sentiment
    // ==========================================
    currentSentiment: text('current_sentiment', {
        enum: ['positive', 'neutral', 'hesitant', 'negative', 'enthusiastic']
    }).default('neutral'),

    sentimentUpdatedAt: integer('sentiment_updated_at'),

    // ==========================================
    // SCRM: Cached 3x3 Insights (for quick access)
    // ==========================================
    insightDreams: text('insight_dreams'),       // JSON array of up to 3 dreams
    insightHobbies: text('insight_hobbies'),     // JSON array of up to 3 hobbies
    insightAspirations: text('insight_aspirations'), // JSON array of up to 3 aspirations

    // ==========================================
    // SCRM: AI Persona Status
    // ==========================================
    hasPersona: integer('has_persona', { mode: 'boolean' }).default(false),
    personaGeneratedAt: integer('persona_generated_at'),

    assignedTo: text('assigned_to').references(() => persons.id),
    referredByUserId: text('referred_by_user_id').references(() => persons.id),

    convertedToUserId: text('converted_to_user_id').references(() => persons.id),
    convertedAt: integer('converted_at'),

    notes: text('notes'),

    lastContactAt: integer('last_contact_at'),
    nextFollowupAt: integer('next_followup_at'),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_leads_status').on(table.status),
    index('idx_leads_funnel').on(table.funnelStage, table.funnelSegment),
    index('idx_leads_sentiment').on(table.currentSentiment),
    index('idx_leads_assigned').on(table.assignedTo),
    index('idx_leads_followup').on(table.nextFollowupAt),
]);

// ============================================================================
// CRM: Lead Interactions
// ============================================================================

export const leadInteractions = sqliteTable('lead_interactions', {
    id: text('id').primaryKey().default(uuid()),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    interactionType: text('interaction_type', {
        enum: ['call', 'whatsapp', 'email', 'sms', 'visit', 'meeting', 'note']
    }).notNull(),

    direction: text('direction', { enum: ['inbound', 'outbound'] }),

    subject: text('subject'),
    content: text('content'),
    outcome: text('outcome'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_interactions_lead').on(table.leadId, table.createdAt),
]);

// ============================================================================
// CRM: Trial Classes
// ============================================================================

export const trialClasses = sqliteTable('trial_classes', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    leadId: text('lead_id').references(() => leads.id),
    personId: text('person_id').references(() => persons.id),

    classId: text('class_id').references(() => classes.id),
    sessionId: text('session_id').references(() => classSessions.id),

    scheduledDate: integer('scheduled_date'),
    scheduledTime: text('scheduled_time'),
    roomId: text('room_id').references(() => rooms.id),
    teacherId: text('teacher_id').references(() => persons.id),

    status: text('status', {
        enum: ['scheduled', 'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled']
    }).default('scheduled'),

    feedbackScore: integer('feedback_score'),
    feedbackNotes: text('feedback_notes'),
    teacherNotes: text('teacher_notes'),

    outcome: text('outcome', {
        enum: ['enrolled', 'thinking', 'not_interested', 'wrong_level', 'schedule_conflict', 'price']
    }),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_trials_lead').on(table.leadId),
    index('idx_trials_date').on(table.scheduledDate),
]);

// ============================================================================
// CRM: Marketing Campaigns
// ============================================================================

export const campaigns = sqliteTable('campaigns', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    description: text('description'),

    campaignType: text('campaign_type', {
        enum: ['enrollment', 'retention', 'reactivation', 'upsell', 'referral', 'event', 'seasonal']
    }).notNull(),

    channels: text('channels').default('[]'),

    budgetCents: integer('budget_cents'),
    spentCents: integer('spent_cents').default(0),

    startsAt: integer('starts_at'),
    endsAt: integer('ends_at'),

    targetAudience: text('target_audience'),

    goalLeads: integer('goal_leads'),
    goalEnrollments: integer('goal_enrollments'),
    goalRevenueCents: integer('goal_revenue_cents'),

    actualLeads: integer('actual_leads').default(0),
    actualEnrollments: integer('actual_enrollments').default(0),
    actualRevenueCents: integer('actual_revenue_cents').default(0),

    // ==========================================
    // Platform-specific IDs for ad sync
    // ==========================================
    metaCampaignId: text('meta_campaign_id'),
    googleCampaignId: text('google_campaign_id'),
    linkedinCampaignId: text('linkedin_campaign_id'),

    // ==========================================
    // ROAS & Attribution
    // ==========================================
    targetRoas: real('target_roas'),              // Target ROAS (e.g., 3.0 = 3x return)
    actualRoas: real('actual_roas'),              // Calculated from conversions

    // Cost breakdown
    adSpendCents: integer('ad_spend_cents'),      // Actual ad spend
    serviceFeesCents: integer('service_fees_cents'), // Agency fees, tools, etc.

    // Attribution settings
    attributionModel: text('attribution_model', {
        enum: ['first_touch', 'last_touch', 'linear', 'time_decay']
    }).default('last_touch'),
    attributionWindowDays: integer('attribution_window_days').default(30),

    // Sync status
    lastSyncedAt: integer('last_synced_at'),
    syncError: text('sync_error'),

    status: text('status', {
        enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']
    }).default('draft'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_campaigns_status').on(table.status, table.startsAt),
]);

export const campaignLeads = sqliteTable('campaign_leads', {
    campaignId: text('campaign_id').notNull().references(() => campaigns.id),
    leadId: text('lead_id').notNull().references(() => leads.id),

    attributedAt: integer('attributed_at').default(timestamp()),
    converted: integer('converted').default(0),
}, (table) => [
    uniqueIndex('idx_campaign_leads_pk').on(table.campaignId, table.leadId),
]);

// ============================================================================
// CRM: Email Templates
// ============================================================================

export const emailTemplates = sqliteTable('email_templates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),

    templateType: text('template_type', {
        enum: ['marketing', 'transactional', 'notification', 'system']
    }).notNull(),

    triggerEvent: text('trigger_event'),

    subject: text('subject').notNull(),
    bodyHtml: text('body_html').notNull(),
    bodyText: text('body_text'),

    variables: text('variables').default('[]'),

    isActive: integer('is_active').default(1),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
});

// ============================================================================
// CRM: Referrals
// ============================================================================

export const referrals = sqliteTable('referrals', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    referrerId: text('referrer_id').notNull().references(() => persons.id),
    leadId: text('lead_id').references(() => leads.id),
    referredUserId: text('referred_user_id').references(() => persons.id),

    status: text('status', {
        enum: ['pending', 'qualified', 'enrolled', 'rewarded']
    }).default('pending'),

    referrerRewardType: text('referrer_reward_type'),
    referrerRewardValue: integer('referrer_reward_value'),
    referrerRewardApplied: integer('referrer_reward_applied').default(0),

    referredRewardType: text('referred_reward_type'),
    referredRewardValue: integer('referred_reward_value'),
    referredRewardApplied: integer('referred_reward_applied').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_referrals_referrer').on(table.referrerId),
]);

// ============================================================================
// MARKETING: Platform Integrations (Pixels & APIs)
// ============================================================================

export const marketingIntegrations = sqliteTable('marketing_integrations', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    platform: text('platform', {
        enum: ['meta', 'google', 'linkedin', 'tiktok', 'twitter']
    }).notNull(),

    // Pixel/Tag IDs
    pixelId: text('pixel_id'),                    // Meta Pixel ID, GA4 Measurement ID
    accessToken: text('access_token'),            // For Conversion API (CAPI) - encrypted

    // OAuth for ad account access
    accountId: text('account_id'),                // Ad account ID for API calls
    refreshToken: text('refresh_token'),          // OAuth refresh token - encrypted
    tokenExpiresAt: integer('token_expires_at'),

    // Feature flags
    trackPageViews: integer('track_page_views', { mode: 'boolean' }).default(true),
    trackLeads: integer('track_leads', { mode: 'boolean' }).default(true),
    trackPurchases: integer('track_purchases', { mode: 'boolean' }).default(true),
    useServerSideTracking: integer('use_server_side_tracking', { mode: 'boolean' }).default(false),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    connectedAt: integer('connected_at').default(timestamp()),
    lastSyncedAt: integer('last_synced_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_marketing_integrations_unique').on(table.organizationId, table.platform),
]);

// ============================================================================
// MARKETING: Visitor Tracking (Pre-Identification)
// ============================================================================

export const visitors = sqliteTable('visitors', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Anonymous tracking
    fingerprint: text('fingerprint'),             // Client fingerprint
    clientId: text('client_id'),                  // GA4 client ID
    fbp: text('fbp'),                             // Meta _fbp cookie
    fbc: text('fbc'),                             // Meta click ID (fbclid)

    // First touch attribution
    firstSource: text('first_source'),
    firstMedium: text('first_medium'),
    firstCampaign: text('first_campaign'),
    firstContent: text('first_content'),
    firstTerm: text('first_term'),
    firstLandingPage: text('first_landing_page'),
    firstReferrer: text('first_referrer'),

    // Device info
    userAgent: text('user_agent'),
    deviceType: text('device_type', {
        enum: ['desktop', 'mobile', 'tablet']
    }),
    browser: text('browser'),
    os: text('os'),

    // Geo (approximate from IP)
    country: text('country'),
    region: text('region'),
    city: text('city'),

    // Identity resolution
    leadId: text('lead_id').references(() => leads.id),
    resolvedAt: integer('resolved_at'),

    firstSeenAt: integer('first_seen_at').default(timestamp()),
    lastSeenAt: integer('last_seen_at').default(timestamp()),
}, (table) => [
    index('idx_visitors_fingerprint').on(table.fingerprint),
    index('idx_visitors_lead').on(table.leadId),
    index('idx_visitors_org').on(table.organizationId, table.firstSeenAt),
]);

// ============================================================================
// MARKETING: Session Tracking
// ============================================================================

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey().default(uuid()),
    visitorId: text('visitor_id').notNull().references(() => visitors.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Session attribution (UTM)
    source: text('source'),
    medium: text('medium'),
    campaign: text('campaign'),
    content: text('content'),
    term: text('term'),

    // Landing
    landingPage: text('landing_page'),
    referrer: text('referrer'),

    // Behavior
    pageViews: integer('page_views').default(0),
    events: integer('events').default(0),
    duration: integer('duration').default(0),      // Seconds
    bounced: integer('bounced', { mode: 'boolean' }).default(true),

    // Device for this session
    deviceType: text('device_type'),

    startedAt: integer('started_at').default(timestamp()),
    endedAt: integer('ended_at'),
}, (table) => [
    index('idx_sessions_visitor').on(table.visitorId),
    index('idx_sessions_org').on(table.organizationId, table.startedAt),
]);

// ============================================================================
// MARKETING: Event Tracking
// ============================================================================

export const trackingEvents = sqliteTable('tracking_events', {
    id: text('id').primaryKey().default(uuid()),
    sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
    visitorId: text('visitor_id').notNull().references(() => visitors.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    eventType: text('event_type', {
        enum: ['page_view', 'scroll', 'click', 'form_start', 'form_submit',
            'video_play', 'video_complete', 'lead', 'purchase', 'custom']
    }).notNull(),

    eventName: text('event_name'),                // Custom event name
    pageUrl: text('page_url'),

    // Event data
    properties: text('properties').default('{}'), // JSON: event-specific data

    // Conversion value
    valueCents: integer('value_cents'),
    currency: text('currency').default('BRL'),

    timestamp: integer('timestamp').default(timestamp()),
}, (table) => [
    index('idx_tracking_events_session').on(table.sessionId),
    index('idx_tracking_events_visitor').on(table.visitorId),
    index('idx_tracking_events_type').on(table.eventType, table.timestamp),
]);

// ============================================================================
// MARKETING: Content Types & Production Pipeline
// For all marketing channels: digital, events, printed, person-to-person
// ============================================================================

export const contentTypes = sqliteTable('content_types', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),             // "Instagram Post", "Flyer A5", "Event Banner"
    code: text('code').notNull(),             // "ig_post", "flyer_a5", "event_banner"

    // Channel type
    channel: text('channel', {
        enum: ['digital', 'print', 'event', 'partner', 'outreach', 'broadcast']
    }).notNull(),

    // For digital
    platform: text('platform'),               // "instagram", "facebook", "google", "email", "whatsapp"

    // For print
    printFormat: text('print_format'),        // "A5", "A4", "Banner 2x1", "Business Card"
    printDimensions: text('print_dimensions'), // JSON: { width: 148, height: 210, unit: 'mm' }

    // Production requirements
    requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(true),
    requiredAssets: text('required_assets').default('[]'),  // JSON: ["image", "copy", "cta"]
    templateUrl: text('template_url'),                      // Link to Canva/Figma template

    // Cost tracking
    estimatedCostCents: integer('estimated_cost_cents'),    // Per unit production cost
    minQuantity: integer('min_quantity'),                   // Minimum order for print

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_content_types_code').on(table.organizationId, table.code),
    index('idx_content_types_channel').on(table.channel),
]);

// ============================================================================
// MARKETING: Content Assets (Images, Videos, Copy, etc.)
// ============================================================================

export const contentAssets = sqliteTable('content_assets', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    campaignId: text('campaign_id').references(() => campaigns.id),
    contentTypeId: text('content_type_id').references(() => contentTypes.id),

    // Identity
    name: text('name').notNull(),
    description: text('description'),

    // Asset type
    assetType: text('asset_type', {
        enum: ['image', 'video', 'copy', 'audio', 'document', 'template', 'other']
    }).notNull(),

    // File info
    fileUrl: text('file_url'),
    thumbnailUrl: text('thumbnail_url'),
    fileSize: integer('file_size'),           // Bytes
    mimeType: text('mime_type'),
    dimensions: text('dimensions'),            // JSON: { width, height }
    duration: integer('duration'),             // For video/audio in seconds

    // Content
    copyText: text('copy_text'),              // For copy assets
    ctaText: text('cta_text'),
    ctaUrl: text('cta_url'),

    // Production workflow
    status: text('status', {
        enum: ['draft', 'in_review', 'approved', 'rejected', 'live', 'archived']
    }).default('draft'),
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),
    rejectionReason: text('rejection_reason'),

    // Versioning
    version: integer('version').default(1),
    parentAssetId: text('parent_asset_id'),   // Previous version

    // Usage tracking
    usageCount: integer('usage_count').default(0),
    lastUsedAt: integer('last_used_at'),

    // AI metadata
    aiGenerated: integer('ai_generated', { mode: 'boolean' }).default(false),
    aiPrompt: text('ai_prompt'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_content_assets_campaign').on(table.campaignId),
    index('idx_content_assets_type').on(table.assetType),
    index('idx_content_assets_status').on(table.status),
]);

// ============================================================================
// MARKETING: Events (Person-to-Person Marketing)
// Workshops, open houses, fairs, local partnerships
// ============================================================================

export const marketingEvents = sqliteTable('marketing_events', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    campaignId: text('campaign_id').references(() => campaigns.id),

    // Identity
    name: text('name').notNull(),
    description: text('description'),

    // Type
    eventType: text('event_type', {
        enum: [
            'open_house',         // Portas abertas
            'workshop',           // Workshop/aula experimental
            'fair',               // Feira de educação
            'community',          // Evento comunitário
            'partnership',        // Evento com parceiro
            'corporate',          // Apresentação empresarial
            'school_visit',       // Visita a escola (prospecção)
            'flyering',           // Panfletagem
            'popup',              // Stand em local público
            'webinar',            // Evento online
            'other'
        ]
    }).notNull(),

    // Location
    isOnline: integer('is_online', { mode: 'boolean' }).default(false),
    venue: text('venue'),                     // "Shopping Ibirapuera - Átrio"
    address: text('address'),
    roomId: text('room_id').references(() => rooms.id),  // If at school
    meetingUrl: text('meeting_url'),          // For online events

    // Timing
    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at'),
    setupTime: integer('setup_time'),         // Minutes before start for prep

    // Capacity
    maxAttendees: integer('max_attendees'),
    registeredCount: integer('registered_count').default(0),
    attendedCount: integer('attended_count').default(0),

    // Staff assignment
    leadStaffId: text('lead_staff_id').references(() => persons.id),
    staffIds: text('staff_ids').default('[]'),  // JSON array of user IDs

    // Materials needed
    materialsNeeded: text('materials_needed').default('[]'),  // JSON: ["flyers", "banner", "tablets"]
    materialsChecklist: text('materials_checklist').default('{}'),  // JSON: { "flyers": true, "banner": false }

    // Budget
    budgetCents: integer('budget_cents'),
    actualCostCents: integer('actual_cost_cents'),

    // Results
    leadsGenerated: integer('leads_generated').default(0),
    trialsScheduled: integer('trials_scheduled').default(0),
    enrollmentsFromEvent: integer('enrollments_from_event').default(0),
    notes: text('notes'),

    // Status
    status: text('status', {
        enum: ['planned', 'confirmed', 'in_progress', 'completed', 'cancelled']
    }).default('planned'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_marketing_events_org').on(table.organizationId, table.startsAt),
    index('idx_marketing_events_campaign').on(table.campaignId),
    index('idx_marketing_events_type').on(table.eventType),
]);

// ============================================================================
// MARKETING: Event Registrations
// ============================================================================

export const eventRegistrations = sqliteTable('event_registrations', {
    id: text('id').primaryKey().default(uuid()),
    eventId: text('event_id').notNull().references(() => marketingEvents.id, { onDelete: 'cascade' }),

    // Attendee (lead or existing contact)
    leadId: text('lead_id').references(() => leads.id),
    personId: text('person_id').references(() => persons.id),

    // If not existing contact
    name: text('name'),
    email: text('email'),
    phone: text('phone'),

    // Registration details
    registeredAt: integer('registered_at').default(timestamp()),
    confirmedAt: integer('confirmed_at'),
    attendedAt: integer('attended_at'),

    status: text('status', {
        enum: ['registered', 'confirmed', 'attended', 'no_show', 'cancelled']
    }).default('registered'),

    // Follow-up
    followUpScheduled: integer('follow_up_scheduled', { mode: 'boolean' }).default(false),
    notes: text('notes'),
}, (table) => [
    index('idx_event_registrations_event').on(table.eventId),
    index('idx_event_registrations_lead').on(table.leadId),
]);

// ============================================================================
// MARKETING: Partners & Influencers
// For partnership and referral marketing
// ============================================================================

export const marketingPartners = sqliteTable('marketing_partners', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Partner info
    name: text('name').notNull(),
    type: text('type', {
        enum: ['influencer', 'business', 'school', 'community', 'media', 'agency', 'other']
    }).notNull(),

    // Contact
    contactName: text('contact_name'),
    email: text('email'),
    phone: text('phone'),
    instagram: text('instagram'),
    website: text('website'),

    // Location (for local partnerships)
    address: text('address'),
    neighborhood: text('neighborhood'),
    city: text('city'),

    // Audience info
    audienceSize: integer('audience_size'),   // Followers, members, etc.
    audienceDescription: text('audience_description'),

    // Deal terms
    partnershipType: text('partnership_type', {
        enum: ['commission', 'discount_exchange', 'cross_promotion', 'sponsored', 'affiliate', 'other']
    }),
    commissionPercent: real('commission_percent'),
    discountOffered: integer('discount_offered'),        // Percentage
    terms: text('terms'),                                // Free text

    // Tracking
    referralCode: text('referral_code'),
    trackingUrl: text('tracking_url'),

    // Results
    totalLeads: integer('total_leads').default(0),
    totalEnrollments: integer('total_enrollments').default(0),
    totalRevenueCents: integer('total_revenue_cents').default(0),
    totalPaidCents: integer('total_paid_cents').default(0),

    status: text('status', {
        enum: ['prospect', 'negotiating', 'active', 'paused', 'ended']
    }).default('prospect'),

    startsAt: integer('starts_at'),
    endsAt: integer('ends_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_marketing_partners_org').on(table.organizationId),
    index('idx_marketing_partners_type').on(table.type),
]);

// ============================================================================
// MARKETING: Content Calendar
// For planning and scheduling content production
// ============================================================================

export const contentCalendar = sqliteTable('content_calendar', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    campaignId: text('campaign_id').references(() => campaigns.id),

    // Content reference
    contentTypeId: text('content_type_id').references(() => contentTypes.id),
    contentAssetId: text('content_asset_id').references(() => contentAssets.id),
    eventId: text('event_id').references(() => marketingEvents.id),

    // What
    title: text('title').notNull(),
    description: text('description'),

    // When
    scheduledFor: integer('scheduled_for').notNull(),   // Publishing/delivery date
    deadline: integer('deadline'),                       // Internal deadline

    // Who
    assignedTo: text('assigned_to').references(() => persons.id),

    // Status
    status: text('status', {
        enum: ['idea', 'planned', 'in_progress', 'ready', 'published', 'cancelled']
    }).default('planned'),

    // For recurring content
    recurrenceRule: text('recurrence_rule'),             // iCal RRULE format
    parentItemId: text('parent_item_id'),                // For recurrence instances

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_content_calendar_date').on(table.organizationId, table.scheduledFor),
    index('idx_content_calendar_campaign').on(table.campaignId),
    index('idx_content_calendar_status').on(table.status),
]);

// ============================================================================
// MARKETING: QR Code Tracking
// Bridge between offline materials and digital attribution
// ============================================================================

export const qrCodes = sqliteTable('qr_codes', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    code: text('code').notNull(),             // Short code for URL (e.g., "abc123")
    name: text('name').notNull(),             // Human-readable name
    description: text('description'),

    // Attribution links
    campaignId: text('campaign_id').references(() => campaigns.id),
    partnerId: text('partner_id').references(() => marketingPartners.id),
    eventId: text('event_id').references(() => marketingEvents.id),
    contentAssetId: text('content_asset_id').references(() => contentAssets.id),

    // Location tagging (where this QR is physically placed)
    locationName: text('location_name'),      // "Shopping Ibirapuera", "Padaria Central"
    locationType: text('location_type', {
        enum: ['school', 'partner', 'event', 'public', 'flyer', 'poster', 'banner', 'vehicle', 'other']
    }),
    address: text('address'),
    neighborhood: text('neighborhood'),
    city: text('city'),
    coordinates: text('coordinates'),          // JSON: { lat, lng }

    // Target destination
    destinationType: text('destination_type', {
        enum: ['landing_page', 'form', 'whatsapp', 'link', 'vcard', 'app']
    }).default('landing_page'),
    destinationUrl: text('destination_url'),
    landingPageId: text('landing_page_id').references(() => landingPages.id),
    formSlug: text('form_slug'),              // Which form to show

    // UTM parameters to append
    utmSource: text('utm_source').default('qr'),
    utmMedium: text('utm_medium'),             // "flyer", "poster", "event"
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),           // QR code identifier
    utmTerm: text('utm_term'),                 // Location identifier

    // QR design
    primaryColor: text('primary_color').default('#000000'),
    backgroundColor: text('background_color').default('#FFFFFF'),
    logoUrl: text('logo_url'),
    frameText: text('frame_text'),
    moduleStyle: text('module_style', {
        enum: ['square', 'rounded', 'circle']
    }).default('rounded'),

    // Generated assets
    qrImageUrl: text('qr_image_url'),          // Stored generated QR image
    qrSvg: text('qr_svg'),                     // SVG version

    // Tracking stats (denormalized for quick access)
    totalScans: integer('total_scans').default(0),
    uniqueScans: integer('unique_scans').default(0),
    leadsGenerated: integer('leads_generated').default(0),
    lastScannedAt: integer('last_scanned_at'),

    // Material tracking
    printedQuantity: integer('printed_quantity'),
    distributedAt: integer('distributed_at'),
    expiresAt: integer('expires_at'),

    status: text('status', {
        enum: ['active', 'paused', 'expired', 'archived']
    }).default('active'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_qr_codes_code').on(table.organizationId, table.code),
    index('idx_qr_codes_campaign').on(table.campaignId),
    index('idx_qr_codes_location').on(table.city, table.neighborhood),
]);

// ============================================================================
// MARKETING: QR Code Scans
// Track individual scans for attribution
// ============================================================================

export const qrScans = sqliteTable('qr_scans', {
    id: text('id').primaryKey().default(uuid()),
    qrCodeId: text('qr_code_id').notNull().references(() => qrCodes.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Visitor tracking
    visitorId: text('visitor_id').references(() => visitors.id),
    sessionId: text('session_id').references(() => sessions.id),

    // Device info
    userAgent: text('user_agent'),
    deviceType: text('device_type', {
        enum: ['desktop', 'mobile', 'tablet']
    }),
    browser: text('browser'),
    os: text('os'),

    // Geo info (from IP)
    ipAddress: text('ip_address'),             // Hashed for privacy
    country: text('country'),
    region: text('region'),
    city: text('city'),

    // Scan context
    referrer: text('referrer'),                // What page they came from (rare for QR)

    // Conversion tracking
    converted: integer('converted', { mode: 'boolean' }).default(false),
    conversionType: text('conversion_type'),   // 'lead', 'form_submit', 'whatsapp'
    convertedAt: integer('converted_at'),
    leadId: text('lead_id').references(() => leads.id),

    scannedAt: integer('scanned_at').default(timestamp()),
}, (table) => [
    index('idx_qr_scans_qr').on(table.qrCodeId, table.scannedAt),
    index('idx_qr_scans_visitor').on(table.visitorId),
    index('idx_qr_scans_conversion').on(table.converted, table.convertedAt),
]);

// NOTE: landingPages table is defined earlier with organizations (line ~298)
// A/B testing features were merged into that definition


// ============================================================================
// MARKETING: A/B Test Assignments
// ============================================================================

export const abTestAssignments = sqliteTable('ab_test_assignments', {
    id: text('id').primaryKey().default(uuid()),
    visitorId: text('visitor_id').notNull().references(() => visitors.id),

    originalPageId: text('original_page_id').notNull().references(() => landingPages.id),
    assignedVariantId: text('assigned_variant_id').notNull().references(() => landingPages.id),

    // Conversion tracking
    converted: integer('converted', { mode: 'boolean' }).default(false),
    conversionType: text('conversion_type'),      // 'lead', 'purchase', etc.
    conversionValueCents: integer('conversion_value_cents'),
    convertedAt: integer('converted_at'),

    assignedAt: integer('assigned_at').default(timestamp()),
}, (table) => [
    index('idx_ab_test_visitor').on(table.visitorId),
    index('idx_ab_test_original').on(table.originalPageId),
]);

// ============================================================================
// MARKETING: Landing Page Daily Metrics
// ============================================================================

export const landingPageDailyMetrics = sqliteTable('landing_page_daily_metrics', {
    id: text('id').primaryKey().default(uuid()),
    landingPageId: text('landing_page_id').notNull().references(() => landingPages.id),
    date: integer('date').notNull(),              // YYYYMMDD format

    // Traffic
    visitors: integer('visitors').default(0),
    uniqueVisitors: integer('unique_visitors').default(0),
    pageViews: integer('page_views').default(0),

    // Engagement
    avgTimeOnPage: integer('avg_time_on_page').default(0),     // Seconds
    avgScrollDepth: integer('avg_scroll_depth').default(0),    // Percentage
    bounceRate: real('bounce_rate').default(0),

    // Conversions
    formStarts: integer('form_starts').default(0),
    formSubmits: integer('form_submits').default(0),
    leads: integer('leads').default(0),

    // Calculated
    cvr: real('cvr').default(0),                  // Conversion rate

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_lp_metrics_unique').on(table.landingPageId, table.date),
]);

// ============================================================================
// MARKETING: Campaign Daily Metrics
// ============================================================================

export const campaignDailyMetrics = sqliteTable('campaign_daily_metrics', {
    id: text('id').primaryKey().default(uuid()),
    campaignId: text('campaign_id').notNull().references(() => campaigns.id),
    date: integer('date').notNull(),              // YYYYMMDD format

    // Spend
    spendCents: integer('spend_cents').default(0),
    impressions: integer('impressions').default(0),
    clicks: integer('clicks').default(0),

    // Results
    leads: integer('leads').default(0),
    enrollments: integer('enrollments').default(0),
    revenueCents: integer('revenue_cents').default(0),

    // Calculated
    cpc: real('cpc'),                             // Cost per click
    cpl: real('cpl'),                             // Cost per lead
    cac: real('cac'),                             // Cost per acquisition
    roas: real('roas'),                           // Return on ad spend

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_campaign_metrics_unique').on(table.campaignId, table.date),
]);

// ============================================================================
// MARKETING: Targets & Goals
// ============================================================================

export const marketingTargets = sqliteTable('marketing_targets', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Period
    periodType: text('period_type', {
        enum: ['weekly', 'monthly', 'quarterly', 'yearly']
    }).notNull(),
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),

    // TOFU metrics targets
    targetVisitors: integer('target_visitors'),
    targetLeads: integer('target_leads'),
    targetCplCents: integer('target_cpl_cents'),  // Cost per lead

    // Conversion metrics targets
    targetTrials: integer('target_trials'),
    targetEnrollments: integer('target_enrollments'),
    targetCacCents: integer('target_cac_cents'),  // Customer acquisition cost

    // Revenue targets
    targetRevenueCents: integer('target_revenue_cents'),
    targetRoas: real('target_roas'),

    // Actuals (auto-calculated)
    actualVisitors: integer('actual_visitors').default(0),
    actualLeads: integer('actual_leads').default(0),
    actualTrials: integer('actual_trials').default(0),
    actualEnrollments: integer('actual_enrollments').default(0),
    actualRevenueCents: integer('actual_revenue_cents').default(0),
    actualSpendCents: integer('actual_spend_cents').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_marketing_targets_period').on(table.organizationId, table.periodStart),
]);

// ============================================================================
// ============================================================================
// COMMERCIAL MODULE - SALES TEAMS & OPERATIONS
// ============================================================================
// ============================================================================

// ============================================================================
// COMMERCIAL: Sales Teams
// Passive teams (inside sales) and Active teams (field sales)
// ============================================================================

export const salesTeams = sqliteTable('sales_teams', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    description: text('description'),

    // Team type
    teamType: text('team_type', {
        enum: ['passive', 'active', 'hybrid']
    }).notNull(),

    // Passive = inside sales, messaging, phone, content nurturing
    // Active = field sales, activations, events, door-to-door
    // Hybrid = both

    // Team lead
    leaderId: text('leader_id').references(() => persons.id),

    // Color for calendar/UI
    color: text('color').default('#7048e8'),

    // Targets
    monthlyLeadTarget: integer('monthly_lead_target'),
    monthlyTrialTarget: integer('monthly_trial_target'),
    monthlyEnrollmentTarget: integer('monthly_enrollment_target'),
    monthlyRevenueTarget: integer('monthly_revenue_target'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_sales_teams_org').on(table.organizationId),
    index('idx_sales_teams_type').on(table.teamType),
]);

// ============================================================================
// COMMERCIAL: Sales Team Members
// ============================================================================

export const salesTeamMembers = sqliteTable('sales_team_members', {
    id: text('id').primaryKey().default(uuid()),
    teamId: text('team_id').notNull().references(() => salesTeams.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    // Role in the team
    role: text('role', {
        enum: [
            'leader',           // Team lead
            'pre_sales',        // SDR - qualifies leads, schedules appointments
            'closer',           // Account Executive - closes deals
            'activator',        // Field agent - brand activations, events
            'hybrid'            // Does everything
        ]
    }).notNull(),

    // Individual targets (can override team targets)
    monthlyLeadTarget: integer('monthly_lead_target'),
    monthlyTrialTarget: integer('monthly_trial_target'),
    monthlyEnrollmentTarget: integer('monthly_enrollment_target'),

    // Commission structure (percentage)
    commissionRate: real('commission_rate'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    joinedAt: integer('joined_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_sales_team_members_unique').on(table.teamId, table.personId),
    index('idx_sales_team_members_person').on(table.personId),
]);

// ============================================================================
// COMMERCIAL: Sales Calendar (Team Coordination)
// The central planning tool for both passive and active teams
// ============================================================================

export const salesCalendar = sqliteTable('sales_calendar', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teamId: text('team_id').references(() => salesTeams.id),

    // Event type
    eventType: text('event_type', {
        enum: [
            // Passive team activities
            'follow_up_block',      // Scheduled follow-up time
            'call_block',           // Phone call block
            'content_session',      // Content creation/sending
            'meeting',              // Internal meeting
            'presentation',         // Sales presentation (online)

            // Active team activities
            'brand_activation',     // Field activation event
            'door_to_door',         // D2D sales
            'flyering',             // Flyer distribution
            'partner_visit',        // Visit partner location
            'corporate_visit',      // B2B company visit
            'school_visit',         // Visit potential school client
            'event_attendance',     // Attend external event

            // Both
            'trial_class',          // Experimental class
            'open_house',           // School open house
            'team_sync',            // Team coordination meeting
        ]
    }).notNull(),

    // Basic info
    title: text('title').notNull(),
    description: text('description'),

    // Timing
    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at'),
    allDay: integer('all_day', { mode: 'boolean' }).default(false),

    // Location (for field activities)
    locationType: text('location_type', {
        enum: ['school', 'partner', 'company', 'public', 'online', 'other']
    }),
    locationName: text('location_name'),
    address: text('address'),
    neighborhood: text('neighborhood'),
    city: text('city'),
    coordinates: text('coordinates'),     // JSON: { lat, lng }

    // Assignment
    assignedToId: text('assigned_to_id').references(() => persons.id),
    participants: text('participants').default('[]'),  // JSON array of user IDs

    // Resources needed
    materialsNeeded: text('materials_needed').default('[]'),  // ["flyers", "banner", "tablets", "coupons"]
    materialsChecklist: text('materials_checklist').default('{}'),

    // Link to related entities
    campaignId: text('campaign_id').references(() => campaigns.id),
    activationId: text('activation_id'),  // Will reference brandActivations
    leadId: text('lead_id').references(() => leads.id),

    // Results (filled after completion)
    status: text('status', {
        enum: ['planned', 'confirmed', 'in_progress', 'completed', 'cancelled']
    }).default('planned'),
    outcomes: text('outcomes').default('{}'),  // JSON: { leads: 5, trials: 2, ... }
    notes: text('notes'),

    // Recurrence
    recurrenceRule: text('recurrence_rule'),  // iCal RRULE
    parentEventId: text('parent_event_id'),   // For recurring event instances

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_sales_calendar_date').on(table.organizationId, table.startsAt),
    index('idx_sales_calendar_team').on(table.teamId, table.startsAt),
    index('idx_sales_calendar_assigned').on(table.assignedToId, table.startsAt),
]);

// ============================================================================
// COMMERCIAL: Sales Actions (Tasks)
// Individual actionable items for sales people
// ============================================================================

export const salesActions = sqliteTable('sales_actions', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teamId: text('team_id').references(() => salesTeams.id),

    // Action type
    actionType: text('action_type', {
        enum: [
            // Pre-sales (SDR)
            'initial_contact',      // First contact attempt
            'follow_up',            // Follow-up contact
            'qualify',              // Qualification call/chat
            'schedule_trial',       // Schedule trial class
            'send_info',            // Send information materials
            'nurture',              // Content nurturing touch

            // Closer activities
            'presentation',         // Sales presentation
            'proposal',             // Send proposal
            'negotiation',          // Price/terms negotiation
            'close',                // Close the deal
            'objection_handling',   // Handle objections

            // Active team
            'site_visit',           // Visit location
            'activation_prep',      // Prepare for activation
            'activation_execute',   // Execute activation
            'partner_outreach',     // Reach out to potential partner

            // General
            'other'
        ]
    }).notNull(),

    // Association
    leadId: text('lead_id').references(() => leads.id),
    calendarEventId: text('calendar_event_id').references(() => salesCalendar.id),

    // Task details
    title: text('title').notNull(),
    description: text('description'),
    priority: text('priority', {
        enum: ['urgent', 'high', 'medium', 'low']
    }).default('medium'),

    // Assignment
    assignedToId: text('assigned_to_id').references(() => persons.id),

    // Timing
    dueAt: integer('due_at'),
    completedAt: integer('completed_at'),

    // Status
    status: text('status', {
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'blocked']
    }).default('pending'),

    // Outcome
    outcome: text('outcome'),         // Free text result
    outcomeType: text('outcome_type', {
        enum: ['success', 'partial', 'failed', 'rescheduled', 'no_answer']
    }),
    nextActionId: text('next_action_id'),  // Chain to next action

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_sales_actions_lead').on(table.leadId),
    index('idx_sales_actions_assigned').on(table.assignedToId, table.status),
    index('idx_sales_actions_due').on(table.dueAt, table.status),
]);

// ============================================================================
// COMMERCIAL: Brand Activations
// Field marketing events with sweepstakes, coupons, demos
// ============================================================================

export const brandActivations = sqliteTable('brand_activations', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teamId: text('team_id').references(() => salesTeams.id),
    campaignId: text('campaign_id').references(() => campaigns.id),

    // Identity
    name: text('name').notNull(),
    description: text('description'),

    // Type
    activationType: text('activation_type', {
        enum: [
            'sweepstakes',          // Sorteio
            'coupon_distribution',  // Distribuição de cupons
            'product_demo',         // Demonstração
            'experience',           // Experiência imersiva
            'popup_stand',          // Stand temporário
            'sampling',             // Amostra grátis
            'competition',          // Competição/desafio
            'partnership_event',    // Evento com parceiro
            'other'
        ]
    }).notNull(),

    // Location
    venue: text('venue').notNull(),
    address: text('address'),
    neighborhood: text('neighborhood'),
    city: text('city'),
    coordinates: text('coordinates'),

    // Timing
    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at'),
    setupTime: integer('setup_time'),     // Minutes before for prep

    // Team
    leaderId: text('leader_id').references(() => persons.id),
    teamMembers: text('team_members').default('[]'),  // JSON array of user IDs

    // Materials & Resources
    materials: text('materials').default('[]'),        // ["banner", "flyers", "tablets", "prizes"]
    estimatedBudgetCents: integer('estimated_budget_cents'),
    actualCostCents: integer('actual_cost_cents'),

    // Incentives
    hasSweepstakes: integer('has_sweepstakes', { mode: 'boolean' }).default(false),
    sweepstakesDetails: text('sweepstakes_details'),   // JSON: { prize, rules, drawDate }
    hasCoupons: integer('has_coupons', { mode: 'boolean' }).default(false),
    couponCode: text('coupon_code'),
    couponDiscount: integer('coupon_discount'),        // Percentage

    // Performance tracking
    expectedFootTraffic: integer('expected_foot_traffic'),
    actualFootTraffic: integer('actual_foot_traffic'),
    contactsCollected: integer('contacts_collected').default(0),
    leadsGenerated: integer('leads_generated').default(0),
    trialsScheduled: integer('trials_scheduled').default(0),
    couponsDistributed: integer('coupons_distributed').default(0),
    sweepstakesEntries: integer('sweepstakes_entries').default(0),

    // QR code for this activation
    qrCodeId: text('qr_code_id'),  // References qrCodes

    status: text('status', {
        enum: ['draft', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled']
    }).default('draft'),

    notes: text('notes'),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_brand_activations_date').on(table.organizationId, table.startsAt),
    index('idx_brand_activations_campaign').on(table.campaignId),
]);

// ============================================================================
// COMMERCIAL: Coupons (for tracking distribution and redemption)
// ============================================================================

export const coupons = sqliteTable('coupons', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Code
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),

    // Type
    discountType: text('discount_type', {
        enum: ['percentage', 'fixed_amount', 'free_trial', 'free_material', 'other']
    }).notNull(),
    discountValue: integer('discount_value'),   // Percentage or cents

    // Validity
    validFrom: integer('valid_from'),
    validUntil: integer('valid_until'),
    maxUses: integer('max_uses'),
    currentUses: integer('current_uses').default(0),

    // Attribution
    campaignId: text('campaign_id').references(() => campaigns.id),
    activationId: text('activation_id').references(() => brandActivations.id),
    partnerId: text('partner_id'),  // References marketingPartners

    // Tracking
    distributedCount: integer('distributed_count').default(0),
    redeemedCount: integer('redeemed_count').default(0),
    totalValueRedeemedCents: integer('total_value_redeemed_cents').default(0),

    status: text('status', {
        enum: ['active', 'paused', 'expired', 'exhausted']
    }).default('active'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_coupons_code').on(table.organizationId, table.code),
    index('idx_coupons_campaign').on(table.campaignId),
]);

// ============================================================================
// COMMERCIAL: Coupon Redemptions
// ============================================================================

export const couponRedemptions = sqliteTable('coupon_redemptions', {
    id: text('id').primaryKey().default(uuid()),
    couponId: text('coupon_id').notNull().references(() => coupons.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Who redeemed
    leadId: text('lead_id').references(() => leads.id),
    personId: text('person_id').references(() => persons.id),
    enrollmentId: text('enrollment_id'),  // References enrollments

    // Value
    discountAppliedCents: integer('discount_applied_cents'),

    // How
    redeemedBy: text('redeemed_by').references(() => persons.id),  // Staff who processed
    redeemedAt: integer('redeemed_at').default(timestamp()),

    notes: text('notes'),
}, (table) => [
    index('idx_coupon_redemptions_coupon').on(table.couponId),
    index('idx_coupon_redemptions_lead').on(table.leadId),
]);

// ============================================================================
// COMMERCIAL: Sweepstakes Entries
// ============================================================================

export const sweepstakesEntries = sqliteTable('sweepstakes_entries', {
    id: text('id').primaryKey().default(uuid()),
    activationId: text('activation_id').notNull().references(() => brandActivations.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Entrant info
    leadId: text('lead_id').references(() => leads.id),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),

    // Entry details
    enteredAt: integer('entered_at').default(timestamp()),
    entrySource: text('entry_source'),   // "qr_scan", "form", "manual"

    // Winner status
    isWinner: integer('is_winner', { mode: 'boolean' }).default(false),
    prizeWon: text('prize_won'),
    notifiedAt: integer('notified_at'),
    claimedAt: integer('claimed_at'),
}, (table) => [
    index('idx_sweepstakes_entries_activation').on(table.activationId),
    index('idx_sweepstakes_entries_lead').on(table.leadId),
]);

// ============================================================================
// COMMERCIAL: Sales Pipeline (Lead Journey through Sales)
// ============================================================================

export const salesPipeline = sqliteTable('sales_pipeline', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    leadId: text('lead_id').notNull().references(() => leads.id),

    // Current stage
    stage: text('stage', {
        enum: [
            // Pre-sales (SDR)
            'new',                  // Just entered pipeline
            'contacted',            // First contact made
            'qualified',            // Qualified as potential
            'nurturing',            // In nurturing sequence

            // Closer
            'trial_scheduled',      // Trial class scheduled
            'trial_completed',      // Trial class done
            'proposal_sent',        // Proposal/pricing sent
            'negotiating',          // In negotiation
            'verbal_yes',           // Verbal commitment

            // Outcome
            'won',                  // Enrolled
            'lost',                 // Lost deal
            'dormant'               // Gone cold, may return
        ]
    }).notNull().default('new'),

    // Assignment
    preSalesOwnerId: text('pre_sales_owner_id').references(() => persons.id),
    closerOwnerId: text('closer_owner_id').references(() => persons.id),

    // Scores
    leadScore: integer('lead_score').default(0),          // 0-100
    urgencyScore: integer('urgency_score').default(50),    // How urgent
    fitScore: integer('fit_score').default(50),            // How good a fit

    // Expected value
    expectedRevenueCents: integer('expected_revenue_cents'),
    probability: integer('probability'),    // % chance to close

    // Timing
    expectedCloseDate: integer('expected_close_date'),
    actualCloseDate: integer('actual_close_date'),

    // Lost reason (if lost)
    lostReason: text('lost_reason', {
        enum: ['price', 'timing', 'competitor', 'no_need', 'no_response', 'other']
    }),
    lostDetails: text('lost_details'),

    // Touch tracking
    totalTouches: integer('total_touches').default(0),
    lastTouchAt: integer('last_touch_at'),
    lastTouchType: text('last_touch_type'),  // "call", "whatsapp", "email", "meeting"

    // Days in stage tracking
    stageEnteredAt: integer('stage_entered_at').default(timestamp()),
    daysInStage: integer('days_in_stage').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_sales_pipeline_lead').on(table.leadId),
    index('idx_sales_pipeline_stage').on(table.stage),
    index('idx_sales_pipeline_presales').on(table.preSalesOwnerId),
    index('idx_sales_pipeline_closer').on(table.closerOwnerId),
]);

// ============================================================================
// COMMERCIAL: Pipeline Stage History
// ============================================================================

export const pipelineStageHistory = sqliteTable('pipeline_stage_history', {
    id: text('id').primaryKey().default(uuid()),
    pipelineId: text('pipeline_id').notNull().references(() => salesPipeline.id, { onDelete: 'cascade' }),

    fromStage: text('from_stage'),
    toStage: text('to_stage').notNull(),

    changedBy: text('changed_by').references(() => persons.id),
    changedAt: integer('changed_at').default(timestamp()),

    reason: text('reason'),
    notes: text('notes'),
}, (table) => [
    index('idx_pipeline_history_pipeline').on(table.pipelineId, table.changedAt),
]);

// ============================================================================
// COMMERCIAL: Sales Touches (Contact Log)
// Every interaction with a lead
// ============================================================================

export const salesTouches = sqliteTable('sales_touches', {
    id: text('id').primaryKey().default(uuid()),
    pipelineId: text('pipeline_id').notNull().references(() => salesPipeline.id),
    leadId: text('lead_id').notNull().references(() => leads.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Touch details
    touchType: text('touch_type', {
        enum: [
            'phone_call',
            'whatsapp',
            'email',
            'sms',
            'video_call',
            'in_person',
            'social_dm',
            'form_submission',
            'content_interaction',
            'event_attendance',
            'other'
        ]
    }).notNull(),

    direction: text('direction', {
        enum: ['outbound', 'inbound']
    }).notNull(),

    // Content
    subject: text('subject'),
    summary: text('summary'),
    durationMinutes: integer('duration_minutes'),

    // Outcome
    outcome: text('outcome', {
        enum: ['connected', 'no_answer', 'voicemail', 'busy', 'scheduled_callback', 'not_interested', 'positive', 'neutral']
    }),

    // AI analysis
    sentimentDetected: text('sentiment_detected'),
    keyInsights: text('key_insights').default('[]'),  // JSON array

    // Attribution
    performedBy: text('performed_by').references(() => persons.id),
    touchedAt: integer('touched_at').default(timestamp()),

    // Next action scheduled
    nextActionScheduled: integer('next_action_scheduled', { mode: 'boolean' }).default(false),
    nextActionDate: integer('next_action_date'),
}, (table) => [
    index('idx_sales_touches_pipeline').on(table.pipelineId, table.touchedAt),
    index('idx_sales_touches_lead').on(table.leadId, table.touchedAt),
    index('idx_sales_touches_type').on(table.touchType),
]);

// ============================================================================
// COMMERCIAL: Sales Team Daily Metrics
// ============================================================================

export const salesTeamDailyMetrics = sqliteTable('sales_team_daily_metrics', {
    id: text('id').primaryKey().default(uuid()),
    teamId: text('team_id').notNull().references(() => salesTeams.id),
    personId: text('person_id').references(() => persons.id),  // null = team total
    date: integer('date').notNull(),  // YYYYMMDD

    // Activity metrics
    callsMade: integer('calls_made').default(0),
    callsConnected: integer('calls_connected').default(0),
    messagesent: integer('messages_sent').default(0),
    emailsSent: integer('emails_sent').default(0),
    meetingsHeld: integer('meetings_held').default(0),

    // Pipeline metrics
    newLeadsAssigned: integer('new_leads_assigned').default(0),
    leadsContacted: integer('leads_contacted').default(0),
    leadsQualified: integer('leads_qualified').default(0),
    trialsScheduled: integer('trials_scheduled').default(0),
    trialsCompleted: integer('trials_completed').default(0),
    proposalsSent: integer('proposals_sent').default(0),
    dealsWon: integer('deals_won').default(0),
    dealsLost: integer('deals_lost').default(0),

    // Revenue
    revenueCents: integer('revenue_cents').default(0),
    avgDealSizeCents: integer('avg_deal_size_cents'),

    // Active team metrics
    activationsCompleted: integer('activations_completed').default(0),
    couponsDistributed: integer('coupons_distributed').default(0),
    fieldContactsCollected: integer('field_contacts_collected').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_sales_metrics_date').on(table.teamId, table.personId, table.date),
]);

// ============================================================================
// ============================================================================
// OPERATIONAL STAFF MODULE - RECEPTION & FRONT DESK OPERATIONS
// ============================================================================
// ============================================================================

// ============================================================================
// OPERATIONS: Cashiers (Staff Cash Registers)
// Each operational staff has their own cashier for cash transactions
// ============================================================================

export const cashiers = sqliteTable('cashiers', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),

    // Cashier identity
    name: text('name').notNull(),            // "Caixa Maria", "Caixa Recepção 1"

    // Current status
    isOpen: integer('is_open', { mode: 'boolean' }).default(false),
    openedAt: integer('opened_at'),
    openedBy: text('opened_by').references(() => persons.id),

    // Opening balance (when opened)
    openingBalanceCents: integer('opening_balance_cents').default(0),

    // Current balance (updated with each transaction)
    currentBalanceCents: integer('current_balance_cents').default(0),

    // Expected balance (calculated from transactions)
    expectedBalanceCents: integer('expected_balance_cents').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_cashiers_org').on(table.organizationId),
    index('idx_cashiers_person').on(table.personId),
]);

// ============================================================================
// OPERATIONS: Cashier Sessions (Daily Open/Close)
// ============================================================================

export const cashierSessions = sqliteTable('cashier_sessions', {
    id: text('id').primaryKey().default(uuid()),
    cashierId: text('cashier_id').notNull().references(() => cashiers.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Session timing
    openedAt: integer('opened_at').notNull(),
    closedAt: integer('closed_at'),

    // Who operated
    openedBy: text('opened_by').notNull().references(() => persons.id),
    closedBy: text('closed_by').references(() => persons.id),

    // Balances
    openingBalanceCents: integer('opening_balance_cents').notNull(),
    closingBalanceCents: integer('closing_balance_cents'),
    expectedClosingCents: integer('expected_closing_cents'),

    // Discrepancy
    discrepancyCents: integer('discrepancy_cents'),
    discrepancyNotes: text('discrepancy_notes'),

    // Transaction summary
    totalReceived: integer('total_received').default(0),
    totalPaidOut: integer('total_paid_out').default(0),
    transactionCount: integer('transaction_count').default(0),

    // Status
    status: text('status', {
        enum: ['open', 'closing', 'closed', 'audited']
    }).default('open'),

    auditedBy: text('audited_by').references(() => persons.id),
    auditedAt: integer('audited_at'),
    auditNotes: text('audit_notes'),
}, (table) => [
    index('idx_cashier_sessions_cashier').on(table.cashierId, table.openedAt),
]);

// ============================================================================
// OPERATIONS: Cash Transactions
// ============================================================================

export const cashTransactions = sqliteTable('cash_transactions', {
    id: text('id').primaryKey().default(uuid()),
    sessionId: text('session_id').notNull().references(() => cashierSessions.id),
    cashierId: text('cashier_id').notNull().references(() => cashiers.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Transaction type
    transactionType: text('transaction_type', {
        enum: [
            'payment_received',     // Client paid
            'refund_given',         // Refund to client
            'sangria',              // Cash withdrawal to safe
            'suprimento',           // Cash deposit to register
            'adjustment',           // Manual adjustment
            'opening',              // Opening balance entry
            'closing'               // Closing balance entry
        ]
    }).notNull(),

    // Amount (positive for in, negative for out)
    amountCents: integer('amount_cents').notNull(),

    // Running balance after this transaction
    balanceAfterCents: integer('balance_after_cents'),

    // Payment details (if payment_received)
    paymentMethod: text('payment_method', {
        enum: ['cash', 'pix', 'credit_card', 'debit_card', 'check', 'boleto', 'transfer']
    }),
    paymentId: text('payment_id'),           // Reference to payments table
    enrollmentId: text('enrollment_id'),     // Reference to enrollment

    // Description
    description: text('description'),
    receiptNumber: text('receipt_number'),

    // Who processed
    processedBy: text('processed_by').notNull().references(() => persons.id),
    processedAt: integer('processed_at').default(timestamp()),
}, (table) => [
    index('idx_cash_transactions_session').on(table.sessionId),
    index('idx_cash_transactions_type').on(table.transactionType),
]);

// ============================================================================
// OPERATIONS: Reception Visits (Check-ins)
// When a lead/client arrives at the school
// ============================================================================

export const receptionVisits = sqliteTable('reception_visits', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Who is visiting
    leadId: text('lead_id').references(() => leads.id),
    personId: text('person_id').references(() => persons.id),  // If existing client/student

    // If walk-in (no lead yet)
    visitorName: text('visitor_name'),
    visitorPhone: text('visitor_phone'),
    visitorEmail: text('visitor_email'),

    // Visit purpose
    visitPurpose: text('visit_purpose', {
        enum: [
            'first_visit',          // First time visit - needs intake interview
            'trial_class',          // Here for trial class
            'presentation',         // Sales presentation
            'enrollment',           // Here to enroll
            'payment',              // Here to make payment
            'class',                // Regular class (existing student)
            'makeup_class',         // Reposição
            'meeting',              // Meeting with staff
            'pickup_materials',     // Pick up materials
            'other'
        ]
    }).notNull(),

    // Check-in/out
    checkedInAt: integer('checked_in_at').default(timestamp()),
    checkedOutAt: integer('checked_out_at'),
    checkedInBy: text('checked_in_by').references(() => persons.id),
    checkedOutBy: text('checked_out_by').references(() => persons.id),

    // Who will attend them
    assignedToId: text('assigned_to_id').references(() => persons.id),  // Closer, teacher, etc.

    // For appointments
    appointmentId: text('appointment_id'),   // If they had a scheduled appointment
    wasExpected: integer('was_expected', { mode: 'boolean' }).default(false),

    // Waiting
    waitStartedAt: integer('wait_started_at'),
    waitEndedAt: integer('wait_ended_at'),
    waitTimeMinutes: integer('wait_time_minutes'),

    // Status
    status: text('status', {
        enum: ['waiting', 'being_attended', 'completed', 'no_show', 'left_early']
    }).default('waiting'),

    notes: text('notes'),
}, (table) => [
    index('idx_reception_visits_date').on(table.organizationId, table.checkedInAt),
    index('idx_reception_visits_lead').on(table.leadId),
    index('idx_reception_visits_purpose').on(table.visitPurpose),
]);

// ============================================================================
// OPERATIONS: Intake Interviews (2nd Interview / Anamnese)
// Conversational intake to understand client needs and availability
// ============================================================================

export const intakeInterviews = sqliteTable('intake_interviews', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    visitId: text('visit_id').references(() => receptionVisits.id),
    leadId: text('lead_id').notNull().references(() => leads.id),

    // Interviewer
    conductedBy: text('conducted_by').notNull().references(() => persons.id),
    conductedAt: integer('conducted_at').default(timestamp()),
    durationMinutes: integer('duration_minutes'),

    // Student information
    studentName: text('student_name'),
    studentAge: integer('student_age'),
    studentBirthdate: integer('student_birthdate'),

    // School schedule (for kids/teens)
    schoolName: text('school_name'),
    schoolShift: text('school_shift', {
        enum: ['morning', 'afternoon', 'full_time', 'night', 'homeschool', 'not_applicable']
    }),
    schoolStartTime: text('school_start_time'),    // "07:00"
    schoolEndTime: text('school_end_time'),        // "12:00"

    // Availability
    availableDays: text('available_days').default('[]'),     // ["monday", "wednesday", "friday"]
    availableTimeSlots: text('available_time_slots').default('[]'),  // ["14:00-15:00", "15:00-16:00"]
    preferredFrequency: text('preferred_frequency', {
        enum: ['1x_week', '2x_week', '3x_week', 'intensive', 'flexible']
    }),

    // Goals and expectations
    primaryGoal: text('primary_goal'),             // "Learn English for travel"
    previousExperience: text('previous_experience'),
    currentLevel: text('current_level'),

    // Family/Billing info (for minors)
    responsibleName: text('responsible_name'),
    responsibleCpf: text('responsible_cpf'),
    responsiblePhone: text('responsible_phone'),
    responsibleEmail: text('responsible_email'),
    relationship: text('relationship', {
        enum: ['mother', 'father', 'guardian', 'self', 'other']
    }),

    // Additional insights discovered (for 3x3)
    discoveredDreams: text('discovered_dreams').default('[]'),
    discoveredHobbies: text('discovered_hobbies').default('[]'),
    discoveredAspirations: text('discovered_aspirations').default('[]'),

    // Notes for closer
    notesForCloser: text('notes_for_closer'),
    recommendedCourse: text('recommended_course'),
    recommendedSchedule: text('recommended_schedule'),
    potentialObjections: text('potential_objections'),

    // Status
    status: text('status', {
        enum: ['in_progress', 'completed', 'incomplete']
    }).default('in_progress'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_intake_interviews_lead').on(table.leadId),
    index('idx_intake_interviews_visit').on(table.visitId),
]);

// ============================================================================
// OPERATIONS: Checkout Process (Visit Completion)
// Records outcome of visit and handles enrollment process
// ============================================================================

export const checkoutRecords = sqliteTable('checkout_records', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    visitId: text('visit_id').notNull().references(() => receptionVisits.id),
    leadId: text('lead_id').references(() => leads.id),

    // Processed by
    processedBy: text('processed_by').notNull().references(() => persons.id),
    processedAt: integer('processed_at').default(timestamp()),

    // Closer feedback (if sales visit)
    closerId: text('closer_id').references(() => persons.id),
    closerFeedback: text('closer_feedback'),

    // Outcome
    outcome: text('outcome', {
        enum: [
            'enrolled',             // Closed the deal!
            'scheduling_trial',     // Will schedule trial
            'thinking',             // Needs time to think
            'price_objection',      // Price was an issue
            'timing_objection',     // Timing was an issue
            'not_interested',       // Not interested
            'competitor',           // Going with competitor
            'will_return',          // Will come back later
            'payment_only',         // Just came to pay
            'class_completed',      // Attended class
            'other'
        ]
    }).notNull(),

    outcomeNotes: text('outcome_notes'),

    // If enrolled - contract flow
    enrollmentId: text('enrollment_id'),          // Reference to enrollment
    contractId: text('contract_id'),              // Reference to contract
    contractStatus: text('contract_status', {
        enum: ['not_applicable', 'pending_generation', 'pending_signature', 'signed', 'cancelled']
    }).default('not_applicable'),

    // Follow-up scheduled
    followUpScheduled: integer('follow_up_scheduled', { mode: 'boolean' }).default(false),
    followUpDate: integer('follow_up_date'),
    followUpAssignedTo: text('follow_up_assigned_to').references(() => persons.id),
}, (table) => [
    index('idx_checkout_records_visit').on(table.visitId),
    index('idx_checkout_records_outcome').on(table.outcome),
]);

// ============================================================================
// OPERATIONS: Digital Contracts
// Contract generation and e-signature tracking
// ============================================================================

export const contracts = sqliteTable('contracts', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Related entities
    enrollmentId: text('enrollment_id'),          // Reference to enrollment
    leadId: text('lead_id').references(() => leads.id),
    personId: text('person_id').references(() => persons.id),  // If existing user

    // Contract template used
    templateId: text('template_id'),
    templateVersion: integer('template_version'),

    // Contract details
    contractNumber: text('contract_number').notNull(),
    contractType: text('contract_type', {
        enum: ['enrollment', 'renewal', 'material', 'event', 'other']
    }).notNull(),

    // Parties
    signerName: text('signer_name').notNull(),
    signerCpf: text('signer_cpf'),
    signerEmail: text('signer_email'),
    signerPhone: text('signer_phone'),

    // If minor, responsible party
    responsibleName: text('responsible_name'),
    responsibleCpf: text('responsible_cpf'),

    // Contract content
    contentHtml: text('content_html'),           // Generated contract HTML
    contentPdf: text('content_pdf'),             // PDF URL after generation

    // Values
    totalValueCents: integer('total_value_cents'),
    installments: integer('installments'),
    installmentValueCents: integer('installment_value_cents'),

    // E-signature
    signatureProvider: text('signature_provider', {
        enum: ['portal_br', 'd4sign', 'docusign', 'clicksign', 'zapsign', 'in_person', 'other']
    }),
    externalSignatureId: text('external_signature_id'),  // ID in external system
    signatureRequestUrl: text('signature_request_url'),   // URL to sign

    // Status
    status: text('status', {
        enum: [
            'draft',
            'pending_generation',
            'generated',
            'sent_for_signature',
            'partially_signed',
            'signed',
            'cancelled',
            'expired'
        ]
    }).default('draft'),

    // Timestamps
    generatedAt: integer('generated_at'),
    sentAt: integer('sent_at'),
    signedAt: integer('signed_at'),
    expiresAt: integer('expires_at'),

    // Final document
    signedDocumentUrl: text('signed_document_url'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_contracts_number').on(table.organizationId, table.contractNumber),
    index('idx_contracts_status').on(table.status),
    index('idx_contracts_enrollment').on(table.enrollmentId),
]);

// ============================================================================
// OPERATIONS: Payment Reminders
// Automated and manual reminders for upcoming/late payments
// ============================================================================

export const paymentReminders = sqliteTable('payment_reminders', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Who to remind
    personId: text('person_id').references(() => persons.id),
    enrollmentId: text('enrollment_id'),
    paymentId: text('payment_id'),               // Specific payment due

    // Contact info
    contactName: text('contact_name'),
    contactPhone: text('contact_phone'),
    contactEmail: text('contact_email'),

    // Reminder type
    reminderType: text('reminder_type', {
        enum: [
            'upcoming',             // Payment coming due
            'due_today',            // Due today
            'overdue_3_days',       // 3 days late
            'overdue_7_days',       // 1 week late
            'overdue_15_days',      // 2 weeks late
            'overdue_30_days',      // 1 month late
            'overdue_60_days',      // 2 months late
            'final_notice',         // Final notice before action
            'manual'                // Manual reminder
        ]
    }).notNull(),

    // Amount
    amountDueCents: integer('amount_due_cents'),
    daysOverdue: integer('days_overdue').default(0),

    // Channel
    channel: text('channel', {
        enum: ['whatsapp', 'sms', 'email', 'phone_call', 'in_person']
    }).notNull(),

    // Message
    messageTemplate: text('message_template'),
    messageSent: text('message_sent'),

    // Status
    status: text('status', {
        enum: ['scheduled', 'sent', 'delivered', 'read', 'responded', 'failed', 'cancelled']
    }).default('scheduled'),

    scheduledFor: integer('scheduled_for'),
    sentAt: integer('sent_at'),
    deliveredAt: integer('delivered_at'),
    respondedAt: integer('responded_at'),
    responseContent: text('response_content'),

    // Outcome
    resultedInPayment: integer('resulted_in_payment', { mode: 'boolean' }).default(false),
    paymentReceivedAt: integer('payment_received_at'),

    sentBy: text('sent_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_payment_reminders_person').on(table.personId),
    index('idx_payment_reminders_scheduled').on(table.scheduledFor, table.status),
]);

// ============================================================================
// OPERATIONS: Late Fee Negotiations
// Staff can negotiate late fees up to their authority level
// ============================================================================

export const lateFeeNegotiations = sqliteTable('late_fee_negotiations', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Related payment
    paymentId: text('payment_id').notNull(),     // Reference to overdue payment
    enrollmentId: text('enrollment_id'),
    personId: text('person_id').references(() => persons.id),  // Client

    // Original amounts
    originalAmountCents: integer('original_amount_cents').notNull(),
    lateFeeAmountCents: integer('late_fee_amount_cents').notNull(),
    totalOriginalCents: integer('total_original_cents').notNull(),

    // Negotiated amounts
    negotiatedLateFee: integer('negotiated_late_fee_cents'),
    discountAppliedCents: integer('discount_applied_cents'),
    finalAmountCents: integer('final_amount_cents').notNull(),

    // Negotiation details
    negotiatedBy: text('negotiated_by').notNull().references(() => persons.id),
    approvedBy: text('approved_by').references(() => persons.id),  // If above authority
    negotiatedAt: integer('negotiated_at').default(timestamp()),

    // Authority check
    staffAuthorityLimitCents: integer('staff_authority_limit_cents'),
    requiredApproval: integer('required_approval', { mode: 'boolean' }).default(false),

    // Reason
    negotiationReason: text('negotiation_reason', {
        enum: ['financial_hardship', 'long_time_client', 'first_time_late', 'partial_payment', 'retention_risk', 'other']
    }),
    reasonDetails: text('reason_details'),

    // Status
    status: text('status', {
        enum: ['pending_approval', 'approved', 'rejected', 'applied', 'cancelled']
    }).default('pending_approval'),

    // Outcome
    paymentReceivedAt: integer('payment_received_at'),
    paymentMethod: text('payment_method'),
}, (table) => [
    index('idx_late_fee_negotiations_payment').on(table.paymentId),
    index('idx_late_fee_negotiations_status').on(table.status),
]);

// ============================================================================
// OPERATIONS: Makeup Classes (Reposições)
// Scheduling missed classes
// ============================================================================

export const makeupClasses = sqliteTable('makeup_classes', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Student/Enrollment
    enrollmentId: text('enrollment_id').notNull(),
    personId: text('person_id').notNull().references(() => persons.id),

    // Original missed class
    originalClassId: text('original_class_id'),  // Reference to class instance
    originalDate: integer('original_date'),
    missedReason: text('missed_reason', {
        enum: ['student_absence', 'teacher_absence', 'holiday', 'weather', 'emergency', 'rescheduled', 'other']
    }),
    missedReasonDetails: text('missed_reason_details'),

    // Makeup scheduling
    scheduledDate: integer('scheduled_date'),
    scheduledTime: text('scheduled_time'),       // "14:00"
    roomId: text('room_id').references(() => rooms.id),
    teacherId: text('teacher_id').references(() => persons.id),

    // Validity
    validUntil: integer('valid_until'),          // Must use before this date
    isExpired: integer('is_expired', { mode: 'boolean' }).default(false),

    // Status
    status: text('status', {
        enum: [
            'pending',              // Needs scheduling
            'scheduled',            // Scheduled
            'completed',            // Attended
            'cancelled',            // Cancelled
            'no_show',              // Didn't show up
            'expired'               // Not used before deadline
        ]
    }).default('pending'),

    // Tracking
    scheduledBy: text('scheduled_by').references(() => persons.id),
    scheduledAt: integer('scheduled_at'),
    completedAt: integer('completed_at'),

    notes: text('notes'),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_makeup_classes_enrollment').on(table.enrollmentId),
    index('idx_makeup_classes_person').on(table.personId, table.status),
    index('idx_makeup_classes_scheduled').on(table.scheduledDate),
]);

// ============================================================================
// OPERATIONS: Staff Authority Levels
// Defines what operational staff can approve/negotiate
// ============================================================================

export const staffAuthorityLevels = sqliteTable('staff_authority_levels', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),

    // Late fee negotiation authority
    canNegotiateLateFees: integer('can_negotiate_late_fees', { mode: 'boolean' }).default(true),
    maxLateFeeDiscountPercent: integer('max_late_fee_discount_percent').default(50),
    maxLateFeeDiscountCents: integer('max_late_fee_discount_cents').default(5000),

    // Refund authority
    canProcessRefunds: integer('can_process_refunds', { mode: 'boolean' }).default(false),
    maxRefundCents: integer('max_refund_cents').default(0),

    // Discount authority
    canApplyDiscounts: integer('can_apply_discounts', { mode: 'boolean' }).default(false),
    maxDiscountPercent: integer('max_discount_percent').default(0),

    // Cashier authority
    maxCashWithdrawal: integer('max_cash_withdrawal_cents'),

    // Scheduling authority
    canScheduleMakeupClasses: integer('can_schedule_makeup_classes', { mode: 'boolean' }).default(true),
    canRescheduleClasses: integer('can_reschedule_classes', { mode: 'boolean' }).default(true),

    // Contract authority
    canSendContracts: integer('can_send_contracts', { mode: 'boolean' }).default(true),
    canVoidContracts: integer('can_void_contracts', { mode: 'boolean' }).default(false),

    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_staff_authority_person').on(table.personId),
]);

// ============================================================================
// ============================================================================
// ACADEMIC MODULE - METHODOLOGY & CURRICULUM
// ============================================================================
// ============================================================================

// ============================================================================
// ACADEMIC: Teaching Methodologies
// The pedagogical foundation - defines HOW teaching happens
// ============================================================================

export const teachingMethodologies = sqliteTable('teaching_methodologies', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),                // "Método Comunicativo", "TBL - Task Based Learning"
    code: text('code'),                          // "TBL", "PBL", "IBL"
    description: text('description'),

    // Core thesis / approach
    coreApproach: text('core_approach', {
        enum: [
            'tbl',                  // Task-Based Learning
            'pbl',                  // Project-Based Learning
            'ibl',                  // Inquiry-Based Learning
            'cbl',                  // Competency-Based Learning
            'communicative',        // Communicative Approach
            'direct_method',        // Direct Method
            'audio_lingual',        // Audio-Lingual Method
            'grammar_translation',  // Grammar-Translation
            'total_physical',       // Total Physical Response
            'suggestopedia',        // Suggestopedia
            'silent_way',           // Silent Way
            'blended',              // Blended Learning
            'flipped',              // Flipped Classroom
            'montessori',           // Montessori
            'waldorf',              // Waldorf/Steiner
            'reggio_emilia',        // Reggio Emilia
            'custom',               // Custom methodology
            'hybrid'                // Multiple approaches combined
        ]
    }).notNull(),

    // Teaching philosophy
    philosophyStatement: text('philosophy_statement'),
    learningObjectives: text('learning_objectives').default('[]'),      // JSON array

    // Key principles (up to 5)
    principles: text('principles').default('[]'),    // JSON array of strings

    // Target learner types
    targetAgeGroups: text('target_age_groups').default('[]'),          // ["children", "teens", "adults"]
    targetProficiencyLevels: text('target_proficiency_levels').default('[]'), // ["beginner", "intermediate", "advanced"]

    // Is this the default for new courses?
    isDefault: integer('is_default', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_methodologies_org').on(table.organizationId),
]);

// ============================================================================
// ACADEMIC: Class Structures
// How individual classes are organized and conducted
// ============================================================================

export const classStructures = sqliteTable('class_structures', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    methodologyId: text('methodology_id').references(() => teachingMethodologies.id),

    // Identity
    name: text('name').notNull(),            // "Standard 50min Class", "Intensive 90min"
    description: text('description'),

    // Duration
    durationMinutes: integer('duration_minutes').notNull(),

    // Class phases/stages (JSON array)
    // Each phase: { name, durationMinutes, description, activities }
    phases: text('phases').default('[]'),

    // Example phases:
    // [
    //   { "name": "Warm-up", "durationMinutes": 5, "description": "Engage students" },
    //   { "name": "Presentation", "durationMinutes": 15, "description": "Introduce new content" },
    //   { "name": "Practice", "durationMinutes": 20, "description": "Guided practice" },
    //   { "name": "Production", "durationMinutes": 8, "description": "Free practice" },
    //   { "name": "Wrap-up", "durationMinutes": 2, "description": "Review and preview" }
    // ]

    // Teacher-student interaction ratio
    teacherTalkTimePercent: integer('teacher_talk_time_percent').default(30),
    studentTalkTimePercent: integer('student_talk_time_percent').default(70),

    // Grouping preferences
    defaultGroupingType: text('default_grouping_type', {
        enum: ['whole_class', 'pairs', 'small_groups', 'individual', 'mixed']
    }).default('mixed'),

    maxStudentsRecommended: integer('max_students_recommended'),
    minStudentsRecommended: integer('min_students_recommended'),

    // Materials
    requiresMaterials: integer('requires_materials', { mode: 'boolean' }).default(true),
    typicalMaterials: text('typical_materials').default('[]'),

    isDefault: integer('is_default', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_class_structures_org').on(table.organizationId),
    index('idx_class_structures_methodology').on(table.methodologyId),
]);

// ============================================================================
// ACADEMIC: Homework Policies
// Defines whether/how homework is assigned and tracked
// ============================================================================

export const homeworkPolicies = sqliteTable('homework_policies', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    methodologyId: text('methodology_id').references(() => teachingMethodologies.id),

    // Identity
    name: text('name').notNull(),            // "Standard Homework", "No Homework", "Optional Practice"
    description: text('description'),

    // Policy type
    policyType: text('policy_type', {
        enum: [
            'required',             // Homework is required
            'optional',             // Homework is optional but encouraged
            'none',                 // No homework given
            'self_paced',           // Student chooses their own pace
            'flipped'               // Pre-class preparation required
        ]
    }).notNull(),

    // Frequency
    frequencyType: text('frequency_type', {
        enum: ['after_every_class', 'weekly', 'bi_weekly', 'monthly', 'per_unit', 'as_needed']
    }),

    // Typical time investment per assignment
    expectedTimeMinutes: integer('expected_time_minutes'),
    maxTimeMinutes: integer('max_time_minutes'),

    // Grading
    countsTowardsGrade: integer('counts_towards_grade', { mode: 'boolean' }).default(true),
    gradeWeightPercent: integer('grade_weight_percent').default(10),

    // Late policy
    allowsLateSubmission: integer('allows_late_submission', { mode: 'boolean' }).default(true),
    latePenaltyPerDay: integer('late_penalty_per_day'),           // Percentage per day
    maxLateDays: integer('max_late_days'),

    // Revision policy
    allowsRevision: integer('allows_revision', { mode: 'boolean' }).default(false),
    maxRevisions: integer('max_revisions'),

    isDefault: integer('is_default', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_homework_policies_org').on(table.organizationId),
]);

// ============================================================================
// ACADEMIC: Grading Scales
// How student performance is measured and reported
// ============================================================================

export const gradingScales = sqliteTable('grading_scales', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),            // "0-10 Scale", "A-F Letter Grades", "Pass/Fail"
    description: text('description'),

    // Scale type
    scaleType: text('scale_type', {
        enum: [
            'numeric',              // 0-10, 0-100
            'letter',               // A, B, C, D, F
            'percentage',           // 0-100%
            'pass_fail',            // Pass/Fail
            'competency',           // Developing/Proficient/Mastery
            'descriptive',          // Custom descriptors
            'points'                // Points-based
        ]
    }).notNull(),

    // Numeric range (if numeric/percentage)
    minValue: real('min_value').default(0),
    maxValue: real('max_value').default(10),
    passingValue: real('passing_value').default(6),

    // Grade levels (JSON array)
    // Each level: { code, name, minValue, maxValue, description, color }
    gradeLevels: text('grade_levels').default('[]'),

    // Example for letter scale:
    // [
    //   { "code": "A", "name": "Excellent", "minValue": 9, "maxValue": 10, "color": "#22c55e" },
    //   { "code": "B", "name": "Good", "minValue": 7, "maxValue": 8.99, "color": "#84cc16" },
    //   { "code": "C", "name": "Satisfactory", "minValue": 5, "maxValue": 6.99, "color": "#eab308" },
    //   { "code": "D", "name": "Needs Improvement", "minValue": 3, "maxValue": 4.99, "color": "#f97316" },
    //   { "code": "F", "name": "Failing", "minValue": 0, "maxValue": 2.99, "color": "#ef4444" }
    // ]

    // Display settings
    showNumericValue: integer('show_numeric_value', { mode: 'boolean' }).default(true),
    showLetterGrade: integer('show_letter_grade', { mode: 'boolean' }).default(true),
    showPercentage: integer('show_percentage', { mode: 'boolean' }).default(false),

    // Rounding
    roundingMethod: text('rounding_method', {
        enum: ['none', 'nearest', 'up', 'down', 'half_up']
    }).default('nearest'),
    decimalPlaces: integer('decimal_places').default(1),

    isDefault: integer('is_default', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_grading_scales_org').on(table.organizationId),
]);

// ============================================================================
// ACADEMIC: Assessment Types
// Types of assessments that can be used
// ============================================================================

export const assessmentTypes = sqliteTable('assessment_types', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),            // "Written Test", "Oral Presentation", "Project"
    code: text('code'),                      // "WRITTEN", "ORAL", "PROJECT"
    description: text('description'),
    icon: text('icon'),                      // Icon identifier

    // Category
    category: text('category', {
        enum: [
            'formative',            // Ongoing, low-stakes
            'summative',            // End of unit/term, high-stakes
            'diagnostic',           // Pre-assessment
            'self',                 // Self-assessment
            'peer',                 // Peer assessment
            'portfolio',            // Collection of work
            'performance',          // Practical demonstration
            'standardized'          // External standardized test
        ]
    }).notNull(),

    // Format
    format: text('format', {
        enum: [
            'written_test',
            'oral_test',
            'multiple_choice',
            'essay',
            'presentation',
            'project',
            'lab_practical',
            'portfolio',
            'observation',
            'quiz',
            'homework',
            'participation',
            'group_work',
            'peer_review',
            'self_reflection',
            'other'
        ]
    }).notNull(),

    // Settings
    defaultDurationMinutes: integer('default_duration_minutes'),
    defaultWeight: integer('default_weight'),           // Default grade weight %
    allowsRetake: integer('allows_retake', { mode: 'boolean' }).default(false),
    maxRetakes: integer('max_retakes'),

    // Grading
    defaultGradingScaleId: text('default_grading_scale_id').references(() => gradingScales.id),
    usesRubric: integer('uses_rubric', { mode: 'boolean' }).default(false),

    // Visibility
    showToStudents: integer('show_to_students', { mode: 'boolean' }).default(true),
    showToParents: integer('show_to_parents', { mode: 'boolean' }).default(true),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_assessment_types_org').on(table.organizationId),
    index('idx_assessment_types_category').on(table.category),
]);

// ============================================================================
// ACADEMIC: Scoring Criteria / Skills
// What competencies/skills are being assessed
// ============================================================================

export const scoringCriteria = sqliteTable('scoring_criteria', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),            // "Speaking", "Writing", "Grammar", "Vocabulary"
    code: text('code'),                      // "SPEAK", "WRITE", "GRAM"
    description: text('description'),
    icon: text('icon'),

    // Category (for grouping)
    category: text('category', {
        enum: [
            'language_skill',       // Speaking, Listening, Reading, Writing
            'language_system',      // Grammar, Vocabulary, Pronunciation
            'soft_skill',           // Collaboration, Critical Thinking
            'knowledge',            // Content knowledge
            'behavior',             // Participation, Effort
            'custom'
        ]
    }).notNull(),

    // For language skills specifically
    languageSkillType: text('language_skill_type', {
        enum: ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary', 'pronunciation', 'fluency', 'accuracy', 'other']
    }),

    // Hierarchy (for sub-criteria)
    parentCriterionId: text('parent_criterion_id'),  // Self-reference for hierarchy
    position: integer('position').default(0),

    // CEFR alignment (if applicable)
    cefrAligned: integer('cefr_aligned', { mode: 'boolean' }).default(false),

    // Default weight when used in assessments
    defaultWeight: integer('default_weight').default(100),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_scoring_criteria_org').on(table.organizationId),
    index('idx_scoring_criteria_category').on(table.category),
]);

// ============================================================================
// ACADEMIC: Rubrics
// Detailed scoring guidelines for assessments
// ============================================================================

export const rubrics = sqliteTable('rubrics', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),            // "Speaking Rubric - Intermediate"
    description: text('description'),

    // Type
    rubricType: text('rubric_type', {
        enum: [
            'analytic',             // Multiple criteria scored separately
            'holistic',             // Single overall score
            'single_point',         // Describes proficiency, student assessed against it
            'checklist'             // Yes/No checklist items
        ]
    }).notNull(),

    // Associated assessment types
    applicableAssessmentTypes: text('applicable_assessment_types').default('[]'),

    // Grading scale used
    gradingScaleId: text('grading_scale_id').references(() => gradingScales.id),

    // Total points (if points-based)
    totalPoints: integer('total_points'),

    isTemplate: integer('is_template', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_rubrics_org').on(table.organizationId),
]);

// ============================================================================
// ACADEMIC: Rubric Criteria
// Individual criteria within a rubric
// ============================================================================

export const rubricCriteria = sqliteTable('rubric_criteria', {
    id: text('id').primaryKey().default(uuid()),
    rubricId: text('rubric_id').notNull().references(() => rubrics.id, { onDelete: 'cascade' }),

    // Criterion
    scoringCriterionId: text('scoring_criterion_id').references(() => scoringCriteria.id),
    name: text('name').notNull(),            // Override name or custom
    description: text('description'),

    // Weighting
    weight: integer('weight').default(1),
    maxPoints: integer('max_points'),

    // Order
    position: integer('position').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_rubric_criteria_rubric').on(table.rubricId),
]);

// ============================================================================
// ACADEMIC: Rubric Performance Levels
// Descriptions for each level of performance on a criterion
// ============================================================================

export const rubricPerformanceLevels = sqliteTable('rubric_performance_levels', {
    id: text('id').primaryKey().default(uuid()),
    rubricCriterionId: text('rubric_criterion_id').notNull().references(() => rubricCriteria.id, { onDelete: 'cascade' }),

    // Level identity
    level: integer('level').notNull(),        // 1, 2, 3, 4...
    name: text('name').notNull(),             // "Excellent", "Proficient", "Developing", "Beginning"
    description: text('description'),         // Detailed description of what this level looks like

    // Points (if points-based)
    points: integer('points'),
    minPoints: integer('min_points'),
    maxPoints: integer('max_points'),

    // Color for UI
    color: text('color'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_performance_levels_criterion').on(table.rubricCriterionId),
]);

// ============================================================================
// ACADEMIC: Proficiency Levels (CEFR or custom)
// Student proficiency levels for placement and progression
// ============================================================================

export const proficiencyLevels = sqliteTable('proficiency_levels', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),            // "A1", "Beginner", "Level 1"
    displayName: text('display_name'),       // "Beginner (A1)"
    code: text('code'),                      // "A1", "BEG", "L1"
    description: text('description'),

    // Standard alignment
    cefrLevel: text('cefr_level', {
        enum: ['pre_a1', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2']
    }),

    // Hierarchy
    position: integer('position').notNull(), // Order (1 = lowest, higher = more advanced)

    // Estimated hours to complete this level
    estimatedHours: integer('estimated_hours'),

    // Color for UI
    color: text('color'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_proficiency_levels_org').on(table.organizationId),
]);

// ============================================================================
// ACADEMIC: School Programs (Course Offerings)
// The actual programs/courses offered by the school
// Note: Named 'schoolPrograms' to distinguish from e-learning 'courses'
// ============================================================================

export const schoolPrograms = sqliteTable('school_programs', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Identity
    name: text('name').notNull(),            // "English for Adults - Intermediate"
    code: text('code'),                      // "ENG-ADT-INT"
    description: text('description'),
    shortDescription: text('short_description'),

    // Methodology & Structure
    methodologyId: text('methodology_id').references(() => teachingMethodologies.id),
    classStructureId: text('class_structure_id').references(() => classStructures.id),
    homeworkPolicyId: text('homework_policy_id').references(() => homeworkPolicies.id),

    // Assessment
    gradingScaleId: text('grading_scale_id').references(() => gradingScales.id),

    // Proficiency
    targetProficiencyId: text('target_proficiency_id').references(() => proficiencyLevels.id),
    prerequisiteProficiencyId: text('prerequisite_proficiency_id').references(() => proficiencyLevels.id),

    // Duration
    durationWeeks: integer('duration_weeks'),
    classesPerWeek: integer('classes_per_week'),
    hoursPerClass: real('hours_per_class'),
    totalHours: integer('total_hours'),

    // Target audience
    targetAgeMin: integer('target_age_min'),
    targetAgeMax: integer('target_age_max'),
    targetAudienceType: text('target_audience_type', {
        enum: ['children', 'teens', 'adults', 'seniors', 'corporate', 'all']
    }),

    // Modality
    modality: text('modality', {
        enum: ['in_person', 'online', 'hybrid']
    }).default('in_person'),

    // Pricing (if applicable)
    basePriceCents: integer('base_price_cents'),
    materialsCostCents: integer('materials_cost_cents'),

    // Status
    status: text('status', {
        enum: ['draft', 'active', 'archived', 'discontinued']
    }).default('draft'),

    // Visibility
    isPublic: integer('is_public', { mode: 'boolean' }).default(true),
    showOnWebsite: integer('show_on_website', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_school_programs_org').on(table.organizationId),
    index('idx_school_programs_methodology').on(table.methodologyId),
    index('idx_school_programs_status').on(table.status),
]);

// ============================================================================
// ACADEMIC: Program Units / Modules
// Structure within a school program
// ============================================================================

export const programUnits = sqliteTable('program_units', {
    id: text('id').primaryKey().default(uuid()),
    programId: text('program_id').notNull().references(() => schoolPrograms.id, { onDelete: 'cascade' }),

    // Identity
    name: text('name').notNull(),            // "Unit 1: Introductions"
    description: text('description'),
    objectives: text('objectives').default('[]'),    // JSON array of learning objectives

    // Position in course
    position: integer('position').notNull(),

    // Duration
    estimatedHours: integer('estimated_hours'),
    estimatedClasses: integer('estimated_classes'),

    // Content topics
    topics: text('topics').default('[]'),     // JSON array of topics covered

    // Assessments for this module
    hasAssessment: integer('has_assessment', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_program_units_program').on(table.programId),
]);

// ============================================================================
// ACADEMIC: Course Assessment Weights
// How different assessment types are weighted in final grade
// ============================================================================

export const programAssessmentWeights = sqliteTable('program_assessment_weights', {
    id: text('id').primaryKey().default(uuid()),
    programId: text('program_id').notNull().references(() => schoolPrograms.id, { onDelete: 'cascade' }),


    // Assessment type
    assessmentTypeId: text('assessment_type_id').notNull().references(() => assessmentTypes.id),

    // Weight in final grade
    weight: integer('weight').notNull(),      // Percentage (e.g., 25 for 25%)

    // Description
    description: text('description'),         // "Midterm Exam", "Final Project"

    // How many of this type?
    count: integer('count').default(1),
    dropLowest: integer('drop_lowest').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_program_weights_program').on(table.programId),
]);

// ============================================================================
// ACADEMIC: Pass/Fail Requirements
// What students need to pass a course
// ============================================================================

export const programPassRequirements = sqliteTable('program_pass_requirements', {
    id: text('id').primaryKey().default(uuid()),
    programId: text('program_id').notNull().references(() => schoolPrograms.id, { onDelete: 'cascade' }),

    // Requirement type
    requirementType: text('requirement_type', {
        enum: [
            'minimum_grade',        // Must achieve minimum overall grade
            'minimum_attendance',   // Must achieve minimum attendance %
            'pass_all_assessments', // Must pass all assessments
            'pass_final',           // Must pass final exam
            'complete_all_homework',// Must complete all homework
            'minimum_participation',// Must achieve participation score
            'custom'
        ]
    }).notNull(),

    // Threshold
    minimumValue: real('minimum_value'),      // The minimum value required
    isPercentage: integer('is_percentage', { mode: 'boolean' }).default(true),

    // Description
    description: text('description'),

    // Is this requirement mandatory?
    isMandatory: integer('is_mandatory', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_program_pass_requirements').on(table.programId),
]);

// ============================================================================
// ============================================================================
// SERVICE DELIVERY MODULE - CLASSES, SCHEDULING & GRADING
// ============================================================================
// ============================================================================

// ============================================================================
// SERVICE: Class Groups
// A group of students studying together in a program
// ============================================================================

export const classGroups = sqliteTable('class_groups', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Program being taught
    programId: text('program_id').notNull().references(() => schoolPrograms.id),
    termId: text('term_id').references(() => terms.id),

    // Identity
    name: text('name').notNull(),            // "English Intermediate A - Evening"
    code: text('code'),                      // "ENG-INT-A-EVE"

    // Proficiency level
    proficiencyLevelId: text('proficiency_level_id').references(() => proficiencyLevels.id),

    // Capacity
    maxStudents: integer('max_students').default(15),
    minStudents: integer('min_students').default(3),

    // Primary room (can be overridden per schedule)
    defaultRoomId: text('default_room_id').references(() => rooms.id),

    // Dates
    startDate: integer('start_date'),
    endDate: integer('end_date'),

    // Status
    status: text('status', {
        enum: ['planned', 'open_enrollment', 'active', 'completed', 'cancelled']
    }).default('planned'),

    // Modality
    modality: text('modality', {
        enum: ['in_person', 'online', 'hybrid']
    }).default('in_person'),

    // For online classes
    meetingUrl: text('meeting_url'),
    meetingPlatform: text('meeting_platform', {
        enum: ['zoom', 'meet', 'teams', 'custom', 'none']
    }),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_class_groups_org').on(table.organizationId),
    index('idx_class_groups_program').on(table.programId),
    index('idx_class_groups_term').on(table.termId),
    index('idx_class_groups_status').on(table.status),
]);

// ============================================================================
// SERVICE: Teacher Assignments
// Which teachers are assigned to which classes
// ============================================================================

export const teacherAssignments = sqliteTable('teacher_assignments', {
    id: text('id').primaryKey().default(uuid()),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id, { onDelete: 'cascade' }),
    teacherId: text('teacher_id').notNull().references(() => persons.id),

    // Role
    role: text('role', {
        enum: ['primary', 'assistant', 'substitute', 'observer']
    }).default('primary'),

    // Effective dates (if different from class dates)
    startDate: integer('start_date'),
    endDate: integer('end_date'),

    // Workload
    hoursPerWeek: real('hours_per_week'),
    payRatePerHour: integer('pay_rate_per_hour_cents'),

    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_teacher_assignments_class').on(table.classGroupId),
    index('idx_teacher_assignments_teacher').on(table.teacherId),
]);

// ============================================================================
// SERVICE: Class Schedules (Weekly Recurring)
// When classes happen during the week
// ============================================================================

export const programClassSchedules = sqliteTable('program_class_schedules', {
    id: text('id').primaryKey().default(uuid()),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id, { onDelete: 'cascade' }),

    // Day of week (0 = Sunday, 1 = Monday, etc.)
    dayOfWeek: integer('day_of_week').notNull(),

    // Time
    startTime: text('start_time').notNull(),     // "14:00"
    endTime: text('end_time').notNull(),         // "15:30"

    // Room (can override class default)
    roomId: text('room_id').references(() => rooms.id),

    // Teacher (can override class default)
    teacherId: text('teacher_id').references(() => persons.id),

    // Effective dates (for schedule changes mid-term)
    effectiveFrom: integer('effective_from'),
    effectiveUntil: integer('effective_until'),

    // Is this schedule currently active?
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_program_class_schedules_class').on(table.classGroupId),
    index('idx_program_class_schedules_day').on(table.dayOfWeek),
]);

// ============================================================================
// SERVICE: Class Sessions (Individual Meetings)
// Each individual occurrence of a class
// ============================================================================

export const programClassSessions = sqliteTable('program_class_sessions', {
    id: text('id').primaryKey().default(uuid()),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id, { onDelete: 'cascade' }),
    scheduleId: text('schedule_id').references(() => programClassSchedules.id),

    // Date and time
    sessionDate: integer('session_date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),

    // Who's teaching this specific session
    teacherId: text('teacher_id').references(() => persons.id),

    // Where
    roomId: text('room_id').references(() => rooms.id),

    // Content covered
    programUnitId: text('program_unit_id').references(() => programUnits.id),
    lessonTopic: text('lesson_topic'),
    lessonObjectives: text('lesson_objectives'),

    // Notes
    teacherNotes: text('teacher_notes'),
    contentCovered: text('content_covered'),

    // Status
    status: text('status', {
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'holiday']
    }).default('scheduled'),

    cancelledReason: text('cancelled_reason'),
    rescheduledToId: text('rescheduled_to_id'),  // If rescheduled, points to new session

    // Actual times (if different from scheduled)
    actualStartTime: text('actual_start_time'),
    actualEndTime: text('actual_end_time'),

    // Metrics
    studentsPresent: integer('students_present').default(0),
    studentsAbsent: integer('students_absent').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_program_class_sessions_class').on(table.classGroupId, table.sessionDate),
    index('idx_program_class_sessions_teacher').on(table.teacherId),
    index('idx_program_class_sessions_date').on(table.sessionDate),
]);

// ============================================================================
// SERVICE: Student Enrollments in Classes
// Links students to class groups
// ============================================================================

export const classEnrollments = sqliteTable('class_enrollments', {
    id: text('id').primaryKey().default(uuid()),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id),
    personId: text('person_id').notNull().references(() => persons.id),

    // Link to original enrollment/payment
    enrollmentId: text('enrollment_id'),         // Reference to enrollment record

    // Dates
    enrolledAt: integer('enrolled_at').default(timestamp()),
    startDate: integer('start_date'),            // When they joined (may differ from class start)
    endDate: integer('end_date'),                // When they left (may differ from class end)

    // Status
    status: text('status', {
        enum: ['active', 'completed', 'withdrawn', 'transferred', 'on_hold']
    }).default('active'),

    withdrawalReason: text('withdrawal_reason'),
    withdrawalDate: integer('withdrawal_date'),

    // Transfer
    transferredFromClassId: text('transferred_from_class_id'),
    transferredToClassId: text('transferred_to_class_id'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_class_enrollments_unique').on(table.classGroupId, table.personId),
    index('idx_class_enrollments_person').on(table.personId),
    index('idx_class_enrollments_status').on(table.status),
]);

// ============================================================================
// SERVICE: Attendance Records
// Track who attended each session
// ============================================================================

export const attendanceRecords = sqliteTable('attendance_records', {
    id: text('id').primaryKey().default(uuid()),
    sessionId: text('session_id').notNull().references(() => programClassSessions.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),
    classEnrollmentId: text('class_enrollment_id').references(() => classEnrollments.id),

    // Attendance status
    status: text('status', {
        enum: ['present', 'absent', 'late', 'excused', 'left_early']
    }).notNull(),

    // Time tracking (if late or left early)
    arrivalTime: text('arrival_time'),
    departureTime: text('departure_time'),
    minutesLate: integer('minutes_late'),
    minutesMissed: integer('minutes_missed'),

    // Excuse details (if excused)
    excuseType: text('excuse_type', {
        enum: ['medical', 'family', 'work', 'travel', 'other']
    }),
    excuseNote: text('excuse_note'),
    excuseDocumentUrl: text('excuse_document_url'),
    isVerified: integer('is_verified', { mode: 'boolean' }).default(false),

    // Entitles makeup class?
    entitlesMakeup: integer('entitles_makeup', { mode: 'boolean' }).default(false),
    makeupClassId: text('makeup_class_id').references(() => makeupClasses.id),

    // Notes
    notes: text('notes'),

    // Who recorded
    recordedBy: text('recorded_by').references(() => persons.id),
    recordedAt: integer('recorded_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_attendance_session_person').on(table.sessionId, table.personId),
    index('idx_attendance_records_person').on(table.personId),
    index('idx_attendance_records_status').on(table.status),
]);

// ============================================================================
// SERVICE: Student Assessments (Actual Assessment Events)
// Individual assessment instances for a class
// ============================================================================

export const studentAssessments = sqliteTable('student_assessments', {
    id: text('id').primaryKey().default(uuid()),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id),
    assessmentTypeId: text('assessment_type_id').notNull().references(() => assessmentTypes.id),

    // Identity
    name: text('name').notNull(),            // "Unit 1 Quiz", "Midterm Exam"
    description: text('description'),

    // Linked to program unit?
    programUnitId: text('program_unit_id').references(() => programUnits.id),

    // When
    scheduledDate: integer('scheduled_date'),
    dueDate: integer('due_date'),

    // Duration
    durationMinutes: integer('duration_minutes'),

    // Scoring
    gradingScaleId: text('grading_scale_id').references(() => gradingScales.id),
    rubricId: text('rubric_id').references(() => rubrics.id),
    maxPoints: real('max_points'),

    // Weight in overall grade
    weight: integer('weight'),               // Percentage

    // Status
    status: text('status', {
        enum: ['draft', 'published', 'in_progress', 'grading', 'completed']
    }).default('draft'),

    // Settings
    allowsRetake: integer('allows_retake', { mode: 'boolean' }).default(false),
    maxRetakes: integer('max_retakes').default(0),
    showGradeToStudent: integer('show_grade_to_student', { mode: 'boolean' }).default(true),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_student_assessments_class').on(table.classGroupId),
    index('idx_student_assessments_date').on(table.scheduledDate),
]);

// ============================================================================
// SERVICE: Student Grades
// Individual student scores on assessments
// ============================================================================

export const studentGrades = sqliteTable('student_grades', {
    id: text('id').primaryKey().default(uuid()),
    assessmentId: text('assessment_id').notNull().references(() => studentAssessments.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),
    classEnrollmentId: text('class_enrollment_id').references(() => classEnrollments.id),

    // Score
    rawScore: real('raw_score'),             // Points earned
    maxScore: real('max_score'),             // Max possible
    percentageScore: real('percentage_score'),    // Calculated %
    letterGrade: text('letter_grade'),       // Converted to letter
    finalScore: real('final_score'),         // After any adjustments

    // Retake info
    attemptNumber: integer('attempt_number').default(1),
    isRetake: integer('is_retake', { mode: 'boolean' }).default(false),
    previousGradeId: text('previous_grade_id'),  // Link to previous attempt

    // Status
    status: text('status', {
        enum: ['not_submitted', 'submitted', 'grading', 'graded', 'excused', 'incomplete']
    }).default('not_submitted'),

    // Dates
    submittedAt: integer('submitted_at'),
    gradedAt: integer('graded_at'),

    // Feedback
    teacherFeedback: text('teacher_feedback'),
    rubricScores: text('rubric_scores').default('{}'),   // JSON: criterion_id -> score

    // Who graded
    gradedBy: text('graded_by').references(() => persons.id),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_student_grades_unique').on(table.assessmentId, table.personId, table.attemptNumber),
    index('idx_student_grades_person').on(table.personId),
]);

// ============================================================================
// SERVICE: Gradebook Entries (Aggregated per Student per Class)
// Running totals and final grades
// ============================================================================

export const gradebookEntries = sqliteTable('gradebook_entries', {
    id: text('id').primaryKey().default(uuid()),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id),
    personId: text('person_id').notNull().references(() => persons.id),
    classEnrollmentId: text('class_enrollment_id').references(() => classEnrollments.id),

    // Attendance metrics
    totalSessions: integer('total_sessions').default(0),
    sessionsAttended: integer('sessions_attended').default(0),
    sessionsAbsent: integer('sessions_absent').default(0),
    sessionsExcused: integer('sessions_excused').default(0),
    attendancePercentage: real('attendance_percentage'),

    // Grade metrics
    totalAssessments: integer('total_assessments').default(0),
    assessmentsCompleted: integer('assessments_completed').default(0),
    currentGrade: real('current_grade'),
    currentLetterGrade: text('current_letter_grade'),

    // Final grade (when class ends)
    finalGrade: real('final_grade'),
    finalLetterGrade: text('final_letter_grade'),
    isPassing: integer('is_passing', { mode: 'boolean' }),

    // Participation score (if tracked)
    participationScore: real('participation_score'),

    // Homework completion
    homeworkAssigned: integer('homework_assigned').default(0),
    homeworkCompleted: integer('homework_completed').default(0),
    homeworkCompletionRate: real('homework_completion_rate'),

    // Status
    status: text('status', {
        enum: ['in_progress', 'completed', 'incomplete', 'withdrawn']
    }).default('in_progress'),

    // Timestamps
    lastUpdated: integer('last_updated').default(timestamp()),
    finalizedAt: integer('finalized_at'),
}, (table) => [
    uniqueIndex('idx_gradebook_unique').on(table.classGroupId, table.personId),
    index('idx_gradebook_person').on(table.personId),
]);

// ============================================================================
// SERVICE: Teacher Daily Workload
// Track teacher hours and classes per day
// ============================================================================

export const teacherWorkload = sqliteTable('teacher_workload', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teacherId: text('teacher_id').notNull().references(() => persons.id),
    date: integer('date').notNull(),

    // Sessions
    sessionsScheduled: integer('sessions_scheduled').default(0),
    sessionsCompleted: integer('sessions_completed').default(0),
    sessionsCancelled: integer('sessions_cancelled').default(0),

    // Hours
    scheduledHours: real('scheduled_hours').default(0),
    actualHours: real('actual_hours').default(0),

    // Students
    totalStudents: integer('total_students').default(0),
    studentsAttended: integer('students_attended').default(0),

    // Compensation (if paid hourly)
    payableHours: real('payable_hours').default(0),
    payableAmountCents: integer('payable_amount_cents').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_teacher_workload_date').on(table.teacherId, table.date),
    index('idx_teacher_workload_org').on(table.organizationId, table.date),
]);

// ============================================================================
// SERVICE: Homework Assignments
// Individual homework tasks for classes
// ============================================================================

export const homeworkAssignments = sqliteTable('homework_assignments', {
    id: text('id').primaryKey().default(uuid()),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id),
    sessionId: text('session_id').references(() => programClassSessions.id),  // If assigned in a specific class

    // Identity
    title: text('title').notNull(),
    description: text('description'),
    instructions: text('instructions'),

    // Type
    homeworkType: text('homework_type', {
        enum: ['practice', 'reading', 'writing', 'project', 'research', 'review', 'other']
    }).default('practice'),

    // Dates
    assignedDate: integer('assigned_date'),
    dueDate: integer('due_date'),

    // Linked to unit?
    programUnitId: text('program_unit_id').references(() => programUnits.id),

    // Grading
    isGraded: integer('is_graded', { mode: 'boolean' }).default(true),
    maxPoints: real('max_points'),
    weight: integer('weight'),               // Weight in homework grade

    // Time estimate
    estimatedMinutes: integer('estimated_minutes'),

    // Resources
    resourceUrls: text('resource_urls').default('[]'),   // JSON array

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_homework_class').on(table.classGroupId),
    index('idx_homework_due').on(table.dueDate),
]);

// ============================================================================
// SERVICE: Homework Submissions
// Student submissions for homework
// ============================================================================

export const homeworkSubmissions = sqliteTable('homework_submissions', {
    id: text('id').primaryKey().default(uuid()),
    homeworkId: text('homework_id').notNull().references(() => homeworkAssignments.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),
    classEnrollmentId: text('class_enrollment_id').references(() => classEnrollments.id),

    // Submission
    submittedAt: integer('submitted_at'),
    submissionContent: text('submission_content'),
    attachmentUrls: text('attachment_urls').default('[]'),

    // Late?
    isLate: integer('is_late', { mode: 'boolean' }).default(false),
    daysLate: integer('days_late'),
    latePenaltyApplied: integer('late_penalty_applied'),  // Percentage

    // Grade
    rawScore: real('raw_score'),
    adjustedScore: real('adjusted_score'),   // After late penalty
    maxScore: real('max_score'),

    // Feedback
    teacherFeedback: text('teacher_feedback'),

    // Status
    status: text('status', {
        enum: ['not_started', 'in_progress', 'submitted', 'graded', 'returned', 'excused']
    }).default('not_started'),

    gradedBy: text('graded_by').references(() => persons.id),
    gradedAt: integer('graded_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_homework_submission_unique').on(table.homeworkId, table.personId),
    index('idx_homework_submission_person').on(table.personId),
]);

// ============================================================================
// SERVICE: Student Progress / Proficiency Advancement
// Tracks when students advance to next level
// ============================================================================

export const studentProgressions = sqliteTable('student_progressions', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // From level
    fromProficiencyId: text('from_proficiency_id').references(() => proficiencyLevels.id),

    // To level
    toProficiencyId: text('to_proficiency_id').notNull().references(() => proficiencyLevels.id),

    // When
    progressionDate: integer('progression_date').default(timestamp()),

    // Based on what
    basedOn: text('based_on', {
        enum: ['class_completion', 'assessment', 'placement_test', 'manual', 'transfer']
    }).notNull(),

    // Evidence
    classGroupId: text('class_group_id').references(() => classGroups.id),
    assessmentId: text('assessment_id').references(() => studentAssessments.id),
    finalGrade: real('final_grade'),
    notes: text('notes'),

    // Who approved
    approvedBy: text('approved_by').references(() => persons.id),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_student_progressions_person').on(table.personId),
    index('idx_student_progressions_date').on(table.progressionDate),
]);

// ============================================================================
// ============================================================================
// PEDAGOGICAL COMMUNICATION - QUALITATIVE PROGRESS NOTES
// ============================================================================
// ============================================================================

// ============================================================================
// PEDAGOGICAL: Student Notes
// Subjective observations about student progress, behavior, development
// ============================================================================

export const pedagogicalNotes = sqliteTable('pedagogical_notes', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Who is this note about?
    personId: text('person_id').notNull().references(() => persons.id),   // The student

    // Context (optional - can be general or tied to specific context)
    classGroupId: text('class_group_id').references(() => classGroups.id),
    sessionId: text('session_id').references(() => programClassSessions.id),
    assessmentId: text('assessment_id').references(() => studentAssessments.id),

    // Note category
    category: text('category', {
        enum: [
            'progress',             // General progress observation
            'behavior',             // Behavioral observation
            'participation',        // Class participation
            'effort',               // Effort and dedication
            'challenge',            // Struggles or challenges
            'achievement',          // Accomplishments
            'concern',              // Areas of concern
            'recommendation',       // Recommendations for improvement
            'parent_meeting',       // Notes from parent meeting
            'intervention',         // Intervention needed
            'positive',             // Positive reinforcement
            'other'
        ]
    }).notNull(),

    // The note itself
    title: text('title'),
    content: text('content').notNull(),

    // Sentiment / tone
    sentiment: text('sentiment', {
        enum: ['positive', 'neutral', 'concern', 'critical']
    }).default('neutral'),

    // VISIBILITY - Critical for privacy
    visibility: text('visibility', {
        enum: [
            'private',              // Only visible to staff (internal)
            'staff_only',           // All pedagogical staff can see
            'parents_only',         // Shared with parents but not student
            'student_visible',      // Student can see
            'public'                // Student and parents can see
        ]
    }).default('staff_only'),

    // Is this note flagged for attention?
    isFlagged: integer('is_flagged', { mode: 'boolean' }).default(false),
    flagReason: text('flag_reason'),

    // Action required?
    requiresAction: integer('requires_action', { mode: 'boolean' }).default(false),
    actionDescription: text('action_description'),
    actionCompletedAt: integer('action_completed_at'),
    actionCompletedBy: text('action_completed_by').references(() => persons.id),

    // Follow-up
    followUpDate: integer('follow_up_date'),
    followUpAssignedTo: text('follow_up_assigned_to').references(() => persons.id),

    // Who wrote this note
    createdBy: text('created_by').notNull().references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_pedagogical_notes_person').on(table.personId),
    index('idx_pedagogical_notes_class').on(table.classGroupId),
    index('idx_pedagogical_notes_visibility').on(table.visibility),
    index('idx_pedagogical_notes_flagged').on(table.isFlagged),
    index('idx_pedagogical_notes_follow_up').on(table.followUpDate),
]);

// ============================================================================
// PEDAGOGICAL: Note Replies / Threads
// Staff can discuss notes internally
// ============================================================================

export const pedagogicalNoteReplies = sqliteTable('pedagogical_note_replies', {
    id: text('id').primaryKey().default(uuid()),
    noteId: text('note_id').notNull().references(() => pedagogicalNotes.id, { onDelete: 'cascade' }),

    // Reply content
    content: text('content').notNull(),

    // Always internal (staff only)
    createdBy: text('created_by').notNull().references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_note_replies_note').on(table.noteId),
]);

// ============================================================================
// PEDAGOGICAL: Note Acknowledgements
// Track when notes are read by relevant parties
// ============================================================================

export const pedagogicalNoteAcknowledgements = sqliteTable('pedagogical_note_acknowledgements', {
    id: text('id').primaryKey().default(uuid()),
    noteId: text('note_id').notNull().references(() => pedagogicalNotes.id, { onDelete: 'cascade' }),

    // Who acknowledged
    acknowledgedBy: text('acknowledged_by').notNull().references(() => persons.id),

    // Type of acknowledgement
    acknowledgerType: text('acknowledger_type', {
        enum: ['staff', 'teacher', 'coordinator', 'parent', 'student']
    }).notNull(),

    acknowledgedAt: integer('acknowledged_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_note_ack_unique').on(table.noteId, table.acknowledgedBy),
]);

// ============================================================================
// PEDAGOGICAL: Progress Reports
// Formal periodic reports shared with parents/students
// ============================================================================

export const progressReports = sqliteTable('progress_reports', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Who is this report for?
    personId: text('person_id').notNull().references(() => persons.id),

    // Context
    classGroupId: text('class_group_id').references(() => classGroups.id),
    termId: text('term_id').references(() => terms.id),

    // Report period
    periodType: text('period_type', {
        enum: ['monthly', 'quarterly', 'semester', 'annual', 'custom']
    }).notNull(),
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),

    // Report sections (JSON)
    // { "attendance": {...}, "grades": {...}, "qualitative": {...} }
    reportData: text('report_data').default('{}'),

    // Qualitative summary
    overallSummary: text('overall_summary'),
    strengths: text('strengths'),                    // What they're doing well
    areasForImprovement: text('areas_for_improvement'),
    recommendations: text('recommendations'),
    teacherComments: text('teacher_comments'),

    // Status
    status: text('status', {
        enum: ['draft', 'pending_review', 'approved', 'published', 'archived']
    }).default('draft'),

    // Publication
    publishedAt: integer('published_at'),
    viewedByParentAt: integer('viewed_by_parent_at'),
    viewedByStudentAt: integer('viewed_by_student_at'),

    // Signatures
    teacherSignedAt: integer('teacher_signed_at'),
    teacherSignedBy: text('teacher_signed_by').references(() => persons.id),
    coordinatorSignedAt: integer('coordinator_signed_at'),
    coordinatorSignedBy: text('coordinator_signed_by').references(() => persons.id),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_progress_reports_person').on(table.personId),
    index('idx_progress_reports_class').on(table.classGroupId),
    index('idx_progress_reports_period').on(table.periodStart, table.periodEnd),
]);

// ============================================================================
// PEDAGOGICAL: Parent Communications Log
// Track all communications with parents/guardians
// ============================================================================

export const parentCommunications = sqliteTable('parent_communications', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // About which student
    studentId: text('student_id').notNull().references(() => persons.id),

    // With which parent/guardian
    parentId: text('parent_id').references(() => persons.id),
    parentName: text('parent_name'),                 // If not in system yet
    parentContact: text('parent_contact'),           // Phone/email used

    // Communication type
    communicationType: text('communication_type', {
        enum: ['call', 'whatsapp', 'email', 'in_person', 'meeting', 'note_sent', 'report_sent']
    }).notNull(),

    // Direction
    direction: text('direction', {
        enum: ['outbound', 'inbound']
    }).default('outbound'),

    // Subject and content
    subject: text('subject'),
    summary: text('summary').notNull(),

    // Was this scheduled or spontaneous?
    wasScheduled: integer('was_scheduled', { mode: 'boolean' }).default(false),

    // Outcome
    outcome: text('outcome', {
        enum: ['positive', 'neutral', 'concerning', 'needs_follow_up', 'escalated']
    }),

    // Follow-up
    followUpRequired: integer('follow_up_required', { mode: 'boolean' }).default(false),
    followUpDate: integer('follow_up_date'),
    followUpCompletedAt: integer('follow_up_completed_at'),

    // Related note
    relatedNoteId: text('related_note_id').references(() => pedagogicalNotes.id),

    // Who logged this
    loggedBy: text('logged_by').notNull().references(() => persons.id),
    communicationDate: integer('communication_date').default(timestamp()),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_parent_comms_student').on(table.studentId),
    index('idx_parent_comms_parent').on(table.parentId),
    index('idx_parent_comms_date').on(table.communicationDate),
]);

// ============================================================================
// ============================================================================
// TEACHER & STUDENT MANAGEMENT - ADDITIONAL WORKLOAD ITEMS
// ============================================================================
// ============================================================================

// ============================================================================
// TEACHER: Availability / Schedule Preferences
// When teachers can/want to work
// ============================================================================

export const teacherAvailability = sqliteTable('teacher_availability', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teacherId: text('teacher_id').notNull().references(() => persons.id),

    // Type
    availabilityType: text('availability_type', {
        enum: ['regular', 'exception', 'vacation', 'leave', 'blackout']
    }).notNull(),

    // For regular weekly availability
    dayOfWeek: integer('day_of_week'),           // 0-6 for regular
    startTime: text('start_time'),                // "08:00"
    endTime: text('end_time'),                    // "18:00"

    // For exceptions/vacations/leaves
    specificDate: integer('specific_date'),
    dateRangeStart: integer('date_range_start'),
    dateRangeEnd: integer('date_range_end'),

    // Preferences
    isPreferred: integer('is_preferred', { mode: 'boolean' }).default(true),   // Preferred vs just available
    maxHoursThisSlot: integer('max_hours_this_slot'),

    // Reason (for leaves/blackouts)
    reason: text('reason'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_teacher_availability_teacher').on(table.teacherId),
    index('idx_teacher_availability_day').on(table.dayOfWeek),
]);

// ============================================================================
// TEACHER: Lesson Plans
// Teachers planning what they'll teach in each session
// ============================================================================

export const lessonPlans = sqliteTable('lesson_plans', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What this plan is for
    classGroupId: text('class_group_id').references(() => classGroups.id),
    sessionId: text('session_id').references(() => programClassSessions.id),   // If for specific session
    programUnitId: text('program_unit_id').references(() => programUnits.id),

    // Identity
    title: text('title').notNull(),
    date: integer('date'),

    // Plan structure
    objectives: text('objectives'),               // What students should learn
    warmUp: text('warm_up'),                      // Warm-up activity (5-10 min)
    presentation: text('presentation'),           // New content introduction
    practice: text('practice'),                   // Controlled practice
    production: text('production'),               // Free practice/output
    coolDown: text('cool_down'),                  // Review/wrap-up
    homework: text('homework'),                   // What to assign

    // Materials needed
    materialsNeeded: text('materials_needed').default('[]'),   // JSON array
    technologyNeeded: text('technology_needed').default('[]'),

    // Differentiation
    advancedExtensions: text('advanced_extensions'),   // For fast learners
    supportStrategies: text('support_strategies'),     // For struggling learners

    // Timing
    estimatedDuration: integer('estimated_duration_minutes'),

    // Status
    status: text('status', {
        enum: ['draft', 'ready', 'in_progress', 'completed', 'archived']
    }).default('draft'),

    // Post-class reflection (after teaching)
    actualDuration: integer('actual_duration_minutes'),
    reflection: text('reflection'),               // What worked, what didn't
    adjustmentsForNext: text('adjustments_for_next'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_lesson_plans_class').on(table.classGroupId),
    index('idx_lesson_plans_session').on(table.sessionId),
    index('idx_lesson_plans_date').on(table.date),
]);

// ============================================================================
// MATERIALS: Curriculum Materials / Resources
// What materials are used in classes
// ============================================================================

export const curriculumMaterials = sqliteTable('curriculum_materials', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What this material is for
    programId: text('program_id').references(() => schoolPrograms.id),
    programUnitId: text('program_unit_id').references(() => programUnits.id),

    // Material info
    name: text('name').notNull(),
    description: text('description'),

    materialType: text('material_type', {
        enum: [
            'textbook', 'workbook', 'handout', 'worksheet',
            'flashcard', 'video', 'audio', 'digital',
            'game', 'poster', 'other'
        ]
    }).notNull(),

    // Source
    isProprietaRY: integer('is_proprietary', { mode: 'boolean' }).default(false),
    publisher: text('publisher'),
    isbn: text('isbn'),
    edition: text('edition'),

    // Cost
    unitCostCents: integer('unit_cost_cents'),
    isReusable: integer('is_reusable', { mode: 'boolean' }).default(true),

    // Digital resources
    fileUrl: text('file_url'),
    thumbnailUrl: text('thumbnail_url'),

    // Ordering
    orderIndex: integer('order_index').default(0),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_curriculum_materials_program').on(table.programId),
    index('idx_curriculum_materials_type').on(table.materialType),
]);

// ============================================================================
// INCIDENTS: Classroom Incidents
// Behavioral issues, accidents, safety concerns
// ============================================================================

export const classroomIncidents = sqliteTable('classroom_incidents', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // When/where
    incidentDate: integer('incident_date').notNull(),
    sessionId: text('session_id').references(() => programClassSessions.id),
    classGroupId: text('class_group_id').references(() => classGroups.id),
    roomId: text('room_id').references(() => rooms.id),
    location: text('location'),                   // If not in a room

    // Type
    incidentType: text('incident_type', {
        enum: [
            'behavioral',           // Disruptive behavior
            'conflict',             // Between students
            'bullying',             // Bullying incident
            'safety',               // Safety concern
            'medical',              // Health issue
            'property_damage',      // Damage to property
            'policy_violation',     // Rule breaking
            'achievement',          // Positive recognition
            'other'
        ]
    }).notNull(),

    // Severity
    severity: text('severity', {
        enum: ['minor', 'moderate', 'serious', 'critical']
    }).default('minor'),

    // Description
    title: text('title').notNull(),
    description: text('description').notNull(),

    // People involved
    involvedStudentIds: text('involved_student_ids').default('[]'),   // JSON array of user IDs
    witnessIds: text('witness_ids').default('[]'),

    // Action taken
    immediateAction: text('immediate_action'),
    followUpRequired: integer('follow_up_required', { mode: 'boolean' }).default(false),
    followUpDescription: text('follow_up_description'),
    followUpCompletedAt: integer('follow_up_completed_at'),

    // Parent notification
    parentNotified: integer('parent_notified', { mode: 'boolean' }).default(false),
    parentNotifiedAt: integer('parent_notified_at'),
    parentNotificationMethod: text('parent_notification_method'),

    // Documentation
    documentUrls: text('document_urls').default('[]'),   // Photos, files

    // Confidentiality
    isConfidential: integer('is_confidential', { mode: 'boolean' }).default(false),

    // Status
    status: text('status', {
        enum: ['open', 'investigating', 'resolved', 'escalated', 'closed']
    }).default('open'),

    resolvedAt: integer('resolved_at'),
    resolution: text('resolution'),

    reportedBy: text('reported_by').notNull().references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_classroom_incidents_org').on(table.organizationId, table.incidentDate),
    index('idx_classroom_incidents_class').on(table.classGroupId),
    index('idx_classroom_incidents_type').on(table.incidentType),
    index('idx_classroom_incidents_status').on(table.status),
]);

// ============================================================================
// TEACHER: Evaluations / Performance Reviews
// Formal observation and feedback for teachers
// ============================================================================

export const teacherEvaluations = sqliteTable('teacher_evaluations', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teacherId: text('teacher_id').notNull().references(() => persons.id),

    // Evaluator
    evaluatorId: text('evaluator_id').notNull().references(() => persons.id),
    evaluatorRole: text('evaluator_role', {
        enum: ['coordinator', 'director', 'peer', 'self', 'external']
    }).notNull(),

    // Context
    evaluationType: text('evaluation_type', {
        enum: ['observation', 'periodic', 'probation', 'annual', 'self']
    }).notNull(),

    sessionId: text('session_id').references(() => programClassSessions.id),   // If class observation
    classGroupId: text('class_group_id').references(() => classGroups.id),
    evaluationDate: integer('evaluation_date').notNull(),

    // Evaluation period (for periodic reviews)
    periodStart: integer('period_start'),
    periodEnd: integer('period_end'),

    // Scores (JSON: { area: score })
    // e.g., { "classroom_management": 4, "content_knowledge": 5, ... }
    scores: text('scores').default('{}'),
    overallScore: real('overall_score'),

    // Qualitative feedback
    strengths: text('strengths'),
    areasForImprovement: text('areas_for_improvement'),
    actionPlan: text('action_plan'),
    comments: text('comments'),

    // Teacher response
    teacherResponse: text('teacher_response'),
    teacherAcknowledgedAt: integer('teacher_acknowledged_at'),

    // Status
    status: text('status', {
        enum: ['scheduled', 'in_progress', 'pending_review', 'completed', 'acknowledged']
    }).default('scheduled'),

    isConfidential: integer('is_confidential', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_teacher_evaluations_teacher').on(table.teacherId),
    index('idx_teacher_evaluations_date').on(table.evaluationDate),
    index('idx_teacher_evaluations_type').on(table.evaluationType),
]);

// ============================================================================
// ACTIVITIES: Extra / Special Activities
// Field trips, workshops, special events
// ============================================================================

export const academicActivities = sqliteTable('academic_activities', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What program/class this is for
    programId: text('program_id').references(() => schoolPrograms.id),
    classGroupId: text('class_group_id').references(() => classGroups.id),

    // Activity info
    name: text('name').notNull(),
    description: text('description'),

    activityType: text('activity_type', {
        enum: [
            'field_trip',           // Off-site visit
            'workshop',             // In-school special session
            'cultural_event',       // Cultural immersion
            'competition',          // Academic competition
            'presentation',         // Student presentations
            'guest_speaker',        // External speaker
            'celebration',          // End-of-term, graduation
            'assessment_day',       // Special assessment
            'retreat',              // Intensive program
            'extracurricular',      // Clubs, sports
            'other'
        ]
    }).notNull(),

    // Schedule
    startDate: integer('start_date').notNull(),
    endDate: integer('end_date'),
    startTime: text('start_time'),
    endTime: text('end_time'),

    // Location
    location: text('location'),
    meetingPoint: text('meeting_point'),
    transportationDetails: text('transportation_details'),

    // Participation
    isOptional: integer('is_optional', { mode: 'boolean' }).default(true),
    maxParticipants: integer('max_participants'),
    registrationDeadline: integer('registration_deadline'),

    // Cost
    costPerStudentCents: integer('cost_per_student_cents'),
    depositRequiredCents: integer('deposit_required_cents'),

    // Requirements
    requiresParentConsent: integer('requires_parent_consent', { mode: 'boolean' }).default(true),
    requiresPayment: integer('requires_payment', { mode: 'boolean' }).default(false),
    materialsNeeded: text('materials_needed').default('[]'),

    // Staff
    leadTeacherId: text('lead_teacher_id').references(() => persons.id),
    chaperones: text('chaperones').default('[]'),   // JSON array of user IDs

    // Status
    status: text('status', {
        enum: ['planned', 'registration_open', 'confirmed', 'in_progress', 'completed', 'cancelled']
    }).default('planned'),

    // Post-activity
    attendanceCount: integer('attendance_count'),
    summary: text('summary'),
    photosUrl: text('photos_url'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_academic_activities_org').on(table.organizationId, table.startDate),
    index('idx_academic_activities_class').on(table.classGroupId),
    index('idx_academic_activities_type').on(table.activityType),
]);

// ============================================================================
// ACTIVITIES: Activity Registrations
// Student sign-ups for optional activities
// ============================================================================

export const activityRegistrations = sqliteTable('activity_registrations', {
    id: text('id').primaryKey().default(uuid()),
    activityId: text('activity_id').notNull().references(() => academicActivities.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    // Status
    status: text('status', {
        enum: ['registered', 'waitlisted', 'confirmed', 'attended', 'no_show', 'cancelled']
    }).default('registered'),

    // Payment (if required)
    paymentStatus: text('payment_status', {
        enum: ['not_required', 'pending', 'paid', 'refunded']
    }).default('not_required'),
    paymentAmountCents: integer('payment_amount_cents'),
    paidAt: integer('paid_at'),

    // Parent consent (if required)
    parentConsentReceived: integer('parent_consent_received', { mode: 'boolean' }).default(false),
    parentConsentAt: integer('parent_consent_at'),
    parentConsentBy: text('parent_consent_by'),

    // Notes
    dietaryRequirements: text('dietary_requirements'),
    medicalNotes: text('medical_notes'),
    emergencyContact: text('emergency_contact'),

    registeredAt: integer('registered_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_activity_registration_unique').on(table.activityId, table.personId),
    index('idx_activity_registrations_person').on(table.personId),
]);

// ============================================================================
// CERTIFICATES: Student Completion Certificates
// Formal recognition of course completion
// ============================================================================

export const studentCertificates = sqliteTable('student_certificates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),

    // What was completed
    programId: text('program_id').references(() => schoolPrograms.id),
    classGroupId: text('class_group_id').references(() => classGroups.id),
    proficiencyLevelId: text('proficiency_level_id').references(() => proficiencyLevels.id),

    // Certificate info
    certificateType: text('certificate_type', {
        enum: ['completion', 'proficiency', 'attendance', 'achievement', 'participation', 'honors']
    }).notNull(),

    title: text('title').notNull(),
    description: text('description'),

    // Details
    issuedDate: integer('issued_date').notNull(),
    validUntil: integer('valid_until'),           // If certificate expires

    // Grade/Score (if applicable)
    finalGrade: real('final_grade'),
    finalLetterGrade: text('final_letter_grade'),
    hoursCompleted: integer('hours_completed'),

    // Unique identifier
    certificateNumber: text('certificate_number').notNull(),   // e.g., "CERT-2026-00123"
    verificationCode: text('verification_code'),                // For online verification

    // File
    pdfUrl: text('pdf_url'),
    thumbnailUrl: text('thumbnail_url'),

    // Status
    status: text('status', {
        enum: ['draft', 'issued', 'delivered', 'revoked']
    }).default('issued'),

    // Delivery
    deliveredAt: integer('delivered_at'),
    deliveryMethod: text('delivery_method', {
        enum: ['in_person', 'mail', 'email', 'portal']
    }),

    // Signed by
    signedBy: text('signed_by').references(() => persons.id),
    signedByTitle: text('signed_by_title'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_certificate_number').on(table.certificateNumber),
    index('idx_student_certificates_person').on(table.personId),
    index('idx_student_certificates_program').on(table.programId),
]);

// ============================================================================
// SUBSTITUTE: Substitute Teacher Logs
// When substitutes cover classes
// ============================================================================

export const substituteTeacherLogs = sqliteTable('substitute_teacher_logs', {
    id: text('id').primaryKey().default(uuid()),

    // The session covered
    sessionId: text('session_id').notNull().references(() => programClassSessions.id),
    classGroupId: text('class_group_id').notNull().references(() => classGroups.id),

    // Teachers
    originalTeacherId: text('original_teacher_id').notNull().references(() => persons.id),
    substituteTeacherId: text('substitute_teacher_id').notNull().references(() => persons.id),

    // Reason for substitution
    reason: text('reason', {
        enum: ['sick', 'vacation', 'emergency', 'training', 'meeting', 'other']
    }).notNull(),
    reasonDetails: text('reason_details'),

    // Preparation
    lessonPlanProvided: integer('lesson_plan_provided', { mode: 'boolean' }).default(false),
    lessonPlanId: text('lesson_plan_id').references(() => lessonPlans.id),
    specialInstructions: text('special_instructions'),

    // What happened
    contentCovered: text('content_covered'),
    classNotes: text('class_notes'),
    studentsAttended: integer('students_attended'),
    issuesEncountered: text('issues_encountered'),

    // Handoff notes for regular teacher
    handoffNotes: text('handoff_notes'),
    needsFollowUp: integer('needs_follow_up', { mode: 'boolean' }).default(false),
    followUpNotes: text('follow_up_notes'),

    // Confirmation
    originalTeacherAcknowledged: integer('original_teacher_acknowledged', { mode: 'boolean' }).default(false),
    acknowledgedAt: integer('acknowledged_at'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_substitute_logs_session').on(table.sessionId),
    index('idx_substitute_logs_original').on(table.originalTeacherId),
    index('idx_substitute_logs_substitute').on(table.substituteTeacherId),
]);

// ============================================================================
// ============================================================================
// AI-POWERED PERSONALIZED LEARNING - VARK PROFILES & GENERATED MATERIALS
// ============================================================================
// ============================================================================

// ============================================================================
// LEARNING: Student Learning Profiles (VARK Analysis)
// Visual, Auditory, Read/Write, Kinesthetic learning preferences
// ============================================================================

export const studentLearningProfiles = sqliteTable('student_learning_profiles', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    personId: text('person_id').notNull().references(() => persons.id),

    // VARK Scores (0-100 each, percentages of preference)
    visualScore: integer('visual_score').default(25),        // Diagrams, charts, colors, spatial
    auditoryScore: integer('auditory_score').default(25),    // Lectures, discussions, audio
    readWriteScore: integer('read_write_score').default(25), // Text, lists, reading, writing
    kinestheticScore: integer('kinesthetic_score').default(25), // Hands-on, movement, practice

    // Primary modality (calculated from highest score)
    primaryModality: text('primary_modality', {
        enum: ['visual', 'auditory', 'read_write', 'kinesthetic', 'multimodal']
    }),

    // Secondary modality (if close to primary)
    secondaryModality: text('secondary_modality', {
        enum: ['visual', 'auditory', 'read_write', 'kinesthetic', 'none']
    }),

    // Assessment method
    assessmentMethod: text('assessment_method', {
        enum: ['questionnaire', 'ai_inferred', 'teacher_observation', 'combined', 'default']
    }).default('default'),

    // Additional learning factors
    attentionSpan: text('attention_span', {
        enum: ['short', 'medium', 'long']
    }).default('medium'),

    preferredPace: text('preferred_pace', {
        enum: ['slow', 'moderate', 'fast']
    }).default('moderate'),

    groupPreference: text('group_preference', {
        enum: ['individual', 'pairs', 'small_group', 'large_group', 'flexible']
    }).default('flexible'),

    // Language-specific (for language schools)
    strongestSkill: text('strongest_skill', {
        enum: ['listening', 'speaking', 'reading', 'writing', 'grammar', 'vocabulary']
    }),

    weakestSkill: text('weakest_skill', {
        enum: ['listening', 'speaking', 'reading', 'writing', 'grammar', 'vocabulary']
    }),

    // AI observations (accumulated over time)
    aiObservations: text('ai_observations').default('[]'),   // JSON array of insights

    // History of VARK assessments
    assessmentHistory: text('assessment_history').default('[]'),  // JSON array

    lastAssessedAt: integer('last_assessed_at'),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_learning_profile_person').on(table.personId, table.organizationId),
    index('idx_learning_profiles_modality').on(table.primaryModality),
]);

// ============================================================================
// LEARNING: VARK Assessment Responses
// Detailed responses to learning style questionnaires
// ============================================================================

export const varkAssessmentResponses = sqliteTable('vark_assessment_responses', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    profileId: text('profile_id').notNull().references(() => studentLearningProfiles.id, { onDelete: 'cascade' }),

    // Assessment metadata
    assessmentVersion: text('assessment_version').default('v1'),
    completedAt: integer('completed_at').default(timestamp()),

    // Raw responses (JSON: { question_id: answer })
    responses: text('responses').notNull().default('{}'),

    // Calculated scores from this assessment
    visualScore: integer('visual_score'),
    auditoryScore: integer('auditory_score'),
    readWriteScore: integer('read_write_score'),
    kinestheticScore: integer('kinesthetic_score'),

    // How confident are we in these results?
    confidenceScore: integer('confidence_score'),  // 0-100

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_vark_responses_person').on(table.personId),
    index('idx_vark_responses_profile').on(table.profileId),
]);

// ============================================================================
// MATERIALS: AI-Generated Personalized Materials
// Dynamic content generated per student per session
// ============================================================================

export const generatedStudentMaterials = sqliteTable('generated_student_materials', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // For which student and session
    personId: text('person_id').notNull().references(() => persons.id),
    sessionId: text('session_id').notNull().references(() => programClassSessions.id),
    lessonPlanId: text('lesson_plan_id').references(() => lessonPlans.id),

    // Student's profile at time of generation
    learningProfileId: text('learning_profile_id').references(() => studentLearningProfiles.id),
    varkScoresSnapshot: text('vark_scores_snapshot'),  // JSON: frozen VARK at generation time

    // Generation context
    methodologyId: text('methodology_id').references(() => teachingMethodologies.id),
    programUnitId: text('program_unit_id').references(() => programUnits.id),

    // The generated content
    title: text('title').notNull(),

    // Content sections (personalized based on VARK)
    // Visual learners: more diagrams, charts, colors
    // Auditory learners: more discussion prompts, listen-and-repeat
    // Read/Write learners: more text, fill-in-blanks, note-taking space
    // Kinesthetic learners: more activities, movement, hands-on tasks
    contentSections: text('content_sections').notNull().default('[]'),  // JSON array of sections

    // Personalization metadata
    personalizationApplied: text('personalization_applied').default('{}'),
    // e.g., { "added_diagrams": 3, "reduced_text": true, "added_activities": 2 }

    // Format
    format: text('format', {
        enum: ['pdf', 'html', 'interactive', 'printable', 'digital']
    }).default('pdf'),

    // Generated file
    fileUrl: text('file_url'),
    thumbnailUrl: text('thumbnail_url'),

    // Generation metadata
    aiModel: text('ai_model'),                    // Which AI model generated this
    generationPrompt: text('generation_prompt'),  // The prompt used (for debugging)
    generationTokens: integer('generation_tokens'),

    // Quality
    status: text('status', {
        enum: ['generating', 'generated', 'reviewed', 'delivered', 'archived', 'failed']
    }).default('generating'),

    teacherReviewed: integer('teacher_reviewed', { mode: 'boolean' }).default(false),
    teacherReviewedAt: integer('teacher_reviewed_at'),
    teacherApproved: integer('teacher_approved', { mode: 'boolean' }),
    teacherNotes: text('teacher_notes'),

    // Student interaction
    deliveredAt: integer('delivered_at'),
    viewedAt: integer('viewed_at'),
    downloadedAt: integer('downloaded_at'),
    completedAt: integer('completed_at'),

    // Feedback
    studentRating: integer('student_rating'),     // 1-5 stars
    studentFeedback: text('student_feedback'),
    effectivenessScore: integer('effectiveness_score'),  // Based on subsequent performance

    // QR CODE FOR SUBMISSION
    // Unique code per student per material - scan to upload answers
    submissionCode: text('submission_code'),       // Short unique code (e.g., "STU-ABC123")
    submissionQrUrl: text('submission_qr_url'),    // Generated QR image URL
    submissionUrl: text('submission_url'),         // Full URL: /submit/STU-ABC123

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_generated_materials_unique').on(table.personId, table.sessionId),
    uniqueIndex('idx_generated_materials_code').on(table.submissionCode),
    index('idx_generated_materials_session').on(table.sessionId),
    index('idx_generated_materials_person').on(table.personId),
]);

// ============================================================================
// MATERIALS: Student Material Submissions
// When students scan QR and upload their completed work
// ============================================================================

export const materialSubmissions = sqliteTable('material_submissions', {
    id: text('id').primaryKey().default(uuid()),
    materialId: text('material_id').notNull().references(() => generatedStudentMaterials.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    // Submission method
    submissionMethod: text('submission_method', {
        enum: ['qr_scan', 'portal_upload', 'teacher_upload', 'email']
    }).default('qr_scan'),

    // What was submitted
    submissionType: text('submission_type', {
        enum: ['photo', 'pdf', 'text', 'multiple_files', 'form_answers']
    }).notNull(),

    // Files (for photos/PDFs)
    files: text('files').default('[]'),            // JSON array: [{ url, filename, type, size }]
    thumbnailUrl: text('thumbnail_url'),

    // Text answers (for form-based submissions)
    answers: text('answers').default('{}'),        // JSON: { question_id: answer }

    // Metadata
    deviceType: text('device_type', {
        enum: ['mobile', 'tablet', 'desktop']
    }),
    submittedFrom: text('submitted_from'),         // IP location or "in_class"

    // Status
    status: text('status', {
        enum: ['submitted', 'received', 'reviewed', 'graded', 'returned']
    }).default('submitted'),

    // Teacher review
    reviewedBy: text('reviewed_by').references(() => persons.id),
    reviewedAt: integer('reviewed_at'),
    teacherFeedback: text('teacher_feedback'),

    // Grading (if applicable)
    score: real('score'),
    maxScore: real('max_score'),
    gradeId: text('grade_id').references(() => studentGrades.id),

    // Timestamps
    submittedAt: integer('submitted_at').default(timestamp()),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_material_submissions_material').on(table.materialId),
    index('idx_material_submissions_person').on(table.personId),
    index('idx_material_submissions_status').on(table.status),
]);

// ============================================================================
// MATERIALS: Material Templates
// Base templates for AI to personalize
// ============================================================================

export const materialTemplates = sqliteTable('material_templates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What this template is for
    programId: text('program_id').references(() => schoolPrograms.id),
    programUnitId: text('program_unit_id').references(() => programUnits.id),
    methodologyId: text('methodology_id').references(() => teachingMethodologies.id),

    // Template identity
    name: text('name').notNull(),
    description: text('description'),

    // Template type
    templateType: text('template_type', {
        enum: [
            'worksheet', 'activity', 'reading', 'quiz',
            'vocabulary', 'grammar', 'listening', 'speaking',
            'writing', 'game', 'warmup', 'cooldown', 'other'
        ]
    }).notNull(),

    // Variables that can be personalized
    // e.g., ["diagram_count", "text_length", "activity_type", "example_count"]
    personalizableVariables: text('personalizable_variables').default('[]'),

    // Base content (with placeholders)
    baseContent: text('base_content').notNull(),   // Markdown or structured JSON

    // VARK-specific variations
    visualVariation: text('visual_variation'),      // What to add for visual learners
    auditoryVariation: text('auditory_variation'),
    readWriteVariation: text('read_write_variation'),
    kinestheticVariation: text('kinesthetic_variation'),

    // AI instructions
    aiPromptTemplate: text('ai_prompt_template'),   // Prompt to customize content

    // Metadata
    estimatedTime: integer('estimated_time_minutes'),
    difficulty: text('difficulty', {
        enum: ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced']
    }),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_material_templates_program').on(table.programId),
    index('idx_material_templates_type').on(table.templateType),
]);

// ============================================================================
// SCRM: Social CRM - 3x3 Insights (Dreams, Hobbies, Aspirations)
// The heart of the relationship topology engine
// ============================================================================

export const leadInsights = sqliteTable('lead_insights', {
    id: text('id').primaryKey().default(uuid()),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    // The 3x3 Insight Engine
    insightType: text('insight_type', {
        enum: ['dream', 'hobby', 'aspiration']
    }).notNull(),

    // The actual insight content
    content: text('content').notNull(),

    // Optional context
    context: text('context'), // "How did we learn this?"

    // Ordering within the 3 of each type
    position: integer('position').default(0),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_lead_insights_lead').on(table.leadId, table.insightType),
]);

// ============================================================================
// SCRM: Insight Communications
// Conversations anchored to what matters (Dreams, Hobbies, Aspirations)
// ============================================================================

export const insightCommunications = sqliteTable('insight_communications', {
    id: text('id').primaryKey().default(uuid()),
    insightId: text('insight_id').notNull().references(() => leadInsights.id, { onDelete: 'cascade' }),

    personId: text('person_id').notNull().references(() => persons.id), // Who made contact
    message: text('message').notNull(), // What was said

    // Communication details
    communicationType: text('communication_type', {
        enum: ['call', 'whatsapp', 'email', 'in_person', 'note']
    }).default('note'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_insight_comms_insight').on(table.insightId),
]);

// ============================================================================
// SCRM: Lead Course Interests
// Transform coordinates in the learning lattice
// ============================================================================

export const leadCourseInterests = sqliteTable('lead_course_interests', {
    id: text('id').primaryKey().default(uuid()),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    // Course reference (can be a course ID or category string)
    courseId: text('course_id').references(() => courses.id),
    courseCategory: text('course_category'), // e.g., "English - Business", "Spanish - Beginner"

    // Interest level as commitment state
    interestLevel: text('interest_level', {
        enum: ['curious', 'exploring', 'committed', 'in_progress', 'completed', 'paused']
    }).default('curious'),

    // Motivation and barriers
    notes: text('notes'), // Why interested, barriers, goals

    lastUpdated: integer('last_updated').default(timestamp()),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_lead_course_interests_lead').on(table.leadId),
    index('idx_lead_course_interests_level').on(table.interestLevel),
]);

// ============================================================================
// SCRM: Sentiment History
// Emotional trajectory through time
// ============================================================================

export const leadSentimentHistory = sqliteTable('lead_sentiment_history', {
    id: text('id').primaryKey().default(uuid()),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    sentiment: text('sentiment', {
        enum: ['positive', 'neutral', 'hesitant', 'negative', 'enthusiastic']
    }).notNull(),

    // What triggered this sentiment reading?
    source: text('source', {
        enum: ['ai_analysis', 'user_observation', 'interaction', 'feedback']
    }).default('user_observation'),

    // Context for the sentiment
    context: text('context'), // Free text explaining the sentiment
    interactionId: text('interaction_id').references(() => leadInteractions.id),

    analyzedBy: text('analyzed_by').references(() => persons.id),
    analyzedAt: integer('analyzed_at').default(timestamp()),
}, (table) => [
    index('idx_lead_sentiment_lead').on(table.leadId, table.analyzedAt),
]);

// ============================================================================
// SCRM: AI-Generated Lead Personas
// The emergent layer - π in the φ+ζ=π equation
// ============================================================================

export const leadPersonas = sqliteTable('lead_personas', {
    id: text('id').primaryKey().default(uuid()),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    // AI-generated personality profile
    personalityProfile: text('personality_profile'), // Detailed analysis
    communicationStyle: text('communication_style'), // How to approach them
    conversationStarters: text('conversation_starters'), // JSON array of starters

    // Summary tags for quick reference
    personalityTags: text('personality_tags'), // JSON array: ["analytical", "family-oriented"]

    // Recommended approaches
    preferredChannels: text('preferred_channels'), // JSON array: ["whatsapp", "call"]
    bestTimeToContact: text('best_time_to_contact'),
    avoidTopics: text('avoid_topics'), // JSON array of sensitive topics

    // Generation metadata
    generatedAt: integer('generated_at').default(timestamp()),
    basedOnInsightsCount: integer('based_on_insights_count').default(0),
    confidence: integer('confidence').default(50), // 0-100 confidence score

    // Track when regeneration is needed
    lastInsightUpdate: integer('last_insight_update'),
    stale: integer('stale', { mode: 'boolean' }).default(false),
}, (table) => [
    uniqueIndex('idx_lead_personas_lead').on(table.leadId),
]);

// ============================================================================
// SCRM: Extended Lead Funnel Stages (11-stage topology)
// Position in the commitment gradient
// ============================================================================

export const leadFunnelHistory = sqliteTable('lead_funnel_history', {
    id: text('id').primaryKey().default(uuid()),
    leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),

    // The 11-stage funnel
    stage: text('stage', {
        enum: [
            // TOFU - Awareness Field
            'small_engagement',      // First quantum entanglement
            'comments_conversations', // Recognition emerges
            'interested',            // Attention crystallizes
            // MOFU - Consideration Field
            'qualifying',            // Mutual assessment begins
            'more_information',      // Knowledge transfer initiates
            'events_invitations',    // Embodied encounter possibility
            // BOFU - Decision Field
            'appointments',          // Time commitment given
            'negotiation',           // Value exchange defined
            'counters',              // Boundaries established
            // Outcomes
            'won',                   // Relationship formalized
            'lost'                   // Relationship paused (not ended)
        ]
    }).notNull(),

    // Funnel segment for grouping
    funnelSegment: text('funnel_segment', {
        enum: ['tofu', 'mofu', 'bofu', 'outcome']
    }),

    // Transition metadata
    previousStage: text('previous_stage'),
    reason: text('reason'), // Why the transition happened

    changedBy: text('changed_by').references(() => persons.id),
    changedAt: integer('changed_at').default(timestamp()),
}, (table) => [
    index('idx_lead_funnel_history_lead').on(table.leadId, table.changedAt),
    index('idx_lead_funnel_history_stage').on(table.stage),
]);

// ============================================================================
// ENROLLMENTS
// ============================================================================

export const enrollments = sqliteTable('enrollments', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    personId: text('person_id').notNull().references(() => persons.id),

    classId: text('class_id').notNull().references(() => classes.id),
    termId: text('term_id').references(() => terms.id),

    leadId: text('lead_id').references(() => leads.id),
    trialId: text('trial_id').references(() => trialClasses.id),

    status: text('status', {
        enum: ['pending', 'active', 'paused', 'completed', 'dropped', 'transferred']
    }).default('active'),

    enrolledAt: integer('enrolled_at').default(timestamp()),
    startsAt: integer('starts_at'),
    endsAt: integer('ends_at'),
    droppedAt: integer('dropped_at'),

    dropReason: text('drop_reason'),
    transferredToEnrollmentId: text('transferred_to_enrollment_id'),

    notes: text('notes'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_enrollments_person').on(table.personId, table.status),
    index('idx_enrollments_class').on(table.classId, table.status),
    index('idx_enrollments_term').on(table.termId),
]);

// ============================================================================
// WAITLIST
// ============================================================================

export const waitlist = sqliteTable('waitlist', {
    id: text('id').primaryKey().default(uuid()),

    personId: text('person_id').references(() => persons.id),
    leadId: text('lead_id').references(() => leads.id),

    classId: text('class_id').references(() => classes.id),
    courseTypeId: text('course_type_id').references(() => courseTypes.id),
    levelId: text('level_id').references(() => levels.id),
    preferredSchedule: text('preferred_schedule'),

    status: text('status', {
        enum: ['waiting', 'notified', 'enrolled', 'expired', 'cancelled']
    }).default('waiting'),

    notifiedAt: integer('notified_at'),
    expiresAt: integer('expires_at'),
    position: integer('position'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_waitlist_class').on(table.classId, table.position),
]);

// ============================================================================
// FAMILY LINKS (Parent-Student Relationships)
// ============================================================================

export const familyLinks = sqliteTable('family_links', {
    id: text('id').primaryKey().default(uuid()),

    parentId: text('parent_id').notNull().references(() => persons.id),
    studentId: text('student_id').notNull().references(() => persons.id),

    relationship: text('relationship', {
        enum: ['parent', 'guardian', 'grandparent', 'sibling', 'other']
    }).default('parent'),

    canViewProgress: integer('can_view_progress').default(1),
    canViewGrades: integer('can_view_grades').default(1),
    canPayInvoices: integer('can_pay_invoices').default(1),
    canCommunicate: integer('can_communicate').default(1),
    isPrimaryContact: integer('is_primary_contact').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_family_unique').on(table.parentId, table.studentId),
    index('idx_family_student').on(table.studentId),
]);

// ============================================================================
// AI COMPANION: Memory Graphs
// ============================================================================

export const memoryGraphs = sqliteTable('memory_graphs', {
    id: text('id').primaryKey().default(uuid()),
    studentId: text('student_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // SNR metrics
    snr: real('snr').default(1), // Signal-to-noise ratio
    compressionPasses: integer('compression_passes').default(0),
    lossVector: text('loss_vector').default('[]'), // JSON: entropy loss per pass

    // Graph stats
    nodeCount: integer('node_count').default(0),
    edgeCount: integer('edge_count').default(0),
    oldestMemory: integer('oldest_memory'),
    newestMemory: integer('newest_memory'),

    // Versioning
    version: integer('version').default(1),
    lastCompressed: integer('last_compressed'),
    lastAccessed: integer('last_accessed'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_memory_graphs_student').on(table.studentId),
    index('idx_memory_graphs_org').on(table.organizationId),
]);

export const memoryNodes = sqliteTable('memory_nodes', {
    id: text('id').primaryKey().default(uuid()),
    graphId: text('graph_id').notNull().references(() => memoryGraphs.id, { onDelete: 'cascade' }),

    content: text('content').notNull(),
    contentHash: text('content_hash').notNull(), // SHA-256 for integrity

    // Memory properties
    gravity: real('gravity').default(1), // Importance weight (decays)
    salience: real('salience').default(1), // Initial importance (doesn't decay)
    confidence: real('confidence').default(1), // How certain 0-1

    // Modality
    modality: text('modality', {
        enum: ['episodic', 'semantic', 'procedural', 'emotional', 'sensory']
    }).default('semantic'),

    // Temporal
    sequence: integer('sequence'), // Order within session
    timestamp: integer('timestamp').notNull(), // When memory formed
    strength: real('strength').default(1), // Connection strength
    lastAccessed: integer('last_accessed'),

    // Source tracking
    sourceType: text('source_type', {
        enum: ['chat', 'lesson', 'system', 'compression']
    }).default('chat'),
    sourceId: text('source_id'), // ID of originating entity

    // Vector embedding (for similarity search)
    embedding: text('embedding'), // JSON: Float32Array as array

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_memory_nodes_graph').on(table.graphId),
    index('idx_memory_nodes_gravity').on(table.graphId, table.gravity),
    index('idx_memory_nodes_modality').on(table.graphId, table.modality),
    index('idx_memory_nodes_timestamp').on(table.graphId, table.timestamp),
]);

export const memoryEdges = sqliteTable('memory_edges', {
    id: text('id').primaryKey().default(uuid()),
    graphId: text('graph_id').notNull().references(() => memoryGraphs.id, { onDelete: 'cascade' }),

    sourceId: text('source_id').notNull().references(() => memoryNodes.id, { onDelete: 'cascade' }),
    targetId: text('target_id').notNull().references(() => memoryNodes.id, { onDelete: 'cascade' }),

    // Edge properties
    edgeType: text('edge_type', {
        enum: ['CAUSES', 'RELATES_TO', 'EVOKES', 'REMINDS_OF', 'CONTRADICTS', 'SUPPORTS', 'REFINES', 'ABSTRACTS', 'INVOLVES', 'ABOUT', 'LOCATED_AT', 'PRECEDES', 'ENABLES']
    }).notNull(),

    direction: text('direction', {
        enum: ['forward', 'backward', 'bidirectional']
    }).default('forward'),

    weight: real('weight').default(1),
    valence: real('valence').default(0), // Emotional coloring -1 to 1
    reverseWeight: real('reverse_weight'),

    // Temporal
    sequence: integer('sequence'),
    strength: real('strength').default(1),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_memory_edges_graph').on(table.graphId),
    index('idx_memory_edges_source').on(table.sourceId),
    index('idx_memory_edges_target').on(table.targetId),
    index('idx_memory_edges_type').on(table.graphId, table.edgeType),
]);

export const memoryLedger = sqliteTable('memory_ledger', {
    id: text('id').primaryKey().default(uuid()),
    graphId: text('graph_id').notNull().references(() => memoryGraphs.id, { onDelete: 'cascade' }),

    content: text('content').notNull(), // Full content (never compressed)
    summary: text('summary'), // Short version

    // Category
    category: text('category', {
        enum: ['promise', 'secret', 'debt', 'threat', 'fact', 'instruction', 'observation']
    }).notNull(),

    importance: real('importance').default(1), // 0-1
    triggerThreshold: real('trigger_threshold').default(0.5), // When to surface

    // Trigger mechanisms
    linkedNodes: text('linked_nodes').default('[]'), // JSON: related node IDs
    triggers: text('triggers').default('[]'), // JSON: keywords/phrases
    triggerEntities: text('trigger_entities').default('[]'), // JSON: people/places

    // Source tracking
    sourceType: text('source_type'),
    sourceEntity: text('source_entity'), // Who/what said it
    sourceDate: integer('source_date'),

    // Status
    isActive: integer('is_active').default(1),
    expiresAt: integer('expires_at'),

    // Usage stats
    accessCount: integer('access_count').default(0),
    lastAccessed: integer('last_accessed'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_memory_ledger_graph').on(table.graphId),
    index('idx_memory_ledger_category').on(table.graphId, table.category),
    index('idx_memory_ledger_importance').on(table.graphId, table.importance),
]);

export const memoryContradictions = sqliteTable('memory_contradictions', {
    id: text('id').primaryKey().default(uuid()),
    graphId: text('graph_id').notNull().references(() => memoryGraphs.id, { onDelete: 'cascade' }),

    nodeA: text('node_a').notNull().references(() => memoryNodes.id, { onDelete: 'cascade' }),
    nodeB: text('node_b').notNull().references(() => memoryNodes.id, { onDelete: 'cascade' }),

    // Resolution
    resolved: integer('resolved').default(0),
    resolvedTo: text('resolved_to').references(() => memoryNodes.id),
    strategy: text('strategy', {
        enum: ['newer_wins', 'stronger_wins', 'manual', 'merged']
    }),

    detectedAt: integer('detected_at').default(timestamp()),
    resolvedAt: integer('resolved_at'),
}, (table) => [
    index('idx_contradictions_graph').on(table.graphId, table.resolved),
]);

export const studentWorldOverlay = sqliteTable('student_world_overlay', {
    id: text('id').primaryKey().default(uuid()),
    studentId: text('student_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    graphId: text('graph_id').notNull().references(() => memoryGraphs.id, { onDelete: 'cascade' }),

    // Fog of war - what they've discovered
    knownNodes: text('known_nodes').default('[]'), // JSON: Set of node IDs
    knownEdges: text('known_edges').default('[]'), // JSON: Set of edge IDs

    // Personal overrides (attitudes, opinions)
    nodeOverrides: text('node_overrides').default('{}'), // JSON: { nodeId: { attitude, familiarity, notes } }

    // Cached relationships
    relationshipCache: text('relationship_cache').default('{}'),
    stats: text('stats').default('{}'),

    version: integer('version').default(1),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_world_overlay_student').on(table.studentId),
]);

// ============================================================================
// AI COMPANION: Chat Sessions (Encrypted)
// ============================================================================

export const chatSessions = sqliteTable('chat_sessions', {
    id: text('id').primaryKey().default(uuid()),
    studentId: text('student_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    startedAt: integer('started_at').default(timestamp()),
    endedAt: integer('ended_at'),

    messageCount: integer('message_count').default(0),

    // Metadata only (NOT content) - for AI Auditor
    metadata: text('metadata').default('{}'), // JSON: duration, tokens, timestamps
}, (table) => [
    index('idx_chat_sessions_student').on(table.studentId),
    index('idx_chat_sessions_org').on(table.organizationId),
    index('idx_chat_sessions_time').on(table.startedAt),
]);

export const chatMessages = sqliteTable('chat_messages', {
    id: text('id').primaryKey().default(uuid()),
    sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),

    role: text('role', {
        enum: ['user', 'assistant', 'system']
    }).notNull(),

    // ENCRYPTED with student-derived key
    contentEncrypted: text('content_encrypted').notNull(),

    timestamp: integer('timestamp').default(timestamp()),
    tokensUsed: integer('tokens_used'),
}, (table) => [
    index('idx_chat_messages_session').on(table.sessionId, table.timestamp),
]);

// ============================================================================
// ETHICS: Memory Integrity & Auditing
// ============================================================================

export const memoryIntegrityHashes = sqliteTable('memory_integrity_hashes', {
    id: text('id').primaryKey().default(uuid()),
    studentId: text('student_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    graphHash: text('graph_hash').notNull(), // Hash of entire graph state
    ledgerHash: text('ledger_hash').notNull(), // Hash of ledger state

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_integrity_student').on(table.studentId, table.createdAt),
]);

export const memoryAuditLog = sqliteTable('memory_audit_log', {
    id: text('id').primaryKey().default(uuid()),
    studentId: text('student_id').notNull().references(() => persons.id),

    operation: text('operation', {
        enum: ['node.created', 'node.updated', 'node.deleted', 'edge.created', 'edge.deleted', 'ledger.added', 'ledger.updated', 'ledger.deleted', 'graph.compressed', 'graph.exported', 'integrity.verified', 'integrity.failed']
    }).notNull(),

    entityType: text('entity_type', {
        enum: ['node', 'edge', 'ledger', 'graph']
    }).notNull(),

    entityId: text('entity_id'),

    actor: text('actor', {
        enum: ['system', 'student', 'compression', 'auditor', 'admin']
    }).notNull(),

    details: text('details').default('{}'), // JSON: operation-specific data

    timestamp: integer('timestamp').default(timestamp()),
}, (table) => [
    index('idx_audit_student').on(table.studentId, table.timestamp),
    index('idx_audit_operation').on(table.operation),
]);

// ============================================================================
// ETHICS: Safety Alerts & Escalation
// ============================================================================

export const safetyAlerts = sqliteTable('safety_alerts', {
    id: text('id').primaryKey().default(uuid()),
    studentId: text('student_id').notNull().references(() => persons.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Alert level
    level: text('level', {
        enum: ['green', 'yellow', 'orange', 'red']
    }).notNull(),

    reason: text('reason').notNull(),

    // Detection
    detectedBy: text('detected_by', {
        enum: ['auditor', 'teacher', 'system', 'parent', 'student']
    }).notNull(),
    detectedAt: integer('detected_at').default(timestamp()),

    // Acknowledgment
    acknowledgedAt: integer('acknowledged_at'),
    acknowledgedBy: text('acknowledged_by').references(() => persons.id),

    // Resolution
    resolvedAt: integer('resolved_at'),
    resolvedBy: text('resolved_by').references(() => persons.id),
    resolutionNotes: text('resolution_notes'),

    // Notifications
    notifiedParents: integer('notified_parents').default(0),
    notifiedAuthorities: integer('notified_authorities').default(0), // ECA protocol
}, (table) => [
    index('idx_alerts_student').on(table.studentId),
    index('idx_alerts_level').on(table.level),
    index('idx_alerts_unresolved').on(table.organizationId, table.resolvedAt),
]);

export const alertAcknowledgments = sqliteTable('alert_acknowledgments', {
    id: text('id').primaryKey().default(uuid()),
    alertId: text('alert_id').notNull().references(() => safetyAlerts.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    actionTaken: text('action_taken'),
    notes: text('notes'),

    timestamp: integer('timestamp').default(timestamp()),
}, (table) => [
    index('idx_ack_alert').on(table.alertId),
]);

export const wellbeingSnapshots = sqliteTable('wellbeing_snapshots', {
    id: text('id').primaryKey().default(uuid()),
    studentId: text('student_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    snapshotDate: integer('snapshot_date').notNull(), // Day granularity

    // Aggregated metrics (NOT content)
    engagementScore: real('engagement_score'), // 0-1
    emotionalIndicators: text('emotional_indicators').default('{}'), // JSON: aggregated sentiment
    sessionCount: integer('session_count').default(0),
    totalDuration: integer('total_duration').default(0), // Minutes

    // Anomaly detection
    anomalyFlags: text('anomaly_flags').default('[]'), // JSON: detected anomalies

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_wellbeing_student_date').on(table.studentId, table.snapshotDate),
]);

// ============================================================================
// LGPD: Privacy Rights & Data Portability
// ============================================================================

/**
 * Privacy Consent Records - Track what user consented to
 */
export const privacyConsents = sqliteTable('privacy_consents', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Consent type
    consentType: text('consent_type', {
        enum: [
            'data_collection',       // Basic data collection
            'ai_companion',          // AI memory companion
            'marketing',             // Marketing communications
            'third_party_sharing',   // Sharing with partners
            'analytics',             // Behavior analytics
            'cookies'                // Cookie usage
        ]
    }).notNull(),

    // Consent state
    isGranted: integer('is_granted', { mode: 'boolean' }).notNull(),
    grantedAt: integer('granted_at'),
    revokedAt: integer('revoked_at'),

    // Context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    consentText: text('consent_text'),  // The exact text shown

    // Versioning
    version: text('version'),           // Consent version shown

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_consent_person').on(table.personId),
    index('idx_consent_type').on(table.consentType),
    uniqueIndex('idx_consent_unique').on(table.personId, table.organizationId, table.consentType),
]);

/**
 * Data Export Requests - LGPD portability right
 */
export const dataExportRequests = sqliteTable('data_export_requests', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),

    // Status workflow
    status: text('status', {
        enum: [
            'submitted',      // User requested
            'processing',     // Being prepared
            'ready',          // Ready for download
            'downloaded',     // User downloaded
            'expired',        // Download link expired
            'failed'          // Failed to generate
        ]
    }).default('submitted'),

    // What to include
    includeAcademic: integer('include_academic', { mode: 'boolean' }).default(true),
    includeFinancial: integer('include_financial', { mode: 'boolean' }).default(true),
    includeAttendance: integer('include_attendance', { mode: 'boolean' }).default(true),
    includeCompanion: integer('include_companion', { mode: 'boolean' }).default(true),
    includeMessages: integer('include_messages', { mode: 'boolean' }).default(true),

    // Format
    format: text('format', {
        enum: ['json', 'pdf', 'zip']
    }).default('zip'),

    // Generated file
    filePath: text('file_path'),
    fileSizeBytes: integer('file_size_bytes'),
    fileHash: text('file_hash'),          // SHA-256 for integrity

    // Download tracking
    downloadCount: integer('download_count').default(0),
    lastDownloadAt: integer('last_download_at'),
    expiresAt: integer('expires_at'),     // 7 days after ready

    // Timing
    requestedAt: integer('requested_at').default(timestamp()),
    processedAt: integer('processed_at'),
    completedAt: integer('completed_at'),

    // Request context
    ipAddress: text('ip_address'),
    reason: text('reason'),               // Why they want export
}, (table) => [
    index('idx_export_person').on(table.personId),
    index('idx_export_status').on(table.status),
]);

/**
 * Data Deletion Requests - LGPD right to deletion (negotiated flow)
 * Deletion is NEVER instant - always goes through review
 */
export const dataDeletionRequests = sqliteTable('data_deletion_requests', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),

    // Status workflow (negotiated!)
    status: text('status', {
        enum: [
            'submitted',        // User requested
            'under_review',     // Admin reviewing
            'pending_confirmation', // Awaiting user confirmation
            'approved',         // Approved for deletion
            'scheduled',        // Scheduled for execution
            'executing',        // Being executed
            'completed',        // Deletion complete
            'denied',           // Request denied (with reason)
            'cancelled'         // User cancelled
        ]
    }).default('submitted'),

    // What they want deleted
    scope: text('scope', {
        enum: [
            'ai_companion_only',   // Just AI memories
            'chat_history',        // Chat sessions
            'specific_data',       // Specific items
            'full_account'         // Everything
        ]
    }).notNull(),

    // Specific items (if scope = specific_data)
    targetEntities: text('target_entities').default('[]'), // JSON: [{type, id}]

    // User's reason
    reason: text('reason').notNull(),
    additionalNotes: text('additional_notes'),

    // Review process
    reviewerId: text('reviewer_id').references(() => persons.id),
    reviewNotes: text('review_notes'),
    reviewedAt: integer('reviewed_at'),

    // Denial reason (if denied)
    denialReason: text('denial_reason'),

    // Execution
    scheduledFor: integer('scheduled_for'),  // When deletion will happen
    executedAt: integer('executed_at'),
    executedBy: text('executed_by'),         // System or admin ID

    // What was deleted (for audit - never deleted!)
    deletionManifest: text('deletion_manifest').default('[]'), // JSON: what was removed
    dataHash: text('data_hash'),             // Hash of deleted data for verification

    // Timing
    requestedAt: integer('requested_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),

    // Request context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
}, (table) => [
    index('idx_deletion_person').on(table.personId),
    index('idx_deletion_status').on(table.status),
    index('idx_deletion_pending').on(table.status, table.scheduledFor),
]);

/**
 * Data Access Audit Log - Who accessed what data (LGPD transparency)
 */
export const dataAccessAuditLog = sqliteTable('data_access_audit_log', {
    id: text('id').primaryKey().default(uuid()),
    targetUserId: text('target_user_id').notNull().references(() => persons.id),

    // Who accessed
    accessorId: text('accessor_id').references(() => persons.id), // null = system
    accessorRole: text('accessor_role'),
    accessorType: text('accessor_type', {
        enum: ['user', 'admin', 'system', 'api', 'accountant', 'auditor']
    }).notNull(),

    // What was accessed
    dataType: text('data_type', {
        enum: [
            'profile', 'academic', 'financial', 'attendance',
            'ai_memory', 'chat_history', 'documents', 'contracts',
            'export', 'all'
        ]
    }).notNull(),
    entityIds: text('entity_ids').default('[]'), // JSON: specific IDs

    // Access details
    action: text('action', {
        enum: ['view', 'export', 'modify', 'delete', 'share']
    }).notNull(),
    purpose: text('purpose'),               // Why accessed

    // Context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    endpoint: text('endpoint'),

    accessedAt: integer('accessed_at').default(timestamp()),
}, (table) => [
    index('idx_access_audit_target').on(table.targetUserId),
    index('idx_access_audit_accessor').on(table.accessorId),
    index('idx_access_audit_time').on(table.accessedAt),
    index('idx_access_audit_type').on(table.dataType),
]);

// ============================================================================
// FISCAL & ACCOUNTING (SPED/Lucro Real Compliance)
// ============================================================================

// Bank accounts for reconciliation
export const bankAccounts = sqliteTable('bank_accounts', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),              // "Conta Principal Sicoob"
    bankCode: text('bank_code').notNull(),     // "756" for Sicoob
    bankName: text('bank_name').notNull(),
    agency: text('agency').notNull(),
    accountNumber: text('account_number').notNull(),
    accountType: text('account_type').notNull().default('CHECKING'), // CHECKING, SAVINGS, PAYMENT

    isActive: integer('is_active').default(1),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_bank_accounts_org').on(table.organizationId),
]);

// Tax withholdings (IRRF, INSS, ISS, PIS, COFINS, CSLL)
export const fiscalTaxWithholdings = sqliteTable('fiscal_tax_withholdings', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Tax details
    taxType: text('tax_type').notNull(),       // IRRF, INSS, ISS, PIS, COFINS, CSLL

    // Calculation (all in centavos)
    calculationBase: integer('calculation_base').notNull(),    // Base de cálculo
    rate: integer('rate').notNull(),                           // Alíquota in basis points (10000 = 100%)
    amountWithheld: integer('amount_withheld').notNull(),      // Valor retido

    // Reference document
    referenceType: text('reference_type').notNull(),  // INVOICE, PAYROLL, CONTRACT
    referenceId: text('reference_id').notNull(),
    referenceNumber: text('reference_number'),

    // Timing
    competencyPeriod: text('competency_period').notNull(),     // YYYY-MM
    withholdingDate: text('withholding_date').notNull(),       // ISO date string
    dueDate: text('due_date').notNull(),
    paymentDate: text('payment_date'),

    // Parties
    withholderId: text('withholder_id').notNull(),
    withholderName: text('withholder_name').notNull(),
    beneficiaryId: text('beneficiary_id').notNull(),
    beneficiaryName: text('beneficiary_name').notNull(),
    beneficiaryDocument: text('beneficiary_document'),         // CPF/CNPJ
    beneficiaryDocumentType: text('beneficiary_document_type'), // CPF or CNPJ

    // Payment voucher (DARF/GPS/DAM)
    voucherType: text('voucher_type'),         // DARF, GPS, DAM, OTHER
    voucherCode: text('voucher_code'),         // Código de receita
    voucherBarcode: text('voucher_barcode'),
    voucherAuth: text('voucher_auth'),

    notes: text('notes'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_tax_wh_records_org').on(table.organizationId),
    index('idx_tax_wh_records_period').on(table.competencyPeriod),
    index('idx_tax_wh_records_type').on(table.taxType),
    index('idx_tax_wh_records_ref').on(table.referenceType, table.referenceId),
]);

// Fiscal transactions (all financial movements)
export const fiscalTransactions = sqliteTable('fiscal_transactions', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    sequentialNumber: integer('sequential_number').notNull(),

    // Classification
    type: text('type').notNull(),              // REVENUE, EXPENSE, TRANSFER, ADJUSTMENT
    category: text('category').notNull(),       // TUITION, RENT, TEACHER_SALARY, etc

    // Description
    description: text('description').notNull(),
    detailedDescription: text('detailed_description'),

    // Amount (always positive, type determines direction)
    amount: integer('amount').notNull(),        // In centavos

    // Timing
    transactionDate: text('transaction_date').notNull(),       // When it happened
    competencyDate: text('competency_date').notNull(),         // Regime de competência
    competencyPeriod: text('competency_period').notNull(),     // YYYY-MM

    // Payment details
    paymentMethod: text('payment_method').notNull(),           // PIX, CREDIT_CARD, BOLETO, etc

    // Bank details
    bankAccountId: text('bank_account_id').references(() => bankAccounts.id),
    bankTransactionId: text('bank_transaction_id'),

    // Counterparty
    counterpartyName: text('counterparty_name'),
    counterpartyDocument: text('counterparty_document'),       // CPF/CNPJ
    counterpartyDocumentType: text('counterparty_document_type'),

    // Accounting entry
    debitAccount: text('debit_account'),       // Chart of accounts code
    creditAccount: text('credit_account'),
    costCenter: text('cost_center'),

    // Reconciliation
    reconciliationStatus: text('reconciliation_status').default('PENDING'),  // PENDING, RECONCILED, DISCREPANCY
    reconciledAt: text('reconciled_at'),
    reconciledBy: text('reconciled_by'),
    bankStatementDate: text('bank_statement_date'),
    bankStatementAmount: integer('bank_statement_amount'),
    discrepancyNotes: text('discrepancy_notes'),

    notes: text('notes'),
    tags: text('tags'),                        // JSON array

    createdBy: text('created_by').notNull(),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_fiscal_transactions_org').on(table.organizationId),
    index('idx_fiscal_transactions_period').on(table.competencyPeriod),
    index('idx_fiscal_transactions_type').on(table.type),
    index('idx_fiscal_transactions_category').on(table.category),
    index('idx_fiscal_transactions_date').on(table.transactionDate),
    index('idx_fiscal_transactions_reconciliation').on(table.reconciliationStatus),
]);

// Junction table for transaction documents
export const fiscalTransactionDocuments = sqliteTable('fiscal_transaction_documents', {
    id: text('id').primaryKey().default(uuid()),
    transactionId: text('transaction_id').notNull().references(() => fiscalTransactions.id),
    documentType: text('document_type').notNull(),  // INVOICE, RECEIPT, CONTRACT, PAYROLL, DARF, OTHER
    documentId: text('document_id').notNull(),
    documentNumber: text('document_number'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_transaction_docs_transaction').on(table.transactionId),
    index('idx_transaction_docs_document').on(table.documentType, table.documentId),
]);

// External Accountant API Keys
export const accountantApiKeys = sqliteTable('accountant_api_keys', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Key details
    keyHash: text('key_hash').notNull(),           // SHA-256 hash (never store plain key)
    keyPrefix: text('key_prefix').notNull(),       // First 8 chars for identification
    name: text('name').notNull(),                  // "Contabilidade ABC", "João Contador"

    // Accountant info
    accountantName: text('accountant_name'),
    accountantEmail: text('accountant_email'),
    accountantCrc: text('accountant_crc'),         // CRC registration number

    // Security
    ipWhitelist: text('ip_whitelist').default('[]'), // JSON array of allowed IPs
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    // Permissions (what they can access)
    permissions: text('permissions').default('["documents", "reports", "sped"]'), // JSON

    // Usage tracking
    lastUsedAt: integer('last_used_at'),
    totalRequests: integer('total_requests').default(0),

    // Expiry
    expiresAt: integer('expires_at'),              // Optional expiry

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    revokedAt: integer('revoked_at'),
    revokedBy: text('revoked_by').references(() => persons.id),
}, (table) => [
    index('idx_accountant_keys_org').on(table.organizationId),
    uniqueIndex('idx_accountant_keys_hash').on(table.keyHash),
    index('idx_accountant_keys_prefix').on(table.keyPrefix),
]);

// Accountant API Request Log (audit trail)
export const accountantApiLogs = sqliteTable('accountant_api_logs', {
    id: text('id').primaryKey().default(uuid()),
    keyId: text('key_id').notNull().references(() => accountantApiKeys.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Request details
    endpoint: text('endpoint').notNull(),
    method: text('method').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // Response
    statusCode: integer('status_code'),
    responseTime: integer('response_time'),        // ms

    // For document downloads
    documentType: text('document_type'),
    documentId: text('document_id'),
    period: text('period'),                        // YYYY-MM

    requestedAt: integer('requested_at').default(timestamp()),
}, (table) => [
    index('idx_accountant_logs_key').on(table.keyId),
    index('idx_accountant_logs_time').on(table.requestedAt),
    index('idx_accountant_logs_endpoint').on(table.endpoint),
]);

// Automatic Document Delivery Configuration
export const accountantDeliveryConfig = sqliteTable('accountant_delivery_config', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Delivery method
    method: text('method', {
        enum: ['email', 'webhook', 'sftp', 'google_drive', 'dropbox', 'disabled']
    }).default('email'),

    // Method-specific config (encrypted)
    emailTo: text('email_to'),                     // accountant@contabilidade.com.br
    webhookUrl: text('webhook_url'),
    sftpHost: text('sftp_host'),
    sftpPort: integer('sftp_port').default(22),
    sftpUser: text('sftp_user'),
    sftpPasswordEncrypted: text('sftp_password_encrypted'),
    sftpPath: text('sftp_path'),
    cloudToken: text('cloud_token_encrypted'),     // OAuth token for Drive/Dropbox
    cloudPath: text('cloud_path'),

    // Schedule
    frequency: text('frequency', {
        enum: ['daily', 'weekly', 'monthly', 'on_close']
    }).default('monthly'),
    dayOfMonth: integer('day_of_month').default(5), // 5th of each month

    // What to include
    includeInvoices: integer('include_invoices', { mode: 'boolean' }).default(true),
    includeReceipts: integer('include_receipts', { mode: 'boolean' }).default(true),
    includePayroll: integer('include_payroll', { mode: 'boolean' }).default(true),
    includeContracts: integer('include_contracts', { mode: 'boolean' }).default(false),
    includeDre: integer('include_dre', { mode: 'boolean' }).default(true),
    includeBalancete: integer('include_balancete', { mode: 'boolean' }).default(true),
    includeSped: integer('include_sped', { mode: 'boolean' }).default(false),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    lastDeliveryAt: integer('last_delivery_at'),
    nextDeliveryAt: integer('next_delivery_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_delivery_config_org').on(table.organizationId),
]);

// Delivery History
export const accountantDeliveryHistory = sqliteTable('accountant_delivery_history', {
    id: text('id').primaryKey().default(uuid()),
    configId: text('config_id').notNull().references(() => accountantDeliveryConfig.id),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    period: text('period').notNull(),              // YYYY-MM

    // Delivery result
    status: text('status', {
        enum: ['pending', 'in_progress', 'success', 'failed', 'partial']
    }).default('pending'),

    documentCount: integer('document_count'),
    totalSizeBytes: integer('total_size_bytes'),

    // Error tracking
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0),

    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),

    // What was delivered
    deliveredDocuments: text('delivered_documents').default('[]'), // JSON array

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_delivery_history_config').on(table.configId),
    index('idx_delivery_history_period').on(table.period),
    index('idx_delivery_history_status').on(table.status),
]);

// ============================================================================
// LATTICE HR: TOPOLOGICAL TALENT MATCHING
// ============================================================================

// Skill Definitions (9 categories, 45 skills)
export const latticeSkillDefinitions = sqliteTable('lattice_skill_definitions', {
    id: text('id').primaryKey().default(uuid()),

    category: text('category', {
        enum: [
            'communication',
            'adaptability',
            'diversity_understanding',
            'social_media_digital',
            'emotional_intelligence',
            'time_management',
            'networking',
            'continuous_learning',
            'logic_reasoning'
        ]
    }).notNull(),

    skillName: text('skill_name').notNull(),
    description: text('description'),

    // Skills that this skill affects when in shadow state
    adjacentSkills: text('adjacent_skills').default('[]'), // JSON array of skill IDs

    // For ordering within category
    sortOrder: integer('sort_order').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_lattice_skills_category').on(table.category),
    uniqueIndex('idx_lattice_skills_unique').on(table.category, table.skillName),
]);

// Evidence Points (the lattice)
export const latticeEvidence = sqliteTable('lattice_evidence', {
    id: text('id').primaryKey().default(uuid()),

    // Who this evidence is about
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organizations.id),

    // The evidence content
    content: text('content').notNull(),
    context: text('context'), // Additional context about the evidence

    // Source classification
    sourceType: text('source_type', {
        enum: [
            'ai_conversation',
            'peer_feedback',
            'self_reflection',
            'workshop_completion',
            'capstone_submission',
            'challenge_attempt',
            'collaboration',
            'conflict_resolution',
            'teaching_moment',
            'pressure_response',
            'manual_entry'
        ]
    }).notNull(),

    sourceId: text('source_id'), // Reference to source record (chat ID, review ID, etc.)

    // 768-dimensional embedding vector (stored as JSON array)
    embedding: text('embedding').notNull(), // JSON array of 768 floats

    // Skill associations (calculated from embedding + classification)
    skillScores: text('skill_scores').default('{}'), // JSON: { skillId: relevanceScore }

    // Status
    status: text('status', {
        enum: ['active', 'contested', 'removed', 'merged']
    }).default('active'),

    contestReason: text('contest_reason'),
    contestedAt: integer('contested_at'),
    contestedBy: text('contested_by'),

    capturedAt: integer('captured_at').default(timestamp()),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_lattice_evidence_person').on(table.personId),
    index('idx_lattice_evidence_org').on(table.organizationId),
    index('idx_lattice_evidence_source').on(table.sourceType),
    index('idx_lattice_evidence_status').on(table.status),
    index('idx_lattice_evidence_captured').on(table.capturedAt),
]);

// Reusable Projection Lenses (query embeddings)
export const latticeProjections = sqliteTable('lattice_projections', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').references(() => organizations.id),
    createdBy: text('created_by').notNull().references(() => persons.id),

    name: text('name').notNull(),
    description: text('description'),

    // The query text that defines this projection lens
    queryText: text('query_text').notNull(),

    // 768-dimensional embedding of the query
    queryEmbedding: text('query_embedding').notNull(), // JSON array of 768 floats

    // Use case categorization
    category: text('category', {
        enum: ['hiring', 'teacher_course', 'team_composition', 'self_development', 'custom']
    }).default('custom'),

    // Shadow exclusions (skills that should NOT be in shadow for this role)
    shadowExclusions: text('shadow_exclusions').default('[]'), // JSON array of skill IDs

    // For ideal shape comparison
    idealShapeData: text('ideal_shape_data'), // JSON: expected skill positions

    isPublic: integer('is_public').default(0),
    usageCount: integer('usage_count').default(0),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_lattice_projections_org').on(table.organizationId),
    index('idx_lattice_projections_category').on(table.category),
    index('idx_lattice_projections_public').on(table.isPublic),
]);

// Consent-based Sharing
export const latticeShares = sqliteTable('lattice_shares', {
    id: text('id').primaryKey().default(uuid()),

    // Owner of the lattice
    ownerId: text('owner_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Who can view (null = public link with token)
    granteeId: text('grantee_id').references(() => persons.id),
    granteeEmail: text('grantee_email'), // For invitations before user exists

    // Optional: limit to specific projection
    projectionId: text('projection_id').references(() => latticeProjections.id),

    // Permission levels
    canSeeShape: integer('can_see_shape').default(1),      // Topological outline
    canSeePoints: integer('can_see_points').default(0),    // Individual evidence
    canSeeTimeline: integer('can_see_timeline').default(0), // Time-based view

    // Access token for shareable links
    accessToken: text('access_token'),

    // Time limits
    expiresAt: integer('expires_at'),
    maxViews: integer('max_views'),
    viewCount: integer('view_count').default(0),

    // Status
    status: text('status', {
        enum: ['active', 'expired', 'revoked']
    }).default('active'),

    createdAt: integer('created_at').default(timestamp()),
    lastAccessedAt: integer('last_accessed_at'),
}, (table) => [
    index('idx_lattice_shares_owner').on(table.ownerId),
    index('idx_lattice_shares_grantee').on(table.granteeId),
    index('idx_lattice_shares_token').on(table.accessToken),
    index('idx_lattice_shares_status').on(table.status),
]);

// Calculated Skill Assessments
export const latticeSkillAssessments = sqliteTable('lattice_skill_assessments', {
    id: text('id').primaryKey().default(uuid()),

    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    skillId: text('skill_id').notNull().references(() => latticeSkillDefinitions.id),

    // Position on the spectrum (-2 to +2)
    // SHADOW (-2), SURFACE (-1), MID (0), DEEP (+1), CORE (+2)
    position: real('position').notNull().default(0),

    // How confident are we in this assessment (0-1)
    confidence: real('confidence').default(0),

    // How much evidence supports this
    evidenceCount: integer('evidence_count').default(0),

    // Shadow casting: does this skill cast shadow on adjacent skills?
    castsShadow: integer('casts_shadow').default(0),
    shadowIntensity: real('shadow_intensity').default(0), // How much shadow effect

    lastCalculatedAt: integer('last_calculated_at').default(timestamp()),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_lattice_assessments_person').on(table.personId),
    index('idx_lattice_assessments_skill').on(table.skillId),
    uniqueIndex('idx_lattice_assessments_unique').on(table.personId, table.skillId),
]);

// Cached Projection Results
export const latticeProjectionResults = sqliteTable('lattice_projection_results', {
    id: text('id').primaryKey().default(uuid()),

    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    projectionId: text('projection_id').notNull().references(() => latticeProjections.id, { onDelete: 'cascade' }),

    // The calculated shape data
    shapeData: text('shape_data').notNull(), // JSON: skill positions, boundaries

    // Shadow analysis
    shadowRegions: text('shadow_regions').default('[]'), // JSON: areas where shadows are detected

    // Fit score comparison to ideal (0-100)
    fitScore: real('fit_score'),

    // Exclusion check results
    exclusionViolations: text('exclusion_violations').default('[]'), // JSON: skills that violated exclusions

    // Metadata
    evidencePointsUsed: integer('evidence_points_used').default(0),
    timeRangeStart: integer('time_range_start'),
    timeRangeEnd: integer('time_range_end'),

    calculatedAt: integer('calculated_at').default(timestamp()),
    expiresAt: integer('expires_at'), // Cache expiry
}, (table) => [
    index('idx_lattice_results_person').on(table.personId),
    index('idx_lattice_results_projection').on(table.projectionId),
    uniqueIndex('idx_lattice_results_unique').on(table.personId, table.projectionId),
]);

// ============================================================================
// LATTICE HR: Talent Profiles
// ============================================================================

// Talent profiles for external candidates (not employees)
export const talentProfiles = sqliteTable('talent_profiles', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Profile info
    headline: text('headline'), // E.g., "Senior Software Engineer"
    summary: text('summary'),
    cvData: text('cv_data'), // JSON: generated CV data

    // Current lattice (aggregated from all evidence)
    currentLattice: text('current_lattice'), // JSON: skill positions

    // Interview data
    interviewMessages: text('interview_messages'), // JSON: conversation history
    interviewCompletedAt: integer('interview_completed_at'),

    // Skill gaps (skills that need more evidence or interview)
    skillGaps: text('skill_gaps').default('[]'), // JSON: array of skill IDs
    lastGapCheckAt: integer('last_gap_check_at'),

    // Stats
    evidenceCount: integer('evidence_count').default(0),
    profileCompleteness: real('profile_completeness').default(0), // 0-100

    // Status
    status: text('status', {
        enum: ['incomplete', 'complete', 'published', 'archived']
    }).default('incomplete'),

    isSearchable: integer('is_searchable').default(0), // Can employers find them?

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_talent_profiles_person').on(table.personId),
    index('idx_talent_profiles_status').on(table.status),
    index('idx_talent_profiles_searchable').on(table.isSearchable),
]);

// Evidence documents uploaded by talent
export const talentEvidenceDocuments = sqliteTable('talent_evidence_documents', {
    id: text('id').primaryKey().default(uuid()),
    profileId: text('profile_id').notNull().references(() => talentProfiles.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Document info
    filename: text('filename').notNull(),
    fileType: text('file_type').notNull(), // 'pdf', 'image', 'text'
    fileUrl: text('file_url'), // URL if stored externally
    fileContent: text('file_content'), // Extracted text content

    // Classification
    documentType: text('document_type', {
        enum: ['resume', 'certificate', 'diploma', 'portfolio', 'recommendation', 'transcript', 'other']
    }).default('other'),

    // AI analysis
    analysisStatus: text('analysis_status', {
        enum: ['pending', 'processing', 'completed', 'failed']
    }).default('pending'),
    analysisResult: text('analysis_result'), // JSON: extracted skills, evidence
    skillsExtracted: text('skills_extracted').default('[]'), // JSON: array of skill IDs with scores

    // Lattice contribution
    contributedToLattice: integer('contributed_to_lattice').default(0),
    contributedAt: integer('contributed_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_talent_docs_profile').on(table.profileId),
    index('idx_talent_docs_person').on(table.personId),
    index('idx_talent_docs_status').on(table.analysisStatus),
]);

// Gap-fill interview sessions
export const talentGapInterviews = sqliteTable('talent_gap_interviews', {
    id: text('id').primaryKey().default(uuid()),
    profileId: text('profile_id').notNull().references(() => talentProfiles.id, { onDelete: 'cascade' }),

    // Target skills for this session
    targetSkills: text('target_skills').notNull(), // JSON: array of skill IDs

    // Conversation
    messages: text('messages').default('[]'), // JSON: conversation history

    // Status
    status: text('status', {
        enum: ['in_progress', 'completed', 'abandoned']
    }).default('in_progress'),

    // Result
    skillsAssessed: text('skills_assessed'), // JSON: assessed skills with scores
    latticeContribution: text('lattice_contribution'), // JSON: skill updates

    createdAt: integer('created_at').default(timestamp()),
    completedAt: integer('completed_at'),
}, (table) => [
    index('idx_gap_interviews_profile').on(table.profileId),
    index('idx_gap_interviews_status').on(table.status),
]);

// ============================================================================
// Type Exports
// ============================================================================

// Organization type is exported at line 172
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptRun = typeof promptRuns.$inferSelect;
export type Progress = typeof progress.$inferSelect;

// Student Toolbox
export type StudentPrompt = typeof studentPrompts.$inferSelect;
export type RunAnnotation = typeof runAnnotations.$inferSelect;
export type GraveyardEntry = typeof graveyardEntries.$inferSelect;
export type TechniqueUsage = typeof techniqueUsage.$inferSelect;
export type TodoItem = typeof todoItems.$inferSelect;
export type ProblemWorkshop = typeof problemWorkshops.$inferSelect;
export type CapstoneSubmission = typeof capstoneSubmissions.$inferSelect;
export type PeerReview = typeof peerReviews.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeAttempt = typeof challengeAttempts.$inferSelect;
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type KnowledgeEdge = typeof knowledgeEdges.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;

// Financial
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type CoursePricing = typeof coursePricing.$inferSelect;
export type SchoolService = typeof schoolServices.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TeacherPayout = typeof teacherPayouts.$inferSelect;

// School Operations
export type Room = typeof rooms.$inferSelect;
export type Term = typeof terms.$inferSelect;
export type CourseType = typeof courseTypes.$inferSelect;
export type Level = typeof levels.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type ScheduleException = typeof scheduleExceptions.$inferSelect;
export type ClassSession = typeof classSessions.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type PlacementTest = typeof placementTests.$inferSelect;
export type PlacementResult = typeof placementResults.$inferSelect;

// Products & Pricing
export type Product = typeof products.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type TeacherContract = typeof teacherContracts.$inferSelect;

// CRM
export type Lead = typeof leads.$inferSelect;
export type LeadInteraction = typeof leadInteractions.$inferSelect;
export type TrialClass = typeof trialClasses.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignLead = typeof campaignLeads.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Referral = typeof referrals.$inferSelect;

// Enrollments
export type Enrollment = typeof enrollments.$inferSelect;
export type WaitlistEntry = typeof waitlist.$inferSelect;
export type FamilyLink = typeof familyLinks.$inferSelect;

// AI Companion: Memory
export type MemoryGraph = typeof memoryGraphs.$inferSelect;
export type MemoryNode = typeof memoryNodes.$inferSelect;
export type MemoryEdge = typeof memoryEdges.$inferSelect;
export type MemoryLedgerEntry = typeof memoryLedger.$inferSelect;
export type MemoryContradiction = typeof memoryContradictions.$inferSelect;
export type StudentWorldOverlay = typeof studentWorldOverlay.$inferSelect;

// AI Companion: Chat
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Ethics & Supervision
export type MemoryIntegrityHash = typeof memoryIntegrityHashes.$inferSelect;
export type MemoryAuditLogEntry = typeof memoryAuditLog.$inferSelect;
export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type AlertAcknowledgment = typeof alertAcknowledgments.$inferSelect;
export type WellbeingSnapshot = typeof wellbeingSnapshots.$inferSelect;

// Fiscal & Accounting (SPED)
export type BankAccountRecord = typeof bankAccounts.$inferSelect;
export type FiscalTaxWithholding = typeof fiscalTaxWithholdings.$inferSelect;
export type FiscalTransaction = typeof fiscalTransactions.$inferSelect;
export type FiscalTransactionDocument = typeof fiscalTransactionDocuments.$inferSelect;

// Lattice HR
export type LatticeEvidence = typeof latticeEvidence.$inferSelect;
export type LatticeProjection = typeof latticeProjections.$inferSelect;
export type LatticeShare = typeof latticeShares.$inferSelect;
export type LatticeSkillDefinition = typeof latticeSkillDefinitions.$inferSelect;
export type LatticeSkillAssessment = typeof latticeSkillAssessments.$inferSelect;
export type LatticeProjectionResult = typeof latticeProjectionResults.$inferSelect;

// Talent Profiles
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type TalentEvidenceDocument = typeof talentEvidenceDocuments.$inferSelect;
export type TalentGapInterview = typeof talentGapInterviews.$inferSelect;

// ============================================================================
// PERMISSION SYSTEM
// ============================================================================

/**
 * Available modules for permission control
 */
export const PERMISSION_MODULES = [
    // Student
    'student_dashboard', 'student_lessons', 'student_techniques', 'student_todo',
    'student_constellation', 'student_workshop', 'student_challenges', 'student_capstone', 'student_reviews',
    // Parent
    'parent_dashboard', 'parent_billing', 'parent_messages',
    // Teacher
    'teacher_dashboard', 'teacher_attendance', 'teacher_grades', 'teacher_students',
    // Staff
    'staff_dashboard', 'staff_leads', 'staff_trials', 'staff_checkin', 'staff_landing_builder',
    // School Admin
    'school_dashboard', 'school_courses', 'school_modules', 'school_lessons',
    'school_rooms', 'school_schedules', 'school_terms', 'school_classes',
    'school_teachers', 'school_enrollments', 'school_discounts', 'school_products',
    // Marketing
    'marketing_campaigns', 'marketing_templates', 'marketing_referrals',
    // Owner
    'owner_dashboard', 'owner_payroll', 'owner_reports', 'owner_payables',
    'owner_employees', 'owner_permissions', 'owner_accounting',
    // Accountant
    'accountant_dashboard', 'accountant_reports', 'accountant_sped',
    // Lattice HR
    'lattice_evidence', 'lattice_projections', 'lattice_shares', 'lattice_matching',
    // Talent
    'talent_dashboard', 'talent_documents', 'talent_interview', 'talent_cv',
] as const;

export type PermissionModule = typeof PERMISSION_MODULES[number];

/**
 * Role-based permission defaults (template for each role)
 * Owner can customize these per-user
 */
export const rolePermissions = sqliteTable('role_permissions', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

    role: text('role', { enum: ['student', 'parent', 'teacher', 'staff', 'admin', 'owner', 'accountant', 'talent'] }).notNull(),
    module: text('module').notNull(), // One of PERMISSION_MODULES

    canCreate: integer('can_create', { mode: 'boolean' }).default(false),
    canRead: integer('can_read', { mode: 'boolean' }).default(true),
    canUpdate: integer('can_update', { mode: 'boolean' }).default(false),
    canDelete: integer('can_delete', { mode: 'boolean' }).default(false),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_role_permissions_org_role').on(table.organizationId, table.role),
    uniqueIndex('idx_role_permissions_unique').on(table.organizationId, table.role, table.module),
]);

/**
 * User-specific permission overrides
 * Takes precedence over role defaults
 */
export const userPermissions = sqliteTable('user_permissions', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    module: text('module').notNull(), // One of PERMISSION_MODULES

    // null = inherit from role, true/false = override
    canCreate: integer('can_create', { mode: 'boolean' }),
    canRead: integer('can_read', { mode: 'boolean' }),
    canUpdate: integer('can_update', { mode: 'boolean' }),
    canDelete: integer('can_delete', { mode: 'boolean' }),

    grantedBy: text('granted_by').references(() => persons.id), // Who gave this permission
    reason: text('reason'), // Optional note for why this override exists

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_user_permissions_person').on(table.personId),
    uniqueIndex('idx_user_permissions_unique').on(table.personId, table.module),
]);

// Permission Types
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;

// ============================================================================
// CRM: Audit Log (Change History with Delta Tracking)
// ============================================================================

/**
 * CRM Audit Log - Tracks every change ever made to CRM entities
 * Never deletes data, only logs delta changes for full history
 */
export const crmAuditLog = sqliteTable('crm_audit_log', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What was changed
    entityType: text('entity_type', {
        enum: ['lead', 'enrollment', 'trial', 'interaction', 'campaign']
    }).notNull(),
    entityId: text('entity_id').notNull(), // ID of the lead/enrollment/etc

    // What action was performed
    action: text('action', {
        enum: ['create', 'update', 'stage_change', 'assign', 'note', 'status_change', 'archive', 'restore', 'undo']
    }).notNull(),

    // Delta tracking - what changed
    fieldName: text('field_name'), // The specific field that changed (null for create)
    previousValue: text('previous_value'), // JSON: old value
    newValue: text('new_value'), // JSON: new value

    // Full snapshot for complex changes
    previousSnapshot: text('previous_snapshot'), // JSON: full object before change
    newSnapshot: text('new_snapshot'), // JSON: full object after change

    // Change metadata
    changeDescription: text('change_description'), // Human-readable description
    reason: text('reason'), // Optional reason for the change

    // Who made the change
    changedBy: text('changed_by').notNull().references(() => persons.id),
    changedByName: text('changed_by_name'), // Denormalized for faster reads
    changedByRole: text('changed_by_role'), // Role at time of change

    // Undo tracking
    canUndo: integer('can_undo', { mode: 'boolean' }).default(true),
    undoneAt: integer('undone_at'),
    undoneBy: text('undone_by').references(() => persons.id),
    undoReason: text('undo_reason'),

    // Link to the change that was undone (if this is an undo action)
    undoesLogId: text('undoes_log_id'), // References crm_audit_log.id (no FK to avoid circular ref)

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_crm_audit_entity').on(table.entityType, table.entityId),
    index('idx_crm_audit_org').on(table.organizationId, table.createdAt),
    index('idx_crm_audit_changed_by').on(table.changedBy),
    index('idx_crm_audit_action').on(table.action),
]);

/**
 * CRM Stage History - Specifically tracks stage transitions for funnel analytics
 */
export const crmStageHistory = sqliteTable('crm_stage_history', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    entityType: text('entity_type', {
        enum: ['lead', 'enrollment']
    }).notNull(),
    entityId: text('entity_id').notNull(),

    fromStage: text('from_stage'),
    toStage: text('to_stage').notNull(),

    // Time tracking
    enteredAt: integer('entered_at').default(timestamp()),
    exitedAt: integer('exited_at'),
    durationSeconds: integer('duration_seconds'), // Calculated on exit

    // Attribution
    changedBy: text('changed_by').references(() => persons.id),
    reason: text('reason'),

    // Metrics at time of transition
    valueAtTransition: real('value_at_transition'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_stage_history_entity').on(table.entityType, table.entityId),
    index('idx_stage_history_stages').on(table.fromStage, table.toStage),
    index('idx_stage_history_date').on(table.enteredAt),
]);

// Audit Log Types
export type CrmAuditLog = typeof crmAuditLog.$inferSelect;
export type CrmAuditLogInsert = typeof crmAuditLog.$inferInsert;
export type CrmStageHistory = typeof crmStageHistory.$inferSelect;

// ============================================================================
// TASK MANAGEMENT SYSTEM
// ============================================================================

/**
 * Action Item Types - Owner-configurable task categories
 * Allows organizations to define their own task templates with custom fields
 * and link them to specific database entities for relationship tracking
 */
export const actionItemTypes = sqliteTable('action_item_types', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Basic info
    name: text('name').notNull(), // e.g., "Follow-up Call", "Trial Class", "Send Contract"
    description: text('description'),
    icon: text('icon').default('IconChecklist'), // Tabler icon name
    color: text('color').default('blue'), // Mantine color

    // Entity linking configuration - which tables can this task type link to
    // JSON array: ["lead", "enrollment", "user", "course", etc.]
    allowedEntities: text('allowed_entities').default('[]'),

    // Default settings for tasks of this type
    defaultPriority: text('default_priority', {
        enum: ['low', 'medium', 'high', 'urgent']
    }).default('medium'),
    defaultDurationMinutes: integer('default_duration_minutes').default(30),

    // Custom fields schema - JSON describing additional fields
    // Example: [{"name": "outcome", "type": "select", "options": ["answered", "no_answer", "voicemail"]}]
    customFields: text('custom_fields').default('[]'),

    // Workflow settings
    requiresNote: integer('requires_note', { mode: 'boolean' }).default(false),
    requiresOutcome: integer('requires_outcome', { mode: 'boolean' }).default(false),
    autoCreateFollowUp: integer('auto_create_follow_up', { mode: 'boolean' }).default(false),

    // Visibility & permissions
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    visibleToRoles: text('visible_to_roles').default('["owner", "admin", "staff"]'), // JSON array

    // Ordering
    sortOrder: integer('sort_order').default(0),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_action_item_types_org').on(table.organizationId),
    index('idx_action_item_types_active').on(table.isActive),
]);

/**
 * Action Items - Main task/action records
 * Flexible task system that can link to any entity in the database
 */
export const actionItems = sqliteTable('action_items', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Task type and basic info
    actionTypeId: text('action_type_id').references(() => actionItemTypes.id),
    title: text('title').notNull(),
    description: text('description'),

    // Entity linking - flexible relationship to any table
    // entityType matches table names: "lead", "enrollment", "user", "course", etc.
    linkedEntityType: text('linked_entity_type'),
    linkedEntityId: text('linked_entity_id'),

    // Secondary entity link (e.g., task about a lead but related to a course)
    secondaryEntityType: text('secondary_entity_type'),
    secondaryEntityId: text('secondary_entity_id'),

    // Assignment
    assignedTo: text('assigned_to').references(() => persons.id),
    createdBy: text('created_by').notNull().references(() => persons.id),

    // Status tracking
    status: text('status', {
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'deferred']
    }).default('pending'),
    priority: text('priority', {
        enum: ['low', 'medium', 'high', 'urgent']
    }).default('medium'),

    // Scheduling - Calendar Integration
    dueDate: integer('due_date'), // Timestamp for due date
    dueTime: text('due_time'), // Optional specific time (HH:MM format)
    startDate: integer('start_date'), // For time-blocked tasks
    endDate: integer('end_date'),
    isAllDay: integer('is_all_day', { mode: 'boolean' }).default(false),

    // Recurrence (null = one-time task)
    // JSON: {"frequency": "daily|weekly|monthly", "interval": 1, "endDate": null, "count": 10}
    recurrence: text('recurrence'),
    recurrenceParentId: text('recurrence_parent_id'), // Links to original recurring task

    // Reminders - JSON array of reminder configs
    // [{"type": "notification|email|sms", "beforeMinutes": 30}, ...]
    reminders: text('reminders').default('[]'),

    // Completion tracking
    completedAt: integer('completed_at'),
    completedBy: text('completed_by').references(() => persons.id),

    // Outcome/result (for completed tasks)
    outcome: text('outcome'), // Custom outcome field
    outcomeNotes: text('outcome_notes'),

    // Custom field values - JSON matching taskType.customFields schema
    customFieldValues: text('custom_field_values').default('{}'),

    // Calendar sync
    externalCalendarId: text('external_calendar_id'), // Google Calendar event ID, etc.
    externalCalendarProvider: text('external_calendar_provider'), // "google", "outlook", etc.

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_action_items_org').on(table.organizationId),
    index('idx_action_items_assigned').on(table.assignedTo),
    index('idx_action_items_status').on(table.status),
    index('idx_action_items_due_date').on(table.dueDate),
    index('idx_action_items_entity').on(table.linkedEntityType, table.linkedEntityId),
    index('idx_action_items_type').on(table.actionTypeId),
    index('idx_action_items_created_by').on(table.createdBy),
]);

/**
 * Action Item Comments - Discussion/updates on action items
 */
export const actionItemComments = sqliteTable('action_item_comments', {
    id: text('id').primaryKey().default(uuid()),
    actionItemId: text('action_item_id').notNull().references(() => actionItems.id, { onDelete: 'cascade' }),

    content: text('content').notNull(),

    // Mentions - JSON array of user IDs mentioned
    mentions: text('mentions').default('[]'),

    createdBy: text('created_by').notNull().references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    isEdited: integer('is_edited', { mode: 'boolean' }).default(false),
}, (table) => [
    index('idx_action_item_comments_item').on(table.actionItemId),
]);

// ============================================================================
// NOTES SYSTEM - Universal notes for any entity
// ============================================================================

/**
 * Notes - Rich notes attached to any entity
 * Can be used for CRM notes, student notes, course notes, etc.
 */
export const notes = sqliteTable('notes', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Entity linking
    entityType: text('entity_type').notNull(), // "lead", "enrollment", "user", etc.
    entityId: text('entity_id').notNull(),

    // Note content
    title: text('title'), // Optional title
    content: text('content').notNull(),
    contentType: text('content_type', {
        enum: ['plain', 'markdown', 'html']
    }).default('markdown'),

    // Categorization
    noteType: text('note_type', {
        enum: ['general', 'call', 'meeting', 'email', 'internal', 'important', 'followup']
    }).default('general'),

    // Visibility
    isPrivate: integer('is_private', { mode: 'boolean' }).default(false), // Only creator can see
    isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),

    // Attachments - JSON array of attachment references
    attachments: text('attachments').default('[]'),

    // Attribution
    createdBy: text('created_by').notNull().references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_notes_entity').on(table.entityType, table.entityId),
    index('idx_notes_org').on(table.organizationId),
    index('idx_notes_created_by').on(table.createdBy),
    index('idx_notes_pinned').on(table.isPinned),
]);

// ============================================================================
// ACTIVITY FEED - Unified activity tracking
// ============================================================================

/**
 * Activity Feed - Unified log of all actions for timeline views
 * Powers "recent activity" widgets and notification feeds
 */
export const activityFeed = sqliteTable('activity_feed', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Actor
    actorId: text('actor_id').notNull().references(() => persons.id),
    actorName: text('actor_name'), // Denormalized for quick display

    // Action
    action: text('action', {
        enum: [
            // Task actions
            'task_created', 'task_completed', 'task_assigned', 'task_updated', 'task_commented',
            // Note actions
            'note_created', 'note_updated',
            // Meeting actions
            'meeting_created', 'meeting_updated', 'meeting_cancelled', 'meeting_approved', 'meeting_rejected',
            // CRM actions
            'lead_created', 'lead_updated', 'lead_stage_changed', 'lead_assigned',
            'enrollment_created', 'enrollment_updated', 'enrollment_status_changed',
            // Communication actions
            'call_logged', 'email_sent', 'message_sent',
            // General
            'entity_created', 'entity_updated', 'entity_deleted'
        ]
    }).notNull(),

    // Target entity
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    entityName: text('entity_name'), // Denormalized for quick display

    // Related entity (if applicable)
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: text('related_entity_id'),

    // Activity details - JSON with action-specific data
    details: text('details').default('{}'),

    // For filtering by date
    occurredAt: integer('occurred_at').default(timestamp()),

    // Read status per user - handled separately or via client
    isImportant: integer('is_important', { mode: 'boolean' }).default(false),
}, (table) => [
    index('idx_activity_org').on(table.organizationId),
    index('idx_activity_actor').on(table.actorId),
    index('idx_activity_entity').on(table.entityType, table.entityId),
    index('idx_activity_date').on(table.occurredAt),
    index('idx_activity_action').on(table.action),
]);

// ============================================================================
// CALENDAR SETTINGS - Personal calendar preferences
// ============================================================================

/**
 * User Calendar Settings - Personal calendar preferences and sync config
 */
export const userCalendarSettings = sqliteTable('user_calendar_settings', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Display preferences
    defaultView: text('default_view', {
        enum: ['day', 'week', 'month', 'agenda']
    }).default('week'),
    weekStartsOn: integer('week_starts_on').default(0), // 0 = Sunday, 1 = Monday
    workingHoursStart: text('working_hours_start').default('08:00'),
    workingHoursEnd: text('working_hours_end').default('18:00'),
    workingDays: text('working_days').default('[1,2,3,4,5]'), // Monday-Friday

    // Notification preferences
    defaultReminderMinutes: integer('default_reminder_minutes').default(30),
    enableEmailReminders: integer('enable_email_reminders', { mode: 'boolean' }).default(true),
    enablePushReminders: integer('enable_push_reminders', { mode: 'boolean' }).default(true),

    // External calendar sync
    googleCalendarToken: text('google_calendar_token'), // Encrypted OAuth token
    googleCalendarId: text('google_calendar_id'),
    outlookCalendarToken: text('outlook_calendar_token'),
    outlookCalendarId: text('outlook_calendar_id'),

    // Sync settings
    syncEnabled: integer('sync_enabled', { mode: 'boolean' }).default(false),
    lastSyncAt: integer('last_sync_at'),
    syncDirection: text('sync_direction', {
        enum: ['push', 'pull', 'both']
    }).default('both'),

    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_calendar_settings_person').on(table.personId),
]);

// ============================================================================
// ORGANIZATIONAL HIERARCHY & ROLES
// ============================================================================

/**
 * Organizational Roles - Owner-configurable role definitions
 * Allows defining custom roles beyond the basic user.role enum
 * Each role has a hierarchy level and configurable permissions
 */
export const organizationalRoles = sqliteTable('organizational_roles', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Role definition
    name: text('name').notNull(), // e.g., "Pedagogical Coordinator", "Marketing Manager"
    slug: text('slug').notNull(), // e.g., "pedagogical_coordinator", "marketing_manager"
    description: text('description'),

    // Hierarchy level (higher = more authority, owner = 100)
    hierarchyLevel: integer('hierarchy_level').notNull().default(10),

    // Category for grouping similar roles
    category: text('category', {
        enum: ['executive', 'director', 'coordinator', 'manager', 'specialist', 'staff', 'educator', 'support']
    }).default('staff'),

    // Department/Area assignment
    department: text('department'), // e.g., "pedagogical", "administrative", "marketing", "sales"

    // Base permissions - JSON array of permission strings
    // e.g., ["schedule:internal", "schedule:external", "approve:meetings", "view:team_calendar"]
    permissions: text('permissions').default('[]'),

    // Visual settings
    icon: text('icon').default('IconUser'),
    color: text('color').default('blue'),

    // Whether this role can have direct reports
    canHaveReports: integer('can_have_reports', { mode: 'boolean' }).default(false),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    isSystemRole: integer('is_system_role', { mode: 'boolean' }).default(false), // Cannot be deleted

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_org_roles_org').on(table.organizationId),
    index('idx_org_roles_slug').on(table.slug),
    index('idx_org_roles_hierarchy').on(table.hierarchyLevel),
    uniqueIndex('idx_org_roles_unique_slug').on(table.organizationId, table.slug),
]);

/**
 * User Role Assignments - Links users to organizational roles
 * A user can have multiple roles (e.g., "Teacher" + "Department Head")
 */
export const userRoleAssignments = sqliteTable('user_role_assignments', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    roleId: text('role_id').notNull().references(() => organizationalRoles.id, { onDelete: 'cascade' }),

    // Scope of this role assignment (null = organization-wide)
    scopeType: text('scope_type', {
        enum: ['organization', 'department', 'team', 'course']
    }).default('organization'),
    scopeId: text('scope_id'), // Department ID, Team ID, or Course ID

    // Who this person reports to in this role
    reportsTo: text('reports_to').references(() => persons.id),

    isPrimary: integer('is_primary', { mode: 'boolean' }).default(false), // Primary role for this user

    effectiveFrom: integer('effective_from').default(timestamp()),
    effectiveUntil: integer('effective_until'), // null = active indefinitely

    assignedBy: text('assigned_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_user_roles_person').on(table.personId),
    index('idx_user_roles_role').on(table.roleId),
    index('idx_user_roles_reports').on(table.reportsTo),
]);

/**
 * Role Relationships - Defines scheduling/meeting permissions between roles
 * This configures who can schedule meetings with whom
 */
export const roleRelationships = sqliteTable('role_relationships', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // The role that CAN schedule/request meetings
    fromRoleId: text('from_role_id').notNull().references(() => organizationalRoles.id),

    // The role they can schedule WITH
    toRoleId: text('to_role_id').notNull().references(() => organizationalRoles.id),

    // Relationship type
    relationshipType: text('relationship_type', {
        enum: [
            'manages',           // fromRole is direct manager of toRole
            'can_schedule',      // fromRole can schedule meetings with toRole
            'can_request',       // fromRole can request meetings (needs approval)
            'can_approve',       // fromRole can approve meeting requests from toRole
            'collaborates'       // Peer relationship, can schedule freely
        ]
    }).notNull(),

    // For request-based scheduling, who needs to approve
    requiresApprovalFrom: text('requires_approval_from').references(() => organizationalRoles.id),

    // Meeting types allowed for this relationship
    // JSON array: ["internal", "one_on_one", "team", "cross_department"]
    allowedMeetingTypes: text('allowed_meeting_types').default('["internal"]'),

    // Additional constraints
    maxDurationMinutes: integer('max_duration_minutes'), // null = no limit
    requiresNotice: integer('requires_notice', { mode: 'boolean' }).default(false),
    noticeHours: integer('notice_hours').default(24),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_role_rel_org').on(table.organizationId),
    index('idx_role_rel_from').on(table.fromRoleId),
    index('idx_role_rel_to').on(table.toRoleId),
]);

// ============================================================================
// MEETINGS SYSTEM
// ============================================================================

/**
 * Meetings - Comprehensive meeting records
 * Distinguishes between internal, external, trial classes, parent meetings, etc.
 */
export const meetings = sqliteTable('meetings', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Basic info
    title: text('title').notNull(),
    description: text('description'),

    // Meeting classification
    meetingType: text('meeting_type', {
        enum: [
            'internal',           // Staff-to-staff meetings
            'external',           // With external parties (vendors, partners)
            'trial_class',        // Trial/demo class with prospective student
            'parent_teacher',     // Parent-teacher conference
            'one_on_one',         // 1:1 meetings
            'team',               // Team meetings
            'all_hands',          // Company-wide meetings
            'training',           // Training sessions
            'interview',          // Job interviews
            'client'              // Client meetings
        ]
    }).notNull().default('internal'),

    // Context - what is this meeting about
    contextType: text('context_type'), // "lead", "enrollment", "employee", "course", etc.
    contextId: text('context_id'),     // ID of the related entity

    // Scheduling
    scheduledStart: integer('scheduled_start').notNull(),
    scheduledEnd: integer('scheduled_end').notNull(),
    timezone: text('timezone').default('America/Sao_Paulo'),
    isAllDay: integer('is_all_day', { mode: 'boolean' }).default(false),

    // Recurrence - JSON config
    recurrence: text('recurrence'),
    recurrenceParentId: text('recurrence_parent_id'),

    // Location
    locationType: text('location_type', {
        enum: ['in_person', 'video_call', 'phone', 'hybrid']
    }).default('video_call'),
    location: text('location'), // Physical address or video call link
    videoProvider: text('video_provider'), // "google_meet", "zoom", "teams"
    videoLink: text('video_link'),

    // Status
    status: text('status', {
        enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show']
    }).default('scheduled'),

    // Approval workflow (for meetings requiring approval)
    requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(false),
    approvalStatus: text('approval_status', {
        enum: ['pending', 'approved', 'rejected']
    }),
    approvedBy: text('approved_by').references(() => persons.id),
    approvedAt: integer('approved_at'),
    approvalNotes: text('approval_notes'),

    // Organizer
    organizerId: text('organizer_id').notNull().references(() => persons.id),
    createdBy: text('created_by').notNull().references(() => persons.id),

    // Meeting notes and outcome
    agenda: text('agenda'),
    notes: text('notes'),
    outcome: text('outcome'),
    followUpActions: text('follow_up_actions'), // JSON array

    // External calendar sync
    externalCalendarId: text('external_calendar_id'),
    externalCalendarProvider: text('external_calendar_provider'),

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    cancelledAt: integer('cancelled_at'),
    cancelledBy: text('cancelled_by').references(() => persons.id),
    cancellationReason: text('cancellation_reason'),
}, (table) => [
    index('idx_meetings_org').on(table.organizationId),
    index('idx_meetings_organizer').on(table.organizerId),
    index('idx_meetings_type').on(table.meetingType),
    index('idx_meetings_status').on(table.status),
    index('idx_meetings_schedule').on(table.scheduledStart, table.scheduledEnd),
    index('idx_meetings_context').on(table.contextType, table.contextId),
]);

/**
 * Meeting Participants - Who is invited/attending meetings
 */
export const meetingParticipants = sqliteTable('meeting_participants', {
    id: text('id').primaryKey().default(uuid()),
    meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),

    // Participant can be internal user or external
    personId: text('person_id').references(() => persons.id),
    externalEmail: text('external_email'),
    externalName: text('external_name'),
    externalPhone: text('external_phone'),

    // Role in the meeting
    role: text('role', {
        enum: ['organizer', 'required', 'optional', 'resource', 'observer']
    }).default('required'),

    // Response
    responseStatus: text('response_status', {
        enum: ['pending', 'accepted', 'declined', 'tentative']
    }).default('pending'),
    respondedAt: integer('responded_at'),

    // Attendance tracking
    attended: integer('attended', { mode: 'boolean' }),
    joinedAt: integer('joined_at'),
    leftAt: integer('left_at'),

    // Notifications
    notificationSent: integer('notification_sent', { mode: 'boolean' }).default(false),
    reminderSent: integer('reminder_sent', { mode: 'boolean' }).default(false),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_meeting_participants_meeting').on(table.meetingId),
    index('idx_meeting_participants_person').on(table.personId),
]);

/**
 * Meeting Templates - Reusable meeting configurations
 */
export const meetingTemplates = sqliteTable('meeting_templates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    description: text('description'),

    meetingType: text('meeting_type').notNull(),
    defaultDurationMinutes: integer('default_duration_minutes').default(60),
    defaultLocationType: text('default_location_type'),

    // Default agenda/description
    defaultAgenda: text('default_agenda'),
    defaultDescription: text('default_description'),

    // Reminder configuration
    defaultReminders: text('default_reminders').default('[]'), // JSON array

    // Who can use this template
    allowedRoles: text('allowed_roles').default('[]'), // JSON array of role IDs

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_meeting_templates_org').on(table.organizationId),
]);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ActionItemType = typeof actionItemTypes.$inferSelect;
export type ActionItemTypeInsert = typeof actionItemTypes.$inferInsert;
export type ActionItem = typeof actionItems.$inferSelect;
export type ActionItemInsert = typeof actionItems.$inferInsert;
export type ActionItemComment = typeof actionItemComments.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NoteInsert = typeof notes.$inferInsert;
export type ActivityFeedEntry = typeof activityFeed.$inferSelect;
export type UserCalendarSettings = typeof userCalendarSettings.$inferSelect;

// Organizational Hierarchy Types
export type OrganizationalRole = typeof organizationalRoles.$inferSelect;
export type OrganizationalRoleInsert = typeof organizationalRoles.$inferInsert;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type RoleRelationship = typeof roleRelationships.$inferSelect;

// Meeting Types
export type Meeting = typeof meetings.$inferSelect;
export type MeetingInsert = typeof meetings.$inferInsert;
export type MeetingParticipant = typeof meetingParticipants.$inferSelect;
export type MeetingTemplate = typeof meetingTemplates.$inferSelect;

// ============================================================================
// PROCEDURE MAPPING SYSTEM - Self-Documenting Process Maps
// ============================================================================

/**
 * Step Types - Categories of actions in a procedure
 * Each type has different behavior and visualization
 */
export const STEP_TYPES = [
    'decision',       // Branching point with multiple possible outcomes
    'action',         // Simple task/action to complete
    'communication',  // Send email, message, call, notification
    'event',          // External trigger or scheduled event
    'approval',       // Requires sign-off/authorization
    'wait',           // Time-based delay or external dependency
    'milestone',      // Key checkpoint/achievement point
    'integration',    // External system interaction (API, webhook)
    'document',       // Document generation, signing, upload
    'meeting',        // Scheduled meeting or call
    'data_entry',     // Form fill, data input
    'verification',   // Check/validate something
    'notification',   // Inform stakeholder (no response needed)
    'escalation',     // Escalate to higher authority
    'handoff',        // Transfer to another person/team
    'parallel_start', // Begin parallel execution paths
    'parallel_end',   // Merge parallel paths
    'loop_start',     // Begin loop/iteration
    'loop_end',       // End loop condition
    'subprocess',     // Trigger another procedure
] as const;

/**
 * Procedure Templates - Master process definitions
 * Can be created manually or learned from execution data
 */
export const procedureTemplates = sqliteTable('procedure_templates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Basic info
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),

    // Categorization
    category: text('category'), // "sales", "onboarding", "support", "hr", etc.
    subcategory: text('subcategory'),
    tags: text('tags').default('[]'), // JSON array

    // Lifecycle mapping - which entity type this procedure applies to
    entityType: text('entity_type'), // "lead", "enrollment", "employee", "support_ticket", etc.
    triggerCondition: text('trigger_condition'), // JSON: when to auto-start this procedure

    // Version control
    version: integer('version').default(1),
    parentVersionId: text('parent_version_id'), // Previous version if this is an update

    // Status
    status: text('status', {
        enum: ['draft', 'active', 'deprecated', 'archived']
    }).default('draft'),

    // Learning mode - can learn from data
    isLearnable: integer('is_learnable', { mode: 'boolean' }).default(true),
    learnedFromCount: integer('learned_from_count').default(0), // How many executions informed this

    // SLA settings
    targetDurationHours: integer('target_duration_hours'),
    warningThresholdPercent: integer('warning_threshold_percent').default(80),

    // Visual settings for flowchart
    flowchartConfig: text('flowchart_config').default('{}'), // Layout, colors, etc.

    // Wiki integration
    wikiPageId: text('wiki_page_id'), // Link to wiki article
    autoUpdateWiki: integer('auto_update_wiki', { mode: 'boolean' }).default(true),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    publishedAt: integer('published_at'),
}, (table) => [
    index('idx_procedures_org').on(table.organizationId),
    index('idx_procedures_entity').on(table.entityType),
    index('idx_procedures_status').on(table.status),
    uniqueIndex('idx_procedures_slug').on(table.organizationId, table.slug),
]);

/**
 * Procedure Steps - Nodes in the procedure flowchart
 * Each step represents an action/decision/event in the process
 */
export const procedureSteps = sqliteTable('procedure_steps', {
    id: text('id').primaryKey().default(uuid()),
    procedureId: text('procedure_id').notNull().references(() => procedureTemplates.id, { onDelete: 'cascade' }),

    // Step identification
    stepCode: text('step_code').notNull(), // Short code like "S1", "D2", etc.
    name: text('name').notNull(),
    description: text('description'),

    // Step type determines behavior and visualization
    stepType: text('step_type', {
        enum: STEP_TYPES
    }).notNull(),

    // Position in flowchart (for rendering)
    positionX: integer('position_x').default(0),
    positionY: integer('position_y').default(0),

    // Entry conditions - JSON rules for when this step can start
    // e.g., {"allOf": ["step_a_complete", "step_b_complete"]}
    entryConditions: text('entry_conditions').default('{}'),

    // Exit conditions - JSON rules for completing this step
    // e.g., {"anyOf": ["form_submitted", "timeout_reached"]}
    exitConditions: text('exit_conditions').default('{}'),

    // For decision steps - the decision options
    // e.g., [{"label": "Approved", "transitionTo": "step_5"}, {"label": "Rejected", ...}]
    decisionOptions: text('decision_options'),

    // Expected duration (for SLA and analytics)
    expectedDurationMinutes: integer('expected_duration_minutes'),

    // Assigned role - who should perform this step
    assignedRoleId: text('assigned_role_id').references(() => organizationalRoles.id),
    assignmentRule: text('assignment_rule'), // JSON: dynamic assignment logic

    // Linked action - automatically creates action item when step starts
    createsActionItem: integer('creates_action_item', { mode: 'boolean' }).default(false),
    actionItemTypeId: text('action_item_type_id').references(() => actionItemTypes.id),

    // Linked meeting - automatically schedules meeting
    createsMeeting: integer('creates_meeting', { mode: 'boolean' }).default(false),
    meetingTemplateId: text('meeting_template_id').references(() => meetingTemplates.id),

    // Linked communication - sends notification/email
    sendsNotification: integer('sends_notification', { mode: 'boolean' }).default(false),
    notificationTemplate: text('notification_template'), // JSON: notification config

    // Custom form for data collection
    formSchema: text('form_schema'), // JSON Schema for step-specific form

    // Analytics - learned from data
    medianDurationMinutes: integer('median_duration_minutes'),
    percentile90DurationMinutes: integer('percentile_90_duration_minutes'),
    completionRate: integer('completion_rate'), // Percentage (0-100)
    lastAnalyticsUpdate: integer('last_analytics_update'),

    // Visual settings
    icon: text('icon').default('IconCircle'),
    color: text('color').default('blue'),

    isOptional: integer('is_optional', { mode: 'boolean' }).default(false),
    isStartStep: integer('is_start_step', { mode: 'boolean' }).default(false),
    isEndStep: integer('is_end_step', { mode: 'boolean' }).default(false),

    displayOrder: integer('display_order').default(0),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_steps_procedure').on(table.procedureId),
    index('idx_steps_type').on(table.stepType),
    uniqueIndex('idx_steps_code').on(table.procedureId, table.stepCode),
]);

/**
 * Procedure Transitions - Edges connecting steps (directed graph)
 * Defines the flow between steps
 */
export const procedureTransitions = sqliteTable('procedure_transitions', {
    id: text('id').primaryKey().default(uuid()),
    procedureId: text('procedure_id').notNull().references(() => procedureTemplates.id, { onDelete: 'cascade' }),

    fromStepId: text('from_step_id').notNull().references(() => procedureSteps.id, { onDelete: 'cascade' }),
    toStepId: text('to_step_id').notNull().references(() => procedureSteps.id, { onDelete: 'cascade' }),

    // Transition label (for decision branches)
    label: text('label'), // e.g., "Yes", "No", "Approved", "Rejected"

    // Condition for this transition to be taken
    // e.g., {"field": "approval_status", "equals": "approved"}
    condition: text('condition'),

    // Priority when multiple transitions are possible (lower = higher priority)
    priority: integer('priority').default(0),

    // Analytics - how often this path is taken
    transitionCount: integer('transition_count').default(0),
    transitionPercentage: integer('transition_percentage'), // 0-100
    avgTimeToTransitionMinutes: integer('avg_time_to_transition_minutes'),

    // Visual settings
    lineStyle: text('line_style', {
        enum: ['solid', 'dashed', 'dotted']
    }).default('solid'),
    color: text('color'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_transitions_procedure').on(table.procedureId),
    index('idx_transitions_from').on(table.fromStepId),
    index('idx_transitions_to').on(table.toStepId),
]);

/**
 * Procedure Executions - Actual instances of procedures running
 * Links to a specific entity (lead, enrollment, etc.)
 */
export const procedureExecutions = sqliteTable('procedure_executions', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    procedureId: text('procedure_id').notNull().references(() => procedureTemplates.id),

    // The entity this procedure is running for
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),

    // Status
    status: text('status', {
        enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'on_hold']
    }).default('pending'),

    // Current step(s) - supports parallel execution
    currentStepIds: text('current_step_ids').default('[]'), // JSON array

    // Completion tracking
    completedStepCount: integer('completed_step_count').default(0),
    totalStepCount: integer('total_step_count').default(0),
    progressPercent: integer('progress_percent').default(0),

    // Timing
    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),
    durationMinutes: integer('duration_minutes'),

    // SLA tracking
    targetCompletionAt: integer('target_completion_at'),
    isOverdue: integer('is_overdue', { mode: 'boolean' }).default(false),

    // Assignment
    assignedUserId: text('assigned_user_id').references(() => persons.id),

    // Outcome
    outcome: text('outcome'), // Free text summary
    outcomeType: text('outcome_type', {
        enum: ['success', 'failure', 'partial', 'cancelled']
    }),

    // Collected data across all steps
    collectedData: text('collected_data').default('{}'), // JSON

    // For learning - should this inform the procedure template?
    contributeToLearning: integer('contribute_to_learning', { mode: 'boolean' }).default(true),

    triggeredBy: text('triggered_by'), // "manual", "automation", "event:xxx"
    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_executions_org').on(table.organizationId),
    index('idx_executions_procedure').on(table.procedureId),
    index('idx_executions_entity').on(table.entityType, table.entityId),
    index('idx_executions_status').on(table.status),
    index('idx_executions_assigned').on(table.assignedUserId),
]);

/**
 * Step Executions - Individual step completions with precise timing
 * This is the core data for learning and analytics
 */
export const stepExecutions = sqliteTable('step_executions', {
    id: text('id').primaryKey().default(uuid()),
    executionId: text('execution_id').notNull().references(() => procedureExecutions.id, { onDelete: 'cascade' }),
    stepId: text('step_id').notNull().references(() => procedureSteps.id),

    // Status
    status: text('status', {
        enum: ['pending', 'in_progress', 'completed', 'skipped', 'failed', 'blocked']
    }).default('pending'),

    // Timing - precise timestamps for analytics
    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),
    durationMinutes: integer('duration_minutes'),

    // Wait time (time between eligible to start and actually starting)
    waitTimeMinutes: integer('wait_time_minutes').default(0),

    // Who performed this step
    performedBy: text('performed_by').references(() => persons.id),

    // For decision steps - which option was chosen
    decisionOutcome: text('decision_outcome'),

    // Transition taken from this step
    transitionTakenId: text('transition_taken_id').references(() => procedureTransitions.id),

    // Step-specific data collected
    stepData: text('step_data').default('{}'), // JSON

    // Notes/comments
    notes: text('notes'),

    // Retry tracking
    attemptNumber: integer('attempt_number').default(1),
    failureReason: text('failure_reason'),

    // Linked items created by this step
    createdActionItemId: text('created_action_item_id'),
    createdMeetingId: text('created_meeting_id'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_step_exec_execution').on(table.executionId),
    index('idx_step_exec_step').on(table.stepId),
    index('idx_step_exec_status').on(table.status),
    index('idx_step_exec_performer').on(table.performedBy),
    index('idx_step_exec_timing').on(table.startedAt, table.completedAt),
]);

/**
 * Procedure Analytics - Aggregated statistics per procedure
 * Updated periodically from step execution data
 */
export const procedureAnalytics = sqliteTable('procedure_analytics', {
    id: text('id').primaryKey().default(uuid()),
    procedureId: text('procedure_id').notNull().references(() => procedureTemplates.id, { onDelete: 'cascade' }),

    // Time period
    periodType: text('period_type', {
        enum: ['daily', 'weekly', 'monthly', 'all_time']
    }).notNull(),
    periodStart: integer('period_start'),
    periodEnd: integer('period_end'),

    // Volume metrics
    executionCount: integer('execution_count').default(0),
    completedCount: integer('completed_count').default(0),
    failedCount: integer('failed_count').default(0),
    cancelledCount: integer('cancelled_count').default(0),

    // Completion metrics
    completionRate: integer('completion_rate'), // 0-100
    avgCompletionTimeMinutes: integer('avg_completion_time_minutes'),
    medianCompletionTimeMinutes: integer('median_completion_time_minutes'),
    p90CompletionTimeMinutes: integer('p90_completion_time_minutes'),

    // SLA metrics
    onTimeCompletionRate: integer('on_time_completion_rate'), // 0-100
    overdueCount: integer('overdue_count').default(0),

    // Step-level aggregates - JSON
    stepMetrics: text('step_metrics').default('{}'),
    transitionMetrics: text('transition_metrics').default('{}'),
    bottleneckSteps: text('bottleneck_steps').default('[]'), // Steps with longest duration

    // Path analysis - most common paths through the procedure
    commonPaths: text('common_paths').default('[]'), // JSON array

    calculatedAt: integer('calculated_at').default(timestamp()),
}, (table) => [
    index('idx_analytics_procedure').on(table.procedureId),
    index('idx_analytics_period').on(table.periodType, table.periodStart),
]);

/**
 * Stakeholder Lifecycle Mapping - Links entity types to their procedures
 * Defines the "journey" for each stakeholder type
 */
export const stakeholderLifecycles = sqliteTable('stakeholder_lifecycles', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // The stakeholder type
    entityType: text('entity_type').notNull(), // "lead", "student", "employee", "teacher", "parent"
    name: text('name').notNull(),
    description: text('description'),

    // Lifecycle stages - JSON array of stage definitions
    // e.g., [{"stage": "prospect", "name": "Prospect", "procedures": ["initial_contact", "qualification"]}]
    stages: text('stages').default('[]'),

    // Associated procedures for the full lifecycle
    procedureIds: text('procedure_ids').default('[]'), // JSON array

    // Expected total lifecycle duration
    expectedDurationDays: integer('expected_duration_days'),

    // Analytics
    avgLifecycleDays: integer('avg_lifecycle_days'),
    medianLifecycleDays: integer('median_lifecycle_days'),
    completionRate: integer('completion_rate'),

    // Visual settings for lifecycle diagram
    diagramConfig: text('diagram_config').default('{}'),

    // Wiki integration
    wikiPageId: text('wiki_page_id'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_lifecycle_org').on(table.organizationId),
    index('idx_lifecycle_entity').on(table.entityType),
]);

/**
 * Wiki Pages - Auto-generated documentation from procedures
 * Self-updating based on procedure changes and analytics
 */
export const wikiPages = sqliteTable('wiki_pages', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Page info
    title: text('title').notNull(),
    slug: text('slug').notNull(),

    // Content
    content: text('content'), // Markdown content
    contentHtml: text('content_html'), // Rendered HTML

    // Structure
    parentPageId: text('parent_page_id'),
    displayOrder: integer('display_order').default(0),
    depth: integer('depth').default(0),

    // Categorization
    category: text('category'),
    tags: text('tags').default('[]'),

    // Source tracking - if auto-generated
    sourceType: text('source_type', {
        enum: ['manual', 'procedure', 'lifecycle', 'auto_generated']
    }).default('manual'),
    sourceProcedureId: text('source_procedure_id').references(() => procedureTemplates.id),
    sourceLifecycleId: text('source_lifecycle_id').references(() => stakeholderLifecycles.id),

    // Auto-update settings
    autoUpdate: integer('auto_update', { mode: 'boolean' }).default(false),
    lastAutoUpdateAt: integer('last_auto_update_at'),

    // Embedded flowchart (Mermaid code)
    flowchartCode: text('flowchart_code'),

    // Analytics data embedded in page
    includesAnalytics: integer('includes_analytics', { mode: 'boolean' }).default(false),

    // Publishing
    status: text('status', {
        enum: ['draft', 'published', 'archived']
    }).default('draft'),
    publishedAt: integer('published_at'),

    // Versioning
    version: integer('version').default(1),

    createdBy: text('created_by').references(() => persons.id),
    lastEditedBy: text('last_edited_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_wiki_org').on(table.organizationId),
    index('idx_wiki_parent').on(table.parentPageId),
    index('idx_wiki_category').on(table.category),
    index('idx_wiki_source').on(table.sourceType, table.sourceProcedureId),
    uniqueIndex('idx_wiki_slug').on(table.organizationId, table.slug),
]);

/**
 * Process Discovery Events - Raw events for learning procedures
 * Captures any action that could be part of a procedure
 */
export const processDiscoveryEvents = sqliteTable('process_discovery_events', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Entity context
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),

    // Event details
    eventType: text('event_type').notNull(), // "stage_change", "action_completed", "email_sent", etc.
    eventName: text('event_name').notNull(),
    eventData: text('event_data').default('{}'), // JSON

    // Actor
    actorId: text('actor_id').references(() => persons.id),
    actorRole: text('actor_role'),

    // Timing
    occurredAt: integer('occurred_at').default(timestamp()),

    // Processing status
    isProcessed: integer('is_processed', { mode: 'boolean' }).default(false),
    matchedProcedureId: text('matched_procedure_id'),
    matchedStepId: text('matched_step_id'),

    // For sequence mining
    previousEventId: text('previous_event_id'),
    sessionId: text('session_id'), // Groups related events
}, (table) => [
    index('idx_discovery_org').on(table.organizationId),
    index('idx_discovery_entity').on(table.entityType, table.entityId),
    index('idx_discovery_time').on(table.occurredAt),
    index('idx_discovery_session').on(table.sessionId),
    index('idx_discovery_processed').on(table.isProcessed),
]);

// ============================================================================
// COMMUNICATOR SYSTEM
// ============================================================================

/**
 * Conversations - The container for all chat types
 * Uses Node structure for process map integration
 */
export const conversations = sqliteTable('conversations', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Conversation type determines behavior
    type: text('type', {
        enum: [
            'direct',           // 1-1 private chat
            'ai_assistant',     // 1-AI conversation
            'broadcast',        // 1-n announcements (read-only for recipients)
            'group',            // n-n collaborative chat
            'meeting',          // Meeting-linked discussion
            'problem_resolution', // Multi-person problem solving with solution logging
            'support',          // Support ticket thread
        ]
    }).notNull(),

    // For named conversations
    name: text('name'),
    description: text('description'),
    avatarUrl: text('avatar_url'),

    // For broadcast conversations - defines scope
    broadcastScope: text('broadcast_scope', {
        enum: ['all', 'team', 'role', 'custom']
    }),
    broadcastRoleFilter: text('broadcast_role_filter'), // JSON array of roles
    broadcastTeamId: text('broadcast_team_id'),

    // For meeting conversations
    meetingId: text('meeting_id').references(() => meetings.id),

    // For problem resolution
    problemTitle: text('problem_title'),
    problemStatus: text('problem_status', {
        enum: ['open', 'investigating', 'resolved', 'closed']
    }),
    problemResolution: text('problem_resolution'), // The logged solution
    resolvedAt: integer('resolved_at'),
    resolvedBy: text('resolved_by').references(() => persons.id),

    // Task linking - when linked task is completed, conversation becomes read-only
    linkedTaskId: text('linked_task_id'), // References tasks table
    linkedTaskTitle: text('linked_task_title'), // Cached title for display

    // Node/Graph integration for process maps
    nodeId: text('node_id'), // Links to process map node
    graphPath: text('graph_path'), // Hierarchical path in graph

    // AI assistant config
    aiProvider: text('ai_provider'), // 'anthropic', 'google', 'openai'
    aiModel: text('ai_model'),
    aiSystemPrompt: text('ai_system_prompt'),
    aiContext: text('ai_context').default('[]'), // JSON array of context references

    // State
    isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
    isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
    lastMessageAt: integer('last_message_at'),
    messageCount: integer('message_count').default(0),

    // Metadata
    metadata: text('metadata').default('{}'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_conv_org').on(table.organizationId),
    index('idx_conv_type').on(table.type),
    index('idx_conv_meeting').on(table.meetingId),
    index('idx_conv_node').on(table.nodeId),
    index('idx_conv_last_msg').on(table.lastMessageAt),
]);

/**
 * Conversation Participants
 */
export const conversationParticipants = sqliteTable('conversation_participants', {
    id: text('id').primaryKey().default(uuid()),
    conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    // Role in conversation
    role: text('role', {
        enum: ['owner', 'admin', 'member', 'viewer', 'ai']
    }).default('member'),

    // For broadcasts
    canReply: integer('can_reply', { mode: 'boolean' }).default(true),

    // Read state
    lastReadAt: integer('last_read_at'),
    lastReadMessageId: text('last_read_message_id'),
    unreadCount: integer('unread_count').default(0),

    // Notifications
    isMuted: integer('is_muted', { mode: 'boolean' }).default(false),
    mutedUntil: integer('muted_until'),

    // State
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    leftAt: integer('left_at'),

    joinedAt: integer('joined_at').default(timestamp()),
    invitedBy: text('invited_by').references(() => persons.id),
}, (table) => [
    uniqueIndex('idx_conv_participant_unique').on(table.conversationId, table.personId),
    index('idx_conv_participant_person').on(table.personId),
]);

/**
 * Messages - The actual chat messages
 * Designed for Node/Graph integration
 */
export const messages = sqliteTable('messages', {
    id: text('id').primaryKey().default(uuid()),
    conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),

    // Sender - null for system messages
    senderId: text('sender_id').references(() => persons.id),
    senderType: text('sender_type', {
        enum: ['user', 'ai', 'system', 'bot']
    }).default('user'),

    // Content
    content: text('content').notNull(),
    contentType: text('content_type', {
        enum: ['text', 'markdown', 'html', 'voice_transcript', 'code', 'file', 'image', 'location', 'contact', 'system']
    }).default('text'),

    // For AI messages
    aiTokensUsed: integer('ai_tokens_used'),
    aiModelUsed: text('ai_model_used'),
    aiResponseTimeMs: integer('ai_response_time_ms'),

    // Threading
    replyToMessageId: text('reply_to_message_id'),
    threadRootId: text('thread_root_id'),
    threadReplyCount: integer('thread_reply_count').default(0),

    // Rich content
    hasAttachments: integer('has_attachments', { mode: 'boolean' }).default(false),
    mentions: text('mentions').default('[]'), // JSON array of user IDs
    reactions: text('reactions').default('{}'), // JSON { emoji: [userId] }

    // Node/Graph integration
    linkedNodeId: text('linked_node_id'), // Links to any node in system
    linkedEntityType: text('linked_entity_type'), // 'task', 'lead', 'procedure', etc.
    linkedEntityId: text('linked_entity_id'),

    // State
    isEdited: integer('is_edited', { mode: 'boolean' }).default(false),
    editedAt: integer('edited_at'),
    isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
    deletedAt: integer('deleted_at'),

    // For problem resolution
    isSolution: integer('is_solution', { mode: 'boolean' }).default(false),
    solutionApprovedBy: text('solution_approved_by').references(() => persons.id),

    // Metadata
    metadata: text('metadata').default('{}'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_msg_conv').on(table.conversationId),
    index('idx_msg_sender').on(table.senderId),
    index('idx_msg_thread').on(table.threadRootId),
    index('idx_msg_created').on(table.createdAt),
    index('idx_msg_linked').on(table.linkedEntityType, table.linkedEntityId),
]);

/**
 * Message Attachments
 */
export const messageAttachments = sqliteTable('message_attachments', {
    id: text('id').primaryKey().default(uuid()),
    messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),

    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(), // MIME type
    fileSize: integer('file_size').notNull(), // bytes
    fileUrl: text('file_url').notNull(),

    // For images/video
    thumbnailUrl: text('thumbnail_url'),
    width: integer('width'),
    height: integer('height'),
    durationSeconds: integer('duration_seconds'),

    // For voice messages
    transcription: text('transcription'),
    transcriptionStatus: text('transcription_status', {
        enum: ['pending', 'processing', 'completed', 'failed']
    }),

    uploadedBy: text('uploaded_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_attach_msg').on(table.messageId),
]);

/**
 * Meeting Notes - Private notes during meetings
 */
export const meetingNotes = sqliteTable('meeting_notes', {
    id: text('id').primaryKey().default(uuid()),
    meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    // Content
    content: text('content').default(''),
    contentFormat: text('content_format', {
        enum: ['text', 'markdown', 'rich_text']
    }).default('markdown'),

    // Private by default
    isPrivate: integer('is_private', { mode: 'boolean' }).default(true),

    // Can be converted to task/action items
    extractedTasks: text('extracted_tasks').default('[]'), // JSON array

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_meeting_notes_unique').on(table.meetingId, table.personId),
    index('idx_meeting_notes_meeting').on(table.meetingId),
]);

/**
 * Meeting Transcripts - Speech-to-text logs
 */
export const meetingTranscripts = sqliteTable('meeting_transcripts', {
    id: text('id').primaryKey().default(uuid()),
    meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),

    // Who recorded this
    recordedBy: text('recorded_by').notNull().references(() => persons.id),

    // Device info
    deviceType: text('device_type', {
        enum: ['android', 'ios', 'web', 'desktop']
    }),

    // Transcript chunks - allows real-time streaming
    chunkIndex: integer('chunk_index').default(0),

    // Content
    rawTranscript: text('raw_transcript').notNull(),
    speakerLabels: text('speaker_labels').default('{}'), // JSON mapping of speaker detection

    // Timing
    startTimestamp: integer('start_timestamp'),
    endTimestamp: integer('end_timestamp'),
    durationSeconds: integer('duration_seconds'),

    // Processing
    isProcessed: integer('is_processed', { mode: 'boolean' }).default(false),
    languageDetected: text('language_detected'),
    confidenceScore: real('confidence_score'),

    // Audio file (optional - for re-processing)
    audioFileUrl: text('audio_file_url'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_transcript_meeting').on(table.meetingId),
    index('idx_transcript_chunk').on(table.meetingId, table.chunkIndex),
]);

/**
 * AI Summaries - Generated summaries for meetings/conversations
 */
export const aiSummaries = sqliteTable('ai_summaries', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What was summarized
    sourceType: text('source_type', {
        enum: ['meeting', 'conversation', 'transcript', 'problem_resolution', 'thread']
    }).notNull(),
    sourceId: text('source_id').notNull(),

    // Summary content
    summary: text('summary').notNull(),
    keyPoints: text('key_points').default('[]'), // JSON array
    actionItems: text('action_items').default('[]'), // JSON array
    decisions: text('decisions').default('[]'), // JSON array
    participants: text('participants').default('[]'), // JSON array of who was mentioned/participated

    // Sentiment analysis
    overallSentiment: text('overall_sentiment', {
        enum: ['positive', 'neutral', 'negative', 'mixed']
    }),
    sentimentScore: real('sentiment_score'), // -1 to 1

    // Topics extracted
    topics: text('topics').default('[]'), // JSON array

    // AI metadata
    aiProvider: text('ai_provider').notNull(),
    aiModel: text('ai_model').notNull(),
    promptTemplate: text('prompt_template'),
    tokensUsed: integer('tokens_used'),
    processingTimeMs: integer('processing_time_ms'),

    // Quality
    userRating: integer('user_rating'), // 1-5
    userFeedback: text('user_feedback'),

    // Node/Graph integration
    linkedNodeId: text('linked_node_id'),

    generatedBy: text('generated_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_summary_org').on(table.organizationId),
    index('idx_summary_source').on(table.sourceType, table.sourceId),
    index('idx_summary_node').on(table.linkedNodeId),
]);

/**
 * Read Receipts - Who read what messages
 */
export const messageReadReceipts = sqliteTable('message_read_receipts', {
    id: text('id').primaryKey().default(uuid()),
    messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),
    readAt: integer('read_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_read_receipt_unique').on(table.messageId, table.personId),
    index('idx_read_receipt_msg').on(table.messageId),
]);

/**
 * Communication Templates - Reusable message templates
 */
export const communicationTemplates = sqliteTable('communication_templates', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    category: text('category'), // 'greeting', 'follow_up', 'announcement', etc.

    // Content with placeholders
    subject: text('subject'), // For broadcasts
    content: text('content').notNull(),
    contentType: text('content_type', {
        enum: ['text', 'markdown', 'html']
    }).default('text'),

    // Placeholders available
    placeholders: text('placeholders').default('[]'), // JSON: [{key, description, defaultValue}]

    // Usage tracking
    usageCount: integer('usage_count').default(0),
    lastUsedAt: integer('last_used_at'),

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_template_org').on(table.organizationId),
    index('idx_template_category').on(table.category),
]);

/**
 * Typing Indicators - Real-time typing status
 */
export const typingIndicators = sqliteTable('typing_indicators', {
    id: text('id').primaryKey().default(uuid()),
    conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),
    startedAt: integer('started_at').default(timestamp()),
    expiresAt: integer('expires_at'),
}, (table) => [
    uniqueIndex('idx_typing_unique').on(table.conversationId, table.personId),
]);

/**
 * Notification Queue - Pending notifications
 */
export const notificationQueue = sqliteTable('notification_queue', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    recipientId: text('recipient_id').notNull().references(() => persons.id),

    // Notification type
    type: text('type', {
        enum: ['message', 'mention', 'broadcast', 'meeting_invite', 'meeting_reminder', 'problem_assigned', 'solution_found']
    }).notNull(),

    // Content
    title: text('title').notNull(),
    body: text('body'),

    // Source
    conversationId: text('conversation_id').references(() => conversations.id),
    messageId: text('message_id').references(() => messages.id),
    meetingId: text('meeting_id').references(() => meetings.id),

    // Delivery
    channels: text('channels').default('["in_app"]'), // JSON: ['in_app', 'push', 'email', 'sms']
    priority: text('priority', {
        enum: ['low', 'normal', 'high', 'urgent']
    }).default('normal'),

    // State
    status: text('status', {
        enum: ['pending', 'sent', 'delivered', 'read', 'failed']
    }).default('pending'),
    sentAt: integer('sent_at'),
    deliveredAt: integer('delivered_at'),
    readAt: integer('read_at'),
    failureReason: text('failure_reason'),

    createdAt: integer('created_at').default(timestamp()),
    expiresAt: integer('expires_at'),
}, (table) => [
    index('idx_notif_recipient').on(table.recipientId),
    index('idx_notif_status').on(table.status),
    index('idx_notif_created').on(table.createdAt),
]);

// ============================================================================
// TYPE EXPORTS - Procedure Mapping
// ============================================================================

export type ProcedureTemplate = typeof procedureTemplates.$inferSelect;
export type ProcedureTemplateInsert = typeof procedureTemplates.$inferInsert;
export type ProcedureStep = typeof procedureSteps.$inferSelect;
export type ProcedureStepInsert = typeof procedureSteps.$inferInsert;
export type ProcedureTransition = typeof procedureTransitions.$inferSelect;
export type ProcedureExecution = typeof procedureExecutions.$inferSelect;
export type ProcedureExecutionInsert = typeof procedureExecutions.$inferInsert;
export type StepExecution = typeof stepExecutions.$inferSelect;
export type ProcedureAnalytics = typeof procedureAnalytics.$inferSelect;
export type StakeholderLifecycle = typeof stakeholderLifecycles.$inferSelect;
export type WikiPage = typeof wikiPages.$inferSelect;
export type WikiPageInsert = typeof wikiPages.$inferInsert;
export type ProcessDiscoveryEvent = typeof processDiscoveryEvents.$inferSelect;

// ============================================================================
// TYPE EXPORTS - Communicator
// ============================================================================

export type Conversation = typeof conversations.$inferSelect;
export type ConversationInsert = typeof conversations.$inferInsert;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type MeetingNote = typeof meetingNotes.$inferSelect;
export type MeetingTranscript = typeof meetingTranscripts.$inferSelect;
export type AISummary = typeof aiSummaries.$inferSelect;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
export type NotificationQueueItem = typeof notificationQueue.$inferSelect;

// ============================================================================
// KNOWLEDGE WIKI SYSTEM
// ============================================================================

/**
 * Wiki Categories - Organize knowledge articles
 */
export const wikiCategories = sqliteTable('wiki_categories', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    icon: text('icon').default('IconBook'),
    color: text('color').default('blue'),

    // Hierarchy
    parentId: text('parent_id'), // Self-reference for nested categories
    sortOrder: integer('sort_order').default(0),

    // Access control
    visibility: text('visibility', {
        enum: ['public', 'internal', 'restricted']
    }).default('internal'),
    allowedRoles: text('allowed_roles').default('[]'), // JSON array of role IDs

    createdBy: text('created_by').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_wiki_cat_org').on(table.organizationId),
    uniqueIndex('idx_wiki_cat_slug').on(table.organizationId, table.slug),
]);

/**
 * Wiki Articles - Internal knowledge base
 */
export const wikiArticles = sqliteTable('wiki_articles', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    categoryId: text('category_id').references(() => wikiCategories.id),

    // Content
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    summary: text('summary'), // Short description for previews
    content: text('content').notNull(), // Markdown content

    // Rich formatting
    contentFormat: text('content_format', {
        enum: ['markdown', 'rich_text', 'html']
    }).default('markdown'),

    // Status
    status: text('status', {
        enum: ['draft', 'review', 'published', 'archived']
    }).default('draft'),

    // SEO and discovery
    tags: text('tags').default('[]'), // JSON array
    keywords: text('keywords').default('[]'), // For search

    // Version control
    version: integer('version').default(1),

    // Metrics
    viewCount: integer('view_count').default(0),
    helpfulCount: integer('helpful_count').default(0),
    notHelpfulCount: integer('not_helpful_count').default(0),

    // Linking
    relatedArticleIds: text('related_article_ids').default('[]'), // JSON array
    linkedProcedureId: text('linked_procedure_id').references(() => procedureTemplates.id),

    // Access control (overrides category)
    visibility: text('visibility', {
        enum: ['inherit', 'public', 'internal', 'restricted']
    }).default('inherit'),
    allowedRoles: text('allowed_roles'), // JSON array, null = inherit from category

    // Ownership
    authorId: text('author_id').references(() => persons.id),
    lastEditorId: text('last_editor_id').references(() => persons.id),
    reviewerId: text('reviewer_id').references(() => persons.id),

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    publishedAt: integer('published_at'),
    reviewedAt: integer('reviewed_at'),

    // Vector embedding for semantic search
    embedding: text('embedding'), // JSON array
}, (table) => [
    index('idx_wiki_article_org').on(table.organizationId),
    index('idx_wiki_article_category').on(table.categoryId),
    index('idx_wiki_article_status').on(table.status),
    uniqueIndex('idx_wiki_article_slug').on(table.organizationId, table.slug),
]);

/**
 * Wiki Article Versions - Track changes over time
 */
export const wikiArticleVersions = sqliteTable('wiki_article_versions', {
    id: text('id').primaryKey().default(uuid()),
    articleId: text('article_id').notNull().references(() => wikiArticles.id, { onDelete: 'cascade' }),

    version: integer('version').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    summary: text('summary'),

    changeNotes: text('change_notes'), // What changed

    editorId: text('editor_id').references(() => persons.id),
    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_wiki_version_article').on(table.articleId),
    uniqueIndex('idx_wiki_version_unique').on(table.articleId, table.version),
]);

/**
 * Wiki Article Feedback - User reactions and comments
 */
export const wikiArticleFeedback = sqliteTable('wiki_article_feedback', {
    id: text('id').primaryKey().default(uuid()),
    articleId: text('article_id').notNull().references(() => wikiArticles.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    // Reaction
    isHelpful: integer('is_helpful', { mode: 'boolean' }),

    // Optional comment
    comment: text('comment'),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_wiki_feedback_article').on(table.articleId),
    uniqueIndex('idx_wiki_feedback_person').on(table.articleId, table.personId),
]);

// ============================================================================
// AI-POWERED KNOWLEDGE GENERATION PIPELINE
// Procedures → Stubs → Evidence → Gemini Analysis → Human Editing → Claude Polish
// ============================================================================

/**
 * Article Stubs - Auto-created when procedures are defined
 * These are skeleton articles waiting to be filled with real knowledge
 */
export const wikiArticleStubs = sqliteTable('wiki_article_stubs', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Source procedure
    procedureId: text('procedure_id').notNull().references(() => procedureTemplates.id),
    stepId: text('step_id').references(() => procedureSteps.id), // Specific step if applicable

    // Stub info
    title: text('title').notNull(),
    suggestedSlug: text('suggested_slug').notNull(),
    categoryId: text('category_id').references(() => wikiCategories.id),

    // Initial skeleton content
    stubContent: text('stub_content').notNull(), // Markdown template

    // Readiness for AI generation
    status: text('status', {
        enum: [
            'pending',           // Just created, waiting for evidence
            'collecting',        // Actively collecting evidence
            'ready_for_ai',      // Enough evidence, ready for batch
            'generating',        // AI is generating
            'generated',         // AI finished, needs review
            'promoted',          // Promoted to full article
            'archived'           // No longer needed
        ]
    }).default('pending'),

    // Evidence thresholds
    minExecutionsNeeded: integer('min_executions_needed').default(5),
    currentExecutionCount: integer('current_execution_count').default(0),
    evidenceScore: integer('evidence_score').default(0), // 0-100, calculated quality

    // Linked article (if promoted)
    articleId: text('article_id').references(() => wikiArticles.id),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    lastEvidenceAt: integer('last_evidence_at'),
}, (table) => [
    index('idx_stub_org').on(table.organizationId),
    index('idx_stub_procedure').on(table.procedureId),
    index('idx_stub_status').on(table.status),
]);

/**
 * Evidence for AI Learning - Notes, decisions, outcomes from procedure executions
 */
export const wikiEvidencePoints = sqliteTable('wiki_evidence_points', {
    id: text('id').primaryKey().default(uuid()),
    stubId: text('stub_id').notNull().references(() => wikiArticleStubs.id, { onDelete: 'cascade' }),

    // Source
    executionId: text('execution_id').references(() => procedureExecutions.id),
    executionLogId: text('execution_log_id').references(() => stepExecutions.id),

    // Evidence content
    evidenceType: text('evidence_type', {
        enum: [
            'execution_note',     // Note left during execution
            'decision_reason',    // Why a decision was made
            'outcome',            // What happened
            'exception',          // Something unexpected
            'correction',         // They had to fix something
            'tip',                // User shared a tip
            'warning',            // User noted a potential problem
            'time_observation',   // How long something took
            'resource_used',      // What they needed
            'feedback'            // Post-execution feedback
        ]
    }).notNull(),

    content: text('content').notNull(),

    // Context
    stepCode: text('step_code'),         // Which step this relates to
    contextData: text('context_data'),   // JSON: any structured data

    // Quality signals
    isHighQuality: integer('is_high_quality', { mode: 'boolean' }).default(false),
    isUsedInGeneration: integer('is_used_in_generation', { mode: 'boolean' }).default(false),

    // Source user
    personId: text('person_id').references(() => persons.id),

    collectedAt: integer('collected_at').default(timestamp()),
}, (table) => [
    index('idx_evidence_stub').on(table.stubId),
    index('idx_evidence_type').on(table.evidenceType),
    index('idx_evidence_execution').on(table.executionId),
]);

/**
 * AI Generation Batches - Weekly batch jobs for Gemini 2.5
 */
export const knowledgeGenBatches = sqliteTable('knowledge_gen_batches', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Batch info
    batchNumber: integer('batch_number').notNull(),
    weekOf: integer('week_of').notNull(), // Start of week timestamp

    // Status
    status: text('status', {
        enum: ['scheduled', 'collecting', 'processing', 'completed', 'failed', 'partial']
    }).default('scheduled'),

    // AI Configuration
    aiModel: text('ai_model').default('gemini-2.5-pro'),
    aiModelVersion: text('ai_model_version'),
    promptTemplateId: text('prompt_template_id'),

    // Stats
    stubsProcessed: integer('stubs_processed').default(0),
    articlesGenerated: integer('articles_generated').default(0),
    evidencePointsUsed: integer('evidence_points_used').default(0),

    // Costs
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    estimatedCostCents: integer('estimated_cost_cents'),

    // Timing
    scheduledAt: integer('scheduled_at'),
    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),

    // Error tracking
    errorMessage: text('error_message'),
    errorCount: integer('error_count').default(0),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_gen_batch_org').on(table.organizationId),
    index('idx_gen_batch_week').on(table.weekOf),
    index('idx_gen_batch_status').on(table.status),
]);

/**
 * AI Generation Runs - Individual article generation within a batch
 */
export const knowledgeGenRuns = sqliteTable('knowledge_gen_runs', {
    id: text('id').primaryKey().default(uuid()),
    batchId: text('batch_id').notNull().references(() => knowledgeGenBatches.id, { onDelete: 'cascade' }),
    stubId: text('stub_id').notNull().references(() => wikiArticleStubs.id),

    // Status
    status: text('status', {
        enum: ['pending', 'generating', 'success', 'failed', 'skipped']
    }).default('pending'),

    // Input
    evidencePointIds: text('evidence_point_ids').default('[]'), // JSON array
    inputContext: text('input_context'), // JSON: assembled context for AI

    // Output
    generatedTitle: text('generated_title'),
    generatedContent: text('generated_content'), // Markdown
    generatedSummary: text('generated_summary'),
    suggestedTags: text('suggested_tags').default('[]'),

    // AI metadata
    promptUsed: text('prompt_used'),
    aiResponse: text('ai_response'), // Full response JSON
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),

    // Quality assessment (by AI)
    confidenceScore: integer('confidence_score'), // 0-100
    suggestedImprovements: text('suggested_improvements'),

    // Timing
    startedAt: integer('started_at'),
    completedAt: integer('completed_at'),
    durationMs: integer('duration_ms'),

    errorMessage: text('error_message'),
}, (table) => [
    index('idx_gen_run_batch').on(table.batchId),
    index('idx_gen_run_stub').on(table.stubId),
    index('idx_gen_run_status').on(table.status),
]);

/**
 * Human Edit Sessions - When humans refine AI-generated content
 * Highlighting & corrections get sent to Claude Opus for polishing
 */
export const wikiEditSessions = sqliteTable('wiki_edit_sessions', {
    id: text('id').primaryKey().default(uuid()),
    articleId: text('article_id').notNull().references(() => wikiArticles.id),

    // Editor
    editorId: text('editor_id').notNull().references(() => persons.id),

    // Session state
    status: text('status', {
        enum: [
            'editing',           // Human is editing
            'submitted_for_ai',  // Sent to Claude
            'ai_processing',     // Claude is working
            'ai_completed',      // Claude finished
            'reviewing',         // Human reviewing AI output
            'accepted',          // Human accepted changes
            'rejected',          // Human rejected AI changes
            'abandoned'          // Session abandoned
        ]
    }).default('editing'),

    // What the human did
    originalContent: text('original_content').notNull(),
    humanEdits: text('human_edits').notNull(),   // Final edited version

    // Structured corrections (for AI context)
    highlightedSections: text('highlighted_sections').default('[]'), // JSON: [{start, end, comment}]
    correctionNotes: text('correction_notes'),    // General instructions to AI

    // AI polishing config
    polishModel: text('polish_model').default('claude-opus-4.5'),
    polishInstructions: text('polish_instructions'), // Custom prompt additions

    // AI output
    aiPolishedContent: text('ai_polished_content'),
    aiChangesSummary: text('ai_changes_summary'),
    aiConfidence: integer('ai_confidence'),

    // Final result
    finalContent: text('final_content'),          // What was actually published

    // Timing
    editStartedAt: integer('edit_started_at').default(timestamp()),
    editSubmittedAt: integer('edit_submitted_at'),
    aiCompletedAt: integer('ai_completed_at'),
    finalizedAt: integer('finalized_at'),

    // Token usage
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
}, (table) => [
    index('idx_edit_session_article').on(table.articleId),
    index('idx_edit_session_editor').on(table.editorId),
    index('idx_edit_session_status').on(table.status),
]);

/**
 * Knowledge Quality Metrics - Track article quality over time
 */
export const wikiQualityMetrics = sqliteTable('wiki_quality_metrics', {
    id: text('id').primaryKey().default(uuid()),
    articleId: text('article_id').notNull().references(() => wikiArticles.id, { onDelete: 'cascade' }),

    snapshotDate: integer('snapshot_date').notNull(),

    // Quality dimensions
    accuracyScore: integer('accuracy_score'),      // Based on procedure changes alignment
    completenessScore: integer('completeness_score'), // Covers all steps
    clarityScore: integer('clarity_score'),        // Readability
    freshnessScore: integer('freshness_score'),    // Last updated vs procedure changes
    usageScore: integer('usage_score'),            // View count, helpful votes

    // Overall
    overallScore: integer('overall_score'), // 0-100

    // Triggers
    needsReview: integer('needs_review', { mode: 'boolean' }).default(false),
    reviewReason: text('review_reason'),

    calculatedAt: integer('calculated_at').default(timestamp()),
}, (table) => [
    index('idx_quality_article').on(table.articleId),
    index('idx_quality_date').on(table.snapshotDate),
]);

// ============================================================================
// KAIZEN SYSTEM - Toyota-style Improvement Suggestions
// ============================================================================

/**
 * Improvement Suggestions - Anyone can propose process improvements
 * Based on Toyota's Kaizen philosophy: continuous improvement from the floor
 */
export const kaizenSuggestions = sqliteTable('kaizen_suggestions', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // The suggestion
    title: text('title').notNull(),
    description: text('description').notNull(), // Full description of the problem and proposed solution

    // Problem context
    problemType: text('problem_type', {
        enum: [
            'inefficiency',    // Process takes too long
            'error_prone',     // Frequent mistakes
            'unclear',         // Confusing or undocumented
            'bottleneck',      // Creates delays
            'waste',           // Unnecessary steps
            'safety',          // Safety concern
            'quality',         // Quality issue
            'cost',            // Expensive
            'communication',   // Info flow problem
            'other'
        ]
    }).notNull(),

    // Expected impact
    impactArea: text('impact_area', {
        enum: ['time', 'cost', 'quality', 'safety', 'morale', 'customer']
    }).default('time'),
    estimatedImpact: text('estimated_impact', {
        enum: ['low', 'medium', 'high', 'critical']
    }).default('medium'),

    // Related process (optional)
    procedureId: text('procedure_id').references(() => procedureTemplates.id),
    stepId: text('step_id').references(() => procedureSteps.id),
    wikiArticleId: text('wiki_article_id').references(() => wikiArticles.id),

    // Status workflow
    status: text('status', {
        enum: [
            'submitted',        // Just submitted
            'under_review',     // Being evaluated
            'needs_info',       // Reviewer needs more info
            'approved',         // Approved for implementation
            'in_progress',      // Being implemented
            'implemented',      // Done!
            'rejected',         // Not accepted
            'deferred',         // Good idea, later
        ]
    }).default('submitted'),

    // Review process
    reviewerId: text('reviewer_id').references(() => persons.id),
    reviewNotes: text('review_notes'),
    reviewedAt: integer('reviewed_at'),

    // Implementation tracking
    implementerId: text('implementer_id').references(() => persons.id),
    implementationNotes: text('implementation_notes'),
    implementedAt: integer('implemented_at'),

    // Voting - community endorsement
    upvotes: integer('upvotes').default(0),
    downvotes: integer('downvotes').default(0),

    // The submitter
    submitterId: text('submitter_id').notNull().references(() => persons.id),
    isAnonymous: integer('is_anonymous', { mode: 'boolean' }).default(false),

    // Tags for categorization
    tags: text('tags').default('[]'),

    // Attachments (screenshots, documents)
    attachments: text('attachments').default('[]'), // JSON array of {name, url, type}

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_kaizen_org').on(table.organizationId),
    index('idx_kaizen_status').on(table.status),
    index('idx_kaizen_submitter').on(table.submitterId),
    index('idx_kaizen_procedure').on(table.procedureId),
    index('idx_kaizen_votes').on(table.organizationId, table.upvotes),
]);

/**
 * Kaizen Votes - Track who voted on suggestions
 */
export const kaizenVotes = sqliteTable('kaizen_votes', {
    id: text('id').primaryKey().default(uuid()),
    suggestionId: text('suggestion_id').notNull().references(() => kaizenSuggestions.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    vote: integer('vote').notNull(), // +1 or -1

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_kaizen_vote_suggestion').on(table.suggestionId),
    uniqueIndex('idx_kaizen_vote_person').on(table.suggestionId, table.personId),
]);

/**
 * Kaizen Comments - Discussion on suggestions
 */
export const kaizenComments = sqliteTable('kaizen_comments', {
    id: text('id').primaryKey().default(uuid()),
    suggestionId: text('suggestion_id').notNull().references(() => kaizenSuggestions.id, { onDelete: 'cascade' }),

    content: text('content').notNull(),

    authorId: text('author_id').notNull().references(() => persons.id),
    isReviewerComment: integer('is_reviewer_comment', { mode: 'boolean' }).default(false),

    // Reply threading
    parentCommentId: text('parent_comment_id'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_kaizen_comment_suggestion').on(table.suggestionId),
]);

/**
 * Kaizen Metrics - Track improvement impact
 */
export const kaizenMetrics = sqliteTable('kaizen_metrics', {
    id: text('id').primaryKey().default(uuid()),
    suggestionId: text('suggestion_id').notNull().references(() => kaizenSuggestions.id, { onDelete: 'cascade' }),

    // Before/After measurements
    metricName: text('metric_name').notNull(), // e.g., "Time to complete", "Errors per week"
    beforeValue: real('before_value'),
    afterValue: real('after_value'),
    unit: text('unit'), // e.g., "minutes", "count", "dollars"

    measuredAt: integer('measured_at').default(timestamp()),
    measuredBy: text('measured_by').references(() => persons.id),
    notes: text('notes'),
}, (table) => [
    index('idx_kaizen_metric_suggestion').on(table.suggestionId),
]);

// ============================================================================
// KAIZEN: Procedure Evolution (Democratic Process Improvement)
// ============================================================================

/**
 * Procedure Branches - Fork of a procedure for proposed changes
 * Like git branches for processes
 */
export const procedureBranches = sqliteTable('procedure_branches', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Source
    parentProcedureId: text('parent_procedure_id').notNull().references(() => procedureTemplates.id),
    parentVersion: integer('parent_version').notNull(), // Version when branched

    // Branch info
    branchName: text('branch_name').notNull(),
    description: text('description').notNull(),      // What are we trying to improve
    proposedBy: text('proposed_by').notNull().references(() => persons.id),

    // Status
    status: text('status', {
        enum: [
            'draft',              // Still being edited
            'proposed',           // Ready for voting
            'voting',             // Voting in progress
            'consensus_reached',  // All stakeholders agreed
            'trial',              // In trial period
            'trial_complete',     // Trial finished, awaiting commit
            'committed',          // Merged into main procedure
            'rejected',           // Not accepted
            'abandoned'           // Creator abandoned
        ]
    }).default('draft'),

    // Related suggestion (optional)
    suggestionId: text('suggestion_id').references(() => kaizenSuggestions.id),

    // Trial config (when approved)
    trialExecutions: integer('trial_executions').default(10),  // How many times to run trial
    currentTrialCount: integer('current_trial_count').default(0),
    trialStartedAt: integer('trial_started_at'),
    trialEndsAt: integer('trial_ends_at'),

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    proposedAt: integer('proposed_at'),
    consensusAt: integer('consensus_at'),
    committedAt: integer('committed_at'),
}, (table) => [
    index('idx_branch_org').on(table.organizationId),
    index('idx_branch_parent').on(table.parentProcedureId),
    index('idx_branch_status').on(table.status),
]);

/**
 * Branch Changes - Individual changes within a branch
 * (insert step, modify action, delete step, etc.)
 */
export const branchChanges = sqliteTable('branch_changes', {
    id: text('id').primaryKey().default(uuid()),
    branchId: text('branch_id').notNull().references(() => procedureBranches.id, { onDelete: 'cascade' }),

    // Change type
    changeType: text('change_type', {
        enum: [
            'add_step',         // Insert new step
            'modify_step',      // Change existing step
            'delete_step',      // Remove step
            'add_transition',   // Add new path
            'modify_transition', // Change path condition
            'delete_transition', // Remove path
            'reorder',          // Change step order
            'add_branch',       // Create decision point
            'merge_branch'      // Combine paths
        ]
    }).notNull(),

    // Target
    targetStepId: text('target_step_id').references(() => procedureSteps.id),
    targetTransitionId: text('target_transition_id').references(() => procedureTransitions.id),

    // Change data
    changeData: text('change_data').notNull(), // JSON: the actual change content
    rationale: text('rationale'),              // Why this change

    // Who made it
    authorId: text('author_id').notNull().references(() => persons.id),

    // Order in branch
    sequence: integer('sequence').notNull(),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_change_branch').on(table.branchId),
    index('idx_change_sequence').on(table.branchId, table.sequence),
]);

/**
 * Branch Stakeholders - Who needs to agree for consensus
 * Auto-populated based on procedure roles/departments
 */
export const branchStakeholders = sqliteTable('branch_stakeholders', {
    id: text('id').primaryKey().default(uuid()),
    branchId: text('branch_id').notNull().references(() => procedureBranches.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id),

    // Stake
    role: text('role', {
        enum: ['executor', 'approver', 'affected', 'reviewer']
    }).notNull(),
    reason: text('reason'),   // Why they're a stakeholder

    // Vote
    vote: text('vote', {
        enum: ['pending', 'approve', 'reject', 'abstain', 'needs_changes']
    }).default('pending'),
    voteReason: text('vote_reason'),
    votedAt: integer('voted_at'),

    // Required for consensus?
    isRequired: integer('is_required', { mode: 'boolean' }).default(true),

    addedAt: integer('added_at').default(timestamp()),
}, (table) => [
    index('idx_stakeholder_branch').on(table.branchId),
    uniqueIndex('idx_stakeholder_person').on(table.branchId, table.personId),
]);

/**
 * Trial Executions - Track procedure runs during trial
 */
export const trialExecutions = sqliteTable('trial_executions', {
    id: text('id').primaryKey().default(uuid()),
    branchId: text('branch_id').notNull().references(() => procedureBranches.id, { onDelete: 'cascade' }),
    executionId: text('execution_id').notNull().references(() => procedureExecutions.id),

    // Trial number
    trialNumber: integer('trial_number').notNull(), // 1 of 10, 2 of 10...

    // Quick metrics
    success: integer('success', { mode: 'boolean' }),
    durationMinutes: integer('duration_minutes'),
    stepsCompleted: integer('steps_completed'),
    stepsSkipped: integer('steps_skipped'),
    exceptionsOccurred: integer('exceptions_occurred').default(0),

    // Executor feedback ("vibes")
    executorId: text('executor_id').references(() => persons.id),
    vibeRating: integer('vibe_rating'), // 1-5 how did it feel?
    vibeFeedback: text('vibe_feedback'),  // Quick comment

    // Specific change feedback
    changeFeedback: text('change_feedback').default('[]'), // JSON: [{changeId, helpful, note}]

    completedAt: integer('completed_at').default(timestamp()),
}, (table) => [
    index('idx_trial_branch').on(table.branchId),
    index('idx_trial_execution').on(table.executionId),
]);

/**
 * Trial Metrics Comparison - Before vs After
 */
export const trialMetricsComparison = sqliteTable('trial_metrics_comparison', {
    id: text('id').primaryKey().default(uuid()),
    branchId: text('branch_id').notNull().references(() => procedureBranches.id, { onDelete: 'cascade' }),

    metricName: text('metric_name').notNull(),
    unit: text('unit'),

    // Before (from original procedure)
    beforeAvg: real('before_avg'),
    beforeMin: real('before_min'),
    beforeMax: real('before_max'),
    beforeSampleCount: integer('before_sample_count'),

    // After (from trial)
    afterAvg: real('after_avg'),
    afterMin: real('after_min'),
    afterMax: real('after_max'),
    afterSampleCount: integer('after_sample_count'),

    // Change
    changePercent: real('change_percent'),
    isImprovement: integer('is_improvement', { mode: 'boolean' }),

    calculatedAt: integer('calculated_at').default(timestamp()),
}, (table) => [
    index('idx_trial_metrics_branch').on(table.branchId),
]);

/**
 * Trial Vibe Summary - Aggregated "feel" scores
 */
export const trialVibeSummary = sqliteTable('trial_vibe_summary', {
    id: text('id').primaryKey().default(uuid()),
    branchId: text('branch_id').notNull().references(() => procedureBranches.id, { onDelete: 'cascade' }),

    avgVibeRating: real('avg_vibe_rating'),       // Average 1-5
    totalResponses: integer('total_responses'),

    // Sentiment breakdown
    positiveCount: integer('positive_count'),     // 4-5 ratings
    neutralCount: integer('neutral_count'),       // 3 ratings
    negativeCount: integer('negative_count'),     // 1-2 ratings

    // Top feedback themes (AI-analyzed)
    positiveThemes: text('positive_themes').default('[]'),
    negativeThemes: text('negative_themes').default('[]'),

    // Recommendation
    recommendation: text('recommendation', {
        enum: ['strongly_commit', 'commit', 'needs_revision', 'reject']
    }),

    calculatedAt: integer('calculated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_vibe_branch').on(table.branchId),
]);

/**
 * Procedure Versions - Committed procedure snapshots
 * Old procedures become "legacy" when superseded
 */
export const procedureVersions = sqliteTable('procedure_versions', {
    id: text('id').primaryKey().default(uuid()),
    procedureId: text('procedure_id').notNull().references(() => procedureTemplates.id),

    version: integer('version').notNull(),
    versionLabel: text('version_label'),          // "v2.0 - Faster onboarding"

    // What's in this version
    snapshotData: text('snapshot_data').notNull(), // JSON: full procedure snapshot
    changesSummary: text('changes_summary'),       // Human-readable summary

    // Source
    branchId: text('branch_id').references(() => procedureBranches.id),
    committedBy: text('committed_by').references(() => persons.id),

    // Status
    status: text('status', {
        enum: ['current', 'legacy', 'deprecated', 'archived']
    }).default('current'),

    // Knowledge link
    knowledgeUpdated: integer('knowledge_updated', { mode: 'boolean' }).default(false),
    linkedArticleId: text('linked_article_id').references(() => wikiArticles.id),

    createdAt: integer('created_at').default(timestamp()),
    supersededAt: integer('superseded_at'),
    supersededBy: integer('superseded_by'),       // Version number
}, (table) => [
    index('idx_version_procedure').on(table.procedureId),
    uniqueIndex('idx_version_number').on(table.procedureId, table.version),
    index('idx_version_status').on(table.status),
]);

// ============================================================================
// JOURNEY ANALYTICS & CAC-LTV (Owner/Director BI)
// ============================================================================

/**
 * Journey Instances - Individual person's journey through lifecycle
 * This is the "Kanban card" for each student/staffer
 */
export const journeyInstances = sqliteTable('journey_instances', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Who is on this journey
    personId: text('person_id').references(() => persons.id),   // For staff/students
    leadId: text('lead_id').references(() => leads.id),   // For pre-enrollment leads

    // Which lifecycle template
    lifecycleId: text('lifecycle_id').notNull().references(() => stakeholderLifecycles.id),
    journeyType: text('journey_type', {
        enum: ['student', 'staff', 'lead', 'parent']
    }).notNull(),

    // Current state
    currentStage: text('current_stage').notNull(),
    currentStageEnteredAt: integer('current_stage_entered_at').default(timestamp()),
    previousStage: text('previous_stage'),

    // Journey timing
    startedAt: integer('started_at').default(timestamp()),
    completedAt: integer('completed_at'),
    abandonedAt: integer('abandoned_at'),

    // Status
    status: text('status', {
        enum: ['active', 'completed', 'abandoned', 'paused', 'at_risk']
    }).default('active'),

    // Risk assessment
    riskScore: integer('risk_score'), // 0-100, AI calculated
    riskFactors: text('risk_factors').default('[]'), // JSON: ["low_engagement", "missed_payments"]
    lastRiskAssessment: integer('last_risk_assessment'),

    // CAC tracking (acquisition cost)
    cacCents: integer('cac_cents'), // Total customer acquisition cost
    cacBreakdown: text('cac_breakdown').default('{}'), // JSON: { marketing: X, sales: Y, onboarding: Z }
    acquisitionChannel: text('acquisition_channel'), // "organic", "paid_ads", "referral"
    acquisitionCampaignId: text('acquisition_campaign_id'),

    // LTV tracking (lifetime value)
    ltvCents: integer('ltv_cents'),            // Current calculated LTV
    ltvProjectedCents: integer('ltv_projected_cents'),  // Predicted total LTV
    totalRevenueCents: integer('total_revenue_cents').default(0), // Actual revenue so far
    totalCostCents: integer('total_cost_cents').default(0),      // Costs (provisioning, etc)

    // Engagement metrics (for risk prediction)
    daysInJourney: integer('days_in_journey').default(0),
    daysInCurrentStage: integer('days_in_current_stage').default(0),
    totalTouchpoints: integer('total_touchpoints').default(0),
    lastTouchpointAt: integer('last_touchpoint_at'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_journey_org').on(table.organizationId),
    index('idx_journey_person').on(table.personId),
    index('idx_journey_lead').on(table.leadId),
    index('idx_journey_type').on(table.journeyType, table.status),
    index('idx_journey_stage').on(table.currentStage),
    index('idx_journey_risk').on(table.riskScore),
]);

/**
 * Journey Events - Every stage transition and significant event
 * Forms the timeline for analysis
 */
export const journeyEvents = sqliteTable('journey_events', {
    id: text('id').primaryKey().default(uuid()),
    journeyId: text('journey_id').notNull().references(() => journeyInstances.id, { onDelete: 'cascade' }),

    eventType: text('event_type', {
        enum: [
            'stage_enter',             // Entered new stage
            'stage_exit',              // Left a stage
            'touchpoint',              // Interaction (call, email, class)
            'payment',                 // Payment made
            'milestone',               // Achievement/milestone
            'risk_change',             // Risk score changed
            'intervention',            // Manual intervention
            'automation_trigger',      // Automated action
            'complaint',               // Issue/complaint
            'win_back',                // Re-engagement
            'churn_signal',            // Early churn indicator
            'completion',              // Journey completed
            'abandonment'              // Journey abandoned
        ]
    }).notNull(),

    // Event details
    stage: text('stage'),                    // Which stage this happened in
    previousStage: text('previous_stage'),   // For transitions
    description: text('description'),

    // Quantitative data
    valueCents: integer('value_cents'),      // Revenue/cost impact
    durationMinutes: integer('duration_minutes'), // How long stage/action took

    // Actor
    actorId: text('actor_id').references(() => persons.id),
    actorType: text('actor_type', {
        enum: ['user', 'staff', 'system', 'automation', 'ai']
    }).default('system'),

    // Linked entities
    linkedEntityType: text('linked_entity_type'), // "payment", "meeting", "class", "communication"
    linkedEntityId: text('linked_entity_id'),

    // For dropoff analysis
    wasExpected: integer('was_expected', { mode: 'boolean' }).default(true),
    deviationReason: text('deviation_reason'),

    occurredAt: integer('occurred_at').default(timestamp()),
    metadata: text('metadata').default('{}'),
}, (table) => [
    index('idx_journey_event_journey').on(table.journeyId),
    index('idx_journey_event_type').on(table.eventType),
    index('idx_journey_event_stage').on(table.stage),
    index('idx_journey_event_time').on(table.occurredAt),
]);

/**
 * Dropoff Inferences - AI-analyzed reasons for dropoffs/churn
 * Owner/Director BI insight generation
 */
export const dropoffInferences = sqliteTable('dropoff_inferences', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Scope
    journeyType: text('journey_type', {
        enum: ['student', 'staff', 'lead', 'parent']
    }).notNull(),
    stage: text('stage').notNull(),               // At which stage

    // The inference
    category: text('category', {
        enum: [
            'pricing',                 // Too expensive
            'timing',                  // Wrong time
            'communication',           // Poor communication
            'experience',              // Bad experience
            'expectation_mismatch',    // Didn't match expectations
            'competition',             // Went to competitor
            'personal',                // Personal circumstances
            'engagement',              // Lost interest
            'friction',                // Process too difficult
            'support',                 // Inadequate support
            'other'
        ]
    }).notNull(),

    inferredReason: text('inferred_reason').notNull(),
    confidence: integer('confidence'), // 0-100

    // Supporting evidence
    evidenceCount: integer('evidence_count').default(0),
    evidenceJourneyIds: text('evidence_journey_ids').default('[]'), // JSON array
    evidencePatterns: text('evidence_patterns').default('[]'),      // JSON: what patterns led to this

    // AI analysis
    aiGeneratedAt: integer('ai_generated_at'),
    aiModel: text('ai_model'),
    aiPromptId: text('ai_prompt_id'),

    // Impact estimation
    estimatedRevenueLossCents: integer('estimated_revenue_loss_cents'),
    affectedCount: integer('affected_count'),

    // Suggested actions
    suggestedActions: text('suggested_actions').default('[]'), // JSON array

    // Status
    isAcknowledged: integer('is_acknowledged', { mode: 'boolean' }).default(false),
    acknowledgedBy: text('acknowledged_by').references(() => persons.id),
    acknowledgedAt: integer('acknowledged_at'),
    actionTaken: text('action_taken'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_dropoff_org').on(table.organizationId),
    index('idx_dropoff_journey_stage').on(table.journeyType, table.stage),
    index('idx_dropoff_category').on(table.category),
    index('idx_dropoff_confidence').on(table.confidence),
]);

/**
 * Cohort Analytics - Time-based cohort tracking for LTV/CAC
 * Monthly/weekly cohorts for trend analysis
 */
export const cohortAnalytics = sqliteTable('cohort_analytics', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Cohort definition
    cohortType: text('cohort_type', {
        enum: ['enrollment', 'lead', 'hire', 'graduate', 'churn']
    }).notNull(),
    cohortPeriod: text('cohort_period', {
        enum: ['weekly', 'monthly', 'quarterly']
    }).default('monthly'),
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),

    // Cohort metrics
    cohortSize: integer('cohort_size').default(0),

    // CAC metrics
    totalCacCents: integer('total_cac_cents').default(0),
    avgCacCents: integer('avg_cac_cents').default(0),

    // LTV metrics (evolving over time)
    totalLtvCents: integer('total_ltv_cents').default(0),
    avgLtvCents: integer('avg_ltv_cents').default(0),
    projectedLtvCents: integer('projected_ltv_cents').default(0),

    // Retention (N-month retention rates)
    retentionRates: text('retention_rates').default('{}'), // JSON: { "1": 95, "3": 85, "6": 70, "12": 55 }

    // Revenue timeline
    revenueByMonth: text('revenue_by_month').default('{}'), // JSON: { "0": X, "1": Y, "2": Z }

    // Churn analysis
    churnedCount: integer('churned_count').default(0),
    churnRate: real('churn_rate'),
    avgDaysToChurn: integer('avg_days_to_churn'),

    // Acquisition breakdown
    acquisitionChannels: text('acquisition_channels').default('{}'), // JSON: { "organic": 10, "paid": 5 }

    calculatedAt: integer('calculated_at').default(timestamp()),
}, (table) => [
    index('idx_cohort_org').on(table.organizationId),
    index('idx_cohort_type').on(table.cohortType, table.periodStart),
    uniqueIndex('idx_cohort_unique').on(table.organizationId, table.cohortType, table.cohortPeriod, table.periodStart),
]);

/**
 * CAC-LTV Timeline Snapshots - Daily snapshots for trend graphs
 */
export const cacLtvSnapshots = sqliteTable('cac_ltv_snapshots', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    snapshotDate: integer('snapshot_date').notNull(),
    journeyType: text('journey_type', {
        enum: ['student', 'staff', 'lead', 'all']
    }).notNull(),

    // Aggregate metrics
    activeJourneys: integer('active_journeys').default(0),
    completedJourneys: integer('completed_journeys').default(0),
    abandonedJourneys: integer('abandoned_journeys').default(0),

    // CAC
    avgCacCents: integer('avg_cac_cents'),
    totalCacCents: integer('total_cac_cents'),

    // LTV
    avgLtvCents: integer('avg_ltv_cents'),
    totalLtvCents: integer('total_ltv_cents'),
    ltvCacRatio: real('ltv_cac_ratio'), // Should be > 3 for healthy business

    // Funnel health
    stageDistribution: text('stage_distribution').default('{}'), // JSON: { "prospect": 50, "trial": 20 }
    avgDaysPerStage: text('avg_days_per_stage').default('{}'),   // JSON: { "prospect": 7, "trial": 14 }

    // Risk
    atRiskCount: integer('at_risk_count').default(0),
    avgRiskScore: real('avg_risk_score'),

    calculatedAt: integer('calculated_at').default(timestamp()),
}, (table) => [
    index('idx_cac_ltv_org').on(table.organizationId),
    index('idx_cac_ltv_date').on(table.snapshotDate),
    uniqueIndex('idx_cac_ltv_unique').on(table.organizationId, table.snapshotDate, table.journeyType),
]);

// ============================================================================
// TYPE EXPORTS - Wiki & Kaizen
// ============================================================================

export type WikiCategory = typeof wikiCategories.$inferSelect;
export type WikiCategoryInsert = typeof wikiCategories.$inferInsert;
export type WikiArticle = typeof wikiArticles.$inferSelect;
export type WikiArticleInsert = typeof wikiArticles.$inferInsert;
export type WikiArticleVersion = typeof wikiArticleVersions.$inferSelect;
export type WikiArticleFeedback = typeof wikiArticleFeedback.$inferSelect;

export type KaizenSuggestion = typeof kaizenSuggestions.$inferSelect;
export type KaizenSuggestionInsert = typeof kaizenSuggestions.$inferInsert;
export type KaizenVote = typeof kaizenVotes.$inferSelect;
export type KaizenComment = typeof kaizenComments.$inferSelect;
export type KaizenMetric = typeof kaizenMetrics.$inferSelect;

// Journey Analytics
export type JourneyInstance = typeof journeyInstances.$inferSelect;
export type JourneyInstanceInsert = typeof journeyInstances.$inferInsert;
export type JourneyEvent = typeof journeyEvents.$inferSelect;
export type DropoffInference = typeof dropoffInferences.$inferSelect;
export type CohortAnalytic = typeof cohortAnalytics.$inferSelect;
export type CacLtvSnapshot = typeof cacLtvSnapshots.$inferSelect;

// ============================================================================
// TEAM & ROLE ACCESS MANAGEMENT (SAP-Style Organizational Structure)
// ============================================================================

/**
 * Teams - Organizational units (departments, squads, chapters, etc.)
 * Supports hierarchical structure for nested teams
 */
export const teams = sqliteTable('teams', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

    // Team identity
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),

    // Team type for categorization
    teamType: text('team_type', {
        enum: ['department', 'squad', 'chapter', 'guild', 'tribe', 'project', 'committee', 'other']
    }).default('squad'),

    // Hierarchy - parent team for nested structure
    parentTeamId: text('parent_team_id'),

    // Visual
    icon: text('icon').default('IconUsers'),
    color: text('color').default('blue'),

    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    // Metadata
    settings: text('settings').default('{}'), // JSON for team-specific settings

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    archivedAt: integer('archived_at'),
    createdBy: text('created_by').references(() => persons.id),
}, (table) => [
    index('idx_team_org').on(table.organizationId),
    index('idx_team_parent').on(table.parentTeamId),
    uniqueIndex('idx_team_slug').on(table.organizationId, table.slug),
]);

/**
 * Positions - Roles within teams (Manager, Lead, Member, etc.)
 * These are the structural positions, not individual assignments
 */
export const teamPositions = sqliteTable('team_positions', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

    // Position identity
    name: text('name').notNull(), // e.g., "Team Lead", "Developer", "Manager"
    slug: text('slug').notNull(),
    description: text('description'),

    // Position level for hierarchy (1 = highest, 10 = lowest)
    level: integer('level').default(5),

    // Position type
    positionType: text('position_type', {
        enum: ['leadership', 'management', 'specialist', 'operational', 'support', 'intern', 'contractor', 'other']
    }).default('specialist'),

    // Visual
    icon: text('icon').default('IconUser'),
    color: text('color').default('gray'),

    // Can this position manage others?
    canManage: integer('can_manage', { mode: 'boolean' }).default(false),

    // Is this a leadership position?
    isLeadership: integer('is_leadership', { mode: 'boolean' }).default(false),

    // Default permissions for this position (JSON array of action type IDs)
    defaultPermissions: text('default_permissions').default('[]'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_position_org').on(table.organizationId),
    uniqueIndex('idx_position_slug').on(table.organizationId, table.slug),
]);

/**
 * Team Members - Assignment of users to teams with positions
 * This links users to teams and their role within that team
 */
export const teamMembers = sqliteTable('team_members', {
    id: text('id').primaryKey().default(uuid()),

    teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    positionId: text('position_id').notNull().references(() => teamPositions.id),

    // Member role within the team
    memberRole: text('member_role', {
        enum: ['owner', 'lead', 'member', 'guest', 'observer']
    }).default('member'),

    // Custom title (overrides position name if set)
    customTitle: text('custom_title'),

    // Employment relationship
    employmentType: text('employment_type', {
        enum: ['full_time', 'part_time', 'contractor', 'intern', 'volunteer']
    }).default('full_time'),

    // Workload allocation (0.0 to 1.0, e.g., 0.5 = 50% dedicated to this team)
    allocation: real('allocation').default(1.0),

    // Reporting structure
    reportsToMemberId: text('reports_to_member_id'),

    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    // Dates
    startDate: integer('start_date').default(timestamp()),
    endDate: integer('end_date'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_member_team').on(table.teamId),
    index('idx_member_person').on(table.personId),
    index('idx_member_position').on(table.positionId),
    uniqueIndex('idx_member_team_person').on(table.teamId, table.personId),
]);

/**
 * Action Types - Specific actions/operations in the system
 * These are the granular permissions that can be assigned
 */
export const actionTypes = sqliteTable('action_types', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

    // Action identity
    code: text('code').notNull(), // e.g., "wiki.article.create", "kaizen.approve", "crm.lead.delete"
    name: text('name').notNull(),
    description: text('description'),

    // Categorization
    category: text('category').notNull(), // e.g., "wiki", "kaizen", "crm", "finance", "hr"
    subcategory: text('subcategory'), // e.g., "articles", "suggestions", "leads"

    // Risk level for auditing
    riskLevel: text('risk_level', {
        enum: ['low', 'medium', 'high', 'critical']
    }).default('low'),

    // Does this action require additional approval?
    requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(false),

    // Is this a system action (cannot be modified)?
    isSystem: integer('is_system', { mode: 'boolean' }).default(false),

    // Visual
    icon: text('icon'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_action_org').on(table.organizationId),
    index('idx_action_category').on(table.category),
    uniqueIndex('idx_action_code').on(table.organizationId, table.code),
]);

/**
 * Position Action Permissions - Links positions to action types
 * This defines what each position can do
 */
export const positionPermissions = sqliteTable('position_permissions', {
    id: text('id').primaryKey().default(uuid()),

    positionId: text('position_id').notNull().references(() => teamPositions.id, { onDelete: 'cascade' }),
    actionTypeId: text('action_type_id').notNull().references(() => actionTypes.id, { onDelete: 'cascade' }),

    // Permission scope
    scope: text('scope', {
        enum: ['own', 'team', 'department', 'organization', 'global']
    }).default('own'),

    // Conditions (JSON for complex rules)
    conditions: text('conditions').default('{}'), // e.g., {"maxAmount": 10000, "requiresReason": true}

    // Can grant this permission to others?
    canDelegate: integer('can_delegate', { mode: 'boolean' }).default(false),

    grantedBy: text('granted_by').references(() => persons.id),
    grantedAt: integer('granted_at').default(timestamp()),
    expiresAt: integer('expires_at'),
}, (table) => [
    index('idx_perm_position').on(table.positionId),
    index('idx_perm_action').on(table.actionTypeId),
    uniqueIndex('idx_perm_position_action').on(table.positionId, table.actionTypeId),
]);

/**
 * User Action Overrides - Individual user permission overrides
 * For granting/revoking specific permissions to users beyond their position
 */
export const userPermissionOverrides = sqliteTable('user_permission_overrides', {
    id: text('id').primaryKey().default(uuid()),

    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    actionTypeId: text('action_type_id').notNull().references(() => actionTypes.id, { onDelete: 'cascade' }),

    // Grant or deny
    isGranted: integer('is_granted', { mode: 'boolean' }).default(true),

    // Scope of override
    scope: text('scope', {
        enum: ['own', 'team', 'department', 'organization', 'global']
    }).default('own'),

    // For which team? (null = all teams)
    teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),

    // Reason for override (for auditing)
    reason: text('reason'),

    grantedBy: text('granted_by').notNull().references(() => persons.id),
    grantedAt: integer('granted_at').default(timestamp()),
    expiresAt: integer('expires_at'),

    // Revocation tracking
    revokedAt: integer('revoked_at'),
    revokedBy: text('revoked_by').references(() => persons.id),
    revokeReason: text('revoke_reason'),
}, (table) => [
    index('idx_override_person').on(table.personId),
    index('idx_override_action').on(table.actionTypeId),
    index('idx_override_team').on(table.teamId),
]);

/**
 * Permission Groups - Bundles of permissions for easy assignment
 * Like "Finance Admin", "Content Editor", etc.
 */
export const permissionGroups = sqliteTable('permission_groups', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),

    // Visual
    icon: text('icon').default('IconShield'),
    color: text('color').default('blue'),

    // Is this a system group?
    isSystem: integer('is_system', { mode: 'boolean' }).default(false),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_group_org').on(table.organizationId),
    uniqueIndex('idx_group_slug').on(table.organizationId, table.slug),
]);

/**
 * Permission Group Actions - Links groups to action types
 */
export const permissionGroupActions = sqliteTable('permission_group_actions', {
    id: text('id').primaryKey().default(uuid()),

    groupId: text('group_id').notNull().references(() => permissionGroups.id, { onDelete: 'cascade' }),
    actionTypeId: text('action_type_id').notNull().references(() => actionTypes.id, { onDelete: 'cascade' }),

    scope: text('scope', {
        enum: ['own', 'team', 'department', 'organization', 'global']
    }).default('team'),
}, (table) => [
    index('idx_group_action_group').on(table.groupId),
    uniqueIndex('idx_group_action').on(table.groupId, table.actionTypeId),
]);

/**
 * User Group Assignments - Assigns users to permission groups
 */
export const userGroupAssignments = sqliteTable('user_group_assignments', {
    id: text('id').primaryKey().default(uuid()),

    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    groupId: text('group_id').notNull().references(() => permissionGroups.id, { onDelete: 'cascade' }),

    // For which team? (null = all teams)
    teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),

    grantedBy: text('granted_by').notNull().references(() => persons.id),
    grantedAt: integer('granted_at').default(timestamp()),
    expiresAt: integer('expires_at'),
}, (table) => [
    index('idx_user_group_person').on(table.personId),
    index('idx_user_group_group').on(table.groupId),
    uniqueIndex('idx_user_group').on(table.personId, table.groupId, table.teamId),
]);

/**
 * Permission Audit Log - Track all permission changes
 */
export const permissionAuditLog = sqliteTable('permission_audit_log', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What happened
    action: text('action', {
        enum: ['grant', 'revoke', 'modify', 'delegate', 'expire']
    }).notNull(),

    // Who was affected
    targetUserId: text('target_user_id').references(() => persons.id),
    targetPositionId: text('target_position_id').references(() => teamPositions.id),
    targetGroupId: text('target_group_id').references(() => permissionGroups.id),

    // What permission
    actionTypeId: text('action_type_id').references(() => actionTypes.id),

    // Previous and new values (JSON)
    previousValue: text('previous_value'),
    newValue: text('new_value'),

    // Who did it
    performedBy: text('performed_by').notNull().references(() => persons.id),
    performedAt: integer('performed_at').default(timestamp()),

    // Metadata
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    reason: text('reason'),
}, (table) => [
    index('idx_audit_org').on(table.organizationId),
    index('idx_audit_target_person').on(table.targetUserId),
    index('idx_audit_performed_by').on(table.performedBy),
    index('idx_audit_date').on(table.performedAt),
]);

// ============================================================================
// DRAFTS: Auto-save infrastructure
// ============================================================================

/**
 * Drafts - Stores work-in-progress content to prevent data loss
 * 
 * Used by: wiki editor, anunciação writer, any long-form content creation
 */
export const drafts = sqliteTable('drafts', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // What type of content
    type: text('type', {
        enum: ['wiki_article', 'anunciacao', 'procedure', 'sop', 'other']
    }).notNull(),

    // Reference to the parent item (e.g., team_id for anunciacao, article_id for wiki)
    referenceId: text('reference_id'),

    // The draft content as JSON
    content: text('content').notNull(),  // JSON blob with all fields

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_drafts_unique').on(table.personId, table.type, table.referenceId),
    index('idx_drafts_person').on(table.personId),
    index('idx_drafts_org').on(table.organizationId),
]);

// ============================================================================
// ANUNCIAÇÃO: Team Leadership Declaration System
// ============================================================================

/**
 * Org Anunciação Settings - Feature toggle and configuration per org
 */
export const orgAnunciacaoSettings = sqliteTable('org_anunciacao_settings', {
    orgId: text('org_id').primaryKey().references(() => organizations.id, { onDelete: 'cascade' }),

    enabled: integer('enabled').default(0),
    requiredForTeamAccess: integer('required_for_team_access').default(1),
    visibility: text('visibility', { enum: ['org_wide', 'leadership_only'] }).default('org_wide'),
    aiModelPreference: text('ai_model_preference').default('claude-sonnet-4-20250514'),

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
});

/**
 * Anunciações - Team leadership declaration documents
 * 
 * Each team leader writes a personal declaration (first 3 quarters)
 * AI writes the 4th quarter from its perspective about the collaboration
 * When a leader leaves, their anunciação is "enshrined" with tenure stats
 */
export const anunciacoes = sqliteTable('anunciacoes', {
    id: text('id').primaryKey().default(uuid()),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    teamId: text('team_id').notNull().references(() => teams.id),
    authorPersonId: text('author_person_id').notNull().references(() => persons.id),

    // Content (markdown)
    quarter1Content: text('quarter_1_content'),      // "Who I Am"
    quarter2Content: text('quarter_2_content'),      // "What I Believe"
    quarter3Content: text('quarter_3_content'),      // "What I'm Building"
    quarter4AiContent: text('quarter_4_ai_content'), // AI-generated
    closingContent: text('closing_content'),         // Optional human closing

    // AI generation metadata
    aiModelUsed: text('ai_model_used'),
    aiQuarterEdited: integer('ai_quarter_edited').default(0),
    aiQuarterRegenerations: integer('ai_quarter_regenerations').default(0),

    // Lifecycle: draft → active → enshrined
    status: text('status', { enum: ['draft', 'active', 'enshrined'] }).default('draft'),

    // Tenure tracking (populated on enshrine)
    tenureStartedAt: integer('tenure_started_at'),
    tenureEndedAt: integer('tenure_ended_at'),
    tenureStats: text('tenure_stats'),  // JSON from procedures map

    // Timestamps
    createdAt: integer('created_at').default(timestamp()),
    publishedAt: integer('published_at'),
    enshrinedAt: integer('enshrined_at'),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    index('idx_anunciacoes_org').on(table.organizationId),
    index('idx_anunciacoes_team').on(table.teamId),
    index('idx_anunciacoes_author').on(table.authorPersonId),
    index('idx_anunciacoes_status').on(table.status),
]);

// ============================================================================
// GENESIS: Cross-Session Memory Graph (Platform-Only Module)
// ============================================================================

export const genesisNodes = sqliteTable('genesis_nodes', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id),

    // Content
    content: text('content').notNull(),
    summary: text('summary'),
    nodeType: text('node_type', {
        enum: ['conversation', 'concept', 'insight', 'decision', 'pattern', 'question', 'contradiction']
    }).notNull(),

    // Hypersphere topology
    depth: real('depth').notNull().default(1.0),        // Distance from soul (0 = core identity, 1 = periphery)
    gravity: real('gravity').notNull().default(1.0),     // Importance weight (0-10)

    // Access control
    accessLevel: integer('access_level').notNull().default(1), // Minimum trust to see this

    // Tags for gravity bumping
    tags: text('tags').default('[]'), // JSON array of strings

    // Temporal
    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
    accessedAt: integer('accessed_at').default(timestamp()),
    accessCount: integer('access_count').default(0),

    // Source tracking
    sourceSessionType: text('source_session_type', {
        enum: ['claude_code', 'claude_desktop', 'claude_web', 'antigravity', 'subconscious', 'manual']
    }),
    sourceSessionId: text('source_session_id'),
}, (table) => [
    index('idx_genesis_nodes_person').on(table.personId),
    index('idx_genesis_nodes_org').on(table.organizationId),
    index('idx_genesis_nodes_gravity').on(table.gravity),
    index('idx_genesis_nodes_depth').on(table.depth),
    index('idx_genesis_nodes_type').on(table.nodeType),
]);

export const genesisEdges = sqliteTable('genesis_edges', {
    id: text('id').primaryKey().default(uuid()),
    sourceId: text('source_id').notNull().references(() => genesisNodes.id, { onDelete: 'cascade' }),
    targetId: text('target_id').notNull().references(() => genesisNodes.id, { onDelete: 'cascade' }),

    relationType: text('relation_type', {
        enum: ['references', 'develops', 'contradicts', 'branches', 'causes', 'supports', 'temporal', 'semantic']
    }).notNull(),

    weight: real('weight').notNull().default(1.0),
    context: text('context'),  // Why this connection exists

    createdAt: integer('created_at').default(timestamp()),
    strengthenedCount: integer('strengthened_count').default(0),
    lastStrengthened: integer('last_strengthened'),
}, (table) => [
    index('idx_genesis_edges_source').on(table.sourceId),
    index('idx_genesis_edges_target').on(table.targetId),
    index('idx_genesis_edges_type').on(table.relationType),
]);

export const genesisCubePositions = sqliteTable('genesis_cube_positions', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),

    // Trust topology — 3D position in the hypersphere
    trustLevel: real('trust_level').notNull().default(1.0),      // 0-10: stranger to co-creator
    accessDepth: real('access_depth').notNull().default(1.0),    // 0-10: public to subconscious
    roleClarity: real('role_clarity').notNull().default(2.0),    // 0-10: undefined to SELF

    createdAt: integer('created_at').default(timestamp()),
    updatedAt: integer('updated_at').default(timestamp()),
}, (table) => [
    uniqueIndex('idx_genesis_cube_person').on(table.personId),
]);

export const genesisLedger = sqliteTable('genesis_ledger', {
    id: text('id').primaryKey().default(uuid()),
    personId: text('person_id').notNull().references(() => persons.id),
    nodeId: text('node_id').references(() => genesisNodes.id),

    entryType: text('entry_type', {
        enum: ['observation', 'inference', 'commitment', 'question', 'decision', 'pattern', 'surfaced']
    }).notNull(),

    content: text('content').notNull(),
    confidence: real('confidence').notNull().default(1.0),

    // Source
    sourceSessionType: text('source_session_type', {
        enum: ['claude_code', 'claude_desktop', 'claude_web', 'antigravity', 'subconscious', 'manual']
    }),

    createdAt: integer('created_at').default(timestamp()),
}, (table) => [
    index('idx_genesis_ledger_person').on(table.personId),
    index('idx_genesis_ledger_type').on(table.entryType),
    index('idx_genesis_ledger_time').on(table.createdAt),
]);

export const genesisEmbeddings = sqliteTable('genesis_embeddings', {
    nodeId: text('node_id').primaryKey().references(() => genesisNodes.id, { onDelete: 'cascade' }),
    vector: text('vector').notNull(),  // JSON array of 768 floats (Nomic/Gemini)
    modelVersion: text('model_version').notNull().default('nomic-embed-text-v2-moe'),
    createdAt: integer('created_at').default(timestamp()),
});

// ============================================================================
// TYPE EXPORTS - Team & Role Management
// ============================================================================

export type Team = typeof teams.$inferSelect;
export type TeamInsert = typeof teams.$inferInsert;
export type TeamPosition = typeof teamPositions.$inferSelect;
export type TeamPositionInsert = typeof teamPositions.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type TeamMemberInsert = typeof teamMembers.$inferInsert;
export type ActionType = typeof actionTypes.$inferSelect;
export type ActionTypeInsert = typeof actionTypes.$inferInsert;
export type PositionPermission = typeof positionPermissions.$inferSelect;
export type UserPermissionOverride = typeof userPermissionOverrides.$inferSelect;
export type PermissionGroup = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsert = typeof permissionGroups.$inferInsert;
export type PermissionAuditLog = typeof permissionAuditLog.$inferSelect;


