-- ============================================================
--  MIGRATION v2 — ESO Auditing System
--  1. Storage optimization (VARCHAR trim + ENUM → TINYINT)
--  2. New tables: courses, sections
--  3. Analytics views
-- ============================================================
--
--  TINYINT(3) VALUE MAPS (reference when updating app code)
--  ──────────────────────────────────────────────────────────
--  users.status              0=inactive  1=active   2=suspended  3=reserved
--  students.gender           0=unknown   1=male     2=female     3=other
--  students.semester         1=1st       2=2nd      3=summer
--  obligations.scope         0=all       1=program  2=year_level 3=section
--  obligations.semester      1=1st       2=2nd      3=summer
--  student_obligations.status 0=unpaid   1=pending  2=paid       3=waived
--  payment_submissions.payment_status  0=pending   1=approved   2=rejected
--  payment_verifications.verification_status  0=rejected  1=approved
--  clearances.clearance_status  0=pending  1=in_progress  2=cleared  3=rejected
--  clearances.semester          1=1st      2=2nd          3=summer
--  clearance_verifications.status  0=pending  1=signed  2=rejected
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SECTION 1 : VARCHAR OPTIMIZATIONS
-- Safe shrinks — no data will be lost (existing values fit)
-- ============================================================

ALTER TABLE departments
    MODIFY COLUMN code         VARCHAR(5)   NOT NULL,
    MODIFY COLUMN name         VARCHAR(80)  NOT NULL;

ALTER TABLE roles
    MODIFY COLUMN role_name    VARCHAR(30)  NOT NULL,
    MODIFY COLUMN role_label   VARCHAR(60)  NOT NULL;

ALTER TABLE admins
    MODIFY COLUMN position     VARCHAR(80)  NOT NULL;

ALTER TABLE users
    MODIFY COLUMN first_name   VARCHAR(80)  NOT NULL,
    MODIFY COLUMN last_name    VARCHAR(80)  NOT NULL,
    -- email kept at 191 (UTF8MB4 index limit)
    -- password_hash kept at 255 (bcrypt output)
    -- refresh_token kept at 500 (JWT)
    MODIFY COLUMN last_login_ip VARCHAR(45) NULL;  -- 45 covers full IPv6

ALTER TABLE students
    MODIFY COLUMN first_name   VARCHAR(80)  NOT NULL,
    MODIFY COLUMN last_name    VARCHAR(80)  NOT NULL,
    MODIFY COLUMN middle_name  VARCHAR(80)  NULL,
    MODIFY COLUMN student_no   VARCHAR(20)  NOT NULL,
    MODIFY COLUMN section      VARCHAR(5)   NULL,
    MODIFY COLUMN school_year  VARCHAR(9)   NOT NULL;  -- '2025-2026' = 9 chars

ALTER TABLE obligations
    MODIFY COLUMN obligation_name VARCHAR(150) NOT NULL,
    MODIFY COLUMN school_year     VARCHAR(9)   NOT NULL,
    MODIFY COLUMN section         VARCHAR(5)   NULL;

ALTER TABLE student_obligations
    MODIFY COLUMN waive_reason    VARCHAR(200) NULL;

ALTER TABLE payment_verifications
    MODIFY COLUMN remarks         VARCHAR(200) NULL;

ALTER TABLE clearances
    MODIFY COLUMN school_year     VARCHAR(9)   NOT NULL;

ALTER TABLE clearance_verifications
    MODIFY COLUMN remarks         VARCHAR(200) NULL;

ALTER TABLE notifications
    MODIFY COLUMN title           VARCHAR(100) NOT NULL,
    MODIFY COLUMN type            VARCHAR(25)  NOT NULL,
    MODIFY COLUMN reference_type  VARCHAR(20)  NULL;

ALTER TABLE audit_logs
    MODIFY COLUMN action          VARCHAR(50)  NOT NULL,
    MODIFY COLUMN target_type     VARCHAR(30)  NULL;


-- ============================================================
-- SECTION 2 : ENUM → TINYINT CONVERSIONS
-- Pattern: add _new column → migrate data → drop old → rename
-- ============================================================

