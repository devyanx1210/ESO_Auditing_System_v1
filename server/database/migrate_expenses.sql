-- ============================================================
-- migrate_expenses.sql
-- Creates the expenses table for the Audit/Finance module
-- Run once in phpMyAdmin on eso_auditing_db
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    expense_id    INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    title         VARCHAR(200)      NOT NULL,
    description   TEXT                       DEFAULT NULL,
    amount        DECIMAL(10,2)     NOT NULL,
    semester      TINYINT UNSIGNED  NOT NULL COMMENT '1=1st, 2=2nd, 3=Summer',
    school_year   VARCHAR(20)       NOT NULL COMMENT 'e.g. 2024-2025',
    recorded_by   INT UNSIGNED      NOT NULL,
    receipt_path  VARCHAR(500)               DEFAULT NULL,
    created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at    DATETIME                   DEFAULT NULL,
    PRIMARY KEY (expense_id),
    INDEX idx_expenses_semester   (semester),
    INDEX idx_expenses_school_year (school_year),
    INDEX idx_expenses_recorded_by (recorded_by),
    INDEX idx_expenses_deleted_at  (deleted_at),
    CONSTRAINT fk_expenses_recorded_by FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
