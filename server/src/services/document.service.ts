import pool from "../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import fs from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Templates

export const getTemplates = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT t.template_id AS templateId, t.name, t.is_default AS isDefault,
                t.pdf_path AS pdfPath,
                t.created_at AS createdAt, t.updated_at AS updatedAt,
                CONCAT(u.first_name, ' ', u.last_name) AS createdByName
         FROM document_templates t
         JOIN users u ON u.user_id = t.created_by
         ORDER BY t.is_default DESC, t.updated_at DESC`
    );
    return rows;
};

export const getTemplate = async (id: number) => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT template_id AS templateId, name, content, is_default AS isDefault,
                pdf_path AS pdfPath, field_positions AS fieldPositions,
                created_at AS createdAt, updated_at AS updatedAt
         FROM document_templates WHERE template_id = ?`,
        [id]
    );
    if (!rows[0]) return null;
    const row = rows[0] as any;
    // field_positions comes back as a string from MySQL JSON columns
    if (typeof row.fieldPositions === "string") {
        try { row.fieldPositions = JSON.parse(row.fieldPositions); } catch { row.fieldPositions = null; }
    }
    return row;
};

export const createTemplate = async (name: string, content: string, userId: number) => {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO document_templates (name, content, created_by) VALUES (?, ?, ?)`,
        [name.trim(), content, userId]
    );
    return result.insertId;
};

export const updateTemplate = async (id: number, name: string, content: string) => {
    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE document_templates SET name = ?, content = ?, updated_at = NOW() WHERE template_id = ?`,
        [name.trim(), content, id]
    );
    if (result.affectedRows === 0) throw new Error("Template not found");
};

export const deleteTemplate = async (id: number) => {
    const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM document_templates WHERE template_id = ?`, [id]
    );
    if (result.affectedRows === 0) throw new Error("Template not found");
};

export const setDefaultTemplate = async (id: number) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.execute(`UPDATE document_templates SET is_default = 0`);
        await conn.execute(`UPDATE document_templates SET is_default = 1 WHERE template_id = ?`, [id]);
        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
};

export const unsetDefaultTemplate = async (id: number) => {
    await pool.execute(
        `UPDATE document_templates SET is_default = 0 WHERE template_id = ?`, [id]
    );
};

// PDF template helpers

export const updateTemplatePdf = async (
    id: number,
    pdfPath: string | null,
    fieldPositions: Record<string, { x: number; y: number; size: number }> | null
) => {
    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE document_templates
         SET pdf_path = ?, field_positions = ?, updated_at = NOW()
         WHERE template_id = ?`,
        [pdfPath, fieldPositions ? JSON.stringify(fieldPositions) : null, id]
    );
    if (result.affectedRows === 0) throw new Error("Template not found");
};

export const deletePdfFile = (pdfPath: string) => {
    try {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    } catch { /* ignore */ }
};

export interface FieldPositions {
    [variable: string]: { x: number; y: number; size: number };
}

export interface StudentForPrint {
    firstName:   string;
    lastName:    string;
    studentNo:   string;
    programName: string;
    programCode: string;
    yearLevel:   number;
    section:     string;
    schoolYear:  string;
    semester:    string;
    signedAt:    string;
}

export const stampPdfTemplate = async (
    templateId: number,
    students: StudentForPrint[]
): Promise<Uint8Array> => {
    const template = await getTemplate(templateId);
    if (!template)          throw new Error("Template not found");
    if (!template.pdfPath)  throw new Error("This template has no PDF file. Upload a PDF first.");

    const positions: FieldPositions = template.fieldPositions ?? {};
    const pdfBytes = fs.readFileSync(template.pdfPath);

    const srcPdf    = await PDFDocument.load(pdfBytes);
    const mergedPdf = await PDFDocument.create();

    const font = await mergedPdf.embedFont(StandardFonts.Helvetica);

    const date = new Date().toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
    });

    for (const student of students) {
        const [page] = await mergedPdf.copyPages(srcPdf, [0]);
        mergedPdf.addPage(page);

        const pageHeight = page.getHeight();

        const prog = student.programName || student.programCode;
        const values: Record<string, string> = {
            full_name:       `${student.lastName}, ${student.firstName}`,
            student_no:      student.studentNo,
            program_section: `${prog} ${student.yearLevel}${student.section}`,
            program:         prog,
            year_section:    `${student.yearLevel}${student.section}`,
            school_year:     student.schoolYear,
            semester:        String(student.semester) === "1" ? "1st Semester" : String(student.semester) === "2" ? "2nd Semester" : "Summer",
            date,
        };

        for (const [key, pos] of Object.entries(positions)) {
            const text = values[key] ?? "";
            if (!text) continue;
            page.drawText(text, {
                x:    pos.x,
                y:    pageHeight - pos.y,   // convert from top-left to pdf-lib's bottom-left origin
                size: pos.size || 12,
                font,
                color: rgb(0, 0, 0),
            });
        }
    }

    return mergedPdf.save();
};

// Approved students for print

export const getApprovedStudents = async (schoolYear?: string, semester?: string) => {
    let sql = `
        SELECT
            s.student_id    AS studentId,
            s.student_no    AS studentNo,
            s.first_name    AS firstName,
            s.last_name     AS lastName,
            s.year_level    AS yearLevel,
            s.section,
            s.school_year   AS schoolYear,
            s.semester,
            s.avatar_path   AS avatarPath,
            p.name          AS programName,
            p.code          AS programCode,
            cl.clearance_id AS clearanceId,
            cl.updated_at   AS signedAt
        FROM clearances cl
        JOIN students s ON s.student_id = cl.student_id
        JOIN users    u ON u.user_id    = s.user_id
        JOIN programs p ON p.program_id = s.program_id
        WHERE cl.clearance_status = 2
          AND u.deleted_at IS NULL
    `;
    const params: (string)[] = [];
    if (schoolYear) { sql += ` AND s.school_year = ?`; params.push(schoolYear); }
    if (semester)   { sql += ` AND s.semester = ?`;    params.push(semester); }
    sql += ` ORDER BY s.last_name, s.first_name`;

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    return rows;
};
