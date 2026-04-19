import pool from "../config/db.js";

export interface AdminProfile {
    adminId:     number;
    userId:      number;
    firstName:   string;
    lastName:    string;
    email:       string;
    role:        string;
    roleLabel:   string;
    position:    string;
    programName: string | null;
    programCode: string | null;
    yearLevel:   number | null;
    section:     string | null;
    avatarPath:  string | null;
}

export const getAdminProfile = async (userId: number): Promise<AdminProfile> => {
    const [rows]: any = await pool.execute(
        `SELECT u.user_id, u.first_name, u.last_name, u.email,
                r.role_name, r.role_label,
                a.admin_id, a.position, a.year_level, a.section, a.avatar_path,
                p.name AS programName, p.code AS programCode
         FROM users u
         JOIN roles r        ON r.role_id   = u.role_id
         LEFT JOIN admins a  ON a.user_id   = u.user_id
         LEFT JOIN programs p ON p.program_id = u.program_id
         WHERE u.user_id = ?`,
        [userId]
    );
    if (!rows.length) throw new Error("Admin profile not found");
    const r = rows[0];
    return {
        adminId:     r.admin_id,
        userId:      r.user_id,
        firstName:   r.first_name,
        lastName:    r.last_name,
        email:       r.email,
        role:        r.role_name,
        roleLabel:   r.role_label,
        position:    r.position,
        programName: r.programName  ?? null,
        programCode: r.programCode  ?? null,
        yearLevel:   r.year_level   ?? null,
        section:     r.section      ?? null,
        avatarPath:  r.avatar_path  ?? null,
    };
};

export const updateAdminProfile = async (
    userId: number,
    data: { firstName: string; lastName: string; position: string; avatarPath?: string | null }
): Promise<AdminProfile> => {
    await pool.execute(
        `UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE user_id = ?`,
        [data.firstName.trim(), data.lastName.trim(), userId]
    );

    if (data.avatarPath !== undefined) {
        await pool.execute(
            `UPDATE admins SET avatar_path = ?, updated_at = NOW() WHERE user_id = ?`,
            [data.avatarPath, userId]
        );
    }

    if (data.position !== undefined) {
        await pool.execute(
            `UPDATE admins SET position = ?, updated_at = NOW() WHERE user_id = ?`,
            [data.position.trim(), userId]
        );
    }

    return getAdminProfile(userId);
};
