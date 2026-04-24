import { Router } from "express";
import {
    listStudents,
    getMyProfile,
    updateMyProfile,
    getMyObligations,
    getMyClearance,
} from "../controllers/student.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const router = Router();

// Admin: list all students
router.get(
    "/",
    authenticate,
    authorize("system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "signatory", "osas_coordinator", "dean"),
    listStudents
);

// Student: own data
router.get  ("/me/profile",     authenticate, authorize("student"), getMyProfile);
router.patch("/me/profile",     authenticate, authorize("student"), uploadAvatar, updateMyProfile);
router.get  ("/me/obligations", authenticate, authorize("student"), getMyObligations);
router.get  ("/me/clearance",   authenticate, authorize("student"), getMyClearance);

export default router;
