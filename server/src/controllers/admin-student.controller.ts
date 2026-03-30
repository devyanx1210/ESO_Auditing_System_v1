import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { listStudents, getStudentObligationsForAdmin, verifyProofObligation } from "../services/admin-student.service.js";

export const handleListStudents = async (req: Request, res: Response) => {
    try {
        const students = await listStudents(req.user!.userId, req.user!.role, req.user!.programId, req.user!.yearLevel, req.user!.section);
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
        const { status } = req.body; // 2=paid | 0=unpaid
        const statusNum = Number(status);
        if (![2, 0].includes(statusNum)) return sendError(res, "status must be 2 (paid) or 0 (unpaid)", 400);
        await verifyProofObligation(req.user!.userId, studentObligationId, statusNum);
        return sendSuccess(res, null, `Proof ${statusNum === 2 ? "verified" : "rejected"}`);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};
