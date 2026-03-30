-- ============================================================
-- migrate_budgets.sql
-- Budget proposal table for Audit/Finance module
-- Run once in phpMyAdmin on eso_auditing_db
-- ============================================================

CREATE TABLE IF NOT EXISTS budgets (
    budget_id       INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    title           VARCHAR(200)     NOT NULL,
    description     TEXT                      DEFAULT NULL,
    allocated_amount DECIMAL(10,2)   NOT NULL,
    semester        TINYINT UNSIGNED NOT NULL COMMENT '1=1st, 2=2nd, 3=Summer',
    school_year     VARCHAR(20)      NOT NULL COMMENT 'e.g. 2024-2025',
    created_by      INT UNSIGNED     NOT NULL,
    created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME                  DEFAULT NULL,
    PRIMARY KEY (budget_id),
    INDEX idx_budgets_semester    (semester),
    INDEX idx_budgets_school_year (school_year),
    INDEX idx_budgets_deleted_at  (deleted_at),
    CONSTRAINT fk_budgets_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
