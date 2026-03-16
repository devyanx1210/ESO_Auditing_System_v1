import pool from "../config/db.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAdminId(userId: number): Promise<number> {
    const [rows]: any = await pool.execute(
        "SELECT admin_id, department_id FROM admins WHERE user_id = ?",
        [userId]
    );
    if (!rows.length) throw new Error("Admin profile not found");
    return rows[0].admin_id;
}

async function getAdminRecord(userId: number): Promise<{ adminId: number; departmentId: number | null }> {
    const [rows]: any = await pool.execute(
        "SELECT admin_id, department_id FROM admins WHERE user_id = ?",
        [userId]
    );
    if (!rows.length) throw new Error("Admin profile not found");
    return { adminId: rows[0].admin_id, departmentId: rows[0].department_id ?? null };
}

// Roles that can see all departments
const ALL_DEPT_ROLES = ["system_admin", "eso_officer", "signatory", "dean"];

// ─── Pending GCash payments for admin review ──────────────────────────────────

export interface PendingPaymentItem {
    paymentId: number;
    studentObligationId: number;
    studentName: string;
    studentNo: string;
    departmentCode: string;
    obligationName: string;
    amountPaid: number;
    receiptPath: string;
    notes: string | null;
    submittedAt: string;
}

export const getPendingPayments = async (
    userId: number,
    role: string
): Promise<PendingPaymentItem[]> => {
    const { departmentId } = await getAdminRecord(userId);

    let sql = `
        SELECT
            ps.payment_id                   AS paymentId,
            ps.student_obligation_id        AS studentObligationId,
            CONCAT(s.first_name,' ',s.last_name) AS studentName,
            s.student_no                    AS studentNo,
            d.code                          AS departmentCode,
            o.obligation_name               AS obligationName,
            ps.amount_paid                  AS amountPaid,
            ps.receipt_path                 AS receiptPath,
            ps.notes,
            ps.submitted_at                 AS submittedAt
        FROM payment_submissions ps
        JOIN student_obligations so ON so.student_obligation_id = ps.student_obligation_id
        JOIN students s  ON s.student_id  = ps.student_id
        JOIN obligations o ON o.obligation_id = ps.obligation_id
        JOIN departments d ON d.department_id = s.department_id
        WHERE ps.payment_status = 'pending'
          AND ps.payment_type   = 'gcash'
    `;
    const params: any[] = [];

    if (!ALL_DEPT_ROLES.includes(role) && departmentId) {
        sql += " AND s.department_id = ?";
        params.push(departmentId);
    }

    sql += " ORDER BY ps.submitted_at ASC";

    const [rows]: any = await pool.execute(sql, params);
    return rows;
};

// ─── Verify (approve / reject) a GCash submission ────────────────────────────

