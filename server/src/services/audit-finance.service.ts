import pool from "../config/db.js";

// Types

export interface AuditSummary {
    totalIncome:    number;
    totalPotential: number;   // total amount due across all assigned student_obligations
    totalExpenses:  number;
    netBalance:     number;
    expenseCount:   number;
    incomeCount:    number;
}

export interface IncomeItem {
    paymentId:       number;
    studentName:     string;
    studentNo:       string;
    programCode:     string;
    obligationName:  string;
    amountPaid:      number;
    paymentType:     number;   // 1=GCash, 2=Cash
    semester:        number;
    schoolYear:      string;
    verifiedAt:      string | null;
    verifiedByName:  string | null;
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
    label:    string;  // e.g. "2024-2025 S1"
    income:   number;
    expenses: number;
}

// Summary

export const getAuditSummary = async (
    semester: number | null,
    schoolYear: string | null
): Promise<AuditSummary> => {
    const incParams: any[] = [];
    let incomeWhere = "WHERE ps.payment_status = 1";
    if (semester)   { incomeWhere += " AND o.semester = ?";    incParams.push(semester); }
    if (schoolYear) { incomeWhere += " AND o.school_year = ?"; incParams.push(schoolYear); }

    const expParams: any[] = [];
    let expWhere = "WHERE e.deleted_at IS NULL";
    if (semester)   { expWhere += " AND e.semester = ?";    expParams.push(semester); }
    if (schoolYear) { expWhere += " AND e.school_year = ?"; expParams.push(schoolYear); }

    const [[incRow]]: any = await pool.execute(
        `SELECT COALESCE(SUM(ps.amount_paid),0) AS total, COUNT(*) AS cnt
         FROM payment_submissions ps
         JOIN student_obligations so ON so.student_obligation_id = ps.student_obligation_id
         JOIN obligations o ON o.obligation_id = so.obligation_id
         ${incomeWhere}`,
        incParams
    );

    // Total potential = sum of all amount_due across all assigned student_obligations for the period
    const potParams: any[] = [];
    let potWhere = "WHERE 1=1";
    if (semester)   { potWhere += " AND o.semester = ?";    potParams.push(semester); }
    if (schoolYear) { potWhere += " AND o.school_year = ?"; potParams.push(schoolYear); }
    const [[potRow]]: any = await pool.execute(
        `SELECT COALESCE(SUM(so.amount_due),0) AS total
         FROM student_obligations so
         JOIN obligations o ON o.obligation_id = so.obligation_id
         ${potWhere}`,
        potParams
    );

    const [[expRow]]: any = await pool.execute(
        `SELECT COALESCE(SUM(e.amount),0) AS total, COUNT(*) AS cnt
         FROM expenses e
         ${expWhere}`,
        expParams
    );

    const totalIncome    = Number(incRow.total);
    const totalPotential = Number(potRow.total);
    const totalExpenses  = Number(expRow.total);

    return {
        totalIncome,
        totalPotential,
        totalExpenses,
        netBalance:   totalIncome - totalExpenses,
        expenseCount: Number(expRow.cnt),
        incomeCount:  Number(incRow.cnt),
    };
};

// Income list

