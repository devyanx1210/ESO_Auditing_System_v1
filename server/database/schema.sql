-- ============================================================
--  ESO AUDITING SYSTEM
--  Engineering Student Organization
--  Philippine Standard Time (UTC+8)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+08:00";

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    department_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(10)  NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (code, name) VALUES
    ('CpE', 'Computer Engineering'),
    ('CE',  'Civil Engineering'),
    ('ECE', 'Electronics Engineering'),
    ('EE',  'Electrical Engineering'),
    ('ME',  'Mechanical Engineering');


-- ============================================================
-- 2. ROLES
-- ============================================================
CREATE TABLE roles (
    role_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name       VARCHAR(50)  NOT NULL UNIQUE,
    role_label      VARCHAR(100) NOT NULL,
    clearance_step  TINYINT UNSIGNED NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (role_name, role_label, clearance_step) VALUES
    ('system_admin',  'System Administrator', NULL),
    ('eso_officer',   'ESO Officer',          1),
    ('class_officer', 'Class Officer',        NULL),
    ('program_head',  'Program Head',         2),
    ('signatory',     'Signatory',            3),
    ('dean',          'Dean of Engineering',  4),
    ('student',       'Student',              NULL);


-- ============================================================
-- 3. USERS
-- ============================================================
CREATE TABLE users (
    user_id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name               VARCHAR(100) NOT NULL,
    last_name                VARCHAR(100) NOT NULL,
    email                    VARCHAR(191) NOT NULL UNIQUE,
    password_hash            VARCHAR(255) NOT NULL,
    role_id                  INT UNSIGNED NOT NULL,
    department_id            INT UNSIGNED NULL,
    status                   ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    failed_login_attempts    INT NOT NULL DEFAULT 0,
    locked_until             TIMESTAMP NULL,
    refresh_token            VARCHAR(500) NULL,
    refresh_token_expires_at TIMESTAMP NULL,
    last_login_at            TIMESTAMP NULL,
    last_login_ip            VARCHAR(45) NULL,
    password_changed_at      TIMESTAMP NULL,
    deleted_at               TIMESTAMP NULL,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role FOREIGN KEY (role_id)
        REFERENCES roles(role_id),
    CONSTRAINT fk_users_dept FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL
);

INSERT INTO users (first_name, last_name, email, password_hash, role_id, department_id, status)
VALUES (
    'System', 'Admin',
    'admin@eso.edu.ph',
    '$2b$10$placeholder_hash_change_this_immediately',
    (SELECT role_id FROM roles WHERE role_name = 'system_admin'),
    NULL,
    'active'
);


-- ============================================================
-- 4. ADMINS
-- ============================================================
CREATE TABLE admins (
    admin_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL UNIQUE,
    position        VARCHAR(150) NOT NULL,
    department_id   INT UNSIGNED NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_admins_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_admins_dept FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL
);


-- ============================================================
-- 5. STUDENTS
-- ============================================================
CREATE TABLE students (
    student_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL UNIQUE,
    student_no      VARCHAR(20)  NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    middle_name     VARCHAR(100) NULL,
    gender          ENUM('Male','Female','Other') NULL,
    department_id   INT UNSIGNED NOT NULL,
    year_level      TINYINT UNSIGNED NOT NULL,
    section         VARCHAR(10)  NULL,
    school_year     VARCHAR(10)  NOT NULL,
    semester        ENUM('1st','2nd','Summer') NOT NULL,
    is_enrolled     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_students_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_students_dept FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
);


-- ============================================================
-- 6. OBLIGATIONS
-- ============================================================
CREATE TABLE obligations (
    obligation_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    obligation_name VARCHAR(250) NOT NULL,
    description     VARCHAR(250) NULL,
    amount          DECIMAL(10,2) NOT NULL,
    is_required     TINYINT(1)   NOT NULL DEFAULT 1,
    scope           ENUM('all','department','year_level','section') NOT NULL DEFAULT 'all',
    department_id   INT UNSIGNED NULL,
    year_level      TINYINT UNSIGNED NULL,
    section         VARCHAR(10)  NULL,
    school_year     VARCHAR(10)  NOT NULL,
    semester        ENUM('1st','2nd','Summer') NOT NULL,
    due_date        DATE         NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_by      INT UNSIGNED NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_oblig_dept    FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL,
    CONSTRAINT fk_oblig_creator FOREIGN KEY (created_by)
        REFERENCES admins(admin_id)
);


-- ============================================================
-- 7. STUDENT OBLIGATIONS
-- ============================================================
CREATE TABLE student_obligations (
    student_obligation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id      INT UNSIGNED NOT NULL,
    obligation_id   INT UNSIGNED NOT NULL,
    amount_due      DECIMAL(10,2) NOT NULL,
    status          ENUM('unpaid','pending_verification','paid','waived') NOT NULL DEFAULT 'unpaid',
    waived_by       INT UNSIGNED NULL,
    waive_reason    VARCHAR(255) NULL,
    notified_at     TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_student_obligation (student_id, obligation_id),

    CONSTRAINT fk_so_student    FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_so_obligation FOREIGN KEY (obligation_id)
        REFERENCES obligations(obligation_id) ON DELETE CASCADE,
    CONSTRAINT fk_so_waived_by  FOREIGN KEY (waived_by)
        REFERENCES admins(admin_id) ON DELETE SET NULL
);


-- ============================================================
-- 8. PAYMENT SUBMISSIONS
-- ============================================================
CREATE TABLE payment_submissions (
    payment_id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id              INT UNSIGNED NOT NULL,
    obligation_id           INT UNSIGNED NOT NULL,
    student_obligation_id   INT UNSIGNED NOT NULL,
    receipt_path            VARCHAR(500) NOT NULL,
    amount_paid             DECIMAL(10,2) NOT NULL,
    notes                   TEXT NULL,
    payment_status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    submitted_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ps_student    FOREIGN KEY (student_id)
        REFERENCES students(student_id),
    CONSTRAINT fk_ps_obligation FOREIGN KEY (obligation_id)
        REFERENCES obligations(obligation_id),
    CONSTRAINT fk_ps_so         FOREIGN KEY (student_obligation_id)
        REFERENCES student_obligations(student_obligation_id) ON DELETE CASCADE
);


-- ============================================================
-- 9. PAYMENT VERIFICATIONS
-- ============================================================
CREATE TABLE payment_verifications (
    payment_verification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payment_id              INT UNSIGNED NOT NULL UNIQUE,
    admin_id                INT UNSIGNED NOT NULL,
    verification_status     ENUM('approved','rejected') NOT NULL,
    remarks                 VARCHAR(250) NULL,
    verified_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pv_payment FOREIGN KEY (payment_id)
        REFERENCES payment_submissions(payment_id) ON DELETE CASCADE,
    CONSTRAINT fk_pv_admin   FOREIGN KEY (admin_id)
        REFERENCES admins(admin_id)
);


-- ============================================================
-- 10. CLEARANCES
-- ============================================================
CREATE TABLE clearances (
    clearance_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id          INT UNSIGNED NOT NULL,
    school_year         VARCHAR(10)  NOT NULL,
    semester            ENUM('1st','2nd','Summer') NOT NULL,
    clearance_status    ENUM('pending','in_progress','cleared','rejected') NOT NULL DEFAULT 'pending',
    current_step        TINYINT UNSIGNED NOT NULL DEFAULT 1,
    generated_at        DATE NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_clearance (student_id, school_year, semester),

    CONSTRAINT fk_cl_student FOREIGN KEY (student_id)
        REFERENCES students(student_id) ON DELETE CASCADE
);


-- ============================================================
-- 11. CLEARANCE VERIFICATIONS
--     Step 1 → ESO Officer
--     Step 2 → Program Head
--     Step 3 → Signatory (Registrar, Cashier, Adviser, etc.)
--     Step 4 → Dean
-- ============================================================
CREATE TABLE clearance_verifications (
    clearance_verification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clearance_id        INT UNSIGNED NOT NULL,
    admin_id            INT UNSIGNED NOT NULL,
    role_id             INT UNSIGNED NOT NULL,
    step_order          TINYINT UNSIGNED NOT NULL,
    status              ENUM('pending','signed','rejected') NOT NULL DEFAULT 'pending',
    remarks             VARCHAR(255) NULL,
    verified_at         TIMESTAMP NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_clearance_step (clearance_id, step_order),

    CONSTRAINT fk_cv_clearance FOREIGN KEY (clearance_id)
        REFERENCES clearances(clearance_id) ON DELETE CASCADE,
    CONSTRAINT fk_cv_admin     FOREIGN KEY (admin_id)
        REFERENCES admins(admin_id),
    CONSTRAINT fk_cv_role      FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
);


-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    type            ENUM(
                        'obligation_assigned',
                        'obligation_updated',
                        'obligation_deleted',
                        'obligation_reminder',
                        'payment_submitted',
                        'payment_approved',
                        'payment_rejected',
                        'clearance_signed',
                        'clearance_rejected',
                        'clearance_cleared'
                    ) NOT NULL,
    reference_id    INT UNSIGNED NULL,
    reference_type  VARCHAR(50)  NULL,
    is_read         TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,

    INDEX idx_notif_user_read (user_id, is_read)
);


-- ============================================================
-- 13. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    audit_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    performed_by    INT UNSIGNED NOT NULL,
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(50)  NULL,
    target_id       INT UNSIGNED NULL,
    details         JSON         NULL,
    ip_address      VARCHAR(45)  NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user FOREIGN KEY (performed_by)
        REFERENCES users(user_id),

    INDEX idx_audit_action (action),
    INDEX idx_audit_target (target_type, target_id)
);


-- ============================================================
-- INDEXES
-- ============================================================
ALTER TABLE users                   ADD INDEX idx_users_role    (role_id);
ALTER TABLE students                ADD INDEX idx_students_dept (department_id);
ALTER TABLE students                ADD INDEX idx_students_sy   (school_year, semester);
ALTER TABLE student_obligations     ADD INDEX idx_so_status     (status);
ALTER TABLE payment_submissions     ADD INDEX idx_ps_status     (payment_status);
ALTER TABLE clearances              ADD INDEX idx_cl_status     (clearance_status);
ALTER TABLE clearances              ADD INDEX idx_cl_step       (current_step);
ALTER TABLE clearance_verifications ADD INDEX idx_cv_step       (status, step_order);

SET FOREIGN_KEY_CHECKS = 1;