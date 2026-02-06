CREATE TABLE `ai_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`models` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT 1,
	`base_url` text,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `alert_acknowledgments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`alert_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action_taken` text,
	`notes` text,
	`timestamp` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`alert_id`) REFERENCES `safety_alerts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ack_alert` ON `alert_acknowledgments` (`alert_id`);--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`arrived_at` integer,
	`left_at` integer,
	`notes` text,
	`excuse_reason` text,
	`marked_by` text,
	`marked_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_attendance_unique` ON `attendance` (`session_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_attendance_user` ON `attendance` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `badges` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text,
	`criteria` text NOT NULL,
	`category` text NOT NULL,
	`rarity` text DEFAULT 'common',
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`bank_code` text NOT NULL,
	`bank_name` text NOT NULL,
	`agency` text NOT NULL,
	`account_number` text NOT NULL,
	`account_type` text DEFAULT 'CHECKING' NOT NULL,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bank_accounts_org` ON `bank_accounts` (`organization_id`);--> statement-breakpoint
CREATE TABLE `campaign_leads` (
	`campaign_id` text NOT NULL,
	`lead_id` text NOT NULL,
	`attributed_at` integer DEFAULT (unixepoch()),
	`converted` integer DEFAULT 0,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_campaign_leads_pk` ON `campaign_leads` (`campaign_id`,`lead_id`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`campaign_type` text NOT NULL,
	`channels` text DEFAULT '[]',
	`budget_cents` integer,
	`spent_cents` integer DEFAULT 0,
	`starts_at` integer,
	`ends_at` integer,
	`target_audience` text,
	`goal_leads` integer,
	`goal_enrollments` integer,
	`goal_revenue_cents` integer,
	`actual_leads` integer DEFAULT 0,
	`actual_enrollments` integer DEFAULT 0,
	`actual_revenue_cents` integer DEFAULT 0,
	`status` text DEFAULT 'draft',
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_campaigns_status` ON `campaigns` (`status`,`starts_at`);--> statement-breakpoint
CREATE TABLE `capstone_submissions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`class_id` text,
	`module_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`prompt_ids` text DEFAULT '[]',
	`run_ids` text DEFAULT '[]',
	`workshop_id` text,
	`attachments` text DEFAULT '[]',
	`status` text DEFAULT 'draft',
	`submitted_at` integer,
	`self_score` real,
	`self_feedback` text,
	`self_rubric` text DEFAULT '{}',
	`teacher_score` real,
	`teacher_feedback` text,
	`teacher_rubric` text DEFAULT '{}',
	`peer_score` real,
	`peer_count` integer DEFAULT 0,
	`final_score` real,
	`graded_at` integer,
	`graded_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workshop_id`) REFERENCES `problem_workshops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`graded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_capstone_user` ON `capstone_submissions` (`user_id`,`module_id`);--> statement-breakpoint
CREATE INDEX `idx_capstone_class` ON `capstone_submissions` (`class_id`,`module_id`);--> statement-breakpoint
CREATE INDEX `idx_capstone_status` ON `capstone_submissions` (`status`);--> statement-breakpoint
CREATE TABLE `challenge_attempts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`challenge_id` text NOT NULL,
	`user_id` text NOT NULL,
	`run_id` text NOT NULL,
	`solved` integer DEFAULT 0,
	`verified_by` text,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`run_id`) REFERENCES `prompt_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_challenge` ON `challenge_attempts` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `idx_attempts_user` ON `challenge_attempts` (`user_id`);--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`author_id` text NOT NULL,
	`class_id` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`technique_required` text DEFAULT 'any',
	`difficulty` integer DEFAULT 3,
	`attempt_count` integer DEFAULT 0,
	`solve_count` integer DEFAULT 0,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_challenges_author` ON `challenges` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_challenges_class` ON `challenges` (`class_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `chart_of_accounts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`account_type` text NOT NULL,
	`nature` text NOT NULL,
	`classification` text NOT NULL,
	`parent_id` text,
	`level` integer DEFAULT 1,
	`allows_posting` integer DEFAULT 1,
	`is_system` integer DEFAULT 0,
	`is_active` integer DEFAULT 1,
	`cofins_applicable` integer DEFAULT 0,
	`pis_applicable` integer DEFAULT 0,
	`csll_applicable` integer DEFAULT 0,
	`irpj_applicable` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_chart_accounts_org` ON `chart_of_accounts` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_chart_accounts_code` ON `chart_of_accounts` (`organization_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_chart_accounts_type` ON `chart_of_accounts` (`account_type`);--> statement-breakpoint
CREATE INDEX `idx_chart_accounts_parent` ON `chart_of_accounts` (`parent_id`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content_encrypted` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()),
	`tokens_used` integer,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_messages_session` ON `chat_messages` (`session_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`student_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()),
	`ended_at` integer,
	`message_count` integer DEFAULT 0,
	`metadata` text DEFAULT '{}',
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_chat_sessions_student` ON `chat_sessions` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_sessions_org` ON `chat_sessions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_sessions_time` ON `chat_sessions` (`started_at`);--> statement-breakpoint
CREATE TABLE `class_sessions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`class_id` text NOT NULL,
	`schedule_id` text,
	`session_date` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`room_id` text,
	`status` text DEFAULT 'scheduled',
	`lesson_id` text,
	`notes` text,
	`teacher_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_class` ON `class_sessions` (`class_id`,`session_date`);--> statement-breakpoint
CREATE INDEX `idx_sessions_date` ON `class_sessions` (`session_date`);--> statement-breakpoint
CREATE INDEX `idx_sessions_teacher` ON `class_sessions` (`teacher_id`,`session_date`);--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`course_id` text,
	`course_type_id` text,
	`level_id` text,
	`term_id` text,
	`teacher_id` text,
	`max_students` integer DEFAULT 15,
	`current_students` integer DEFAULT 0,
	`status` text DEFAULT 'draft',
	`starts_at` integer,
	`ends_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_classes_org` ON `classes` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_classes_teacher` ON `classes` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `idx_classes_term` ON `classes` (`term_id`);--> statement-breakpoint
CREATE TABLE `cost_centers` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`parent_id` text,
	`level` integer DEFAULT 1,
	`center_type` text DEFAULT 'department',
	`manager_id` text,
	`annual_budget_cents` integer,
	`monthly_budget_cents` integer,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_cost_centers_org` ON `cost_centers` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cost_centers_code` ON `cost_centers` (`organization_id`,`code`);--> statement-breakpoint
CREATE TABLE `course_pricing` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`course_id` text NOT NULL,
	`full_price` real NOT NULL,
	`currency` text DEFAULT 'BRL',
	`max_installments` integer DEFAULT 1,
	`installment_price` real,
	`early_payment_discount_percent` real DEFAULT 0,
	`early_payment_days` integer DEFAULT 5,
	`late_payment_fee_percent` real DEFAULT 2,
	`late_payment_fee_fixed` real DEFAULT 0,
	`teacher_id` text,
	`teacher_percentage` real DEFAULT 0,
	`school_percentage` real DEFAULT 100,
	`platform_fee_percent` real DEFAULT 5,
	`transaction_fee_percent` real DEFAULT 2.5,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_course_pricing_course` ON `course_pricing` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_course_pricing_teacher` ON `course_pricing` (`teacher_id`);--> statement-breakpoint
CREATE TABLE `course_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`has_levels` integer DEFAULT 0,
	`has_modules` integer DEFAULT 1,
	`default_duration_weeks` integer DEFAULT 24,
	`default_hours_per_week` real DEFAULT 2,
	`default_monthly_price` integer,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text,
	`created_by` text NOT NULL,
	`title` text DEFAULT '{}' NOT NULL,
	`description` text DEFAULT '{}',
	`is_published` integer DEFAULT 0,
	`is_public` integer DEFAULT 0,
	`version` text DEFAULT '1.0',
	`language` text DEFAULT 'pt-BR',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_courses_org` ON `courses` (`organization_id`);--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`discount_type` text NOT NULL,
	`percentage` real,
	`fixed_amount` integer,
	`min_purchase` integer,
	`applies_to` text DEFAULT '[]',
	`max_uses` integer,
	`max_uses_per_user` integer DEFAULT 1,
	`current_uses` integer DEFAULT 0,
	`valid_from` integer,
	`valid_until` integer,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discounts_code_unique` ON `discounts` (`code`);--> statement-breakpoint
CREATE INDEX `idx_discounts_code` ON `discounts` (`code`);--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`template_type` text NOT NULL,
	`trigger_event` text,
	`subject` text NOT NULL,
	`body_html` text NOT NULL,
	`body_text` text,
	`variables` text DEFAULT '[]',
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`class_id` text NOT NULL,
	`term_id` text,
	`lead_id` text,
	`trial_id` text,
	`status` text DEFAULT 'active',
	`enrolled_at` integer DEFAULT (unixepoch()),
	`starts_at` integer,
	`ends_at` integer,
	`dropped_at` integer,
	`drop_reason` text,
	`transferred_to_enrollment_id` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trial_id`) REFERENCES `trial_classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_enrollments_user` ON `enrollments` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_enrollments_class` ON `enrollments` (`class_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_enrollments_term` ON `enrollments` (`term_id`);--> statement-breakpoint
CREATE TABLE `family_links` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`parent_id` text NOT NULL,
	`student_id` text NOT NULL,
	`relationship` text DEFAULT 'parent',
	`can_view_progress` integer DEFAULT 1,
	`can_view_grades` integer DEFAULT 1,
	`can_pay_invoices` integer DEFAULT 1,
	`can_communicate` integer DEFAULT 1,
	`is_primary_contact` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_family_unique` ON `family_links` (`parent_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `idx_family_student` ON `family_links` (`student_id`);--> statement-breakpoint
CREATE TABLE `fiscal_documents` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`document_type` text NOT NULL,
	`document_number` text,
	`series` text,
	`access_key` text,
	`verification_code` text,
	`issue_date` integer NOT NULL,
	`competence_date` integer,
	`issuer_id` text,
	`issuer_document` text,
	`issuer_name` text,
	`recipient_id` text,
	`recipient_document` text,
	`recipient_name` text,
	`total_amount_cents` integer NOT NULL,
	`net_amount_cents` integer,
	`iss_amount_cents` integer,
	`iss_rate` real,
	`pis_amount_cents` integer,
	`cofins_amount_cents` integer,
	`ir_amount_cents` integer,
	`csll_amount_cents` integer,
	`inss_amount_cents` integer,
	`iss_withheld` integer DEFAULT 0,
	`ir_withheld` integer DEFAULT 0,
	`pis_withheld` integer DEFAULT 0,
	`cofins_withheld` integer DEFAULT 0,
	`csll_withheld` integer DEFAULT 0,
	`inss_withheld` integer DEFAULT 0,
	`service_code` text,
	`service_description` text,
	`city_service_code` text,
	`status` text DEFAULT 'draft',
	`external_id` text,
	`xml_url` text,
	`pdf_url` text,
	`cancelled_at` integer,
	`cancellation_reason` text,
	`invoice_id` text,
	`payable_id` text,
	`payroll_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issuer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_fiscal_docs_org` ON `fiscal_documents` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_docs_type` ON `fiscal_documents` (`document_type`,`issue_date`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_docs_issuer` ON `fiscal_documents` (`issuer_document`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_docs_recipient` ON `fiscal_documents` (`recipient_document`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_fiscal_docs_access_key` ON `fiscal_documents` (`access_key`);--> statement-breakpoint
CREATE TABLE `fiscal_tax_withholdings` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`tax_type` text NOT NULL,
	`calculation_base` integer NOT NULL,
	`rate` integer NOT NULL,
	`amount_withheld` integer NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text NOT NULL,
	`reference_number` text,
	`competency_period` text NOT NULL,
	`withholding_date` text NOT NULL,
	`due_date` text NOT NULL,
	`payment_date` text,
	`withholder_id` text NOT NULL,
	`withholder_name` text NOT NULL,
	`beneficiary_id` text NOT NULL,
	`beneficiary_name` text NOT NULL,
	`beneficiary_document` text,
	`beneficiary_document_type` text,
	`voucher_type` text,
	`voucher_code` text,
	`voucher_barcode` text,
	`voucher_auth` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tax_withholdings_org` ON `fiscal_tax_withholdings` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_tax_withholdings_period` ON `fiscal_tax_withholdings` (`competency_period`);--> statement-breakpoint
CREATE INDEX `idx_tax_withholdings_type` ON `fiscal_tax_withholdings` (`tax_type`);--> statement-breakpoint
CREATE INDEX `idx_tax_withholdings_reference` ON `fiscal_tax_withholdings` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE TABLE `fiscal_transaction_documents` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`transaction_id` text NOT NULL,
	`document_type` text NOT NULL,
	`document_id` text NOT NULL,
	`document_number` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`transaction_id`) REFERENCES `fiscal_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_transaction_docs_transaction` ON `fiscal_transaction_documents` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_transaction_docs_document` ON `fiscal_transaction_documents` (`document_type`,`document_id`);--> statement-breakpoint
CREATE TABLE `fiscal_transactions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`sequential_number` integer NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`detailed_description` text,
	`amount` integer NOT NULL,
	`transaction_date` text NOT NULL,
	`competency_date` text NOT NULL,
	`competency_period` text NOT NULL,
	`payment_method` text NOT NULL,
	`bank_account_id` text,
	`bank_transaction_id` text,
	`counterparty_name` text,
	`counterparty_document` text,
	`counterparty_document_type` text,
	`debit_account` text,
	`credit_account` text,
	`cost_center` text,
	`reconciliation_status` text DEFAULT 'PENDING',
	`reconciled_at` text,
	`reconciled_by` text,
	`bank_statement_date` text,
	`bank_statement_amount` integer,
	`discrepancy_notes` text,
	`notes` text,
	`tags` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_fiscal_transactions_org` ON `fiscal_transactions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_transactions_period` ON `fiscal_transactions` (`competency_period`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_transactions_type` ON `fiscal_transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_transactions_category` ON `fiscal_transactions` (`category`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_transactions_date` ON `fiscal_transactions` (`transaction_date`);--> statement-breakpoint
CREATE INDEX `idx_fiscal_transactions_reconciliation` ON `fiscal_transactions` (`reconciliation_status`);--> statement-breakpoint
CREATE TABLE `graveyard_entries` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`run_id` text NOT NULL,
	`character_name` text NOT NULL,
	`cause_of_death` text,
	`epitaph` text,
	`module_id` text,
	`technique` text,
	`resurrected_as_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`run_id`) REFERENCES `prompt_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resurrected_as_id`) REFERENCES `student_prompts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_graveyard_user` ON `graveyard_entries` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`product_id` text,
	`quantity` integer DEFAULT 1,
	`unit_price_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`class_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invoice_items` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text,
	`payer_user_id` text NOT NULL,
	`payer_name` text NOT NULL,
	`payer_email` text,
	`payer_tax_id` text,
	`student_user_id` text,
	`student_name` text,
	`course_id` text,
	`description` text NOT NULL,
	`gross_amount` real NOT NULL,
	`discount_amount` real DEFAULT 0,
	`fee_amount` real DEFAULT 0,
	`net_amount` real NOT NULL,
	`currency` text DEFAULT 'BRL',
	`installment_number` integer,
	`total_installments` integer,
	`due_date` integer NOT NULL,
	`paid_date` integer,
	`status` text DEFAULT 'pending',
	`payment_method` text,
	`payment_provider` text,
	`external_payment_id` text,
	`split_config` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invoices_payer` ON `invoices` (`payer_user_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_student` ON `invoices` (`student_user_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_course` ON `invoices` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_status` ON `invoices` (`status`,`due_date`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`entry_number` integer,
	`reference_date` integer NOT NULL,
	`posting_date` integer NOT NULL,
	`fiscal_year` integer NOT NULL,
	`fiscal_month` integer NOT NULL,
	`description` text NOT NULL,
	`memo` text,
	`source_type` text NOT NULL,
	`source_id` text,
	`status` text DEFAULT 'draft',
	`is_reversal` integer DEFAULT 0,
	`reverses_entry_id` text,
	`reversed_by_entry_id` text,
	`created_by` text NOT NULL,
	`posted_by` text,
	`posted_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_journal_entries_org` ON `journal_entries` (`organization_id`,`fiscal_year`,`fiscal_month`);--> statement-breakpoint
CREATE INDEX `idx_journal_entries_date` ON `journal_entries` (`reference_date`);--> statement-breakpoint
CREATE INDEX `idx_journal_entries_source` ON `journal_entries` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `idx_journal_entries_number` ON `journal_entries` (`organization_id`,`entry_number`);--> statement-breakpoint
CREATE TABLE `journal_entry_lines` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`entry_id` text NOT NULL,
	`account_id` text NOT NULL,
	`cost_center_id` text,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'BRL',
	`entry_type` text NOT NULL,
	`description` text,
	`tax_code` text,
	`tax_amount_cents` integer,
	`document_number` text,
	`document_date` integer,
	`line_number` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cost_center_id`) REFERENCES `cost_centers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_journal_lines_entry` ON `journal_entry_lines` (`entry_id`);--> statement-breakpoint
CREATE INDEX `idx_journal_lines_account` ON `journal_entry_lines` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_journal_lines_cost_center` ON `journal_entry_lines` (`cost_center_id`);--> statement-breakpoint
CREATE TABLE `knowledge_edges` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`from_node_id` text NOT NULL,
	`to_node_id` text NOT NULL,
	`edge_type` text DEFAULT 'related',
	`weight` real DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_node_id`) REFERENCES `knowledge_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_node_id`) REFERENCES `knowledge_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_edge_unique` ON `knowledge_edges` (`from_node_id`,`to_node_id`);--> statement-breakpoint
