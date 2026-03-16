import { apiFetch } from "./api";

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

export const dashboardService = {
    getStats: (token: string) =>
        apiFetch<DashboardStats>("/dashboard/stats", {}, token),
};
