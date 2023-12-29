CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);