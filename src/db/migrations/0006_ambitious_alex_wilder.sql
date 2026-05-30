ALTER TABLE `question_attempts` ADD `user_id` text;--> statement-breakpoint
CREATE INDEX `idx_question_attempts_user` ON `question_attempts` (`user_id`);