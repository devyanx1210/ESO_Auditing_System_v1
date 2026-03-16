import { Router } from "express";
import { handleSubmitPayment } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// Student submits a GCash receipt for an obligation
router.post("/", authenticate, authorize("student"), handleSubmitPayment);

export default router;
