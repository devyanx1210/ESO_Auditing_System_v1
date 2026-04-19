-- ============================================================
-- migrate_workflow.sql
-- Expands clearance workflow from 6 steps to 10 steps
-- Adds all new clearance roles with correct step assignments
-- Run once in phpMyAdmin on eso_auditing_db
-- ============================================================

-- Clear old clearance steps from legacy roles
UPDATE roles SET clearance_step = NULL WHERE role_name IN (
    'class_officer', 'program_officer', 'eso_officer', 'signatory', 'program_head', 'dean'
);

-- Insert new 10-step clearance roles (INSERT IGNORE = safe to re-run)
INSERT IGNORE INTO roles (role_name, role_label, clearance_step) VALUES
('class_secretary',   'Class Secretary',   1),
('class_treasurer',   'Class Treasurer',   1),
('class_president',   'Class President',   2),
('program_treasurer', 'Program Treasurer', 3),
('program_president', 'Program President', 4),
('eso_treasurer',     'ESO Treasurer',     5),
('eso_vpsa',          'ESO VPSA',          6),
('eso_president',     'ESO President',     7),
('osas_coordinator',  'OSAS Coordinator',  8),
('program_head',      'Program Head',      9),
('dean',              'Dean',              10);

-- If program_head and dean already exist, just update their steps
UPDATE roles SET clearance_step = 9  WHERE role_name = 'program_head' AND clearance_step IS NULL;
UPDATE roles SET clearance_step = 10 WHERE role_name = 'dean'         AND clearance_step IS NULL;

-- ============================================================
-- DONE. After running, create admin accounts using these roles
-- in the Accounts page under System Admin.
-- ============================================================
