import pool from "../config/db.js";

export interface NotificationItem {
    notificationId: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    referenceId: number | null;
    referenceType: string | null;
}

export const getNotifications = async (userId: number): Promise<NotificationItem[]> => {
    const [rows]: any = await pool.execute(
        `SELECT notification_id, title, message, type, is_read, created_at,
                reference_id, reference_type
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
    );
    return rows.map((r: any) => ({
        notificationId: r.notification_id,
        title:          r.title,
        message:        r.message,
        type:           r.type,
        isRead:         Boolean(r.is_read),
        createdAt:      r.created_at,
        referenceId:    r.reference_id ?? null,
        referenceType:  r.reference_type ?? null,
    }));
};

export const markNotificationRead = async (
    notificationId: number,
    userId: number
): Promise<void> => {
    await pool.execute(
        `UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?`,
        [notificationId, userId]
    );
};

export const markAllNotificationsRead = async (userId: number): Promise<void> => {
    await pool.execute(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
        [userId]
    );
};