CREATE INDEX `idx_edge_user` ON `knowledge_edges` (`user_id`);--> statement-breakpoint
CREATE TABLE `knowledge_nodes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`node_type` text DEFAULT 'concept' NOT NULL,
	`depth` integer DEFAULT 1,
	`source_run_id` text,
	`source_lesson_id` text,
	`module_id` text,
	`technique` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_run_id`) REFERENCES `prompt_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_knowledge_user` ON `knowledge_nodes` (`user_id`,`node_type`);--> statement-breakpoint
CREATE TABLE `lead_interactions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`lead_id` text NOT NULL,
	`interaction_type` text NOT NULL,
	`direction` text,
	`subject` text,
	`content` text,
	`outcome` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_interactions_lead` ON `lead_interactions` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`whatsapp` text,
	`source` text,
	`source_detail` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`interested_in` text DEFAULT '[]',
	`current_level` text,
	`preferred_schedule` text,
	`status` text DEFAULT 'new',
	`assigned_to` text,
	`referred_by_user_id` text,
	`converted_to_user_id` text,
	`converted_at` integer,
	`notes` text,
	`last_contact_at` integer,
	`next_followup_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`converted_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_leads_status` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `idx_leads_assigned` ON `leads` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `idx_leads_followup` ON `leads` (`next_followup_at`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`module_id` text NOT NULL,
	`title` text DEFAULT '{}' NOT NULL,
	`description` text DEFAULT '{}',
	`content` text,
	`content_format` text DEFAULT 'markdown',
	`order_index` integer DEFAULT 0 NOT NULL,
	`lesson_type` text DEFAULT 'standard',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_lessons_module` ON `lessons` (`module_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `levels` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`course_type_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`order_index` integer NOT NULL,
	`prerequisite_level_id` text,
	`estimated_hours` integer,
	FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_levels_unique` ON `levels` (`course_type_id`,`code`);--> statement-breakpoint
CREATE TABLE `memory_audit_log` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`student_id` text NOT NULL,
	`operation` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`actor` text NOT NULL,
	`details` text DEFAULT '{}',
	`timestamp` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_student` ON `memory_audit_log` (`student_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_audit_operation` ON `memory_audit_log` (`operation`);--> statement-breakpoint
CREATE TABLE `memory_contradictions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`graph_id` text NOT NULL,
	`node_a` text NOT NULL,
	`node_b` text NOT NULL,
	`resolved` integer DEFAULT 0,
	`resolved_to` text,
	`strategy` text,
	`detected_at` integer DEFAULT (unixepoch()),
	`resolved_at` integer,
	FOREIGN KEY (`graph_id`) REFERENCES `memory_graphs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`node_a`) REFERENCES `memory_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`node_b`) REFERENCES `memory_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_to`) REFERENCES `memory_nodes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_contradictions_graph` ON `memory_contradictions` (`graph_id`,`resolved`);--> statement-breakpoint
CREATE TABLE `memory_edges` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`graph_id` text NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`edge_type` text NOT NULL,
	`direction` text DEFAULT 'forward',
	`weight` real DEFAULT 1,
	`valence` real DEFAULT 0,
	`reverse_weight` real,
	`sequence` integer,
	`strength` real DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`graph_id`) REFERENCES `memory_graphs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_id`) REFERENCES `memory_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `memory_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_memory_edges_graph` ON `memory_edges` (`graph_id`);--> statement-breakpoint
CREATE INDEX `idx_memory_edges_source` ON `memory_edges` (`source_id`);--> statement-breakpoint
CREATE INDEX `idx_memory_edges_target` ON `memory_edges` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_memory_edges_type` ON `memory_edges` (`graph_id`,`edge_type`);--> statement-breakpoint
CREATE TABLE `memory_graphs` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`student_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`snr` real DEFAULT 1,
	`compression_passes` integer DEFAULT 0,
	`loss_vector` text DEFAULT '[]',
	`node_count` integer DEFAULT 0,
	`edge_count` integer DEFAULT 0,
	`oldest_memory` integer,
	`newest_memory` integer,
	`version` integer DEFAULT 1,
	`last_compressed` integer,
	`last_accessed` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_memory_graphs_student` ON `memory_graphs` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_memory_graphs_org` ON `memory_graphs` (`organization_id`);--> statement-breakpoint
CREATE TABLE `memory_integrity_hashes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`student_id` text NOT NULL,
	`graph_hash` text NOT NULL,
	`ledger_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_integrity_student` ON `memory_integrity_hashes` (`student_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `memory_ledger` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`graph_id` text NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`category` text NOT NULL,
	`importance` real DEFAULT 1,
	`trigger_threshold` real DEFAULT 0.5,
	`linked_nodes` text DEFAULT '[]',
	`triggers` text DEFAULT '[]',
	`trigger_entities` text DEFAULT '[]',
	`source_type` text,
	`source_entity` text,
	`source_date` integer,
	`is_active` integer DEFAULT 1,
	`expires_at` integer,
	`access_count` integer DEFAULT 0,
	`last_accessed` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`graph_id`) REFERENCES `memory_graphs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_memory_ledger_graph` ON `memory_ledger` (`graph_id`);--> statement-breakpoint
