import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import * as svc from "../services/sysadmin.service.js";

export const handleMaintenanceStatus = async (_req: Request, res: Response) => {
    try {
        const status = await svc.getMaintenanceStatus();
        sendSuccess(res, status);
    } catch (e: any) { sendError(res, e.message); }
};

export const handleGetSettings = async (_req: Request, res: Response) => {
    try {
        const settings = await svc.getSystemSettings();
        if (!settings) return sendError(res, "Settings not found", 404);
        sendSuccess(res, settings);
    } catch (e: any) { sendError(res, e.message); }
};

export const handleUpdateMaintenance = async (req: Request, res: Response) => {
    try {
        const { maintenance_mode, maintenance_msg } = req.body;
        if (maintenance_mode === undefined) return sendError(res, "maintenance_mode is required", 400);
        await svc.updateMaintenance(Boolean(maintenance_mode), maintenance_msg ?? "", req.user!.userId);
        sendSuccess(res, { message: "Maintenance settings updated" });
    } catch (e: any) { sendError(res, e.message); }
};

export const handleUpdateSemesterSettings = async (req: Request, res: Response) => {
    try {
        const { school_year, current_semester } = req.body;
        if (!school_year || !current_semester) return sendError(res, "school_year and current_semester are required", 400);
        await svc.updateSemesterSettings(school_year, current_semester, req.user!.userId);
        sendSuccess(res, { message: "Semester settings updated" });
    } catch (e: any) { sendError(res, e.message); }
};

export const handleGetAccounts = async (_req: Request, res: Response) => {
    try {
        const accounts = await svc.getAllAccounts();
        sendSuccess(res, accounts);
    } catch (e: any) { sendError(res, e.message); }
};

export const handleCreateAccount = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password, role, programId, position } = req.body;
        if (!firstName || !lastName || !email || !password || !role)
            return sendError(res, "firstName, lastName, email, password, role are required", 400);
        const id = await svc.createAdminAccount({ firstName, lastName, email, password, role, programId, position });
        sendSuccess(res, { userId: id, message: "Account created" }, "Account created", 201);
    } catch (e: any) { sendError(res, e.message); }
};

export const handleUpdateAccountStatus = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.userId);
        const { status } = req.body;
        if (!["active", "inactive", "suspended"].includes(status))
            return sendError(res, "Invalid status", 400);
        await svc.updateAccountStatus(userId, status);
        sendSuccess(res, { message: "Account status updated" });
    } catch (e: any) { sendError(res, e.message); }
};

export const handleDeleteAccount = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.userId);
        await svc.deleteAccount(userId);
        sendSuccess(res, { message: "Account deleted" });
    } catch (e: any) { sendError(res, e.message); }
};

export const handlePreviewAdvancement = async (_req: Request, res: Response) => {
    try {
        const preview = await svc.previewYearAdvancement();
        sendSuccess(res, preview);
    } catch (e: any) { sendError(res, e.message); }
};

export const handleExecuteAdvancement = async (req: Request, res: Response) => {
    try {
        const { new_school_year } = req.body;
        if (!new_school_year) return sendError(res, "new_school_year is required", 400);
        const result = await svc.executeYearAdvancement(new_school_year, req.user!.userId);
        sendSuccess(res, result);
    } catch (e: any) { sendError(res, e.message); }
};

export const handleGetAuditLogs = async (req: Request, res: Response) => {
    try {
        const page  = Number(req.query.page)  || 1;
        const limit = Number(req.query.limit) || 50;
        const data  = await svc.getAuditLogs(page, limit);
        sendSuccess(res, data);
    } catch (e: any) { sendError(res, e.message); }
};
