import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import * as auditService from "../services/audit-finance.service.js";

function parseSemester(v: any): number | null {
    const n = Number(v);
    return [1, 2, 3].includes(n) ? n : null;
}
function parseSchoolYear(v: any): string | null {
    if (typeof v === "string" && /^\d{4}-\d{4}$/.test(v.trim())) return v.trim();
    return null;
}

// GET /admin/audit/summary
export const getSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const semester   = parseSemester(req.query.semester);
        const schoolYear = parseSchoolYear(req.query.school_year);
        const data = await auditService.getAuditSummary(semester, schoolYear);
        sendSuccess(res, data);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// GET /admin/audit/income
export const getIncome = async (req: Request, res: Response): Promise<void> => {
    try {
        const semester   = parseSemester(req.query.semester);
        const schoolYear = parseSchoolYear(req.query.school_year);
        const data = await auditService.getIncomeList(semester, schoolYear);
        sendSuccess(res, data);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// GET /admin/audit/expenses
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
        const semester   = parseSemester(req.query.semester);
        const schoolYear = parseSchoolYear(req.query.school_year);
        const data = await auditService.getExpenseList(semester, schoolYear);
        sendSuccess(res, data);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// GET /admin/audit/chart
export const getChart = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolYear = parseSchoolYear(req.query.school_year);
        const data = await auditService.getChartData(schoolYear);
        sendSuccess(res, data);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// GET /admin/audit/school-years
export const getSchoolYears = async (_req: Request, res: Response): Promise<void> => {
    try {
        const data = await auditService.getSchoolYears();
        sendSuccess(res, data);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// POST /admin/audit/expenses
export const createExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { title, description, amount, semester, school_year } = req.body;
        if (!title || !amount || !semester || !school_year)
            return sendError(res, "title, amount, semester, and school_year are required", 400) as any;
        const sem = parseSemester(semester);
        if (!sem) return sendError(res, "semester must be 1, 2, or 3", 400) as any;
        const sy  = parseSchoolYear(school_year);
        if (!sy)  return sendError(res, "school_year must be in format YYYY-YYYY", 400) as any;

        const id = await auditService.addExpense(
            userId, title, description ?? null, Number(amount), sem, sy, null
        );
        sendSuccess(res, { expenseId: id }, "Created", 201);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// PUT /admin/audit/expenses/:id
export const editExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const { title, description, amount, semester, school_year } = req.body;
        if (!title || !amount || !semester || !school_year)
            return sendError(res, "title, amount, semester, and school_year are required", 400) as any;
        const sem = parseSemester(semester);
        if (!sem) return sendError(res, "semester must be 1, 2, or 3", 400) as any;
        const sy  = parseSchoolYear(school_year);
        if (!sy)  return sendError(res, "school_year must be in format YYYY-YYYY", 400) as any;

        await auditService.updateExpense(id, title, description ?? null, Number(amount), sem, sy);
        sendSuccess(res, { ok: true });
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// DELETE /admin/audit/expenses/:id
export const removeExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        await auditService.deleteExpense(Number(req.params.id));
        sendSuccess(res, { ok: true });
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// GET /admin/audit/ledger
export const getLedger = async (req: Request, res: Response): Promise<void> => {
    try {
        const semester   = parseSemester(req.query.semester);
        const schoolYear = parseSchoolYear(req.query.school_year);
        const data = await auditService.getLedger(semester, schoolYear);
        sendSuccess(res, data);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// GET /admin/audit/budgets
export const getBudgets = async (req: Request, res: Response): Promise<void> => {
    try {
        const semester   = parseSemester(req.query.semester);
        const schoolYear = parseSchoolYear(req.query.school_year);
        const data = await auditService.getBudgets(semester, schoolYear);
        sendSuccess(res, data);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// POST /admin/audit/budgets
export const createBudget = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { title, description, allocated_amount, semester, school_year } = req.body;
        if (!title || !allocated_amount || !semester || !school_year)
            return sendError(res, "title, allocated_amount, semester, and school_year are required", 400) as any;
        const sem = parseSemester(semester);
        if (!sem) return sendError(res, "semester must be 1, 2, or 3", 400) as any;
        const sy  = parseSchoolYear(school_year);
        if (!sy)  return sendError(res, "school_year must be YYYY-YYYY", 400) as any;
        const id = await auditService.addBudget(userId, title, description ?? null, Number(allocated_amount), sem, sy);
        sendSuccess(res, { budgetId: id }, "Created", 201);
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// PUT /admin/audit/budgets/:id
export const editBudget = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const { title, description, allocated_amount, semester, school_year } = req.body;
        if (!title || !allocated_amount || !semester || !school_year)
            return sendError(res, "title, allocated_amount, semester, and school_year are required", 400) as any;
        const sem = parseSemester(semester);
        if (!sem) return sendError(res, "semester must be 1, 2, or 3", 400) as any;
        const sy  = parseSchoolYear(school_year);
        if (!sy)  return sendError(res, "school_year must be YYYY-YYYY", 400) as any;
        await auditService.updateBudget(id, title, description ?? null, Number(allocated_amount), sem, sy);
        sendSuccess(res, { ok: true });
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};

// DELETE /admin/audit/budgets/:id
export const removeBudget = async (req: Request, res: Response): Promise<void> => {
    try {
        await auditService.deleteBudget(Number(req.params.id));
        sendSuccess(res, { ok: true });
    } catch (e: any) {
        sendError(res, e.message, 500);
    }
};
