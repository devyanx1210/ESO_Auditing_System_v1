import pool from "../config/db.js";
import { isClassRole, isProgramRole } from "../config/role-groups.js";

async function getAdminClearanceStep(userId: number): Promise<{
    adminId: number;
    roleId: number;
    roleName: string;
    clearanceStep: number | null;
    programId: number | null;
    yearLevel: number | null;
    section: string | null;
}> {
    const [rows]: any = await pool.execute(
        `SELECT a.admin_id, u.program_id, a.year_level, a.section, r.role_id, r.role_name, r.clearance_step
         FROM users u
         JOIN roles r        ON r.role_id = u.role_id
         LEFT JOIN admins a  ON a.user_id = u.user_id
         WHERE u.user_id = ?`,
        [userId]
    );
    if (!rows.length) throw new Error("Admin not found");
    return {
        adminId:       rows[0].admin_id,
        roleId:        rows[0].role_id,
        roleName:      rows[0].role_name,
        clearanceStep: rows[0].clearance_step ?? null,
        programId:     rows[0].program_id ?? null,
        yearLevel:     rows[0].year_level  ?? null,
        section:       rows[0].section     ?? null,
    };
}

const ALL_DEPT_ROLES = ["system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "signatory", "osas_coordinator", "program_head", "dean"];

export interface PendingClearanceItem {
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    programCode: string;
    programName: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: number;
    clearanceId: number | null;
    clearanceStatus: number | null;
    currentStep: number | null;
    obligationsTotal: number;
    obligationsPaid: number;
    avatarPath: string | null;
    isPrinted: boolean;
    printedAt: string | null;
}

// Shared SELECT columns for clearance queries
// Use MIN() on clearance columns to satisfy ONLY_FULL_GROUP_BY (there is at most
// one clearance row per student/school_year/semester due to the unique key).
const CLEARANCE_SELECT = `
    SELECT
        s.student_id    AS studentId,
        s.student_no    AS studentNo,
        s.first_name    AS firstName,
        s.last_name     AS lastName,
        d.code          AS programCode,
        d.name          AS programName,
        s.year_level    AS yearLevel,
        s.section,
        s.school_year   AS schoolYear,
        s.semester,
        MIN(cl.clearance_id)     AS clearanceId,
        MIN(cl.clearance_status) AS clearanceStatus,
        MIN(cl.current_step)     AS currentStep,
        COUNT(so.student_obligation_id)          AS obligationsTotal,
        COALESCE(SUM(so.status IN (2,3)), 0)     AS obligationsPaid,
        s.avatar_path                            AS avatarPath,
        COALESCE(MIN(cl.is_printed), 0)          AS isPrinted,
        MIN(cl.printed_at)                       AS printedAt
    FROM students s
    JOIN users u       ON u.user_id       = s.user_id
    JOIN programs d ON d.program_id = s.program_id
    LEFT JOIN student_obligations so ON so.student_id = s.student_id
`;

export const getPendingClearance = async (
    userId: number,
    role: string,
): Promise<PendingClearanceItem[]> => {
    const { clearanceStep, programId, yearLevel, section } = await getAdminClearanceStep(userId);

    let sql: string;
    const params: any[] = [];

    if (!clearanceStep) {
        // system_admin: overview of all students with obligations done, clearance not yet started
        sql = CLEARANCE_SELECT + `
            LEFT JOIN clearances cl
                ON cl.student_id = s.student_id
                AND cl.school_year = s.school_year
                AND cl.semester   = s.semester
            WHERE u.status = 'active'
              AND (cl.clearance_id IS NULL OR cl.current_step = 1)
              AND (cl.clearance_status IS NULL OR cl.clearance_status != 2)
            GROUP BY s.student_id
            HAVING (obligationsTotal > 0 AND obligationsTotal = obligationsPaid)
            ORDER BY s.last_name, s.first_name
        `;
    } else if (clearanceStep === 1) {
        // Class Officer (step 1): students in their specific year/section with all obligations done
        sql = CLEARANCE_SELECT + `
            LEFT JOIN clearances cl
                ON cl.student_id = s.student_id
                AND cl.school_year = s.school_year
                AND cl.semester   = s.semester
            WHERE u.status = 'active'
              AND (cl.clearance_id IS NULL OR cl.current_step = 1)
              AND (cl.clearance_status IS NULL OR cl.clearance_status != 2)
        `;
        if (programId)  { sql += " AND s.program_id = ?"; params.push(programId); }
        if (yearLevel)  { sql += " AND s.year_level = ?"; params.push(yearLevel); }
        if (section)    { sql += " AND s.section = ?";    params.push(section); }
        sql += `
            GROUP BY s.student_id
            HAVING (obligationsTotal > 0 AND obligationsTotal = obligationsPaid)
            ORDER BY s.last_name, s.first_name
        `;
    } else if (clearanceStep === 2) {
        // Program Officer (step 2): students in their dept at step 2
        sql = CLEARANCE_SELECT + `
            JOIN clearances cl
                ON cl.student_id = s.student_id
                AND cl.school_year = s.school_year
                AND cl.semester   = s.semester
            WHERE u.status = 'active'
              AND cl.current_step = 2
              AND cl.clearance_status = 1
        `;
        if (programId) { sql += " AND s.program_id = ?"; params.push(programId); }
        sql += " GROUP BY s.student_id ORDER BY s.last_name, s.first_name";
    } else {
        // ESO Officer (3), Signatory (4), Program Head (5), Dean (6): all students at this step
        sql = CLEARANCE_SELECT + `
            JOIN clearances cl
                ON cl.student_id = s.student_id
                AND cl.school_year = s.school_year
                AND cl.semester   = s.semester
            WHERE u.status = 'active'
              AND cl.current_step = ?
              AND cl.clearance_status = 1
            GROUP BY s.student_id
            ORDER BY s.last_name, s.first_name
        `;
        params.push(clearanceStep);
    }

    const [rows]: any = await pool.execute(sql, params);
    return rows.map((r: any) => ({
        ...r,
        obligationsTotal: Number(r.obligationsTotal),
        obligationsPaid:  Number(r.obligationsPaid),
        isPrinted:        Boolean(r.isPrinted),
        printedAt:        r.printedAt ?? null,
    }));
};

// ─── Sign clearance for a single student ─────────────────────────────────────

export const signClearance = async (
    userId: number,
    studentId: number,
    remarks: string | null
): Promise<void> => {
    const { adminId, roleId, roleName, clearanceStep, programId: adminProgramId, yearLevel: adminYearLevel, section: adminSection } = await getAdminClearanceStep(userId);
    if (!clearanceStep) throw new Error("Your role does not participate in clearance");

    // Get student school_year, semester, and scope fields
    const [stRows]: any = await pool.execute(
        "SELECT school_year, semester, user_id, program_id, year_level, section FROM students WHERE student_id = ?",
        [studentId]
    );
    if (!stRows.length) throw new Error("Student not found");
    const { school_year, semester, user_id: studentUserId, program_id: studentProgramId, year_level: studentYearLevel, section: studentSection } = stRows[0];

    // Validate scope: class roles can only sign for their own year/section
    if (isClassRole(roleName)) {
        if (adminProgramId && adminProgramId !== studentProgramId)
            throw new Error("You can only sign clearances for students in your program");
        if (adminYearLevel != null && adminYearLevel !== studentYearLevel)
            throw new Error("You can only sign clearances for students in your year level");
        if (adminSection && adminSection !== studentSection)
            throw new Error("You can only sign clearances for students in your section");
    }
    // Program roles can only sign for their own program
    if (isProgramRole(roleName) || roleName === "program_head") {
        if (adminProgramId && adminProgramId !== studentProgramId)
            throw new Error("You can only sign clearances for students in your program");
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Find or create clearance record
        let clearanceId: number;
        const [clRows]: any = await conn.execute(
            "SELECT clearance_id, current_step, clearance_status FROM clearances WHERE student_id = ? AND school_year = ? AND semester = ?",
            [studentId, school_year, semester]
        );

        if (!clRows.length) {
            if (clearanceStep !== 1) throw new Error("Clearance has not been started for this student");
            const [ins]: any = await conn.execute(
                "INSERT INTO clearances (student_id, school_year, semester, clearance_status, current_step, created_at, updated_at) VALUES (?, ?, ?, 1, 1, NOW(), NOW())",
                [studentId, school_year, semester]
            );
            clearanceId = ins.insertId;
        } else {
            const cl = clRows[0];
            if (cl.current_step !== clearanceStep) {
                throw new Error(`Clearance is at step ${cl.current_step}, not your step (${clearanceStep})`);
            }
            if (cl.clearance_status === 2) throw new Error("Clearance already completed");
            clearanceId = cl.clearance_id;
        }

        // Guard: prevent the same admin from signing twice at this step
        const [alreadySigned]: any = await conn.execute(
            `SELECT 1 FROM clearance_verifications
             WHERE clearance_id = ? AND admin_id = ? AND step_order = ? AND status = 1 LIMIT 1`,
            [clearanceId, adminId, clearanceStep]
        );
        if (alreadySigned.length > 0) throw new Error("You have already signed this clearance");

        // Insert this admin's verification record
        await conn.execute(
            `INSERT INTO clearance_verifications
                (clearance_id, admin_id, role_id, step_order, status, remarks, verified_at, created_at)
             VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())`,
            [clearanceId, adminId, roleId, clearanceStep, remarks ?? null]
        );

        // Count required approvers at this step, scoped by student's program/year/section
        // Class roles: only count officers assigned to THIS student's section
        // Program roles: only count officers assigned to THIS student's program
        // ESO/signatory/others: count all at this step
        let totalSql = `
            SELECT COUNT(*) AS total
            FROM admins a
            JOIN users u ON u.user_id = a.user_id
            JOIN roles r ON r.role_id = u.role_id
            WHERE r.clearance_step = ? AND u.status = 'active' AND u.deleted_at IS NULL AND a.deleted_at IS NULL
        `;
        const totalParams: any[] = [clearanceStep];

        if (isClassRole(roleName)) {
            totalSql += " AND u.program_id = ? AND a.year_level = ? AND a.section = ?";
            totalParams.push(studentProgramId, studentYearLevel, studentSection);
        } else if (isProgramRole(roleName) || roleName === "program_head") {
            totalSql += " AND u.program_id = ?";
            totalParams.push(studentProgramId);
        }

        const [totalRows]: any = await conn.execute(totalSql, totalParams);
        const totalAtStep = Number(totalRows[0].total);

        const [signedRows]: any = await conn.execute(
            `SELECT COUNT(DISTINCT cv.admin_id) AS signed
             FROM clearance_verifications cv
             WHERE cv.clearance_id = ? AND cv.step_order = ? AND cv.status = 1`,
            [clearanceId, clearanceStep]
        );
        const signedAtStep = Number(signedRows[0].signed);

        if (signedAtStep < totalAtStep) {
            // Still waiting for other approvers at this step — stay at current step, notify student of partial progress
            await conn.execute(
                `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
                 VALUES (?, 'Clearance Update', ?, 6, ?, 'clearance', 0, NOW())`,
                [studentUserId,
                 `An approver has signed your clearance (${signedAtStep}/${totalAtStep} at step ${clearanceStep}). Waiting for remaining approvals.`,
                 clearanceId]
            );
            await conn.commit();
            return;
        }

        // All admins at this step have signed — advance to next step
        let targetStep = clearanceStep + 1;
        let finalStatus: number = 1;

        // Get the maximum configured clearance step dynamically
        const [maxRows]: any = await conn.execute(
            `SELECT COALESCE(MAX(clearance_step), 1) AS maxStep FROM roles WHERE clearance_step IS NOT NULL`
        );
        const maxStep = Number(maxRows[0].maxStep);

        while (targetStep <= maxStep) {
            const [stepAdmins]: any = await conn.execute(
                `SELECT 1 FROM admins a
                 JOIN users u ON u.user_id = a.user_id
                 JOIN roles r ON r.role_id = u.role_id
                 WHERE r.clearance_step = ? AND u.status = 'active' AND u.deleted_at IS NULL
                 LIMIT 1`,
                [targetStep]
            );
            if (stepAdmins.length > 0) break;
            targetStep++;
        }
        if (targetStep > maxStep) {
            finalStatus = 2;
            targetStep = clearanceStep;
        }

        await conn.execute(
            `UPDATE clearances
             SET current_step = ?, clearance_status = ?, updated_at = NOW()
             WHERE clearance_id = ?`,
            [targetStep, finalStatus, clearanceId]
        );

        // Notify student of full step completion
        const message = finalStatus === 2
            ? "Your clearance has been fully approved!"
            : `Your clearance has been approved at step ${clearanceStep}. Proceeding to next step.`;
        await conn.execute(
            `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
             VALUES (?, 'Clearance Update', ?, 6, ?, 'clearance', 0, NOW())`,
            [studentUserId, message, clearanceId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── Clearance history (what this admin has already signed) ──────────────────

export interface ClearanceHistoryItem {
    clearanceId: number;
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    programCode: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: number;
    clearanceStatus: number;
    signedAt: string;
    remarks: string | null;
    avatarPath: string | null;
    isPrinted: boolean;
    printedAt: string | null;
}

export const getClearanceHistory = async (
    userId: number,
    role: string
): Promise<ClearanceHistoryItem[]> => {
    const { adminId, clearanceStep, programId } = await getAdminClearanceStep(userId);
    if (!clearanceStep) return [];

    let sql = `
        SELECT
            cl.clearance_id     AS clearanceId,
            s.student_id        AS studentId,
            s.student_no        AS studentNo,
            s.first_name        AS firstName,
            s.last_name         AS lastName,
            d.code              AS programCode,
            s.year_level        AS yearLevel,
            s.section,
            s.school_year       AS schoolYear,
            s.semester,
            cl.clearance_status          AS clearanceStatus,
            cv.verified_at               AS signedAt,
            cv.remarks,
            s.avatar_path                AS avatarPath,
            COALESCE(cl.is_printed, 0)   AS isPrinted,
            cl.printed_at                AS printedAt
        FROM clearance_verifications cv
        JOIN clearances cl  ON cl.clearance_id  = cv.clearance_id
        JOIN students s     ON s.student_id      = cl.student_id
        JOIN programs d  ON d.program_id   = s.program_id
        WHERE cv.admin_id = ? AND cv.status = 1
    `;
    const params: any[] = [adminId];

    if (!ALL_DEPT_ROLES.includes(role) && programId) {
        sql += " AND s.program_id = ?";
        params.push(programId);
    }

    sql += " ORDER BY cv.verified_at DESC LIMIT 200";
    const [rows]: any = await pool.execute(sql, params);
    return rows;
};

// ─── Unapprove clearances (set back to pending) ───────────────────────────────

export const unapproveHistoryClearances = async (clearanceIds: number[]): Promise<number> => {
    if (!clearanceIds.length) return 0;
    const placeholders = clearanceIds.map(() => "?").join(",");

    // Fetch student user IDs before resetting, to notify them
    const [affected]: any = await pool.execute(
        `SELECT cl.clearance_id, s.user_id AS studentUserId
         FROM clearances cl
         JOIN students s ON s.student_id = cl.student_id
         WHERE cl.clearance_id IN (${placeholders})`,
        clearanceIds
    );

    const [result]: any = await pool.execute(
        `UPDATE clearances SET clearance_status = 1, current_step = 1, updated_at = NOW() WHERE clearance_id IN (${placeholders})`,
        clearanceIds
    );

    for (const row of affected) {
        await pool.execute(
            `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
             VALUES (?, 'Clearance Returned', 'Your clearance approval has been returned and needs to restart the process.', 8, ?, 'clearance', 0, NOW())`,
            [row.studentUserId, row.clearance_id]
        );
    }

    return result.affectedRows;
};

// ─── Delete clearance records ─────────────────────────────────────────────────

export const deleteHistoryClearances = async (clearanceIds: number[]): Promise<number> => {
    if (!clearanceIds.length) return 0;
    const placeholders = clearanceIds.map(() => "?").join(",");
    const [result]: any = await pool.execute(
        `DELETE FROM clearances WHERE clearance_id IN (${placeholders})`,
        clearanceIds
    );
    return result.affectedRows;
};

// ─── Sign all eligible students ───────────────────────────────────────────────

export const signAllClearance = async (userId: number, role: string): Promise<number> => {
    const eligible = await getPendingClearance(userId, role);
    if (!eligible.length) return 0;

    const { clearanceStep } = await getAdminClearanceStep(userId);
    if (!clearanceStep) return 0;

    let count = 0;
    for (const student of eligible) {
        try {
            await signClearance(userId, student.studentId, null);
            count++;
        } catch { /* skip individual errors, including already-signed */ }
    }
    return count;
};

// ─── Mark clearances as printed ───────────────────────────────────────────────

export const markClearancePrinted = async (
    clearanceIds: number[],
    adminId: number
): Promise<number> => {
    if (!clearanceIds.length) return 0;
    const placeholders = clearanceIds.map(() => "?").join(",");
    const [result]: any = await pool.execute(
        `UPDATE clearances
         SET is_printed = 1, printed_at = NOW(), printed_by = ?
         WHERE clearance_id IN (${placeholders})`,
        [adminId, ...clearanceIds]
    );
    return result.affectedRows;
};

// ─── Get admin_id from user_id (helper for controller) ────────────────────────

export const getAdminIdFromUser = async (userId: number): Promise<number | null> => {
    const [rows]: any = await pool.execute(
        "SELECT admin_id FROM admins WHERE user_id = ? AND deleted_at IS NULL LIMIT 1",
        [userId]
    );
    return rows.length ? rows[0].admin_id : null;
};
