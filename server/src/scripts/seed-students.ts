/**
 * One-time seeder: adds test students to CpE program.
 * Run with: npx tsx src/scripts/seed-students.ts
 *
 * CpE Year 1 — 5 students
 * CpE Year 2 — 10 students
 * CpE Year 3 — 5 students
 * CpE Year 4 — 3 students
 *
 * Default password for all: Student@123
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

const OUT_FILE = "seed-output.txt";
const log = (...args: any[]) => {
    const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    process.stderr.write(msg + "\n");
    fs.appendFileSync(OUT_FILE, msg + "\n");
};

const DEFAULT_PASSWORD = "Student@123";
const SCHOOL_YEAR      = "2025-2026";
const SEMESTER         = 2;
const SECTION          = "A";

const BATCHES = [
    { year: 1, count: 5  },
    { year: 2, count: 10 },
    { year: 3, count: 5  },
    { year: 4, count: 3  },
];

const FIRST_NAMES = [
    "Juan", "Maria", "Jose", "Ana", "Carlos",
    "Liza", "Miguel", "Rosa", "Pedro", "Clara",
    "Ramon", "Luz", "Eduardo", "Teresa", "Ricardo",
    "Elena", "Marco", "Sofia", "Diego", "Isabel",
    "Felix", "Carla", "Bernard", "Mia",
];
const LAST_NAMES = [
    "Santos", "Reyes", "Cruz", "Garcia", "Torres",
    "Lopez", "Flores", "Rivera", "Gomez", "Martinez",
    "Ramos", "Diaz", "Mendoza", "Aquino", "Bautista",
    "Dela Cruz", "Villanueva", "Santiago", "Aguilar", "Navarro",
    "Castillo", "Morales", "Hernandez", "Jimenez",
];

fs.writeFileSync(OUT_FILE, `=== Seed run: ${new Date().toISOString()} ===\n`);

async function seed() {
    log("Connecting to DB...");
    const conn = await (pool as any).getConnection();
    log("Connected.");

    try {
        const [programs]: any = await conn.execute(
            `SELECT program_id FROM programs WHERE code = 'CpE' LIMIT 1`
        );
        if (!programs.length) { log("ERROR: CpE program not found."); process.exit(1); }
        const programId = programs[0].program_id;
        log(`Found CpE: program_id = ${programId}`);

        const [roles]: any = await conn.execute(
            `SELECT role_id FROM roles WHERE role_name = 'student' LIMIT 1`
        );
        if (!roles.length) { log("ERROR: student role not found."); process.exit(1); }
        const roleId = roles[0].role_id;
        log(`Found student role: role_id = ${roleId}`);

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);
        log(`Password hashed with ${saltRounds} rounds.`);

        let globalIndex = 1;
        let totalInserted = 0;

        for (const batch of BATCHES) {
            log(`\nSeeding Year ${batch.year} (${batch.count} students)...`);

            for (let i = 0; i < batch.count; i++) {
                const firstName = FIRST_NAMES[(globalIndex - 1) % FIRST_NAMES.length];
                const lastName  = LAST_NAMES[(globalIndex - 1)  % LAST_NAMES.length];
                const email     = `student.cpe${batch.year}.${String(globalIndex).padStart(3, "0")}@eso.test`;
                const studentNo = `26T${String(2000 + globalIndex)}`; // 7-char format e.g. 26T2001

                await conn.beginTransaction();
                try {
                    const [existing]: any = await conn.execute(
                        `SELECT user_id FROM users WHERE email = ?`, [email]
                    );
                    if (existing.length) {
                        log(`  SKIP (exists): ${email}`);
                        await conn.rollback();
                        globalIndex++;
                        continue;
                    }

                    const [userResult]: any = await conn.execute(
                        `INSERT INTO users (role_id, program_id, first_name, last_name, email, password_hash, status, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
                        [roleId, programId, firstName, lastName, email, passwordHash]
                    );
                    const userId = userResult.insertId;

                    await conn.execute(
                        `INSERT INTO students (user_id, student_no, first_name, last_name, program_id, year_level, section, school_year, semester, is_enrolled, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
                        [userId, studentNo, firstName, lastName, programId, batch.year, SECTION, SCHOOL_YEAR, SEMESTER]
                    );

                    await conn.commit();
                    log(`  OK: ${studentNo} - ${firstName} ${lastName} (${email})`);
                    totalInserted++;
                } catch (err: any) {
                    await conn.rollback();
                    log(`  FAIL: ${email} — ${err.message}`);
                }

                globalIndex++;
            }
        }

        log(`\nDone! ${totalInserted} student(s) inserted.`);
        log(`Login password for all: ${DEFAULT_PASSWORD}`);
    } finally {
        conn.release();
        process.exit(0);
    }
}

seed().catch(err => {
    log("Seeder fatal error:", err.message);
    process.exit(1);
});
