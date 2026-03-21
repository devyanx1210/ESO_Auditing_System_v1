import { Request, Response } from "express";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotificationById,
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
