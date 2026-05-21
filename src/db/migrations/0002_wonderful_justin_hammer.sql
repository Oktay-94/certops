CREATE TABLE `flashcards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cert` text NOT NULL,
	`domain` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`difficulty` integer,
	`source_ref` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_flashcards_cert` ON `flashcards` (`cert`);--> statement-breakpoint
CREATE INDEX `idx_flashcards_cert_domain` ON `flashcards` (`cert`,`domain`);