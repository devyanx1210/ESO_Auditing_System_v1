import { Request, Response } from "express";
import { uploadReceipt, uploadProof } from "../middleware/upload.middleware.js";
import { submitPayment, submitProof } from "../services/payment.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const handleSubmitPayment = (req: Request, res: Response) => {
    uploadReceipt(req, res, async (err) => {
        if (err) return sendError(res, err.message, 400);
        if (!req.file) return sendError(res, "Receipt file is required", 400);

        try {
            const userId              = req.user!.userId;
            const studentObligationId = Number(req.body.studentObligationId);
            const amountPaid          = parseFloat(req.body.amountPaid);
            const notes               = req.body.notes ?? null;

            if (!studentObligationId || isNaN(amountPaid))
                return sendError(res, "studentObligationId and amountPaid are required", 400);

            const receiptPath = `receipts/${req.file.filename}`;

            const result = await submitPayment(userId, studentObligationId, receiptPath, amountPaid, notes);
            return sendSuccess(res, result, "Payment submitted successfully", 201);
        } catch (e: any) {
            return sendError(res, e.message, 400);
        }
    });
};

export const handleSubmitProof = (req: Request, res: Response) => {
    uploadProof(req, res, async (err) => {
        if (err) return sendError(res, err.message, 400);
        if (!req.file) return sendError(res, "Proof image is required", 400);

        try {
            const userId              = req.user!.userId;
            const studentObligationId = Number(req.body.studentObligationId);
            if (!studentObligationId) return sendError(res, "studentObligationId is required", 400);

            const proofPath = `proofs/${req.file.filename}`;

            const result = await submitProof(userId, studentObligationId, proofPath);
            return sendSuccess(res, result, "Proof submitted successfully", 201);
        } catch (e: any) {
            return sendError(res, e.message, 400);
        }
    });
};
