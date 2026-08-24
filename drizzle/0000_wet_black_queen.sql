CREATE TABLE `reading_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`reading_id` text NOT NULL,
	`position_index` integer NOT NULL,
	`position_key` text NOT NULL,
	`position_label` text NOT NULL,
	`card_key` text NOT NULL,
	`orientation` text NOT NULL,
	`revealed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`reading_id`) REFERENCES `readings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reading_cards_position` ON `reading_cards` (`reading_id`,`position_index`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reading_cards_card` ON `reading_cards` (`reading_id`,`card_key`);--> statement-breakpoint
CREATE INDEX `idx_reading_cards_reading` ON `reading_cards` (`reading_id`);--> statement-breakpoint
CREATE TABLE `readings` (
	`id` text PRIMARY KEY NOT NULL,
	`journey_key_hash` text NOT NULL,
	`resume_token_hash` text NOT NULL,
	`question_hash` text NOT NULL,
	`status` text NOT NULL,
	`category` text NOT NULL,
	`advisor` text NOT NULL,
	`core_tension` text NOT NULL,
	`reframed_question` text NOT NULL,
	`safety_domain` text NOT NULL,
	`safety_action` text NOT NULL,
	`safety_message` text,
	`spread_title` text NOT NULL,
	`spread_json` text NOT NULL,
	`draw_seed` text NOT NULL,
	`interpretation_json` text,
	`reflection_ciphertext` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_readings_resume_token` ON `readings` (`resume_token_hash`);--> statement-breakpoint
CREATE INDEX `idx_readings_journey_created` ON `readings` (`journey_key_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_readings_status` ON `readings` (`status`);