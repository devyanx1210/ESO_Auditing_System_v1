import { Request, Response } from "express";
import { createAdminUser, getAdminUsers, deleteAdminUser, toggleAdminStatus } from "../services/user.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password, role, programId, position } = req.body;

        if (!firstName || !lastName || !email || !password || !role || !position) {
            return sendError(res, "firstName, lastName, email, password, role, position are required", 400);
        }
        if (password.length < 8) {
            return sendError(res, "Password must be at least 8 characters", 400);
        }

        const validRoles = ["eso_officer", "class_officer", "program_head", "signatory", "dean"];
        if (!validRoles.includes(role)) {
            return sendError(res, "Invalid role. Must be one of: " + validRoles.join(", "), 400);
        }

        const user = await createAdminUser({ firstName, lastName, email, password, role, programId, position });
        return sendSuccess(res, user, "Admin account created", 201);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const listAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await getAdminUsers();
        return sendSuccess(res, admins, "Admin users fetched");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        await deleteAdminUser(Number(req.params.userId));
        return sendSuccess(res, null, "Admin account deleted");
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};

export const toggleAdmin = async (req: Request, res: Response) => {
    try {
        const result = await toggleAdminStatus(Number(req.params.userId));
        return sendSuccess(res, result, `Account ${result.status === "active" ? "activated" : "deactivated"}`);
    } catch (error: any) {
        return sendError(res, error.message, 400);
    }
};
