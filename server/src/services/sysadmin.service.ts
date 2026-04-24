import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// ─── System Settings ────────────────────────────────────────────────────────

export const getSystemSettings = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT maintenance_mode, maintenance_msg, school_year, current_semester FROM system_settings LIMIT 1`
    );
    return rows[0] ?? null;
};

export const updateMaintenance = async (
    mode: boolean,
    msg: string,
    updatedBy: number
) => {
    await pool.execute(
        `UPDATE system_settings SET maintenance_mode = ?, maintenance_msg = ?, updated_by = ? LIMIT 1`,
        [mode ? 1 : 0, msg, updatedBy]
    );
};

export const updateSemesterSettings = async (
    schoolYear: string,
    semester: number,
    updatedBy: number
) => {
    await pool.execute(
        `UPDATE system_settings SET school_year = ?, current_semester = ?, updated_by = ? LIMIT 1`,
        [schoolYear, semester, updatedBy]
    );
};

// ─── Public maintenance check (no auth) ─────────────────────────────────────

export const getMaintenanceStatus = async (): Promise<{ maintenance_mode: boolean; maintenance_msg: string }> => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT maintenance_mode, maintenance_msg FROM system_settings LIMIT 1`
    );
    const row = rows[0];
    return {
        maintenance_mode: row ? Boolean(row.maintenance_mode) : false,
        maintenance_msg:  row?.maintenance_msg ?? "System is under maintenance.",
    };
};

// ─── Account Management ──────────────────────────────────────────────────────

export const getAllAccounts = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT u.user_id, u.first_name, u.last_name, u.email,
                r.role_id, r.role_name, r.role_label,
                u.program_id,
                d.name AS program_name,
                COALESCE(a.position, '') AS position,
                a.year_level, a.section,
                a.avatar_path,
                u.status, u.created_at
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         LEFT JOIN programs d ON u.program_id = d.program_id
         LEFT JOIN admins a ON u.user_id = a.user_id
         WHERE u.deleted_at IS NULL
         ORDER BY r.role_id ASC, u.last_name ASC`
    );
    return rows;
};

export const updateAccountStatus = async (userId: number, status: "active" | "inactive" | "suspended") => {
    await pool.execute(
        `UPDATE users SET status = ? WHERE user_id = ?`,
        [status, userId]
    );

    const title = status === "suspended" ? "Account Suspended"
        : status === "inactive"  ? "Account Deactivated"
        : "Account Reactivated";
    const message = status === "suspended"
        ? "Your account has been suspended. Please contact the administrator."
        : status === "inactive"
        ? "Your account has been deactivated."
        : "Your account has been reactivated. You can now log in.";
    await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
         VALUES (?, ?, ?, 9, ?, 'user', 0, NOW())`,
        [userId, title, message, userId]
    );
};

export const updateAdminAccount = async (
    userId: number,
    data: {
        firstName:  string;
        lastName:   string;
        email:      string;
        roleId:     number;
        programId:  number | null;
        position:   string;
        password?:  string;
        yearLevel?: number | null;
        section?:   string | null;
    }
) => {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

    // Update users row
    await pool.execute(
        `UPDATE users
            SET first_name = ?, last_name = ?, email = ?,
                role_id = ?, program_id = ?, updated_at = NOW()
          WHERE user_id = ?`,
        [data.firstName.trim(), data.lastName.trim(), data.email.trim(),
         data.roleId, data.programId, userId]
    );

    // Update password if provided
    if (data.password && data.password.length >= 8) {
        const hash = await bcrypt.hash(data.password, saltRounds);
        await pool.execute(
            `UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE user_id = ?`,
            [hash, userId]
        );
    }

    // Update admins row (position, year_level, section)
    await pool.execute(
        `UPDATE admins SET position = ?, year_level = ?, section = ?, updated_at = NOW() WHERE user_id = ?`,
        [data.position.trim() || null, data.yearLevel ?? null, data.section ?? null, userId]
    );

    // If the account is a student, sync name to students table too
    await pool.execute(
        `UPDATE students SET first_name = ?, last_name = ?, updated_at = NOW() WHERE user_id = ?`,
        [data.firstName.trim(), data.lastName.trim(), userId]
    );
};

export const createAdminAccount = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    programId?: number | null;
    position?: string;
    yearLevel?: number | null;
    section?: string | null;
}) => {
    const hash = await bcrypt.hash(data.password, 10);
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO users (first_name, last_name, email, password_hash, role_id, program_id, status)
         VALUES (?, ?, ?, ?, (SELECT role_id FROM roles WHERE role_name = ?), ?, 'active')`,
        [data.firstName, data.lastName, data.email, hash, data.role, data.programId ?? null]
    );
    const userId = result.insertId;
    if (data.role !== "system_admin") {
        await pool.execute(
            `INSERT INTO admins (user_id, position, program_id, year_level, section, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [userId, data.position?.trim() ?? "", data.programId ?? null, data.yearLevel ?? null, data.section ?? null]
        );
    }
    return userId;
};

