CREATE TABLE `exam_status` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`cert` text NOT NULL,
	`exam_date` integer NOT NULL,
	`result` text DEFAULT 'pending' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_exam_status_user_cert` ON `exam_status` (`user_id`,`cert`);