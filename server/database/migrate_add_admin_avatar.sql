-- Migration: add avatar_path to admins table
ALTER TABLE admins
    ADD COLUMN avatar_path VARCHAR(500) NULL AFTER section;
