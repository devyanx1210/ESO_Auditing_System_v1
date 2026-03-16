/**
 * One-time script to create the System Admin account.
 * Run with:  npx tsx src/scripts/create-admin.ts
 */

import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import pool from "../config/db.js";

// ── CHANGE THESE BEFORE RUNNING ──────────────────────────────
const ADMIN_FIRST_NAME = "System";
const ADMIN_LAST_NAME  = "Admin";
const ADMIN_EMAIL      = "admin@eso.edu.ph";
const ADMIN_PASSWORD   = "Admin@1234";       // change this!
const ADMIN_POSITION   = "System Administrator";
// ─────────────────────────────────────────────────────────────

async function createAdmin() {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    // Get system_admin role_id
    const [roleRows]: any = await pool.execute(
        `SELECT role_id FROM roles WHERE role_name = 'system_admin'`
    );
    if (!roleRows.length) {
        console.error("system_admin role not found. Did you run schema.sql?");
        process.exit(1);
    }
    const roleId = roleRows[0].role_id;

    // Upsert user (insert or update if email already exists)
    const [existing]: any = await pool.execute(
        `SELECT user_id FROM users WHERE email = ?`,
        [ADMIN_EMAIL]
    );

    let userId: number;

    if (existing.length) {
        userId = existing[0].user_id;
        await pool.execute(
            `UPDATE users SET
                first_name    = ?,
                last_name     = ?,
                password_hash = ?,
                role_id       = ?,
                status        = 'active',
                updated_at    = NOW()
             WHERE user_id = ?`,
            [ADMIN_FIRST_NAME, ADMIN_LAST_NAME, passwordHash, roleId, userId]
        );
        console.log(`✔ Updated existing user (user_id=${userId})`);
    } else {
        const [result]: any = await pool.execute(
            `INSERT INTO users
                (first_name, last_name, email, password_hash, role_id, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
            [ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL, passwordHash, roleId]
        );
        userId = result.insertId;
        console.log(`✔ Created new user (user_id=${userId})`);
    }

    // Upsert admins record
    const [existingAdmin]: any = await pool.execute(
        `SELECT admin_id FROM admins WHERE user_id = ?`,
        [userId]
    );

    if (existingAdmin.length) {
        await pool.execute(
            `UPDATE admins SET position = ?, updated_at = NOW() WHERE user_id = ?`,
            [ADMIN_POSITION, userId]
        );
        console.log(`✔ Updated admins record`);
    } else {
        await pool.execute(
            `INSERT INTO admins (user_id, position, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())`,
            [userId, ADMIN_POSITION]
        );
        console.log(`✔ Created admins record`);
    }

    console.log("\n─────────────────────────────────");
    console.log("  System Admin created/updated");
    console.log(`  Email   : ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("  ⚠ Change the password after first login!");
    console.log("─────────────────────────────────\n");

    await pool.end();
}

createAdmin().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
});
