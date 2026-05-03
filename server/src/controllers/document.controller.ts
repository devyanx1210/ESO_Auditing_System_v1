import https from "https";
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../middleware/upload.middleware.js";
import * as svc from "../services/document.service.js";

function isCloudinaryUrl(path: string | null): boolean {
    return typeof path === "string" && path.startsWith("https://");
}

function attachPdfUrl(tpl: any): any {
    const valid = isCloudinaryUrl(tpl?.pdfPath);
    // Use server proxy route so browser never hits Cloudinary directly (avoids CORS issues)
    tpl.pdfUrl = valid ? `/api/v1/documents/${tpl.templateId}/pdf-file` : null;
    if (!valid) tpl.pdfPath = null;
    return tpl;
}

export const handleGetTemplates = async (_req: Request, res: Response) => {
    try { sendSuccess(res, (await svc.getTemplates()).map(attachPdfUrl)); }
    catch (e: any) { sendError(res, e.message); }
};

export const handleGetTemplate = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);
        const tpl = await svc.getTemplate(id);
        if (!tpl) return sendError(res, "Template not found", 404);
        sendSuccess(res, attachPdfUrl(tpl));
    } catch (e: any) { sendError(res, e.message); }
};

export const handleCreateTemplate = async (req: Request, res: Response) => {
    try {
        const { name, content } = req.body;
        if (!name?.trim()) return sendError(res, "Template name is required", 400);
        const templateId = await svc.createTemplate(name, content ?? "", req.user!.userId);
        sendSuccess(res, { templateId }, "Template created");
    } catch (e: any) { sendError(res, e.message); }
};

export const handleUpdateTemplate = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);
        const { name, content } = req.body;
        if (!name?.trim()) return sendError(res, "Template name is required", 400);
        await svc.updateTemplate(id, name, content ?? "");
        sendSuccess(res, null, "Template updated");
    } catch (e: any) { sendError(res, e.message); }
};

export const handleDeleteTemplate = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);
        const tpl = await svc.getTemplate(id);
        if (tpl?.pdfPath && isCloudinaryUrl(tpl.pdfPath)) await deleteFromCloudinary(tpl.pdfPath, "raw");
        await svc.deleteTemplate(id);
        sendSuccess(res, null, "Template deleted");
    } catch (e: any) { sendError(res, e.message); }
};

export const handleSetDefault = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);
        await svc.setDefaultTemplate(id);
        sendSuccess(res, null, "Default template set");
    } catch (e: any) { sendError(res, e.message); }
};

export const handleUnsetDefault = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);
        await svc.unsetDefaultTemplate(id);
        sendSuccess(res, null, "Default unset");
    } catch (e: any) { sendError(res, e.message); }
};

export const handleGetApprovedStudents = async (req: Request, res: Response) => {
    try {
        const { schoolYear, semester } = req.query;
        const students = await svc.getApprovedStudents(
            schoolYear as string | undefined,
            semester   as string | undefined
        );
        sendSuccess(res, students);
    } catch (e: any) { sendError(res, e.message); }
};

// PDF file — proxied through server so browser avoids Cloudinary CORS restrictions

export const handleGetPdfFile = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);
        const tpl = await svc.getTemplate(id);
        if (!tpl?.pdfPath || !isCloudinaryUrl(tpl.pdfPath))
            return sendError(res, "No PDF attached to this template", 404);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");

        https.get(tpl.pdfPath, (proxyRes) => {
            if (proxyRes.headers["content-length"])
                res.setHeader("Content-Length", proxyRes.headers["content-length"]);
            proxyRes.pipe(res);
        }).on("error", (err) => {
            if (!res.headersSent) sendError(res, err.message, 502);
        });
    } catch (e: any) { sendError(res, e.message); }
};

// PDF upload — goes to Cloudinary, URL stored in DB

export const handleUploadPdf = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);
        if (!req.file) return sendError(res, "No PDF file uploaded", 400);

        // Delete old PDF from Cloudinary if one exists (skip stale local paths)
        const existing = await svc.getTemplate(id);
        if (existing?.pdfPath && isCloudinaryUrl(existing.pdfPath)) await deleteFromCloudinary(existing.pdfPath, "raw");

        const { url } = await uploadToCloudinary(req.file.buffer, "eso/pdf-templates", "raw");
        await svc.updateTemplatePdf(id, url, existing?.fieldPositions ?? null);
        sendSuccess(res, { pdfPath: url, pdfUrl: url }, "PDF uploaded");
    } catch (e: any) { sendError(res, e.message); }
};

// Save field positions

export const handleSavePositions = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);

        const { fieldPositions } = req.body;
        if (!fieldPositions || typeof fieldPositions !== "object")
            return sendError(res, "fieldPositions must be an object", 400);

        const tpl = await svc.getTemplate(id);
        if (!tpl) return sendError(res, "Template not found", 404);

        await svc.updateTemplatePdf(id, tpl.pdfPath ?? null, fieldPositions);
        sendSuccess(res, null, "Field positions saved");
    } catch (e: any) { sendError(res, e.message); }
};

// Remove PDF

export const handleRemovePdf = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);

        const tpl = await svc.getTemplate(id);
        if (!tpl) return sendError(res, "Template not found", 404);
        if (tpl.pdfPath && isCloudinaryUrl(tpl.pdfPath)) await deleteFromCloudinary(tpl.pdfPath, "raw");

        await svc.updateTemplatePdf(id, null, null);
        sendSuccess(res, null, "PDF removed");
    } catch (e: any) { sendError(res, e.message); }
};

// Preview PDF with dummy data

const PREVIEW_DUMMY = {
    firstName:   "Juan",
    lastName:    "Dela Cruz",
    studentNo:   "2021-00001",
    programName: "Computer Engineering",
    programCode: "CpE",
    yearLevel:   3,
    section:     "A",
    schoolYear:  "2024-2025",
    semester:    "2",
    signedAt:    new Date().toISOString(),
};

export const handlePreviewPdf = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);

        const pdfBytes = await svc.stampPdfTemplate(id, [PREVIEW_DUMMY]);

        res.setHeader("Content-Type",        "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="preview.pdf"`);
        res.setHeader("Content-Length",      pdfBytes.length);
        res.end(Buffer.from(pdfBytes));
    } catch (e: any) {
        sendError(res, e.message);
    }
};

// Stamp + stream merged PDF

export const handlePrintMerge = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!id) return sendError(res, "Invalid ID", 400);

        const { schoolYear, semester } = req.query;
        const students = await svc.getApprovedStudents(
            schoolYear as string | undefined,
            semester   as string | undefined
        );

        if (students.length === 0) {
            return sendError(res, "No approved students found for the given filters", 404);
        }

        const pdfBytes = await svc.stampPdfTemplate(id, students as any[]);

        res.setHeader("Content-Type",        "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="clearances.pdf"`);
        res.setHeader("Content-Length",      pdfBytes.length);
        res.end(Buffer.from(pdfBytes));
    } catch (e: any) {
        sendError(res, e.message);
    }
};
