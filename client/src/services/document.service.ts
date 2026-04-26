import { apiFetch } from "./api";

// Use relative paths so Vite proxy routes them correctly on any device/tunnel
const API_BASE = "/api/v1";

export interface FieldPosition {
    x:    number;
    y:    number;
    size: number;
}

export interface FieldPositions {
    [variable: string]: FieldPosition;
}

export interface DocumentTemplate {
    templateId:      number;
    name:            string;
    content:         string;
    isDefault:       boolean;
    pdfPath:         string | null;
    pdfUrl:          string | null;   // e.g. /uploads/pdf-templates/xxx.pdf
    fieldPositions:  FieldPositions | null;
    createdByName:   string;
    createdAt:       string;
    updatedAt:       string;
}

export interface ApprovedStudent {
    studentId:   number;
    studentNo:   string;
    firstName:   string;
    lastName:    string;
    yearLevel:   number;
    section:     string;
    schoolYear:  string;
    semester:    string;
    programName: string;
    programCode: string;
    signedAt:    string;
}

// ─── Variable substitution ────────────────────────────────────────────────────

export function fillTemplate(html: string, student: ApprovedStudent): string {
    const date = new Date().toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
    });
    const prog = student.programName || student.programCode;
    return html
        .replace(/\{\{full_name\}\}/gi,       `${student.lastName}, ${student.firstName}`)
        .replace(/\{\{student_no\}\}/gi,      student.studentNo)
        .replace(/\{\{program_section\}\}/gi, `${prog} ${student.yearLevel}${student.section}`)
        .replace(/\{\{program\}\}/gi,         prog)
        .replace(/\{\{year_section\}\}/gi,    `${student.yearLevel}${student.section}`)
        .replace(/\{\{school_year\}\}/gi,     student.schoolYear)
        .replace(/\{\{semester\}\}/gi,        String(student.semester) === "1" ? "1st Semester" : String(student.semester) === "2" ? "2nd Semester" : "Summer")
        .replace(/\{\{date\}\}/gi,            date);
}

// Strip editor-only span wrappers before printing
function cleanHtml(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll(".var-chip").forEach(el => {
        el.replaceWith(document.createTextNode(el.textContent ?? ""));
    });
    return div.innerHTML;
}

// ─── Print window ─────────────────────────────────────────────────────────────

export function printDocuments(templateHtml: string, students: ApprovedStudent[]) {
    if (!students.length) { alert("No approved students to print."); return; }

    const win = window.open("", "_blank");
    if (!win) { alert("Please allow pop-ups for this page to enable printing."); return; }

    const baseHtml = cleanHtml(templateHtml);

    const pages = students
        .map(s => `<div class="page">${fillTemplate(baseHtml, s)}</div>`)
        .join(`<div class="page-break"></div>`);

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Clearance Documents · ${students.length} student(s)</title>
    <style>
        @page { size: A4 portrait; margin: 2cm 2.5cm; }
        *, *::before, *::after { box-sizing: border-box; }
        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt; color: #000; margin: 0; background: #fff;
        }
        .page { width: 100%; min-height: 24cm; }
        @media print {
            .no-print  { display: none !important; }
            .page-break { page-break-after: always; break-after: page; height: 0; }
            .page { min-height: unset; }
        }
        @media screen {
            body { background: #e5e7eb; }
            .pages-wrapper { padding: 70px 0 32px; }
            .page {
                width: 21cm; margin: 0 auto 24px;
                background: white; padding: 2cm 2.5cm;
                box-shadow: 0 4px 20px rgba(0,0,0,0.12);
            }
        }
        .no-print {
            position: fixed; top: 0; left: 0; right: 0; z-index: 999;
            background: #111827; color: #fff;
            padding: 12px 24px; display: flex; align-items: center; gap: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .no-print .print-btn {
            padding: 8px 22px; background: #f97316; color: #fff;
            border: none; border-radius: 6px; cursor: pointer;
            font-size: 13px; font-weight: 700; letter-spacing: 0.3px;
        }
        .no-print .print-btn:hover { background: #ea580c; }
        .no-print .info { font-size: 13px; opacity: 0.7; }
    </style>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        <span class="info">${students.length} document(s) ready · Use browser print dialog to save as PDF</span>
    </div>
    <div class="pages-wrapper">
        ${pages}
    </div>
</body>
</html>`);
    win.document.close();
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const documentService = {
    getTemplates: (token: string) =>
        apiFetch<DocumentTemplate[]>("/admin/documents", {}, token),

    getTemplate: (token: string, id: number) =>
        apiFetch<DocumentTemplate>(`/admin/documents/${id}`, {}, token),

    createTemplate: (token: string, name: string, content: string) =>
        apiFetch<{ templateId: number }>("/admin/documents", {
            method: "POST",
            body: JSON.stringify({ name, content }),
        }, token),

    updateTemplate: (token: string, id: number, name: string, content: string) =>
        apiFetch<null>(`/admin/documents/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name, content }),
        }, token),

    deleteTemplate: (token: string, id: number) =>
        apiFetch<null>(`/admin/documents/${id}`, { method: "DELETE" }, token),

    setDefault: (token: string, id: number) =>
        apiFetch<null>(`/admin/documents/${id}/set-default`, { method: "PATCH" }, token),

    unsetDefault: (token: string, id: number) =>
        apiFetch<null>(`/admin/documents/${id}/unset-default`, { method: "PATCH" }, token),

    getApprovedStudents: (token: string, schoolYear?: string, semester?: string) => {
        const p = new URLSearchParams();
        if (schoolYear) p.set("schoolYear", schoolYear);
        if (semester)   p.set("semester",   semester);
        const qs = p.toString();
        return apiFetch<ApprovedStudent[]>(
            `/admin/documents/approved-students${qs ? "?" + qs : ""}`, {}, token
        );
    },

    /** Fetch the raw PDF file for preview (returns a blob URL) */
    fetchPdfBlob: async (token: string, id: number): Promise<string> => {
        const resp = await fetch(`${API_BASE}/admin/documents/${id}/pdf-file`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error("Could not load PDF preview");
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    },

    uploadPdf: (token: string, id: number, file: File) => {
        const form = new FormData();
        form.append("pdf", file);
        return apiFetch<{ pdfPath: string }>(`/admin/documents/${id}/upload-pdf`, {
            method: "POST",
            body:   form,
        }, token);
    },

    removePdf: (token: string, id: number) =>
        apiFetch<null>(`/admin/documents/${id}/pdf`, { method: "DELETE" }, token),

    savePositions: (token: string, id: number, fieldPositions: FieldPositions) =>
        apiFetch<null>(`/admin/documents/${id}/positions`, {
            method: "PATCH",
            body:   JSON.stringify({ fieldPositions }),
        }, token),

    /** Fetch a stamped preview PDF using dummy student data, returns a blob URL */
    fetchPreviewPdf: async (token: string, id: number): Promise<string> => {
        const resp = await fetch(`${API_BASE}/admin/documents/${id}/preview-pdf`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            throw new Error(body?.message ?? `Server error ${resp.status}`);
        }
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    },

    /** Returns a URL to the print-merge PDF (opens directly in browser/tab) */
    printMergeUrl: (id: number, schoolYear?: string, semester?: string) => {
        const p = new URLSearchParams();
        if (schoolYear) p.set("schoolYear", schoolYear);
        if (semester)   p.set("semester",   semester);
        const qs = p.toString();
        return `${API_BASE}/admin/documents/${id}/print-merge${qs ? "?" + qs : ""}`;
    },
};
