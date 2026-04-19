-- ============================================================
--  ESO AUDITING SYSTEM — COMPREHENSIVE DEMO SEED
--  Run in phpMyAdmin → eso_auditing_db → SQL tab
--  Safe to re-run (uses INSERT IGNORE / UPDATE ... WHERE)
--
--  RESULT AFTER RUNNING:
--
--  Clearance Approval — Pending:
--    Step 1 (Class Officer)  → Alice Santos, Bob Reyes, Clara Cruz
--    Step 2 (Program Officer)→ Diego Lim, Elena Torres, Felix Garcia
--    Step 3 (ESO Officer)    → Grace Mendoza, Henry Ramos, Iris Valdez
--    Step 4 (Signatory)      → Jake Navarro, Karen Flores, Leo Castillo
--    Step 5 (Program Head)   → Student2, Student3, Student4 Account
--    Step 6 (Dean)           → Student5, Student6 Account
--
--  Payment Verification (pending GCash submissions):
--    Student7, Student8, Student9 (original seed)
--    Maria Dela Rosa, Nathan Aquino, Olivia Bautista (new)
--    = 6 total pending submissions
--
--  Student11 / Student10 → unpaid (no clearance started)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = "+08:00";

-- ============================================================
-- PART 1: ORIGINAL DATA (Students 3–11)
-- ============================================================

-- Waive obligation 15 ("Eso fee", ₱0) for students 3–10
UPDATE student_obligations
SET status = 3, updated_at = NOW()
WHERE obligation_id = 15
  AND student_id IN (3, 4, 5, 6, 7, 8, 9, 10);

-- ESO Fee (obligation 13) for students 3–11
INSERT IGNORE INTO student_obligations
    (student_id, obligation_id, amount_due, status, created_at, updated_at)
VALUES
    (3,  13, 150.00, 2, '2026-03-28 08:00:00', '2026-04-01 09:00:00'),
    (4,  13, 150.00, 2, '2026-03-28 08:00:00', '2026-04-01 09:30:00'),
    (5,  13, 150.00, 2, '2026-03-28 08:00:00', '2026-04-02 10:00:00'),
    (6,  13, 150.00, 2, '2026-03-28 08:00:00', '2026-04-01 11:00:00'),
    (7,  13, 150.00, 2, '2026-03-28 08:00:00', '2026-04-01 11:30:00'),
    (8,  13, 150.00, 1, '2026-04-06 09:00:00', '2026-04-07 09:30:00'),
    (9,  13, 150.00, 1, '2026-04-06 09:00:00', '2026-04-07 10:15:00'),
    (10, 13, 150.00, 1, '2026-04-06 09:00:00', '2026-04-08 08:45:00'),
    (11, 13, 150.00, 0, '2026-04-06 09:00:00', '2026-04-06 09:00:00');

-- Payment submissions for students 8, 9, 10
SET @so8  = (SELECT student_obligation_id FROM student_obligations WHERE student_id=8  AND obligation_id=13 LIMIT 1);
SET @so9  = (SELECT student_obligation_id FROM student_obligations WHERE student_id=9  AND obligation_id=13 LIMIT 1);
SET @so10 = (SELECT student_obligation_id FROM student_obligations WHERE student_id=10 AND obligation_id=13 LIMIT 1);

INSERT IGNORE INTO payment_submissions
    (student_id, obligation_id, student_obligation_id, payment_receipt_path,
     receipt_filename, amount_paid, payment_type, payment_status, submitted_at, updated_at)
VALUES
    (8,  13, @so8,  NULL, 'gcash_receipt_student7.jpg', 150.00, 1, 0, '2026-04-07 09:28:00', '2026-04-07 09:28:00'),
    (9,  13, @so9,  NULL, 'gcash_receipt_student8.jpg', 150.00, 1, 0, '2026-04-07 10:12:00', '2026-04-07 10:12:00'),
    (10, 13, @so10, NULL, 'gcash_receipt_student9.jpg', 150.00,     1, 0, '2026-04-08 08:43:00', '2026-04-08 08:43:00');

