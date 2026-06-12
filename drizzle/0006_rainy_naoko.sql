ALTER TABLE `chat_messages` MODIFY COLUMN `userId` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `picks` MODIFY COLUMN `userId` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `rounds` MODIFY COLUMN `userId` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `wally_memories` MODIFY COLUMN `userId` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `guestId` varchar(64);--> statement-breakpoint
ALTER TABLE `picks` ADD `guestId` varchar(64);--> statement-breakpoint
ALTER TABLE `picks` ADD `tournamentStartDate` varchar(32);--> statement-breakpoint
ALTER TABLE `picks` ADD `isLocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rounds` ADD `guestId` varchar(64);--> statement-breakpoint
ALTER TABLE `wally_memories` ADD `guestId` varchar(64);