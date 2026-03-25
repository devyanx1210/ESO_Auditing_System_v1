import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import {
    getPendingPayments,
    getPaymentHistory,
    verifyPayment,
    recordCashPayment,
    verifyAllPayments,
    bulkVerifyPayments,
    bulkUnverifyPayments,
    bulkDeletePayments,
} from "../services/admin-payment.service.js";

export const listPendingPayments = async (req: Request, res: Response) => {
    try {
        const payments = await getPendingPayments(req.user!.userId, req.user!.role, req.user!.yearLevel, req.user!.section);
        return sendSuccess(res, payments);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleVerifyPayment = async (req: Request, res: Response) => {
    try {
        const paymentId = Number(req.params.id);
        const { status, remarks } = req.body;
        if (!["approved", "rejected"].includes(status))
            return sendError(res, "status must be approved or rejected", 400);
        await verifyPayment(req.user!.userId, paymentId, status, remarks ?? null);
        return sendSuccess(res, null, `Payment ${status}`);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleRecordCash = async (req: Request, res: Response) => {
    try {
        const { studentObligationId, amountPaid, notes } = req.body;
        if (!studentObligationId || !amountPaid)
            return sendError(res, "studentObligationId and amountPaid are required", 400);
        await recordCashPayment(
            req.user!.userId,
            Number(studentObligationId),
            Number(amountPaid),
            notes ?? null
        );
        return sendSuccess(res, null, "Cash payment recorded");
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleVerifyAll = async (req: Request, res: Response) => {
    try {
        const count = await verifyAllPayments(req.user!.userId, req.user!.role);
        return sendSuccess(res, { count }, `${count} payment(s) approved`);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const listPaymentHistory = async (req: Request, res: Response) => {
    try {
        const items = await getPaymentHistory(req.user!.userId, req.user!.role, req.user!.yearLevel, req.user!.section);
        return sendSuccess(res, items);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleBulkVerify = async (req: Request, res: Response) => {
    try {
        const { paymentIds } = req.body;
        if (!Array.isArray(paymentIds) || !paymentIds.length)
            return sendError(res, "paymentIds array required", 400);
        const count = await bulkVerifyPayments(req.user!.userId, paymentIds);
        return sendSuccess(res, { count }, `${count} payment(s) verified`);
    } catch (error: any) { return sendError(res, error.message, 500); }
};

export const handleBulkUnverify = async (req: Request, res: Response) => {
    try {
        const { paymentIds } = req.body;
        if (!Array.isArray(paymentIds) || !paymentIds.length)
            return sendError(res, "paymentIds array required", 400);
        const count = await bulkUnverifyPayments(req.user!.userId, paymentIds);
        return sendSuccess(res, { count }, `${count} payment(s) unverified`);
    } catch (error: any) { return sendError(res, error.message, 500); }
};

export const handleBulkDelete = async (req: Request, res: Response) => {
    try {
        const { paymentIds } = req.body;
        if (!Array.isArray(paymentIds) || !paymentIds.length)
            return sendError(res, "paymentIds array required", 400);
        const count = await bulkDeletePayments(paymentIds);
        return sendSuccess(res, { count }, `${count} payment(s) deleted`);
    } catch (error: any) { return sendError(res, error.message, 500); }
};
