CREATE TABLE `family_drops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromName` varchar(128) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_drops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wally_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('course','moment','player','note','bucket_list') NOT NULL DEFAULT 'note',
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wally_memories_id` PRIMARY KEY(`id`)
);
