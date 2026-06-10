CREATE TABLE `rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseName` varchar(256) NOT NULL,
	`score` int NOT NULL,
	`par` int NOT NULL DEFAULT 72,
	`tees` varchar(64),
	`notes` text,
	`wallyReaction` text,
	`playedAt` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rounds_id` PRIMARY KEY(`id`)
);
