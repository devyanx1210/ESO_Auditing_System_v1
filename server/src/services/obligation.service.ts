import pool from "../config/db.js";

export interface ObligationData {
    obligationId: number;
    obligationName: string;
    description: string | null;
    amount: number;
    requiresPayment: boolean;
    gcashQrPath: string | null;
    isRequired: boolean;
    scope: number;
    programId: number | null;
    programName: string | null;
    yearLevel: number | null;
    section: string | null;
    schoolYear: string;
    semester: number;
    dueDate: string | null;
    isActive: boolean;
    createdAt: string;
    createdByName: string | null;
}

export interface CreateObligationInput {
    obligationName: string;
    description?: string;
    amount: number;
    gcashQrPath?: string | null;
    isRequired?: boolean;
    scope: number;
    programId?: number | null;
    yearLevel?: number | null;
    section?: string | null;
    schoolYear: string;
    semester: number;
    dueDate?: string | null;
}

function mapRow(r: any): ObligationData {
    const dueDate = r.dueDate
        ? (r.dueDate.toISOString?.().split("T")[0] ?? r.dueDate)
        : null;
    return {
        obligationId:    r.obligationId,
        obligationName:  r.obligationName,
        description:     r.description ?? null,
        amount:             Number(r.amount),
        requiresPayment:    Number(r.amount) > 0,
        gcashQrPath:        r.gcashQrPath ?? null,
        isRequired:      Boolean(r.isRequired),
        scope:           r.scope,
        programId:    r.programId ?? null,
        programName:  r.programName ?? null,
        yearLevel:       r.yearLevel ?? null,
        section:         r.section ?? null,
        schoolYear:      r.schoolYear,
        semester:        r.semester,
        dueDate,
        isActive:        Boolean(r.isActive),
        createdAt:       r.createdAt,
        createdByName:   r.createdByName ?? null,
    };
}

import { isClassRole, isProgramRole, isEsoRole } from "../config/role-groups.js";

const OBLIGATION_SELECT = `
    SELECT
        o.obligation_id   AS obligationId,
        o.obligation_name AS obligationName,
        o.description,
        o.amount,
        o.gcash_qr_path          AS gcashQrPath,
        o.is_required            AS isRequired,
        o.scope,
        o.program_id      AS programId,
        d.name            AS programName,
        o.year_level      AS yearLevel,
        o.section,
        o.school_year     AS schoolYear,
        o.semester,
        o.due_date        AS dueDate,
        o.is_active       AS isActive,
        o.created_at      AS createdAt,
        CONCAT(u.first_name, ' ', u.last_name) AS createdByName
    FROM obligations o
    LEFT JOIN programs d ON o.program_id = d.program_id
    LEFT JOIN admins a ON o.created_by = a.admin_id
    LEFT JOIN users u ON a.user_id = u.user_id
`;

function buildScopeFilter(
    role: string | undefined,
    programId: number | null | undefined,
    yearLevel: number | null | undefined,
    section: string | null | undefined,
    activeFlag: 0 | 1
): { where: string; params: any[] } {
    const params: any[] = [];
    const base = `o.is_active = ${activeFlag}`;

    if (isClassRole(role ?? "")) {
        // Class roles: see scope=0 (all), scope=1 for their program,
        // scope=2 for their year (+ program), scope=3 for their section (+ year + program)
        const parts: string[] = ["o.scope = 0"];
        if (programId) {
            parts.push("(o.scope = 1 AND o.program_id = ?)");
            params.push(programId);
        }
        if (yearLevel != null) {
            parts.push("(o.scope = 2 AND o.year_level = ? AND (o.program_id IS NULL OR o.program_id = ?))");
            params.push(yearLevel, programId ?? null);
        }
        if (section && yearLevel != null) {
            parts.push("(o.scope = 3 AND o.section = ? AND o.year_level = ? AND (o.program_id IS NULL OR o.program_id = ?))");
            params.push(section, yearLevel, programId ?? null);
        }
        return { where: `${base} AND (${parts.join(" OR ")})`, params };
    }

    if (isProgramRole(role ?? "")) {
        // Program officers: only see scope=1 obligations made for their program (not ESO-wide scope=0)
        if (programId) {
            params.push(programId);
            return { where: `${base} AND o.scope = 1 AND o.program_id = ?`, params };
        }
    }

    if (role === "program_head") {
        // Program head: sees everything in their program including scope=0
        if (programId) {
            params.push(programId);
            return { where: `${base} AND (o.program_id IS NULL OR o.program_id = ?)`, params };
        }
    }

    // ESO, sysadmin, dean, signatory — see everything
    return { where: base, params };
}

