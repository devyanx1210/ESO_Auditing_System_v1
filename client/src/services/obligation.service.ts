import { apiFetch } from "./api";

const BASE_URL = "http://localhost:5000/api/v1";

export interface ObligationData {
    obligationId: number;
    obligationName: string;
    description: string | null;
    amount: number;
    requiresPayment: boolean;
    gcashQrPath: string | null;
    isRequired: boolean;
    scope: "all" | "department" | "year_level" | "section";
    departmentId: number | null;
    departmentName: string | null;
    yearLevel: number | null;
    section: string | null;
    schoolYear: string;
    semester: string;
    dueDate: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CreateObligationInput {
    obligationName: string;
    description?: string;
    amount: number;
    gcashQrPath?: string | null;
    isRequired?: boolean;
    scope: "all" | "department" | "year_level" | "section";
    departmentId?: number | null;
    yearLevel?: number | null;
    section?: string | null;
    schoolYear: string;
    semester: "1st" | "2nd" | "Summer";
    dueDate?: string | null;
}

function buildFormData(data: CreateObligationInput, qrFile?: File | null): FormData {
    const fd = new FormData();
    fd.append("obligationName", data.obligationName);
    fd.append("amount", String(data.amount));
    fd.append("scope", data.scope);
    fd.append("schoolYear", data.schoolYear);
    fd.append("semester", data.semester);
    if (data.description) fd.append("description", data.description);
    if (data.isRequired !== undefined) fd.append("isRequired", String(data.isRequired));
    if (data.departmentId != null) fd.append("departmentId", String(data.departmentId));
    if (data.yearLevel != null) fd.append("yearLevel", String(data.yearLevel));
    if (data.section) fd.append("section", data.section);
    if (data.dueDate) fd.append("dueDate", data.dueDate);
    if (qrFile) fd.append("qrCode", qrFile);
    return fd;
}

async function apiFetchForm<T>(path: string, method: string, body: FormData, token: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Request failed");
    return json.data;
}

export const obligationService = {
    getAll: (token: string) =>
        apiFetch<ObligationData[]>("/obligations", {}, token),

    create: (token: string, data: CreateObligationInput, qrFile?: File | null) =>
        apiFetchForm<ObligationData>("/obligations", "POST", buildFormData(data, qrFile), token),

    update: (token: string, id: number, data: Partial<CreateObligationInput>, qrFile?: File | null) =>
        apiFetchForm<null>(`/obligations/${id}`, "PUT", buildFormData(data as CreateObligationInput, qrFile), token),

    remove: (token: string, id: number) =>
        apiFetch<null>(`/obligations/${id}`, { method: "DELETE" }, token),

    sync: (token: string, id: number) =>
        apiFetch<{ inserted: number }>(`/obligations/${id}/sync`, { method: "POST" }, token),
};

export function qrUrl(path: string): string {
    return `http://localhost:5000/uploads/${path}`;
}
