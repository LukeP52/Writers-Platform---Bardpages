CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`alt` text,
	`caption` text,
	`size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`width` integer,
	`height` integer,
	`is_hero` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
