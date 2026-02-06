/**
 * Identity Module
 * 
 * Normalized person/role system for multi-role identities.
 * Everyone is a person first, roles second.
 */

export * from './person-helpers';

// Re-export schema types for convenience
export type {
    Person,
    PersonInsert,
    PersonContact,
    StudentRole,
    ParentRole,
    TeacherRole,
    StaffRole,
    LeadRole,
    OwnerRole,
    PersonLattice,
    PersonBankAccount,
} from '@/lib/db/schema';

