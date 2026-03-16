-- Run this in phpMyAdmin or MySQL Workbench once
ALTER TABLE obligations
    ADD COLUMN gcash_qr_path VARCHAR(500) NULL
    AFTER due_date;
