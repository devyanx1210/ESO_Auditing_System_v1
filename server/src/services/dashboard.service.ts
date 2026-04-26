import pool from "../config/db.js";
import { isClassRole, isProgramRole } from "../config/role-groups.js";

export interface ObligationStudentStatus {
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    yearLevel: number;
    section: string;
    status: number; // 0=unpaid | 1=pending_verification | 2=paid | 3=waived
}

export interface ObligationStat {
    obligationId: number;
    obligationName: string;
    scope: number;
    programId: number | null;
    programName: string | null;
    totalStudents: number;
    paidCount: number;
    students: ObligationStudentStatus[];
}

export interface YearLevelStat {
    yearLevel: number;
    totalStudents: number;
    verifiedStudents: number;
}

export interface ProgramStat {
    programId: number;
    code: string;
    name: string;
    totalStudents: number;
    verifiedStudents: number;
    totalObligations: number;
    paidObligations: number;
    totalAmountToCollect: number;
    totalApprovedPayments: number;
    yearLevelBreakdown: YearLevelStat[];
}

export interface DashboardStats {
    programs: ProgramStat[];
    totalRegisteredStudents: number;
    totalVerifiedStudents: number;
    totalAmountToCollect: number;
    totalApprovedPayments: number;
    obligations: ObligationStat[];
    filterLabel: string | null;
}

