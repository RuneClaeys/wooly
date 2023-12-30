CREATE TABLE `parts` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`count` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`project_id` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
