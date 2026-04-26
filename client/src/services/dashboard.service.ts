import { apiFetch } from "./api";

export interface ObligationStudentStatus {
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    yearLevel: number;
    section: string;
    status: string;
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

export const dashboardService = {
    getStats: (token: string) =>
        apiFetch<DashboardStats>("/dashboard/stats", {}, token),
};
