import bcrypt from "bcrypt";
import pool   from "../config/db.js";

export interface ImportRow {
    name:             string;   // "Bunyi, Mariel Andrea L."
    studentNo:        string;   // "25B0631"
    program:          string;   // "Civil Engineering"
    yearSection:      string;   // "1A"
    address:          string | null;
    contact:          string | null;
    email:            string;
    guardian:         string | null;
    emergencyContact: string | null;
    shirtSize:        string | null;
}

export interface ImportContext {
    schoolYear:  string;              // "2025-2026"
    semester:    number;              // 1=1st, 2=2nd, 3=Summer
    importedBy:  number;
}

export interface ImportResult {
    imported: number;
    skipped:  number;
    errors:   string[];
}

// "Bunyi, Mariel Andrea L." → { firstName: "Mariel Andrea L.", lastName: "Bunyi" }
// "JUAN DELA CRUZ"          → { firstName: "Juan", lastName: "Dela Cruz" }
function parseName(raw: string): { firstName: string; lastName: string } {
    const proper = (s: string) =>
        s.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    if (raw.includes(",")) {
        const idx   = raw.indexOf(",");
        const last  = raw.slice(0, idx).trim();
        const first = raw.slice(idx + 1).trim();
        return { firstName: proper(first), lastName: proper(last) };
    }
    const parts = raw.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: proper(parts[0]), lastName: "" };
    return { firstName: proper(parts[0]), lastName: proper(parts.slice(1).join(" ")) };
}

// "1A" → { yearLevel: 1, section: "A" }   "2B" → { yearLevel: 2, section: "B" }
function parseYearSection(ys: string): { yearLevel: number; section: string } {
    const m = ys.trim().match(/^(\d+)\s*(.*)$/);
    if (!m) return { yearLevel: 1, section: ys.trim() };
    return { yearLevel: parseInt(m[1], 10), section: m[2].trim() || ys.trim() };
}

function normalizeShirtSize(raw: string | null): string | null {
    if (!raw) return null;
    const v = raw.trim().toUpperCase();
    return ["XS","S","M","L","XL","XXL"].includes(v) ? v : null;
}

// ── Check if school_year + semester already imported ─────────────────────────
export const checkImportExists = async (
    schoolYear: string,
    semester:   number
): Promise<{ exists: boolean; importedAt: string | null; recordCount: number }> => {
    const [rows]: any = await pool.execute(
        `SELECT imported_at, record_count
         FROM student_imports
         WHERE school_year = ? AND semester = ?
         ORDER BY imported_at DESC LIMIT 1`,
        [schoolYear.trim(), semester]
    );
    if (!rows.length) return { exists: false, importedAt: null, recordCount: 0 };
    return { exists: true, importedAt: rows[0].imported_at, recordCount: rows[0].record_count };
};

// ── In-memory lock to prevent concurrent imports for the same period ──────────
const importLocks = new Set<string>();

// ── Run the import ────────────────────────────────────────────────────────────
export const importStudents = async (
    rows:    ImportRow[],
    ctx:     ImportContext
): Promise<ImportResult> => {
    const lockKey = `${ctx.schoolYear}__${ctx.semester}`;

    // Concurrency guard
    if (importLocks.has(lockKey)) {
        throw new Error("An import for this period is already in progress. Please wait.");
    }
    importLocks.add(lockKey);

    try {
        return await _runImport(rows, ctx);
    } finally {
        importLocks.delete(lockKey);
    }
};