export const getIncomeList = async (
    semester: number | null,
    schoolYear: string | null
): Promise<IncomeItem[]> => {
    let sql = `
        SELECT
            ps.payment_id       AS paymentId,
            CONCAT(s.first_name, ' ', s.last_name) AS studentName,
            s.student_no        AS studentNo,
            p.code              AS programCode,
            o.obligation_name   AS obligationName,
            ps.amount_paid      AS amountPaid,
            ps.payment_type     AS paymentType,
            o.semester          AS semester,
            o.school_year       AS schoolYear,
            pv.verified_at      AS verifiedAt,
            CONCAT(vu.first_name, ' ', vu.last_name) AS verifiedByName
        FROM payment_submissions ps
        JOIN student_obligations so ON so.student_obligation_id = ps.student_obligation_id
        JOIN students s   ON s.student_id    = ps.student_id
        JOIN programs p   ON p.program_id    = s.program_id
        JOIN obligations o ON o.obligation_id = so.obligation_id
        LEFT JOIN payment_verifications pv ON pv.payment_id = ps.payment_id
        LEFT JOIN admins a   ON a.admin_id   = pv.admin_id
        LEFT JOIN users vu   ON vu.user_id   = a.user_id
        WHERE ps.payment_status = 1
    `;
    const params: any[] = [];
    if (semester)   { sql += " AND o.semester = ?";    params.push(semester); }
    if (schoolYear) { sql += " AND o.school_year = ?"; params.push(schoolYear); }
    sql += " ORDER BY pv.verified_at DESC";

    const [rows]: any = await pool.execute(sql, params);
    return rows.map((r: any) => ({
        ...r,
        amountPaid: Number(r.amountPaid),
        semester:   Number(r.semester),
    }));
};

// Expenses list

export const getExpenseList = async (
    semester: number | null,
    schoolYear: string | null
): Promise<ExpenseItem[]> => {
    let sql = `
        SELECT
            e.expense_id     AS expenseId,
            e.title,
            e.description,
            e.amount,
            e.semester,
            e.school_year    AS schoolYear,
            e.receipt_path   AS receiptPath,
            e.created_at     AS createdAt,
            CONCAT(u.first_name, ' ', u.last_name) AS recordedByName
        FROM expenses e
        JOIN users u ON u.user_id = e.recorded_by
        WHERE e.deleted_at IS NULL
    `;
    const params: any[] = [];
    if (semester)   { sql += " AND e.semester = ?";    params.push(semester); }
    if (schoolYear) { sql += " AND e.school_year = ?"; params.push(schoolYear); }
    sql += " ORDER BY e.created_at DESC";

    const [rows]: any = await pool.execute(sql, params);
    return rows.map((r: any) => ({
        ...r,
        amount:   Number(r.amount),
        semester: Number(r.semester),
    }));
};

// Chart data (income vs expenses per semester-year)

export const getChartData = async (schoolYear: string | null): Promise<ChartDataPoint[]> => {
    const incomeParams: any[] = [];
    let incomeSql = `
        SELECT o.school_year AS schoolYear, o.semester, COALESCE(SUM(ps.amount_paid),0) AS total
        FROM payment_submissions ps
        JOIN student_obligations so ON so.student_obligation_id = ps.student_obligation_id
        JOIN obligations o ON o.obligation_id = so.obligation_id
        WHERE ps.payment_status = 1
    `;
    if (schoolYear) { incomeSql += " AND o.school_year = ?"; incomeParams.push(schoolYear); }
    incomeSql += " GROUP BY o.school_year, o.semester ORDER BY o.school_year, o.semester";

    const expParams: any[] = [];
    let expSql = `
        SELECT school_year AS schoolYear, semester, COALESCE(SUM(amount),0) AS total
        FROM expenses
        WHERE deleted_at IS NULL
    `;
    if (schoolYear) { expSql += " AND school_year = ?"; expParams.push(schoolYear); }
    expSql += " GROUP BY school_year, semester ORDER BY school_year, semester";

    const [[incRows], [expRows]]: any = await Promise.all([
        pool.execute(incomeSql, incomeParams),
        pool.execute(expSql,    expParams),
    ]);

    // Build a unified map keyed by "YYYY-YYYY|S"
    const semLabel = (s: number) => s === 1 ? "1st Sem" : s === 2 ? "2nd Sem" : "Summer";
    const map = new Map<string, ChartDataPoint>();

    for (const r of incRows) {
        const key   = `${r.schoolYear}|${r.semester}`;
        const label = `${r.schoolYear} ${semLabel(Number(r.semester))}`;
        if (!map.has(key)) map.set(key, { label, income: 0, expenses: 0 });
        map.get(key)!.income = Number(r.total);
    }
    for (const r of expRows) {
        const key   = `${r.schoolYear}|${r.semester}`;
        const label = `${r.schoolYear} ${semLabel(Number(r.semester))}`;
        if (!map.has(key)) map.set(key, { label, income: 0, expenses: 0 });
        map.get(key)!.expenses = Number(r.total);
    }

    return Array.from(map.values());
};