-- Clearances for students 3–7
--   Students 3, 6 → fully approved (clearance_status=2)
--   Students 4, 5 → at step 5 (Program Head pending)
--   Student 7     → at step 6 (Dean pending)
INSERT IGNORE INTO clearances
    (student_id, school_year, semester, clearance_status, current_step, created_at, updated_at)
VALUES
    (3, '2025-2026', 2, 2, 6, '2026-04-01 09:00:00', '2026-04-08 10:00:00'),
    (4, '2025-2026', 2, 1, 5, '2026-04-01 09:10:00', '2026-04-07 14:30:00'),
    (5, '2025-2026', 2, 1, 5, '2026-04-02 10:00:00', '2026-04-07 15:00:00'),
    (6, '2025-2026', 2, 2, 6, '2026-03-31 09:00:00', '2026-04-08 11:00:00'),
    (7, '2025-2026', 2, 1, 6, '2026-03-31 09:20:00', '2026-04-06 14:30:00');

-- If rows already exist (re-run), force-update students 3 and 6 to fully approved
UPDATE clearances SET clearance_status = 2, current_step = 6, updated_at = '2026-04-08 10:00:00'
WHERE student_id = 3 AND school_year = '2025-2026' AND semester = 2;
UPDATE clearances SET clearance_status = 2, current_step = 6, updated_at = '2026-04-08 11:00:00'
WHERE student_id = 6 AND school_year = '2025-2026' AND semester = 2;

-- Capture clearance IDs for students 3–7
SET @cl3 = (SELECT clearance_id FROM clearances WHERE student_id=3 AND school_year='2025-2026' AND semester=2 LIMIT 1);
SET @cl4 = (SELECT clearance_id FROM clearances WHERE student_id=4 AND school_year='2025-2026' AND semester=2 LIMIT 1);
SET @cl5 = (SELECT clearance_id FROM clearances WHERE student_id=5 AND school_year='2025-2026' AND semester=2 LIMIT 1);
SET @cl6 = (SELECT clearance_id FROM clearances WHERE student_id=6 AND school_year='2025-2026' AND semester=2 LIMIT 1);
SET @cl7 = (SELECT clearance_id FROM clearances WHERE student_id=7 AND school_year='2025-2026' AND semester=2 LIMIT 1);

-- Admin IDs: Step1=5(class@) Step2=8(cpe.officer@) Step3=1(admin@) Step4=9(dane@) Step5=6(program@) Step6=7(dean@)

-- Student 3 (step 5 → steps 1–4 signed)
INSERT IGNORE INTO clearance_verifications (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at) VALUES
    (@cl3, 5, 3, 1, 1, '2026-04-01 09:15:00', '2026-04-01 09:15:00'),
    (@cl3, 8, 8, 2, 1, '2026-04-02 10:00:00', '2026-04-02 10:00:00'),
    (@cl3, 1, 2, 3, 1, '2026-04-04 11:00:00', '2026-04-04 11:00:00'),
    (@cl3, 9, 5, 4, 1, '2026-04-07 13:00:00', '2026-04-07 13:00:00');

-- Student 4 (step 5 → steps 1–4 signed)
INSERT IGNORE INTO clearance_verifications (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at) VALUES
    (@cl4, 5, 3, 1, 1, '2026-04-01 09:20:00', '2026-04-01 09:20:00'),
    (@cl4, 8, 8, 2, 1, '2026-04-02 10:30:00', '2026-04-02 10:30:00'),
    (@cl4, 1, 2, 3, 1, '2026-04-04 11:30:00', '2026-04-04 11:30:00'),
    (@cl4, 9, 5, 4, 1, '2026-04-07 13:30:00', '2026-04-07 13:30:00');

-- Student 5 (step 5 → steps 1–4 signed)
INSERT IGNORE INTO clearance_verifications (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at) VALUES
    (@cl5, 5, 3, 1, 1, '2026-04-02 10:15:00', '2026-04-02 10:15:00'),
    (@cl5, 8, 8, 2, 1, '2026-04-03 09:30:00', '2026-04-03 09:30:00'),
    (@cl5, 1, 2, 3, 1, '2026-04-05 10:00:00', '2026-04-05 10:00:00'),
    (@cl5, 9, 5, 4, 1, '2026-04-07 14:00:00', '2026-04-07 14:00:00');

