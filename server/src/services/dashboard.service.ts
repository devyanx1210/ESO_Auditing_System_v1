import pool from "../config/db.js";

export interface ProgramStat {
    programId: number;
    code: string;
    name: string;
    totalStudents: number;
    clearedStudents: number;
    totalObligations: number;
    paidObligations: number;
}

export interface DashboardStats {
    programs: ProgramStat[];
    totalStudents: number;
    totalCleared: number;
    totalObligations: number;
    totalPaidObligations: number;
}

const RESTRICTED_ROLES = ["program_head", "class_officer"];

export const getDashboardStats = async (role?: string, programId?: number | null): Promise<DashboardStats> => {
    const isRestricted = role && RESTRICTED_ROLES.includes(role) && programId;
    const params: any[] = isRestricted ? [programId] : [];

    const [rows]: any = await pool.execute(`
        SELECT
            d.program_id                                                                     AS programId,
            d.code,
            d.name,
            COUNT(DISTINCT s.student_id)                                                     AS totalStudents,
            COUNT(DISTINCT CASE WHEN c.clearance_status = 'cleared' THEN s.student_id END)  AS clearedStudents,
            COUNT(so.student_obligation_id)                                                  AS totalObligations,
            SUM(CASE WHEN so.status = 'paid' THEN 1 ELSE 0 END)                             AS paidObligations
        FROM programs d
        LEFT JOIN students s ON d.program_id = s.program_id
        LEFT JOIN clearances c ON s.student_id = c.student_id
        LEFT JOIN student_obligations so ON s.student_id = so.student_id
        ${isRestricted ? "WHERE d.program_id = ?" : ""}
        GROUP BY d.program_id
        ORDER BY d.name
    `, params);

    const programs: ProgramStat[] = rows.map((r: any) => ({
        programId:        r.programId,
        code:             r.code,
        name:             r.name,
        totalStudents:    Number(r.totalStudents),
        clearedStudents:  Number(r.clearedStudents),
        totalObligations: Number(r.totalObligations),
        paidObligations:  Number(r.paidObligations),
    }));

    return {
        programs,
        totalStudents:        programs.reduce((s, d) => s + d.totalStudents, 0),
        totalCleared:         programs.reduce((s, d) => s + d.clearedStudents, 0),
        totalObligations:     programs.reduce((s, d) => s + d.totalObligations, 0),
        totalPaidObligations: programs.reduce((s, d) => s + d.paidObligations, 0),
    };
};