// Add expense

export const addExpense = async (
    userId: number,
    title: string,
    description: string | null,
    amount: number,
    semester: number,
    schoolYear: string,
    receiptPath: string | null
): Promise<number> => {
    const [result]: any = await pool.execute(
        `INSERT INTO expenses (title, description, amount, semester, school_year, recorded_by, receipt_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description ?? null, amount, semester, schoolYear, userId, receiptPath ?? null]
    );
    return result.insertId;
};

// Edit expense

export const updateExpense = async (
    expenseId: number,
    title: string,
    description: string | null,
    amount: number,
    semester: number,
    schoolYear: string
): Promise<void> => {
    await pool.execute(
        `UPDATE expenses SET title=?, description=?, amount=?, semester=?, school_year=?, updated_at=NOW()
         WHERE expense_id=? AND deleted_at IS NULL`,
        [title, description ?? null, amount, semester, schoolYear, expenseId]
    );
};

// Delete (soft) expense

export const deleteExpense = async (expenseId: number): Promise<void> => {
    await pool.execute(
        "UPDATE expenses SET deleted_at=NOW() WHERE expense_id=?",
        [expenseId]
    );
};

// Fund Ledger (all transactions, chronological, with running balance)

export interface LedgerEntry {
    date:        string;
    type:        "income" | "expense";
    reference:   string;   // obligation name OR expense title
    description: string;   // student name (income) OR description (expense)
    amount:      number;
    balance:     number;   // running balance at this point
    semester:    number;
    schoolYear:  string;
    receiptPath: string | null;
}

export const getLedger = async (
    semester: number | null,
    schoolYear: string | null
): Promise<LedgerEntry[]> => {
    const incParams: any[] = [];
    let incSql = `
        SELECT
            COALESCE(pv.verified_at, ps.submitted_at) AS txdate,
            'income'                                   AS type,
            o.obligation_name                          AS reference,
            CONCAT(s.first_name, ' ', s.last_name)    AS description,
            ps.amount_paid                             AS amount,
            o.semester,
            o.school_year                              AS schoolYear,
            ps.payment_receipt_path                    AS receiptPath
        FROM payment_submissions ps
        JOIN student_obligations so ON so.student_obligation_id = ps.student_obligation_id
        JOIN obligations o  ON o.obligation_id = so.obligation_id
        JOIN students s     ON s.student_id    = ps.student_id
        LEFT JOIN payment_verifications pv ON pv.payment_id = ps.payment_id
        WHERE ps.payment_status = 1
    `;
    if (semester)   { incSql += " AND o.semester = ?";    incParams.push(semester); }
    if (schoolYear) { incSql += " AND o.school_year = ?"; incParams.push(schoolYear); }

    const expParams: any[] = [];
    let expSql = `
        SELECT
            e.created_at      AS txdate,
            'expense'         AS type,
            e.title           AS reference,
            COALESCE(e.description, '')  AS description,
            e.amount,
            e.semester,
            e.school_year     AS schoolYear,
            e.receipt_path    AS receiptPath
        FROM expenses e
        WHERE e.deleted_at IS NULL
    `;
    if (semester)   { expSql += " AND e.semester = ?";    expParams.push(semester); }
    if (schoolYear) { expSql += " AND e.school_year = ?"; expParams.push(schoolYear); }

    const [[incRows], [expRows]]: any = await Promise.all([
        pool.execute(incSql, incParams),
        pool.execute(expSql, expParams),
    ]);

    // Merge and sort oldest-first
    const all: any[] = [
        ...incRows.map((r: any) => ({ ...r, type: "income"  })),
        ...expRows.map((r: any) => ({ ...r, type: "expense" })),
    ].sort((a, b) => new Date(a.txdate).getTime() - new Date(b.txdate).getTime());

    // Compute running balance
    let running = 0;
    return all.map((r: any) => {
        const amt = Number(r.amount);
        running += r.type === "income" ? amt : -amt;
        return {
            date:        r.txdate instanceof Date ? r.txdate.toISOString() : String(r.txdate),
            type:        r.type,
            reference:   r.reference,
            description: r.description,
            amount:      amt,
            balance:     running,
            semester:    Number(r.semester),
            schoolYear:  r.schoolYear,
            receiptPath: r.receiptPath ?? null,
        };
    }).reverse(); // newest first for display
};

// Budgets

export interface BudgetItem {
    budgetId:        number;
    title:           string;
    description:     string | null;
    allocatedAmount: number;
    actualAmount:    number;   // sum of expenses in same semester/year
    variance:        number;   // allocated - actual (positive = under budget)
    semester:        number;
    schoolYear:      string;
    createdByName:   string;
    createdAt:       string;
}

export const getBudgets = async (
    semester: number | null,
    schoolYear: string | null
): Promise<BudgetItem[]> => {
    let sql = `
        SELECT
            b.budget_id         AS budgetId,
            b.title,
            b.description,
            b.allocated_amount  AS allocatedAmount,
            b.semester,
            b.school_year       AS schoolYear,
            b.created_at        AS createdAt,
            CONCAT(u.first_name, ' ', u.last_name) AS createdByName,
            COALESCE((
                SELECT SUM(e.amount) FROM expenses e
                WHERE e.deleted_at IS NULL
                  AND e.semester    = b.semester
                  AND e.school_year = b.school_year
            ), 0) AS actualAmount
        FROM budgets b
        JOIN users u ON u.user_id = b.created_by
        WHERE b.deleted_at IS NULL
    `;
    const params: any[] = [];
    if (semester)   { sql += " AND b.semester = ?";    params.push(semester); }
    if (schoolYear) { sql += " AND b.school_year = ?"; params.push(schoolYear); }
    sql += " ORDER BY b.school_year DESC, b.semester, b.title";

    const [rows]: any = await pool.execute(sql, params);
    return rows.map((r: any) => ({
        ...r,
        allocatedAmount: Number(r.allocatedAmount),
        actualAmount:    Number(r.actualAmount),
        variance:        Number(r.allocatedAmount) - Number(r.actualAmount),
        semester:        Number(r.semester),
    }));
};

export const addBudget = async (
    userId: number, title: string, description: string | null,
    allocatedAmount: number, semester: number, schoolYear: string
): Promise<number> => {
    const [result]: any = await pool.execute(
        `INSERT INTO budgets (title, description, allocated_amount, semester, school_year, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description ?? null, allocatedAmount, semester, schoolYear, userId]
    );
    return result.insertId;
};