export const verifyPayment = async (
    userId: number,
    paymentId: number,
    status: "approved" | "rejected",
    remarks: string | null
): Promise<void> => {
    const adminId = await getAdminId(userId);

    const [rows]: any = await pool.execute(
        `SELECT ps.payment_status, ps.student_obligation_id,
                ps.student_id, o.obligation_name,
                u.user_id AS studentUserId
         FROM payment_submissions ps
         JOIN student_obligations so ON so.student_obligation_id = ps.student_obligation_id
         JOIN students st ON st.student_id = ps.student_id
         JOIN users u    ON u.user_id = st.user_id
         JOIN obligations o ON o.obligation_id = ps.obligation_id
         WHERE ps.payment_id = ?`,
        [paymentId]
    );
    if (!rows.length) throw new Error("Payment not found");
    const pmt = rows[0];
    if (pmt.payment_status !== "pending") throw new Error("Payment already processed");

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Update payment submission
        await conn.execute(
            `UPDATE payment_submissions SET payment_status = ?, updated_at = NOW() WHERE payment_id = ?`,
            [status, paymentId]
        );

        // Record verification
        await conn.execute(
            `INSERT INTO payment_verifications
                (payment_id, admin_id, verification_status, remarks, verified_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [paymentId, adminId, status, remarks ?? null]
        );

        // Update student obligation status
        const newSoStatus = status === "approved" ? "paid" : "unpaid";
        await conn.execute(
            `UPDATE student_obligations SET status = ?, updated_at = NOW()
             WHERE student_obligation_id = ?`,
            [newSoStatus, pmt.student_obligation_id]
        );

        // Notify student
        const title = status === "approved" ? "Payment Approved" : "Payment Rejected";
        const message = status === "approved"
            ? `Your payment for "${pmt.obligation_name}" has been approved.`
            : `Your payment for "${pmt.obligation_name}" was rejected${remarks ? ": " + remarks : ""}.`;
        await conn.execute(
            `INSERT INTO notifications
                (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, 'payment', 0, NOW())`,
            [pmt.studentUserId, title, message, `payment_${status}`, paymentId]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── Record a cash payment (admin side) ──────────────────────────────────────

export const recordCashPayment = async (
    userId: number,
    studentObligationId: number,
    amountPaid: number,
    notes: string | null
): Promise<void> => {
    const adminId = await getAdminId(userId);

    const [soRows]: any = await pool.execute(
        `SELECT so.status, so.obligation_id, so.student_id,
                o.obligation_name,
                st.user_id AS studentUserId
         FROM student_obligations so
         JOIN obligations o  ON o.obligation_id = so.obligation_id
         JOIN students st    ON st.student_id   = so.student_id
         WHERE so.student_obligation_id = ?`,
        [studentObligationId]
    );
    if (!soRows.length) throw new Error("Obligation not found");
    const so = soRows[0];
    if (so.status === "paid" || so.status === "waived")
        throw new Error("This obligation is already settled");

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result]: any = await conn.execute(
            `INSERT INTO payment_submissions
                (student_id, obligation_id, student_obligation_id,
                 receipt_path, amount_paid, notes,
                 payment_type, recorded_by_admin_id,
                 payment_status, submitted_at, updated_at)
             VALUES (?, ?, ?, NULL, ?, ?, 'cash', ?, 'approved', NOW(), NOW())`,
            [so.student_id, so.obligation_id, studentObligationId, amountPaid, notes ?? null, adminId]
        );
        const paymentId = result.insertId;

        // Record verification immediately (cash = auto-approved)
        await conn.execute(
            `INSERT INTO payment_verifications
                (payment_id, admin_id, verification_status, remarks, verified_at)
             VALUES (?, ?, 'approved', 'Cash payment recorded by admin', NOW())`,
            [paymentId, adminId]
        );

        // Mark obligation as paid
        await conn.execute(
            `UPDATE student_obligations SET status = 'paid', updated_at = NOW()
             WHERE student_obligation_id = ?`,
            [studentObligationId]
        );

        // Notify student
        await conn.execute(
            `INSERT INTO notifications
                (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
             VALUES (?, 'Cash Payment Recorded', ?, 'payment_approved', ?, 'payment', 0, NOW())`,
            [
                so.studentUserId,
                `Your cash payment of ₱${amountPaid} for "${so.obligation_name}" has been recorded.`,
                paymentId,
            ]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
// ─── Payment history (approved / rejected) ───────────────────────────────────

export interface PaymentHistoryItem {
    paymentId: number;
    studentName: string;
    studentNo: string;
    departmentCode: string;
    obligationName: string;
    amountPaid: number;
    paymentType: "gcash" | "cash";
    paymentStatus: "approved" | "rejected";
    notes: string | null;
    submittedAt: string;
    verifiedAt: string | null;
    remarks: string | null;
}

export const getPaymentHistory = async (
    userId: number,
    role: string
): Promise<PaymentHistoryItem[]> => {
    const { departmentId } = await getAdminRecord(userId);

    let sql = `
        SELECT
            ps.payment_id                        AS paymentId,
            CONCAT(s.first_name,' ',s.last_name) AS studentName,
            s.student_no                         AS studentNo,
            d.code                               AS departmentCode,
            o.obligation_name                    AS obligationName,
            ps.amount_paid                       AS amountPaid,
            ps.payment_type                      AS paymentType,
            ps.payment_status                    AS paymentStatus,
            ps.notes,
            ps.submitted_at                      AS submittedAt,
            pv.verified_at                       AS verifiedAt,
            pv.remarks
        FROM payment_submissions ps
        JOIN students s    ON s.student_id    = ps.student_id
        JOIN obligations o ON o.obligation_id = ps.obligation_id
        JOIN departments d ON d.department_id = s.department_id
        LEFT JOIN payment_verifications pv ON pv.payment_id = ps.payment_id
        WHERE ps.payment_status IN ('approved','rejected')
    `;
    const params: any[] = [];

    if (!ALL_DEPT_ROLES.includes(role) && departmentId) {
        sql += " AND s.department_id = ?";
        params.push(departmentId);
    }

    sql += " ORDER BY ps.updated_at DESC LIMIT 200";
    const [rows]: any = await pool.execute(sql, params);
    return rows;
};

// --- Approve all pending GCash submissions at once ---

export const verifyAllPayments = async (userId: number, role: string): Promise<number> => {
    const { adminId, departmentId } = await getAdminRecord(userId);

    let sql = `
        SELECT ps.payment_id, ps.student_obligation_id,
               o.obligation_name, st.user_id AS studentUserId
        FROM payment_submissions ps
        JOIN student_obligations so ON so.student_obligation_id = ps.student_obligation_id
        JOIN students st ON st.student_id = ps.student_id
        JOIN obligations o ON o.obligation_id = ps.obligation_id
        WHERE ps.payment_status = 'pending' AND ps.payment_type = 'gcash'
    `;
    const params: any[] = [];
    if (!ALL_DEPT_ROLES.includes(role) && departmentId) {
        sql += " AND st.department_id = ?";
        params.push(departmentId);
    }

    const [rows]: any = await pool.execute(sql, params);
    if (!rows.length) return 0;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const pmt of rows) {
            await conn.execute(
                "UPDATE payment_submissions SET payment_status = 'approved', updated_at = NOW() WHERE payment_id = ?",
                [pmt.payment_id]
            );
            await conn.execute(
                `INSERT INTO payment_verifications (payment_id, admin_id, verification_status, remarks, verified_at)
                 VALUES (?, ?, 'approved', 'Bulk approved', NOW())`,
                [pmt.payment_id, adminId]
            );
            await conn.execute(
                "UPDATE student_obligations SET status = 'paid', updated_at = NOW() WHERE student_obligation_id = ?",
                [pmt.student_obligation_id]
            );
            await conn.execute(
                `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
                 VALUES (?, 'Payment Approved', ?, 'payment_approved', ?, 'payment', 0, NOW())`,
                [pmt.studentUserId, "Your GCash payment for \"" + pmt.obligation_name + "\" has been approved.", pmt.payment_id]
            );
        }
        await conn.commit();
        return rows.length;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
