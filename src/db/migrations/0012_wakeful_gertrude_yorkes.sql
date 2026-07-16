CREATE TABLE `scripts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cert` text NOT NULL,
	`seed_key` text NOT NULL,
	`service` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`domains` text NOT NULL,
	`batch` text NOT NULL,
	`source_ref` text,
	`content` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_scripts_seed_key` ON `scripts` (`seed_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_scripts_cert_slug` ON `scripts` (`cert`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_scripts_cert` ON `scripts` (`cert`);