export const getObligations = async (
    role?: string,
    programId?: number | null,
    yearLevel?: number | null,
    section?: string | null
): Promise<ObligationData[]> => {
    const { where, params } = buildScopeFilter(role, programId, yearLevel, section, 1);
    const [rows]: any = await pool.execute(
        `${OBLIGATION_SELECT} WHERE ${where} ORDER BY o.created_at DESC`,
        params
    );
    return rows.map(mapRow);
};

export const getArchivedObligations = async (
    role?: string,
    programId?: number | null,
    yearLevel?: number | null,
    section?: string | null
): Promise<ObligationData[]> => {
    const { where, params } = buildScopeFilter(role, programId, yearLevel, section, 0);
    const [rows]: any = await pool.execute(
        `${OBLIGATION_SELECT} WHERE ${where} ORDER BY o.updated_at DESC`,
        params
    );
    return rows.map(mapRow);
};

export const createObligation = async (
    input: CreateObligationInput,
    adminId: number
): Promise<ObligationData> => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result]: any = await conn.execute(
            `INSERT INTO obligations (
                obligation_name, description, amount, is_required,
                scope, program_id, year_level, section,
                school_year, semester, due_date, gcash_qr_path,
                is_active, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
            [
                input.obligationName,
                input.description ?? null,
                input.amount,
                input.isRequired ?? true,
                input.scope,
                input.programId ?? null,
                input.yearLevel ?? null,
                input.section ?? null,
                input.schoolYear,
                input.semester,
                input.dueDate ?? null,
                input.gcashQrPath ?? null,
                adminId,
            ]
        );
        const obligationId = result.insertId;

        // Find matching enrolled students — school_year is a label on the obligation,
        // not a filter; assign to all enrolled students that match the scope
        let studentQuery = `
            SELECT s.student_id, u.user_id
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.is_enrolled = 1
        `;
        const params: any[] = [];

        if (input.scope === 1 && input.programId) {
            studentQuery += " AND s.program_id = ?";
            params.push(input.programId);
        } else if (input.scope === 2 && input.yearLevel) {
            if (input.programId) {
                studentQuery += " AND s.program_id = ? AND s.year_level = ?";
                params.push(input.programId, input.yearLevel);
            } else {
                studentQuery += " AND s.year_level = ?";
                params.push(input.yearLevel);
            }
        } else if (input.scope === 3 && input.section) {
            if (input.programId) {
                studentQuery += " AND s.program_id = ? AND s.year_level = ? AND s.section = ?";
                params.push(input.programId, input.yearLevel, input.section);
            } else {
                studentQuery += " AND s.year_level = ? AND s.section = ?";
                params.push(input.yearLevel, input.section);
            }
        }

        const [students]: any = await conn.execute(studentQuery, params);

        for (const student of students) {
            await conn.execute(
                `INSERT IGNORE INTO student_obligations
                    (student_id, obligation_id, amount_due, status, created_at, updated_at)
                 VALUES (?, ?, ?, 0, NOW(), NOW())`,
                [student.student_id, obligationId, input.amount]
            );

            await conn.execute(
                `INSERT INTO notifications
                    (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
                 VALUES (?, 'New Obligation Assigned', ?, 1, ?, 'obligation', 0, NOW())`,
                [
                    student.user_id,
                    `New obligation assigned: ${input.obligationName}`,
                    obligationId,
                ]
            );
        }

        await conn.commit();

        const [created]: any = await conn.execute(
            `SELECT o.obligation_id AS obligationId, o.obligation_name AS obligationName,
                    o.description, o.amount, o.gcash_qr_path AS gcashQrPath,
                    o.is_required AS isRequired, o.scope,
                    o.program_id AS programId, d.name AS programName,
                    o.year_level AS yearLevel, o.section,
                    o.school_year AS schoolYear, o.semester,
                    o.due_date AS dueDate, o.is_active AS isActive, o.created_at AS createdAt
             FROM obligations o
             LEFT JOIN programs d ON o.program_id = d.program_id
             WHERE o.obligation_id = ?`,
            [obligationId]
        );
        return mapRow(created[0]);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

export const updateObligation = async (
    obligationId: number,
    input: Partial<CreateObligationInput>
): Promise<void> => {
    const fields: string[] = [];
    const values: any[]    = [];

    if (input.obligationName      !== undefined) { fields.push("obligation_name = ?");       values.push(input.obligationName); }
    if (input.description         !== undefined) { fields.push("description = ?");           values.push(input.description); }
    if (input.amount              !== undefined) { fields.push("amount = ?");                values.push(input.amount); }
    if (input.isRequired          !== undefined) { fields.push("is_required = ?");           values.push(input.isRequired); }
    if (input.dueDate             !== undefined) { fields.push("due_date = ?");              values.push(input.dueDate); }
    if (input.gcashQrPath         !== undefined) { fields.push("gcash_qr_path = ?");         values.push(input.gcashQrPath); }

    if (!fields.length) return;
    fields.push("updated_at = NOW()");
    values.push(obligationId);

    await pool.execute(
        `UPDATE obligations SET ${fields.join(", ")} WHERE obligation_id = ?`,
        values
    );
};

export const toggleObligationActive = async (obligationId: number): Promise<boolean> => {
    const [rows]: any = await pool.execute(
        `SELECT is_active FROM obligations WHERE obligation_id = ?`,
        [obligationId]
    );
    if (!rows.length) throw new Error("Obligation not found");
    const newActive = rows[0].is_active ? 0 : 1;
    await pool.execute(
        `UPDATE obligations SET is_active = ?, updated_at = NOW() WHERE obligation_id = ?`,
        [newActive, obligationId]
    );
    return Boolean(newActive);
};

/**
 * Retroactively assign an obligation to all currently enrolled matching students
 * who don't already have a student_obligation row for it.
 * Returns how many new rows were inserted.
 */
export const syncObligationStudents = async (obligationId: number): Promise<number> => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Fetch the obligation
        const [obs]: any = await conn.execute(
            `SELECT o.*, a.user_id AS creator_user_id
             FROM obligations o
             JOIN admins a ON o.created_by = a.admin_id
             WHERE o.obligation_id = ?`,
            [obligationId]
        );
        if (!obs.length) throw new Error("Obligation not found");
        const ob = obs[0];

        // Build student query matching the obligation's scope (school_year is a label, not a filter)
        let studentQuery = `
            SELECT s.student_id, u.user_id
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.is_enrolled = 1
        `;
        const params: any[] = [];

        if (ob.scope === 1 && ob.program_id) {
            studentQuery += " AND s.program_id = ?";
            params.push(ob.program_id);
        } else if (ob.scope === 2) {
            if (ob.year_level) { studentQuery += " AND s.year_level = ?"; params.push(ob.year_level); }
            if (ob.program_id) { studentQuery += " AND s.program_id = ?"; params.push(ob.program_id); }
        } else if (ob.scope === 3) {
            if (ob.section) { studentQuery += " AND s.section = ?"; params.push(ob.section); }
            if (ob.year_level) { studentQuery += " AND s.year_level = ?"; params.push(ob.year_level); }
            if (ob.program_id) { studentQuery += " AND s.program_id = ?"; params.push(ob.program_id); }
        }

        // Exclude students who already have this obligation
        studentQuery += `
            AND s.student_id NOT IN (
                SELECT student_id FROM student_obligations WHERE obligation_id = ?
            )
        `;
        params.push(obligationId);

        const [students]: any = await conn.execute(studentQuery, params);
        let inserted = 0;

        for (const student of students) {
            await conn.execute(
                `INSERT IGNORE INTO student_obligations
                    (student_id, obligation_id, amount_due, status, created_at, updated_at)
                 VALUES (?, ?, ?, 0, NOW(), NOW())`,
                [student.student_id, obligationId, ob.amount]
            );
            await conn.execute(
                `INSERT INTO notifications
                    (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
                 VALUES (?, 'New Obligation Assigned', ?, 1, ?, 'obligation', 0, NOW())`,
                [
                    student.user_id,
                    `New obligation assigned: ${ob.obligation_name}`,
                    obligationId,
                ]
            );
            inserted++;
        }

        await conn.commit();
        return inserted;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// Soft delete — moves to archive
export const deleteObligation = async (obligationId: number): Promise<void> => {
    await pool.execute(
        `UPDATE obligations SET is_active = 0, updated_at = NOW() WHERE obligation_id = ?`,
        [obligationId]
    );
};

// Hard delete — permanently removes from DB (only from archive)
export const permanentlyDeleteObligation = async (obligationId: number): Promise<void> => {
    const [students]: any = await pool.execute(
        `SELECT u.user_id, o.obligation_name
         FROM student_obligations so
         JOIN students s ON so.student_id = s.student_id
         JOIN users u ON s.user_id = u.user_id
         JOIN obligations o ON so.obligation_id = o.obligation_id
         WHERE so.obligation_id = ? AND so.status = 0`,
        [obligationId]
    );
    if (students.length) {
        const name = students[0].obligation_name;
        for (const s of students) {
            await pool.execute(
                `INSERT INTO notifications
                    (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
                 VALUES (?, 'Obligation Removed', ?, 3, ?, 'obligation', 0, NOW())`,
                [s.user_id, `The obligation "${name}" has been permanently removed.`, obligationId]
            );
        }
    }
    await pool.execute("DELETE FROM student_obligations WHERE obligation_id = ?", [obligationId]);
    await pool.execute("DELETE FROM obligations WHERE obligation_id = ?", [obligationId]);
};

// Restore from archive
export const restoreObligation = async (obligationId: number): Promise<void> => {
    await pool.execute(
        `UPDATE obligations SET is_active = 1, updated_at = NOW() WHERE obligation_id = ?`,
        [obligationId]
    );
};
