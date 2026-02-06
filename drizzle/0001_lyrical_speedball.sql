CREATE TABLE `crm_audit_log` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`field_name` text,
	`previous_value` text,
	`new_value` text,
	`previous_snapshot` text,
	`new_snapshot` text,
	`change_description` text,
	`reason` text,
	`changed_by` text NOT NULL,
	`changed_by_name` text,
	`changed_by_role` text,
	`can_undo` integer DEFAULT true,
	`undone_at` integer,
	`undone_by` text,
	`undo_reason` text,
	`undoes_log_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`undone_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_crm_audit_entity` ON `crm_audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_crm_audit_org` ON `crm_audit_log` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_crm_audit_changed_by` ON `crm_audit_log` (`changed_by`);--> statement-breakpoint
CREATE INDEX `idx_crm_audit_action` ON `crm_audit_log` (`action`);--> statement-breakpoint
CREATE TABLE `crm_stage_history` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`from_stage` text,
	`to_stage` text NOT NULL,
	`entered_at` integer DEFAULT (unixepoch()),
	`exited_at` integer,
	`duration_seconds` integer,
	`changed_by` text,
	`reason` text,
	`value_at_transition` real,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stage_history_entity` ON `crm_stage_history` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_stage_history_stages` ON `crm_stage_history` (`from_stage`,`to_stage`);--> statement-breakpoint
CREATE INDEX `idx_stage_history_date` ON `crm_stage_history` (`entered_at`);--> statement-breakpoint
CREATE TABLE `lattice_evidence` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`person_id` text NOT NULL,
	`organization_id` text,
	`content` text NOT NULL,
	`context` text,
	`source_type` text NOT NULL,
	`source_id` text,
	`embedding` text NOT NULL,
	`skill_scores` text DEFAULT '{}',
	`status` text DEFAULT 'active',
	`contest_reason` text,
	`contested_at` integer,
	`contested_by` text,
	`captured_at` integer DEFAULT (unixepoch()),
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lattice_evidence_person` ON `lattice_evidence` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_lattice_evidence_org` ON `lattice_evidence` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_lattice_evidence_source` ON `lattice_evidence` (`source_type`);--> statement-breakpoint
CREATE INDEX `idx_lattice_evidence_status` ON `lattice_evidence` (`status`);--> statement-breakpoint
CREATE INDEX `idx_lattice_evidence_captured` ON `lattice_evidence` (`captured_at`);--> statement-breakpoint
CREATE TABLE `lattice_projection_results` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`person_id` text NOT NULL,
	`projection_id` text NOT NULL,
	`shape_data` text NOT NULL,
	`shadow_regions` text DEFAULT '[]',
	`fit_score` real,
	`exclusion_violations` text DEFAULT '[]',
	`evidence_points_used` integer DEFAULT 0,
	`time_range_start` integer,
	`time_range_end` integer,
	`calculated_at` integer DEFAULT (unixepoch()),
	`expires_at` integer,
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projection_id`) REFERENCES `lattice_projections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_lattice_results_person` ON `lattice_projection_results` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_lattice_results_projection` ON `lattice_projection_results` (`projection_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lattice_results_unique` ON `lattice_projection_results` (`person_id`,`projection_id`);--> statement-breakpoint
CREATE TABLE `lattice_projections` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text,
	`created_by` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`query_text` text NOT NULL,
	`query_embedding` text NOT NULL,
	`category` text DEFAULT 'custom',
	`shadow_exclusions` text DEFAULT '[]',
	`ideal_shape_data` text,
	`is_public` integer DEFAULT 0,
	`usage_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lattice_projections_org` ON `lattice_projections` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_lattice_projections_category` ON `lattice_projections` (`category`);--> statement-breakpoint
