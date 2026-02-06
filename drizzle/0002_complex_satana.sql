CREATE TABLE `action_item_comments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`action_item_id` text NOT NULL,
	`content` text NOT NULL,
	`mentions` text DEFAULT '[]',
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`is_edited` integer DEFAULT false,
	FOREIGN KEY (`action_item_id`) REFERENCES `action_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_action_item_comments_item` ON `action_item_comments` (`action_item_id`);--> statement-breakpoint
CREATE TABLE `action_item_types` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text DEFAULT 'IconChecklist',
	`color` text DEFAULT 'blue',
	`allowed_entities` text DEFAULT '[]',
	`default_priority` text DEFAULT 'medium',
	`default_duration_minutes` integer DEFAULT 30,
	`custom_fields` text DEFAULT '[]',
	`requires_note` integer DEFAULT false,
	`requires_outcome` integer DEFAULT false,
	`auto_create_follow_up` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`visible_to_roles` text DEFAULT '["owner", "admin", "staff"]',
	`sort_order` integer DEFAULT 0,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_action_item_types_org` ON `action_item_types` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_action_item_types_active` ON `action_item_types` (`is_active`);--> statement-breakpoint
CREATE TABLE `action_items` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`action_type_id` text,
	`title` text NOT NULL,
	`description` text,
	`linked_entity_type` text,
	`linked_entity_id` text,
	`secondary_entity_type` text,
	`secondary_entity_id` text,
	`assigned_to` text,
	`created_by` text NOT NULL,
	`status` text DEFAULT 'pending',
	`priority` text DEFAULT 'medium',
	`due_date` integer,
	`due_time` text,
	`start_date` integer,
	`end_date` integer,
	`is_all_day` integer DEFAULT false,
	`recurrence` text,
	`recurrence_parent_id` text,
	`reminders` text DEFAULT '[]',
	`completed_at` integer,
	`completed_by` text,
	`outcome` text,
	`outcome_notes` text,
	`custom_field_values` text DEFAULT '{}',
	`external_calendar_id` text,
	`external_calendar_provider` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`action_type_id`) REFERENCES `action_item_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_action_items_org` ON `action_items` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_action_items_assigned` ON `action_items` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `idx_action_items_status` ON `action_items` (`status`);--> statement-breakpoint
CREATE INDEX `idx_action_items_due_date` ON `action_items` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_action_items_entity` ON `action_items` (`linked_entity_type`,`linked_entity_id`);--> statement-breakpoint
CREATE INDEX `idx_action_items_type` ON `action_items` (`action_type_id`);--> statement-breakpoint
CREATE INDEX `idx_action_items_created_by` ON `action_items` (`created_by`);--> statement-breakpoint
CREATE TABLE `activity_feed` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`entity_name` text,
	`related_entity_type` text,
	`related_entity_id` text,
	`details` text DEFAULT '{}',
	`occurred_at` integer DEFAULT (unixepoch()),
	`is_important` integer DEFAULT false,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_activity_org` ON `activity_feed` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_activity_actor` ON `activity_feed` (`actor_id`);--> statement-breakpoint
CREATE INDEX `idx_activity_entity` ON `activity_feed` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_activity_date` ON `activity_feed` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_activity_action` ON `activity_feed` (`action`);--> statement-breakpoint
CREATE TABLE `ai_summaries` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`summary` text NOT NULL,
	`key_points` text DEFAULT '[]',
	`action_items` text DEFAULT '[]',
	`decisions` text DEFAULT '[]',
	`participants` text DEFAULT '[]',
	`overall_sentiment` text,
	`sentiment_score` real,
	`topics` text DEFAULT '[]',
	`ai_provider` text NOT NULL,
	`ai_model` text NOT NULL,
	`prompt_template` text,
	`tokens_used` integer,
	`processing_time_ms` integer,
	`user_rating` integer,
	`user_feedback` text,
	`linked_node_id` text,
	`generated_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_summary_org` ON `ai_summaries` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_summary_source` ON `ai_summaries` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `idx_summary_node` ON `ai_summaries` (`linked_node_id`);--> statement-breakpoint
