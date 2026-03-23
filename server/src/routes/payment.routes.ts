import { Router } from "express";
import { handleSubmitPayment, handleSubmitProof } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// Student submits a GCash receipt for a payment obligation
router.post("/",      authenticate, authorize("student"), handleSubmitPayment);

// Student submits proof image for a non-payment obligation
router.post("/proof", authenticate, authorize("student"), handleSubmitProof);

export default router;
