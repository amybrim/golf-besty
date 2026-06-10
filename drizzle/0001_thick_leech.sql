CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tournamentId` varchar(128) NOT NULL,
	`tournamentName` varchar(256) NOT NULL,
	`playerName` varchar(128) NOT NULL,
	`playerId` varchar(64),
	`aiPickPlayerName` varchar(128),
	`isCorrect` boolean DEFAULT false,
	`aiIsCorrect` boolean DEFAULT false,
	`isResolved` boolean DEFAULT false,
	`actualWinner` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `picks_id` PRIMARY KEY(`id`)
);
