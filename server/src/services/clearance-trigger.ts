import pool from "../config/db.js";
import { createNotification } from "./notification.service.js";

/**
 * After an obligation is approved, check whether ALL of the student's obligations
 * are now settled (status 2 = verified, 3 = waived).  If so and no clearance
 * record exists yet for this semester, auto-create one at step 1 and notify
 * the student.  Must be called inside an active transaction (conn parameter).
 */
export async function triggerClearanceIfComplete(
    conn: any,
    studentId: number,
    schoolYear: string,
    semester: number | string,
    studentUserId: number
): Promise<void> {
    const [totalRow]: any = await conn.execute(
        `SELECT COUNT(*) AS total FROM student_obligations WHERE student_id = ?`,
        [studentId]
    );
    if (Number(totalRow[0].total) === 0) return;

    const [unsetRow]: any = await conn.execute(
        `SELECT COUNT(*) AS unsettled FROM student_obligations
         WHERE student_id = ? AND status NOT IN (2, 3)`,
        [studentId]
    );
    if (Number(unsetRow[0].unsettled) > 0) return;

    // Don't create a duplicate clearance for the same semester
    const [clRow]: any = await conn.execute(
        `SELECT clearance_id FROM clearances
         WHERE student_id = ? AND school_year = ? AND semester = ?
         LIMIT 1`,
        [studentId, schoolYear, semester]
    );
    if (clRow.length) return;

    const [ins]: any = await conn.execute(
        `INSERT INTO clearances
            (student_id, school_year, semester, clearance_status, current_step, created_at, updated_at)
         VALUES (?, ?, ?, 1, 1, NOW(), NOW())`,
        [studentId, schoolYear, semester]
    );

    await createNotification(
        conn, studentUserId,
        "All Obligations Cleared!",
        "All your obligations are settled. Your clearance process has been initiated.",
        6, ins.insertId, "clearance"
    );
}
