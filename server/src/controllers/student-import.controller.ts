import { Request, Response } from "express";
import { parse }              from "csv-parse/sync";
import { sendSuccess, sendError } from "../utils/response.js";
import {
    checkImportExists,
    importStudents,
    getImportSessions,
    deleteImportSession,
} from "../services/student-import.service.js";

// GET /student-import/check?schoolYear=&semester=
export const handleCheckImport = async (req: Request, res: Response) => {
    try {
        const { schoolYear, semester } = req.query;
        if (!schoolYear || !semester)
            return sendError(res, "schoolYear and semester are required", 400);
        const result = await checkImportExists(String(schoolYear), Number(semester));
        return sendSuccess(res, result);
    } catch (err: any) {
        return sendError(res, err.message);
    }
};

// POST /student-import  (multipart: csv file + body fields)
export const handleImportCSV = async (req: Request, res: Response) => {
    try {
        if (!req.file) return sendError(res, "No CSV file uploaded", 400);

        const { schoolYear, semester } = req.body;
        if (!schoolYear || !semester)
            return sendError(res, "schoolYear and semester are required", 400);

        // Parse CSV from memory buffer
        const records: Record<string, string>[] = parse(req.file.buffer, {
            columns:            true,
            skip_empty_lines:   true,
            trim:               true,
            relax_column_count: true,
        });

        // Normalize all headers to lowercase+trimmed so casing/spacing variants all match
        const normalizedRecords = records.map(r => {
            const out: Record<string, string> = {};
            for (const key of Object.keys(r)) out[key.trim().toLowerCase()] = r[key];
            return out;
        });

        // Pick first matching key from a list of lowercase candidates
        const col = (r: Record<string, string>, ...keys: string[]) =>
            keys.map(k => r[k]).find(v => v !== undefined && v !== "") ?? null;

        // Map CSV headers → our format (all candidate keys are lowercase)
        const mapped = normalizedRecords.map(r => ({
            name:             col(r, "name")                                                                          || "",
            studentNo:        col(r, "student number", "student no.", "student no", "student id", "student")         || "",
            program:          col(r, "program", "program name", "course")                                             || "",
            yearSection:      col(r, "year/section", "year section", "year/sec", "year sec", "year & section")       || "",
            address:          col(r, "address"),
            contact:          col(r, "contact", "contact no", "contact no.", "contact number"),
            email:            col(r, "email address", "email addr", "email ad", "email", "e-mail", "school email",
                                   "institutional email")                                                             || "",
            guardian:         col(r, "guardian", "guardian name"),
            emergencyContact: col(r, "contact number", "emergency contact number", "emergency contact",
                                   "emergency no", "emergency"),
            shirtSize:        col(r, "shirt size", "shirtsize", "shirt"),
        }));

        // Separate valid rows from rows missing required fields (report them, don't silently drop)
        const rows = mapped.filter(r => r.name && r.studentNo && r.email);
        const badRows = mapped.filter(r => !(r.name && r.studentNo && r.email));
        const prefixErrors: string[] = badRows.map(r => {
            const id = r.studentNo || r.name || "(unknown)";
            const missing = [!r.name && "NAME", !r.studentNo && "STUDENT NUMBER", !r.email && "EMAIL ADDRESS"]
                .filter(Boolean).join(", ");
            return `Row ${id}: missing required field(s): ${missing} — skipped`;
        });

        if (!rows.length)
            return sendError(res, "No valid rows found in CSV (NAME, STUDENT NUMBER, EMAIL ADDRESS are required)", 400);

        const result = await importStudents(rows, {
            schoolYear: String(schoolYear).trim(),
            semester:   Number(semester),
            importedBy: req.user!.userId,
        });

        // Prepend bad-row errors so they're visible in the UI
        result.errors   = [...prefixErrors, ...result.errors];
        result.skipped += badRows.length;

        return sendSuccess(res, result,
            `Import complete: ${result.imported} added, ${result.skipped} skipped`);
    } catch (err: any) {
        return sendError(res, err.message);
    }
};

// GET /student-import/sessions
export const handleGetImportSessions = async (req: Request, res: Response) => {
    try {
        const sessions = await getImportSessions();
        return sendSuccess(res, sessions);
    } catch (err: any) {
        return sendError(res, err.message);
    }
};

// DELETE /student-import/:importId
export const handleDeleteImportSession = async (req: Request, res: Response) => {
    try {
        const importId = Number(req.params.importId);
        if (!importId) return sendError(res, "Invalid import ID", 400);
        await deleteImportSession(importId);
        return sendSuccess(res, null, "Import session deleted");
    } catch (err: any) {
        return sendError(res, err.message);
    }
};
