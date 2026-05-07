import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { jwtConfig } from "../config/jwt.js";
import { createNotification } from "./notification.service.js";
import { logAction } from "./audit.service.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service.js";
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
    if (!rows.length) throw new Error("No account found with that email address.");
    const user = rows[0];
    if (user.status === "suspended")
        throw new Error("Your account has been suspended. Please contact the administrator.");
    if (user.status === "inactive")
        throw new Error("Your account is inactive. Please contact the administrator.");
    if (!user.email_verified)
        throw new Error("EMAIL_NOT_VERIFIED");
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
        const minutesLeft = Math.ceil(
            (new Date(user.locked_until).getTime() - Date.now()) / 60000
        );
        throw new Error(`Your account is locked. Please try again in ${minutesLeft} minute(s).`);
    }
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
        const attempts = user.failed_login_attempts + 1;
        const remaining = MAX_FAILED_ATTEMPTS - attempts;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES);
            await pool.execute(
                `UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE user_id = ?`,
                [attempts, lockUntil, user.user_id]
            );
            throw new Error(`Incorrect password. Your account has been locked for ${LOCK_DURATION_MINUTES} minutes due to too many failed attempts.`);
        } else {
            await pool.execute(
                `UPDATE users SET failed_login_attempts = ? WHERE user_id = ?`,
                [attempts, user.user_id]
            );
            throw new Error(`Incorrect password. ${remaining} attempt(s) remaining before your account is locked.`);
        }
    }
    const isOfficer = ["class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president"].includes(user.role_name);
    const payload: JwtAccessPayload = {
        userId: user.user_id,
        email: user.email,
        role: user.role_name,
        programId: user.program_id,
        yearLevel: isOfficer ? (user.admin_year_level ?? null) : null,
        section: isOfficer ? (user.admin_section ?? null) : null,
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
    // Log successful login
    logAction({ performedBy: user.user_id, action: "login", ipAddress });

    const authenticatedUser: AuthenticatedUser = {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role_name,
        programId: user.program_id,
        status: user.status,
        yearLevel: isOfficer ? (user.admin_year_level ?? null) : null,
        section: isOfficer ? (user.admin_section ?? null) : null,
    };
    return { user: authenticatedUser, tokens };
};

