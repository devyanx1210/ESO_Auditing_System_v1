-- Add missing notification types to ENUM
ALTER TABLE notifications
    MODIFY COLUMN type ENUM(
        'obligation_assigned',
        'obligation_updated',
        'obligation_deleted',
        'obligation_reminder',
        'payment_submitted',
        'payment_approved',
        'payment_rejected',
        'payment_pending',
        'clearance_signed',
        'clearance_rejected',
        'clearance_cleared',
        'clearance_unapproved',
        'account_status'
    ) NOT NULL;
