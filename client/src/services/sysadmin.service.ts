import { apiFetch } from "./api";

export const sysadminService = {
    // Public
    getMaintenanceStatus: () =>
        apiFetch<any>("/sysadmin/maintenance/status"),

    // Settings
    getSettings: (token: string) =>
        apiFetch<any>("/sysadmin/settings", {}, token),

    updateMaintenance: (token: string, maintenance_mode: boolean, maintenance_msg: string) =>
        apiFetch<any>("/sysadmin/settings/maintenance", {
            method: "PATCH",
            body: JSON.stringify({ maintenance_mode, maintenance_msg }),
        }, token),

    updateSemester: (token: string, school_year: string, current_semester: number) =>
        apiFetch<any>("/sysadmin/settings/semester", {
            method: "PATCH",
            body: JSON.stringify({ school_year, current_semester }),
        }, token),

    // Accounts
    getAccounts: (token: string) =>
        apiFetch<any[]>("/sysadmin/accounts", {}, token),

    createAccount: (token: string, data: {
        firstName: string; lastName: string; email: string;
        password: string; role: string; programId?: number | null; position?: string;
    }) =>
        apiFetch<any>("/sysadmin/accounts", {
            method: "POST",
            body: JSON.stringify(data),
        }, token),

    updateAccount: (token: string, userId: number, data: {
        firstName: string; lastName: string; email: string;
        roleId: number; programId?: number | null; position: string; password?: string;
    }) =>
        apiFetch<any>(`/sysadmin/accounts/${userId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, token),

    updateAccountStatus: (token: string, userId: number, status: string) =>
        apiFetch<any>(`/sysadmin/accounts/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }, token),

    deleteAccount: (token: string, userId: number) =>
        apiFetch<any>(`/sysadmin/accounts/${userId}`, { method: "DELETE" }, token),

    // Year Advancement
    previewAdvancement: (token: string) =>
        apiFetch<any>("/sysadmin/students/advancement-preview", {}, token),

    executeAdvancement: (token: string, newSchoolYear: string) =>
        apiFetch<any>("/sysadmin/students/advance-year", {
            method: "POST",
            body: JSON.stringify({ new_school_year: newSchoolYear }),
        }, token),

    // Audit Logs
    getAuditLogs: (token: string, page = 1, limit = 50) =>
        apiFetch<{ logs: any[]; total: number }>(`/sysadmin/audit-logs?page=${page}&limit=${limit}`, {}, token),

    // Programs
    getPrograms: (token: string) =>
        apiFetch<{ program_id: number; name: string; code: string }[]>("/sysadmin/programs", {}, token),

    // Roles
    getRoles: (token: string) =>
        apiFetch<{ role_id: number; role_name: string; role_label: string; clearance_step: number | null }[]>("/sysadmin/roles", {}, token),

    // Clearance Workflow
    getWorkflow: (token: string) =>
        apiFetch<{ role_id: number; role_name: string; role_label: string; clearance_step: number | null }[]>(
            "/sysadmin/workflow", {}, token
        ),

    updateWorkflow: (token: string, steps: { roleId: number; clearanceStep: number | null }[]) =>
        apiFetch<any>("/sysadmin/workflow", {
            method: "PUT",
            body: JSON.stringify({ steps }),
        }, token),
};
