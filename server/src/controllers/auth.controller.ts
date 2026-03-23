import { Request, Response } from "express";
import {
    loginUser,
    registerUser,
    refreshAccessToken,
    logoutUser,
    changePassword,
    verifyPassword,
} from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

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
        return sendError(res, error.message, 401);
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return sendError(res, "Refresh token is required", 400);
        }

        const accessToken = await refreshAccessToken(refreshToken);
        return sendSuccess(res, { accessToken }, "Token refreshed");
    } catch (error: any) {
        return sendError(res, error.message, 401);
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return sendError(res, "Unauthorized", 401);

        await logoutUser(userId);
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

        if (password.length < 8) {
            return sendError(res, "Password must be at least 8 characters", 400);
        }

        if (yearLevel < 1 || yearLevel > 5) {
            return sendError(res, "Year level must be between 1 and 5", 400);
        }

        if (!["1st", "2nd", "Summer"].includes(semester)) {
            return sendError(res, "Semester must be 1st, 2nd, or Summer", 400);
        }

        const { user, tokens } = await registerUser({
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
        });

        return sendSuccess(res, { user, tokens }, "Registration successful", 201);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};