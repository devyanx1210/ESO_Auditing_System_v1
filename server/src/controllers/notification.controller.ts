import { Request, Response } from "express";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotificationById,
    savePushSubscription,
    deletePushSubscription,
} from "../services/notification.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const listNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const data = await getNotifications(userId);
        return sendSuccess(res, data);
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
};

export const readNotification = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const id = Number(req.params.id);
        await markNotificationRead(id, userId);
        return sendSuccess(res, null, "Marked as read");
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
};

export const readAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        await markAllNotificationsRead(userId);
        return sendSuccess(res, null, "All marked as read");
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const id = Number(req.params.id);
        await deleteNotificationById(id, userId);
        return sendSuccess(res, null, "Notification deleted");
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
};

export const subscribePush = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return sendError(res, "Invalid push subscription", 400);
        }
        await savePushSubscription(userId, endpoint, keys.p256dh, keys.auth);
        return sendSuccess(res, null, "Push subscription saved");
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
};

export const unsubscribePush = async (req: Request, res: Response) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return sendError(res, "endpoint required", 400);
        await deletePushSubscription(endpoint);
        return sendSuccess(res, null, "Push subscription removed");
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
};

export const getVapidPublicKey = async (_req: Request, res: Response) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return sendError(res, "Push not configured", 503);
    return sendSuccess(res, { key });
};
