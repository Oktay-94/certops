ALTER TABLE `question_attempts` ADD `round_id` text;--> statement-breakpoint
CREATE INDEX `idx_question_attempts_round` ON `question_attempts` (`round_id`);