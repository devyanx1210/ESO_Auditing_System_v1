import pool from "../config/db.js";

export interface PaymentSubmission {
    paymentId: number;
    obligationName: string;
    receiptUrl: string;
    amountPaid: number;
    paymentStatus: "pending" | "approved" | "rejected";
    submittedAt: string;
    remarks: string | null;
}

const getStudentId = async (userId: number): Promise<number> => {
    const [rows]: any = await pool.execute(
        "SELECT student_id FROM students WHERE user_id = ?",
        [userId]
    );
    if (!rows.length) throw new Error("Student profile not found");
    return rows[0].student_id;
};

export const submitPayment = async (
    userId: number,
    studentObligationId: number,
    receiptPath: string,
    amountPaid: number,
    notes: string | null
): Promise<PaymentSubmission> => {
    const studentId = await getStudentId(userId);

    // Verify this student_obligation belongs to this student
    const [soRows]: any = await pool.execute(
        `SELECT so.student_obligation_id, so.obligation_id, so.status,
                o.obligation_name
         FROM student_obligations so
         JOIN obligations o ON so.obligation_id = o.obligation_id
         WHERE so.student_obligation_id = ? AND so.student_id = ?`,
        [studentObligationId, studentId]
    );
    if (!soRows.length) throw new Error("Obligation not found");

    const so = soRows[0];
    if (so.status === "paid" || so.status === "waived") {
        throw new Error("This obligation is already settled");
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result]: any = await conn.execute(
            `INSERT INTO payment_submissions
                (student_id, obligation_id, student_obligation_id, receipt_path,
                 amount_paid, notes, payment_status, submitted_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
            [
                studentId,
                so.obligation_id,
                studentObligationId,
                receiptPath,
                amountPaid,
                notes ?? null,
            ]
        );
        const paymentId = result.insertId;

        // Update obligation status to pending_verification
        await conn.execute(
            `UPDATE student_obligations
             SET status = 'pending_verification', updated_at = NOW()
             WHERE student_obligation_id = ?`,
            [studentObligationId]
        );

        // Notify all ESO officers
        const [officers]: any = await conn.execute(
            `SELECT u.user_id FROM users u
             JOIN roles r ON u.role_id = r.role_id
             WHERE r.role_name = 'eso_officer' AND u.status = 'active'`
        );
        for (const officer of officers) {
            await conn.execute(
                `INSERT INTO notifications
                    (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
                 VALUES (?, 'Payment Submitted', ?, 'payment_submitted', ?, 'payment', 0, NOW())`,
                [
                    officer.user_id,
                    `A student submitted a payment receipt for: ${so.obligation_name}`,
                    paymentId,
                ]
            );
        }

        await conn.commit();

        return {
            paymentId,
            obligationName: so.obligation_name,
            receiptUrl:     `receipts/${receiptPath.split("/").pop()}`,
            amountPaid,
            paymentStatus:  "pending",
            submittedAt:    new Date().toISOString(),
            remarks:        null,
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
