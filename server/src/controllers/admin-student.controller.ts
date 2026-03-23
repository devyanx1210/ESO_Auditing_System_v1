import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { listStudents, getStudentObligationsForAdmin, verifyProofObligation } from "../services/admin-student.service.js";

export const handleListStudents = async (req: Request, res: Response) => {
    try {
        const students = await listStudents(req.user!.userId, req.user!.role, req.user!.programId);
        return sendSuccess(res, students);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleGetStudentObligations = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const obligations = await getStudentObligationsForAdmin(studentId);
        return sendSuccess(res, obligations);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const handleVerifyProof = async (req: Request, res: Response) => {
    try {
        const studentObligationId = Number(req.params.studentObligationId);
        const { status } = req.body; // "paid" | "unpaid"
        if (!["paid", "unpaid"].includes(status)) return sendError(res, "status must be 'paid' or 'unpaid'", 400);
        await verifyProofObligation(req.user!.userId, studentObligationId, status);
        return sendSuccess(res, null, `Proof ${status === "paid" ? "verified" : "rejected"}`);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};
