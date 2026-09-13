-- LandPredict AI MySQL Database Schema
-- Ministry of Road Transport & Highways

CREATE DATABASE IF NOT EXISTS landpredict DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE landpredict;

-- Table: users
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: projects
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `land_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `land_area_acres` float NOT NULL,
  `affected_families` int NOT NULL,
  `num_departments_involved` int NOT NULL,
  `notification_age_days` int NOT NULL,
  `acquisition_stage` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `compensation_status` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `compensation_disbursed_pct` float NOT NULL,
  `possession_status` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_disputes_count` int NOT NULL,
  `court_case_pending` int NOT NULL,
  `rehabilitation_required` int NOT NULL,
  `rehabilitation_progress_pct` float NOT NULL,
  `stakeholder_responsiveness_score` float NOT NULL,
  `historical_dept_performance_score` float NOT NULL,
  `public_objections_count` int NOT NULL,
  `pending_approvals_count` int NOT NULL,
  `budget_utilization_pct` float NOT NULL,
  `monsoon_season_overlap` int NOT NULL,
  `delay_days` int NOT NULL,
  `is_delayed` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `risk_score` float DEFAULT NULL,
  `risk_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prediction_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_projects_project_id` (`project_id`),
  KEY `owner_user_id` (`owner_user_id`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=305 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: portal_registry
CREATE TABLE `portal_registry` (
  `id` varchar(50) NOT NULL,
  `state` varchar(80) NOT NULL,
  `portal_name` varchar(150) NOT NULL,
  `department` varchar(255) NOT NULL,
  `portal_url` varchar(255) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ONLINE',
  `latency_ms` int NOT NULL DEFAULT '45',
  `total_parcels` varchar(80) DEFAULT NULL,
  `last_synced_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: automation_sync_logs
CREATE TABLE `automation_sync_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `source` varchar(100) NOT NULL,
  `sync_type` varchar(50) NOT NULL,
  `records_synced` int NOT NULL DEFAULT '0',
  `layers_synced` int NOT NULL DEFAULT '0',
  `portals_active` int NOT NULL DEFAULT '12',
  `conflicts_detected` int NOT NULL DEFAULT '0',
  `status` varchar(50) NOT NULL,
  `summary` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: predictions
CREATE TABLE `predictions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `delay_probability` float NOT NULL,
  `predicted_delayed` int NOT NULL,
  `risk_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimated_delay` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_predictions_user_id` (`user_id`),
  KEY `ix_predictions_project_id` (`project_id`),
  CONSTRAINT `predictions_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `predictions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

