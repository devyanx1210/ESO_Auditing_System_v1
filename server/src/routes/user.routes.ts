import { Router } from "express";
import { createAdmin, listAdmins, deleteAdmin, toggleAdmin } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.post("/admin",           authenticate, authorize("system_admin", "eso_officer"), createAdmin);
router.get("/admins",           authenticate, authorize("system_admin", "eso_officer"), listAdmins);
router.delete("/admin/:userId", authenticate, authorize("system_admin", "eso_officer"), deleteAdmin);
router.patch("/admin/:userId/toggle", authenticate, authorize("system_admin", "eso_officer"), toggleAdmin);

export default router;