-- Student 6 (step 6 → steps 1–5 signed)
INSERT IGNORE INTO clearance_verifications (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at) VALUES
    (@cl6, 5, 3, 1, 1, '2026-03-31 09:30:00', '2026-03-31 09:30:00'),
    (@cl6, 8, 8, 2, 1, '2026-04-01 10:00:00', '2026-04-01 10:00:00'),
    (@cl6, 1, 2, 3, 1, '2026-04-02 11:00:00', '2026-04-02 11:00:00'),
    (@cl6, 9, 5, 4, 1, '2026-04-04 13:00:00', '2026-04-04 13:00:00'),
    (@cl6, 6, 4, 5, 1, '2026-04-06 13:30:00', '2026-04-06 13:30:00');

-- Student 7 (step 6 → steps 1–5 signed)
INSERT IGNORE INTO clearance_verifications (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at) VALUES
    (@cl7, 5, 3, 1, 1, '2026-03-31 09:45:00', '2026-03-31 09:45:00'),
    (@cl7, 8, 8, 2, 1, '2026-04-01 10:30:00', '2026-04-01 10:30:00'),
    (@cl7, 1, 2, 3, 1, '2026-04-02 11:30:00', '2026-04-02 11:30:00'),
    (@cl7, 9, 5, 4, 1, '2026-04-04 13:30:00', '2026-04-04 13:30:00'),
    (@cl7, 6, 4, 5, 1, '2026-04-06 14:00:00', '2026-04-06 14:00:00');

-- Student 3 fully approved: add steps 5 (Program Head) and 6 (Dean)
INSERT IGNORE INTO clearance_verifications (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at) VALUES
    (@cl3, 6, 4, 5, 1, '2026-04-07 15:00:00', '2026-04-07 15:00:00'),
    (@cl3, 7, 6, 6, 1, '2026-04-08 10:00:00', '2026-04-08 10:00:00');

-- Student 6 fully approved: add step 6 (Dean)
INSERT IGNORE INTO clearance_verifications (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at) VALUES
    (@cl6, 7, 6, 6, 1, '2026-04-08 11:00:00', '2026-04-08 11:00:00');

-- Notifications for students 3–7
INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read, created_at) VALUES
    (1161, 'Clearance Approved', 'Congratulations! Your clearance has been fully approved.', 6, @cl3, 'clearance', 0, '2026-04-08 10:00:00'),
    (1162, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, @cl4, 'clearance', 0, '2026-04-07 13:30:00'),
    (1163, 'Clearance Update', 'Your clearance has been approved at step 4. Proceeding to Program Head.', 6, @cl5, 'clearance', 0, '2026-04-07 14:00:00'),
    (1164, 'Clearance Approved', 'Congratulations! Your clearance has been fully approved.', 6, @cl6, 'clearance', 0, '2026-04-08 11:00:00'),
    (1165, 'Clearance Update', 'Your clearance has been approved at step 5. Proceeding to Dean.', 6, @cl7, 'clearance', 0, '2026-04-06 14:00:00');


-- ============================================================
-- PART 2: NEW STUDENT ACCOUNTS (Steps 1–4 + more payment review)
-- ============================================================

-- New users (role_id=7 student, password = same as existing imported students)
INSERT IGNORE INTO users
    (user_id, first_name, last_name, email, password_hash, role_id, program_id, status, created_at, updated_at)
