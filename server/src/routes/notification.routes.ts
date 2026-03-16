import { Router } from "express";
import {
    listNotifications,
    readNotification,
    readAllNotifications,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(    "/",          authenticate, listNotifications);
router.patch(  "/read-all",  authenticate, readAllNotifications);
router.patch(  "/:id/read",  authenticate, readNotification);

export default router;
