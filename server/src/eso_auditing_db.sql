-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 29, 2026 at 05:38 PM
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
(7, 9, 'Dean', NULL, NULL, '2026-03-20 01:37:21', '2026-03-26 06:00:01', NULL, NULL, NULL),
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `curricula`
--

CREATE TABLE `curricula` (
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
(70, 3, 'Payment Approved', 'Your payment for \"ESO Fee\" has been approved.', 3, 10, 'payment', 0, '2026-03-27 02:25:32');

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
  `semester` enum('1st','2nd','Summer') NOT NULL,
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
(13, 'ESO Fee', NULL, 150.00, 1, 1, NULL, NULL, NULL, '2025-2026', '2nd', '2026-03-27', 'qr/1774505883724-224178664.jpg', 1, 1, NULL, '2026-03-26 06:18:03', '2026-03-26 06:18:03'),
(14, 'Org Shirt', NULL, 0.00, 1, 2, 1, 4, 'A', '2025-2026', '2nd', '2026-03-28', NULL, 1, 1, NULL, '2026-03-27 02:08:57', '2026-03-27 02:08:57');

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
(10, 2, 13, 23, 'receipts/1774577514467-777196201.jpg', '', NULL, NULL, 150.00, NULL, 1, NULL, 1, '2026-03-27 02:11:54', '2026-03-27 02:25:32');

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
(2, 3, '22B1798', 'Student1', 'Profile', 'Laylay', NULL, 1, 4, 'A', NULL, '2025-2026', 2, NULL, '/uploads/avatars/713cae1b-f214-4d1b-b658-2936771ee311.jpg', 1, NULL, '2026-03-11 21:11:47', '2026-03-26 06:16:16'),
(3, 1161, '22B1002', 'Student2', 'Account', NULL, NULL, 1, 1, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(4, 1162, '22B1003', 'Student3', 'Account', NULL, NULL, 1, 2, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(5, 1163, '22B1004', 'Student4', 'Account', NULL, NULL, 1, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(6, 1164, '22B1005', 'Student5', 'Account', NULL, NULL, 1, 4, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(7, 1165, '22B1006', 'Student6', 'Account', NULL, NULL, 1, 1, 'B', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(8, 1166, '22B2007', 'Student7', 'Account', NULL, NULL, 2, 1, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(9, 1167, '22B2008', 'Student8', 'Account', NULL, NULL, 2, 2, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(10, 1168, '22B2009', 'Student9', 'Account', NULL, NULL, 2, 3, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(11, 1169, '22B2010', 'Student10', 'Account', NULL, NULL, 2, 4, 'A', NULL, '2025-2026', 2, NULL, NULL, 1, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12');

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
  `semester` enum('1st','2nd','Summer') NOT NULL,
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
(26, 6, 14, 0.00, 0, NULL, NULL, NULL, NULL, '2026-03-27 02:08:57', '2026-03-27 02:08:57');

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
  `current_semester` enum('1st','2nd','Summer') NOT NULL DEFAULT '2nd',
  `updated_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_id`, `maintenance_mode`, `maintenance_msg`, `school_year`, `current_semester`, `updated_by`) VALUES
(1, 0, 'System is currently under maintenance.', '2025-2026', '2nd', 10);

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
(1, 'System', 'Admin', 'admin@gmail.com', '$2b$10$0FwXaFgVHkDlxziIyBwxGe9.m.w.6SgEekFzmqmXxh28qUP4m/vGO', NULL, '2026-03-09 01:11:14', NULL, NULL, NULL, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDc5Mjk5OCwiZXhwIjoxNzc1Mzk3Nzk4fQ.qvW2GKXqGFDMvpL9j6Pjg0KaPIkkwlbtV9w6eEd8qM8', '2026-04-05 14:03:18', 0, NULL, 2, NULL, 'active', '2026-03-29 14:03:18', '::1', NULL, '2026-03-09 01:11:14', '2026-03-29 14:03:18'),
(2, 'james', 'Jantoc', 'james@gmail.com', '$2b$10$YCbQnRtj/6KFrkrkQU4KweWiFH.lqm9NYM/EygHuqYsc5QPPzNgzi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'inactive', '2026-03-11 13:34:55', '::1', NULL, '2026-03-11 12:51:25', '2026-03-26 06:01:04'),
(3, 'Student1', 'Profile', 'student1@gmail.com', '$2b$10$3qiAe2MhX9C9mg/4Ed/ObOArCTnKEwzvXuKbk2MMLViq395Pvuoey', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', '2026-03-27 02:11:05', '::1', NULL, '2026-03-11 21:11:47', '2026-03-27 02:11:57'),
(4, 'Jake', 'Dela Cruz', 'jake@gmail.com', '$2b$10$iu/7t8gwiZj0.1ZasWGAUOOfoIJF/ownYfF.1SC2JSN1koxRpbaUu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 3, 1, 'inactive', '2026-03-12 06:25:51', '::1', '2026-03-20 01:56:37', '2026-03-12 02:24:14', '2026-03-20 01:56:37'),
(5, 'Juan', 'Dela Cruz', 'juan@gmail.com', '$2b$10$pjyOZiLGaOrwDpqCehdmU.NdRmUIS9AzXZ5D0rb7eDI0ZDQtY11N6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 4, 1, 'inactive', '2026-03-12 08:10:53', '::1', '2026-03-20 01:56:41', '2026-03-12 06:11:12', '2026-03-20 01:56:41'),
(6, 'John', 'Pork', 'john@gmail.com', '$2b$10$DnOUVPjLLIWqjmmwAC3MPeBffra81AHslGez2L5Ritzson8p/e7Ze', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 6, 1, 'inactive', '2026-03-12 08:10:34', '::1', '2026-03-20 01:56:39', '2026-03-12 06:11:38', '2026-03-20 01:56:39'),
(7, 'class', 'officer', 'class@gmail.com', '$2b$10$VgE14QG/4GpR3B7A0MY8tuBLlHHD/Q2D.F554drsP.8RLy5XO5JWe', '2026-03-26 06:32:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 3, 1, 'active', '2026-03-21 10:49:06', '::1', NULL, '2026-03-20 01:35:32', '2026-03-26 06:32:15'),
(8, 'program', 'head', 'program@gmail.com', '$2b$10$0ghfjIBoFLDV3ut.nAWuIOpjqden7VIqLITQT0YDkOgCLDL8lY6yy', '2026-03-26 06:31:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 4, 1, 'active', '2026-03-26 06:33:01', '::1', NULL, '2026-03-20 01:36:42', '2026-03-26 06:33:10'),
(9, 'dean', 'dean', 'dean@gmail.com', '$2b$10$FL2Cu1hPKV/V2AqDw84VqeB37gFQQYbYbvjSjm2NXDBbOVx0M0Bq.', '2026-03-26 06:00:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 6, NULL, 'active', '2026-03-21 10:49:33', '::1', NULL, '2026-03-20 01:37:21', '2026-03-26 06:00:01'),
(10, 'System', 'Admin', 'sysadmin@eso.edu.ph', '$2b$10$WPz5Ntsvq6XTNxN62hyNTe.SGlf.cavHOo0YHrbRZGeggGkTjMslW', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, 'active', '2026-03-27 02:13:05', '::1', NULL, '2026-03-24 05:29:46', '2026-03-27 02:18:53'),
(1158, 'CpE', 'Officer', 'cpe.officer@gmail.com', '$2b$10$rLouBX6QALZWwZTvnbKiy.8YemqAWtiQsMYb5ZRBWCgvPl3pmBqmy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 8, 1, 'active', NULL, NULL, NULL, '2026-03-26 06:31:57', '2026-03-26 06:31:57'),
(1159, 'Dane', 'Joe', 'dane@gmail.com', '$2b$10$RWxw.hV9wizajUlohFLItOtyGzmZpUBshb1pLrXIN5WW.wC95Jb5q', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 5, NULL, 'active', '2026-03-26 12:25:19', '::1', NULL, '2026-03-26 06:38:27', '2026-03-26 20:49:25'),
(1161, 'Student2', 'Account', 'student2@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1162, 'Student3', 'Account', 'student3@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1163, 'Student4', 'Account', 'student4@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1164, 'Student5', 'Account', 'student5@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1165, 'Student6', 'Account', 'student6@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 1, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1166, 'Student7', 'Account', 'student7@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1167, 'Student8', 'Account', 'student8@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:11', '2026-03-27 01:26:11'),
(1168, 'Student9', 'Account', 'student9@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12'),
(1169, 'Student10', 'Account', 'student10@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 7, 2, 'active', NULL, NULL, NULL, '2026-03-27 01:26:12', '2026-03-27 01:26:12');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_enrollment_per_semester`
-- (See below for the actual view)
--
CREATE TABLE `v_enrollment_per_semester` (
`school_year` varchar(10)
,`semester` tinyint(3) unsigned
,`program_id` int(10) unsigned
,`program_code` varchar(10)
,`program_name` varchar(45)
,`total_enrolled` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_eso_quota`
-- (See below for the actual view)
--
CREATE TABLE `v_eso_quota` (
`program_id` int(10) unsigned
,`program_code` varchar(10)
,`program_name` varchar(45)
,`school_year` varchar(10)
,`semester` enum('1st','2nd','Summer')
,`total_obligations` bigint(21)
,`students_with_obligations` bigint(21)
,`total_amount_due` decimal(28,2)
,`total_collected` decimal(28,2)
,`remaining_balance` decimal(29,2)
,`collection_rate_pct` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_program_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_program_stats` (
`program_id` int(10) unsigned
,`program_code` varchar(10)
,`program_name` varchar(45)
,`total_sections` bigint(21)
,`total_students` bigint(21)
,`enrolled_students` bigint(21)
,`registered_accounts` bigint(21)
,`total_obligations` bigint(21)
,`obligations_settled` decimal(22,0)
,`obligations_pending` decimal(22,0)
,`total_amount_due` decimal(28,2)
,`total_collected` decimal(28,2)
,`remaining_balance` decimal(28,2)
,`collection_rate_pct` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_registered_accounts`
-- (See below for the actual view)
--
CREATE TABLE `v_registered_accounts` (
`total_accounts` bigint(21)
,`student_accounts` decimal(23,0)
,`admin_accounts` decimal(23,0)
,`active_accounts` decimal(23,0)
,`inactive_accounts` decimal(23,0)
,`suspended_accounts` decimal(23,0)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_section_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_section_stats` (
`section_id` smallint(5) unsigned
,`section_name` varchar(5)
,`year_level` tinyint(3) unsigned
,`school_year` varchar(9)
,`semester` tinyint(3) unsigned
,`program_id` int(10) unsigned
,`program_code` varchar(10)
,`program_name` varchar(45)
,`total_students` bigint(21)
,`enrolled_students` bigint(21)
,`total_obligations` bigint(21)
,`obligations_settled` decimal(22,0)
,`obligations_pending` decimal(22,0)
,`total_amount_due` decimal(28,2)
,`total_collected` decimal(28,2)
,`total_remaining` decimal(28,2)
);

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

-- --------------------------------------------------------

--
-- Structure for view `v_enrollment_per_semester`
--
DROP TABLE IF EXISTS `v_enrollment_per_semester`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_enrollment_per_semester`  AS SELECT `s`.`school_year` AS `school_year`, `s`.`semester` AS `semester`, `p`.`program_id` AS `program_id`, `p`.`code` AS `program_code`, `p`.`name` AS `program_name`, count(0) AS `total_enrolled` FROM (`students` `s` join `programs` `p` on(`p`.`program_id` = `s`.`program_id`)) WHERE `s`.`is_enrolled` = 1 GROUP BY `s`.`school_year`, `s`.`semester`, `p`.`program_id`, `p`.`code`, `p`.`name` ORDER BY `s`.`school_year` DESC, field(`s`.`semester`,'1st','2nd','Summer') ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_eso_quota`
--
DROP TABLE IF EXISTS `v_eso_quota`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_eso_quota`  AS SELECT `p`.`program_id` AS `program_id`, `p`.`code` AS `program_code`, `p`.`name` AS `program_name`, `o`.`school_year` AS `school_year`, `o`.`semester` AS `semester`, count(distinct `o`.`obligation_id`) AS `total_obligations`, count(distinct `so`.`student_id`) AS `students_with_obligations`, coalesce(sum(`so`.`amount_due`),0) AS `total_amount_due`, coalesce(sum(case when `ps`.`payment_status` = 'approved' then `ps`.`amount_paid` else 0 end),0) AS `total_collected`, coalesce(sum(`so`.`amount_due`),0) - coalesce(sum(case when `ps`.`payment_status` = 'approved' then `ps`.`amount_paid` else 0 end),0) AS `remaining_balance`, round(coalesce(sum(case when `ps`.`payment_status` = 'approved' then `ps`.`amount_paid` else 0 end),0) / nullif(sum(`so`.`amount_due`),0) * 100,2) AS `collection_rate_pct` FROM ((((`programs` `p` left join `students` `s` on(`s`.`program_id` = `p`.`program_id`)) left join `student_obligations` `so` on(`so`.`student_id` = `s`.`student_id`)) left join `obligations` `o` on(`o`.`obligation_id` = `so`.`obligation_id`)) left join `payment_submissions` `ps` on(`ps`.`student_obligation_id` = `so`.`student_obligation_id`)) GROUP BY `p`.`program_id`, `p`.`code`, `p`.`name`, `o`.`school_year`, `o`.`semester` ORDER BY `o`.`school_year` DESC, field(`o`.`semester`,'1st','2nd','Summer') ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_program_stats`
--
DROP TABLE IF EXISTS `v_program_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_program_stats`  AS SELECT `p`.`program_id` AS `program_id`, `p`.`code` AS `program_code`, `p`.`name` AS `program_name`, count(distinct `sec`.`section_id`) AS `total_sections`, count(distinct `s`.`student_id`) AS `total_students`, count(distinct case when `s`.`is_enrolled` = 1 then `s`.`student_id` end) AS `enrolled_students`, count(distinct `u`.`user_id`) AS `registered_accounts`, count(distinct `so`.`student_obligation_id`) AS `total_obligations`, sum(case when `so`.`status` in ('paid','waived') then 1 else 0 end) AS `obligations_settled`, sum(case when `so`.`status` in ('unpaid','pending_verification') then 1 else 0 end) AS `obligations_pending`, coalesce(sum(`so`.`amount_due`),0) AS `total_amount_due`, coalesce(sum(case when `ps`.`payment_status` = 'approved' then `ps`.`amount_paid` else 0 end),0) AS `total_collected`, coalesce(sum(case when `so`.`status` not in ('paid','waived') then `so`.`amount_due` else 0 end),0) AS `remaining_balance`, round(coalesce(sum(case when `ps`.`payment_status` = 'approved' then `ps`.`amount_paid` else 0 end),0) / nullif(sum(`so`.`amount_due`),0) * 100,2) AS `collection_rate_pct` FROM (((((`programs` `p` left join `sections` `sec` on(`sec`.`program_id` = `p`.`program_id`)) left join `students` `s` on(`s`.`section_id` = `sec`.`section_id`)) left join `users` `u` on(`u`.`user_id` = `s`.`user_id` and `u`.`deleted_at` is null)) left join `student_obligations` `so` on(`so`.`student_id` = `s`.`student_id`)) left join `payment_submissions` `ps` on(`ps`.`student_obligation_id` = `so`.`student_obligation_id`)) GROUP BY `p`.`program_id`, `p`.`code`, `p`.`name` ;

-- --------------------------------------------------------

--
-- Structure for view `v_registered_accounts`
--
DROP TABLE IF EXISTS `v_registered_accounts`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_registered_accounts`  AS SELECT count(0) AS `total_accounts`, sum(`r`.`role_name` = 'student') AS `student_accounts`, sum(`r`.`role_name` <> 'student') AS `admin_accounts`, sum(`u`.`status` = 'active') AS `active_accounts`, sum(`u`.`status` = 'inactive') AS `inactive_accounts`, sum(`u`.`status` = 'suspended') AS `suspended_accounts` FROM (`users` `u` join `roles` `r` on(`r`.`role_id` = `u`.`role_id`)) WHERE `u`.`deleted_at` is null ;

-- --------------------------------------------------------

--
-- Structure for view `v_section_stats`
--
DROP TABLE IF EXISTS `v_section_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_section_stats`  AS SELECT `sec`.`section_id` AS `section_id`, `sec`.`section_name` AS `section_name`, `sec`.`year_level` AS `year_level`, `sec`.`school_year` AS `school_year`, `sec`.`semester` AS `semester`, `p`.`program_id` AS `program_id`, `p`.`code` AS `program_code`, `p`.`name` AS `program_name`, count(distinct `s`.`student_id`) AS `total_students`, count(distinct case when `s`.`is_enrolled` = 1 then `s`.`student_id` end) AS `enrolled_students`, count(distinct `so`.`student_obligation_id`) AS `total_obligations`, sum(case when `so`.`status` in ('paid','waived') then 1 else 0 end) AS `obligations_settled`, sum(case when `so`.`status` in ('unpaid','pending_verification') then 1 else 0 end) AS `obligations_pending`, coalesce(sum(`so`.`amount_due`),0) AS `total_amount_due`, coalesce(sum(case when `ps`.`payment_status` = 'approved' then `ps`.`amount_paid` else 0 end),0) AS `total_collected`, coalesce(sum(case when `so`.`status` not in ('paid','waived') then `so`.`amount_due` else 0 end),0) AS `total_remaining` FROM ((((`sections` `sec` join `programs` `p` on(`p`.`program_id` = `sec`.`program_id`)) left join `students` `s` on(`s`.`section_id` = `sec`.`section_id`)) left join `student_obligations` `so` on(`so`.`student_id` = `s`.`student_id`)) left join `payment_submissions` `ps` on(`ps`.`student_obligation_id` = `so`.`student_obligation_id`)) GROUP BY `sec`.`section_id`, `sec`.`section_name`, `sec`.`year_level`, `sec`.`school_year`, `sec`.`semester`, `p`.`program_id`, `p`.`code`, `p`.`name` ;

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
-- Indexes for table `curricula`
--
ALTER TABLE `curricula`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `document_templates`
--
ALTER TABLE `document_templates`
  ADD PRIMARY KEY (`template_id`),
  ADD KEY `created_by` (`created_by`);

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
-- AUTO_INCREMENT for table `clearances`
--
ALTER TABLE `clearances`
  MODIFY `clearance_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `clearance_verifications`
--
ALTER TABLE `clearance_verifications`
  MODIFY `clearance_verification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `curricula`
--
ALTER TABLE `curricula`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_templates`
--
ALTER TABLE `document_templates`
  MODIFY `template_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `guardian`
--
ALTER TABLE `guardian`
  MODIFY `guardian_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `obligations`
--
ALTER TABLE `obligations`
  MODIFY `obligation_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `payment_submissions`
--
ALTER TABLE `payment_submissions`
  MODIFY `payment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  MODIFY `student_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
  MODIFY `student_obligation_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

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
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1170;

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
  ADD CONSTRAINT `fk_admission_curriculum` FOREIGN KEY (`curriculum_id`) REFERENCES `curricula` (`id`),
  ADD CONSTRAINT `fk_admission_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`);

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
