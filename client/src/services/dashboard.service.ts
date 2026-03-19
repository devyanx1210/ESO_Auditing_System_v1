import { apiFetch } from "./api";

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

export const dashboardService = {
    getStats: (token: string) =>
        apiFetch<DashboardStats>("/dashboard/stats", {}, token),
};
