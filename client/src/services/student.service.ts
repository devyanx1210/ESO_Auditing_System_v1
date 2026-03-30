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
    semester: number;
    programName: string;
    programCode: string;
    obligationsTotal: number;
    obligationsPaid: number;
    clearanceStatus: number | null;
}

export interface StudentProfile {
    studentId:     number;
    studentNo:     string;
    firstName:     string;
    lastName:      string;
    middleName:    string | null;
    email:         string;
    programCode:   string;
    programName:   string;
    yearLevel:     number;
    section:       string;
    schoolYear:    string;
    semester:      number;
    gender:        number | null;
    avatarPath:    string | null;
    address:       string | null;
    contactNumber: string | null;
    guardianName:  string | null;
    shirtSize:     string | null;
}

export function avatarUrl(p: string | null | undefined): string | null {
    if (!p) return null;
    return `${UPLOADS_BASE}/${p.replace(/^\/uploads\//, "")}`;
}

export interface LatestPayment {
    paymentId: number;
    receiptPath: string;
    amountPaid: number;
    paymentStatus: number;
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
    status: number;
    proofImage: string | null;
    latestPayment: LatestPayment | null;
}

export interface ClearanceStep {
    stepOrder: number;
    roleLabel: string;
    status: number;
    verifiedAt: string | null;
    remarks: string | null;
}

export interface StudentClearance {
    clearanceId: number | null;
    status: number | null;
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

    updateProfile: (
        token: string,
        data: {
            firstName: string; lastName: string; middleName?: string;
            yearLevel: number; section: string;
            schoolYear: string; semester: number;
            gender?: number | null;
            address: string; contactNumber: string;
            guardianName: string; shirtSize: string;
        },
        avatarFile?: File | null,
    ) => {
        const form = new FormData();
        form.append("firstName",     data.firstName);
        form.append("lastName",      data.lastName);
        if (data.middleName !== undefined) form.append("middleName", data.middleName);
        form.append("yearLevel",     String(data.yearLevel));
        form.append("section",       data.section);
        form.append("schoolYear",    data.schoolYear);
        form.append("semester",      String(data.semester));
        if (data.gender !== undefined && data.gender !== null) form.append("gender", String(data.gender));
        form.append("address",       data.address);
        form.append("contactNumber", data.contactNumber);
        form.append("guardianName",  data.guardianName);
        form.append("shirtSize",     data.shirtSize);
        if (avatarFile) form.append("avatar", avatarFile);
        return apiFetch<StudentProfile>("/students/me/profile", {
            method: "PATCH",
            body: form,
        }, token);
    },

    getMyObligations: (token: string) =>
        apiFetch<StudentObligationItem[]>("/students/me/obligations", {}, token),

    getMyClearance: (token: string) =>
        apiFetch<StudentClearance>("/students/me/clearance", {}, token),
};
