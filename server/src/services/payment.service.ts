import pool from "../config/db.js";

export interface PaymentSubmission {
    paymentId: number;
    obligationName: string;
    receiptUrl: string;
    amountPaid: number;
    paymentStatus: number;
    submittedAt: string;
    remarks: string | null;
}

export interface ProofSubmission {
    studentObligationId: number;
    obligationName: string;
    proofImageUrl: string;
    status: 1;
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
                so.amount_due, o.obligation_name
         FROM student_obligations so
         JOIN obligations o ON so.obligation_id = o.obligation_id
         WHERE so.student_obligation_id = ? AND so.student_id = ?`,
        [studentObligationId, studentId]
    );
    if (!soRows.length) throw new Error("Obligation not found");

    const so = soRows[0];
    if (so.status === 2 || so.status === 3) {
        throw new Error("This obligation is already settled");
    }
    if (so.status === 1) {
        throw new Error("A payment is already pending verification for this obligation.");
    }
    if (Number(so.amount_due) === 0) {
        throw new Error("This obligation does not require payment. Upload proof instead.");
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result]: any = await conn.execute(
            `INSERT INTO payment_submissions
                (student_id, obligation_id, student_obligation_id, payment_receipt_path,
                 amount_paid, notes, payment_type, payment_status, submitted_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())`,
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
             SET status = 1, updated_at = NOW()
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
                 VALUES (?, 'Payment Submitted', ?, 2, ?, 'payment', 0, NOW())`,
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
            paymentStatus:  0,
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

export const submitProof = async (
    userId: number,
    studentObligationId: number,
    proofImagePath: string
): Promise<ProofSubmission> => {
    const studentId = await getStudentId(userId);

    const [soRows]: any = await pool.execute(
        `SELECT so.student_obligation_id, so.obligation_id, so.status,
                so.amount_due, o.obligation_name,
                st.user_id AS studentUserId
         FROM student_obligations so
         JOIN obligations o ON so.obligation_id = o.obligation_id
         JOIN students st ON st.student_id = so.student_id
         WHERE so.student_obligation_id = ? AND so.student_id = ?`,
        [studentObligationId, studentId]
    );
    if (!soRows.length) throw new Error("Obligation not found");
    const so = soRows[0];
    if (so.status === 2 || so.status === 3) throw new Error("This obligation is already settled");
    if (so.status === 1) throw new Error("Proof is already pending verification for this obligation.");
    if (Number(so.amount_due) > 0) throw new Error("This obligation requires payment, not proof.");

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.execute(
            `UPDATE student_obligations
             SET proof_image = ?, status = 1, updated_at = NOW()
             WHERE student_obligation_id = ?`,
            [proofImagePath, studentObligationId]
        );

        // Notify ESO officers
        const [officers]: any = await conn.execute(
            `SELECT u.user_id FROM users u
             JOIN roles r ON u.role_id = r.role_id
             WHERE r.role_name = 'eso_officer' AND u.status = 'active'`
        );
        for (const officer of officers) {
            await conn.execute(
                `INSERT INTO notifications
                    (user_id, title, message, type, reference_id, reference_type, is_read, created_at)
                 VALUES (?, 'Proof Submitted', ?, 2, ?, 'obligation', 0, NOW())`,
                [
                    officer.user_id,
                    `A student submitted proof for: ${so.obligation_name}`,
                    studentObligationId,
                ]
            );
        }

        await conn.commit();
        return {
            studentObligationId,
            obligationName: so.obligation_name,
            proofImageUrl: proofImagePath,
            status: 1,
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
