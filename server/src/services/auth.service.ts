import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { jwtConfig } from "../config/jwt.js";
import {
    LoginInput,
    RegisterInput,
    AuthTokens,
    AuthenticatedUser,
    JwtAccessPayload,
    JwtRefreshPayload,
} from "../types/auth.types.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

export const generateTokens = (payload: JwtAccessPayload): AuthTokens => {
    const accessToken = jwt.sign(payload, jwtConfig.accessSecret, {
        expiresIn: jwtConfig.accessExpiresIn,
    } as jwt.SignOptions);
    const refreshToken = jwt.sign(
        { userId: payload.userId } as JwtRefreshPayload,
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshExpiresIn } as jwt.SignOptions
    );
    return { accessToken, refreshToken };
};

export const loginUser = async (
    input: LoginInput,
    ipAddress: string
): Promise<{ user: AuthenticatedUser; tokens: AuthTokens }> => {
    const [rows]: any = await pool.execute(
        `SELECT u.*, r.role_name, a.year_level AS admin_year_level, a.section AS admin_section
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         LEFT JOIN admins a ON u.user_id = a.user_id
         WHERE u.email = ? AND u.deleted_at IS NULL`,
        [input.email.toLowerCase().trim()]
    );
    if (!rows.length) throw new Error("Invalid email or password");
    const user = rows[0];
    if (user.status === "suspended")
        throw new Error("Your account has been suspended. Contact administrator.");
    if (user.status === "inactive")
        throw new Error("Your account is inactive. Contact administrator.");
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
        const minutesLeft = Math.ceil(
            (new Date(user.locked_until).getTime() - Date.now()) / 60000
        );
        throw new Error(`Account locked. Try again in ${minutesLeft} minute(s).`);
    }
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
        const attempts = user.failed_login_attempts + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES);
            await pool.execute(
                `UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE user_id = ?`,
                [attempts, lockUntil, user.user_id]
            );
        } else {
            await pool.execute(
                `UPDATE users SET failed_login_attempts = ? WHERE user_id = ?`,
                [attempts, user.user_id]
            );
        }
        throw new Error("Invalid email or password");
    }
    const isClassOfficer = user.role_name === "class_officer";
    const payload: JwtAccessPayload = {
        userId: user.user_id,
        email: user.email,
        role: user.role_name,
        programId: user.program_id,
        yearLevel: isClassOfficer ? (user.admin_year_level ?? null) : null,
        section: isClassOfficer ? (user.admin_section ?? null) : null,
    };
    const tokens = generateTokens(payload);
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await pool.execute(
        `UPDATE users SET
            refresh_token = ?,
            refresh_token_expires_at = ?,
            failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = NOW(),
            last_login_ip = ?
         WHERE user_id = ?`,
        [tokens.refreshToken, refreshExpiry, ipAddress, user.user_id]
    );
    const authenticatedUser: AuthenticatedUser = {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role_name,
        programId: user.program_id,
        status: user.status,
        yearLevel: isClassOfficer ? (user.admin_year_level ?? null) : null,
        section: isClassOfficer ? (user.admin_section ?? null) : null,
    };
    return { user: authenticatedUser, tokens };
};

export const refreshAccessToken = async (
    refreshToken: string
): Promise<string> => {
    try {
        const decoded = jwt.verify(
            refreshToken,
            jwtConfig.refreshSecret
        ) as JwtRefreshPayload;
        const [rows]: any = await pool.execute(
            `SELECT u.*, r.role_name, a.year_level AS admin_year_level, a.section AS admin_section
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             LEFT JOIN admins a ON u.user_id = a.user_id
             WHERE u.user_id = ? AND u.refresh_token = ? AND u.deleted_at IS NULL`,
            [decoded.userId, refreshToken]
        );
        if (!rows.length) throw new Error("Invalid refresh token");
        const user = rows[0];
        if (user.refresh_token_expires_at && new Date() > new Date(user.refresh_token_expires_at)) {
            throw new Error("Refresh token expired. Please login again.");
        }
        const isClassOfficer = user.role_name === "class_officer";
        const payload: JwtAccessPayload = {
            userId: user.user_id,
            email: user.email,
            role: user.role_name,
            programId: user.program_id,
            yearLevel: isClassOfficer ? (user.admin_year_level ?? null) : null,
            section: isClassOfficer ? (user.admin_section ?? null) : null,
        };
        const newAccessToken = jwt.sign(payload, jwtConfig.accessSecret, {
            expiresIn: jwtConfig.accessExpiresIn,
        } as jwt.SignOptions);
        return newAccessToken;
    } catch (error) {
        throw new Error("Invalid or expired refresh token");
    }
};

