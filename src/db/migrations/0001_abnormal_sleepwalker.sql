CREATE TABLE `question_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`selected` text NOT NULL,
	`correct` integer NOT NULL,
	`session_id` text NOT NULL,
	`time_taken_ms` integer,
	`answered_at` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_question_attempts_session` ON `question_attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_question_attempts_question` ON `question_attempts` (`question_id`);