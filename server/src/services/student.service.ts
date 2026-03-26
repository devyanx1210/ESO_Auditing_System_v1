import pool from "../config/db.js";

export interface StudentListItem {
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: string;
    programName: string;
    programCode: string;
    obligationsTotal: number;
    obligationsPaid: number;
    clearanceStatus: string | null;
    avatarPath: string | null;
    address: string | null;
    contactNumber: string | null;
    guardianName: string | null;
    emergencyContact: string | null;
    shirtSize: string | null;
    email: string | null;
}

export const getStudents = async (): Promise<StudentListItem[]> => {
    const [rows]: any = await pool.execute(`
        SELECT
            s.student_id          AS studentId,
            s.student_no          AS studentNo,
            s.first_name          AS firstName,
            s.last_name           AS lastName,
            s.year_level          AS yearLevel,
            s.section,
            s.school_year         AS schoolYear,
            s.semester,
            s.avatar_path         AS avatarPath,
            s.address,
            s.contact_number      AS contactNumber,
            s.guardian_name       AS guardianName,
            s.emergency_contact   AS emergencyContact,
            s.shirt_size          AS shirtSize,
            u.email,
            d.name                AS programName,
            d.code                AS programCode,
            COUNT(so.student_obligation_id)                                          AS obligationsTotal,
            SUM(CASE WHEN so.status = 'paid' THEN 1 ELSE 0 END)                     AS obligationsPaid,
            (SELECT cl.clearance_status
             FROM clearances cl
             WHERE cl.student_id = s.student_id
             ORDER BY cl.created_at DESC LIMIT 1)                                    AS clearanceStatus
        FROM students s
        JOIN programs d ON s.program_id = d.program_id
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN student_obligations so ON s.student_id = so.student_id
        GROUP BY s.student_id
        ORDER BY s.last_name, s.first_name
    `);

    return rows.map((r: any) => ({
        studentId:        r.studentId,
        studentNo:        r.studentNo,
        firstName:        r.firstName,
        lastName:         r.lastName,
        yearLevel:        r.yearLevel,
        section:          r.section,
        schoolYear:       r.schoolYear,
        semester:         r.semester,
        programName:      r.programName,
        programCode:      r.programCode,
        obligationsTotal: Number(r.obligationsTotal),
        obligationsPaid:  Number(r.obligationsPaid),
        clearanceStatus:  r.clearanceStatus ?? null,
        avatarPath:       r.avatarPath ?? null,
        address:          r.address ?? null,
        contactNumber:    r.contactNumber ?? null,
        guardianName:     r.guardianName ?? null,
        emergencyContact: r.emergencyContact ?? null,
        shirtSize:        r.shirtSize ?? null,
        email:            r.email ?? null,
    }));
};

/* ─── Student self-service (requires userId) ─── */

export interface StudentProfile {
    studentId:        number;
    studentNo:        string;
    firstName:        string;
    lastName:         string;
    programCode:      string;
    programName:      string;
    yearLevel:        number;
    section:          string;
    schoolYear:       string;
    semester:         string;
    avatarPath:       string | null;
    address:          string | null;
    contactNumber:    string | null;
    guardianName:     string | null;
    emergencyContact: string | null;
    shirtSize:        string | null;
}

export interface StudentObligationItem {
    studentObligationId: number;
    obligationId: number;
    obligationName: string;
    description: string | null;
    amount: number;
    requiresPayment: boolean;
    gcashQrPath: string | null;
    dueDate: string | null;
    isOverdue: boolean;
    status: "unpaid" | "pending_verification" | "paid" | "waived";
    proofImage: string | null;
    latestPayment: {
        paymentId: number;
        receiptPath: string;
        amountPaid: number;
        paymentStatus: "pending" | "approved" | "rejected";
        submittedAt: string;
        remarks: string | null;
    } | null;
}

export interface ClearanceStepItem {
    stepOrder: number;
    roleLabel: string;
    status: "pending" | "signed" | "rejected";
    verifiedAt: string | null;
    remarks: string | null;
}

export interface StudentClearance {
    clearanceId: number | null;
    status: "pending" | "in_progress" | "cleared" | "rejected" | null;
    currentStep: number;
    steps: ClearanceStepItem[];
}

const findStudentId = async (userId: number): Promise<number> => {
    const [rows]: any = await pool.execute(
        "SELECT student_id FROM students WHERE user_id = ?",
        [userId]
    );
    if (!rows.length) throw new Error("Student record not found");
    return rows[0].student_id;
};

export const getStudentProfile = async (userId: number): Promise<StudentProfile> => {
    const [rows]: any = await pool.execute(
        `SELECT s.student_id, s.student_no, s.first_name, s.last_name,
                s.year_level, s.section, s.school_year, s.semester,
                s.avatar_path, s.address, s.contact_number, s.guardian_name,
                s.emergency_contact, s.shirt_size,
                d.code AS programCode, d.name AS programName
         FROM students s
         JOIN programs d ON s.program_id = d.program_id
         WHERE s.user_id = ?`,
        [userId]
    );
    if (!rows.length) throw new Error("Student profile not found");
    const r = rows[0];
    return {
        studentId:        r.student_id,
        studentNo:        r.student_no,
        firstName:        r.first_name,
        lastName:         r.last_name,
        programCode:      r.programCode,
        programName:      r.programName,
        yearLevel:        r.year_level,
        section:          r.section,
        schoolYear:       r.school_year,
        semester:         r.semester,
        avatarPath:       r.avatar_path       ?? null,
        address:          r.address           ?? null,
        contactNumber:    r.contact_number    ?? null,
        guardianName:     r.guardian_name     ?? null,
        emergencyContact: r.emergency_contact ?? null,
        shirtSize:        r.shirt_size        ?? null,
    };
};