export const getDashboardStats = async (
    role?: string,
    programId?: number | null,
    yearLevel?: number | null,
    section?: string | null
): Promise<DashboardStats> => {
    const isClassOfficer   = isClassRole(role ?? "");
    const isProgramOfficer = isProgramRole(role ?? "");

    // Build program stats query
    // Class officer: filter by their programId + yearLevel + section
    // Program officer: filter by their programId only
    const studentFilter = isClassOfficer
        ? "AND s.year_level = ? AND s.section = ?"
        : "";
    const programWhere = (isClassOfficer && programId)
        ? "WHERE p.program_id = ?"
        : (isProgramOfficer && programId)
        ? "WHERE p.program_id = ?"
        : "";

    const programSql = `
        SELECT
            p.program_id AS programId,
            p.code,
            p.name,
            COUNT(DISTINCT s.student_id)                                                    AS totalStudents,
            COUNT(DISTINCT CASE WHEN c.clearance_status = 2 THEN s.student_id END) AS verifiedStudents,
            COUNT(so.student_obligation_id)                                                 AS totalObligations,
            COALESCE(SUM(CASE WHEN so.status = 2 THEN 1 ELSE 0 END), 0)                    AS paidObligations,
            COALESCE(SUM(so.amount_due), 0)                                                 AS totalAmountToCollect
        FROM programs p
        LEFT JOIN students s  ON p.program_id = s.program_id ${studentFilter}
        LEFT JOIN clearances c ON s.student_id = c.student_id AND c.clearance_status = 2
        LEFT JOIN student_obligations so ON s.student_id = so.student_id
        ${programWhere}
        GROUP BY p.program_id
        ORDER BY p.name
    `;

    const programParams: any[] = [];
    if (isClassOfficer)  { programParams.push(yearLevel ?? null, section ?? null); if (programId) programParams.push(programId); }
    if (isProgramOfficer && programId) programParams.push(programId);

    const [programRows]: any = await pool.execute(programSql, programParams);

    // Approved payments (separate simple query)
    const paymentConditions: string[] = ["ps.payment_status = 1"];
    const paymentParams: any[] = [];

    if (isClassOfficer) {
        paymentConditions.push("s.year_level = ?", "s.section = ?");
        paymentParams.push(yearLevel ?? null, section ?? null);
    } else if (isProgramOfficer && programId) {
        paymentConditions.push("s.program_id = ?");
        paymentParams.push(programId);
    }

    const paymentSql = `
        SELECT s.program_id AS programId, COALESCE(SUM(ps.amount_paid), 0) AS approvedTotal
        FROM payment_submissions ps
        JOIN student_obligations so ON ps.student_obligation_id = so.student_obligation_id
        JOIN students s ON so.student_id = s.student_id
        WHERE ${paymentConditions.join(" AND ")}
        GROUP BY s.program_id
    `;
    const [paymentRows]: any = await pool.execute(paymentSql, paymentParams);
    const paymentByProgram = new Map<number, number>();
    for (const r of paymentRows) {
        paymentByProgram.set(Number(r.programId), Number(r.approvedTotal));
    }

    // Year-level breakdown per program
    const ylConditions: string[] = [];
    const ylParams: any[] = [];
    if (isClassOfficer) {
        if (programId) { ylConditions.push("s.program_id = ?"); ylParams.push(programId); }
        ylConditions.push("s.year_level = ?", "s.section = ?");
        ylParams.push(yearLevel ?? null, section ?? null);
    } else if (isProgramOfficer && programId) {
        ylConditions.push("s.program_id = ?");
        ylParams.push(programId);
    }
    const ylWhere = ylConditions.length ? `WHERE ${ylConditions.join(" AND ")}` : "";

    const ylSql = `
        SELECT
            s.program_id                                                                     AS programId,
            s.year_level                                                                     AS yearLevel,
            COUNT(DISTINCT s.student_id)                                                     AS totalStudents,
            COUNT(DISTINCT CASE WHEN c.clearance_status = 2 THEN s.student_id END)  AS verifiedStudents
        FROM students s
        LEFT JOIN clearances c ON s.student_id = c.student_id AND c.clearance_status = 2
        ${ylWhere}
        GROUP BY s.program_id, s.year_level
        ORDER BY s.program_id, s.year_level
    `;
    const [ylRows]: any = await pool.execute(ylSql, ylParams);

    const ylByProgram = new Map<number, YearLevelStat[]>();
    for (const r of ylRows) {
        const pid = Number(r.programId);
        if (!ylByProgram.has(pid)) ylByProgram.set(pid, []);
        ylByProgram.get(pid)!.push({
            yearLevel:       Number(r.yearLevel),
            totalStudents:   Number(r.totalStudents),
            verifiedStudents: Number(r.verifiedStudents),
        });
    }

    const programs: ProgramStat[] = programRows.map((r: any) => ({
        programId:             Number(r.programId),
        code:                  r.code,
        name:                  r.name,
        totalStudents:         Number(r.totalStudents),
        verifiedStudents:      Number(r.verifiedStudents),
        totalObligations:      Number(r.totalObligations),
        paidObligations:       Number(r.paidObligations),
        totalAmountToCollect:  Number(r.totalAmountToCollect),
        totalApprovedPayments: paymentByProgram.get(Number(r.programId)) ?? 0,
        yearLevelBreakdown:    ylByProgram.get(Number(r.programId)) ?? [],
    }));

    // Build obligations query
    let obligationSql = `
        SELECT
            o.obligation_id,
            o.obligation_name,
            o.scope,
            o.program_id    AS obligation_program_id,
            d.name          AS obligation_program_name,
            so.student_obligation_id,
            so.status AS so_status,
            s.student_id,
            s.student_no,
            s.first_name,
            s.last_name,
            s.year_level,
            s.section
        FROM obligations o
        LEFT JOIN programs d ON o.program_id = d.program_id
        LEFT JOIN student_obligations so ON o.obligation_id = so.obligation_id
        LEFT JOIN students s ON so.student_id = s.student_id
    `;

    const obligationParams: any[] = [];
    const obligationConditions: string[] = [];

    if (isClassOfficer) {
        obligationConditions.push("s.program_id = ?", "s.year_level = ?", "s.section = ?");
        obligationParams.push(programId ?? null, yearLevel ?? null, section ?? null);
    } else if (isProgramOfficer && programId) {
        // Program officers: only see scope=1 obligations they created for their program
        obligationConditions.push("s.program_id = ?", "o.scope = 1", "o.program_id = ?");
        obligationParams.push(programId, programId);
    }

    if (obligationConditions.length) {
        obligationSql += " WHERE " + obligationConditions.join(" AND ");
    }

    obligationSql += " ORDER BY o.obligation_id, s.last_name, s.first_name";

    const [obligationRows]: any = await pool.execute(obligationSql, obligationParams);

    // Group by obligation_id in JS
    const obligationMap = new Map<number, ObligationStat>();
    for (const r of obligationRows) {
        const id = Number(r.obligation_id);
        if (!obligationMap.has(id)) {
            obligationMap.set(id, {
                obligationId:   id,
                obligationName: r.obligation_name,
                scope:          r.scope,
                programId:      r.obligation_program_id != null ? Number(r.obligation_program_id) : null,
                programName:    r.obligation_program_name ?? null,
                totalStudents:  0,
                paidCount:      0,
                students:       [],
            });
        }
        // LEFT JOIN rows with no students have null student_id — skip student data
        if (r.student_id == null) continue;
        const ob = obligationMap.get(id)!;
        ob.totalStudents++;
        if (r.so_status === 2) ob.paidCount++;
        ob.students.push({
            studentId: Number(r.student_id),
            studentNo: r.student_no,
            firstName: r.first_name,
            lastName:  r.last_name,
            yearLevel: Number(r.year_level),
            section:   r.section ?? "",
            status:    r.so_status,
        });
    }

    const obligations: ObligationStat[] = Array.from(obligationMap.values());

    // Totals
    const totalRegisteredStudents = programs.reduce((s, p) => s + p.totalStudents, 0);
    const totalVerifiedStudents   = programs.reduce((s, p) => s + p.verifiedStudents, 0);
    const totalAmountToCollect    = programs.reduce((s, p) => s + p.totalAmountToCollect, 0);
    const totalApprovedPayments   = programs.reduce((s, p) => s + p.totalApprovedPayments, 0);

    // filterLabel
    let filterLabel: string | null = null;
    if (isClassOfficer && yearLevel != null && section) {
        const ordinal = ["", "1st", "2nd", "3rd", "4th", "5th"][yearLevel] ?? `${yearLevel}th`;
        filterLabel = `${ordinal} Year - Section ${section}`;
    }

    return {
        programs,
        totalRegisteredStudents,
        totalVerifiedStudents,
        totalAmountToCollect,
        totalApprovedPayments,
        obligations,
        filterLabel,
    };
};
