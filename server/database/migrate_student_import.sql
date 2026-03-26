-- Migration: student extra fields + import tracking

-- 1. Add extra profile columns to students
ALTER TABLE students
    ADD COLUMN address           VARCHAR(500)                       NULL AFTER avatar_path,
    ADD COLUMN contact_number    VARCHAR(20)                        NULL AFTER address,
    ADD COLUMN guardian_name     VARCHAR(150)                       NULL AFTER contact_number,
    ADD COLUMN emergency_contact VARCHAR(20)                        NULL AFTER guardian_name,
    ADD COLUMN shirt_size        ENUM('XS','S','M','L','XL','XXL') NULL AFTER emergency_contact;

-- 2. Track imports per school year + semester
CREATE TABLE IF NOT EXISTS student_imports (
    import_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_year   VARCHAR(9)  NOT NULL,
    semester      ENUM('1st','2nd','Summer') NOT NULL,
    imported_by   INT UNSIGNED NOT NULL,
    record_count  INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    error_count   INT NOT NULL DEFAULT 0,
    imported_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_import_user FOREIGN KEY (imported_by) REFERENCES users(user_id)
);
