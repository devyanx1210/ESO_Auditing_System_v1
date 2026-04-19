import { apiFetch } from "./api";

const BASE_URL = "/api/v1";

export interface ObligationData {
    obligationId: number;
    obligationName: string;
    description: string | null;
    amount: number;
    requiresPayment: boolean;
    gcashQrPath: string | null;
    isRequired: boolean;
    scope: number;
    programId: number | null;
    programName: string | null;
    yearLevel: number | null;
    section: string | null;
    schoolYear: string;
    semester: number;
    dueDate: string | null;
    isActive: boolean;
    createdAt: string;
    createdByName: string | null;
}

export interface CreateObligationInput {
    obligationName: string;
    description?: string;
    amount: number;
    gcashQrPath?: string | null;
    isRequired?: boolean;
    scope: number;
    programId?: number | null;
    yearLevel?: number | null;
    section?: string | null;
    schoolYear: string;
    semester: number;
    dueDate?: string | null;
}

function buildFormData(data: CreateObligationInput, qrFile?: File | null): FormData {
    const fd = new FormData();
    fd.append("obligationName", data.obligationName);
    fd.append("amount", String(data.amount));
    fd.append("scope", String(data.scope));
    fd.append("schoolYear", data.schoolYear);
    fd.append("semester", String(data.semester));
    if (data.description) fd.append("description", data.description);
    if (data.isRequired !== undefined) fd.append("isRequired", String(data.isRequired));
    if (data.programId != null) fd.append("programId", String(data.programId));
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
    return `/uploads/${path}`;
}
