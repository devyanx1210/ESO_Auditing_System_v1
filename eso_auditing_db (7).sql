-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 16, 2026 at 06:13 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `eso_auditing_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `id` int(10) UNSIGNED NOT NULL,
  `label` varchar(20) NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `position` varchar(150) NOT NULL,
  `program_id` int(10) UNSIGNED DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `year_level` tinyint(3) UNSIGNED DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL,
  `avatar_path` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `user_id`, `position`, `program_id`, `deleted_at`, `created_at`, `updated_at`, `year_level`, `section`, `avatar_path`) VALUES
(1, 1, 'System Administrator', NULL, NULL, '2026-03-11 12:55:00', '2026-03-25 07:20:34', NULL, NULL, '/uploads/avatars/1774423234198-601821789.jpg'),
(2, 4, 'Class President', 1, NULL, '2026-03-12 02:24:14', '2026-03-12 02:24:14', NULL, NULL, NULL),
(3, 5, 'None', 1, NULL, '2026-03-12 06:11:12', '2026-03-12 06:11:12', NULL, NULL, NULL),
(4, 6, 'none', 1, NULL, '2026-03-12 06:11:38', '2026-03-12 06:11:38', NULL, NULL, NULL),
(5, 7, 'President', 1, NULL, '2026-03-20 01:35:32', '2026-03-26 06:32:15', NULL, NULL, NULL),
(6, 8, 'Program Head', 1, NULL, '2026-03-20 01:36:42', '2026-03-26 06:31:04', NULL, NULL, NULL),
(7, 9, 'Dean', NULL, NULL, '2026-03-20 01:37:21', '2026-04-08 04:35:08', NULL, NULL, NULL),
(8, 1158, 'Treasurer', 1, NULL, '2026-03-26 06:31:57', '2026-03-26 06:31:57', NULL, NULL, NULL),
(9, 1159, 'none', NULL, NULL, '2026-03-26 06:38:27', '2026-03-26 06:38:27', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `admissions`
--

CREATE TABLE `admissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `curriculum_id` int(10) UNSIGNED NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `audit_id` bigint(20) UNSIGNED NOT NULL,
  `performed_by` int(10) UNSIGNED NOT NULL,
  `action` varchar(100) NOT NULL,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` int(10) UNSIGNED DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `budget_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `allocated_amount` decimal(10,2) NOT NULL,
  `semester` tinyint(3) UNSIGNED NOT NULL COMMENT '1=1st, 2=2nd, 3=Summer',
  `school_year` varchar(20) NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clearances`
--

CREATE TABLE `clearances` (
  `clearance_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `school_year` varchar(10) NOT NULL,
  `semester` tinyint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=1st 2=2nd 3=Summer',
  `clearance_status` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=pending 1=in_progress 2=cleared 3=rejected',
  `current_step` tinyint(3) UNSIGNED DEFAULT NULL,
  `generated_at` date DEFAULT NULL,
  `is_printed` tinyint(1) NOT NULL DEFAULT 0,
  `printed_at` timestamp NULL DEFAULT NULL,
  `printed_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clearances`
--

INSERT INTO `clearances` (`clearance_id`, `student_id`, `school_year`, `semester`, `clearance_status`, `current_step`, `generated_at`, `is_printed`, `printed_at`, `printed_by`, `created_at`, `updated_at`) VALUES
(2, 3, '2025-2026', 2, 1, 5, NULL, 0, NULL, NULL, '2026-04-01 01:00:00', '2026-04-07 06:00:00'),
(3, 4, '2025-2026', 2, 1, 1, NULL, 0, NULL, NULL, '2026-04-01 01:10:00', '2026-04-14 04:33:27'),
(4, 5, '2025-2026', 2, 1, 5, NULL, 0, NULL, NULL, '2026-04-02 02:00:00', '2026-04-07 07:00:00'),
(5, 6, '2025-2026', 2, 1, 6, NULL, 0, NULL, NULL, '2026-03-31 01:00:00', '2026-04-06 06:00:00'),
(6, 7, '2025-2026', 2, 1, 6, NULL, 0, NULL, NULL, '2026-03-31 01:20:00', '2026-04-06 06:30:00'),
(12, 12, '2025-2026', 2, 1, 1, NULL, 0, NULL, NULL, '2026-04-06 01:00:00', '2026-04-06 01:00:00'),
(13, 13, '2025-2026', 2, 1, 1, NULL, 0, NULL, NULL, '2026-04-06 01:10:00', '2026-04-06 01:10:00'),
(14, 14, '2025-2026', 2, 1, 1, NULL, 0, NULL, NULL, '2026-04-06 01:20:00', '2026-04-06 01:20:00'),
(15, 15, '2025-2026', 2, 1, 2, NULL, 0, NULL, NULL, '2026-04-05 01:00:00', '2026-04-06 02:00:00'),
(16, 16, '2025-2026', 2, 1, 2, NULL, 0, NULL, NULL, '2026-04-05 01:10:00', '2026-04-06 02:10:00'),
(17, 17, '2025-2026', 2, 1, 2, NULL, 0, NULL, NULL, '2026-04-05 01:20:00', '2026-04-06 02:20:00'),
(18, 18, '2025-2026', 2, 1, 4, NULL, 0, NULL, NULL, '2026-04-04 01:00:00', '2026-04-14 04:33:32'),
(19, 19, '2025-2026', 2, 1, 3, NULL, 0, NULL, NULL, '2026-04-04 01:10:00', '2026-04-06 03:10:00'),
(20, 20, '2025-2026', 2, 1, 3, NULL, 0, NULL, NULL, '2026-04-04 01:20:00', '2026-04-06 03:20:00'),
(21, 21, '2025-2026', 2, 1, 4, NULL, 0, NULL, NULL, '2026-04-03 01:00:00', '2026-04-07 01:00:00'),
(22, 22, '2025-2026', 2, 1, 4, NULL, 0, NULL, NULL, '2026-04-03 01:10:00', '2026-04-07 01:10:00'),
(23, 23, '2025-2026', 2, 1, 4, NULL, 0, NULL, NULL, '2026-04-03 01:20:00', '2026-04-07 01:20:00');

-- --------------------------------------------------------

--
-- Table structure for table `clearance_verifications`
--

