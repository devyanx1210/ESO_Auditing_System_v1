import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { getAdminProfile, updateAdminProfile } from "../services/admin-profile.service.js";

export const handleGetAdminProfile = async (req: Request, res: Response) => {
    try {
        const profile = await getAdminProfile(req.user!.userId);
        return sendSuccess(res, profile);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleUpdateAdminProfile = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, position } = req.body;
        if (!firstName?.trim() || !lastName?.trim())
            return sendError(res, "First name and last name are required", 400);

        const avatarPath = req.file
            ? `/uploads/avatars/${req.file.filename}`
            : req.body.clearAvatar === "true" ? null : undefined;

        const updated = await updateAdminProfile(req.user!.userId, {
            firstName,
            lastName,
            position: position ?? "",
            avatarPath,
        });
        return sendSuccess(res, updated, "Profile updated");
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};
