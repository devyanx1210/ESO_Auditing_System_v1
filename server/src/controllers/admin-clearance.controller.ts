import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import {
    getPendingClearance,
    getClearanceHistory,
    signClearance,
    signAllClearance,
} from "../services/admin-clearance.service.js";

export const listPendingClearance = async (req: Request, res: Response) => {
    try {
        const items = await getPendingClearance(req.user!.userId, req.user!.role);
        return sendSuccess(res, items);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleSignClearance = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const { remarks } = req.body;
        await signClearance(req.user!.userId, studentId, remarks ?? null);
        return sendSuccess(res, null, "Clearance signed");
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleSignAll = async (req: Request, res: Response) => {
    try {
        const count = await signAllClearance(req.user!.userId, req.user!.role);
        return sendSuccess(res, { count }, `${count} clearance(s) signed`);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const listClearanceHistory = async (req: Request, res: Response) => {
    try {
        const items = await getClearanceHistory(req.user!.userId, req.user!.role);
        return sendSuccess(res, items);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};
