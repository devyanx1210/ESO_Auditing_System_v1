import pool from "../config/db.js";

// Roles that see ALL students across every program (no program filter)
const ALL_PROGRAMS_ROLES = ["system_admin", "eso_officer", "signatory", "dean"];

async function getAdminDeptId(userId: number): Promise<number | null> {
    const [rows]: any = await pool.execute(
        "SELECT program_id FROM admins WHERE user_id = ?",
        [userId]
    );
    return rows[0]?.program_id ?? null;
}

// ─── Student list (dept-filtered) ─────────────────────────────────────────────

export interface AdminStudentItem {
    studentId: number;
    userId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: number;
    programName: string;
    programCode: string;
    obligationsTotal: number;
    obligationsPaid: number;
    obligationsPending: number;
    clearanceStatus: number | null;
    avatarPath: string | null;
    email: string | null;
    address: string | null;
    contactNumber: string | null;
    guardianName: string | null;
    shirtSize: string | null;
    userStatus: "active" | "inactive" | "suspended";
}

export const listStudents = async (
    userId: number,
    role: string,
    userDeptId?: number | null,
    yearLevel?: number | null,
    section?: string | null
): Promise<AdminStudentItem[]> => {
    // system_admin / eso_officer / signatory / dean → no program filter (see all)
    // program_head / program_officer / class_officer → filtered to their program
    const deptId = ALL_PROGRAMS_ROLES.includes(role)
        ? null
        : (await getAdminDeptId(userId)) ?? userDeptId ?? null;

    let sql = `
        SELECT
            s.student_id        AS studentId,
            s.user_id           AS userId,
            s.student_no        AS studentNo,
            s.first_name        AS firstName,
            s.last_name         AS lastName,
            s.year_level        AS yearLevel,
            s.section,
            s.school_year       AS schoolYear,
            s.semester,
            s.avatar_path       AS avatarPath,
            g.address,
            g.contact_number    AS contactNumber,
            g.guardian_name     AS guardianName,
            s.shirt_size        AS shirtSize,
            u.email,
            u.status            AS userStatus,
            d.name              AS programName,
            d.code              AS programCode,
            COUNT(so.student_obligation_id)                         AS obligationsTotal,
            SUM(so.status IN (2,3))                                 AS obligationsPaid,
            SUM(so.status = 1)                                      AS obligationsPending,
            cl.clearance_status AS clearanceStatus,
            COALESCE(SUM(CASE WHEN o.amount > 0 THEN so.amount_due ELSE 0 END), 0)                    AS totalPayable,
            COALESCE(SUM(CASE WHEN o.amount > 0 AND so.status = 2 THEN so.amount_due ELSE 0 END), 0)  AS totalPaid
        FROM students s
        JOIN users u       ON u.user_id       = s.user_id
        JOIN programs d ON d.program_id = s.program_id
        LEFT JOIN guardian g ON g.student_id = s.student_id
        LEFT JOIN student_obligations so ON so.student_id = s.student_id
        LEFT JOIN obligations o ON o.obligation_id = so.obligation_id
        LEFT JOIN clearances cl
            ON cl.student_id = s.student_id
            AND cl.school_year = s.school_year
            AND cl.semester   = s.semester
        WHERE u.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (deptId) {
        sql += " AND s.program_id = ?";
        params.push(deptId);
    }
    // class_officer: further restrict to their specific year + section (deptId already filters program)
    if (role === "class_officer") {
        if (yearLevel != null) { sql += " AND s.year_level = ?"; params.push(yearLevel); }
        if (section)           { sql += " AND s.section = ?";    params.push(section); }
    }

    sql += " GROUP BY s.student_id ORDER BY s.last_name, s.first_name";

    const [rows]: any = await pool.execute(sql, params);
    return rows.map((r: any) => ({
        ...r,
        obligationsTotal:   Number(r.obligationsTotal),
        obligationsPaid:    Number(r.obligationsPaid),
        obligationsPending: Number(r.obligationsPending),
        totalPayable:       Number(r.totalPayable),
        totalPaid:          Number(r.totalPaid),
    }));
};

// ─── Per-student obligation list (for admin panel) ────────────────────────────

export interface AdminObligationItem {
    studentObligationId: number;
    obligationId: number;
    obligationName: string;
    amount: number;
    requiresPayment: boolean;
    dueDate: string | null;
    isOverdue: boolean;
    status: number;
    proofImage: string | null;
    paymentType: number | null;
    paymentId: number | null;
    receiptPath: string | null;
    amountPaid: number | null;
    paymentStatus: number | null;
    submittedAt: string | null;
    remarks: string | null;
    verifiedByName: string | null;
    verifiedByRole: string | null;
    verifiedAt: string | null;
}

export const getStudentObligationsForAdmin = async (
    studentId: number
): Promise<AdminObligationItem[]> => {
    const [rows]: any = await pool.execute(
        `SELECT
            so.student_obligation_id,
            o.obligation_id,
            o.obligation_name,
            so.amount_due          AS amount,
            o.due_date,
            so.status,
            so.proof_image,
            ps.payment_id,
            ps.payment_receipt_path,
            ps.amount_paid,
            ps.payment_type,
            ps.payment_status,
            ps.submitted_at,
            pv.remarks,
            pv.verified_at,
            CONCAT(vu.first_name, ' ', vu.last_name) AS verified_by_name,
            vr.role_label                             AS verified_by_role
         FROM student_obligations so
         JOIN obligations o ON o.obligation_id = so.obligation_id
         LEFT JOIN payment_submissions ps
            ON ps.student_obligation_id = so.student_obligation_id
            AND ps.payment_id = (
                SELECT MAX(p2.payment_id) FROM payment_submissions p2
                WHERE p2.student_obligation_id = so.student_obligation_id
            )
         LEFT JOIN payment_verifications pv ON pv.payment_id = ps.payment_id
         LEFT JOIN admins va ON va.admin_id = pv.admin_id
         LEFT JOIN users  vu ON vu.user_id  = va.user_id
         LEFT JOIN roles  vr ON vr.role_id  = vu.role_id
         WHERE so.student_id = ?
         ORDER BY o.due_date IS NULL, o.due_date ASC`,
        [studentId]
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.map((r: any) => {
        const dueDate = r.due_date
            ? (r.due_date.toISOString?.().split("T")[0] ?? r.due_date)
            : null;
        const isOverdue = dueDate !== null
            && new Date(dueDate) < today
            && r.status !== 2
            && r.status !== 3;
        return {
            studentObligationId: r.student_obligation_id,
            obligationId:        r.obligation_id,
            obligationName:      r.obligation_name,
            amount:              Number(r.amount),
            requiresPayment:     Number(r.amount) > 0,
            dueDate,
            isOverdue,
            status:              r.status,
            proofImage:          r.proof_image ?? null,
            paymentType:         r.payment_type ?? null,
            paymentId:           r.payment_id ?? null,
            receiptPath:         r.payment_receipt_path ?? null,
            amountPaid:          r.amount_paid != null ? Number(r.amount_paid) : null,
            paymentStatus:       r.payment_status ?? null,
            submittedAt:         r.submitted_at ?? null,
            remarks:             r.remarks ?? null,
            verifiedByName:      r.verified_by_name ?? null,
            verifiedByRole:      r.verified_by_role ?? null,
            verifiedAt:          r.verified_at
                ? (r.verified_at.toISOString?.() ?? String(r.verified_at))
                : null,
        };
    });
};

// ─── Verify proof submission (non-payment obligation) ─────────────────────────

export const verifyProofObligation = async (
    userId: number,
    studentObligationId: number,
    status: number
): Promise<void> => {
    const adminId = await getAdminId(userId);

    const [rows]: any = await pool.execute(
        `SELECT so.student_id, so.amount_due, o.obligation_name,
                s.user_id AS studentUserId
         FROM student_obligations so
         JOIN obligations o ON o.obligation_id = so.obligation_id
         JOIN students s    ON s.student_id    = so.student_id
         WHERE so.student_obligation_id = ?`,
        [studentObligationId]
    );
    if (!rows.length) throw new Error("Obligation not found");
    const ob = rows[0];
    if (Number(ob.amount_due) > 0) throw new Error("This obligation requires payment verification, not proof.");

    await pool.execute(
        `UPDATE student_obligations SET status = ?, updated_at = NOW() WHERE student_obligation_id = ?`,
        [status, studentObligationId]
    );

    const title   = status === 2 ? "Proof Verified" : "Proof Rejected";
    const message = status === 2
        ? `Your proof for "${ob.obligation_name}" has been verified.`
        : `Your proof for "${ob.obligation_name}" was not accepted.`;
    await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, 'obligation', 0, NOW())`,
        [ob.studentUserId, title, message, status === 2 ? 3 : 4, studentObligationId]
    );
};
