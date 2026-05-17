CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cert` text NOT NULL,
	`domain` text NOT NULL,
	`type` text NOT NULL,
	`prompt` text NOT NULL,
	`choices` text NOT NULL,
	`correct` text NOT NULL,
	`explanation` text NOT NULL,
	`difficulty` integer,
	`source_ref` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_questions_cert` ON `questions` (`cert`);--> statement-breakpoint
CREATE INDEX `idx_questions_cert_domain` ON `questions` (`cert`,`domain`);