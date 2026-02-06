/**
 * Person Identity Helpers
 * 
 * Utilities for working with the normalized person/role system.
 * Everyone is a person first, roles second.
 */

import { db } from '@/lib/db';
import {
    persons, users, personContacts, personLattice, personBankAccounts,
    studentRoles, parentRoles, teacherRoles, staffRoles, leadRoles, ownerRoles
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonRoles {
    student: typeof studentRoles.$inferSelect | null;
    parent: (typeof parentRoles.$inferSelect)[];  // Can have multiple children
    teacher: typeof teacherRoles.$inferSelect | null;
    staff: (typeof staffRoles.$inferSelect)[];  // Can have multiple positions
    lead: typeof leadRoles.$inferSelect | null;
    owner: typeof ownerRoles.$inferSelect | null;
}

export interface PersonWithRoles {
    person: typeof persons.$inferSelect;
    user: typeof users.$inferSelect | null;
    roles: PersonRoles;
    lattice: typeof personLattice.$inferSelect | null;
    contacts: (typeof personContacts.$inferSelect)[];
    bankAccounts: (typeof personBankAccounts.$inferSelect)[];
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get a person by their ID with all roles
 */
export async function getPersonById(personId: string): Promise<PersonWithRoles | null> {
    const person = await db.query.persons.findFirst({
        where: eq(persons.id, personId),
    });

    if (!person) return null;

    return getPersonWithRoles(person);
}

/**
 * Get a person by user ID (from Clerk)
 */
export async function getPersonByUserId(userId: string): Promise<PersonWithRoles | null> {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user || !user.personId) return null;

    const person = await db.query.persons.findFirst({
        where: eq(persons.id, user.personId),
    });

    if (!person) return null;

    return getPersonWithRoles(person, user);
}

/**
 * Get a person by email
 */
export async function getPersonByEmail(email: string): Promise<PersonWithRoles | null> {
    const person = await db.query.persons.findFirst({
        where: eq(persons.primaryEmail, email),
    });

    if (!person) return null;

    return getPersonWithRoles(person);
}

/**
 * Internal: Load all roles for a person
 */
async function getPersonWithRoles(
    person: typeof persons.$inferSelect,
    existingUser?: typeof users.$inferSelect
): Promise<PersonWithRoles> {
    const [user, student, parentList, teacher, staffList, lead, owner, lattice, contacts, bankAccounts] = await Promise.all([
        existingUser ? Promise.resolve(existingUser) : db.query.users.findFirst({ where: eq(users.personId, person.id) }),
        db.query.studentRoles.findFirst({ where: eq(studentRoles.personId, person.id) }),
        db.query.parentRoles.findMany({ where: eq(parentRoles.personId, person.id) }),
        db.query.teacherRoles.findFirst({ where: eq(teacherRoles.personId, person.id) }),
        db.query.staffRoles.findMany({ where: eq(staffRoles.personId, person.id) }),
        db.query.leadRoles.findFirst({ where: eq(leadRoles.personId, person.id) }),
        db.query.ownerRoles.findFirst({ where: eq(ownerRoles.personId, person.id) }),
        db.query.personLattice.findFirst({ where: eq(personLattice.personId, person.id) }),
        db.query.personContacts.findMany({ where: eq(personContacts.personId, person.id) }),
        db.query.personBankAccounts.findMany({ where: eq(personBankAccounts.personId, person.id) }),
    ]);

    return {
        person,
        user: user || null,
        roles: {
            student: student || null,
            parent: parentList || [],
            teacher: teacher || null,
            staff: staffList || [],
            lead: lead || null,
            owner: owner || null,
        },
        lattice: lattice || null,
        contacts: contacts || [],
        bankAccounts: bankAccounts || [],
    };
}

// ============================================================================
// ROLE CHECKS (for permissions/UI)
// ============================================================================

export function isStudent(roles: PersonRoles): boolean {
    return roles.student !== null && roles.student.status === 'active';
}

export function isParent(roles: PersonRoles): boolean {
    return roles.parent.length > 0;
}

export function isTeacher(roles: PersonRoles): boolean {
    return roles.teacher !== null && roles.teacher.status === 'active';
}

export function isStaff(roles: PersonRoles): boolean {
    return roles.staff.some(s => s.status === 'active');
}

export function isStaffInDepartment(roles: PersonRoles, department: string): boolean {
    return roles.staff.some(s => s.status === 'active' && s.department === department);
}

export function isOwner(roles: PersonRoles): boolean {
    return roles.owner !== null;
}

export function isLead(roles: PersonRoles): boolean {
    return roles.lead !== null && !roles.lead.convertedAt;
}

export function needsLatticeInterview(person: typeof persons.$inferSelect): boolean {
    return !person.latticeInterviewCompleted;
}

// ============================================================================
// PERSON CREATION
// ============================================================================

export interface CreatePersonInput {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    taxId?: string;
    taxIdType?: 'cpf' | 'cnpj';
    birthDate?: Date;
    avatarUrl?: string;
}

/**
 * Create a new person (does not create auth user)
 */
export async function createPerson(input: CreatePersonInput) {
    const [person] = await db.insert(persons).values({
        firstName: input.firstName,
        lastName: input.lastName,
        primaryEmail: input.email,
        primaryPhone: input.phone,
        taxId: input.taxId,
        taxIdType: input.taxIdType,
        birthDate: input.birthDate ? Math.floor(input.birthDate.getTime() / 1000) : undefined,
        avatarUrl: input.avatarUrl,
    }).returning();

    return person;
}

/**
 * Create or link a person when a new user signs up via Clerk
 */
export async function ensurePersonForUser(
    userId: string,
    email: string,
    name?: string,
    avatarUrl?: string
): Promise<PersonWithRoles> {
    // Check if user already has a person
    const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (existingUser?.personId) {
        const existing = await getPersonById(existingUser.personId);
        if (existing) return existing;
    }

    // Check if person exists by email
    let person = await db.query.persons.findFirst({
        where: eq(persons.primaryEmail, email),
    });

    // Create person if not exists
    if (!person) {
        const nameParts = (name || email.split('@')[0]).split(' ');
        [person] = await db.insert(persons).values({
            firstName: nameParts[0] || 'User',
            lastName: nameParts.slice(1).join(' ') || undefined,
            primaryEmail: email,
            avatarUrl,
        }).returning();
    }

    // Update user to link to person
    await db.update(users)
        .set({ personId: person.id })
        .where(eq(users.id, userId));

    return getPersonWithRoles(person);
}

// ============================================================================
// ROLE ASSIGNMENT
// ============================================================================

export async function assignStudentRole(personId: string, organizationId: string, data?: Partial<typeof studentRoles.$inferInsert>) {
    const [role] = await db.insert(studentRoles).values({
        personId,
        organizationId,
        ...data,
    }).onConflictDoNothing().returning();
    return role;
}

export async function assignParentRole(
    personId: string,
    studentPersonId: string,
    organizationId: string,
    data?: Partial<typeof parentRoles.$inferInsert>
) {
    const [role] = await db.insert(parentRoles).values({
        personId,
        studentPersonId,
        organizationId,
        ...data,
    }).onConflictDoNothing().returning();
    return role;
}

export async function assignTeacherRole(personId: string, organizationId: string, data?: Partial<typeof teacherRoles.$inferInsert>) {
    const [role] = await db.insert(teacherRoles).values({
        personId,
        organizationId,
        ...data,
    }).onConflictDoNothing().returning();
    return role;
}

export async function assignStaffRole(personId: string, organizationId: string, positionTitle: string, data?: Partial<typeof staffRoles.$inferInsert>) {
    const [role] = await db.insert(staffRoles).values({
        personId,
        organizationId,
        positionTitle,
        ...data,
    }).returning();
    return role;
}

export async function assignOwnerRole(personId: string, organizationId: string, isPrimary?: boolean) {
    const [role] = await db.insert(ownerRoles).values({
        personId,
        organizationId,
        isPrimaryOwner: isPrimary ? 1 : 0,
    }).onConflictDoNothing().returning();
    return role;
}

// ============================================================================
// LEAD CONVERSION
// ============================================================================

export async function convertLeadToStudent(leadRoleId: string, organizationId: string) {
    const lead = await db.query.leadRoles.findFirst({
        where: eq(leadRoles.id, leadRoleId),
    });

    if (!lead) throw new Error('Lead not found');

    // Create student role
    const [studentRole] = await db.insert(studentRoles).values({
        personId: lead.personId,
        organizationId,
    }).returning();

    // Update lead with conversion
    await db.update(leadRoles)
        .set({
            convertedAt: Math.floor(Date.now() / 1000),
            convertedToStudentRoleId: studentRole.id,
            stage: 'closed_won',
        })
        .where(eq(leadRoles.id, leadRoleId));

    return studentRole;
}

export async function convertLeadToParent(leadRoleId: string, studentPersonId: string, organizationId: string) {
    const lead = await db.query.leadRoles.findFirst({
        where: eq(leadRoles.id, leadRoleId),
    });

    if (!lead) throw new Error('Lead not found');

    // Create parent role
    const [parentRole] = await db.insert(parentRoles).values({
        personId: lead.personId,
        studentPersonId,
        organizationId,
    }).returning();

    // Update lead with conversion
    await db.update(leadRoles)
        .set({
            convertedAt: Math.floor(Date.now() / 1000),
            convertedToParentRoleId: parentRole.id,
            stage: 'closed_won',
        })
        .where(eq(leadRoles.id, leadRoleId));

    return parentRole;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function getDisplayName(person: typeof persons.$inferSelect): string {
    if (person.displayName) return person.displayName;
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unknown';
}

export function getRoleLabels(roles: PersonRoles): string[] {
    const labels: string[] = [];
    if (isStudent(roles)) labels.push('Aluno');
    if (isParent(roles)) labels.push('Responsável');
    if (isTeacher(roles)) labels.push('Professor');
    if (isStaff(roles)) {
        const depts = Array.from(new Set(roles.staff.map(s => s.department)));
        if (depts.includes('marketing')) labels.push('Marketing');
        else if (depts.includes('sales')) labels.push('Vendas');
        else if (depts.includes('admin')) labels.push('Administrativo');
        else labels.push('Colaborador');
    }
    if (isOwner(roles)) labels.push('Proprietário');
    if (isLead(roles)) labels.push('Lead');
    return labels;
}

