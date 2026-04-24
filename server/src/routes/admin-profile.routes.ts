import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { handleGetAdminProfile, handleUpdateAdminProfile } from "../controllers/admin-profile.controller.js";
import type { UserRole } from "../types/auth.types.js";

const router = Router();

const adminRoles: UserRole[] = ["system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "signatory", "osas_coordinator", "dean"];

router.get("/me",         authenticate, authorize(...adminRoles), handleGetAdminProfile);
router.patch("/me",       authenticate, authorize(...adminRoles), uploadAvatar, handleUpdateAdminProfile);

export default router;