-- ── users.status ── 0=inactive 1=active 2=suspended 3=reserved
ALTER TABLE users
    ADD COLUMN status_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '0=inactive,1=active,2=suspended,3=reserved' AFTER department_id;
UPDATE users SET status_new = CASE status
    WHEN 'active'    THEN 1
    WHEN 'inactive'  THEN 0
    WHEN 'suspended' THEN 2
    ELSE 1 END;
ALTER TABLE users DROP COLUMN status;
ALTER TABLE users CHANGE COLUMN status_new status
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
    COMMENT '0=inactive,1=active,2=suspended,3=reserved';

-- ── students.gender ── 0=unknown 1=male 2=female 3=other
ALTER TABLE students
    ADD COLUMN gender_new TINYINT(3) UNSIGNED NULL DEFAULT NULL
        COMMENT '0=unknown,1=male,2=female,3=other' AFTER middle_name;
UPDATE students SET gender_new = CASE gender
    WHEN 'Male'   THEN 1
    WHEN 'Female' THEN 2
    WHEN 'Other'  THEN 3
    ELSE NULL END;
ALTER TABLE students DROP COLUMN gender;
ALTER TABLE students CHANGE COLUMN gender_new gender
    TINYINT(3) UNSIGNED NULL DEFAULT NULL
    COMMENT '0=unknown,1=male,2=female,3=other';

-- ── students.semester ── 1=1st 2=2nd 3=summer
ALTER TABLE students
    ADD COLUMN semester_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '1=1st,2=2nd,3=summer' AFTER school_year;
UPDATE students SET semester_new = CASE semester
    WHEN '1st'    THEN 1
    WHEN '2nd'    THEN 2
    WHEN 'Summer' THEN 3
    ELSE 1 END;
ALTER TABLE students DROP COLUMN semester;
ALTER TABLE students CHANGE COLUMN semester_new semester
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
    COMMENT '1=1st,2=2nd,3=summer';

-- ── obligations.scope ── 0=all 1=program 2=year_level 3=section
ALTER TABLE obligations
    ADD COLUMN scope_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
        COMMENT '0=all,1=program,2=year_level,3=section' AFTER is_required;
UPDATE obligations SET scope_new = CASE scope
    WHEN 'all'        THEN 0
    WHEN 'department' THEN 1
    WHEN 'year_level' THEN 2
    WHEN 'section'    THEN 3
    ELSE 0 END;
ALTER TABLE obligations DROP COLUMN scope;
ALTER TABLE obligations CHANGE COLUMN scope_new scope
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
    COMMENT '0=all,1=program,2=year_level,3=section';

-- ── obligations.semester ── 1=1st 2=2nd 3=summer
ALTER TABLE obligations
    ADD COLUMN semester_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '1=1st,2=2nd,3=summer' AFTER school_year;
UPDATE obligations SET semester_new = CASE semester
    WHEN '1st'    THEN 1
    WHEN '2nd'    THEN 2
    WHEN 'Summer' THEN 3
    ELSE 1 END;
ALTER TABLE obligations DROP COLUMN semester;
ALTER TABLE obligations CHANGE COLUMN semester_new semester
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
    COMMENT '1=1st,2=2nd,3=summer';

-- ── student_obligations.status ── 0=unpaid 1=pending 2=paid 3=waived
ALTER TABLE student_obligations
    ADD COLUMN status_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
        COMMENT '0=unpaid,1=pending_verification,2=paid,3=waived' AFTER amount_due;
UPDATE student_obligations SET status_new = CASE status
    WHEN 'unpaid'               THEN 0
    WHEN 'pending_verification' THEN 1
    WHEN 'paid'                 THEN 2
    WHEN 'waived'               THEN 3
    ELSE 0 END;
ALTER TABLE student_obligations DROP COLUMN status;
ALTER TABLE student_obligations CHANGE COLUMN status_new status
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
    COMMENT '0=unpaid,1=pending_verification,2=paid,3=waived';

-- ── payment_submissions.payment_status ── 0=pending 1=approved 2=rejected
ALTER TABLE payment_submissions
    ADD COLUMN payment_status_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
        COMMENT '0=pending,1=approved,2=rejected' AFTER notes;
