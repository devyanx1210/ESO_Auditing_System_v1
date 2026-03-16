import { Request, Response } from "express";
import { uploadReceipt } from "../middleware/upload.middleware.js";
import { submitPayment } from "../services/payment.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const handleSubmitPayment = (req: Request, res: Response) => {
    uploadReceipt(req, res, async (err) => {
        if (err) return sendError(res, err.message, 400);
        if (!req.file) return sendError(res, "Receipt file is required", 400);

        try {
            const userId             = req.user!.userId;
            const studentObligationId = Number(req.body.studentObligationId);
            const amountPaid         = parseFloat(req.body.amountPaid);
            const notes              = req.body.notes ?? null;

            if (!studentObligationId || isNaN(amountPaid)) {
                return sendError(res, "studentObligationId and amountPaid are required", 400);
            }

            const result = await submitPayment(
                userId,
                studentObligationId,
                req.file.path,
                amountPaid,
                notes
            );
            return sendSuccess(res, result, "Payment submitted successfully", 201);
        } catch (e: any) {
            return sendError(res, e.message, 400);
        }
    });
};
