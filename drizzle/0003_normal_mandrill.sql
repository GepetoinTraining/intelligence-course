CREATE TABLE `action_types` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`subcategory` text,
	`risk_level` text DEFAULT 'low',
	`requires_approval` integer DEFAULT false,
	`is_system` integer DEFAULT false,
	`icon` text,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_action_org` ON `action_types` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_action_category` ON `action_types` (`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_action_code` ON `action_types` (`organization_id`,`code`);--> statement-breakpoint
CREATE TABLE `permission_audit_log` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`action` text NOT NULL,
	`target_user_id` text,
	`target_position_id` text,
	`target_group_id` text,
	`action_type_id` text,
	`previous_value` text,
	`new_value` text,
	`performed_by` text NOT NULL,
	`performed_at` integer DEFAULT (unixepoch()),
	`ip_address` text,
	`user_agent` text,
	`reason` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_position_id`) REFERENCES `team_positions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_group_id`) REFERENCES `permission_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`action_type_id`) REFERENCES `action_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_org` ON `permission_audit_log` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_target_user` ON `permission_audit_log` (`target_user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_performed_by` ON `permission_audit_log` (`performed_by`);--> statement-breakpoint
CREATE INDEX `idx_audit_date` ON `permission_audit_log` (`performed_at`);--> statement-breakpoint
CREATE TABLE `permission_group_actions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`group_id` text NOT NULL,
	`action_type_id` text NOT NULL,
	`scope` text DEFAULT 'team',
	FOREIGN KEY (`group_id`) REFERENCES `permission_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`action_type_id`) REFERENCES `action_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_group_action_group` ON `permission_group_actions` (`group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_group_action` ON `permission_group_actions` (`group_id`,`action_type_id`);--> statement-breakpoint
CREATE TABLE `permission_groups` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text DEFAULT 'IconShield',
	`color` text DEFAULT 'blue',
	`is_system` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_group_org` ON `permission_groups` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_group_slug` ON `permission_groups` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `position_permissions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`position_id` text NOT NULL,
	`action_type_id` text NOT NULL,
	`scope` text DEFAULT 'own',
	`conditions` text DEFAULT '{}',
	`can_delegate` integer DEFAULT false,
	`granted_by` text,
	`granted_at` integer DEFAULT (unixepoch()),
	`expires_at` integer,
	FOREIGN KEY (`position_id`) REFERENCES `team_positions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`action_type_id`) REFERENCES `action_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_perm_position` ON `position_permissions` (`position_id`);--> statement-breakpoint
CREATE INDEX `idx_perm_action` ON `position_permissions` (`action_type_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_perm_position_action` ON `position_permissions` (`position_id`,`action_type_id`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`position_id` text NOT NULL,
	`member_role` text DEFAULT 'member',
	`custom_title` text,
	`employment_type` text DEFAULT 'full_time',
	`allocation` real DEFAULT 1,
	`reports_to_member_id` text,
	`is_active` integer DEFAULT true,
	`start_date` integer DEFAULT (unixepoch()),
	`end_date` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`position_id`) REFERENCES `team_positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_member_team` ON `team_members` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_member_user` ON `team_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_member_position` ON `team_members` (`position_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_team_user` ON `team_members` (`team_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `team_positions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`level` integer DEFAULT 5,
	`position_type` text DEFAULT 'specialist',
	`icon` text DEFAULT 'IconUser',
	`color` text DEFAULT 'gray',
	`can_manage` integer DEFAULT false,
	`is_leadership` integer DEFAULT false,
	`default_permissions` text DEFAULT '[]',
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_position_org` ON `team_positions` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_position_slug` ON `team_positions` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`team_type` text DEFAULT 'squad',
	`parent_team_id` text,
	`icon` text DEFAULT 'IconUsers',
	`color` text DEFAULT 'blue',
	`is_active` integer DEFAULT true,
	`settings` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer,
	`created_by` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_team_org` ON `teams` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_team_parent` ON `teams` (`parent_team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_team_slug` ON `teams` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `user_group_assignments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	`team_id` text,
	`granted_by` text NOT NULL,
	`granted_at` integer DEFAULT (unixepoch()),
	`expires_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `permission_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_group_user` ON `user_group_assignments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_group_group` ON `user_group_assignments` (`group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_group` ON `user_group_assignments` (`user_id`,`group_id`,`team_id`);--> statement-breakpoint
CREATE TABLE `user_permission_overrides` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`action_type_id` text NOT NULL,
	`is_granted` integer DEFAULT true,
	`scope` text DEFAULT 'own',
	`team_id` text,
	`reason` text,
	`granted_by` text NOT NULL,
	`granted_at` integer DEFAULT (unixepoch()),
	`expires_at` integer,
	`revoked_at` integer,
	`revoked_by` text,
	`revoke_reason` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`action_type_id`) REFERENCES `action_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`revoked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_override_user` ON `user_permission_overrides` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_override_action` ON `user_permission_overrides` (`action_type_id`);--> statement-breakpoint
CREATE INDEX `idx_override_team` ON `user_permission_overrides` (`team_id`);