import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import type { UserRole } from "../types/auth.types.js";
import {
    listPendingClearance,
    listClearanceHistory,
    handleSignClearance,
    handleSignAll,
    handleUnapproveHistory,
    handleDeleteClearanceHistory,
    handleMarkPrinted,
} from "../controllers/admin-clearance.controller.js";

const router = Router();

const clearanceRoles: UserRole[] = ["system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "signatory", "osas_coordinator", "dean"];

router.get("/pending",             authenticate, authorize(...clearanceRoles), listPendingClearance);
router.get("/history",             authenticate, authorize(...clearanceRoles), listClearanceHistory);
router.post("/sign-all",           authenticate, authorize(...clearanceRoles), handleSignAll);
router.post("/unapprove",          authenticate, authorize(...clearanceRoles), handleUnapproveHistory);
router.post("/delete",             authenticate, authorize(...clearanceRoles), handleDeleteClearanceHistory);
router.post("/mark-printed",       authenticate, authorize(...clearanceRoles), handleMarkPrinted);
router.post("/:studentId/sign",    authenticate, authorize(...clearanceRoles), handleSignClearance);

export default router;
