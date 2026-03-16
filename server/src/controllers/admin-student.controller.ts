import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { listStudents, getStudentObligationsForAdmin } from "../services/admin-student.service.js";

export const handleListStudents = async (req: Request, res: Response) => {
    try {
        const students = await listStudents(req.user!.userId, req.user!.role, req.user!.departmentId);
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