export const logoutUser = async (userId: number): Promise<void> => {
    await pool.execute(
        `UPDATE users SET
            refresh_token = NULL,
            refresh_token_expires_at = NULL
         WHERE user_id = ?`,
        [userId]
    );
};

export const verifyPassword = async (
    userId: number,
    password: string
): Promise<boolean> => {
    const [rows]: any = await pool.execute(
        `SELECT password_hash FROM users WHERE user_id = ?`,
        [userId]
    );
    if (!rows.length) return false;
    return bcrypt.compare(password, rows[0].password_hash);
};

export const changePassword = async (
    userId: number,
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    const [rows]: any = await pool.execute(
        `SELECT password_hash FROM users WHERE user_id = ?`,
        [userId]
    );
    if (!rows.length) throw new Error("User not found");
    const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isValid) throw new Error("Current password is incorrect");
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    await pool.execute(
        `UPDATE users SET
            password_hash = ?,
            password_changed_at = NOW()
         WHERE user_id = ?`,
        [newHash, userId]
    );
};

export const registerUser = async (
    input: RegisterInput
): Promise<{ user: AuthenticatedUser; tokens: AuthTokens }> => {
    const [existingEmail]: any = await pool.execute(
        `SELECT user_id FROM users WHERE email = ? AND deleted_at IS NULL`,
        [input.email.toLowerCase().trim()]
    );
    if (existingEmail.length) throw new Error("Email is already registered");

    const [existingStudentNo]: any = await pool.execute(
        `SELECT student_id FROM students WHERE student_no = ?`,
        [input.studentNo]
    );
    if (existingStudentNo.length) throw new Error("Student number is already registered");

    const [roleRows]: any = await pool.execute(
        `SELECT role_id FROM roles WHERE role_name = 'student'`
    );
    if (!roleRows.length) throw new Error("Student role not found");
    const roleId = roleRows[0].role_id;

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const [result]: any = await pool.execute(
        `INSERT INTO users (
            role_id, program_id, first_name, last_name,
            email, password_hash, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
            roleId,
            input.programId,
            input.firstName.trim(),
            input.lastName.trim(),
            input.email.toLowerCase().trim(),
            passwordHash,
        ]
    );
    const userId = result.insertId;

    const [studentResult]: any = await pool.execute(
        `INSERT INTO students (
            user_id, student_no, first_name, last_name, middle_name, suffix,
            program_id, year_level, section, school_year, semester,
            is_enrolled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
            userId,
            input.studentNo,
            input.firstName.trim(),
            input.lastName.trim(),
            input.middleName?.trim() ?? null,
            input.suffix?.trim() ?? null,
            input.programId,
            input.yearLevel,
            input.section,
            input.schoolYear,
            input.semester,
        ]
    );

    // Auto-assign all active obligations that match this student
    const studentId = studentResult.insertId;
    const [matchingObs]: any = await pool.execute(
        `SELECT obligation_id, amount
         FROM obligations
         WHERE is_active = 1
           AND school_year = ?
           AND (
               scope = 'all'
               OR (scope = 'department' AND program_id = ?)
               OR (scope = 'year_level' AND year_level = ?
                   AND (program_id IS NULL OR program_id = ?))
               OR (scope = 'section' AND section = ? AND year_level = ?
                   AND (program_id IS NULL OR program_id = ?))
           )`,
        [
            input.schoolYear,
            input.programId,
            input.yearLevel, input.programId,
            input.section, input.yearLevel, input.programId,
        ]
    );
    for (const ob of matchingObs) {
        await pool.execute(
            `INSERT IGNORE INTO student_obligations
                (student_id, obligation_id, amount_due, status, created_at, updated_at)
             VALUES (?, ?, ?, 'unpaid', NOW(), NOW())`,
            [studentId, ob.obligation_id, ob.amount]
        );
        await pool.execute(
            `INSERT INTO notifications
                (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
             VALUES (?, 'New Obligation Assigned', ?, 'obligation_assigned', ?, 'obligation', 0, NOW())`,
            [
                userId,
                `New obligation assigned: ${ob.obligation_name ?? "obligation"}`,
                ob.obligation_id,
            ]
        );
    }

    const payload: JwtAccessPayload = {
        userId,
        email: input.email.toLowerCase().trim(),
        role: "student",
        programId: input.programId,
    };
    const tokens = generateTokens(payload);
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    await pool.execute(
        `UPDATE users SET
            refresh_token = ?,
            refresh_token_expires_at = ?
         WHERE user_id = ?`,
        [tokens.refreshToken, refreshExpiry, userId]
    );

    return {
        user: {
            userId,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            email: input.email.toLowerCase().trim(),
            role: "student",
            programId: input.programId,
            status: "active",
        },
        tokens,
    };
};
