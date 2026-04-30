import { Request, Response } from "express";
import {
    loginUser,
    registerUser,
    refreshAccessToken,
    logoutUser,
    changePassword,
    verifyPassword,
    deleteOwnAccount,
    verifyEmailToken,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword,
} from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logAction } from "../services/audit.service.js";

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, "Email and password are required", 400);
        }

        const ipAddress = req.ip || req.socket.remoteAddress || "";
        const { user, tokens } = await loginUser({ email, password }, ipAddress);

        return sendSuccess(res, { user, tokens }, "Login successful");
    } catch (error: any) {
        if (error.message === "EMAIL_NOT_VERIFIED") {
            return sendError(res, "EMAIL_NOT_VERIFIED", 403);
        }
        return sendError(res, error.message, 401);
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return sendError(res, "Refresh token is required", 400);
        }

        const { accessToken, user } = await refreshAccessToken(refreshToken);
        return sendSuccess(res, { accessToken, user }, "Token refreshed");
    } catch (error: any) {
        return sendError(res, error.message, 401);
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return sendError(res, "Unauthorized", 401);

        await logoutUser(userId);
        logAction({ performedBy: userId, action: "logout", ipAddress: req.ip });
        return sendSuccess(res, null, "Logged out successfully");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        return sendSuccess(res, req.user, "Authenticated user");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const updatePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return sendError(res, "Unauthorized", 401);

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, "Current and new password are required", 400);
        }

        if (newPassword.length < 8) {
            return sendError(res, "Password must be at least 8 characters", 400);
        }

        await changePassword(userId, currentPassword, newPassword);
        return sendSuccess(res, null, "Password changed successfully");
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const checkPassword = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return sendError(res, "Unauthorized", 401);
        const { password } = req.body;
        if (!password) return sendError(res, "Password is required", 400);
        const valid = await verifyPassword(userId, password);
        if (!valid) return sendError(res, "Incorrect password", 401);
        return sendSuccess(res, null, "Password verified");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return sendError(res, "Unauthorized", 401);
        const { password } = req.body;
        if (!password) return sendError(res, "Password is required", 400);
        await deleteOwnAccount(userId, password);
        logAction({ performedBy: userId, action: "delete_account", targetType: "user", targetId: userId });
        return sendSuccess(res, null, "Account deleted successfully");
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const {
            firstName,
            lastName,
            middleName,
            email,
            password,
            studentNo,
            programId,
            yearLevel,
            section,
            schoolYear,
            semester,
        } = req.body;

        if (!firstName || !lastName || !email || !password || !studentNo || !programId || !yearLevel || !section || !schoolYear || !semester) {
            return sendError(res, "All required fields must be provided", 400);
        }

        // Length guards
        if (firstName.trim().length > 100 || lastName.trim().length > 100) {
            return sendError(res, "Name fields must not exceed 100 characters", 400);
        }
        if (email.length > 254) {
            return sendError(res, "Email address is too long", 400);
        }
        if (studentNo.length > 30 || !/^[A-Za-z0-9\-]+$/.test(studentNo)) {
            return sendError(res, "Student number must be alphanumeric (hyphens allowed) and at most 30 characters", 400);
        }

        // Format checks
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return sendError(res, "Invalid email address format", 400);
        }
        if (password.length < 8) {
            return sendError(res, "Password must be at least 8 characters", 400);
        }
        if (password.length > 128) {
            return sendError(res, "Password must not exceed 128 characters", 400);
        }
        if (yearLevel < 1 || yearLevel > 5) {
            return sendError(res, "Year level must be between 1 and 5", 400);
        }
        const semesterNum = Number(semester);
        if (![1, 2, 3].includes(semesterNum)) {
            return sendError(res, "Semester must be 1 (1st), 2 (2nd), or 3 (Summer)", 400);
        }
        if (!/^\d{4}-\d{4}$/.test(schoolYear)) {
            return sendError(res, "School year must be in YYYY-YYYY format (e.g. 2025-2026)", 400);
        }
        if (!/^[A-Za-z0-9]+$/.test(section) || section.length > 20) {
            return sendError(res, "Section must be alphanumeric and at most 20 characters", 400);
        }

        const { email: registeredEmail } = await registerUser({
            firstName, lastName, middleName, email, password,
            studentNo, programId, yearLevel, section, schoolYear,
            semester: semesterNum,
        });

        return sendSuccess(res, { email: registeredEmail }, "Registration successful. Please check your email to verify your account.", 201);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== "string") return sendError(res, "Verification token is required", 400);
        await verifyEmailToken(token);
        return sendSuccess(res, null, "Email verified successfully. You can now log in.");
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return sendError(res, "Email is required", 400);
        await resendVerificationEmail(email);
        return sendSuccess(res, null, "If your account is pending verification, a new email has been sent.");
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return sendError(res, "Email is required", 400);
        await requestPasswordReset(email);
        return sendSuccess(res, null, "If an account with that email exists, a password reset link has been sent.");
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const handleResetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return sendError(res, "Token and new password are required", 400);
        if (newPassword.length < 8) return sendError(res, "Password must be at least 8 characters", 400);
        await resetPassword(token, newPassword);
        return sendSuccess(res, null, "Password reset successfully. You can now log in.");
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};