CREATE INDEX `idx_memory_ledger_category` ON `memory_ledger` (`graph_id`,`category`);--> statement-breakpoint
CREATE INDEX `idx_memory_ledger_importance` ON `memory_ledger` (`graph_id`,`importance`);--> statement-breakpoint
CREATE TABLE `memory_nodes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`graph_id` text NOT NULL,
	`content` text NOT NULL,
	`content_hash` text NOT NULL,
	`gravity` real DEFAULT 1,
	`salience` real DEFAULT 1,
	`confidence` real DEFAULT 1,
	`modality` text DEFAULT 'semantic',
	`sequence` integer,
	`timestamp` integer NOT NULL,
	`strength` real DEFAULT 1,
	`last_accessed` integer,
	`source_type` text DEFAULT 'chat',
	`source_id` text,
	`embedding` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`graph_id`) REFERENCES `memory_graphs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_memory_nodes_graph` ON `memory_nodes` (`graph_id`);--> statement-breakpoint
CREATE INDEX `idx_memory_nodes_gravity` ON `memory_nodes` (`graph_id`,`gravity`);--> statement-breakpoint
CREATE INDEX `idx_memory_nodes_modality` ON `memory_nodes` (`graph_id`,`modality`);--> statement-breakpoint
CREATE INDEX `idx_memory_nodes_timestamp` ON `memory_nodes` (`graph_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`course_id` text NOT NULL,
	`title` text DEFAULT '{}' NOT NULL,
	`description` text DEFAULT '{}',
	`order_index` integer DEFAULT 0 NOT NULL,
	`estimated_hours` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_modules_course` ON `modules` (`course_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`plan` text DEFAULT 'free',
	`stripe_customer_id` text,
	`subscription_ends_at` integer,
	`settings` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `payables` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`vendor_name` text NOT NULL,
	`vendor_document` text,
	`invoice_number` text,
	`invoice_url` text,
	`description` text,
	`category` text DEFAULT 'other' NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'BRL',
	`issue_date` integer,
	`due_date` integer NOT NULL,
	`paid_date` integer,
	`status` text DEFAULT 'pending',
	`payment_method` text,
	`payment_reference` text,
	`is_recurring` integer DEFAULT 0,
	`recurrence_interval` text,
	`parent_payable_id` text,
	`notes` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payables_org` ON `payables` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_payables_due` ON `payables` (`due_date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_payables_category` ON `payables` (`category`);--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`method_type` text NOT NULL,
	`label` text NOT NULL,
	`is_default` integer DEFAULT 0,
	`bank_code` text,
	`bank_name` text,
	`account_type` text,
	`account_number` text,
	`account_digit` text,
	`branch_number` text,
	`branch_digit` text,
	`holder_name` text,
	`holder_document` text,
	`pix_key_type` text,
	`pix_key` text,
	`card_brand` text,
	`card_last_4` text,
	`card_expiry` text,
	`card_token` text,
	`wallet_provider` text,
	`wallet_account_id` text,
	`is_verified` integer DEFAULT 0,
	`verified_at` integer,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payment_methods_user` ON `payment_methods` (`user_id`,`method_type`);--> statement-breakpoint
CREATE INDEX `idx_payment_methods_org` ON `payment_methods` (`organization_id`);--> statement-breakpoint
CREATE TABLE `payroll_payments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`payroll_id` text NOT NULL,
	`user_id` text NOT NULL,
	`payment_method_id` text,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'BRL',
	`method_type` text NOT NULL,
	`payment_provider` text,
	`external_payment_id` text,
	`external_batch_id` text,
	`status` text DEFAULT 'pending',
	`scheduled_for` integer,
	`processed_at` integer,
	`completed_at` integer,
	`failed_at` integer,
	`failure_reason` text,
	`retry_count` integer DEFAULT 0,
	`receipt_url` text,
	`receipt_number` text,
	`paid_by` text,
	`confirmed_by` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`payroll_id`) REFERENCES `staff_payroll`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paid_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payroll_payments_payroll` ON `payroll_payments` (`payroll_id`);--> statement-breakpoint
CREATE INDEX `idx_payroll_payments_user` ON `payroll_payments` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_payroll_payments_status` ON `payroll_payments` (`status`,`scheduled_for`);--> statement-breakpoint
CREATE INDEX `idx_payroll_payments_external` ON `payroll_payments` (`external_payment_id`);--> statement-breakpoint
CREATE TABLE `peer_reviews` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`submission_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`held_character` integer,
	`creativity` integer,
	`technique_usage` integer,
	`overall` integer,
	`feedback` text,
	`quality_score` real,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`submission_id`) REFERENCES `capstone_submissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_peer_review_unique` ON `peer_reviews` (`submission_id`,`reviewer_id`);--> statement-breakpoint
CREATE INDEX `idx_peer_review_reviewer` ON `peer_reviews` (`reviewer_id`);--> statement-breakpoint
CREATE TABLE `placement_results` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`test_id` text NOT NULL,
	`user_id` text NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`recommended_level_id` text,
	`section_scores` text,
	`final_level_id` text,
	`override_reason` text,
	`overridden_by` text,
	`taken_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`test_id`) REFERENCES `placement_tests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recommended_level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`final_level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`overridden_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_placement_user` ON `placement_results` (`user_id`);--> statement-breakpoint
