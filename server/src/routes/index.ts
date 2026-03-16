import { Router } from "express";
import authRoutes          from "./auth.routes.js";
import studentRoutes       from "./student.routes.js";
import obligationRoutes    from "./obligation.routes.js";
import dashboardRoutes     from "./dashboard.routes.js";
import userRoutes          from "./user.routes.js";
import notificationRoutes  from "./notification.routes.js";
import paymentRoutes       from "./payment.routes.js";
import adminStudentRoutes   from "./admin-student.routes.js";
import adminPaymentRoutes   from "./admin-payment.routes.js";
import adminClearanceRoutes from "./admin-clearance.routes.js";

const router = Router();

router.use("/auth",           authRoutes);
router.use("/students",       studentRoutes);
router.use("/obligations",    obligationRoutes);
router.use("/dashboard",      dashboardRoutes);
router.use("/users",          userRoutes);
router.use("/notifications",  notificationRoutes);
router.use("/payments",       paymentRoutes);
router.use("/admin/students",  adminStudentRoutes);
router.use("/admin/payments",  adminPaymentRoutes);
router.use("/admin/clearance", adminClearanceRoutes);

export default router;