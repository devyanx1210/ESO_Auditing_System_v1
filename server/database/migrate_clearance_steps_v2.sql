-- Update clearance_step values for the new 6-step approval flow:
-- Step 1: Class Officer (year/section scope)
-- Step 2: Program Officer (dept scope)
-- Step 3: ESO Officer (all programs)
-- Step 4: Signatory / OSAS
-- Step 5: Program Head
-- Step 6: Dean (Final)

UPDATE roles SET clearance_step = 1 WHERE role_name = 'class_officer';
UPDATE roles SET clearance_step = 2 WHERE role_name = 'program_officer';
UPDATE roles SET clearance_step = 3 WHERE role_name = 'eso_officer';
UPDATE roles SET clearance_step = 4 WHERE role_name = 'signatory';
UPDATE roles SET clearance_step = 5 WHERE role_name = 'program_head';
UPDATE roles SET clearance_step = 6 WHERE role_name = 'dean';

-- Reset any in-progress clearances to step 1 so the new flow applies cleanly
-- (run manually only if desired; commented out by default)
-- UPDATE clearances SET current_step = 1 WHERE clearance_status = 'in_progress';
