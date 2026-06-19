CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestId` varchar(64),
	`event` varchar(128) NOT NULL,
	`page` varchar(128),
	`label` varchar(256),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `morning_briefing_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `morning_briefing_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `morning_briefing_cache_dateKey_unique` UNIQUE(`dateKey`)
);
