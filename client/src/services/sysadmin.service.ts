const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const apiFetch = async (path: string, options: RequestInit = {}, token?: string) => {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Request failed");
    return data.data ?? data;
};

export const sysadminService = {
    // Public
    getMaintenanceStatus: () =>
        apiFetch("/sysadmin/maintenance/status"),

    // Settings
    getSettings: (token: string) =>
        apiFetch("/sysadmin/settings", {}, token),

    updateMaintenance: (token: string, maintenance_mode: boolean, maintenance_msg: string) =>
        apiFetch("/sysadmin/settings/maintenance", {
            method: "PATCH",
            body: JSON.stringify({ maintenance_mode, maintenance_msg }),
        }, token),

    updateSemester: (token: string, school_year: string, current_semester: number) =>
        apiFetch("/sysadmin/settings/semester", {
            method: "PATCH",
            body: JSON.stringify({ school_year, current_semester }),
        }, token),

    // Accounts
    getAccounts: (token: string) =>
        apiFetch("/sysadmin/accounts", {}, token),

    createAccount: (token: string, data: { firstName: string; lastName: string; email: string; password: string; role: string; programId?: number | null; position?: string }) =>
        apiFetch("/sysadmin/accounts", {
            method: "POST",
            body: JSON.stringify(data),
        }, token),

    updateAccount: (token: string, userId: number, data: {
        firstName: string; lastName: string; email: string;
        roleId: number; programId?: number | null; position: string; password?: string;
    }) =>
        apiFetch(`/sysadmin/accounts/${userId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }, token),

    updateAccountStatus: (token: string, userId: number, status: string) =>
        apiFetch(`/sysadmin/accounts/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }, token),

    deleteAccount: (token: string, userId: number) =>
        apiFetch(`/sysadmin/accounts/${userId}`, { method: "DELETE" }, token),

    // Year Advancement
    previewAdvancement: (token: string) =>
        apiFetch("/sysadmin/students/advancement-preview", {}, token),

    executeAdvancement: (token: string, newSchoolYear: string) =>
        apiFetch("/sysadmin/students/advance-year", {
            method: "POST",
            body: JSON.stringify({ new_school_year: newSchoolYear }),
        }, token),

    // Audit Logs
    getAuditLogs: (token: string, page = 1, limit = 50) =>
        apiFetch(`/sysadmin/audit-logs?page=${page}&limit=${limit}`, {}, token),

    // Programs
    getPrograms: (token: string) =>
        apiFetch<{ program_id: number; name: string; code: string }[]>("/sysadmin/programs", {}, token),
};
