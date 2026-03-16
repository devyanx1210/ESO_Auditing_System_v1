-- Add payment_type and cash payment support to payment_submissions
ALTER TABLE payment_submissions
    MODIFY COLUMN receipt_path VARCHAR(500) NULL,
    ADD COLUMN payment_type ENUM('gcash','cash') NOT NULL DEFAULT 'gcash' AFTER notes,
    ADD COLUMN recorded_by_admin_id INT UNSIGNED NULL AFTER payment_type,
    ADD CONSTRAINT fk_ps_admin FOREIGN KEY (recorded_by_admin_id)
        REFERENCES admins(admin_id) ON DELETE SET NULL;
