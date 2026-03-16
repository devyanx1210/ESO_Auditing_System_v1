import { Router } from "express";
import { createAdmin, listAdmins, deleteAdmin, toggleAdmin } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.post("/admin",           authenticate, authorize("system_admin"), createAdmin);
router.get("/admins",           authenticate, authorize("system_admin"), listAdmins);
router.delete("/admin/:userId", authenticate, authorize("system_admin"), deleteAdmin);
router.patch("/admin/:userId/toggle", authenticate, authorize("system_admin"), toggleAdmin);

export default router;
