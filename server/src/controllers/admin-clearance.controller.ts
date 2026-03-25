import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import {
    getPendingClearance,
    getClearanceHistory,
    signClearance,
    signAllClearance,
    unapproveHistoryClearances,
    deleteHistoryClearances,
} from "../services/admin-clearance.service.js";

export const listPendingClearance = async (req: Request, res: Response) => {
    try {
        const items = await getPendingClearance(req.user!.userId, req.user!.role, req.user!.yearLevel, req.user!.section);
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

export const handleUnapproveHistory = async (req: Request, res: Response) => {
    try {
        const { clearanceIds } = req.body;
        if (!Array.isArray(clearanceIds)) return sendError(res, "clearanceIds must be an array", 400);
        const count = await unapproveHistoryClearances(clearanceIds.map(Number));
        return sendSuccess(res, { count }, `${count} clearance(s) returned to pending`);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleDeleteClearanceHistory = async (req: Request, res: Response) => {
    try {
        const { clearanceIds } = req.body;
        if (!Array.isArray(clearanceIds)) return sendError(res, "clearanceIds must be an array", 400);
        const count = await deleteHistoryClearances(clearanceIds.map(Number));
        return sendSuccess(res, { count }, `${count} clearance record(s) deleted`);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};