CREATE TABLE `communication_templates` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`subject` text,
	`content` text NOT NULL,
	`content_type` text DEFAULT 'text',
	`placeholders` text DEFAULT '[]',
	`usage_count` integer DEFAULT 0,
	`last_used_at` integer,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_template_org` ON `communication_templates` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_template_category` ON `communication_templates` (`category`);--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member',
	`can_reply` integer DEFAULT true,
	`last_read_at` integer,
	`last_read_message_id` text,
	`unread_count` integer DEFAULT 0,
	`is_muted` integer DEFAULT false,
	`muted_until` integer,
	`is_active` integer DEFAULT true,
	`left_at` integer,
	`joined_at` integer DEFAULT (unixepoch()),
	`invited_by` text,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_conv_participant_unique` ON `conversation_participants` (`conversation_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_conv_participant_user` ON `conversation_participants` (`user_id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text,
	`description` text,
	`avatar_url` text,
	`broadcast_scope` text,
	`broadcast_role_filter` text,
	`broadcast_team_id` text,
	`meeting_id` text,
	`problem_title` text,
	`problem_status` text,
	`problem_resolution` text,
	`resolved_at` integer,
	`resolved_by` text,
	`linked_task_id` text,
	`linked_task_title` text,
	`node_id` text,
	`graph_path` text,
	`ai_provider` text,
	`ai_model` text,
	`ai_system_prompt` text,
	`ai_context` text DEFAULT '[]',
	`is_archived` integer DEFAULT false,
	`is_pinned` integer DEFAULT false,
	`last_message_at` integer,
	`message_count` integer DEFAULT 0,
	`metadata` text DEFAULT '{}',
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_conv_org` ON `conversations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_conv_type` ON `conversations` (`type`);--> statement-breakpoint
CREATE INDEX `idx_conv_meeting` ON `conversations` (`meeting_id`);--> statement-breakpoint
CREATE INDEX `idx_conv_node` ON `conversations` (`node_id`);--> statement-breakpoint
CREATE INDEX `idx_conv_last_msg` ON `conversations` (`last_message_at`);--> statement-breakpoint
CREATE TABLE `kaizen_comments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`suggestion_id` text NOT NULL,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`is_reviewer_comment` integer DEFAULT false,
	`parent_comment_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`suggestion_id`) REFERENCES `kaizen_suggestions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_kaizen_comment_suggestion` ON `kaizen_comments` (`suggestion_id`);--> statement-breakpoint
CREATE TABLE `kaizen_metrics` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`suggestion_id` text NOT NULL,
	`metric_name` text NOT NULL,
	`before_value` real,
	`after_value` real,
	`unit` text,
	`measured_at` integer DEFAULT (unixepoch()),
	`measured_by` text,
	`notes` text,
	FOREIGN KEY (`suggestion_id`) REFERENCES `kaizen_suggestions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`measured_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_kaizen_metric_suggestion` ON `kaizen_metrics` (`suggestion_id`);--> statement-breakpoint
