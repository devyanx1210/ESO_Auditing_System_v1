import pool from "../config/db.js";

export interface DepartmentStat {
    departmentId: number;
    code: string;
    name: string;
    totalStudents: number;
    clearedStudents: number;
    totalObligations: number;
    paidObligations: number;
}

export interface DashboardStats {
    departments: DepartmentStat[];
    totalStudents: number;
    totalCleared: number;
    totalObligations: number;
    totalPaidObligations: number;
}

const RESTRICTED_ROLES = ["program_head", "class_officer"];

export const getDashboardStats = async (role?: string, departmentId?: number | null): Promise<DashboardStats> => {
    const isRestricted = role && RESTRICTED_ROLES.includes(role) && departmentId;
    const params: any[] = isRestricted ? [departmentId] : [];

    const [rows]: any = await pool.execute(`
        SELECT
            d.department_id                                                                  AS departmentId,
            d.code,
            d.name,
            COUNT(DISTINCT s.student_id)                                                     AS totalStudents,
            COUNT(DISTINCT CASE WHEN c.clearance_status = 'cleared' THEN s.student_id END)  AS clearedStudents,
            COUNT(so.student_obligation_id)                                                  AS totalObligations,
            SUM(CASE WHEN so.status = 'paid' THEN 1 ELSE 0 END)                             AS paidObligations
        FROM departments d
        LEFT JOIN students s ON d.department_id = s.department_id
        LEFT JOIN clearances c ON s.student_id = c.student_id
        LEFT JOIN student_obligations so ON s.student_id = so.student_id
        ${isRestricted ? "WHERE d.department_id = ?" : ""}
        GROUP BY d.department_id
        ORDER BY d.name
    `, params);

    const departments: DepartmentStat[] = rows.map((r: any) => ({
        departmentId:    r.departmentId,
        code:            r.code,
        name:            r.name,
        totalStudents:   Number(r.totalStudents),
        clearedStudents: Number(r.clearedStudents),
        totalObligations: Number(r.totalObligations),
        paidObligations:  Number(r.paidObligations),
    }));

    return {
        departments,
        totalStudents:       departments.reduce((s, d) => s + d.totalStudents, 0),
        totalCleared:        departments.reduce((s, d) => s + d.clearedStudents, 0),
        totalObligations:    departments.reduce((s, d) => s + d.totalObligations, 0),
        totalPaidObligations: departments.reduce((s, d) => s + d.paidObligations, 0),
    };
};