CREATE INDEX `idx_lattice_projections_public` ON `lattice_projections` (`is_public`);--> statement-breakpoint
CREATE TABLE `lattice_shares` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`owner_id` text NOT NULL,
	`grantee_id` text,
	`grantee_email` text,
	`projection_id` text,
	`can_see_shape` integer DEFAULT 1,
	`can_see_points` integer DEFAULT 0,
	`can_see_timeline` integer DEFAULT 0,
	`access_token` text,
	`expires_at` integer,
	`max_views` integer,
	`view_count` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` integer DEFAULT (unixepoch()),
	`last_accessed_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`grantee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projection_id`) REFERENCES `lattice_projections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lattice_shares_owner` ON `lattice_shares` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_lattice_shares_grantee` ON `lattice_shares` (`grantee_id`);--> statement-breakpoint
CREATE INDEX `idx_lattice_shares_token` ON `lattice_shares` (`access_token`);--> statement-breakpoint
CREATE INDEX `idx_lattice_shares_status` ON `lattice_shares` (`status`);--> statement-breakpoint
CREATE TABLE `lattice_skill_assessments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`person_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`position` real DEFAULT 0 NOT NULL,
	`confidence` real DEFAULT 0,
	`evidence_count` integer DEFAULT 0,
	`casts_shadow` integer DEFAULT 0,
	`shadow_intensity` real DEFAULT 0,
	`last_calculated_at` integer DEFAULT (unixepoch()),
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `lattice_skill_definitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lattice_assessments_person` ON `lattice_skill_assessments` (`person_id`);--> statement-breakpoint
CREATE INDEX `idx_lattice_assessments_skill` ON `lattice_skill_assessments` (`skill_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lattice_assessments_unique` ON `lattice_skill_assessments` (`person_id`,`skill_id`);--> statement-breakpoint
CREATE TABLE `lattice_skill_definitions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`category` text NOT NULL,
	`skill_name` text NOT NULL,
	`description` text,
	`adjacent_skills` text DEFAULT '[]',
	`sort_order` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `idx_lattice_skills_category` ON `lattice_skill_definitions` (`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lattice_skills_unique` ON `lattice_skill_definitions` (`category`,`skill_name`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text,
	`role` text NOT NULL,
	`module` text NOT NULL,
	`can_create` integer DEFAULT false,
	`can_read` integer DEFAULT true,
	`can_update` integer DEFAULT false,
	`can_delete` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_role_permissions_org_role` ON `role_permissions` (`organization_id`,`role`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_role_permissions_unique` ON `role_permissions` (`organization_id`,`role`,`module`);--> statement-breakpoint
CREATE TABLE `talent_evidence_documents` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`profile_id` text NOT NULL,
	`user_id` text NOT NULL,
	`filename` text NOT NULL,
	`file_type` text NOT NULL,
	`file_url` text,
	`file_content` text,
	`document_type` text DEFAULT 'other',
	`analysis_status` text DEFAULT 'pending',
	`analysis_result` text,
	`skills_extracted` text DEFAULT '[]',
	`contributed_to_lattice` integer DEFAULT 0,
	`contributed_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`profile_id`) REFERENCES `talent_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_talent_docs_profile` ON `talent_evidence_documents` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_talent_docs_user` ON `talent_evidence_documents` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_talent_docs_status` ON `talent_evidence_documents` (`analysis_status`);--> statement-breakpoint
CREATE TABLE `talent_gap_interviews` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`profile_id` text NOT NULL,
	`target_skills` text NOT NULL,
	`messages` text DEFAULT '[]',
	`status` text DEFAULT 'in_progress',
	`skills_assessed` text,
	`lattice_contribution` text,
	`created_at` integer DEFAULT (unixepoch()),
	`completed_at` integer,
	FOREIGN KEY (`profile_id`) REFERENCES `talent_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_gap_interviews_profile` ON `talent_gap_interviews` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_gap_interviews_status` ON `talent_gap_interviews` (`status`);--> statement-breakpoint
CREATE TABLE `talent_profiles` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`headline` text,
	`summary` text,
	`cv_data` text,
	`current_lattice` text,
	`interview_messages` text,
	`interview_completed_at` integer,
	`skill_gaps` text DEFAULT '[]',
	`last_gap_check_at` integer,
	`evidence_count` integer DEFAULT 0,
	`profile_completeness` real DEFAULT 0,
	`status` text DEFAULT 'incomplete',
	`is_searchable` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_talent_profiles_user` ON `talent_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_talent_profiles_status` ON `talent_profiles` (`status`);--> statement-breakpoint
CREATE INDEX `idx_talent_profiles_searchable` ON `talent_profiles` (`is_searchable`);--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`module` text NOT NULL,
	`can_create` integer,
	`can_read` integer,
	`can_update` integer,
	`can_delete` integer,
	`granted_by` text,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_permissions_user` ON `user_permissions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_permissions_unique` ON `user_permissions` (`user_id`,`module`);--> statement-breakpoint
DROP INDEX `idx_tax_withholdings_org`;--> statement-breakpoint
DROP INDEX `idx_tax_withholdings_period`;--> statement-breakpoint
DROP INDEX `idx_tax_withholdings_type`;--> statement-breakpoint
DROP INDEX `idx_tax_withholdings_reference`;--> statement-breakpoint
CREATE INDEX `idx_tax_wh_records_org` ON `fiscal_tax_withholdings` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_tax_wh_records_period` ON `fiscal_tax_withholdings` (`competency_period`);--> statement-breakpoint
CREATE INDEX `idx_tax_wh_records_type` ON `fiscal_tax_withholdings` (`tax_type`);--> statement-breakpoint
CREATE INDEX `idx_tax_wh_records_ref` ON `fiscal_tax_withholdings` (`reference_type`,`reference_id`);