VALUES
    (1170, 'Alice',  'Santos',    'stu12@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 1, 'active', NOW(), NOW()),
    (1171, 'Bob',    'Reyes',     'stu13@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 1, 'active', NOW(), NOW()),
    (1172, 'Clara',  'Cruz',      'stu14@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 2, 'active', NOW(), NOW()),
    (1173, 'Diego',  'Lim',       'stu15@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 1, 'active', NOW(), NOW()),
    (1174, 'Elena',  'Torres',    'stu16@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 2, 'active', NOW(), NOW()),
    (1175, 'Felix',  'Garcia',    'stu17@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 3, 'active', NOW(), NOW()),
    (1176, 'Grace',  'Mendoza',   'stu18@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 2, 'active', NOW(), NOW()),
    (1177, 'Henry',  'Ramos',     'stu19@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 3, 'active', NOW(), NOW()),
    (1178, 'Iris',   'Valdez',    'stu20@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 4, 'active', NOW(), NOW()),
    (1179, 'Jake',   'Navarro',   'stu21@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 3, 'active', NOW(), NOW()),
    (1180, 'Karen',  'Flores',    'stu22@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 4, 'active', NOW(), NOW()),
    (1181, 'Leo',    'Castillo',  'stu23@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 5, 'active', NOW(), NOW()),
    (1182, 'Maria',  'Dela Rosa', 'stu24@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 5, 'active', NOW(), NOW()),
    (1183, 'Nathan', 'Aquino',    'stu25@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 5, 'active', NOW(), NOW()),
    (1184, 'Olivia', 'Bautista',  'stu26@gmail.com', '$2b$10$DM8bcQB2HezmMjsUzds7yeSpovKuGonbLG7nttWC.afBg/GgpKd7a', 7, 1, 'active', NOW(), NOW());

-- New student records
INSERT IGNORE INTO students
    (student_id, user_id, student_no, first_name, last_name, program_id, year_level, section, school_year, semester, is_enrolled, created_at, updated_at)
VALUES
    -- Step 1: Class Officer pending
    (12, 1170, '22B1010', 'Alice',  'Santos',    1, 2, 'B', '2025-2026', 2, 1, NOW(), NOW()),
    (13, 1171, '22B1011', 'Bob',    'Reyes',     1, 3, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    (14, 1172, '22B1012', 'Clara',  'Cruz',      2, 1, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    -- Step 2: Program Officer pending
    (15, 1173, '22B1013', 'Diego',  'Lim',       1, 2, 'C', '2025-2026', 2, 1, NOW(), NOW()),
    (16, 1174, '22B1014', 'Elena',  'Torres',    2, 2, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    (17, 1175, '22B1015', 'Felix',  'Garcia',    3, 1, 'B', '2025-2026', 2, 1, NOW(), NOW()),
    -- Step 3: ESO Officer pending
    (18, 1176, '22B1016', 'Grace',  'Mendoza',   2, 3, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    (19, 1177, '22B1017', 'Henry',  'Ramos',     3, 2, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    (20, 1178, '22B1018', 'Iris',   'Valdez',    4, 1, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    -- Step 4: Signatory pending
    (21, 1179, '22B1019', 'Jake',   'Navarro',   3, 3, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    (22, 1180, '22B1020', 'Karen',  'Flores',    4, 2, 'B', '2025-2026', 2, 1, NOW(), NOW()),
    (23, 1181, '22B1021', 'Leo',    'Castillo',  5, 1, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    -- Payment review students
    (24, 1182, '22B1022', 'Maria',  'Dela Rosa', 5, 2, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    (25, 1183, '22B1023', 'Nathan', 'Aquino',    5, 3, 'A', '2025-2026', 2, 1, NOW(), NOW()),
    (26, 1184, '22B1024', 'Olivia', 'Bautista',  1, 1, 'B', '2025-2026', 2, 1, NOW(), NOW());

-- ============================================================
-- PART 3: OBLIGATIONS FOR NEW STUDENTS
-- ============================================================

-- ESO Fee (obligation 13): paid for clearance students, pending for payment students
INSERT IGNORE INTO student_obligations
    (student_id, obligation_id, amount_due, status, created_at, updated_at)
VALUES
    (12, 13, 150.00, 2, '2026-04-06 08:00:00', '2026-04-06 09:00:00'),
    (13, 13, 150.00, 2, '2026-04-06 08:00:00', '2026-04-06 09:00:00'),
    (14, 13, 150.00, 2, '2026-04-06 08:00:00', '2026-04-06 09:00:00'),
    (15, 13, 150.00, 2, '2026-04-05 08:00:00', '2026-04-05 10:00:00'),
    (16, 13, 150.00, 2, '2026-04-05 08:00:00', '2026-04-05 10:00:00'),
    (17, 13, 150.00, 2, '2026-04-05 08:00:00', '2026-04-05 10:00:00'),
    (18, 13, 150.00, 2, '2026-04-04 08:00:00', '2026-04-04 10:00:00'),
    (19, 13, 150.00, 2, '2026-04-04 08:00:00', '2026-04-04 10:00:00'),
    (20, 13, 150.00, 2, '2026-04-04 08:00:00', '2026-04-04 10:00:00'),
    (21, 13, 150.00, 2, '2026-04-03 08:00:00', '2026-04-03 10:00:00'),
    (22, 13, 150.00, 2, '2026-04-03 08:00:00', '2026-04-03 10:00:00'),
    (23, 13, 150.00, 2, '2026-04-03 08:00:00', '2026-04-03 10:00:00'),
    (24, 13, 150.00, 1, '2026-04-08 10:00:00', '2026-04-09 09:00:00'),
    (25, 13, 150.00, 1, '2026-04-08 10:00:00', '2026-04-09 09:30:00'),
    (26, 13, 150.00, 1, '2026-04-08 10:00:00', '2026-04-09 10:00:00');

-- Eso fee (obligation 15 ₱0): waived for clearance students, unpaid for payment students
INSERT IGNORE INTO student_obligations
    (student_id, obligation_id, amount_due, status, created_at, updated_at)
VALUES
    (12, 15, 0.00, 3, NOW(), NOW()),
    (13, 15, 0.00, 3, NOW(), NOW()),
    (14, 15, 0.00, 3, NOW(), NOW()),
    (15, 15, 0.00, 3, NOW(), NOW()),
    (16, 15, 0.00, 3, NOW(), NOW()),
    (17, 15, 0.00, 3, NOW(), NOW()),
    (18, 15, 0.00, 3, NOW(), NOW()),
    (19, 15, 0.00, 3, NOW(), NOW()),
    (20, 15, 0.00, 3, NOW(), NOW()),
    (21, 15, 0.00, 3, NOW(), NOW()),
    (22, 15, 0.00, 3, NOW(), NOW()),
    (23, 15, 0.00, 3, NOW(), NOW()),
    (24, 15, 0.00, 0, NOW(), NOW()),
    (25, 15, 0.00, 0, NOW(), NOW()),
    (26, 15, 0.00, 0, NOW(), NOW());

-- ============================================================
-- PART 4: PAYMENT SUBMISSIONS FOR STUDENTS 24, 25, 26
-- ============================================================

SET @so24 = (SELECT student_obligation_id FROM student_obligations WHERE student_id=24 AND obligation_id=13 LIMIT 1);
SET @so25 = (SELECT student_obligation_id FROM student_obligations WHERE student_id=25 AND obligation_id=13 LIMIT 1);
SET @so26 = (SELECT student_obligation_id FROM student_obligations WHERE student_id=26 AND obligation_id=13 LIMIT 1);

INSERT IGNORE INTO payment_submissions
    (student_id, obligation_id, student_obligation_id, payment_receipt_path,
     receipt_filename, amount_paid, payment_type, payment_status, submitted_at, updated_at)
VALUES
    (24, 13, @so24, NULL, 'gcash_receipt_maria.jpg',   150.00, 1, 0, '2026-04-09 10:05:00', '2026-04-09 10:05:00'),
    (25, 13, @so25, NULL, 'gcash_receipt_nathan.jpg',  150.00, 1, 0, '2026-04-09 10:30:00', '2026-04-09 10:30:00'),
    (26, 13, @so26, NULL, 'gcash_receipt_olivia.jpg',  150.00, 1, 0, '2026-04-09 11:00:00', '2026-04-09 11:00:00');

-- ============================================================
-- PART 5: CLEARANCES FOR NEW STUDENTS AT STEPS 1–4
-- ============================================================

INSERT IGNORE INTO clearances
    (student_id, school_year, semester, clearance_status, current_step, created_at, updated_at)
VALUES
    -- Step 1: awaiting Class Officer signature
    (12, '2025-2026', 2, 1, 1, '2026-04-06 09:00:00', '2026-04-06 09:00:00'),
    (13, '2025-2026', 2, 1, 1, '2026-04-06 09:10:00', '2026-04-06 09:10:00'),
    (14, '2025-2026', 2, 1, 1, '2026-04-06 09:20:00', '2026-04-06 09:20:00'),
    -- Step 2: awaiting Program Officer signature
    (15, '2025-2026', 2, 1, 2, '2026-04-05 09:00:00', '2026-04-06 10:00:00'),
    (16, '2025-2026', 2, 1, 2, '2026-04-05 09:10:00', '2026-04-06 10:10:00'),
    (17, '2025-2026', 2, 1, 2, '2026-04-05 09:20:00', '2026-04-06 10:20:00'),
    -- Step 3: awaiting ESO Officer signature
    (18, '2025-2026', 2, 1, 3, '2026-04-04 09:00:00', '2026-04-06 11:00:00'),
    (19, '2025-2026', 2, 1, 3, '2026-04-04 09:10:00', '2026-04-06 11:10:00'),
    (20, '2025-2026', 2, 1, 3, '2026-04-04 09:20:00', '2026-04-06 11:20:00'),
    -- Step 4: awaiting Signatory signature
    (21, '2025-2026', 2, 1, 4, '2026-04-03 09:00:00', '2026-04-07 09:00:00'),
    (22, '2025-2026', 2, 1, 4, '2026-04-03 09:10:00', '2026-04-07 09:10:00'),
    (23, '2025-2026', 2, 1, 4, '2026-04-03 09:20:00', '2026-04-07 09:20:00');

-- ============================================================
-- PART 6: CLEARANCE VERIFICATIONS FOR COMPLETED PRIOR STEPS
-- ============================================================

-- Step 2 students (15,16,17): step 1 already signed by Class Officer
INSERT IGNORE INTO clearance_verifications
    (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at)
SELECT cl.clearance_id, 5, 3, 1, 1, '2026-04-06 09:30:00', '2026-04-06 09:30:00'
FROM clearances cl
WHERE cl.student_id IN (15, 16, 17) AND cl.school_year = '2025-2026' AND cl.semester = 2;

-- Step 3 students (18,19,20): steps 1 and 2 already signed
INSERT IGNORE INTO clearance_verifications
    (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at)
SELECT cl.clearance_id, 5, 3, 1, 1, '2026-04-05 09:30:00', '2026-04-05 09:30:00'
FROM clearances cl
WHERE cl.student_id IN (18, 19, 20) AND cl.school_year = '2025-2026' AND cl.semester = 2;

INSERT IGNORE INTO clearance_verifications
    (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at)
SELECT cl.clearance_id, 8, 8, 2, 1, '2026-04-06 10:00:00', '2026-04-06 10:00:00'
FROM clearances cl
WHERE cl.student_id IN (18, 19, 20) AND cl.school_year = '2025-2026' AND cl.semester = 2;

-- Step 4 students (21,22,23): steps 1, 2, and 3 already signed
INSERT IGNORE INTO clearance_verifications
    (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at)
SELECT cl.clearance_id, 5, 3, 1, 1, '2026-04-04 09:30:00', '2026-04-04 09:30:00'
FROM clearances cl
WHERE cl.student_id IN (21, 22, 23) AND cl.school_year = '2025-2026' AND cl.semester = 2;

INSERT IGNORE INTO clearance_verifications
    (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at)
SELECT cl.clearance_id, 8, 8, 2, 1, '2026-04-05 10:00:00', '2026-04-05 10:00:00'
FROM clearances cl
WHERE cl.student_id IN (21, 22, 23) AND cl.school_year = '2025-2026' AND cl.semester = 2;

INSERT IGNORE INTO clearance_verifications
    (clearance_id, admin_id, role_id, step_order, status, verified_at, created_at)
SELECT cl.clearance_id, 1, 2, 3, 1, '2026-04-06 11:00:00', '2026-04-06 11:00:00'
FROM clearances cl
WHERE cl.student_id IN (21, 22, 23) AND cl.school_year = '2025-2026' AND cl.semester = 2;

SET FOREIGN_KEY_CHECKS = 1;