export const deleteAccount = async (userId: number) => {
    await pool.execute(
        `UPDATE users SET deleted_at = NOW() WHERE user_id = ?`,
        [userId]
    );
};

// ─── Year Advancement ────────────────────────────────────────────────────────

const MAX_YEAR = 5; // Engineering programs in PH are 5 years

export const previewYearAdvancement = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT s.student_id, s.first_name, s.last_name, s.student_no,
                s.year_level, d.name AS department_name
         FROM students s
         JOIN users u ON u.user_id = s.user_id
         JOIN programs d ON d.program_id = s.program_id
         WHERE s.is_enrolled = 1 AND u.status = 'active'
         ORDER BY s.year_level ASC, s.last_name ASC`
    );
    const toAdvance  = rows.filter(s => s.year_level < MAX_YEAR);
    const toGraduate = rows.filter(s => s.year_level >= MAX_YEAR);
    return { toAdvance, toGraduate, totalAffected: rows.length };
};

export const executeYearAdvancement = async (newSchoolYear: string, updatedBy: number) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Advance students below max year
        const [advResult] = await conn.execute<ResultSetHeader>(
            `UPDATE students s
             JOIN users u ON u.user_id = s.user_id
             SET s.year_level = s.year_level + 1,
                 s.school_year = ?,
                 s.semester = 1,
                 s.updated_at = NOW()
             WHERE s.is_enrolled = 1 AND u.status = 'active' AND s.year_level < ?`,
            [newSchoolYear, MAX_YEAR]
        );

        // Get graduating students (at or beyond max year)
        const [graduating] = await conn.execute<RowDataPacket[]>(
            `SELECT s.student_id, s.user_id
             FROM students s
             JOIN users u ON u.user_id = s.user_id
             WHERE s.is_enrolled = 1 AND u.status = 'active' AND s.year_level >= ?`,
            [MAX_YEAR]
        );

        let graduatedCount = 0;
        if (graduating.length > 0) {
            const userIds    = graduating.map(g => g.user_id);
            const studentIds = graduating.map(g => g.student_id);
            await conn.execute(
                `UPDATE users SET status = 'inactive' WHERE user_id IN (${userIds.map(() => "?").join(",")})`,
                userIds
            );
            await conn.execute(
                `UPDATE students SET is_enrolled = 0, updated_at = NOW() WHERE student_id IN (${studentIds.map(() => "?").join(",")})`,
                studentIds
            );
            graduatedCount = graduating.length;
        }

        await conn.execute(
            `INSERT INTO audit_logs (performed_by, action, target_type, details) VALUES (?, 'year_advancement', 'students', ?)`,
            [updatedBy, JSON.stringify({ advanced: advResult.affectedRows, graduated: graduatedCount, newSchoolYear })]
        );

        await conn.commit();
        return { advancedCount: advResult.affectedRows, graduatedCount };
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
};

// ─── Programs ────────────────────────────────────────────────────────────────

export const getAllPrograms = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT program_id, name, code FROM programs ORDER BY name ASC`
    );
    return rows;
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────

// ─── Roles ───────────────────────────────────────────────────────────────────

export const getAllRoles = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT role_id, role_name, role_label, clearance_step
         FROM roles
         WHERE role_name != 'student'
         ORDER BY role_label`
    );
    return rows;
};

// ─── Clearance Workflow ──────────────────────────────────────────────────────

export const getClearanceWorkflow = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT role_id, role_name, role_label, clearance_step
         FROM roles
         ORDER BY CASE WHEN clearance_step IS NULL THEN 1 ELSE 0 END, clearance_step, role_label`
    );
    return rows;
};

export const updateClearanceWorkflow = async (
    steps: { roleId: number; clearanceStep: number | null }[]
) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const { roleId, clearanceStep } of steps) {
            await conn.execute(
                `UPDATE roles SET clearance_step = ? WHERE role_id = ?`,
                [clearanceStep ?? null, roleId]
            );
        }
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const getAuditLogs = async (page: number = 1, limit: number = 50) => {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT al.audit_id, al.action, al.target_type, al.target_id,
                al.details, al.ip_address, al.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS performed_by_name,
                r.role_label AS performed_by_role
         FROM audit_logs al
         JOIN users u ON u.user_id = al.performed_by
         JOIN roles r ON r.role_id = u.role_id
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    const [[{ total }]] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM audit_logs`
    );
    return { logs: rows, total: Number(total), page, limit };
};
