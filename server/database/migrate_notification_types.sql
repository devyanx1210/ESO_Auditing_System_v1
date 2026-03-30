-- Add missing notification type values that are used in the application code
ALTER TABLE notifications
    MODIFY COLUMN type ENUM(
        'obligation_assigned',
        'obligation_updated',
        'obligation_deleted',
        'obligation_reminder',
        'payment_submitted',
        'payment_approved',
        'payment_rejected',
        'clearance_signed',
        'clearance_rejected',
        'clearance_cleared',
        'clearance_update'
    ) NOT NULL;
