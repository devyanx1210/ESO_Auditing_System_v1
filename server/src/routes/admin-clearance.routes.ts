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
} from "../controllers/admin-clearance.controller.js";

const router = Router();

const clearanceRoles: UserRole[] = ["system_admin", "eso_officer", "program_head", "signatory", "dean"];

router.get("/pending",             authenticate, authorize(...clearanceRoles), listPendingClearance);
router.get("/history",             authenticate, authorize(...clearanceRoles), listClearanceHistory);
router.post("/sign-all",           authenticate, authorize(...clearanceRoles), handleSignAll);
router.post("/unapprove",          authenticate, authorize(...clearanceRoles), handleUnapproveHistory);
router.post("/delete",             authenticate, authorize(...clearanceRoles), handleDeleteClearanceHistory);
router.post("/:studentId/sign",    authenticate, authorize(...clearanceRoles), handleSignClearance);

export default router;
