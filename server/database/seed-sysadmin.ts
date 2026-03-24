/**
 * Run once to create/reset the system admin account.
 * Usage:  npx ts-node server/database/seed-sysadmin.ts
 */
import bcrypt from "bcrypt";
import pool from "../src/config/db.js";

const EMAIL    = "sysadmin@eso.edu.ph";
const PASSWORD = "SysAdmin@2026";

async function seed() {
    const hash = await bcrypt.hash(PASSWORD, 10);

    await pool.execute(
        `INSERT INTO users (first_name, last_name, email, password_hash, role_id, status)
         VALUES ('System', 'Admin', ?, ?,
                 (SELECT role_id FROM roles WHERE role_name = 'system_admin'), 'active')
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [EMAIL, hash]
    );

    console.log(`✅  System admin seeded — email: ${EMAIL}  password: ${PASSWORD}`);
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
