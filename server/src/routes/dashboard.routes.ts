import { Router } from "express";
import { getStats } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.get(
    "/stats",
    authenticate,
    authorize("system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "signatory", "osas_coordinator", "dean"),
    getStats
);

export default router;
