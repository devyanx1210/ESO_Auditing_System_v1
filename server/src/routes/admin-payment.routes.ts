import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import type { UserRole } from "../types/auth.types.js";
import {
    listPendingPayments,
    listPendingProofs,
    listPaymentHistory,
    handleVerifyPayment,
    handleRecordCash,
    handleVerifyAll,
    handleBulkVerify,
    handleBulkUnverify,
    handleBulkDelete,
} from "../controllers/admin-payment.controller.js";

const router = Router();

const adminRoles: UserRole[] = ["system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "osas_coordinator", "dean"];

router.get(  "/pending",        authenticate, authorize(...adminRoles), listPendingPayments);
router.get(  "/pending-proofs", authenticate, authorize(...adminRoles), listPendingProofs);
router.get(  "/history",      authenticate, authorize(...adminRoles), listPaymentHistory);
router.post( "/verify-all",   authenticate, authorize(...adminRoles), handleVerifyAll);
router.patch("/:id/verify",   authenticate, authorize(...adminRoles), handleVerifyPayment);
router.post( "/cash",         authenticate, authorize(...adminRoles), handleRecordCash);
router.post("/bulk-verify",   authenticate, authorize(...adminRoles), handleBulkVerify);
router.post("/bulk-unverify", authenticate, authorize(...adminRoles), handleBulkUnverify);
router.post("/bulk-delete",   authenticate, authorize(...adminRoles), handleBulkDelete);

export default router;