CREATE TABLE `placement_tests` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`course_type_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sections` text NOT NULL,
	`max_score` integer NOT NULL,
	`level_thresholds` text NOT NULL,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `problem_workshops` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`raw_problem` text NOT NULL,
	`why_chain` text DEFAULT '[]',
	`root_cause` text,
	`sign_name` text,
	`sign_description` text,
	`stakeholders` text DEFAULT '[]',
	`required_skills` text DEFAULT '[]',
	`skill_gaps` text DEFAULT '[]',
	`solution_shape` text,
	`ai_agent_potential` integer,
	`agent_sketch` text,
	`status` text DEFAULT 'draft',
	`current_step` integer DEFAULT 1,
	`selected_for_capstone` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workshop_user` ON `problem_workshops` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`product_type` text NOT NULL,
	`price_cents` integer NOT NULL,
	`currency` text DEFAULT 'BRL',
	`is_recurring` integer DEFAULT 0,
	`recurrence_interval` text,
	`course_id` text,
	`course_type_id` text,
	`level_id` text,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_products_org` ON `products` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_products_type` ON `products` (`product_type`);--> statement-breakpoint
CREATE TABLE `progress` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`class_id` text,
	`course_id` text,
	`module_id` text,
	`lesson_id` text,
	`task_id` text,
	`status` text DEFAULT 'not_started',
	`score` real,
	`max_score` real,
	`started_at` integer,
	`completed_at` integer,
	`time_spent_sec` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_progress_unique` ON `progress` (`user_id`,`class_id`,`task_id`);--> statement-breakpoint
