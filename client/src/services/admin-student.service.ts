import { apiFetch } from "./api";

export interface AdminStudentItem {
    studentId: number;
    userId: number;
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
    obligationsPending: number;
    clearanceStatus: string | null;
}

export interface AdminObligationItem {
    studentObligationId: number;
    obligationId: number;
    obligationName: string;
    amount: number;
    requiresPayment: boolean;
    dueDate: string | null;
    isOverdue: boolean;
    status: "unpaid" | "pending_verification" | "paid" | "waived";
    paymentType: "gcash" | "cash" | null;
    paymentId: number | null;
    receiptPath: string | null;
    amountPaid: number | null;
    paymentStatus: "pending" | "approved" | "rejected" | null;
    submittedAt: string | null;
    remarks: string | null;
}

export interface PendingPaymentItem {
    paymentId: number;
    studentObligationId: number;
    studentName: string;
    studentNo: string;
    departmentCode: string;
    obligationName: string;
    amountPaid: number;
    receiptPath: string;
    notes: string | null;
    submittedAt: string;
}

const UPLOADS = "http://localhost:5000/uploads";
export const receiptUrl = (path: string) => `${UPLOADS}/${path}`;

export const adminStudentService = {
    listStudents: (token: string) =>
        apiFetch<AdminStudentItem[]>("/admin/students", {}, token),

    getStudentObligations: (token: string, studentId: number) =>
        apiFetch<AdminObligationItem[]>(`/admin/students/${studentId}/obligations`, {}, token),

    getPendingPayments: (token: string) =>
        apiFetch<PendingPaymentItem[]>("/admin/payments/pending", {}, token),

    verifyPayment: (token: string, paymentId: number, status: "approved" | "rejected", remarks: string) =>
        apiFetch<null>(`/admin/payments/${paymentId}/verify`, {
            method: "PATCH",
            body: JSON.stringify({ status, remarks }),
        }, token),

    recordCash: (token: string, studentObligationId: number, amountPaid: number, notes: string) =>
        apiFetch<null>("/admin/payments/cash", {
            method: "POST",
            body: JSON.stringify({ studentObligationId, amountPaid, notes }),
        }, token),

    verifyAll: (token: string) =>
        apiFetch<{ count: number }>("/admin/payments/verify-all", { method: "POST" }, token),

    // Clearance
    getPendingClearance: (token: string) =>
        apiFetch<PendingClearanceItem[]>("/admin/clearance/pending", {}, token),

    signClearance: (token: string, studentId: number, remarks: string) =>
        apiFetch<null>(`/admin/clearance/${studentId}/sign`, {
            method: "POST",
            body: JSON.stringify({ remarks }),
        }, token),

    signAllClearance: (token: string) =>
        apiFetch<{ count: number }>("/admin/clearance/sign-all", { method: "POST" }, token),

    getPaymentHistory: (token: string) =>
        apiFetch<PaymentHistoryItem[]>("/admin/payments/history", {}, token),

    getClearanceHistory: (token: string) =>
        apiFetch<ClearanceHistoryItem[]>("/admin/clearance/history", {}, token),
};

export interface PaymentHistoryItem {
    paymentId: number;
    studentName: string;
    studentNo: string;
    departmentCode: string;
    obligationName: string;
    amountPaid: number;
    paymentType: "gcash" | "cash";
    paymentStatus: "approved" | "rejected";
    notes: string | null;
    submittedAt: string;
    verifiedAt: string | null;
    remarks: string | null;
}

export interface ClearanceHistoryItem {
    clearanceId: number;
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    departmentCode: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: string;
    clearanceStatus: string;
    signedAt: string;
    remarks: string | null;
}

export interface PendingClearanceItem {
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
    clearanceId: number | null;
    clearanceStatus: string | null;
    currentStep: number | null;
    obligationsTotal: number;
    obligationsPaid: number;
}
