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
    authorize("system_admin", "eso_officer", "class_officer", "program_head", "signatory", "dean"),
    listStudents
);

// Student: own data
router.get  ("/me/profile",     authenticate, authorize("student"), getMyProfile);
router.patch("/me/profile",     authenticate, authorize("student"), uploadAvatar, updateMyProfile);
router.get  ("/me/obligations", authenticate, authorize("student"), getMyObligations);
router.get  ("/me/clearance",   authenticate, authorize("student"), getMyClearance);

export default router;
