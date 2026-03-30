-- Add program_officer role if it doesn't already exist
INSERT IGNORE INTO roles (role_name, role_label, clearance_step)
VALUES ('program_officer', 'Program Officer', NULL);
