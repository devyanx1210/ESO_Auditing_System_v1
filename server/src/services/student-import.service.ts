import bcrypt from "bcrypt";
import pool   from "../config/db.js";
import { sendVerificationEmail } from "./email.service.js";

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

// Check if school_year + semester already imported
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

// In-memory lock to prevent concurrent imports for the same period
const importLocks = new Set<string>();

// Run the import
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
    let imported = 0, skipped = 0, emailsQueued = 0;
    const errors: string[] = [];
    // Collect emails to queue after the transaction commits
    const pendingEmails: Array<{ email: string; studentNo: string }> = [];

    try {
// 1. Fetch student role ID
        const [roleRows]: any = await conn.execute(
            "SELECT role_id FROM roles WHERE role_name = 'student'"
        );
        const roleId = roleRows[0].role_id;

// 2. Bulk-fetch all programs in one query
        const [progRows]: any = await conn.execute(
            "SELECT program_id, LOWER(name) AS lname FROM programs"
        );
        const programMap = new Map<string, number>(
            progRows.map((p: any) => [p.lname, p.program_id])
        );

// 3. Bulk-check existing student numbers
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

// 4. Bulk-check existing emails — distinguish fully-imported vs user-only (missing students record)
        const allEmails = [...new Set(rows.map(r => r.email.toLowerCase().trim()).filter(Boolean))];
        // email → user_id for ACTIVE accounts in users with NO students record (reuse user_id)
        const repairUserIds  = new Map<string, number>();
        // email → user_id for SOFT-DELETED accounts with NO students record (restore + reuse)
        const restoreUserIds = new Map<string, number>();
        // emails that are fully imported (active users + students both exist)
        let fullyImportedEmails = new Set<string>();
        if (allEmails.length) {
            const placeholders = allEmails.map(() => "?").join(",");
            const [exEm]: any = await conn.execute(
                `SELECT u.user_id, u.email, u.deleted_at,
                        EXISTS(SELECT 1 FROM students s WHERE s.user_id = u.user_id) AS has_student
                 FROM users u WHERE u.email IN (${placeholders})`,
                allEmails
            );
            for (const r of exEm) {
                const isDeleted = r.deleted_at !== null;
                if (!r.has_student && isDeleted)  restoreUserIds.set(r.email, r.user_id);
                else if (!r.has_student)           repairUserIds.set(r.email, r.user_id);
                else if (!isDeleted)               fullyImportedEmails.add(r.email);
                // soft-deleted + has_student: treat as fully imported (student record exists)
                else                               fullyImportedEmails.add(r.email);
            }
        }

// 5. Filter to valid rows only
        type ValidRow = ImportRow & {
            programId:    number;
            yearLevel:    number;
            section:      string;
            firstName:    string;
            lastName:     string;
            repairUserId: number | null; // non-null = skip users INSERT, only create students
            needsRestore: boolean;       // true = also un-delete the user account before creating student
        };

        const validRows: ValidRow[] = [];
        // Track repair user_ids and student_nos already claimed in this batch
        const usedRepairUserIds  = new Set<number>();
        const processedStudentNos = new Set<string>();

        for (const row of rows) {
            const ref       = row.studentNo || row.name || "unknown";
            const programId = programMap.get(row.program.trim().toLowerCase()) ?? null;

            if (!programId) {
                errors.push(`${ref}: unknown program "${row.program}". Skipped.`);
                skipped++;
                continue;
            }

            const studentNoKey = row.studentNo.trim();

            // Skip if student_no already in DB
            if (existingStudentNos.has(studentNoKey)) {
                errors.push(`${studentNoKey}: already exists in the database. Skipped.`);
                skipped++;
                continue;
            }

            // Skip if duplicate within the same CSV
            if (processedStudentNos.has(studentNoKey)) {
                errors.push(`${studentNoKey}: duplicate student number in CSV. Only the first occurrence was processed.`);
                skipped++;
                continue;
            }

            const emailKey      = row.email.toLowerCase().trim();
            const repairUserId  = repairUserIds.get(emailKey)  ?? null;
            const restoreUserId = restoreUserIds.get(emailKey) ?? null;
            // Use whichever existing user_id is available (active repair takes priority)
            const existingUserId = repairUserId ?? restoreUserId;
            const { yearLevel, section } = parseYearSection(row.yearSection);
            const { firstName, lastName } = parseName(row.name);

            // Email conflict: already fully imported OR existing slot already claimed by another student
            const emailConflict =
                fullyImportedEmails.has(emailKey) ||
                (existingUserId !== null && usedRepairUserIds.has(existingUserId));

            processedStudentNos.add(studentNoKey);

            if (emailConflict) {
                // Import with a unique placeholder email instead of skipping — admin must update later
                const tempEmail = `temp.${studentNoKey.toLowerCase()}@noemail.import`;
                errors.push(`${ref}: email "${row.email}" is used by another student. Imported with a temporary email that must be updated later.`);
                validRows.push({ ...row, email: tempEmail, programId, yearLevel, section, firstName, lastName, repairUserId: null, needsRestore: false });
            } else {
                if (existingUserId !== null) usedRepairUserIds.add(existingUserId);
                validRows.push({ ...row, programId, yearLevel, section, firstName, lastName, repairUserId: existingUserId, needsRestore: restoreUserId !== null && existingUserId === restoreUserId });
            }
        }

// 5b. Temp-email repair: if a previous partial import already created a users row for a
//     temp email but never created the student record, reuse that user_id instead of
//     trying to INSERT again (which would fail with ER_DUP_ENTRY on email).
        const tempEmailRows = validRows.filter(r => r.email.endsWith("@noemail.import") && r.repairUserId === null);
        if (tempEmailRows.length) {
            const tempEmails   = tempEmailRows.map(r => r.email);
            const tPlaceholders = tempEmails.map(() => "?").join(",");
            const [exTemp]: any = await conn.execute(
                `SELECT u.user_id, u.email, u.deleted_at,
                        EXISTS(SELECT 1 FROM students s WHERE s.user_id = u.user_id) AS has_student
                 FROM users u WHERE u.email IN (${tPlaceholders})`,
                tempEmails
            );
            const tempRepairMap = new Map<string, { userId: number; needsRestore: boolean }>();
            for (const r of exTemp) {
                if (!r.has_student)
                    tempRepairMap.set(r.email, { userId: r.user_id, needsRestore: r.deleted_at !== null });
            }
            for (const row of validRows) {
                const match = tempRepairMap.get(row.email);
                if (match) {
                    row.repairUserId = match.userId;
                    row.needsRestore = match.needsRestore;
                }
            }
        }

// 6. Hash passwords — only needed for rows that require a new users INSERT
        const newUserRows    = validRows.filter(r => r.repairUserId === null);
        const hashes: string[] = new Array(validRows.length).fill("");
        const newUserIndices  = validRows.map((r, i) => r.repairUserId === null ? i : -1).filter(i => i >= 0);

        for (let b = 0; b < newUserRows.length; b += HASH_BATCH) {
            const batch = newUserRows.slice(b, b + HASH_BATCH);
            const batchHashes = await Promise.all(
                batch.map(r => bcrypt.hash(r.studentNo.trim(), SALT_ROUNDS))
            );
            batchHashes.forEach((h, j) => { hashes[newUserIndices[b + j]] = h; });
        }

// 7. Insert in a transaction
        await conn.beginTransaction();
        try {
            for (let i = 0; i < validRows.length; i++) {
                const row = validRows[i];
                try {
                    let userId = row.repairUserId;

                    // Restore soft-deleted account before creating student record
                    if (userId !== null && row.needsRestore) {
                        await conn.execute(
                            `UPDATE users SET deleted_at = NULL, status = 'active', updated_at = NOW() WHERE user_id = ?`,
                            [userId]
                        );
                    }

                    if (userId === null) {
                        // Full insert: new user + student record
                        const [ur]: any = await conn.execute(
                            `INSERT INTO users
                                (first_name, last_name, email, password_hash, role_id, program_id, status, email_verified, created_at, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, 'active', 1, NOW(), NOW())`,
                            [row.firstName, row.lastName,
                             row.email.toLowerCase().trim(), hashes[i],
                             roleId, row.programId]
                        );
                        userId = ur.insertId;
                    }

                    const [sr]: any = await conn.execute(
                        `INSERT INTO students
                            (user_id, student_no, first_name, last_name, program_id,
                             year_level, section, school_year, semester, shirt_size,
                             contact_number, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
                            normalizeShirtSize(row.shirtSize),
                            (row.contact?.trim() || null)?.slice(0, 20) ?? null,
                        ]
                    );

                    const guardianName  = (row.guardian?.trim()          || null)?.slice(0, 100) ?? null;
                    const contactNumber = (row.emergencyContact?.trim()   || null)?.slice(0, 20)  ?? null;
                    const address       = (row.address?.trim()            || null)?.slice(0, 255) ?? null;
                    if (guardianName || contactNumber || address) {
                        await conn.execute(
                            `INSERT INTO guardian (student_id, guardian_name, contact_number, address, created_at, updated_at)
                             VALUES (?, ?, ?, ?, NOW(), NOW())
                             ON DUPLICATE KEY UPDATE
                                 guardian_name  = VALUES(guardian_name),
                                 contact_number = VALUES(contact_number),
                                 address        = VALUES(address),
                                 updated_at     = NOW()`,
                            [sr.insertId, guardianName, contactNumber, address]
                        );
                    }

                    imported++;

                    // Queue a welcome email for real (non-temp) addresses
                    const emailAddr = row.email.toLowerCase().trim();
                    if (!emailAddr.endsWith("@noemail.import")) {
                        pendingEmails.push({ email: emailAddr, studentNo: row.studentNo.trim() });
                    }
                } catch (err: any) {
                    const ref = row.studentNo || row.name;
                    if (err.code === "ER_DUP_ENTRY" && err.message.includes("user_id"))
                        errors.push(`${ref}: shares the same email with another student. Only one account can exist per email.`);
                    else
                        errors.push(`${ref}: ${err.message}`);
                }
            }

            // Record the session inside the same transaction
            await conn.execute(
                `INSERT INTO student_imports
                    (school_year, semester, imported_by, record_count, skipped_count, error_count, errors_detail)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [ctx.schoolYear.trim(), ctx.semester, ctx.importedBy, imported, skipped, errors.length,
                 errors.length ? JSON.stringify(errors) : null]
            );

            await conn.commit();

            // Queue welcome emails after the transaction commits so we don't
            // send emails for rows that were rolled back.
            // sendVerificationEmail() is now fire-and-forget via the rate-limited queue.
            for (const { email, studentNo } of pendingEmails) {
                sendVerificationEmail(email, studentNo);
                emailsQueued++;
            }
            console.log(
                `[student-import] Import complete — ` +
                `imported: ${imported}, skipped: ${skipped}, ` +
                `emails queued: ${emailsQueued}, errors: ${errors.length}`
            );
        } catch (e) {
            await conn.rollback();
            throw e;
        }

        return { imported, skipped, errors };
    } finally {
        conn.release();
    }
}

// Delete a session record (unlocks that period for re-import)
export const deleteImportSession = async (importId: number): Promise<void> => {
    const [result]: any = await pool.execute(
        "DELETE FROM student_imports WHERE import_id = ?",
        [importId]
    );
    if (result.affectedRows === 0) throw new Error("Import session not found");
};

// History
export const getImportSessions = async () => {
    const [rows]: any = await pool.execute(
        `SELECT si.import_id, si.school_year, si.semester,
                si.record_count, si.skipped_count, si.error_count, si.imported_at,
                si.errors_detail,
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
        errors:       r.errors_detail ? JSON.parse(r.errors_detail) : [],
    }));
};