export const refreshAccessToken = async (
    refreshToken: string
): Promise<{ accessToken: string; user: Record<string, any> }> => {
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
        const isOfficer = ["class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president"].includes(user.role_name);
        const payload: JwtAccessPayload = {
            userId: user.user_id,
            email: user.email,
            role: user.role_name,
            programId: user.program_id,
            yearLevel: isOfficer ? (user.admin_year_level ?? null) : null,
            section: isOfficer ? (user.admin_section ?? null) : null,
        };
        const newAccessToken = jwt.sign(payload, jwtConfig.accessSecret, {
            expiresIn: jwtConfig.accessExpiresIn,
        } as jwt.SignOptions);
        const freshUser = {
            userId:    user.user_id,
            firstName: user.first_name,
            lastName:  user.last_name,
            email:     user.email,
            role:      user.role_name,
            programId: user.program_id ?? null,
            status:    user.status,
            yearLevel: isOfficer ? (user.admin_year_level ?? null) : null,
            section:   isOfficer ? (user.admin_section   ?? null) : null,
        };
        return { accessToken: newAccessToken, user: freshUser };
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

export const deleteOwnAccount = async (
    userId: number,
    password: string
): Promise<void> => {
    const valid = await verifyPassword(userId, password);
    if (!valid) throw new Error("Incorrect password");
    // Scramble the email so the original address is freed for re-registration
    const placeholder = `deleted_${userId}_${Date.now()}@deleted.invalid`;
    await pool.execute(
        `UPDATE users SET deleted_at = NOW(), refresh_token = NULL, email = ? WHERE user_id = ?`,
        [placeholder, userId]
    );
};

export const registerUser = async (
    input: RegisterInput
): Promise<{ email: string }> => {
    const normalEmail = input.email.toLowerCase().trim();

    // If email exists but is unverified, just resend the verification email
    const [existingEmail]: any = await pool.execute(
        `SELECT user_id, email_verified FROM users WHERE email = ? AND deleted_at IS NULL`,
        [normalEmail]
    );
    if (existingEmail.length) {
        if (!existingEmail[0].email_verified) {
            const token    = crypto.randomBytes(32).toString("hex");
            const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await pool.execute(
                `UPDATE users SET verification_token = ?, verification_token_exp = ? WHERE user_id = ?`,
                [token, tokenExp, existingEmail[0].user_id]
            );
            sendVerificationEmail(normalEmail, token).catch(() => {});
            return { email: normalEmail };
        }
        throw new Error("Email is already registered");
    }

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

    const conn = await (pool as any).getConnection();
    try {
        await conn.beginTransaction();

        const [result]: any = await conn.execute(
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

        const [studentResult]: any = await conn.execute(
            `INSERT INTO students (
                user_id, student_no, first_name, last_name, middle_name,
                program_id, year_level, section, school_year, semester,
                is_enrolled, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
                userId,
                input.studentNo,
                input.firstName.trim(),
                input.lastName.trim(),
                input.middleName?.trim() ?? null,
                input.programId,
                input.yearLevel,
                input.section,
                input.schoolYear,
                input.semester,
            ]
        );

        // Auto-assign all active obligations that match this student
        const studentId = studentResult.insertId;
        const [matchingObs]: any = await conn.execute(
            `SELECT obligation_id, amount, obligation_name
             FROM obligations
             WHERE is_active = 1
               AND school_year = ?
               AND (
                   scope = 0
                   OR (scope = 1 AND program_id = ?)
                   OR (scope = 2 AND year_level = ?
                       AND (program_id IS NULL OR program_id = ?))
                   OR (scope = 3 AND section = ? AND year_level = ?
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
            await conn.execute(
                `INSERT IGNORE INTO student_obligations
                    (student_id, obligation_id, amount_due, status, created_at, updated_at)
                 VALUES (?, ?, ?, 0, NOW(), NOW())`,
                [studentId, ob.obligation_id, ob.amount]
            );
            await createNotification(
                conn, userId,
                "New Obligation Assigned",
                `New obligation assigned: ${ob.obligation_name ?? "obligation"}`,
                1, ob.obligation_id, "obligation"
            );
        }

        // Generate email verification token (not auth tokens — user must verify first)
        const verificationToken    = crypto.randomBytes(32).toString("hex");
        const verificationTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await conn.execute(
            `UPDATE users SET verification_token = ?, verification_token_exp = ? WHERE user_id = ?`,
            [verificationToken, verificationTokenExp, userId]
        );

        await conn.commit();

        // Send verification email (non-blocking — don't fail registration if email fails)
        sendVerificationEmail(input.email.toLowerCase().trim(), verificationToken).catch(() => {});

        return { email: input.email.toLowerCase().trim() };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

export const verifyEmailToken = async (token: string): Promise<void> => {
    const [rows]: any = await pool.execute(
        `SELECT user_id, verification_token_exp FROM users
         WHERE verification_token = ? AND email_verified = 0 AND deleted_at IS NULL`,
        [token]
    );
    if (!rows.length) throw new Error("Invalid or already used verification link.");
    if (new Date() > new Date(rows[0].verification_token_exp))
        throw new Error("This verification link has expired. Please request a new one.");
    await pool.execute(
        `UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_exp = NULL WHERE user_id = ?`,
        [rows[0].user_id]
    );
};

export const resendVerificationEmail = async (email: string): Promise<void> => {
    const [rows]: any = await pool.execute(
        `SELECT user_id, email_verified FROM users WHERE email = ? AND deleted_at IS NULL`,
        [email.toLowerCase().trim()]
    );
    // Silent if email not found — prevents email enumeration
    if (!rows.length || rows[0].email_verified) return;
    const token    = crypto.randomBytes(32).toString("hex");
    const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.execute(
        `UPDATE users SET verification_token = ?, verification_token_exp = ? WHERE user_id = ?`,
        [token, tokenExp, rows[0].user_id]
    );
    await sendVerificationEmail(email.toLowerCase().trim(), token);
};

export const requestPasswordReset = async (email: string): Promise<void> => {
    const [rows]: any = await pool.execute(
        `SELECT user_id, email_verified FROM users WHERE email = ? AND deleted_at IS NULL AND status = 'active'`,
        [email.toLowerCase().trim()]
    );
    // Always return silently — do not reveal whether the email exists
    if (!rows.length) return;
    const token    = crypto.randomBytes(32).toString("hex");
    const tokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.execute(
        `UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE user_id = ?`,
        [token, tokenExp, rows[0].user_id]
    );
    await sendPasswordResetEmail(email.toLowerCase().trim(), token);
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const [rows]: any = await pool.execute(
        `SELECT user_id, reset_token_exp FROM users WHERE reset_token = ? AND deleted_at IS NULL`,
        [token]
    );
    if (!rows.length) throw new Error("Invalid or already used reset link.");
    if (new Date() > new Date(rows[0].reset_token_exp))
        throw new Error("This password reset link has expired. Please request a new one.");
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const newHash    = await bcrypt.hash(newPassword, saltRounds);
    await pool.execute(
        `UPDATE users SET
            password_hash = ?,
            password_changed_at = NOW(),
            reset_token = NULL,
            reset_token_exp = NULL,
            refresh_token = NULL,
            refresh_token_expires_at = NULL
         WHERE user_id = ?`,
        [newHash, rows[0].user_id]
    );
};
