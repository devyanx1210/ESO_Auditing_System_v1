import pool from "../config/db.js";
import webpush from "web-push";

// ─── VAPID setup ────────────────────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL   = `mailto:${process.env.BREVO_FROM ?? "admin@eso.edu.ph"}`;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ─── Types ──────────────────────────────────────────────────

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

// ─── In-app notifications ────────────────────────────────────

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

export const deleteNotificationById = async (
    notificationId: number,
    userId: number
): Promise<void> => {
    await pool.execute(
        `DELETE FROM notifications WHERE notification_id = ? AND user_id = ?`,
        [notificationId, userId]
    );
};

// ─── createNotification helper ───────────────────────────────
// Accepts pool or a transaction connection (conn).
// Inserts the in-app notification, then fires a push (fire-and-forget).

export const createNotification = async (
    db: typeof pool | any,
    userId: number,
    title: string,
    message: string,
    type: string | number,
    referenceId: number | null = null,
    referenceType: string | null = null
): Promise<void> => {
    await db.execute(
        `INSERT INTO notifications
            (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
        [userId, title, message, type, referenceId, referenceType]
    );
    sendPushToUser(userId, title, message).catch(() => {});
};

// ─── Push subscriptions ──────────────────────────────────────

export const savePushSubscription = async (
    userId: number,
    endpoint: string,
    p256dh: string,
    auth: string
): Promise<void> => {
    await pool.execute(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
        [userId, endpoint, p256dh, auth]
    );
};

export const deletePushSubscription = async (endpoint: string): Promise<void> => {
    await pool.execute(
        `DELETE FROM push_subscriptions WHERE endpoint = ?`,
        [endpoint]
    );
};

export const sendPushToUser = async (
    userId: number,
    title: string,
    body: string,
    url: string = "/"
): Promise<void> => {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

    const [subs]: any = await pool.execute(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
        [userId]
    );

    const payload = JSON.stringify({ title, body, url });

    for (const sub of subs) {
        try {
            await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
            );
        } catch (err: any) {
            // 410 Gone / 404 Not Found = subscription expired, remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
                await pool.execute(
                    `DELETE FROM push_subscriptions WHERE endpoint = ?`,
                    [sub.endpoint]
                ).catch(() => {});
            }
        }
    }
};
