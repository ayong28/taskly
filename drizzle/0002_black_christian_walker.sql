PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_boards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`color` text DEFAULT 'slate' NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_boards`("id", "title", "color", "archived", "created_at") SELECT "id", "title", "color", "archived", "created_at" FROM `boards`;--> statement-breakpoint
DROP TABLE `boards`;--> statement-breakpoint
ALTER TABLE `__new_boards` RENAME TO `boards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;