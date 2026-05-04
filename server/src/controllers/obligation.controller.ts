import { Request, Response } from "express";
import {
    getObligations,
    getArchivedObligations,
    createObligation,
    updateObligation,
    deleteObligation,
    permanentlyDeleteObligation,
    restoreObligation,
    syncObligationStudents,
} from "../services/obligation.service.js";
import { uploadQR, uploadToCloudinary } from "../middleware/upload.middleware.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logAction } from "../services/audit.service.js";
import { isClassRole, isProgramRole } from "../config/role-groups.js";
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
        const { role, programId, yearLevel, section } = req.user!;
        const obligations = await getObligations(role, programId, yearLevel, section);
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
            if (obligationName.length > 255) {
                return sendError(res, "Obligation name must not exceed 255 characters", 400);
            }
            if (description && description.length > 500) {
                return sendError(res, "Description must not exceed 500 characters", 400);
            }

            const parsedAmount = parseFloat(amount) || 0;
            const parsedScope = Number(scope);
            const parsedSemester = Number(semester);

            // --- Scope enforcement ---
            // Clamp target fields so no role can exceed its own scope.
            const { role, programId: uProg, yearLevel: uYear, section: uSection } = req.user!;
            let effectiveProgramId = programId ? Number(programId) : null;
            let effectiveYearLevel = yearLevel  ? Number(yearLevel)  : null;
            let effectiveSection   = section    || null;

            if (isClassRole(role)) {
                // Class officers can create for their section/year/program — never scope=0 (all)
                if (parsedScope === 0)
                    return sendError(res, "Your role cannot create obligations for all students.", 403);
                if (uProg)    effectiveProgramId = Number(uProg);
                if (parsedScope >= 2 && uYear != null) effectiveYearLevel = Number(uYear);
                if (parsedScope === 3 && uSection)     effectiveSection   = uSection;
            } else if (isProgramRole(role)) {
                // Program officers can create for their program only — never scope=0 (all)
                if (parsedScope === 0)
                    return sendError(res, "Your role cannot create obligations for all students.", 403);
                if (uProg) effectiveProgramId = Number(uProg);
            }
            // ESO roles, system_admin, program_head, signatory, dean — no restriction

            const qrPath = req.file
                ? (await uploadToCloudinary(req.file.buffer, "eso/qr")).url
                : null;

            const obligation = await createObligation(
                {
                    obligationName,
                    description: description || undefined,
                    amount: parsedAmount,
                    gcashQrPath: qrPath,
                    isRequired: isRequired === "true" || isRequired === true,
                    scope:      parsedScope,
                    programId:  effectiveProgramId,
                    yearLevel:  effectiveYearLevel,
                    section:    effectiveSection,
                    schoolYear,
                    semester:   parsedSemester,
                    dueDate:    dueDate || null,
                },
                adminId
            );
            logAction({ performedBy: req.user!.userId, action: "obligation_created", targetType: "obligation", targetId: obligation.obligationId, details: { name: obligationName }, ipAddress: req.ip });
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
            if (updates.description && updates.description.length > 500)
                return sendError(res, "Description must not exceed 500 characters", 400);
            if (updates.amount !== undefined) updates.amount = parseFloat(updates.amount) || 0;
            if (req.file) updates.gcashQrPath = (await uploadToCloudinary(req.file.buffer, "eso/qr")).url;

            // Clamp scope fields for class/program roles on edit too
            const { role, programId: uProg, yearLevel: uYear, section: uSection } = req.user!;
            if (isClassRole(role)) {
                if (updates.scope !== undefined && Number(updates.scope) === 0)
                    return sendError(res, "Your role cannot set scope to all students.", 403);
                if (uProg) updates.programId = Number(uProg);
                if (updates.scope !== undefined && Number(updates.scope) >= 2 && uYear != null)
                    updates.yearLevel = Number(uYear);
                if (updates.scope !== undefined && Number(updates.scope) === 3 && uSection)
                    updates.section = uSection;
            } else if (isProgramRole(role)) {
                if (updates.scope !== undefined && Number(updates.scope) === 0)
                    return sendError(res, "Your role cannot set scope to all students.", 403);
                if (uProg) updates.programId = Number(uProg);
            }

            await updateObligation(id, updates);
            logAction({ performedBy: req.user!.userId, action: "obligation_updated", targetType: "obligation", targetId: id, ipAddress: req.ip });
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
        logAction({ performedBy: req.user!.userId, action: "obligation_archived", targetType: "obligation", targetId: id, ipAddress: req.ip });
        return sendSuccess(res, null, "Obligation deleted");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const listArchivedObligations = async (req: Request, res: Response) => {
    try {
        const { role, programId, yearLevel, section } = req.user!;
        const obligations = await getArchivedObligations(role, programId, yearLevel, section);
        return sendSuccess(res, obligations, "Archived obligations fetched");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const restoreObligationHandler = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid obligation ID", 400);
        await restoreObligation(id);
        logAction({ performedBy: req.user!.userId, action: "obligation_restored", targetType: "obligation", targetId: id, ipAddress: req.ip });
        return sendSuccess(res, null, "Obligation restored");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const permanentlyDeleteObligationHandler = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid obligation ID", 400);
        await permanentlyDeleteObligation(id);
        logAction({ performedBy: req.user!.userId, action: "obligation_permanently_deleted", targetType: "obligation", targetId: id, ipAddress: req.ip });
        return sendSuccess(res, null, "Obligation permanently deleted");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

export const syncObligation = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid obligation ID", 400);
        const inserted = await syncObligationStudents(id);
        logAction({ performedBy: req.user!.userId, action: "obligation_synced", targetType: "obligation", targetId: id, details: { studentsAssigned: inserted }, ipAddress: req.ip });
        return sendSuccess(res, { inserted }, `Synced: ${inserted} student(s) assigned`);
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};
