import { Request, Response } from "express";
import {
    getObligations,
    createObligation,
    updateObligation,
    deleteObligation,
    syncObligationStudents,
} from "../services/obligation.service.js";
import { uploadQR } from "../middleware/upload.middleware.js";
import { sendSuccess, sendError } from "../utils/response.js";
import pool from "../config/db.js";

async function getAdminId(userId: number): Promise<number | null> {
    const [rows]: any = await pool.execute(
        "SELECT admin_id FROM admins WHERE user_id = ?",
        [userId]
    );
    return rows.length ? rows[0].admin_id : null;
}

export const listObligations = async (req: Request, res: Response) => {
    try {
        const obligations = await getObligations(req.user!.role, req.user!.programId);
        return sendSuccess(res, obligations, "Obligations fetched");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const addObligation = (req: Request, res: Response) => {
    uploadQR(req, res, async (err) => {
        if (err) return sendError(res, err.message, 400);

        try {
            const adminId = await getAdminId(req.user!.userId);
            if (!adminId) return sendError(res, "Admin record not found", 403);

            const {
                obligationName, description, amount, isRequired,
                scope, programId, yearLevel, section,
                schoolYear, semester, dueDate,
            } = req.body;

            if (!obligationName || !scope || !schoolYear || !semester) {
                return sendError(res, "obligationName, scope, schoolYear, semester are required", 400);
            }

            const parsedAmount = parseFloat(amount) || 0;
            const qrPath = req.file ? `qr/${req.file.filename}` : null;

            const obligation = await createObligation(
                {
                    obligationName,
                    description: description || undefined,
                    amount: parsedAmount,
                    gcashQrPath: qrPath,
                    isRequired: isRequired === "true" || isRequired === true,
                    scope,
                    programId: programId ? Number(programId) : null,
                    yearLevel:   yearLevel   ? Number(yearLevel)   : null,
                    section:     section     || null,
                    schoolYear,
                    semester,
                    dueDate:     dueDate     || null,
                },
                adminId
            );
            return sendSuccess(res, obligation, "Obligation created", 201);
        } catch (error: any) {
            return sendError(res, error.message, 500);
        }
    });
};

export const editObligation = (req: Request, res: Response) => {
    uploadQR(req, res, async (err) => {
        if (err) return sendError(res, err.message, 400);

        try {
            const id = Number(req.params.id);
            if (!id) return sendError(res, "Invalid obligation ID", 400);

            const updates: any = { ...req.body };
            if (updates.amount !== undefined) updates.amount = parseFloat(updates.amount) || 0;
            if (req.file) updates.gcashQrPath = `qr/${req.file.filename}`;

            await updateObligation(id, updates);
            return sendSuccess(res, null, "Obligation updated");
        } catch (error: any) {
            return sendError(res, error.message, 500);
        }
    });
};

export const removeObligation = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid obligation ID", 400);
        await deleteObligation(id);
        return sendSuccess(res, null, "Obligation deleted");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const syncObligation = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid obligation ID", 400);
        const inserted = await syncObligationStudents(id);
        return sendSuccess(res, { inserted }, `Synced: ${inserted} student(s) assigned`);
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};