export const updateStudentProfile = async (
    userId: number,
    data: {
        firstName:        string;
        lastName:         string;
        yearLevel:        number;
        section:          string;
        schoolYear:       string;
        semester:         string;
        address:          string;
        contactNumber:    string;
        guardianName:     string;
        emergencyContact: string;
        shirtSize:        string;
        avatarPath?:      string | null;
    }
): Promise<StudentProfile> => {
    const VALID_SIZES = ["XS","S","M","L","XL","XXL",""];
    const shirtSize = VALID_SIZES.includes(data.shirtSize.trim().toUpperCase())
        ? (data.shirtSize.trim().toUpperCase() || null)
        : null;

    const avatarClause = data.avatarPath !== undefined ? ", avatar_path = ?" : "";
    const params: any[] = [
        data.firstName.trim(),
        data.lastName.trim(),
        data.yearLevel,
        data.section.trim(),
        data.schoolYear.trim(),
        data.semester,
        data.address.trim()          || null,
        data.contactNumber.trim()    || null,
        data.guardianName.trim()     || null,
        data.emergencyContact.trim() || null,
        shirtSize,
    ];
    if (data.avatarPath !== undefined) params.push(data.avatarPath);
    params.push(userId);

    await pool.execute(
        `UPDATE students
            SET first_name = ?, last_name = ?, year_level = ?, section = ?,
                school_year = ?, semester = ?,
                address = ?, contact_number = ?, guardian_name = ?,
                emergency_contact = ?, shirt_size = ?
                ${avatarClause}, updated_at = NOW()
          WHERE user_id = ?`,
        params
    );
    await pool.execute(
        `UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE user_id = ?`,
        [data.firstName.trim(), data.lastName.trim(), userId]
    );
    return getStudentProfile(userId);
};

export const getStudentObligations = async (
    userId: number
): Promise<StudentObligationItem[]> => {
    const studentId = await findStudentId(userId);

    const [rows]: any = await pool.execute(
        `SELECT
            so.student_obligation_id,
            o.obligation_id,
            o.obligation_name,
            o.description,
            so.amount_due          AS amount,
            o.gcash_qr_path        AS gcashQrPath,
            o.due_date,
            so.status,
            so.proof_image,
            ps.payment_id,
            ps.payment_receipt_path,
            ps.amount_paid,
            ps.payment_status,
            ps.submitted_at,
            pv.remarks,
            pv.verified_at
         FROM student_obligations so
         JOIN obligations o ON so.obligation_id = o.obligation_id
         LEFT JOIN payment_submissions ps
            ON ps.student_obligation_id = so.student_obligation_id
            AND ps.payment_id = (
                SELECT MAX(p2.payment_id)
                FROM payment_submissions p2
                WHERE p2.student_obligation_id = so.student_obligation_id
            )
         LEFT JOIN payment_verifications pv ON pv.payment_id = ps.payment_id
         WHERE so.student_id = ?
         ORDER BY
            CASE WHEN so.status NOT IN ('paid','waived')
                      AND o.due_date IS NOT NULL
                      AND o.due_date < CURDATE()
                 THEN 0 ELSE 1 END,
            o.due_date IS NULL,
            o.due_date ASC`,
        [studentId]
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.map((r: any) => {
        const dueDate  = r.due_date ? (r.due_date.toISOString?.().split("T")[0] ?? r.due_date) : null;
        const isOverdue = dueDate !== null
            && new Date(dueDate) < today
            && r.status !== "paid"
            && r.status !== "waived";

        return {
            studentObligationId: r.student_obligation_id,
            obligationId:        r.obligation_id,
            obligationName:      r.obligation_name,
            description:         r.description ?? null,
            amount:              Number(r.amount),
            requiresPayment:     Number(r.amount) > 0,
            gcashQrPath:         r.gcashQrPath ?? null,
            dueDate,
            isOverdue,
            status:              r.status,
            proofImage:          r.proof_image ?? null,
            latestPayment: r.payment_id ? {
                paymentId:     r.payment_id,
                receiptPath:   r.payment_receipt_path,
                amountPaid:    Number(r.amount_paid),
                paymentStatus: r.payment_status,
                submittedAt:   r.submitted_at,
                remarks:       r.remarks ?? null,
            } : null,
        };
    });
};

export const getStudentClearance = async (
    userId: number
): Promise<StudentClearance> => {
    const studentId = await findStudentId(userId);

    const [clRows]: any = await pool.execute(
        `SELECT clearance_id, clearance_status, current_step
         FROM clearances
         WHERE student_id = ?
         ORDER BY created_at DESC LIMIT 1`,
        [studentId]
    );

    if (!clRows.length) {
        return { clearanceId: null, status: null, currentStep: 1, steps: [] };
    }

    const cl = clRows[0];

    const [stepRows]: any = await pool.execute(
        `SELECT cv.step_order, cv.status, cv.verified_at, cv.remarks,
                r.role_label
         FROM clearance_verifications cv
         JOIN roles r ON cv.role_id = r.role_id
         WHERE cv.clearance_id = ?
         ORDER BY cv.step_order ASC`,
        [cl.clearance_id]
    );

    return {
        clearanceId: cl.clearance_id,
        status:      cl.clearance_status,
        currentStep: cl.current_step,
        steps: stepRows.map((s: any) => ({
            stepOrder:  s.step_order,
            roleLabel:  s.role_label,
            status:     s.status,
            verifiedAt: s.verified_at ?? null,
            remarks:    s.remarks ?? null,
        })),
    };
};