CREATE TABLE `clearance_verifications` (
  `clearance_verification_id` int(10) UNSIGNED NOT NULL,
  `clearance_id` int(10) UNSIGNED NOT NULL,
  `admin_id` int(10) UNSIGNED NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `step_order` tinyint(3) UNSIGNED NOT NULL,
  `status` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=pending 1=signed 2=rejected',
  `remarks` varchar(255) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clearance_verifications`
--

INSERT INTO `clearance_verifications` (`clearance_verification_id`, `clearance_id`, `admin_id`, `role_id`, `step_order`, `status`, `remarks`, `verified_at`, `created_at`) VALUES
(3, 2, 5, 3, 1, 1, NULL, '2026-04-01 01:15:00', '2026-04-01 01:15:00'),
(4, 2, 8, 8, 2, 1, NULL, '2026-04-02 02:00:00', '2026-04-02 02:00:00'),
(5, 2, 1, 2, 3, 1, NULL, '2026-04-04 03:00:00', '2026-04-04 03:00:00'),
(6, 2, 9, 5, 4, 1, NULL, '2026-04-07 05:00:00', '2026-04-07 05:00:00'),
(7, 3, 5, 3, 1, 1, NULL, '2026-04-01 01:20:00', '2026-04-01 01:20:00'),
(8, 3, 8, 8, 2, 1, NULL, '2026-04-02 02:30:00', '2026-04-02 02:30:00'),
(9, 3, 1, 2, 3, 1, NULL, '2026-04-04 03:30:00', '2026-04-04 03:30:00'),
(10, 3, 9, 5, 4, 1, NULL, '2026-04-07 05:30:00', '2026-04-07 05:30:00'),
(11, 4, 5, 3, 1, 1, NULL, '2026-04-02 02:15:00', '2026-04-02 02:15:00'),
(12, 4, 8, 8, 2, 1, NULL, '2026-04-03 01:30:00', '2026-04-03 01:30:00'),
(13, 4, 1, 2, 3, 1, NULL, '2026-04-05 02:00:00', '2026-04-05 02:00:00'),
(14, 4, 9, 5, 4, 1, NULL, '2026-04-07 06:00:00', '2026-04-07 06:00:00'),
(15, 5, 5, 3, 1, 1, NULL, '2026-03-31 01:30:00', '2026-03-31 01:30:00'),
(16, 5, 8, 8, 2, 1, NULL, '2026-04-01 02:00:00', '2026-04-01 02:00:00'),
(17, 5, 1, 2, 3, 1, NULL, '2026-04-02 03:00:00', '2026-04-02 03:00:00'),
(18, 5, 9, 5, 4, 1, NULL, '2026-04-04 05:00:00', '2026-04-04 05:00:00'),
(19, 5, 6, 4, 5, 1, NULL, '2026-04-06 05:30:00', '2026-04-06 05:30:00'),
(20, 6, 5, 3, 1, 1, NULL, '2026-03-31 01:45:00', '2026-03-31 01:45:00'),
(21, 6, 8, 8, 2, 1, NULL, '2026-04-01 02:30:00', '2026-04-01 02:30:00'),
(22, 6, 1, 2, 3, 1, NULL, '2026-04-02 03:30:00', '2026-04-02 03:30:00'),
(23, 6, 9, 5, 4, 1, NULL, '2026-04-04 05:30:00', '2026-04-04 05:30:00'),
(24, 6, 6, 4, 5, 1, NULL, '2026-04-06 06:00:00', '2026-04-06 06:00:00'),
(47, 15, 5, 3, 1, 1, NULL, '2026-04-06 01:30:00', '2026-04-06 01:30:00'),
(48, 16, 5, 3, 1, 1, NULL, '2026-04-06 01:30:00', '2026-04-06 01:30:00'),
(49, 17, 5, 3, 1, 1, NULL, '2026-04-06 01:30:00', '2026-04-06 01:30:00'),
(50, 18, 5, 3, 1, 1, NULL, '2026-04-05 01:30:00', '2026-04-05 01:30:00'),
(51, 19, 5, 3, 1, 1, NULL, '2026-04-05 01:30:00', '2026-04-05 01:30:00'),
(52, 20, 5, 3, 1, 1, NULL, '2026-04-05 01:30:00', '2026-04-05 01:30:00'),
(53, 18, 8, 8, 2, 1, NULL, '2026-04-06 02:00:00', '2026-04-06 02:00:00'),
(54, 19, 8, 8, 2, 1, NULL, '2026-04-06 02:00:00', '2026-04-06 02:00:00'),
(55, 20, 8, 8, 2, 1, NULL, '2026-04-06 02:00:00', '2026-04-06 02:00:00'),
(56, 21, 5, 3, 1, 1, NULL, '2026-04-04 01:30:00', '2026-04-04 01:30:00'),
(57, 22, 5, 3, 1, 1, NULL, '2026-04-04 01:30:00', '2026-04-04 01:30:00'),
(58, 23, 5, 3, 1, 1, NULL, '2026-04-04 01:30:00', '2026-04-04 01:30:00'),
(59, 21, 8, 8, 2, 1, NULL, '2026-04-05 02:00:00', '2026-04-05 02:00:00'),
(60, 22, 8, 8, 2, 1, NULL, '2026-04-05 02:00:00', '2026-04-05 02:00:00'),
(61, 23, 8, 8, 2, 1, NULL, '2026-04-05 02:00:00', '2026-04-05 02:00:00'),
(62, 21, 1, 2, 3, 1, NULL, '2026-04-06 03:00:00', '2026-04-06 03:00:00'),
(63, 22, 1, 2, 3, 1, NULL, '2026-04-06 03:00:00', '2026-04-06 03:00:00'),
(64, 23, 1, 2, 3, 1, NULL, '2026-04-06 03:00:00', '2026-04-06 03:00:00'),
(65, 18, 1, 2, 3, 1, '', '2026-04-14 04:33:32', '2026-04-14 04:33:32');

-- --------------------------------------------------------

--
-- Table structure for table `curriculums`
--

CREATE TABLE `curriculums` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `program_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_templates`
--

CREATE TABLE `document_templates` (
  `template_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `content` longtext NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `pdf_path` varchar(500) DEFAULT NULL,
  `field_positions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`field_positions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_templates`
--

INSERT INTO `document_templates` (`template_id`, `name`, `content`, `is_default`, `created_by`, `created_at`, `updated_at`, `pdf_path`, `field_positions`) VALUES
(7, 'asd', '', 0, 1, '2026-04-02 11:46:04', '2026-04-10 07:46:07', 'C:\\Users\\Ian\\OneDrive\\Documents\\OJT_Project\\ESO_Auditing_System_v1\\server\\uploads\\pdf-templates\\1775120096065-733910795.pdf', '{\"full_name\":{\"x\":72,\"y\":160,\"size\":12},\"student_no\":{\"x\":72,\"y\":184,\"size\":12},\"program\":{\"x\":72,\"y\":208,\"size\":12},\"year_section\":{\"x\":72,\"y\":232,\"size\":12},\"school_year\":{\"x\":72,\"y\":256,\"size\":12},\"semester\":{\"x\":72,\"y\":280,\"size\":12},\"date\":{\"x\":72,\"y\":304,\"size\":12}}'),
(8, 'New Template', '<p style=\"text-align:center\"><strong>STUDENT CLEARANCE</strong></p><p><br></p><p>This certifies that <strong>{{full_name}}</strong> ({{student_no}}), a {{year_section}} student of <strong>{{program}}</strong>, has been cleared of all ESO obligations for School Year <strong>{{school_year}}</strong>, Semester <strong>{{semester}}</strong>.</p><p><br></p><p>Issued on {{date}}.</p>', 0, 1, '2026-04-02 16:57:40', '2026-04-02 16:57:40', 'C:\\Users\\Ian\\OneDrive\\Documents\\OJT_Project\\ESO_Auditing_System_v1\\server\\uploads\\pdf-templates\\1775120260860-615446735.pdf', NULL),
(9, 'New Template', '<p style=\"text-align:center\"><strong>STUDENT CLEARANCE</strong></p><p><br></p><p>This certifies that <strong>{{full_name}}</strong> ({{student_no}}), a {{year_section}} student of <strong>{{program}}</strong>, has been cleared of all ESO obligations for School Year <strong>{{school_year}}</strong>, Semester <strong>{{semester}}</strong>.</p><p><br></p><p>Issued on {{date}}.</p>', 0, 1, '2026-04-10 07:46:25', '2026-04-16 09:20:49', 'C:\\Users\\Ian\\OneDrive\\Documents\\OJT_Project\\ESO_Auditing_System_v1\\server\\uploads\\pdf-templates\\1775778385619-955916296.pdf', '{\"full_name\":{\"x\":212,\"y\":508,\"size\":12},\"student_no\":{\"x\":140,\"y\":600,\"size\":12},\"program\":{\"x\":384,\"y\":518,\"size\":12},\"year_section\":{\"x\":418,\"y\":513,\"size\":12},\"school_year\":{\"x\":397,\"y\":374,\"size\":12},\"semester\":{\"x\":352,\"y\":372,\"size\":12},\"date\":{\"x\":92,\"y\":507,\"size\":12}}');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `semester` tinyint(3) UNSIGNED NOT NULL COMMENT '1=1st, 2=2nd, 3=Summer',
  `school_year` varchar(20) NOT NULL COMMENT 'e.g. 2024-2025',
  `recorded_by` int(10) UNSIGNED NOT NULL,
  `receipt_path` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guardian`
--

CREATE TABLE `guardian` (
  `guardian_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `guardian_name` varchar(50) DEFAULT NULL,
  `contact_number` varchar(12) DEFAULT NULL,
  `address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `guardian`
--

INSERT INTO `guardian` (`guardian_id`, `student_id`, `guardian_name`, `contact_number`, `address`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, NULL, NULL, '2026-04-10 00:33:02', '2026-04-10 00:33:02');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(50) NOT NULL,
  `message` varchar(100) NOT NULL,
  `type` tinyint(3) UNSIGNED NOT NULL COMMENT '1=obligation_assigned 2=payment_submitted 3=payment_approved 4=payment_rejected 5=payment_returned 6=clearance_signed 7=clearance_cleared 8=clearance_unapproved 9=account_status',
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `type`, `reference_id`, `reference_type`, `is_read`, `created_at`) VALUES
(1, 2, 'New Obligation Assigned', 'You have a new obligation: ESO Shirt Fee (₱120)', 1, 1, 'obligation', 1, '2026-03-11 13:32:13'),
(2, 2, 'New Obligation Assigned', 'New obligation: adsada — ₱12', 1, 2, 'obligation', 0, '2026-03-11 21:09:49'),
(3, 2, 'Cash Payment Recorded', 'Your cash payment of ₱12 for \"adsada\" has been recorded.', 6, 2, 'payment', 0, '2026-03-12 02:18:03'),
(4, 2, 'Payment Approved', 'Your GCash payment for \"ESO Shirt Fee\" has been approved.', 6, 1, 'payment', 0, '2026-03-12 03:13:15'),
(5, 3, 'New Obligation Assigned', 'New obligation: adsada — ₱12.00', 1, 2, 'obligation', 1, '2026-03-12 22:08:33'),
(6, 3, 'New Obligation Assigned', 'New obligation: ESO Shirt Fee — ₱120.00', 1, 1, 'obligation', 1, '2026-03-12 22:08:42'),
(7, 3, 'Payment Approved', 'Your payment for \"adsada\" has been approved.', 6, 3, 'payment', 1, '2026-03-21 15:53:41'),
(8, 3, 'Payment Approved', 'Your payment for \"ESO Shirt Fee\" has been approved.', 6, 4, 'payment', 1, '2026-03-21 15:53:44'),
(9, 2, 'New Obligation Assigned', 'New obligation assigned: Awan', 1, 4, 'obligation', 0, '2026-03-22 03:21:01'),
(10, 3, 'New Obligation Assigned', 'New obligation assigned: Awan', 1, 4, 'obligation', 1, '2026-03-22 03:21:01'),
(11, 3, 'Payment Approved', 'Your payment for \"Awan\" has been approved.', 6, 6, 'payment', 1, '2026-03-22 06:23:38'),
(12, 3, 'Payment Approved', 'Your GCash payment for \"Awan\" has been approved.', 6, 5, 'payment', 1, '2026-03-22 06:56:47'),
(13, 2, 'New Obligation Assigned', 'New obligation assigned: Justin', 1, 5, 'obligation', 0, '2026-03-22 10:13:12'),
(14, 3, 'New Obligation Assigned', 'New obligation assigned: Justin', 1, 5, 'obligation', 1, '2026-03-22 10:13:12'),
(15, 2, 'New Obligation Assigned', 'New obligation assigned: Kiko', 1, 6, 'obligation', 0, '2026-03-22 10:13:29'),
(16, 3, 'New Obligation Assigned', 'New obligation assigned: Kiko', 1, 6, 'obligation', 1, '2026-03-22 10:13:29'),
(17, 2, 'Payment Unverified', 'Your payment for \"ESO Shirt Fee\" has been marked as unverified.', 7, 1, 'payment', 0, '2026-03-22 10:22:02'),
(18, 2, 'Payment Unverified', 'Your payment for \"adsada\" has been marked as unverified.', 7, 2, 'payment', 0, '2026-03-22 10:22:02'),
(19, 3, 'Payment Unverified', 'Your payment for \"adsada\" has been marked as unverified.', 7, 3, 'payment', 1, '2026-03-22 10:22:02'),
(20, 3, 'Payment Unverified', 'Your payment for \"ESO Shirt Fee\" has been marked as unverified.', 7, 4, 'payment', 1, '2026-03-22 10:22:02'),
(21, 3, 'Payment Unverified', 'Your payment for \"Awan\" has been marked as unverified.', 7, 5, 'payment', 1, '2026-03-22 10:22:02'),
(22, 3, 'Payment Unverified', 'Your payment for \"Awan\" has been marked as unverified.', 7, 6, 'payment', 1, '2026-03-22 10:22:02'),
(23, 2, 'Payment Returned for Review', 'Your payment for \"ESO Shirt Fee\" has been returned for re-review.', 0, 1, 'payment', 0, '2026-03-22 10:23:57'),
(24, 2, 'Payment Returned for Review', 'Your payment for \"adsada\" has been returned for re-review.', 0, 2, 'payment', 0, '2026-03-22 10:23:57'),
(25, 3, 'Payment Returned for Review', 'Your payment for \"adsada\" has been returned for re-review.', 0, 3, 'payment', 1, '2026-03-22 10:23:57'),
(26, 3, 'Payment Returned for Review', 'Your payment for \"ESO Shirt Fee\" has been returned for re-review.', 0, 4, 'payment', 1, '2026-03-22 10:23:57'),
(27, 3, 'Payment Returned for Review', 'Your payment for \"Awan\" has been returned for re-review.', 0, 5, 'payment', 1, '2026-03-22 10:23:57'),
(28, 3, 'Payment Returned for Review', 'Your payment for \"Awan\" has been returned for re-review.', 0, 6, 'payment', 1, '2026-03-22 10:23:57'),
(29, 2, 'Payment Approved', 'Your payment for \"ESO Shirt Fee\" has been approved.', 6, 1, 'payment', 0, '2026-03-23 10:47:21'),
(30, 2, 'Cash Payment Recorded', 'Your cash payment of ₱0.43 for \"adsada\" has been recorded.', 6, 7, 'payment', 0, '2026-03-23 10:47:41'),
(31, 2, 'Cash Payment Recorded', 'Your cash payment of ₱0.47 for \"Kiko\" has been recorded.', 6, 8, 'payment', 0, '2026-03-23 10:47:49'),
(34, 2, 'New Obligation Assigned', 'New obligation assigned: Rest', 1, 8, 'obligation', 0, '2026-03-24 12:12:00'),
(35, 3, 'New Obligation Assigned', 'New obligation assigned: Rest', 1, 8, 'obligation', 1, '2026-03-24 12:12:00'),
(36, 2, 'New Obligation Assigned', 'New obligation assigned: Seto', 1, 11, 'obligation', 0, '2026-03-24 12:12:28'),
(37, 3, 'New Obligation Assigned', 'New obligation assigned: Seto', 1, 11, 'obligation', 1, '2026-03-24 12:12:28'),
(38, 2, 'New Obligation Assigned', 'New obligation assigned: Ris', 1, 12, 'obligation', 0, '2026-03-24 13:24:53'),
(39, 3, 'New Obligation Assigned', 'New obligation assigned: Ris', 1, 12, 'obligation', 1, '2026-03-24 13:24:53'),
(40, 2, 'Obligation Removed', 'The obligation \"Ris\" has been removed.', 3, 12, 'obligation', 0, '2026-03-26 05:46:19'),
(41, 3, 'Obligation Removed', 'The obligation \"Ris\" has been removed.', 3, 12, 'obligation', 1, '2026-03-26 05:46:19'),
(42, 2, 'Obligation Removed', 'The obligation \"Seto\" has been removed.', 3, 11, 'obligation', 0, '2026-03-26 05:46:19'),
(43, 3, 'Obligation Removed', 'The obligation \"Seto\" has been removed.', 3, 11, 'obligation', 1, '2026-03-26 05:46:19'),
(44, 2, 'Obligation Removed', 'The obligation \"Rest\" has been removed.', 3, 8, 'obligation', 0, '2026-03-26 05:46:19'),
(45, 3, 'Obligation Removed', 'The obligation \"Rest\" has been removed.', 3, 8, 'obligation', 1, '2026-03-26 05:46:19'),
(46, 3, 'Obligation Removed', 'The obligation \"Kiko\" has been removed.', 3, 6, 'obligation', 1, '2026-03-26 05:46:19'),
(47, 2, 'Obligation Removed', 'The obligation \"Justin\" has been removed.', 3, 5, 'obligation', 0, '2026-03-26 05:46:19'),
(48, 3, 'Obligation Removed', 'The obligation \"Justin\" has been removed.', 3, 5, 'obligation', 1, '2026-03-26 05:46:19'),
(49, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 4, 'obligation', 0, '2026-03-26 05:46:19'),
(50, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 3, 'obligation', 0, '2026-03-26 05:46:19'),
(51, 3, 'Obligation Removed', 'The obligation \"Kiko\" has been removed.', 3, 6, 'obligation', 1, '2026-03-26 05:46:25'),
(52, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 4, 'obligation', 0, '2026-03-26 05:46:25'),
(53, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 3, 'obligation', 0, '2026-03-26 05:46:25'),
(54, 3, 'Obligation Removed', 'The obligation \"Kiko\" has been removed.', 3, 6, 'obligation', 1, '2026-03-26 05:49:26'),
(55, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 4, 'obligation', 0, '2026-03-26 05:49:26'),
(56, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 3, 'obligation', 0, '2026-03-26 05:49:26'),
(57, 3, 'Obligation Removed', 'The obligation \"Kiko\" has been removed.', 3, 6, 'obligation', 1, '2026-03-26 05:52:26'),
(58, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 4, 'obligation', 0, '2026-03-26 05:52:26'),
(59, 2, 'Obligation Removed', 'The obligation \"Awan\" has been removed.', 3, 3, 'obligation', 0, '2026-03-26 05:52:26'),
(60, 2, 'New Obligation Assigned', 'New obligation assigned: ESO Fee', 1, 13, 'obligation', 0, '2026-03-26 06:18:03'),
(61, 3, 'New Obligation Assigned', 'New obligation assigned: ESO Fee', 1, 13, 'obligation', 1, '2026-03-26 06:18:03'),
(62, 3, 'Cash Payment Recorded', 'Your cash payment of ₱150 for \"ESO Fee\" has been recorded.', 6, 9, 'payment', 1, '2026-03-26 06:18:25'),
(63, 3, 'Clearance Update', 'Your clearance has been signed at step 1. Proceeding to next step.', 9, 1, 'clearance', 1, '2026-03-26 06:19:09'),
(64, 3, 'Clearance Update', 'Your clearance has been signed at step 2. Proceeding to next step.', 9, 1, 'clearance', 1, '2026-03-26 06:33:06'),
(65, 3, 'Payment Returned for Review', 'Your payment for \"ESO Fee\" has been returned for re-review.', 5, 9, 'payment', 1, '2026-03-26 21:50:00'),
(66, 2, 'New Obligation Assigned', 'New obligation assigned: Org Shirt', 1, 14, 'obligation', 0, '2026-03-27 02:08:57'),
(67, 3, 'New Obligation Assigned', 'New obligation assigned: Org Shirt', 1, 14, 'obligation', 0, '2026-03-27 02:08:57'),
(68, 1164, 'New Obligation Assigned', 'New obligation assigned: Org Shirt', 1, 14, 'obligation', 0, '2026-03-27 02:08:57'),
(69, 1, 'Payment Submitted', 'A student submitted a payment receipt for: ESO Fee', 2, 10, 'payment', 0, '2026-03-27 02:11:54'),
(70, 3, 'Payment Approved', 'Your payment for \"ESO Fee\" has been approved.', 3, 10, 'payment', 0, '2026-03-27 02:25:32'),
(71, 2, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(72, 3, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(73, 1161, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(74, 1162, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(75, 1163, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(76, 1164, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(77, 1165, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(78, 1166, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(79, 1167, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(80, 1168, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(81, 1169, 'New Obligation Assigned', 'New obligation assigned: Eso fee', 1, 15, 'obligation', 0, '2026-04-08 06:21:14'),
(82, 1161, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, 2, 'clearance', 0, '2026-04-07 05:00:00'),
(83, 1162, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, 3, 'clearance', 0, '2026-04-07 05:30:00'),
(84, 1163, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, 4, 'clearance', 0, '2026-04-07 06:00:00'),
(85, 1164, 'Clearance Update', 'Your clearance has been approved at step 5. Proceeding to Dean.', 6, 5, 'clearance', 0, '2026-04-06 05:30:00'),
(86, 1165, 'Clearance Update', 'Your clearance has been approved at step 5. Proceeding to Dean.', 6, 6, 'clearance', 0, '2026-04-06 06:00:00'),
(87, 1161, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, 2, 'clearance', 0, '2026-04-07 05:00:00'),
(88, 1162, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, 3, 'clearance', 0, '2026-04-07 05:30:00'),
(89, 1163, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, 4, 'clearance', 0, '2026-04-07 06:00:00'),
(90, 1164, 'Clearance Update', 'Your clearance has been approved at step 5. Proceeding to Dean.', 6, 5, 'clearance', 0, '2026-04-06 05:30:00'),
(91, 1165, 'Clearance Update', 'Your clearance has been approved at step 5. Proceeding to Dean.', 6, 6, 'clearance', 0, '2026-04-06 06:00:00'),
(92, 2, 'Obligation Removed', 'The obligation \"Eso fee\" has been removed.', 3, 15, 'obligation', 0, '2026-04-09 23:57:58'),
(93, 3, 'Obligation Removed', 'The obligation \"Eso fee\" has been removed.', 3, 15, 'obligation', 0, '2026-04-09 23:57:58'),
(94, 1169, 'Obligation Removed', 'The obligation \"Eso fee\" has been removed.', 3, 15, 'obligation', 0, '2026-04-09 23:57:58'),
(95, 1182, 'Obligation Removed', 'The obligation \"Eso fee\" has been removed.', 3, 15, 'obligation', 0, '2026-04-09 23:57:58'),
(96, 1183, 'Obligation Removed', 'The obligation \"Eso fee\" has been removed.', 3, 15, 'obligation', 0, '2026-04-09 23:57:58'),
(97, 1184, 'Obligation Removed', 'The obligation \"Eso fee\" has been removed.', 3, 15, 'obligation', 0, '2026-04-09 23:57:58'),
(98, 1162, 'Clearance Returned', 'Your clearance approval has been returned and needs to restart the process.', 8, 3, 'clearance', 0, '2026-04-14 04:33:27'),
(99, 1176, 'Clearance Update', 'Your clearance has been approved at step 3. Proceeding to next step.', 6, 18, 'clearance', 0, '2026-04-14 04:33:32');

-- --------------------------------------------------------

--
-- Table structure for table `obligations`
--

CREATE TABLE `obligations` (
  `obligation_id` int(10) UNSIGNED NOT NULL,
  `obligation_name` varchar(25) NOT NULL,
  `description` varchar(50) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `scope` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=all 1=department 2=year_level 3=section',
  `program_id` int(10) UNSIGNED DEFAULT NULL,
  `year_level` tinyint(3) UNSIGNED DEFAULT NULL,
  `section` varchar(10) DEFAULT NULL,
  `school_year` varchar(10) NOT NULL,
  `semester` tinyint(3) UNSIGNED NOT NULL DEFAULT 2 COMMENT '1=1st 2=2nd 3=Summer',
  `due_date` date DEFAULT NULL,
  `gcash_qr_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(10) UNSIGNED NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `obligations`
--

INSERT INTO `obligations` (`obligation_id`, `obligation_name`, `description`, `amount`, `is_required`, `scope`, `program_id`, `year_level`, `section`, `school_year`, `semester`, `due_date`, `gcash_qr_path`, `is_active`, `created_by`, `deleted_at`, `created_at`, `updated_at`) VALUES
(13, 'ESO Fee', NULL, 150.00, 1, 1, NULL, NULL, NULL, '2025-2026', 2, '2026-03-27', 'qr/1774505883724-224178664.jpg', 1, 1, NULL, '2026-03-26 06:18:03', '2026-03-26 06:18:03'),
(14, 'Org Shirt', NULL, 0.00, 1, 2, 1, 4, 'A', '2025-2026', 2, '2026-03-28', NULL, 1, 1, NULL, '2026-03-27 02:08:57', '2026-03-27 02:08:57');

-- --------------------------------------------------------

--
-- Table structure for table `payment_submissions`
--

CREATE TABLE `payment_submissions` (
  `payment_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `obligation_id` int(10) UNSIGNED NOT NULL,
  `student_obligation_id` int(10) UNSIGNED NOT NULL,
  `payment_receipt_path` varchar(200) DEFAULT NULL,
  `receipt_filename` varchar(255) NOT NULL,
  `receipt_filesize` int(10) UNSIGNED DEFAULT NULL,
  `receipt_mimetype` varchar(100) DEFAULT NULL,
  `amount_paid` decimal(6,2) NOT NULL,
  `notes` varchar(100) DEFAULT NULL,
  `payment_type` tinyint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=gcash 2=cash',
  `recorded_by` int(10) UNSIGNED DEFAULT NULL,
  `payment_status` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=pending 1=approved 2=rejected',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_submissions`
--

INSERT INTO `payment_submissions` (`payment_id`, `student_id`, `obligation_id`, `student_obligation_id`, `payment_receipt_path`, `receipt_filename`, `receipt_filesize`, `receipt_mimetype`, `amount_paid`, `notes`, `payment_type`, `recorded_by`, `payment_status`, `submitted_at`, `updated_at`) VALUES
(10, 2, 13, 23, 'receipts/1774577514467-777196201.jpg', '', NULL, NULL, 150.00, NULL, 1, NULL, 1, '2026-03-27 02:11:54', '2026-03-27 02:25:32'),
(11, 8, 13, 43, NULL, 'gcash_receipt_student7.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-07 01:28:00', '2026-04-07 01:28:00'),
(12, 9, 13, 44, NULL, 'gcash_receipt_student8.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-07 02:12:00', '2026-04-07 02:12:00'),
(13, 10, 13, 45, NULL, 'gcash_receipt_student9.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-08 00:43:00', '2026-04-08 00:43:00'),
(14, 8, 13, 43, NULL, 'gcash_receipt_student7.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-07 01:28:00', '2026-04-07 01:28:00'),
(15, 9, 13, 44, NULL, 'gcash_receipt_student8.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-07 02:12:00', '2026-04-07 02:12:00'),
(16, 10, 13, 45, NULL, 'gcash_receipt_student9.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-08 00:43:00', '2026-04-08 00:43:00'),
(17, 24, 13, 68, NULL, 'gcash_receipt_maria.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-09 02:05:00', '2026-04-09 02:05:00'),
(18, 25, 13, 69, NULL, 'gcash_receipt_nathan.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-09 02:30:00', '2026-04-09 02:30:00'),
(19, 26, 13, 70, NULL, 'gcash_receipt_olivia.jpg', NULL, NULL, 150.00, NULL, 1, NULL, 0, '2026-04-09 03:00:00', '2026-04-09 03:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `payment_verifications`
--

CREATE TABLE `payment_verifications` (
  `payment_verification_id` int(10) UNSIGNED NOT NULL,
  `payment_id` int(10) UNSIGNED NOT NULL,
  `admin_id` int(10) UNSIGNED NOT NULL,
  `verification_status` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=pending 1=approved 2=rejected 3=returned',
  `remarks` varchar(250) DEFAULT NULL,
  `verified_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_verifications`
--

INSERT INTO `payment_verifications` (`payment_verification_id`, `payment_id`, `admin_id`, `verification_status`, `remarks`, `verified_at`) VALUES
(19, 10, 1, 1, '', '2026-03-27 02:25:32');

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `program_id` int(10) UNSIGNED NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`program_id`, `code`, `name`, `created_at`, `updated_at`) VALUES
(1, 'CpE', 'Computer Engineering', '2026-03-09 01:11:14', '2026-03-09 01:11:14'),
(2, 'CE', 'Civil Engineering', '2026-03-09 01:11:14', '2026-03-09 01:11:14'),
(3, 'ECE', 'Electronics Engineering', '2026-03-09 01:11:14', '2026-03-09 01:11:14'),
(4, 'EE', 'Electrical Engineering', '2026-03-09 01:11:14', '2026-03-09 01:11:14'),
(5, 'ME', 'Mechanical Engineering', '2026-03-09 01:11:14', '2026-03-09 01:11:14');

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `admission_id` int(10) UNSIGNED NOT NULL,
  `enrollment_adviser_id` int(10) UNSIGNED NOT NULL,
  `academic_year_id` int(10) UNSIGNED NOT NULL,
  `year_term_id` int(10) UNSIGNED NOT NULL,
  `student_type_id` int(10) UNSIGNED NOT NULL,
  `student_class_id` int(10) UNSIGNED NOT NULL,
  `old_record` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `role_label` varchar(100) NOT NULL,
  `clearance_step` tinyint(3) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `role_label`, `clearance_step`, `created_at`) VALUES
(1, 'system_admin', 'System Administrator', NULL, '2026-03-09 01:11:14'),
(2, 'eso_officer', 'ESO Officer', 3, '2026-03-09 01:11:14'),
(3, 'class_officer', 'Class Officer', 1, '2026-03-09 01:11:14'),
(4, 'program_head', 'Program Head', 5, '2026-03-09 01:11:14'),
(5, 'signatory', 'Signatory', 4, '2026-03-09 01:11:14'),
(6, 'dean', 'Dean of Engineering', 6, '2026-03-09 01:11:14'),
(7, 'student', 'Student', NULL, '2026-03-09 01:11:14'),
(8, 'program_officer', 'Program Officer', 2, '2026-03-25 03:28:50');

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `section_id` smallint(5) UNSIGNED NOT NULL,
  `program_id` int(10) UNSIGNED NOT NULL,
  `section_name` varchar(5) NOT NULL,
  `year_level` tinyint(3) UNSIGNED NOT NULL,
  `school_year` varchar(9) NOT NULL,
  `semester` tinyint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=1st 2=2nd 3=Summer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `student_no` varchar(8) NOT NULL,
  `first_name` varchar(25) NOT NULL,
  `last_name` varchar(25) NOT NULL,
  `middle_name` varchar(25) DEFAULT NULL,
  `gender` tinyint(3) UNSIGNED DEFAULT NULL COMMENT '1=Male 2=Female 3=Other',
  `program_id` int(10) UNSIGNED NOT NULL,
  `year_level` tinyint(3) UNSIGNED NOT NULL,
  `section` varchar(10) DEFAULT NULL,
  `section_id` smallint(5) UNSIGNED DEFAULT NULL,
  `school_year` varchar(10) NOT NULL,
  `semester` tinyint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=1st 2=2nd 3=Summer',
  `shirt_size` enum('XS','S','M','L','XL','XXL') DEFAULT NULL,
  `avatar_path` varchar(200) DEFAULT NULL,
  `is_enrolled` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `user_id`, `student_no`, `first_name`, `last_name`, `middle_name`, `gender`, `program_id`, `year_level`, `section`, `section_id`, `school_year`, `semester`, `shirt_size`, `avatar_path`, `is_enrolled`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 2, '22B1799', 'james', 'Jantoc', 'Laylay', NULL, 1, 4, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-11 12:51:25', '2026-03-11 12:51:25'),
(2, 3, '22B1798', 'Student1', 'Profile', 'Laylay', NULL, 1, 4, 'A', NULL, '2025-2026', 2, NULL, '/uploads/avatars/713cae1b-f214-4d1b-b658-2936771ee311.jpg', 1, NULL, '2026-03-11 21:11:47', '2026-04-10 00:33:02'),
(3, 1161, '22B1002', 'Student2', 'Account', NULL, NULL, 1, 1, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(4, 1162, '22B1003', 'Student3', 'Account', NULL, NULL, 1, 2, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(5, 1163, '22B1004', 'Student4', 'Account', NULL, NULL, 1, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(6, 1164, '22B1005', 'Student5', 'Account', NULL, NULL, 1, 4, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(7, 1165, '22B1006', 'Student6', 'Account', NULL, NULL, 1, 1, 'B', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(8, 1166, '22B2007', 'Student7', 'Account', NULL, NULL, 2, 1, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(9, 1167, '22B2008', 'Student8', 'Account', NULL, NULL, 2, 2, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(10, 1168, '22B2009', 'Student9', 'Account', NULL, NULL, 2, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(11, 1169, '22B2010', 'Student10', 'Account', NULL, NULL, 2, 4, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(12, 1170, '22B1010', 'Alice', 'Santos', NULL, NULL, 1, 2, 'B', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(13, 1171, '22B1011', 'Bob', 'Reyes', NULL, NULL, 1, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(14, 1172, '22B1012', 'Clara', 'Cruz', NULL, NULL, 2, 1, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(15, 1173, '22B1013', 'Diego', 'Lim', NULL, NULL, 1, 2, 'C', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(16, 1174, '22B1014', 'Elena', 'Torres', NULL, NULL, 2, 2, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(17, 1175, '22B1015', 'Felix', 'Garcia', NULL, NULL, 3, 1, 'B', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(18, 1176, '22B1016', 'Grace', 'Mendoza', NULL, NULL, 2, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(19, 1177, '22B1017', 'Henry', 'Ramos', NULL, NULL, 3, 2, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(20, 1178, '22B1018', 'Iris', 'Valdez', NULL, NULL, 4, 1, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(21, 1179, '22B1019', 'Jake', 'Navarro', NULL, NULL, 3, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(22, 1180, '22B1020', 'Karen', 'Flores', NULL, NULL, 4, 2, 'B', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(23, 1181, '22B1021', 'Leo', 'Castillo', NULL, NULL, 5, 1, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(24, 1182, '22B1022', 'Maria', 'Dela Rosa', NULL, NULL, 5, 2, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(25, 1183, '22B1023', 'Nathan', 'Aquino', NULL, NULL, 5, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(26, 1184, '22B1024', 'Olivia', 'Bautista', NULL, NULL, 1, 1, 'B', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01');

-- --------------------------------------------------------

--
-- Table structure for table `student_classes`
--

CREATE TABLE `student_classes` (
  `id` int(10) UNSIGNED NOT NULL,
  `label` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_imports`
--

CREATE TABLE `student_imports` (
  `import_id` int(10) UNSIGNED NOT NULL,
  `school_year` varchar(9) NOT NULL,
  `semester` tinyint(3) UNSIGNED NOT NULL DEFAULT 2 COMMENT '1=1st 2=2nd 3=Summer',
  `imported_by` int(10) UNSIGNED NOT NULL,
  `record_count` int(11) NOT NULL DEFAULT 0,
  `skipped_count` int(11) NOT NULL DEFAULT 0,
  `error_count` int(11) NOT NULL DEFAULT 0,
  `imported_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_obligations`
--

CREATE TABLE `student_obligations` (
  `student_obligation_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `obligation_id` int(10) UNSIGNED NOT NULL,
  `amount_due` decimal(6,2) DEFAULT NULL,
  `status` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=unpaid 1=pending_verification 2=paid 3=waived',
  `proof_image` varchar(200) DEFAULT NULL,
  `waived_by` int(10) UNSIGNED DEFAULT NULL,
  `waive_reason` varchar(255) DEFAULT NULL,
  `notified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_obligations`
--

INSERT INTO `student_obligations` (`student_obligation_id`, `student_id`, `obligation_id`, `amount_due`, `status`, `proof_image`, `waived_by`, `waive_reason`, `notified_at`, `created_at`, `updated_at`) VALUES
(22, 1, 13, 150.00, 1, NULL, NULL, NULL, NULL, '2026-03-26 06:18:03', '2026-03-26 06:18:03'),
(23, 2, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-03-26 06:18:03', '2026-03-27 02:25:32'),
(24, 1, 14, 0.00, 0, NULL, NULL, NULL, NULL, '2026-03-27 02:08:57', '2026-03-27 02:08:57'),
(25, 2, 14, 0.00, 0, NULL, NULL, NULL, NULL, '2026-03-27 02:08:57', '2026-03-27 02:08:57'),
(26, 6, 14, 0.00, 0, NULL, NULL, NULL, NULL, '2026-03-27 02:08:57', '2026-03-27 02:08:57'),
(38, 3, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-03-28 00:00:00', '2026-04-01 01:00:00'),
(39, 4, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-03-28 00:00:00', '2026-04-01 01:30:00'),
(40, 5, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-03-28 00:00:00', '2026-04-02 02:00:00'),
(41, 6, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-03-28 00:00:00', '2026-04-01 03:00:00'),
(42, 7, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-03-28 00:00:00', '2026-04-01 03:30:00'),
(43, 8, 13, 150.00, 1, NULL, NULL, NULL, NULL, '2026-04-06 01:00:00', '2026-04-07 01:30:00'),
(44, 9, 13, 150.00, 1, NULL, NULL, NULL, NULL, '2026-04-06 01:00:00', '2026-04-07 02:15:00'),
(45, 10, 13, 150.00, 1, NULL, NULL, NULL, NULL, '2026-04-06 01:00:00', '2026-04-08 00:45:00'),
(46, 11, 13, 150.00, 0, NULL, NULL, NULL, NULL, '2026-04-06 01:00:00', '2026-04-06 01:00:00'),
(56, 12, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-06 00:00:00', '2026-04-06 01:00:00'),
(57, 13, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-06 00:00:00', '2026-04-06 01:00:00'),
(58, 14, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-06 00:00:00', '2026-04-06 01:00:00'),
(59, 15, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-05 00:00:00', '2026-04-05 02:00:00'),
(60, 16, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-05 00:00:00', '2026-04-05 02:00:00'),
(61, 17, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-05 00:00:00', '2026-04-05 02:00:00'),
(62, 18, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-04 00:00:00', '2026-04-04 02:00:00'),
(63, 19, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-04 00:00:00', '2026-04-04 02:00:00'),
(64, 20, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-04 00:00:00', '2026-04-04 02:00:00'),
(65, 21, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-03 00:00:00', '2026-04-03 02:00:00'),
(66, 22, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-03 00:00:00', '2026-04-03 02:00:00'),
(67, 23, 13, 150.00, 2, NULL, NULL, NULL, NULL, '2026-04-03 00:00:00', '2026-04-03 02:00:00'),
(68, 24, 13, 150.00, 1, NULL, NULL, NULL, NULL, '2026-04-08 02:00:00', '2026-04-09 01:00:00'),
(69, 25, 13, 150.00, 1, NULL, NULL, NULL, NULL, '2026-04-08 02:00:00', '2026-04-09 01:30:00'),
(70, 26, 13, 150.00, 1, NULL, NULL, NULL, NULL, '2026-04-08 02:00:00', '2026-04-09 02:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `student_types`
--

CREATE TABLE `student_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `label` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_id` int(10) UNSIGNED NOT NULL,
  `maintenance_mode` tinyint(1) NOT NULL DEFAULT 0,
  `maintenance_msg` varchar(50) DEFAULT NULL,
  `school_year` varchar(10) NOT NULL DEFAULT '2025-2026',
  `current_semester` tinyint(3) UNSIGNED NOT NULL DEFAULT 2 COMMENT '1=1st 2=2nd 3=Summer',
  `updated_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_id`, `maintenance_mode`, `maintenance_msg`, `school_year`, `current_semester`, `updated_by`) VALUES
(1, 0, 'System is currently under maintenance.', '2025-2026', 2, 10);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_changed_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `email_verify_token` varchar(100) DEFAULT NULL,
  `email_verify_expires_at` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(100) DEFAULT NULL,
  `password_reset_expires_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `refresh_token` varchar(255) DEFAULT NULL,
  `refresh_token_expires_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `program_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password_hash`, `password_changed_at`, `email_verified_at`, `email_verify_token`, `email_verify_expires_at`, `password_reset_token`, `password_reset_expires_at`, `remember_token`, `refresh_token`, `refresh_token_expires_at`, `failed_login_attempts`, `locked_until`, `role_id`, `program_id`, `status`, `last_login_at`, `last_login_ip`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'System', 'Admin', 'admin@gmail.com', '$2b$10$0FwXaFgVHkDlxziIyBwxGe9.m.w.6SgEekFzmqmXxh28qUP4m/vGO', NULL, '2026-03-09 01:11:14', NULL, NULL, NULL, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NjMwMjQ0MSwiZXhwIjoxNzc2OTA3MjQxfQ.3ZKmJlwSWfwn7uSytBhXFSznxykC5wX3Yx9gTNyXWco', '2026-04-23 01:20:41', 0, NULL, 2, NULL, 'active', '2026-04-16 01:20:41', '::1', NULL, '2026-03-09 01:11:14', '2026-04-16 01:20:41'),
(2, 'james', 'Jantoc', 'james@gmail.com', '$2b$10$YCbQnRtj/6KFrkrkQU4KweWiFH.lqm9NYM/EygHuqYsc5QPPzNgzi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'inactive', '2026-03-11 13:34:55', '::1', NULL, '2026-03-11 12:51:25', '2026-03-26 06:01:04'),
(3, 'Student1', 'Profile', 'student1@gmail.com', '$2b$10$3qiAe2MhX9C9mg/4Ed/ObOArCTnKEwzvXuKbk2MMLViq395Pvuoey', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', '2026-04-10 01:52:37', '::1', NULL, '2026-03-11 21:11:47', '2026-04-10 01:53:01'),
(4, 'Jake', 'Dela Cruz', 'jake@gmail.com', '$2b$10$iu/7t8gwiZj0.1ZasWGAUOOfoIJF/ownYfF.1SC2JSN1koxRpbaUu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 3, 1, 'inactive', '2026-03-12 06:25:51', '::1', '2026-03-20 01:56:37', '2026-03-12 02:24:14', '2026-03-20 01:56:37'),
(5, 'Juan', 'Dela Cruz', 'juan@gmail.com', '$2b$10$pjyOZiLGaOrwDpqCehdmU.NdRmUIS9AzXZ5D0rb7eDI0ZDQtY11N6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 4, 1, 'inactive', '2026-03-12 08:10:53', '::1', '2026-03-20 01:56:41', '2026-03-12 06:11:12', '2026-03-20 01:56:41'),
(6, 'John', 'Pork', 'john@gmail.com', '$2b$10$DnOUVPjLLIWqjmmwAC3MPeBffra81AHslGez2L5Ritzson8p/e7Ze', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 6, 1, 'inactive', '2026-03-12 08:10:34', '::1', '2026-03-20 01:56:39', '2026-03-12 06:11:38', '2026-03-20 01:56:39'),
(7, 'class', 'officer', 'class@gmail.com', '$2b$10$VgE14QG/4GpR3B7A0MY8tuBLlHHD/Q2D.F554drsP.8RLy5XO5JWe', '2026-03-26 06:32:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 3, 1, 'active', '2026-04-10 00:29:44', '::1', NULL, '2026-03-20 01:35:32', '2026-04-10 00:29:59'),
(8, 'program', 'head', 'program@gmail.com', '$2b$10$0ghfjIBoFLDV3ut.nAWuIOpjqden7VIqLITQT0YDkOgCLDL8lY6yy', '2026-03-26 06:31:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 4, 1, 'active', '2026-04-10 00:32:17', '::1', NULL, '2026-03-20 01:36:42', '2026-04-10 00:32:21'),
(9, 'Dean', '_', 'dean@gmail.com', '$2b$10$FL2Cu1hPKV/V2AqDw84VqeB37gFQQYbYbvjSjm2NXDBbOVx0M0Bq.', '2026-03-26 06:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 6, NULL, 'active', '2026-04-10 00:33:18', '::1', NULL, '2026-03-20 01:37:21', '2026-04-10 00:33:23'),
(10, 'System', 'Admin', 'sysadmin@eso.edu.ph', '$2b$10$WPz5Ntsvq6XTNxN62hyNTe.SGlf.cavHOo0YHrbRZGeggGkTjMslW', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, 'active', '2026-04-08 06:36:48', '::1', NULL, '2026-03-24 05:29:46', '2026-04-08 06:56:17'),
(1158, 'CpE', 'Officer', 'cpe.officer@gmail.com', '$2b$10$rLouBX6QALZWwZTvnbKiy.8YemqAWtiQsMYb5ZRBWCgvPl3pmBqmy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 8, 1, 'active', '2026-04-10 00:31:01', '::1', NULL, '2026-03-26 06:31:57', '2026-04-10 00:31:13'),
(1159, 'Dane', 'Joe', 'dane@gmail.com', '$2b$10$RWxw.hV9wizajUlohFLItOtyGzmZpUBshb1pLrXIN5WW.wC95Jb5q', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 5, NULL, 'active', '2026-04-10 00:32:03', '::1', NULL, '2026-03-26 06:38:27', '2026-04-10 00:32:08'),
(1161, 'Student2', 'Account', 'student2@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1162, 'Student3', 'Account', 'student3@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1163, 'Student4', 'Account', 'student4@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1164, 'Student5', 'Account', 'student5@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1165, 'Student6', 'Account', 'student6@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1166, 'Student7', 'Account', 'student7@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1167, 'Student8', 'Account', 'student8@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1168, 'Student9', 'Account', 'student9@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(1169, 'Student10', 'Account', 'student10@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(1170, 'Alice', 'Santos', 'stu12@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1171, 'Bob', 'Reyes', 'stu13@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1172, 'Clara', 'Cruz', 'stu14@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1173, 'Diego', 'Lim', 'stu15@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1174, 'Elena', 'Torres', 'stu16@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1175, 'Felix', 'Garcia', 'stu17@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 3, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1176, 'Grace', 'Mendoza', 'stu18@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1177, 'Henry', 'Ramos', 'stu19@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 3, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1178, 'Iris', 'Valdez', 'stu20@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 4, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1179, 'Jake', 'Navarro', 'stu21@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 3, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1180, 'Karen', 'Flores', 'stu22@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 4, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1181, 'Leo', 'Castillo', 'stu23@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 5, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1182, 'Maria', 'Dela Rosa', 'stu24@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 5, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1183, 'Nathan', 'Aquino', 'stu25@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 5, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01'),
(1184, 'Olivia', 'Bautista', 'stu26@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-04-09 23:45:01', '2026-04-09 23:45:01');

-- --------------------------------------------------------

--
-- Table structure for table `year_terms`
--

CREATE TABLE `year_terms` (
  `id` int(10) UNSIGNED NOT NULL,
  `label` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `fk_admins_dept` (`program_id`),
  ADD KEY `idx_admins_deleted` (`deleted_at`);

--
-- Indexes for table `admissions`
--
ALTER TABLE `admissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_admission_student` (`student_id`),
  ADD KEY `fk_admission_curriculum` (`curriculum_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `fk_audit_user` (`performed_by`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_target` (`target_type`,`target_id`),
  ADD KEY `idx_audit_date` (`created_at`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`budget_id`),
  ADD KEY `idx_budgets_semester` (`semester`),
  ADD KEY `idx_budgets_school_year` (`school_year`),
  ADD KEY `idx_budgets_deleted_at` (`deleted_at`),
  ADD KEY `fk_budgets_created_by` (`created_by`);

--
-- Indexes for table `clearances`
--
ALTER TABLE `clearances`
  ADD PRIMARY KEY (`clearance_id`),
  ADD UNIQUE KEY `uq_clearance` (`student_id`,`school_year`,`semester`),
  ADD KEY `idx_cl_status` (`clearance_status`),
  ADD KEY `idx_cl_step` (`current_step`);

--
-- Indexes for table `clearance_verifications`
--
ALTER TABLE `clearance_verifications`
  ADD PRIMARY KEY (`clearance_verification_id`),
  ADD UNIQUE KEY `uq_clearance_step` (`clearance_id`,`step_order`),
  ADD KEY `fk_cv_admin` (`admin_id`),
  ADD KEY `fk_cv_role` (`role_id`),
  ADD KEY `idx_cv_step` (`status`,`step_order`);

--
-- Indexes for table `curriculums`
--
ALTER TABLE `curriculums`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `document_templates`
--
ALTER TABLE `document_templates`
  ADD PRIMARY KEY (`template_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`),
  ADD KEY `idx_expenses_semester` (`semester`),
  ADD KEY `idx_expenses_school_year` (`school_year`),
  ADD KEY `idx_expenses_recorded_by` (`recorded_by`),
  ADD KEY `idx_expenses_deleted_at` (`deleted_at`);

--
-- Indexes for table `guardian`
--
ALTER TABLE `guardian`
  ADD PRIMARY KEY (`guardian_id`),
  ADD UNIQUE KEY `student_id` (`student_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_notif_user_read` (`user_id`,`is_read`);

--
-- Indexes for table `obligations`
--
ALTER TABLE `obligations`
  ADD PRIMARY KEY (`obligation_id`),
  ADD KEY `fk_oblig_dept` (`program_id`),
  ADD KEY `fk_oblig_creator` (`created_by`),
  ADD KEY `idx_oblig_active` (`is_active`),
  ADD KEY `idx_oblig_deleted` (`deleted_at`);

--
-- Indexes for table `payment_submissions`
--
ALTER TABLE `payment_submissions`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_ps_student` (`student_id`),
  ADD KEY `fk_ps_obligation` (`obligation_id`),
  ADD KEY `fk_ps_so` (`student_obligation_id`),
  ADD KEY `idx_ps_status` (`payment_status`),
  ADD KEY `fk_ps_admin` (`recorded_by`);

--
-- Indexes for table `payment_verifications`
--
ALTER TABLE `payment_verifications`
  ADD PRIMARY KEY (`payment_verification_id`),
  ADD UNIQUE KEY `payment_id` (`payment_id`),
  ADD KEY `fk_pv_admin` (`admin_id`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`program_id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_reg_admission` (`admission_id`),
  ADD KEY `fk_reg_adviser` (`enrollment_adviser_id`),
  ADD KEY `fk_reg_acad_year` (`academic_year_id`),
  ADD KEY `fk_reg_year_term` (`year_term_id`),
  ADD KEY `fk_reg_type` (`student_type_id`),
  ADD KEY `fk_reg_class` (`student_class_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`section_id`),
  ADD UNIQUE KEY `uq_section` (`program_id`,`section_name`,`year_level`,`school_year`,`semester`),
  ADD KEY `idx_sections_school` (`school_year`,`semester`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `student_no` (`student_no`),
  ADD KEY `idx_students_dept` (`program_id`),
  ADD KEY `idx_students_sy` (`school_year`,`semester`),
  ADD KEY `idx_students_deleted` (`deleted_at`),
  ADD KEY `idx_students_section` (`section_id`);

--
-- Indexes for table `student_classes`
--
ALTER TABLE `student_classes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `student_imports`
--
ALTER TABLE `student_imports`
  ADD PRIMARY KEY (`import_id`),
  ADD KEY `fk_import_user` (`imported_by`);

--
-- Indexes for table `student_obligations`
--
ALTER TABLE `student_obligations`
  ADD PRIMARY KEY (`student_obligation_id`),
  ADD UNIQUE KEY `uq_student_obligation` (`student_id`,`obligation_id`),
  ADD KEY `fk_so_obligation` (`obligation_id`),
  ADD KEY `fk_so_waived_by` (`waived_by`),
  ADD KEY `idx_so_status` (`status`);

--
-- Indexes for table `student_types`
--
ALTER TABLE `student_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role` (`role_id`),
  ADD KEY `fk_users_dept` (`program_id`),
  ADD KEY `idx_users_email_verified` (`email_verified_at`),
  ADD KEY `idx_users_deleted` (`deleted_at`);

--
-- Indexes for table `year_terms`
--
ALTER TABLE `year_terms`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `admissions`
--
ALTER TABLE `admissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `audit_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `budget_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clearances`
--
ALTER TABLE `clearances`
  MODIFY `clearance_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `clearance_verifications`
--
ALTER TABLE `clearance_verifications`
  MODIFY `clearance_verification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `curriculums`
--
ALTER TABLE `curriculums`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_templates`
--
ALTER TABLE `document_templates`
  MODIFY `template_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guardian`
--
ALTER TABLE `guardian`
  MODIFY `guardian_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `obligations`
--
ALTER TABLE `obligations`
  MODIFY `obligation_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `payment_submissions`
--
ALTER TABLE `payment_submissions`
  MODIFY `payment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `payment_verifications`
--
ALTER TABLE `payment_verifications`
  MODIFY `payment_verification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `programs`
--
ALTER TABLE `programs`
  MODIFY `program_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `section_id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `student_classes`
--
ALTER TABLE `student_classes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_imports`
--
ALTER TABLE `student_imports`
  MODIFY `import_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_obligations`
--
ALTER TABLE `student_obligations`
  MODIFY `student_obligation_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `student_types`
--
ALTER TABLE `student_types`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `setting_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1185;

--
-- AUTO_INCREMENT for table `year_terms`
--
ALTER TABLE `year_terms`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `fk_admins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `admissions`
--
ALTER TABLE `admissions`
  ADD CONSTRAINT `fk_admission_curriculum` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums` (`id`),
  ADD CONSTRAINT `fk_admission_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `fk_budgets_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `clearances`
--
ALTER TABLE `clearances`
  ADD CONSTRAINT `fk_cl_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `clearance_verifications`
--
ALTER TABLE `clearance_verifications`
  ADD CONSTRAINT `fk_cv_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`),
  ADD CONSTRAINT `fk_cv_clearance` FOREIGN KEY (`clearance_id`) REFERENCES `clearances` (`clearance_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cv_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);

--
-- Constraints for table `document_templates`
--
ALTER TABLE `document_templates`
  ADD CONSTRAINT `document_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `fk_expenses_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `guardian`
--
ALTER TABLE `guardian`
  ADD CONSTRAINT `fk_guardian_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `obligations`
--
ALTER TABLE `obligations`
  ADD CONSTRAINT `fk_oblig_creator` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`);

--
-- Constraints for table `payment_submissions`
--
ALTER TABLE `payment_submissions`
  ADD CONSTRAINT `fk_ps_admin` FOREIGN KEY (`recorded_by`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ps_obligation` FOREIGN KEY (`obligation_id`) REFERENCES `obligations` (`obligation_id`),
  ADD CONSTRAINT `fk_ps_so` FOREIGN KEY (`student_obligation_id`) REFERENCES `student_obligations` (`student_obligation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ps_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `payment_verifications`
--
ALTER TABLE `payment_verifications`
  ADD CONSTRAINT `fk_pv_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`),
  ADD CONSTRAINT `fk_pv_payment` FOREIGN KEY (`payment_id`) REFERENCES `payment_submissions` (`payment_id`) ON DELETE CASCADE;

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `fk_reg_acad_year` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`),
  ADD CONSTRAINT `fk_reg_admission` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`),
  ADD CONSTRAINT `fk_reg_adviser` FOREIGN KEY (`enrollment_adviser_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_reg_class` FOREIGN KEY (`student_class_id`) REFERENCES `student_classes` (`id`),
  ADD CONSTRAINT `fk_reg_type` FOREIGN KEY (`student_type_id`) REFERENCES `student_types` (`id`),
  ADD CONSTRAINT `fk_reg_year_term` FOREIGN KEY (`year_term_id`) REFERENCES `year_terms` (`id`);

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_students_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`section_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_imports`
--
ALTER TABLE `student_imports`
  ADD CONSTRAINT `fk_import_user` FOREIGN KEY (`imported_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `student_obligations`
--
ALTER TABLE `student_obligations`
  ADD CONSTRAINT `fk_so_obligation` FOREIGN KEY (`obligation_id`) REFERENCES `obligations` (`obligation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_so_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_so_waived_by` FOREIGN KEY (`waived_by`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
