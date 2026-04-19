-- Add printed tracking columns to clearances table
ALTER TABLE `clearances`
    ADD COLUMN `is_printed`  tinyint(1)  NOT NULL DEFAULT 0       AFTER `generated_at`,
    ADD COLUMN `printed_at`  timestamp   NULL DEFAULT NULL         AFTER `is_printed`,
    ADD COLUMN `printed_by`  int(10) UNSIGNED NULL DEFAULT NULL    AFTER `printed_at`;
