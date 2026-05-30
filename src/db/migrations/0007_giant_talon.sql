CREATE TABLE `flashcard_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`seen_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `flashcards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_flashcard_views_card_user` ON `flashcard_views` (`card_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_flashcard_views_user` ON `flashcard_views` (`user_id`);--> statement-breakpoint
ALTER TABLE `flashcards` DROP COLUMN `last_seen_at`;