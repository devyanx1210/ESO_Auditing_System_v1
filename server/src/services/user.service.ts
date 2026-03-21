import bcrypt from "bcrypt";
import pool from "../config/db.js";

export interface CreateAdminInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "eso_officer" | "class_officer" | "program_head" | "signatory" | "dean";
    programId?: number | null;
    position: string;
}

export interface AdminUserItem {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    roleLabel: string;
    programName: string | null;
    position: string;
    status: string;
    createdAt: string;
}

export const createAdminUser = async (input: CreateAdminInput): Promise<AdminUserItem> => {
    const [existing]: any = await pool.execute(
        "SELECT user_id FROM users WHERE email = ?",
        [input.email.toLowerCase().trim()]
    );
    if (existing.length) throw new Error("Email is already registered");

    const [roleRows]: any = await pool.execute(
        "SELECT role_id FROM roles WHERE role_name = ?",
        [input.role]
    );
    if (!roleRows.length) throw new Error("Invalid role");
    const roleId = roleRows[0].role_id;

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const [result]: any = await pool.execute(
        `INSERT INTO users
            (first_name, last_name, email, password_hash, role_id, program_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
            input.firstName.trim(),
            input.lastName.trim(),
            input.email.toLowerCase().trim(),
            passwordHash,
            roleId,
            input.programId ?? null,
        ]
    );
    const userId = result.insertId;

    await pool.execute(
        "INSERT INTO admins (user_id, position, program_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [userId, input.position.trim(), input.programId ?? null]
    );

    const [created]: any = await pool.execute(
        `SELECT u.user_id, u.first_name, u.last_name, u.email, u.status, u.created_at,
                r.role_name, r.role_label,
                d.name AS programName,
                a.position
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         LEFT JOIN programs d ON u.program_id = d.program_id
         JOIN admins a ON u.user_id = a.user_id
         WHERE u.user_id = ?`,
        [userId]
    );
    const u = created[0];
    return {
        userId:         u.user_id,
        firstName:      u.first_name,
        lastName:       u.last_name,
        email:          u.email,
        role:           u.role_name,
        roleLabel:      u.role_label,
        programName: u.programName,
        position:       u.position,
        status:         u.status,
        createdAt:      u.created_at,
    };
};

export const toggleAdminStatus = async (userId: number): Promise<{ status: string }> => {
    const [rows]: any = await pool.execute(
        "SELECT u.user_id, u.status FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ? AND r.role_name != 'system_admin' AND r.role_name != 'student' AND u.deleted_at IS NULL",
        [userId]
    );
    if (!rows.length) throw new Error("Admin not found or cannot be modified");
    const current = rows[0].status;
    const next = current === "active" ? "inactive" : "active";
    await pool.execute(
        "UPDATE users SET status = ?, updated_at = NOW() WHERE user_id = ?",
        [next, userId]
    );
    return { status: next };
};

export const deleteAdminUser = async (userId: number): Promise<void> => {
    const [rows]: any = await pool.execute(
        "SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ? AND r.role_name != 'system_admin' AND r.role_name != 'student'",
        [userId]
    );
    if (!rows.length) throw new Error("Admin not found or cannot be deleted");
    await pool.execute(
        "UPDATE users SET deleted_at = NOW(), status = 'inactive', updated_at = NOW() WHERE user_id = ?",
        [userId]
    );
};

export const getAdminUsers = async (): Promise<AdminUserItem[]> => {
    const [rows]: any = await pool.execute(
        `SELECT u.user_id, u.first_name, u.last_name, u.email, u.status, u.created_at,
                r.role_name, r.role_label,
                d.name AS programName,
                a.position
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         LEFT JOIN programs d ON u.program_id = d.program_id
         JOIN admins a ON u.user_id = a.user_id
         WHERE r.role_name != 'student' AND u.deleted_at IS NULL
         ORDER BY r.role_name, u.last_name`
    );
    return rows.map((u: any) => ({
        userId:         u.user_id,
        firstName:      u.first_name,
        lastName:       u.last_name,
        email:          u.email,
        role:           u.role_name,
        roleLabel:      u.role_label,
        programName: u.programName,
        position:       u.position,
        status:         u.status,
        createdAt:      u.created_at,
    }));
};