UPDATE payment_submissions SET payment_status_new = CASE payment_status
    WHEN 'pending'  THEN 0
    WHEN 'approved' THEN 1
    WHEN 'rejected' THEN 2
    ELSE 0 END;
ALTER TABLE payment_submissions DROP COLUMN payment_status;
ALTER TABLE payment_submissions CHANGE COLUMN payment_status_new payment_status
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
    COMMENT '0=pending,1=approved,2=rejected';

-- ── payment_verifications.verification_status ── 0=rejected 1=approved
ALTER TABLE payment_verifications
    ADD COLUMN verification_status_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
        COMMENT '0=rejected,1=approved' AFTER admin_id;
UPDATE payment_verifications SET verification_status_new = CASE verification_status
    WHEN 'approved' THEN 1
    WHEN 'rejected' THEN 0
    ELSE 0 END;
ALTER TABLE payment_verifications DROP COLUMN verification_status;
ALTER TABLE payment_verifications CHANGE COLUMN verification_status_new verification_status
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
    COMMENT '0=rejected,1=approved';

-- ── clearances.clearance_status ── 0=pending 1=in_progress 2=cleared 3=rejected
ALTER TABLE clearances
    ADD COLUMN clearance_status_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
        COMMENT '0=pending,1=in_progress,2=cleared,3=rejected' AFTER semester;
UPDATE clearances SET clearance_status_new = CASE clearance_status
    WHEN 'pending'     THEN 0
    WHEN 'in_progress' THEN 1
    WHEN 'cleared'     THEN 2
    WHEN 'rejected'    THEN 3
    ELSE 0 END;
ALTER TABLE clearances DROP COLUMN clearance_status;
ALTER TABLE clearances CHANGE COLUMN clearance_status_new clearance_status
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
    COMMENT '0=pending,1=in_progress,2=cleared,3=rejected';

-- ── clearances.semester ── 1=1st 2=2nd 3=summer
ALTER TABLE clearances
    ADD COLUMN semester_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '1=1st,2=2nd,3=summer' AFTER school_year;
UPDATE clearances SET semester_new = CASE semester
    WHEN '1st'    THEN 1
    WHEN '2nd'    THEN 2
    WHEN 'Summer' THEN 3
    ELSE 1 END;
ALTER TABLE clearances DROP COLUMN semester;
ALTER TABLE clearances CHANGE COLUMN semester_new semester
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
    COMMENT '1=1st,2=2nd,3=summer';

-- ── clearance_verifications.status ── 0=pending 1=signed 2=rejected
ALTER TABLE clearance_verifications
    ADD COLUMN status_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
        COMMENT '0=pending,1=signed,2=rejected' AFTER step_order;
UPDATE clearance_verifications SET status_new = CASE status
    WHEN 'pending'  THEN 0
    WHEN 'signed'   THEN 1
    WHEN 'rejected' THEN 2
    ELSE 0 END;
ALTER TABLE clearance_verifications DROP COLUMN status;
ALTER TABLE clearance_verifications CHANGE COLUMN status_new status
    TINYINT(3) UNSIGNED NOT NULL DEFAULT 0
    COMMENT '0=pending,1=signed,2=rejected';


-- ============================================================
-- SECTION 3 : NEW TABLES — COURSES & SECTIONS
-- ============================================================

-- courses: one course belongs to one program/department
-- e.g., CpE has "Computer Engineering" with code "CpE401"
CREATE TABLE courses (
    course_id     SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    department_id INT UNSIGNED   NOT NULL,
    course_code   VARCHAR(15)    NOT NULL UNIQUE,   -- e.g. 'CpE401'
    course_name   VARCHAR(100)   NOT NULL,           -- e.g. 'Digital Systems'
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_courses_dept FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
);

-- sections: one section belongs to one course, per year_level + semester
-- e.g., CpE401 - 3A - 2025-2026 - 1st
CREATE TABLE sections (
    section_id    SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id     SMALLINT UNSIGNED NOT NULL,
    section_name  VARCHAR(5)        NOT NULL,   -- e.g. 'A', 'B', '1A'
    year_level    TINYINT UNSIGNED  NOT NULL,
    school_year   VARCHAR(9)        NOT NULL,   -- e.g. '2025-2026'
    semester      TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
                  COMMENT '1=1st,2=2nd,3=summer',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_section (course_id, section_name, year_level, school_year, semester),

    CONSTRAINT fk_sections_course FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
);

