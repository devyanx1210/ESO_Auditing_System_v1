import { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getStats = async (req: Request, res: Response) => {
    try {
        const stats = await getDashboardStats(req.user!.role, req.user!.departmentId);
        return sendSuccess(res, stats, "Dashboard stats fetched");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};
