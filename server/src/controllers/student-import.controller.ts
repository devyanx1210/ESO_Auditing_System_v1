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
        const result = await checkImportExists(String(schoolYear), semester as any);
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

        // Map CAPS CSV headers → our format
        const rows = records
            .map(r => ({
                name:             r["NAME"]                                                      || "",
                studentNo:        r["STUDENT NUMBER"] || r["STUDENT ID"] || r["STUDENT NO"]     || "",
                program:          r["PROGRAM"]                                                   || "",
                yearSection:      r["YEAR/SECTION"] || r["YEAR SECTION"]                        || "",
                address:          r["ADDRESS"]                                                   || null,
                contact:          r["CONTACT"]                                                   || null,
                email:            r["EMAIL ADDRESS"] || r["EMAIL"]                              || "",
                guardian:         r["GUARDIAN"]                                                  || null,
                // "CONTACT NUMBER" = guardian emergency contact in the actual CSV format
                emergencyContact: r["CONTACT NUMBER"] || r["EMERGENCY CONTACT NUMBER"] || r["EMERGENCY CONTACT"] || null,
                shirtSize:        r["SHIRT SIZE"] || r["SHIRTSIZE"]                             || null,
            }))
            .filter(r => r.name && r.studentNo && r.email);

        if (!rows.length)
            return sendError(res, "No valid rows found in CSV (NAME, STUDENT NUMBER, EMAIL ADDRESS are required)", 400);

        const result = await importStudents(rows, {
            schoolYear: String(schoolYear).trim(),
            semester:   semester as any,
            importedBy: req.user!.userId,
        });

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
