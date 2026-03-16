import { apiFetch } from "./api";

const UPLOADS_BASE = "http://localhost:5000/uploads";

export interface StudentListItem {
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: string;
    departmentName: string;
    departmentCode: string;
    obligationsTotal: number;
    obligationsPaid: number;
    clearanceStatus: string | null;
}

export interface StudentProfile {
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    departmentCode: string;
    departmentName: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: string;
}

export interface LatestPayment {
    paymentId: number;
    receiptPath: string;
    amountPaid: number;
    paymentStatus: "pending" | "approved" | "rejected";
    submittedAt: string;
    remarks: string | null;
}

export interface StudentObligationItem {
    studentObligationId: number;
    obligationId: number;
    obligationName: string;
    description: string | null;
    amount: number;
    requiresPayment: boolean;
    gcashQrPath: string | null;
    dueDate: string | null;
    isOverdue: boolean;
    status: "unpaid" | "pending_verification" | "paid" | "waived";
    latestPayment: LatestPayment | null;
}

export interface ClearanceStep {
    stepOrder: number;
    roleLabel: string;
    status: "pending" | "signed" | "rejected";
    verifiedAt: string | null;
    remarks: string | null;
}

export interface StudentClearance {
    clearanceId: number | null;
    status: "pending" | "in_progress" | "cleared" | "rejected" | null;
    currentStep: number;
    steps: ClearanceStep[];
}

export function receiptUrl(path: string): string {
    return `${UPLOADS_BASE}/${path}`;
}

export const studentService = {
    getAll: (token: string) =>
        apiFetch<StudentListItem[]>("/students", {}, token),

    getProfile: (token: string) =>
        apiFetch<StudentProfile>("/students/me/profile", {}, token),

    updateProfile: (token: string, data: { firstName: string; lastName: string; yearLevel: number; section: string; schoolYear: string; semester: string }) =>
        apiFetch<StudentProfile>("/students/me/profile", {
            method: "PATCH",
            body: JSON.stringify(data),
        }, token),

    getMyObligations: (token: string) =>
        apiFetch<StudentObligationItem[]>("/students/me/obligations", {}, token),

    getMyClearance: (token: string) =>
        apiFetch<StudentClearance>("/students/me/clearance", {}, token),
};