CREATE INDEX `idx_progress_user` ON `progress` (`user_id`,`class_id`);--> statement-breakpoint
CREATE TABLE `prompt_deltas` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`prompt_id` text NOT NULL,
	`version` integer NOT NULL,
	`patch` text NOT NULL,
	`change_summary` text,
	`changed_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_deltas_prompt_version` ON `prompt_deltas` (`prompt_id`,`version`);--> statement-breakpoint
CREATE TABLE `prompt_runs` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`prompt_id` text,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`system_prompt` text,
	`messages` text NOT NULL,
	`temperature` real,
	`max_tokens` integer,
	`other_params` text DEFAULT '{}',
	`output` text,
	`output_tokens` integer,
	`input_tokens` integer,
	`latency_ms` integer,
	`held_character` integer,
	`user_rating` integer,
	`notes` text,
	`error_code` text,
	`error_message` text,
	`benchmark_id` text,
	`benchmark_run_index` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_runs_prompt` ON `prompt_runs` (`prompt_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_runs_user` ON `prompt_runs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_runs_benchmark` ON `prompt_runs` (`benchmark_id`);--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`description` text,
	`tags` text DEFAULT '[]',
	`base_system_prompt` text,
	`base_messages` text DEFAULT '[]',
	`current_system_prompt` text,
	`current_messages` text DEFAULT '[]',
	`current_version` integer DEFAULT 1,
	`forked_from` text,
	`fork_version` integer,
	`shared_with` text DEFAULT 'private',
	`share_token` text,
	`course_id` text,
	`module_id` text,
	`lesson_id` text,
	`task_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`forked_from`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompts_share_token_unique` ON `prompts` (`share_token`);--> statement-breakpoint
CREATE INDEX `idx_prompts_user` ON `prompts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_prompts_org` ON `prompts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_prompts_share` ON `prompts` (`shared_with`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_prompts_token` ON `prompts` (`share_token`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`referrer_id` text NOT NULL,
	`lead_id` text,
	`referred_user_id` text,
	`status` text DEFAULT 'pending',
	`referrer_reward_type` text,
	`referrer_reward_value` integer,
	`referrer_reward_applied` integer DEFAULT 0,
	`referred_reward_type` text,
	`referred_reward_value` integer,
	`referred_reward_applied` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_referrals_referrer` ON `referrals` (`referrer_id`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`capacity` integer DEFAULT 15,
	`room_type` text DEFAULT 'classroom',
	`default_meet_url` text,
	`floor` text,
	`building` text,
	`amenities` text DEFAULT '[]',
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_rooms_org` ON `rooms` (`organization_id`);--> statement-breakpoint
CREATE TABLE `run_annotations` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`run_id` text NOT NULL,
	`user_id` text NOT NULL,
	`annotation` text NOT NULL,
	`annotation_type` text DEFAULT 'reflection',
	`insight_captured` integer DEFAULT 0,
	`knowledge_node_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`run_id`) REFERENCES `prompt_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_run_annotations_run` ON `run_annotations` (`run_id`);--> statement-breakpoint
CREATE INDEX `idx_run_annotations_user` ON `run_annotations` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `safety_alerts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`student_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`level` text NOT NULL,
	`reason` text NOT NULL,
	`detected_by` text NOT NULL,
	`detected_at` integer DEFAULT (unixepoch()),
	`acknowledged_at` integer,
	`acknowledged_by` text,
	`resolved_at` integer,
	`resolved_by` text,
	`resolution_notes` text,
	`notified_parents` integer DEFAULT 0,
	`notified_authorities` integer DEFAULT 0,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`acknowledged_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_alerts_student` ON `safety_alerts` (`student_id`);--> statement-breakpoint
CREATE INDEX `idx_alerts_level` ON `safety_alerts` (`level`);--> statement-breakpoint
CREATE INDEX `idx_alerts_unresolved` ON `safety_alerts` (`organization_id`,`resolved_at`);--> statement-breakpoint
CREATE TABLE `schedule_exceptions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`schedule_id` text,
	`class_id` text,
	`exception_date` integer NOT NULL,
	`exception_type` text NOT NULL,
	`new_room_id` text,
	`new_start_time` text,
	`new_end_time` text,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`new_room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_exceptions_date` ON `schedule_exceptions` (`exception_date`);--> statement-breakpoint
CREATE INDEX `idx_exceptions_class` ON `schedule_exceptions` (`class_id`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`class_id` text NOT NULL,
	`room_id` text,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`valid_from` integer,
	`valid_until` integer,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_schedules_class` ON `schedules` (`class_id`);--> statement-breakpoint
CREATE INDEX `idx_schedules_room` ON `schedules` (`room_id`,`day_of_week`);--> statement-breakpoint
CREATE TABLE `school_services` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`description` text,
	`price_type` text NOT NULL,
	`price` real NOT NULL,
	`category` text NOT NULL,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff_contracts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`job_title` text NOT NULL,
	`department` text DEFAULT 'admin' NOT NULL,
	`contract_type` text NOT NULL,
	`salary_cents` integer,
	`hourly_rate_cents` integer,
	`weekly_hours` real DEFAULT 40,
	`work_schedule` text DEFAULT '{}',
	`access_level` text DEFAULT 'basic',
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`status` text DEFAULT 'active',
	`benefits` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_staff_contracts_user` ON `staff_contracts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_staff_contracts_org` ON `staff_contracts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_staff_contracts_dept` ON `staff_contracts` (`department`);--> statement-breakpoint
CREATE TABLE `staff_leave` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`contract_id` text,
	`leave_type` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`reason` text,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contract_id`) REFERENCES `staff_contracts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_staff_leave_user` ON `staff_leave` (`user_id`,`start_date`);--> statement-breakpoint
CREATE TABLE `staff_payroll` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`contract_id` text NOT NULL,
	`user_id` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`payment_due_date` integer NOT NULL,
	`payroll_type` text DEFAULT 'salary' NOT NULL,
	`gross_amount_cents` integer NOT NULL,
	`deductions` text DEFAULT '{}',
	`total_deductions_cents` integer DEFAULT 0,
	`additions` text DEFAULT '{}',
	`total_additions_cents` integer DEFAULT 0,
	`net_amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'BRL',
	`hours_worked` real,
	`hourly_rate_cents` integer,
	`timesheet_id` text,
	`status` text DEFAULT 'draft',
	`calculated_by` text,
	`calculated_at` integer,
	`approved_by` text,
	`approved_at` integer,
	`paid_at` integer,
	`paid_amount_cents` integer DEFAULT 0,
	`notes` text,
	`payslip_url` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contract_id`) REFERENCES `staff_contracts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`calculated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_staff_payroll_user` ON `staff_payroll` (`user_id`,`period_start`);--> statement-breakpoint
CREATE INDEX `idx_staff_payroll_contract` ON `staff_payroll` (`contract_id`);--> statement-breakpoint
CREATE INDEX `idx_staff_payroll_status` ON `staff_payroll` (`status`,`payment_due_date`);--> statement-breakpoint
CREATE INDEX `idx_staff_payroll_org` ON `staff_payroll` (`organization_id`,`period_start`);--> statement-breakpoint
CREATE TABLE `student_prompts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`system_prompt` text,
	`user_message` text,
	`tags` text DEFAULT '[]',
	`forked_from` text,
	`is_public` integer DEFAULT 0,
	`run_count` integer DEFAULT 0,
	`held_rate` real DEFAULT 0,
	`module_id` text,
	`lesson_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`forked_from`) REFERENCES `student_prompts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_student_prompts_user` ON `student_prompts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_student_prompts_public` ON `student_prompts` (`is_public`,`created_at`);--> statement-breakpoint
CREATE TABLE `student_world_overlay` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`student_id` text NOT NULL,
	`graph_id` text NOT NULL,
	`known_nodes` text DEFAULT '[]',
	`known_edges` text DEFAULT '[]',
	`node_overrides` text DEFAULT '{}',
	`relationship_cache` text DEFAULT '{}',
	`stats` text DEFAULT '{}',
	`version` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`graph_id`) REFERENCES `memory_graphs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_world_overlay_student` ON `student_world_overlay` (`student_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`lesson_id` text NOT NULL,
	`title` text DEFAULT '{}' NOT NULL,
	`instructions` text DEFAULT '{}',
	`task_type` text NOT NULL,
	`config` text DEFAULT '{}',
	`order_index` integer DEFAULT 0 NOT NULL,
	`max_points` integer DEFAULT 10,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`archived_at` integer,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_lesson` ON `tasks` (`lesson_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `tax_withholdings` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`fiscal_month` integer NOT NULL,
	`beneficiary_id` text,
	`beneficiary_document` text NOT NULL,
	`beneficiary_name` text NOT NULL,
	`tax_type` text NOT NULL,
	`gross_amount_cents` integer NOT NULL,
	`taxable_base_cents` integer NOT NULL,
	`withheld_amount_cents` integer NOT NULL,
	`tax_rate` real,
	`tax_code` text,
	`source_type` text,
	`source_id` text,
	`fiscal_document_id` text,
	`payment_date` integer,
	`darf_number` text,
	`darf_paid_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`beneficiary_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fiscal_document_id`) REFERENCES `fiscal_documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tax_withholdings_org` ON `tax_withholdings` (`organization_id`,`fiscal_year`,`fiscal_month`);--> statement-breakpoint
CREATE INDEX `idx_tax_withholdings_beneficiary` ON `tax_withholdings` (`beneficiary_document`,`fiscal_year`);--> statement-breakpoint
CREATE INDEX `idx_tax_withholdings_type` ON `tax_withholdings` (`tax_type`,`fiscal_month`);--> statement-breakpoint
CREATE TABLE `teacher_contracts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`contract_type` text NOT NULL,
	`base_salary_cents` integer,
	`hourly_rate_cents` integer,
	`commission_rate` real,
	`min_hours_week` real,
	`max_hours_week` real,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`status` text DEFAULT 'active',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_contracts_teacher` ON `teacher_contracts` (`teacher_id`);--> statement-breakpoint
CREATE TABLE `teacher_payouts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`teacher_id` text NOT NULL,
	`organization_id` text,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`gross_amount` real NOT NULL,
	`deductions` real DEFAULT 0,
	`net_amount` real NOT NULL,
	`currency` text DEFAULT 'BRL',
	`breakdown` text DEFAULT '{}',
	`status` text DEFAULT 'calculating',
	`paid_date` integer,
	`payout_reference` text,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_teacher_payouts_teacher` ON `teacher_payouts` (`teacher_id`,`period_start`);--> statement-breakpoint
CREATE INDEX `idx_teacher_payouts_status` ON `teacher_payouts` (`status`);--> statement-breakpoint
CREATE TABLE `teacher_profiles` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`payment_model` text DEFAULT 'school_employee' NOT NULL,
	`revenue_percentage` real DEFAULT 0,
	`room_rental_fee` real DEFAULT 0,
	`subscribed_services` text DEFAULT '[]',
	`bank_name` text,
	`bank_agency` text,
	`bank_account` text,
	`pix_key` text,
	`pix_key_type` text,
	`tax_id` text,
	`tax_id_type` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_teacher_profiles_user` ON `teacher_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `technique_usage` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`run_id` text NOT NULL,
	`technique` text NOT NULL,
	`held_character` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`run_id`) REFERENCES `prompt_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_technique_user` ON `technique_usage` (`user_id`,`technique`);--> statement-breakpoint
