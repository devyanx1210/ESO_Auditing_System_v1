-- ============================================================
-- migrate_enum_to_tinyint_v2.sql
-- Converts remaining ENUM semester columns to TINYINT
-- Targets: obligations, student_imports, system_settings
-- MariaDB 10.4 compatible (uses CHANGE COLUMN, not RENAME COLUMN)
-- Run in phpMyAdmin SQL tab
-- ============================================================

-- ── 1. obligations.semester ──────────────────────────────────
-- ENUM('1st','2nd','Summer') → TINYINT (1=1st, 2=2nd, 3=Summer)

ALTER TABLE obligations
    ADD COLUMN semester_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '1=1st,2=2nd,3=Summer' AFTER school_year;

UPDATE obligations SET semester_new = CASE semester
    WHEN '1st'    THEN 1
    WHEN '2nd'    THEN 2
    WHEN 'Summer' THEN 3
    ELSE 1
END;

ALTER TABLE obligations DROP COLUMN semester;

ALTER TABLE obligations
    CHANGE COLUMN semester_new semester
        TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '1=1st,2=2nd,3=Summer';


-- ── 2. student_imports.semester ──────────────────────────────
-- ENUM('1st','2nd','Summer') → TINYINT (1=1st, 2=2nd, 3=Summer)

ALTER TABLE student_imports
    ADD COLUMN semester_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '1=1st,2=2nd,3=Summer' AFTER school_year;

UPDATE student_imports SET semester_new = CASE semester
    WHEN '1st'    THEN 1
    WHEN '2nd'    THEN 2
    WHEN 'Summer' THEN 3
    ELSE 1
END;

ALTER TABLE student_imports DROP COLUMN semester;

ALTER TABLE student_imports
    CHANGE COLUMN semester_new semester
        TINYINT(3) UNSIGNED NOT NULL DEFAULT 1
        COMMENT '1=1st,2=2nd,3=Summer';


-- ── 3. system_settings.current_semester ──────────────────────
-- ENUM('1st','2nd','Summer') → TINYINT (1=1st, 2=2nd, 3=Summer)

ALTER TABLE system_settings
    ADD COLUMN semester_new TINYINT(3) UNSIGNED NOT NULL DEFAULT 2
        COMMENT '1=1st,2=2nd,3=Summer' AFTER school_year;

UPDATE system_settings SET semester_new = CASE current_semester
    WHEN '1st'    THEN 1
    WHEN '2nd'    THEN 2
    WHEN 'Summer' THEN 3
    ELSE 2
END;

ALTER TABLE system_settings DROP COLUMN current_semester;

ALTER TABLE system_settings
    CHANGE COLUMN semester_new current_semester
        TINYINT(3) UNSIGNED NOT NULL DEFAULT 2
        COMMENT '1=1st,2=2nd,3=Summer';


-- ── Verify ───────────────────────────────────────────────────
SELECT 'obligations'     AS tbl, semester FROM obligations     LIMIT 3;
SELECT 'student_imports' AS tbl, semester FROM student_imports LIMIT 3;
SELECT 'system_settings' AS tbl, current_semester FROM system_settings;