export const updateBudget = async (
    budgetId: number, title: string, description: string | null,
    allocatedAmount: number, semester: number, schoolYear: string
): Promise<void> => {
    await pool.execute(
        `UPDATE budgets SET title=?, description=?, allocated_amount=?, semester=?, school_year=?, updated_at=NOW()
         WHERE budget_id=? AND deleted_at IS NULL`,
        [title, description ?? null, allocatedAmount, semester, schoolYear, budgetId]
    );
};

export const deleteBudget = async (budgetId: number): Promise<void> => {
    await pool.execute(
        "UPDATE budgets SET deleted_at=NOW() WHERE budget_id=?",
        [budgetId]
    );
};

// Available school years (for filter dropdown)

export const getSchoolYears = async (): Promise<string[]> => {
    const [incRows]: any = await pool.execute(
        "SELECT DISTINCT school_year FROM obligations ORDER BY school_year DESC"
    );
    const [expRows]: any = await pool.execute(
        "SELECT DISTINCT school_year FROM expenses WHERE deleted_at IS NULL ORDER BY school_year DESC"
    );
    const set = new Set<string>([
        ...incRows.map((r: any) => r.school_year as string),
        ...expRows.map((r: any) => r.school_year as string),
    ]);
    return Array.from(set).sort().reverse();
};
