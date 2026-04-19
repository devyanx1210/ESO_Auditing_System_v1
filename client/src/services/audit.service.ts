import { apiFetch } from "./api";

export interface AuditSummary {
    totalIncome:    number;
    totalPotential: number;
    totalExpenses:  number;
    netBalance:     number;
    expenseCount:   number;
    incomeCount:    number;
}

export interface IncomeItem {
    paymentId:      number;
    studentName:    string;
    studentNo:      string;
    programCode:    string;
    obligationName: string;
    amountPaid:     number;
    paymentType:    number;   // 1=GCash, 2=Cash
    semester:       number;
    schoolYear:     string;
    verifiedAt:     string | null;
    verifiedByName: string | null;
}

export interface ExpenseItem {
    expenseId:      number;
    title:          string;
    description:    string | null;
    amount:         number;
    semester:       number;
    schoolYear:     string;
    recordedByName: string;
    receiptPath:    string | null;
    createdAt:      string;
}

export interface ChartDataPoint {
    label:    string;
    income:   number;
    expenses: number;
}

export interface LedgerEntry {
    date:        string;
    type:        "income" | "expense";
    reference:   string;
    description: string;
    amount:      number;
    balance:     number;
    semester:    number;
    schoolYear:  string;
    receiptPath: string | null;
}

export interface BudgetItem {
    budgetId:        number;
    title:           string;
    description:     string | null;
    allocatedAmount: number;
    actualAmount:    number;
    variance:        number;
    semester:        number;
    schoolYear:      string;
    createdByName:   string;
    createdAt:       string;
}

function buildQuery(semester: number | null, schoolYear: string | null): string {
    const parts: string[] = [];
    if (semester)   parts.push(`semester=${semester}`);
    if (schoolYear) parts.push(`school_year=${encodeURIComponent(schoolYear)}`);
    return parts.length ? "?" + parts.join("&") : "";
}

export const auditService = {
    getSummary: (token: string, semester: number | null, schoolYear: string | null) =>
        apiFetch<AuditSummary>(`/admin/audit/summary${buildQuery(semester, schoolYear)}`, {}, token),

    getIncome: (token: string, semester: number | null, schoolYear: string | null) =>
        apiFetch<IncomeItem[]>(`/admin/audit/income${buildQuery(semester, schoolYear)}`, {}, token),

    getExpenses: (token: string, semester: number | null, schoolYear: string | null) =>
        apiFetch<ExpenseItem[]>(`/admin/audit/expenses${buildQuery(semester, schoolYear)}`, {}, token),

    getChart: (token: string, schoolYear: string | null) =>
        apiFetch<ChartDataPoint[]>(`/admin/audit/chart${schoolYear ? `?school_year=${encodeURIComponent(schoolYear)}` : ""}`, {}, token),

    getSchoolYears: (token: string) =>
        apiFetch<string[]>("/admin/audit/school-years", {}, token),

    createExpense: (token: string, data: { title: string; description?: string; amount: number; semester: number; school_year: string }) =>
        apiFetch<{ expenseId: number }>("/admin/audit/expenses", {
            method: "POST",
            body: JSON.stringify(data),
        }, token),

    updateExpense: (token: string, id: number, data: { title: string; description?: string; amount: number; semester: number; school_year: string }) =>
        apiFetch<{ ok: boolean }>(`/admin/audit/expenses/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }, token),

    deleteExpense: (token: string, id: number) =>
        apiFetch<{ ok: boolean }>(`/admin/audit/expenses/${id}`, {
            method: "DELETE",
        }, token),

    getLedger: (token: string, semester: number | null, schoolYear: string | null) =>
        apiFetch<LedgerEntry[]>(`/admin/audit/ledger${buildQuery(semester, schoolYear)}`, {}, token),

    getBudgets: (token: string, semester: number | null, schoolYear: string | null) =>
        apiFetch<BudgetItem[]>(`/admin/audit/budgets${buildQuery(semester, schoolYear)}`, {}, token),

    createBudget: (token: string, data: { title: string; description?: string; allocated_amount: number; semester: number; school_year: string }) =>
        apiFetch<{ budgetId: number }>("/admin/audit/budgets", {
            method: "POST",
            body: JSON.stringify(data),
        }, token),

    updateBudget: (token: string, id: number, data: { title: string; description?: string; allocated_amount: number; semester: number; school_year: string }) =>
        apiFetch<{ ok: boolean }>(`/admin/audit/budgets/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }, token),

    deleteBudget: (token: string, id: number) =>
        apiFetch<{ ok: boolean }>(`/admin/audit/budgets/${id}`, {
            method: "DELETE",
        }, token),
};