CREATE TABLE `kaizen_suggestions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`problem_type` text NOT NULL,
	`impact_area` text DEFAULT 'time',
	`estimated_impact` text DEFAULT 'medium',
	`procedure_id` text,
	`step_id` text,
	`wiki_article_id` text,
	`status` text DEFAULT 'submitted',
	`reviewer_id` text,
	`review_notes` text,
	`reviewed_at` integer,
	`implementer_id` text,
	`implementation_notes` text,
	`implemented_at` integer,
	`upvotes` integer DEFAULT 0,
	`downvotes` integer DEFAULT 0,
	`submitter_id` text NOT NULL,
	`is_anonymous` integer DEFAULT false,
	`tags` text DEFAULT '[]',
	`attachments` text DEFAULT '[]',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`procedure_id`) REFERENCES `procedure_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`step_id`) REFERENCES `procedure_steps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wiki_article_id`) REFERENCES `wiki_articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`implementer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_kaizen_org` ON `kaizen_suggestions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_kaizen_status` ON `kaizen_suggestions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_kaizen_submitter` ON `kaizen_suggestions` (`submitter_id`);--> statement-breakpoint
CREATE INDEX `idx_kaizen_procedure` ON `kaizen_suggestions` (`procedure_id`);--> statement-breakpoint
CREATE INDEX `idx_kaizen_votes` ON `kaizen_suggestions` (`organization_id`,`upvotes`);--> statement-breakpoint
CREATE TABLE `kaizen_votes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`suggestion_id` text NOT NULL,
	`user_id` text NOT NULL,
	`vote` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`suggestion_id`) REFERENCES `kaizen_suggestions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_kaizen_vote_suggestion` ON `kaizen_votes` (`suggestion_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_kaizen_vote_user` ON `kaizen_votes` (`suggestion_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `meeting_notes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`meeting_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text DEFAULT '',
	`content_format` text DEFAULT 'markdown',
	`is_private` integer DEFAULT true,
	`extracted_tasks` text DEFAULT '[]',
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_meeting_notes_unique` ON `meeting_notes` (`meeting_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_meeting_notes_meeting` ON `meeting_notes` (`meeting_id`);--> statement-breakpoint
CREATE TABLE `meeting_participants` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`meeting_id` text NOT NULL,
	`user_id` text,
	`external_email` text,
	`external_name` text,
	`external_phone` text,
	`role` text DEFAULT 'required',
	`response_status` text DEFAULT 'pending',
	`responded_at` integer,
	`attended` integer,
	`joined_at` integer,
	`left_at` integer,
	`notification_sent` integer DEFAULT false,
	`reminder_sent` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_meeting_participants_meeting` ON `meeting_participants` (`meeting_id`);--> statement-breakpoint
CREATE INDEX `idx_meeting_participants_user` ON `meeting_participants` (`user_id`);--> statement-breakpoint
CREATE TABLE `meeting_templates` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`meeting_type` text NOT NULL,
	`default_duration_minutes` integer DEFAULT 60,
	`default_location_type` text,
	`default_agenda` text,
	`default_description` text,
	`default_reminders` text DEFAULT '[]',
	`allowed_roles` text DEFAULT '[]',
	`is_active` integer DEFAULT true,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_meeting_templates_org` ON `meeting_templates` (`organization_id`);--> statement-breakpoint
CREATE TABLE `meeting_transcripts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`meeting_id` text NOT NULL,
	`recorded_by` text NOT NULL,
	`device_type` text,
	`chunk_index` integer DEFAULT 0,
	`raw_transcript` text NOT NULL,
	`speaker_labels` text DEFAULT '{}',
	`start_timestamp` integer,
	`end_timestamp` integer,
	`duration_seconds` integer,
	`is_processed` integer DEFAULT false,
	`language_detected` text,
	`confidence_score` real,
	`audio_file_url` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_transcript_meeting` ON `meeting_transcripts` (`meeting_id`);--> statement-breakpoint
CREATE INDEX `idx_transcript_chunk` ON `meeting_transcripts` (`meeting_id`,`chunk_index`);--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`meeting_type` text DEFAULT 'internal' NOT NULL,
	`context_type` text,
	`context_id` text,
	`scheduled_start` integer NOT NULL,
	`scheduled_end` integer NOT NULL,
	`timezone` text DEFAULT 'America/Sao_Paulo',
	`is_all_day` integer DEFAULT false,
	`recurrence` text,
	`recurrence_parent_id` text,
	`location_type` text DEFAULT 'video_call',
	`location` text,
	`video_provider` text,
	`video_link` text,
	`status` text DEFAULT 'scheduled',
	`requires_approval` integer DEFAULT false,
	`approval_status` text,
	`approved_by` text,
	`approved_at` integer,
	`approval_notes` text,
	`organizer_id` text NOT NULL,
	`created_by` text NOT NULL,
	`agenda` text,
	`notes` text,
	`outcome` text,
	`follow_up_actions` text,
	`external_calendar_id` text,
	`external_calendar_provider` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`cancelled_at` integer,
	`cancelled_by` text,
	`cancellation_reason` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_meetings_org` ON `meetings` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_meetings_organizer` ON `meetings` (`organizer_id`);--> statement-breakpoint
CREATE INDEX `idx_meetings_type` ON `meetings` (`meeting_type`);--> statement-breakpoint
CREATE INDEX `idx_meetings_status` ON `meetings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_meetings_schedule` ON `meetings` (`scheduled_start`,`scheduled_end`);--> statement-breakpoint
CREATE INDEX `idx_meetings_context` ON `meetings` (`context_type`,`context_id`);--> statement-breakpoint
CREATE TABLE `message_attachments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`message_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_url` text NOT NULL,
	`thumbnail_url` text,
	`width` integer,
	`height` integer,
	`duration_seconds` integer,
	`transcription` text,
	`transcription_status` text,
	`uploaded_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attach_msg` ON `message_attachments` (`message_id`);--> statement-breakpoint
CREATE TABLE `message_read_receipts` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`read_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_read_receipt_unique` ON `message_read_receipts` (`message_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_read_receipt_msg` ON `message_read_receipts` (`message_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text,
	`sender_type` text DEFAULT 'user',
	`content` text NOT NULL,
	`content_type` text DEFAULT 'text',
	`ai_tokens_used` integer,
	`ai_model_used` text,
	`ai_response_time_ms` integer,
	`reply_to_message_id` text,
	`thread_root_id` text,
	`thread_reply_count` integer DEFAULT 0,
	`has_attachments` integer DEFAULT false,
	`mentions` text DEFAULT '[]',
	`reactions` text DEFAULT '{}',
	`linked_node_id` text,
	`linked_entity_type` text,
	`linked_entity_id` text,
	`is_edited` integer DEFAULT false,
	`edited_at` integer,
	`is_deleted` integer DEFAULT false,
	`deleted_at` integer,
	`is_solution` integer DEFAULT false,
	`solution_approved_by` text,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`solution_approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_msg_conv` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_msg_sender` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `idx_msg_thread` ON `messages` (`thread_root_id`);--> statement-breakpoint
CREATE INDEX `idx_msg_created` ON `messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_msg_linked` ON `messages` (`linked_entity_type`,`linked_entity_id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`content_type` text DEFAULT 'markdown',
	`note_type` text DEFAULT 'general',
	`is_private` integer DEFAULT false,
	`is_pinned` integer DEFAULT false,
	`attachments` text DEFAULT '[]',
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notes_entity` ON `notes` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_org` ON `notes` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_created_by` ON `notes` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_notes_pinned` ON `notes` (`is_pinned`);--> statement-breakpoint
CREATE TABLE `notification_queue` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`conversation_id` text,
	`message_id` text,
	`meeting_id` text,
	`channels` text DEFAULT '["in_app"]',
	`priority` text DEFAULT 'normal',
	`status` text DEFAULT 'pending',
	`sent_at` integer,
	`delivered_at` integer,
	`read_at` integer,
	`failure_reason` text,
	`created_at` integer DEFAULT (unixepoch()),
	`expires_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notif_recipient` ON `notification_queue` (`recipient_id`);--> statement-breakpoint
CREATE INDEX `idx_notif_status` ON `notification_queue` (`status`);--> statement-breakpoint
CREATE INDEX `idx_notif_created` ON `notification_queue` (`created_at`);--> statement-breakpoint
CREATE TABLE `organizational_roles` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`hierarchy_level` integer DEFAULT 10 NOT NULL,
	`category` text DEFAULT 'staff',
	`department` text,
	`permissions` text DEFAULT '[]',
	`icon` text DEFAULT 'IconUser',
	`color` text DEFAULT 'blue',
	`can_have_reports` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`is_system_role` integer DEFAULT false,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_org_roles_org` ON `organizational_roles` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_org_roles_slug` ON `organizational_roles` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_org_roles_hierarchy` ON `organizational_roles` (`hierarchy_level`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_org_roles_unique_slug` ON `organizational_roles` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `procedure_analytics` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`procedure_id` text NOT NULL,
	`period_type` text NOT NULL,
	`period_start` integer,
	`period_end` integer,
	`execution_count` integer DEFAULT 0,
	`completed_count` integer DEFAULT 0,
	`failed_count` integer DEFAULT 0,
	`cancelled_count` integer DEFAULT 0,
	`completion_rate` integer,
	`avg_completion_time_minutes` integer,
	`median_completion_time_minutes` integer,
	`p90_completion_time_minutes` integer,
	`on_time_completion_rate` integer,
	`overdue_count` integer DEFAULT 0,
	`step_metrics` text DEFAULT '{}',
	`transition_metrics` text DEFAULT '{}',
	`bottleneck_steps` text DEFAULT '[]',
	`common_paths` text DEFAULT '[]',
	`calculated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`procedure_id`) REFERENCES `procedure_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_procedure` ON `procedure_analytics` (`procedure_id`);--> statement-breakpoint
CREATE INDEX `idx_analytics_period` ON `procedure_analytics` (`period_type`,`period_start`);--> statement-breakpoint
CREATE TABLE `procedure_executions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`procedure_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`status` text DEFAULT 'pending',
	`current_step_ids` text DEFAULT '[]',
	`completed_step_count` integer DEFAULT 0,
	`total_step_count` integer DEFAULT 0,
	`progress_percent` integer DEFAULT 0,
	`started_at` integer,
	`completed_at` integer,
	`duration_minutes` integer,
	`target_completion_at` integer,
	`is_overdue` integer DEFAULT false,
	`assigned_user_id` text,
	`outcome` text,
	`outcome_type` text,
	`collected_data` text DEFAULT '{}',
	`contribute_to_learning` integer DEFAULT true,
	`triggered_by` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`procedure_id`) REFERENCES `procedure_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_executions_org` ON `procedure_executions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_executions_procedure` ON `procedure_executions` (`procedure_id`);--> statement-breakpoint
CREATE INDEX `idx_executions_entity` ON `procedure_executions` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_executions_status` ON `procedure_executions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_executions_assigned` ON `procedure_executions` (`assigned_user_id`);--> statement-breakpoint
CREATE TABLE `procedure_steps` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`procedure_id` text NOT NULL,
	`step_code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`step_type` text NOT NULL,
	`position_x` integer DEFAULT 0,
	`position_y` integer DEFAULT 0,
	`entry_conditions` text DEFAULT '{}',
	`exit_conditions` text DEFAULT '{}',
	`decision_options` text,
	`expected_duration_minutes` integer,
	`assigned_role_id` text,
	`assignment_rule` text,
	`creates_action_item` integer DEFAULT false,
	`action_item_type_id` text,
	`creates_meeting` integer DEFAULT false,
	`meeting_template_id` text,
	`sends_notification` integer DEFAULT false,
	`notification_template` text,
	`form_schema` text,
	`median_duration_minutes` integer,
	`percentile_90_duration_minutes` integer,
	`completion_rate` integer,
	`last_analytics_update` integer,
	`icon` text DEFAULT 'IconCircle',
	`color` text DEFAULT 'blue',
	`is_optional` integer DEFAULT false,
	`is_start_step` integer DEFAULT false,
	`is_end_step` integer DEFAULT false,
	`display_order` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`procedure_id`) REFERENCES `procedure_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_role_id`) REFERENCES `organizational_roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`action_item_type_id`) REFERENCES `action_item_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meeting_template_id`) REFERENCES `meeting_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_steps_procedure` ON `procedure_steps` (`procedure_id`);--> statement-breakpoint
CREATE INDEX `idx_steps_type` ON `procedure_steps` (`step_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_steps_code` ON `procedure_steps` (`procedure_id`,`step_code`);--> statement-breakpoint
CREATE TABLE `procedure_templates` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`category` text,
	`subcategory` text,
	`tags` text DEFAULT '[]',
	`entity_type` text,
	`trigger_condition` text,
	`version` integer DEFAULT 1,
	`parent_version_id` text,
	`status` text DEFAULT 'draft',
	`is_learnable` integer DEFAULT true,
	`learned_from_count` integer DEFAULT 0,
	`target_duration_hours` integer,
	`warning_threshold_percent` integer DEFAULT 80,
	`flowchart_config` text DEFAULT '{}',
	`wiki_page_id` text,
	`auto_update_wiki` integer DEFAULT true,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`published_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_procedures_org` ON `procedure_templates` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_procedures_entity` ON `procedure_templates` (`entity_type`);--> statement-breakpoint
CREATE INDEX `idx_procedures_status` ON `procedure_templates` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_procedures_slug` ON `procedure_templates` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `procedure_transitions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`procedure_id` text NOT NULL,
	`from_step_id` text NOT NULL,
	`to_step_id` text NOT NULL,
	`label` text,
	`condition` text,
	`priority` integer DEFAULT 0,
	`transition_count` integer DEFAULT 0,
	`transition_percentage` integer,
	`avg_time_to_transition_minutes` integer,
	`line_style` text DEFAULT 'solid',
	`color` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`procedure_id`) REFERENCES `procedure_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_step_id`) REFERENCES `procedure_steps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_step_id`) REFERENCES `procedure_steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_transitions_procedure` ON `procedure_transitions` (`procedure_id`);--> statement-breakpoint
CREATE INDEX `idx_transitions_from` ON `procedure_transitions` (`from_step_id`);--> statement-breakpoint
CREATE INDEX `idx_transitions_to` ON `procedure_transitions` (`to_step_id`);--> statement-breakpoint
CREATE TABLE `process_discovery_events` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_name` text NOT NULL,
	`event_data` text DEFAULT '{}',
	`actor_id` text,
	`actor_role` text,
	`occurred_at` integer DEFAULT (unixepoch()),
	`is_processed` integer DEFAULT false,
	`matched_procedure_id` text,
	`matched_step_id` text,
	`previous_event_id` text,
	`session_id` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_discovery_org` ON `process_discovery_events` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_discovery_entity` ON `process_discovery_events` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_discovery_time` ON `process_discovery_events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_discovery_session` ON `process_discovery_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_discovery_processed` ON `process_discovery_events` (`is_processed`);--> statement-breakpoint
CREATE TABLE `role_relationships` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`from_role_id` text NOT NULL,
	`to_role_id` text NOT NULL,
	`relationship_type` text NOT NULL,
	`requires_approval_from` text,
	`allowed_meeting_types` text DEFAULT '["internal"]',
	`max_duration_minutes` integer,
	`requires_notice` integer DEFAULT false,
	`notice_hours` integer DEFAULT 24,
	`is_active` integer DEFAULT true,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_role_id`) REFERENCES `organizational_roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_role_id`) REFERENCES `organizational_roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requires_approval_from`) REFERENCES `organizational_roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_role_rel_org` ON `role_relationships` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_role_rel_from` ON `role_relationships` (`from_role_id`);--> statement-breakpoint
CREATE INDEX `idx_role_rel_to` ON `role_relationships` (`to_role_id`);--> statement-breakpoint
CREATE TABLE `stakeholder_lifecycles` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`stages` text DEFAULT '[]',
	`procedure_ids` text DEFAULT '[]',
	`expected_duration_days` integer,
	`avg_lifecycle_days` integer,
	`median_lifecycle_days` integer,
	`completion_rate` integer,
	`diagram_config` text DEFAULT '{}',
	`wiki_page_id` text,
	`is_active` integer DEFAULT true,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lifecycle_org` ON `stakeholder_lifecycles` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_lifecycle_entity` ON `stakeholder_lifecycles` (`entity_type`);--> statement-breakpoint
CREATE TABLE `step_executions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`execution_id` text NOT NULL,
	`step_id` text NOT NULL,
	`status` text DEFAULT 'pending',
	`started_at` integer,
	`completed_at` integer,
	`duration_minutes` integer,
	`wait_time_minutes` integer DEFAULT 0,
	`performed_by` text,
	`decision_outcome` text,
	`transition_taken_id` text,
	`step_data` text DEFAULT '{}',
	`notes` text,
	`attempt_number` integer DEFAULT 1,
	`failure_reason` text,
	`created_action_item_id` text,
	`created_meeting_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`execution_id`) REFERENCES `procedure_executions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`step_id`) REFERENCES `procedure_steps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transition_taken_id`) REFERENCES `procedure_transitions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_step_exec_execution` ON `step_executions` (`execution_id`);--> statement-breakpoint
