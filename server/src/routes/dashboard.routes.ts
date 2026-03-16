import { Router } from "express";
import { getStats } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.get(
    "/stats",
    authenticate,
    authorize("system_admin", "eso_officer", "class_officer", "program_head", "signatory", "dean"),
    getStats
);

export default router;
