import { Router } from "express";
import {
    register,
    login,
    refresh,
    logout,
    getMe,
    updatePassword,
    checkPassword,
    deleteAccount,
    verifyEmail,
    resendVerification,
    forgotPassword,
    handleResetPassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register",             register);
router.post("/login",                login);
router.post("/refresh",              refresh);
router.post("/logout",               authenticate, logout);
router.get ("/me",                   authenticate, getMe);
router.post("/change-password",      authenticate, updatePassword);
router.post("/verify-password",      authenticate, checkPassword);
router.delete("/account",            authenticate, deleteAccount);
router.get ("/verify-email",         verifyEmail);
router.post("/resend-verification",  resendVerification);
router.post("/forgot-password",      forgotPassword);
router.post("/reset-password",       handleResetPassword);

export default router;