CREATE INDEX `idx_step_exec_step` ON `step_executions` (`step_id`);--> statement-breakpoint
CREATE INDEX `idx_step_exec_status` ON `step_executions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_step_exec_performer` ON `step_executions` (`performed_by`);--> statement-breakpoint
CREATE INDEX `idx_step_exec_timing` ON `step_executions` (`started_at`,`completed_at`);--> statement-breakpoint
CREATE TABLE `typing_indicators` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()),
	`expires_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_typing_unique` ON `typing_indicators` (`conversation_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `user_calendar_settings` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`default_view` text DEFAULT 'week',
	`week_starts_on` integer DEFAULT 0,
	`working_hours_start` text DEFAULT '08:00',
	`working_hours_end` text DEFAULT '18:00',
	`working_days` text DEFAULT '[1,2,3,4,5]',
	`default_reminder_minutes` integer DEFAULT 30,
	`enable_email_reminders` integer DEFAULT true,
	`enable_push_reminders` integer DEFAULT true,
	`google_calendar_token` text,
	`google_calendar_id` text,
	`outlook_calendar_token` text,
	`outlook_calendar_id` text,
	`sync_enabled` integer DEFAULT false,
	`last_sync_at` integer,
	`sync_direction` text DEFAULT 'both',
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_calendar_settings_user` ON `user_calendar_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_role_assignments` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`scope_type` text DEFAULT 'organization',
	`scope_id` text,
	`reports_to` text,
	`is_primary` integer DEFAULT false,
	`effective_from` integer DEFAULT (unixepoch()),
	`effective_until` integer,
	`assigned_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `organizational_roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reports_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_roles_user` ON `user_role_assignments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_roles_role` ON `user_role_assignments` (`role_id`);--> statement-breakpoint
CREATE INDEX `idx_user_roles_reports` ON `user_role_assignments` (`reports_to`);--> statement-breakpoint
CREATE TABLE `wiki_article_feedback` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`article_id` text NOT NULL,
	`user_id` text NOT NULL,
	`is_helpful` integer,
	`comment` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`article_id`) REFERENCES `wiki_articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_wiki_feedback_article` ON `wiki_article_feedback` (`article_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_feedback_user` ON `wiki_article_feedback` (`article_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `wiki_article_versions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`article_id` text NOT NULL,
	`version` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`change_notes` text,
	`editor_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`article_id`) REFERENCES `wiki_articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_wiki_version_article` ON `wiki_article_versions` (`article_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_version_unique` ON `wiki_article_versions` (`article_id`,`version`);--> statement-breakpoint
CREATE TABLE `wiki_articles` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text,
	`content` text NOT NULL,
	`content_format` text DEFAULT 'markdown',
	`status` text DEFAULT 'draft',
	`tags` text DEFAULT '[]',
	`keywords` text DEFAULT '[]',
	`version` integer DEFAULT 1,
	`view_count` integer DEFAULT 0,
	`helpful_count` integer DEFAULT 0,
	`not_helpful_count` integer DEFAULT 0,
	`related_article_ids` text DEFAULT '[]',
	`linked_procedure_id` text,
	`visibility` text DEFAULT 'inherit',
	`allowed_roles` text,
	`author_id` text,
	`last_editor_id` text,
	`reviewer_id` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`published_at` integer,
	`reviewed_at` integer,
	`embedding` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `wiki_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linked_procedure_id`) REFERENCES `procedure_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_wiki_article_org` ON `wiki_articles` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_wiki_article_category` ON `wiki_articles` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_wiki_article_status` ON `wiki_articles` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_article_slug` ON `wiki_articles` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `wiki_categories` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text DEFAULT 'IconBook',
	`color` text DEFAULT 'blue',
	`parent_id` text,
	`sort_order` integer DEFAULT 0,
	`visibility` text DEFAULT 'internal',
	`allowed_roles` text DEFAULT '[]',
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_wiki_cat_org` ON `wiki_categories` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_cat_slug` ON `wiki_categories` (`organization_id`,`slug`);--> statement-breakpoint
CREATE TABLE `wiki_pages` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`organization_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text,
	`content_html` text,
	`parent_page_id` text,
	`display_order` integer DEFAULT 0,
	`depth` integer DEFAULT 0,
	`category` text,
	`tags` text DEFAULT '[]',
	`source_type` text DEFAULT 'manual',
	`source_procedure_id` text,
	`source_lifecycle_id` text,
	`auto_update` integer DEFAULT false,
	`last_auto_update_at` integer,
	`flowchart_code` text,
	`includes_analytics` integer DEFAULT false,
	`status` text DEFAULT 'draft',
	`published_at` integer,
	`version` integer DEFAULT 1,
	`created_by` text,
	`last_edited_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_procedure_id`) REFERENCES `procedure_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_lifecycle_id`) REFERENCES `stakeholder_lifecycles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_edited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_wiki_org` ON `wiki_pages` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_wiki_parent` ON `wiki_pages` (`parent_page_id`);--> statement-breakpoint
CREATE INDEX `idx_wiki_category` ON `wiki_pages` (`category`);--> statement-breakpoint
CREATE INDEX `idx_wiki_source` ON `wiki_pages` (`source_type`,`source_procedure_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_slug` ON `wiki_pages` (`organization_id`,`slug`);