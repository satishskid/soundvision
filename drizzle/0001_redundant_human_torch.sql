CREATE TABLE `hearing_screening_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`sessionDate` timestamp NOT NULL DEFAULT (now()),
	`ageGroup` enum('0-2','3-5','6-12','13-18','18+') NOT NULL,
	`environmentNoise` int,
	`calibrationStatus` enum('not_calibrated','calibrated','needs_recalibration') DEFAULT 'not_calibrated',
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hearing_screening_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photoscreening_results` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`eyeSide` enum('left','right','both') NOT NULL,
	`redReflexStatus` enum('normal','abnormal','unclear'),
	`eyeAlignment` enum('normal','esotropia','exotropia','unclear'),
	`refractionEstimate` varchar(50),
	`imageUrl` text,
	`confidence` int,
	`flaggedForReview` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `photoscreening_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pure_tone_audiometry_results` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`earSide` enum('left','right') NOT NULL,
	`frequency` int NOT NULL,
	`threshold` int NOT NULL,
	`conduction` enum('air','bone') NOT NULL,
	`flaggedForReview` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `pure_tone_audiometry_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screening_summary_reports` (
	`id` varchar(64) NOT NULL,
	`visionSessionId` varchar(64),
	`hearingSessionId` varchar(64),
	`userId` varchar(64) NOT NULL,
	`overallStatus` enum('pass','refer','inconclusive') NOT NULL,
	`visionStatus` enum('pass','refer','inconclusive','not_tested'),
	`hearingStatus` enum('pass','refer','inconclusive','not_tested'),
	`visionRecommendations` text,
	`hearingRecommendations` text,
	`followUpRequired` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `screening_summary_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `speech_in_noise_results` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`testType` enum('quick_sin','azbio','hint','custom') NOT NULL,
	`signalNoiseRatio` int,
	`percentCorrect` int NOT NULL,
	`wordsPresented` int,
	`wordsCorrect` int,
	`presentationLevel` int,
	`flaggedForReview` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `speech_in_noise_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vision_screening_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`sessionDate` timestamp NOT NULL DEFAULT (now()),
	`ageGroup` enum('0-2','3-5','6-12','13-18','18+') NOT NULL,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vision_screening_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visual_acuity_results` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`eyeSide` enum('left','right','both') NOT NULL,
	`acuityMeasurement` varchar(20) NOT NULL,
	`acuityDecimal` decimal(3,2),
	`testMethod` enum('snellen','tumbling_e','lea_symbols','picture_matching') NOT NULL,
	`distanceMeters` int NOT NULL,
	`correctionUsed` boolean DEFAULT false,
	`correctionType` varchar(50),
	`flaggedForReview` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `visual_acuity_results_id` PRIMARY KEY(`id`)
);