-- Link students to their section (nullable — existing students have no section_id yet)
ALTER TABLE students
    ADD COLUMN section_id SMALLINT UNSIGNED NULL AFTER section,
    ADD CONSTRAINT fk_students_section
        FOREIGN KEY (section_id) REFERENCES sections(section_id)
        ON DELETE SET NULL;

-- Index for fast section lookups
ALTER TABLE sections ADD INDEX idx_sections_school (school_year, semester);
ALTER TABLE students ADD INDEX idx_students_section (section_id);


-- ============================================================
-- SECTION 4 : ANALYTICS VIEWS
-- ============================================================

-- View: Total approved payments per section
CREATE OR REPLACE VIEW v_section_payments AS
SELECT
    sec.section_id,
    sec.section_name,
    sec.year_level,
    sec.school_year,
    sec.semester,
    c.course_code,
    c.course_name,
    d.code                                                               AS dept_code,
    d.name                                                               AS dept_name,
    COUNT(DISTINCT s.student_id)                                         AS total_students,
    COUNT(DISTINCT CASE WHEN s.is_enrolled = 1 THEN s.student_id END)   AS enrolled_students,
    COALESCE(SUM(CASE WHEN ps.payment_status = 1 THEN ps.amount_paid ELSE 0 END), 0)
                                                                         AS total_collected
FROM sections sec
JOIN courses      c  ON c.course_id     = sec.course_id
JOIN departments  d  ON d.department_id = c.department_id
LEFT JOIN students s ON s.section_id   = sec.section_id
LEFT JOIN payment_submissions ps        ON ps.student_id = s.student_id
GROUP BY
    sec.section_id, sec.section_name, sec.year_level,
    sec.school_year, sec.semester,
    c.course_code, c.course_name, d.code, d.name;


-- View: Total approved payments per course (rollup of all its sections)
CREATE OR REPLACE VIEW v_course_payments AS
SELECT
    c.course_id,
    c.course_code,
    c.course_name,
    d.code                                                              AS dept_code,
    d.name                                                              AS dept_name,
    COUNT(DISTINCT s.student_id)                                        AS total_students,
    COUNT(DISTINCT CASE WHEN s.is_enrolled = 1 THEN s.student_id END)  AS enrolled_students,
    COALESCE(SUM(CASE WHEN ps.payment_status = 1 THEN ps.amount_paid ELSE 0 END), 0)
                                                                        AS total_collected
FROM courses      c
JOIN departments  d   ON d.department_id = c.department_id
LEFT JOIN sections sec ON sec.course_id  = c.course_id
LEFT JOIN students s   ON s.section_id   = sec.section_id
LEFT JOIN payment_submissions ps          ON ps.student_id = s.student_id
GROUP BY c.course_id, c.course_code, c.course_name, d.code, d.name;


-- View: Total enrolled students per semester (across all programs)
CREATE OR REPLACE VIEW v_enrollment_per_semester AS
SELECT
    school_year,
    semester,                           -- 1=1st, 2=2nd, 3=summer
    department_id,
    COUNT(*) AS total_enrolled
FROM students
WHERE is_enrolled = 1
GROUP BY school_year, semester, department_id
ORDER BY school_year DESC, semester ASC;


-- View: Total registered accounts (all users who signed up)
CREATE OR REPLACE VIEW v_registered_accounts AS
SELECT
    COUNT(*)                                           AS total_accounts,
    SUM(r.role_name = 'student')                       AS total_students,
    SUM(r.role_name != 'student')                      AS total_admins,
    SUM(u.status = 1)                                  AS total_active,
    SUM(u.status = 0)                                  AS total_inactive,
    SUM(u.status = 2)                                  AS total_suspended
FROM users u
JOIN roles r ON r.role_id = u.role_id
WHERE u.deleted_at IS NULL;


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONE. Run this once against your existing database.
-- After running, update application service files to use
-- integer values instead of ENUM strings (see value map above).
-- ============================================================
