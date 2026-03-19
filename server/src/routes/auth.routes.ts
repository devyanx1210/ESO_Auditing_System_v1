import { Router } from "express";
import {
    register,
    login,
    refresh,
    logout,
    getMe,
    updatePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.post("/change-password", authenticate, updatePassword);

export default router;