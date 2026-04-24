import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import type { UserRole } from "../types/auth.types.js";
import { handleListStudents, handleGetStudentObligations, handleVerifyProof } from "../controllers/admin-student.controller.js";

const router = Router();

const adminRoles: UserRole[] = ["system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "signatory", "osas_coordinator", "dean"];

router.get("/",                            authenticate, authorize(...adminRoles), handleListStudents);
router.get("/:studentId/obligations",      authenticate, authorize(...adminRoles), handleGetStudentObligations);
router.patch("/obligations/:studentObligationId/verify-proof", authenticate, authorize(...adminRoles), handleVerifyProof);

export default router;
