import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import { handleGetAdminProfile, handleUpdateAdminProfile } from "../controllers/admin-profile.controller.js";
import type { UserRole } from "../types/auth.types.js";

const router = Router();

const adminRoles: UserRole[] = ["system_admin", "eso_officer", "class_officer", "program_officer", "program_head", "signatory", "dean"];

router.get("/me",         authenticate, authorize(...adminRoles), handleGetAdminProfile);
router.patch("/me",       authenticate, authorize(...adminRoles), uploadAvatar, handleUpdateAdminProfile);

export default router;
