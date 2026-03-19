import { apiFetch } from "./api";

export interface AdminUserItem {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    roleLabel: string;
    programName: string | null;
    position: string;
    status: string;
    createdAt: string;
}

export interface CreateAdminInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "eso_officer" | "class_officer" | "program_head" | "signatory" | "dean";
    programId?: number | null;
    position: string;
}

export const userService = {
    createAdmin: (token: string, data: CreateAdminInput) =>
        apiFetch<AdminUserItem>("/users/admin", {
            method: "POST",
            body: JSON.stringify(data),
        }, token),

    getAdmins: (token: string) =>
        apiFetch<AdminUserItem[]>("/users/admins", {}, token),

    deleteAdmin: (token: string, userId: number) =>
        apiFetch<null>(`/users/admin/${userId}`, { method: "DELETE" }, token),

    toggleAdmin: (token: string, userId: number) =>
        apiFetch<{ status: string }>(`/users/admin/${userId}/toggle`, { method: "PATCH" }, token),
};
