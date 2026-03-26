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
    programName: string;
    programCode: string;
    obligationsTotal: number;
    obligationsPaid: number;
    obligationsPending: number;
    clearanceStatus: string | null;
    avatarPath: string | null;
    address: string | null;
    contactNumber: string | null;
    guardianName: string | null;
    emergencyContact: string | null;
    shirtSize: string | null;
    email: string | null;
    userStatus: "active" | "inactive" | "suspended";
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
    proofImage: string | null;
    paymentType: "gcash" | "cash" | null;
    paymentId: number | null;
    receiptPath: string | null;
    amountPaid: number | null;
    paymentStatus: "pending" | "approved" | "rejected" | null;
    submittedAt: string | null;
    remarks: string | null;
    verifiedByName: string | null;
    verifiedByRole: string | null;
    verifiedAt: string | null;
}

export interface PendingPaymentItem {
    paymentId: number;
    studentObligationId: number;
    studentName: string;
    studentNo: string;
    programCode: string;
    obligationName: string;
    amountPaid: number;
    receiptPath: string;
    notes: string | null;
    submittedAt: string;
    avatarPath: string | null;
}

// Cloudinary URLs are already absolute; legacy local paths get the uploads prefix
export const receiptUrl = (p: string) =>
    p.startsWith("http") ? p : `http://localhost:5000/uploads/${p}`;

export const avatarUrl = (p: string) =>
    p.startsWith("http") ? p : `http://localhost:5000/uploads/${p}`;

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

    bulkVerify: (token: string, paymentIds: number[]) =>
        apiFetch<{ count: number }>("/admin/payments/bulk-verify", {
            method: "POST",
            body: JSON.stringify({ paymentIds }),
        }, token),

    bulkUnverify: (token: string, paymentIds: number[]) =>
        apiFetch<{ count: number }>("/admin/payments/bulk-unverify", {
            method: "POST",
            body: JSON.stringify({ paymentIds }),
        }, token),

    bulkDelete: (token: string, paymentIds: number[]) =>
        apiFetch<{ count: number }>("/admin/payments/bulk-delete", {
            method: "POST",
            body: JSON.stringify({ paymentIds }),
        }, token),

    verifyProof: (token: string, studentObligationId: number, status: "paid" | "unpaid") =>
        apiFetch<null>(`/admin/students/obligations/${studentObligationId}/verify-proof`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }, token),

    unapproveHistory: (token: string, clearanceIds: number[]) =>
        apiFetch<{ count: number }>("/admin/clearance/unapprove", {
            method: "POST",
            body: JSON.stringify({ clearanceIds }),
        }, token),

    deleteClearanceHistory: (token: string, clearanceIds: number[]) =>
        apiFetch<{ count: number }>("/admin/clearance/delete", {
            method: "POST",
            body: JSON.stringify({ clearanceIds }),
        }, token),
};

export interface PaymentHistoryItem {
    paymentId: number;
    studentName: string;
    studentNo: string;
    programCode: string;
    obligationName: string;
    amountPaid: number;
    paymentType: "gcash" | "cash";
    paymentStatus: "approved" | "rejected";
    notes: string | null;
    submittedAt: string;
    verifiedAt: string | null;
    verifiedByName: string | null;
    verifiedByRole: string | null;
    remarks: string | null;
    avatarPath: string | null;
}

export interface ClearanceHistoryItem {
    clearanceId: number;
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    programCode: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: string;
    clearanceStatus: string;
    signedAt: string;
    remarks: string | null;
    avatarPath: string | null;
}

export interface PendingClearanceItem {
    studentId: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    programCode: string;
    programName: string;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: string;
    clearanceId: number | null;
    clearanceStatus: string | null;
    currentStep: number | null;
    obligationsTotal: number;
    obligationsPaid: number;
    avatarPath: string | null;
}