async function _runImport(rows: ImportRow[], ctx: ImportContext): Promise<ImportResult> {
    // Use rounds=8 for bulk import — still secure, ~4× faster than 10
    const SALT_ROUNDS   = 8;
    // Number of bcrypt hashes to compute in parallel
    const HASH_BATCH    = 20;

    const conn = await pool.getConnection();
    let imported = 0, skipped = 0;
    const errors: string[] = [];

    try {
        // ── 1. Fetch student role ID ──────────────────────────────────────────
        const [roleRows]: any = await conn.execute(
            "SELECT role_id FROM roles WHERE role_name = 'student'"
        );
        const roleId = roleRows[0].role_id;

        // ── 2. Bulk-fetch all programs in one query ───────────────────────────
        const [progRows]: any = await conn.execute(
            "SELECT program_id, LOWER(name) AS lname FROM programs"
        );
        const programMap = new Map<string, number>(
            progRows.map((p: any) => [p.lname, p.program_id])
        );

        // ── 3. Bulk-check existing student numbers ────────────────────────────
        const allStudentNos = [...new Set(rows.map(r => r.studentNo.trim()).filter(Boolean))];
        let existingStudentNos = new Set<string>();
        if (allStudentNos.length) {
            const placeholders = allStudentNos.map(() => "?").join(",");
            const [exSt]: any = await conn.execute(
                `SELECT student_no FROM students WHERE student_no IN (${placeholders})`,
                allStudentNos
            );
            existingStudentNos = new Set(exSt.map((r: any) => r.student_no));
        }

        // ── 4. Bulk-check existing emails ─────────────────────────────────────
        const allEmails = [...new Set(rows.map(r => r.email.toLowerCase().trim()).filter(Boolean))];
        let existingEmails = new Set<string>();
        if (allEmails.length) {
            const placeholders = allEmails.map(() => "?").join(",");
            const [exEm]: any = await conn.execute(
                `SELECT email FROM users WHERE email IN (${placeholders})`,
                allEmails
            );
            existingEmails = new Set(exEm.map((r: any) => r.email));
        }

        // ── 5. Filter to valid rows only ──────────────────────────────────────
        type ValidRow = ImportRow & {
            programId: number;
            yearLevel: number;
            section:   string;
            firstName: string;
            lastName:  string;
        };

        const validRows: ValidRow[] = [];

        for (const row of rows) {
            const ref       = row.studentNo || row.name || "unknown";
            const programId = programMap.get(row.program.trim().toLowerCase()) ?? null;

            if (!programId) {
                errors.push(`${ref}: unknown program "${row.program}" — skipped`);
                skipped++;
                continue;
            }
            if (existingStudentNos.has(row.studentNo.trim())) {
                skipped++;
                continue;
            }
            const emailKey = row.email.toLowerCase().trim();
            if (existingEmails.has(emailKey)) {
                errors.push(`${ref}: email "${row.email}" already registered — skipped`);
                skipped++;
                continue;
            }

            const { yearLevel, section } = parseYearSection(row.yearSection);
            const { firstName, lastName } = parseName(row.name);

            validRows.push({ ...row, programId, yearLevel, section, firstName, lastName });
        }

        // ── 6. Hash passwords in parallel batches ─────────────────────────────
        const hashes: string[] = new Array(validRows.length);
        for (let i = 0; i < validRows.length; i += HASH_BATCH) {
            const batch = validRows.slice(i, i + HASH_BATCH);
            const batchHashes = await Promise.all(
                batch.map(r => bcrypt.hash(r.studentNo.trim(), SALT_ROUNDS))
            );
            batchHashes.forEach((h, j) => { hashes[i + j] = h; });
        }

        // ── 7. Insert in a transaction ────────────────────────────────────────
        await conn.beginTransaction();
        try {
            for (let i = 0; i < validRows.length; i++) {
                const row = validRows[i];
                try {
                    const [ur]: any = await conn.execute(
                        `INSERT INTO users
                            (first_name, last_name, email, password_hash, role_id, program_id, status, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
                        [row.firstName, row.lastName,
                         row.email.toLowerCase().trim(), hashes[i],
                         roleId, row.programId]
                    );
                    const userId = ur.insertId;

                    await conn.execute(
                        `INSERT INTO students
                            (user_id, student_no, first_name, last_name, program_id,
                             year_level, section, school_year, semester,
                             address, contact_number, guardian_name, emergency_contact, shirt_size,
                             created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                        [
                            userId,
                            row.studentNo.trim(),
                            row.firstName,
                            row.lastName,
                            row.programId,
                            row.yearLevel,
                            row.section,
                            ctx.schoolYear.trim(),
                            ctx.semester,
                            row.address?.trim()          || null,
                            row.contact?.trim()          || null,
                            row.guardian?.trim()         || null,
                            row.emergencyContact?.trim() || null,
                            normalizeShirtSize(row.shirtSize),
                        ]
                    );
                    imported++;
                } catch (err: any) {
                    errors.push(`${row.studentNo || row.name}: ${err.message}`);
                }
            }

            // Record the session inside the same transaction
            await conn.execute(
                `INSERT INTO student_imports
                    (school_year, semester, imported_by, record_count, skipped_count, error_count)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [ctx.schoolYear.trim(), ctx.semester, ctx.importedBy, imported, skipped, errors.length]
            );

            await conn.commit();
        } catch (e) {
            await conn.rollback();
            throw e;
        }

        return { imported, skipped, errors };
    } finally {
        conn.release();
    }
}

// ── Delete a session record (unlocks that period for re-import) ───────────────
export const deleteImportSession = async (importId: number): Promise<void> => {
    const [result]: any = await pool.execute(
        "DELETE FROM student_imports WHERE import_id = ?",
        [importId]
    );
    if (result.affectedRows === 0) throw new Error("Import session not found");
};

// ── History ───────────────────────────────────────────────────────────────────
export const getImportSessions = async () => {
    const [rows]: any = await pool.execute(
        `SELECT si.import_id, si.school_year, si.semester,
                si.record_count, si.skipped_count, si.error_count, si.imported_at,
                CONCAT(u.first_name,' ',u.last_name) AS importedBy
         FROM student_imports si
         JOIN users u ON u.user_id = si.imported_by
         ORDER BY si.imported_at DESC`
    );
    return rows.map((r: any) => ({
        importId:     r.import_id,
        schoolYear:   r.school_year,
        semester:     r.semester,
        recordCount:  r.record_count,
        skippedCount: r.skipped_count,
        errorCount:   r.error_count,
        importedAt:   r.imported_at,
        importedBy:   r.importedBy,
    }));
};
