CREATE TABLE `access_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`organization` text,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedBy` text,
	`reviewedAt` integer,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `hearing_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`earTested` text NOT NULL,
	`ptaAverage` real,
	`hfaAverage` real,
	`classification` text,
	`audiogramPattern` text,
	`assessment` text NOT NULL,
	`recommendations` text,
	`createdAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `hearing_screening_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sessionDate` integer DEFAULT (unixepoch()) NOT NULL,
	`ageGroup` text NOT NULL,
	`calibrated` integer DEFAULT false,
	`calibrationData` text,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()),
	`updatedAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `photoscreening_results` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`redReflexLeft` text NOT NULL,
	`redReflexRight` text NOT NULL,
	`eyeAlignment` text NOT NULL,
	`pupilSymmetry` text NOT NULL,
	`confidence` integer NOT NULL,
	`imageUrl` text,
	`assessment` text NOT NULL,
	`concerns` text,
	`recommendations` text,
	`createdAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `pure_tone_audiometry_results` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`earTested` text NOT NULL,
	`frequency` integer NOT NULL,
	`thresholdDbHL` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `speech_in_noise_results` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`snrLevel` integer NOT NULL,
	`percentCorrect` integer NOT NULL,
	`wordsPresented` integer NOT NULL,
	`wordsCorrect` integer NOT NULL,
	`assessment` text NOT NULL,
	`recommendations` text,
	`createdAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`subscriptionTier` text DEFAULT 'none' NOT NULL,
	`subscriptionStatus` text DEFAULT 'inactive' NOT NULL,
	`subscriptionStartDate` integer,
	`subscriptionEndDate` integer,
	`screeningsRemaining` integer DEFAULT 0,
	`whitelistStatus` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`lastSignedIn` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `vision_screening_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sessionDate` integer DEFAULT (unixepoch()) NOT NULL,
	`ageGroup` text NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()),
	`updatedAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `visual_acuity_results` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`eyeTested` text NOT NULL,
	`acuityMeasurement` text NOT NULL,
	`acuityDecimal` real,
	`testMethod` text NOT NULL,
	`distanceMeters` real NOT NULL,
	`percentCorrect` integer,
	`assessment` text NOT NULL,
	`severity` text,
	`recommendations` text,
	`createdAt` integer DEFAULT (unixepoch())
);
