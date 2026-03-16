import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import type { UserRole } from "../types/auth.types.js";
import {
    listPendingPayments,
    listPaymentHistory,
    handleVerifyPayment,
    handleRecordCash,
    handleVerifyAll,
} from "../controllers/admin-payment.controller.js";

const router = Router();

const adminRoles: UserRole[] = ["system_admin", "eso_officer", "class_officer", "program_head"];

router.get(  "/pending",      authenticate, authorize(...adminRoles), listPendingPayments);
router.get(  "/history",      authenticate, authorize(...adminRoles), listPaymentHistory);
router.post( "/verify-all",   authenticate, authorize(...adminRoles), handleVerifyAll);
router.patch("/:id/verify",   authenticate, authorize(...adminRoles), handleVerifyPayment);
router.post( "/cash",         authenticate, authorize(...adminRoles), handleRecordCash);

export default router;
