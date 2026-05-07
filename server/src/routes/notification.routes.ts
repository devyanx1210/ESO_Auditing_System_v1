import { Router } from "express";
import {
    listNotifications,
    readNotification,
    readAllNotifications,
    deleteNotification,
    subscribePush,
    unsubscribePush,
    getVapidPublicKey,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(    "/",                   authenticate, listNotifications);
router.patch(  "/read-all",           authenticate, readAllNotifications);
router.patch(  "/:id/read",           authenticate, readNotification);
router.delete( "/:id",                authenticate, deleteNotification);

// Web push
router.get(    "/push/vapid-key",     getVapidPublicKey);
router.post(   "/push/subscribe",     authenticate, subscribePush);
router.post(   "/push/unsubscribe",   authenticate, unsubscribePush);

export default router;