CREATE INDEX `idx_technique_run` ON `technique_usage` (`run_id`);--> statement-breakpoint
CREATE TABLE `terms` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`enrollment_opens` integer,
	`enrollment_closes` integer,
	`classes_start` integer,
	`classes_end` integer,
	`status` text DEFAULT 'planning',
	`is_current` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_terms_org` ON `terms` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_terms_current` ON `terms` (`organization_id`,`is_current`);--> statement-breakpoint
CREATE TABLE `todo_items` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` integer DEFAULT 2,
	`urgency` integer DEFAULT 2,
	`energy_cost` integer DEFAULT 2,
	`depends_on` text DEFAULT '[]',
	`future_impact` integer DEFAULT 1,
	`status` text DEFAULT 'active',
	`completed_at` integer,
	`lesson_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_todo_user` ON `todo_items` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`invoice_id` text,
	`organization_id` text,
	`type` text NOT NULL,
	`user_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'BRL',
	`service_id` text,
	`status` text DEFAULT 'pending',
	`payout_method` text,
	`payout_reference` text,
	`payout_date` integer,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `school_services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_invoice` ON `transactions` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_user` ON `transactions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`,`status`);--> statement-breakpoint
CREATE TABLE `trial_classes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`lead_id` text,
	`user_id` text,
	`class_id` text,
	`session_id` text,
	`scheduled_date` integer,
	`scheduled_time` text,
	`room_id` text,
	`teacher_id` text,
	`status` text DEFAULT 'scheduled',
	`feedback_score` integer,
	`feedback_notes` text,
	`teacher_notes` text,
	`outcome` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_trials_lead` ON `trial_classes` (`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_trials_date` ON `trial_classes` (`scheduled_date`);--> statement-breakpoint
CREATE TABLE `user_api_keys` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`encrypted_key` text NOT NULL,
	`key_hint` text,
	`last_used_at` integer,
	`total_requests` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_api_keys_unique` ON `user_api_keys` (`user_id`,`provider`);--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`earned_at` integer DEFAULT (unixepoch()),
	`context` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_badge_unique` ON `user_badges` (`user_id`,`badge_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`role` text DEFAULT 'student',
	`organization_id` text,
	`preferences` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`last_seen_at` integer,
	`archived_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_org` ON `users` (`organization_id`);--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text,
	`lead_id` text,
	`class_id` text,
	`course_type_id` text,
	`level_id` text,
	`preferred_schedule` text,
	`status` text DEFAULT 'waiting',
	`notified_at` integer,
	`expires_at` integer,
	`position` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_waitlist_class` ON `waitlist` (`class_id`,`position`);--> statement-breakpoint
CREATE TABLE `wellbeing_snapshots` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`student_id` text NOT NULL,
	`snapshot_date` integer NOT NULL,
	`engagement_score` real,
	`emotional_indicators` text DEFAULT '{}',
	`session_count` integer DEFAULT 0,
	`total_duration` integer DEFAULT 0,
	`anomaly_flags` text DEFAULT '[]',
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wellbeing_student_date` ON `wellbeing_snapshots` (`student_id`,`snapshot_date`);