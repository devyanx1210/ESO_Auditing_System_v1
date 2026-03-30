import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    FiRefreshCw, FiPlus, FiEdit2, FiTrash2, FiDollarSign,
    FiTrendingUp, FiTrendingDown, FiActivity, FiChevronDown,
    FiArrowUpCircle, FiArrowDownCircle, FiFileText, FiExternalLink,
    FiInfo, FiX,
} from "react-icons/fi";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useAuth }  from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { auditService } from "../../services/audit.service";
import type {
    AuditSummary, IncomeItem, ExpenseItem,
    ChartDataPoint, LedgerEntry, BudgetItem,
} from "../../services/audit.service";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function semLabel(s: number) {
    return s === 1 ? "1st Sem" : s === 2 ? "2nd Sem" : "Summer";
}
function semLabelFull(s: number) {
    return s === 1 ? "1st Semester" : s === 2 ? "2nd Semester" : "Summer";
}
function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(d: string | null) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        + " " + dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}
const receiptUrl = (p: string | null) =>
    !p ? null : p.startsWith("http") ? p : `http://localhost:5000/uploads/${p}`;

// ─── Stat Card (matches Dashboard style) ─────────────────────────────────────

interface StatCardProps {
    label: string; value: string; icon: React.ReactNode;
    sub?: string; darkMode: boolean; highlight?: boolean;
    animDelay?: number;
}
function StatCard({ label, value, icon, sub, darkMode, highlight, animDelay = 0 }: StatCardProps) {
    return (
        <div
            style={{ animationDelay: `${animDelay}ms` }}
            className={`anim-card-pop rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3
                transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)]
                ${highlight
                    ? "bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_12px_32px_rgba(234,88,12,0.40)] text-white"
                    : darkMode ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-800"
                }`}>
            <div className="flex justify-between items-start gap-2">
                <p className={`text-[9px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wide leading-snug
                    ${highlight ? "text-white/75" : darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {label}
                </p>
                <span className={`text-base sm:text-lg lg:text-xl shrink-0 ${highlight ? "text-white" : "text-orange-500"}`}>
                    {icon}
                </span>
            </div>
            <div>
                <p className={`text-xl sm:text-2xl lg:text-[1.75rem] leading-tight font-black tracking-tight`}>
                    {value}
                </p>
                {sub && (
                    <p className={`text-[9px] sm:text-[10px] lg:text-xs mt-0.5 line-clamp-2
                        ${highlight ? "text-white/70" : darkMode ? "text-gray-400" : "text-gray-400"}`}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Info Modal ───────────────────────────────────────────────────────────────

function InfoModal({ onClose, darkMode }: { onClose: () => void; darkMode: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const sectionCls = `mb-5`;
    const headingCls = `text-xs font-bold uppercase tracking-widest mb-1.5 ${darkMode ? "text-orange-400" : "text-orange-500"}`;
    const textCls    = `text-xs leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`;
    const itemCls    = `flex gap-2 mb-1`;
    const dotCls     = `mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div ref={ref}
                className={`rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}
                style={{ animation: "fadeInUp 0.2s ease both" }}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-gray-700/60" : "border-gray-100"}`}>
                    <div>
                        <p className={`font-bold text-base ${darkMode ? "text-white" : "text-gray-800"}`}>About Financial Audit</p>
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>Guide to understanding this section</p>
                    </div>
                    <button onClick={onClose}
                        className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-5 flex-1">

                    <div className={sectionCls}>
                        <p className={headingCls}>What is the Financial Audit Section?</p>
                        <p className={textCls}>
                            The Financial Audit section is the central module for tracking, recording, and reviewing all financial activities of the organization.
                            It provides a complete and transparent view of how funds have been collected and spent throughout each semester.
                            Only ESO Officers and System Administrators have access to this section.
                        </p>
                    </div>

                    <div className={sectionCls}>
                        <p className={headingCls}>Fund Balance</p>
                        <p className={textCls}>
                            The current fund balance represents the total amount of money the organization holds at any given time.
                            It is automatically computed as the difference between all verified collections and all recorded expenses.
                            This figure updates every time a payment is verified or an expense is recorded.
                        </p>
                    </div>

                    <div className={sectionCls}>
                        <p className={headingCls}>Collections</p>
                        <p className={textCls}>
                            Collections are all verified student payments received by the organization. A payment appears here only after it has been officially verified by an authorized officer.
                            Each record shows the student name, obligation covered, payment method (GCash or Cash), amount collected, and the officer who verified it.
                        </p>
                    </div>

                    <div className={sectionCls}>
                        <p className={headingCls}>Expenses</p>
                        <p className={textCls}>
                            Expenses are all official fund releases and expenditures made by the organization. Officers must record each expense with a title, the corresponding semester and school year, and the amount spent.
                            An official receipt (OR) may be attached to each record as proof of the transaction.
                        </p>
                    </div>

                    <div className={sectionCls}>
                        <p className={headingCls}>Fund Ledger</p>
                        <p className={textCls}>
                            The Fund Ledger provides a complete chronological history of all financial transactions, displaying both collections and expenses in a single unified view.
                            Each row shows the running balance after every transaction, allowing auditors and officers to trace how the fund has grown or decreased over time.
                        </p>
                    </div>

                    <div className={sectionCls}>
                        <p className={headingCls}>Budget Proposals vs. Actual Spending</p>
                        <p className={textCls}>
                            Officers can create budget proposals that define the planned spending for a specific semester and school year.
                            The system then automatically computes the actual spending from recorded expenses in the same period and compares it against the proposed budget.
                            The variance column shows whether spending is under or over the allocated budget, and a progress bar visually represents utilization.
                        </p>
                    </div>

                    <div className={sectionCls}>
                        <p className={headingCls}>Filtering by Semester and School Year</p>
                        <p className={textCls}>
                            All data in this section can be filtered by semester (1st, 2nd, or Summer) and school year.
                            Applying these filters will update all stat cards, charts, the ledger, and all transaction lists to reflect only the selected period.
                            This is especially useful when preparing semester-specific audit reports.
                        </p>
                    </div>

                    <div className={sectionCls}>
                        <p className={headingCls}>Who Can Use This Section?</p>
                        <div className={textCls}>
                            {[
                                "ESO Officers can record expenses, create budget proposals, and view all financial data.",
                                "System Administrators have full access to all audit functions including editing and deleting records.",
                                "Other roles such as class officers, program heads, and signatories do not have access to this section.",
                            ].map((t, i) => (
                                <div key={i} className={itemCls}>
                                    <span className={dotCls} style={{ marginTop: 4 }} />
                                    <span>{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className={`px-6 py-4 border-t ${darkMode ? "border-gray-700/60" : "border-gray-100"}`}>
                    <button onClick={onClose}
                        className="w-full py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Expense / Budget Modal ───────────────────────────────────────────────────

interface RecordModalProps {
    token:       string;
    schoolYears: string[];
    editing:     ExpenseItem | BudgetItem | null;
    mode:        "expense" | "budget";
    onClose:     () => void;
    onDone:      () => void;
    darkMode:    boolean;
}
function RecordModal({ token, schoolYears, editing, mode, onClose, onDone, darkMode }: RecordModalProps) {
    const isExpense = mode === "expense";
    const editExp   = isExpense ? (editing as ExpenseItem | null) : null;
    const editBudg  = !isExpense ? (editing as BudgetItem | null) : null;

    const [title,       setTitle]       = useState(editing?.title ?? "");
    const [description, setDescription] = useState(editing?.description ?? "");
    const [amount,      setAmount]      = useState(editExp ? String(editExp.amount) : editBudg ? String(editBudg.allocatedAmount) : "");
    const [semester,    setSemester]    = useState(editing ? String(editing.semester) : "1");
    const [schoolYear,  setSchoolYear]  = useState(editing?.schoolYear ?? (schoolYears[0] ?? "2024-2025"));
    const [saving,      setSaving]      = useState(false);
    const [err,         setErr]         = useState("");

    async function submit() {
        if (!title.trim())          return setErr("Title is required");
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setErr("Enter a valid amount");
        setSaving(true); setErr("");
        try {
            const sem = Number(semester);
            const sy  = schoolYear;
            if (isExpense) {
                const payload = { title: title.trim(), description: description.trim() || undefined, amount: Number(amount), semester: sem, school_year: sy };
                if (editExp) await auditService.updateExpense(token, editExp.expenseId, payload);
                else         await auditService.createExpense(token, payload);
            } else {
                const payload = { title: title.trim(), description: description.trim() || undefined, allocated_amount: Number(amount), semester: sem, school_year: sy };
                if (editBudg) await auditService.updateBudget(token, editBudg.budgetId, payload);
                else          await auditService.createBudget(token, payload);
            }
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    const inp = `w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-[#222] border-gray-600 text-gray-100 placeholder-gray-600" : "bg-white border-gray-200"}`;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl shadow-xl w-full max-w-sm p-6 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}
                style={{ animation: "fadeInUp 0.2s ease both" }}>
                <h3 className={`font-bold text-base mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {editing ? "Edit" : "Add"} {isExpense ? "Expense" : "Budget Proposal"}
                </h3>
                <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {isExpense ? "Record an official expense" : "Set an allocated budget for this semester"}
                </p>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Title / Description</label>
                        <input className={inp} value={title} onChange={e => setTitle(e.target.value)}
                            placeholder={isExpense ? "e.g. Tarpaulin printing" : "e.g. Sports Fest Budget"} />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Details (optional)</label>
                        <textarea className={`${inp} resize-none`} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional details..." />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {isExpense ? "Amount Disbursed (PHP)" : "Allocated Amount (PHP)"}
                        </label>
                        <input type="number" min="0" step="0.01" className={inp} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Semester</label>
                            <select className={inp} value={semester} onChange={e => setSemester(e.target.value)}>
                                <option value="1">1st Semester</option>
                                <option value="2">2nd Semester</option>
                                <option value="3">Summer</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>School Year</label>
                            <select className={inp} value={schoolYear} onChange={e => setSchoolYear(e.target.value)}>
                                {schoolYears.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                                {schoolYears.length === 0 && <option value={schoolYear}>{schoolYear}</option>}
                            </select>
                        </div>
                    </div>
                    {err && <p className="text-red-500 text-xs">{err}</p>}
                </div>
                <div className="flex gap-3 justify-end mt-5">
                    <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm font-medium ${darkMode ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-100 text-gray-700"}`}>Cancel</button>
                    <button onClick={submit} disabled={saving}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                        {saving ? "Saving..." : editing ? "Update" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel, loading, darkMode }: { onConfirm: () => void; onCancel: () => void; loading: boolean; darkMode: boolean }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl shadow-xl w-full max-w-xs p-6 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                <p className={`font-bold text-base mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Confirm Delete?</p>
                <p className={`text-sm mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>This action cannot be undone.</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className={`px-4 py-2 rounded-xl text-sm font-medium ${darkMode ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-100 text-gray-700"}`}>Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function Tab({ label, active, onClick, darkMode }: { label: string; active: boolean; onClick: () => void; darkMode: boolean }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                active ? "bg-orange-500 text-white shadow" : darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}>
            {label}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ActiveTab = "overview" | "ledger" | "income" | "expenses" | "budget";

const AuditPage = () => {
    const { accessToken } = useAuth();
    const { darkMode }    = useTheme();

    const [activeTab,   setActiveTab]   = useState<ActiveTab>("overview");
    const [schoolYears, setSchoolYears] = useState<string[]>([]);
    const [schoolYear,  setSchoolYear]  = useState<string | null>(null);
    const [semester,    setSemester]    = useState<number | null>(null);

    const [summary,    setSummary]    = useState<AuditSummary | null>(null);
    const [incomeList, setIncomeList] = useState<IncomeItem[]>([]);
    const [expList,    setExpList]    = useState<ExpenseItem[]>([]);
    const [chartData,  setChartData]  = useState<ChartDataPoint[]>([]);
    const [ledger,     setLedger]     = useState<LedgerEntry[]>([]);
    const [budgets,    setBudgets]    = useState<BudgetItem[]>([]);

    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");

    const [modalMode,    setModalMode]    = useState<"expense" | "budget">("expense");
    const [showModal,    setShowModal]    = useState(false);
    const [editingItem,  setEditingItem]  = useState<ExpenseItem | BudgetItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: "expense" | "budget" } | null>(null);
    const [deleting,     setDeleting]     = useState(false);
    const [showInfo,     setShowInfo]     = useState(false);

    const loadAll = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true); setError("");
        try {
            const [sum, inc, exp, chart, led, budg] = await Promise.all([
                auditService.getSummary(accessToken, semester, schoolYear),
                auditService.getIncome(accessToken, semester, schoolYear),
                auditService.getExpenses(accessToken, semester, schoolYear),
                auditService.getChart(accessToken, schoolYear),
                auditService.getLedger(accessToken, semester, schoolYear),
                auditService.getBudgets(accessToken, semester, schoolYear),
            ]);
            setSummary(sum); setIncomeList(inc); setExpList(exp);
            setChartData(chart); setLedger(led); setBudgets(budg);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }, [accessToken, semester, schoolYear]);

    useEffect(() => {
        if (!accessToken) return;
        auditService.getSchoolYears(accessToken).then(setSchoolYears).catch(() => {});
    }, [accessToken]);

    useEffect(() => { loadAll(); }, [loadAll]);

    async function handleDelete() {
        if (!deleteTarget || !accessToken) return;
        setDeleting(true);
        try {
            if (deleteTarget.type === "expense") await auditService.deleteExpense(accessToken, deleteTarget.id);
            else                                 await auditService.deleteBudget(accessToken, deleteTarget.id);
            setDeleteTarget(null);
            loadAll();
        } catch { /* silent */ } finally { setDeleting(false); }
    }

    // ── Chart ──
    const barData = {
        labels: chartData.map(d => d.label),
        datasets: [
            {
                label: "Collections (Income)",
                data: chartData.map(d => d.income),
                backgroundColor: darkMode ? "rgba(34,197,94,0.7)" : "rgba(34,197,94,0.8)",
                borderRadius: 6, barPercentage: 0.55,
            },
            {
                label: "Expenses",
                data: chartData.map(d => d.expenses),
                backgroundColor: darkMode ? "rgba(239,68,68,0.65)" : "rgba(239,68,68,0.75)",
                borderRadius: 6, barPercentage: 0.55,
            },
        ],
    };
    const barOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: darkMode ? "#9ca3af" : "#6b7280", font: { size: 11 } } },
            tooltip: { callbacks: { label: (ctx: any) => ` ₱${Number(ctx.raw).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` } },
        },
        scales: {
            x: { grid: { color: darkMode ? "#2a2a2a" : "#f3f4f6" }, ticks: { color: darkMode ? "#9ca3af" : "#6b7280", font: { size: 11 } } },
            y: { grid: { color: darkMode ? "#2a2a2a" : "#f3f4f6" }, ticks: { color: darkMode ? "#9ca3af" : "#6b7280", font: { size: 11 }, callback: (v: any) => "₱" + Number(v).toLocaleString("en-PH") } },
        },
    };

    const netPositive = (summary?.netBalance ?? 0) >= 0;
    const bg   = darkMode ? "bg-[#111111] text-gray-100" : "bg-gray-50 text-gray-900";
    const card = darkMode ? "bg-[#1a1a1a]" : "bg-white";
    const th   = darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-500";

    // Current fund balance = last ledger entry's balance (ledger is newest-first)
    const currentBalance = ledger.length > 0 ? ledger[0].balance : 0;

    function openExpenseModal(item?: ExpenseItem) {
        setModalMode("expense"); setEditingItem(item ?? null); setShowModal(true);
    }
    function openBudgetModal(item?: BudgetItem) {
        setModalMode("budget"); setEditingItem(item ?? null); setShowModal(true);
    }

    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${bg}`}>
            <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* ── Header ── */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className={`font-bold text-lg sm:text-xl ${darkMode ? "text-white" : "text-gray-800"}`}>Financial Audit</h1>
                            <button
                                onClick={() => setShowInfo(true)}
                                title="About this section"
                                className="flex items-center justify-center w-6 h-6 rounded-full transition text-orange-500 hover:text-orange-600">
                                <FiInfo className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                            Collections · Expenses · Fund Balance · Budget Proposals
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => openExpenseModal()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 shadow-sm">
                        <FiPlus className="w-4 h-4" /> Record Expenses
                    </button>
                    <button onClick={() => openBudgetModal()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 shadow-sm">
                        <FiFileText className="w-4 h-4" /> Add Budget Proposal
                    </button>
                    <button onClick={loadAll} disabled={loading} title="Refresh"
                        className={`p-2 border-2 rounded-xl transition shadow-sm disabled:opacity-50 ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400"}`}>
                        <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="relative">
                    <select value={semester ?? ""} onChange={e => setSemester(e.target.value ? Number(e.target.value) : null)}
                        className={`border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-3 pr-8 py-2 text-sm appearance-none ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                        <option value="">All Semesters</option>
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                        <option value="3">Summer</option>
                    </select>
                    <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select value={schoolYear ?? ""} onChange={e => setSchoolYear(e.target.value || null)}
                        className={`border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-3 pr-8 py-2 text-sm appearance-none ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                        <option value="">All School Years</option>
                        {schoolYears.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                    </select>
                    <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                {(semester !== null || schoolYear !== null) && (
                    <button onClick={() => { setSemester(null); setSchoolYear(null); }}
                        className="text-xs text-orange-500 hover:text-orange-600 font-semibold px-2 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                        Clear filters
                    </button>
                )}
                <span className={`ml-auto text-xs font-medium px-3 py-2 rounded-xl ${darkMode ? "bg-[#1a1a1a] text-gray-400" : "bg-white text-gray-400 shadow-sm"}`}>
                    {semester ? semLabelFull(semester) : "All Semesters"}{schoolYear ? ` · ${schoolYear}` : ""}
                </span>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <StatCard
                    label="Total Collections"
                    value={summary ? fmt(summary.totalIncome) : "—"}
                    icon={<FiArrowUpCircle />}
                    sub={summary ? `${summary.incomeCount} verified payment${summary.incomeCount !== 1 ? "s" : ""}` : undefined}
                    darkMode={darkMode}
                    highlight={true}
                    animDelay={0}
                />
                <StatCard
                    label="Total Expenses"
                    value={summary ? fmt(summary.totalExpenses) : "—"}
                    icon={<FiArrowDownCircle />}
                    sub={summary ? `${summary.expenseCount} recorded expense${summary.expenseCount !== 1 ? "s" : ""}` : undefined}
                    darkMode={darkMode}
                    animDelay={75}
                />
                <StatCard
                    label="Current Fund Balance"
                    value={fmt(currentBalance)}
                    icon={<FiDollarSign />}
                    sub={currentBalance >= 0 ? "Funds available" : "Deficit detected"}
                    darkMode={darkMode}
                    animDelay={150}
                />
                <StatCard
                    label="Budget Utilization"
                    value={budgets.length > 0
                        ? `${Math.round((budgets.reduce((s, b) => s + b.actualAmount, 0) / Math.max(budgets.reduce((s, b) => s + b.allocatedAmount, 0), 1)) * 100)}%`
                        : "No Budget"}
                    icon={<FiActivity />}
                    sub={budgets.length > 0 ? `${budgets.length} active proposal${budgets.length !== 1 ? "s" : ""}` : "Add a budget proposal to track spending"}
                    darkMode={darkMode}
                    animDelay={225}
                />
            </div>

            {/* ── Charts ── */}
            {(chartData.length > 0 || incomeList.length > 0) && (() => {
                // Doughnut: Collections by Program
                const programTotals: Record<string, number> = {};
                incomeList.forEach(item => {
                    programTotals[item.programCode] = (programTotals[item.programCode] ?? 0) + item.amountPaid;
                });
                const programLabels  = Object.keys(programTotals);
                const programValues  = Object.values(programTotals);
                const palette = ["#f97316","#3b82f6","#10b981","#a855f7","#ef4444","#eab308"];

                const doughnutData = {
                    labels: programLabels,
                    datasets: [{
                        data: programValues,
                        backgroundColor: palette.slice(0, programLabels.length),
                        borderWidth: 0,
                        hoverOffset: 8,
                    }],
                };
                const doughnutOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "65%",
                    plugins: {
                        legend: {
                            position: "bottom" as const,
                            labels: {
                                color: darkMode ? "#9ca3af" : "#6b7280",
                                font: { size: 11 },
                                padding: 12,
                                boxWidth: 10,
                                boxHeight: 10,
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx: any) => ` ${ctx.label}: ₱${Number(ctx.raw).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                            },
                        },
                    },
                };

                const totalCollected = programValues.reduce((s, v) => s + v, 0);

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        {/* Bar chart — takes 2/3 */}
                        <div className={`lg:col-span-2 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] ${card}`}>
                            <p className={`font-bold text-sm mb-4 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                                <FiTrendingUp className="w-4 h-4 text-orange-500 shrink-0" />
                                Collections vs. Expenses{schoolYear ? ` — ${schoolYear}` : ""}
                            </p>
                            <div className="h-56 sm:h-64">
                                <Bar data={barData} options={barOptions as any} />
                            </div>
                        </div>

                        {/* Doughnut — takes 1/3 */}
                        <div className={`rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col ${card}`}>
                            <p className={`font-bold text-sm mb-1 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                                <FiActivity className="w-4 h-4 text-orange-500 shrink-0" />
                                Collections by Program
                            </p>
                            <p className={`text-[10px] mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                Share of verified payments per program
                            </p>
                            {programLabels.length > 0 ? (
                                <>
                                    <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: 160 }}>
                                        <div className="w-full h-40 sm:h-48">
                                            <Doughnut data={doughnutData} options={doughnutOptions} />
                                        </div>
                                        {/* Center label */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: 24 }}>
                                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Total</p>
                                            <p className={`text-sm font-black ${darkMode ? "text-white" : "text-gray-800"}`}>
                                                ₱{totalCollected.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className={`text-xs text-center ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                                        No collection data available
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                <Tab label="Overview"        active={activeTab === "overview"}       onClick={() => setActiveTab("overview")}       darkMode={darkMode} />
                <Tab label="Fund Ledger"     active={activeTab === "ledger"}         onClick={() => setActiveTab("ledger")}         darkMode={darkMode} />
                <Tab label={`Collections (${incomeList.length})`} active={activeTab === "income"} onClick={() => setActiveTab("income")} darkMode={darkMode} />
                <Tab label={`Expenses (${expList.length})`}  active={activeTab === "expenses"} onClick={() => setActiveTab("expenses")} darkMode={darkMode} />
                <Tab label={`Budget Proposals (${budgets.length})`} active={activeTab === "budget"} onClick={() => setActiveTab("budget")} darkMode={darkMode} />
            </div>

            {/* ─── OVERVIEW TAB ─── */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recent Collections */}
                    <div className={`rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden ${card}`}>
                        <div className={`px-5 py-3 border-b flex items-center justify-between ${darkMode ? "border-gray-700/50" : "border-gray-100"}`}>
                            <p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Recent Collections</p>
                            <span className="text-xs text-green-600 font-semibold">{fmt(summary?.totalIncome ?? 0)}</span>
                        </div>
                        <table className="eso-table w-full text-xs">
                            <thead className={th}>
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide font-semibold">Student / Obligation</th>
                                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wide font-semibold">Amount</th>
                                    <th className="px-4 py-2.5 text-center text-[10px] uppercase tracking-wide font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomeList.slice(0, 6).map((item, i) => (
                                    <tr key={item.paymentId} className={`border-b ${darkMode ? "border-gray-700/40" : "border-gray-100"} ${i % 2 === 0 ? "" : darkMode ? "bg-white/[0.02]" : "bg-gray-50/60"}`}>
                                        <td className={`px-4 py-2.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                            <p className="font-medium">{item.studentName} <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{item.programCode}</span></p>
                                            <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{item.obligationName}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">{fmt(item.amountPaid)}</td>
                                        <td className={`px-4 py-2.5 text-center text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{fmtDate(item.verifiedAt)}</td>
                                    </tr>
                                ))}
                                {incomeList.length === 0 && (
                                    <tr><td colSpan={3} className={`px-4 py-8 text-center text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>No collections yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Recent Disbursements */}
                    <div className={`rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden ${card}`}>
                        <div className={`px-5 py-3 border-b flex items-center justify-between ${darkMode ? "border-gray-700/50" : "border-gray-100"}`}>
                            <p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Recent Expenses</p>
                            <button onClick={() => openExpenseModal()}
                                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-semibold">
                                <FiPlus className="w-3 h-3" /> Add
                            </button>
                        </div>
                        <table className="eso-table w-full text-xs">
                            <thead className={th}>
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide font-semibold">Title / Semester</th>
                                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-wide font-semibold">Amount</th>
                                    <th className="px-4 py-2.5 text-center text-[10px] uppercase tracking-wide font-semibold w-12">OR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expList.slice(0, 6).map((item, i) => (
                                    <tr key={item.expenseId} className={`border-b ${darkMode ? "border-gray-700/40" : "border-gray-100"} ${i % 2 === 0 ? "" : darkMode ? "bg-white/[0.02]" : "bg-gray-50/60"}`}>
                                        <td className={`px-4 py-2.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                            <p className="font-medium">{item.title}</p>
                                            <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{semLabel(item.semester)} · {item.schoolYear}</p>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-red-500">{fmt(item.amount)}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            {receiptUrl(item.receiptPath)
                                                ? <a href={receiptUrl(item.receiptPath)!} target="_blank" rel="noopener noreferrer"
                                                    className="text-orange-500 hover:text-orange-600 inline-flex items-center gap-0.5 text-[10px] font-semibold">
                                                    <FiExternalLink className="w-3 h-3" /> OR
                                                  </a>
                                                : <span className={`text-[10px] ${darkMode ? "text-gray-700" : "text-gray-300"}`}>—</span>}
                                        </td>
                                    </tr>
                                ))}
                                {expList.length === 0 && (
                                    <tr><td colSpan={3} className={`px-4 py-8 text-center text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>No expenses recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── FUND LEDGER TAB ─── */}
            {activeTab === "ledger" && (
                <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden ${card}`}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${darkMode ? "border-gray-700/50" : "border-gray-100"}`}>
                        <div>
                            <p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Fund Ledger</p>
                            <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                All transactions with running fund balance
                            </p>
                        </div>
                        <div className={`text-right`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Current Balance</p>
                            <p className={`text-lg font-bold ${currentBalance >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(currentBalance)}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="eso-table w-full text-xs min-w-[640px]">
                            <thead className={th}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide font-semibold">Date</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wide font-semibold w-24">Type</th>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide font-semibold">Reference</th>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide font-semibold">Details</th>
                                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wide font-semibold">Amount</th>
                                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wide font-semibold">Balance</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wide font-semibold w-10">OR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.map((entry, i) => (
                                    <tr key={i} className={`border-b ${darkMode ? "border-gray-700/40" : "border-gray-100"} ${i % 2 === 0 ? "" : darkMode ? "bg-white/[0.02]" : "bg-gray-50/40"}`}>
                                        <td className={`px-4 py-2.5 whitespace-nowrap ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{fmtDateTime(entry.date)}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            {entry.type === "income"
                                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold"><FiArrowUpCircle className="w-3 h-3" /> Collection</span>
                                                : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-semibold"><FiArrowDownCircle className="w-3 h-3" /> Expense</span>}
                                        </td>
                                        <td className={`px-4 py-2.5 font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{entry.reference}</td>
                                        <td className={`px-4 py-2.5 max-w-[160px] truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{entry.description || "—"}</td>
                                        <td className={`px-4 py-2.5 text-right font-semibold ${entry.type === "income" ? "text-green-600" : "text-red-500"}`}>
                                            {entry.type === "income" ? "+" : "−"}{fmt(entry.amount)}
                                        </td>
                                        <td className={`px-4 py-2.5 text-right font-bold ${entry.balance >= 0 ? (darkMode ? "text-gray-200" : "text-gray-700") : "text-red-500"}`}>
                                            {fmt(entry.balance)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            {receiptUrl(entry.receiptPath)
                                                ? <a href={receiptUrl(entry.receiptPath)!} target="_blank" rel="noopener noreferrer"
                                                    className="text-orange-500 hover:text-orange-600">
                                                    <FiExternalLink className="w-3.5 h-3.5" />
                                                  </a>
                                                : <span className={`text-[10px] ${darkMode ? "text-gray-700" : "text-gray-300"}`}>—</span>}
                                        </td>
                                    </tr>
                                ))}
                                {ledger.length === 0 && (
                                    <tr><td colSpan={7} className={`px-4 py-12 text-center text-sm ${darkMode ? "text-gray-600" : "text-gray-400"}`}>No transactions recorded yet.</td></tr>
                                )}
                            </tbody>
                            {ledger.length > 0 && (
                                <tfoot>
                                    <tr className={`border-t-2 ${darkMode ? "border-gray-600 bg-[#222]/40" : "border-gray-200 bg-gray-50"}`}>
                                        <td colSpan={4} className={`px-4 py-3 text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {ledger.length} transactions
                                        </td>
                                        <td className={`px-4 py-3 text-right text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-green-600 font-semibold">+{fmt(incomeList.reduce((s, r) => s + r.amountPaid, 0))}</span>
                                                <span className="text-red-500 font-semibold">−{fmt(expList.reduce((s, r) => s + r.amount, 0))}</span>
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold text-sm ${currentBalance >= 0 ? "text-green-600" : "text-red-500"}`}>
                                            {fmt(currentBalance)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ─── COLLECTIONS TAB ─── */}
            {activeTab === "income" && (
                <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden ${card}`}>
                    <div className="overflow-x-auto">
                        <table className="eso-table w-full text-xs min-w-[680px]">
                            <thead className={th}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold tracking-wide">Student</th>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold tracking-wide">Obligation / OR</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">Semester</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">Method</th>
                                    <th className="px-4 py-3 text-right text-[10px] uppercase font-semibold tracking-wide">Amount</th>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold tracking-wide">Verified By</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomeList.map((item, i) => (
                                    <tr key={item.paymentId} className={`border-b ${darkMode ? "border-gray-700/40" : "border-gray-100"} ${i % 2 === 0 ? "" : darkMode ? "bg-white/[0.02]" : "bg-gray-50/60"}`}>
                                        <td className={`px-4 py-2.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                            <p className="font-medium">{item.studentName}</p>
                                            <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{item.studentNo} · {item.programCode}</p>
                                        </td>
                                        <td className={`px-4 py-2.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                            <p>{item.obligationName}</p>
                                            {receiptUrl(null) && <a href="#" className="text-[10px] text-orange-500 hover:underline">View OR</a>}
                                        </td>
                                        <td className={`px-4 py-2.5 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {semLabel(item.semester)}<br/><span className="text-[10px]">{item.schoolYear}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            {item.paymentType === 1
                                                ? <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">GCash</span>
                                                : <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">Cash</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-green-600">{fmt(item.amountPaid)}</td>
                                        <td className={`px-4 py-2.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{item.verifiedByName ?? "—"}</td>
                                        <td className={`px-4 py-2.5 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{fmtDate(item.verifiedAt)}</td>
                                    </tr>
                                ))}
                                {incomeList.length === 0 && (
                                    <tr><td colSpan={7} className={`px-4 py-12 text-center text-sm ${darkMode ? "text-gray-600" : "text-gray-400"}`}>No collection records.</td></tr>
                                )}
                            </tbody>
                            {incomeList.length > 0 && (
                                <tfoot>
                                    <tr className={`border-t-2 ${darkMode ? "border-gray-600 bg-[#222]/40" : "border-gray-200 bg-gray-50"}`}>
                                        <td colSpan={4} className={`px-4 py-3 text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Collections</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-green-600">{fmt(incomeList.reduce((s, r) => s + r.amountPaid, 0))}</td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ─── EXPENSES TAB ─── */}
            {activeTab === "expenses" && (
                <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden ${card}`}>
                    <div className={`px-5 py-3 border-b flex items-center justify-between ${darkMode ? "border-gray-700/50" : "border-gray-100"}`}>
                        <p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Expense Records</p>
                        <button onClick={() => openExpenseModal()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600">
                            <FiPlus className="w-3 h-3" /> Record Expenses
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="eso-table w-full text-xs min-w-[640px]">
                            <thead className={th}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold tracking-wide">Title</th>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold tracking-wide">Details</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">Semester</th>
                                    <th className="px-4 py-3 text-right text-[10px] uppercase font-semibold tracking-wide">Amount</th>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold tracking-wide">Recorded By</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">OR / Receipt</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">Date</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide w-16">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expList.map((item, i) => (
                                    <tr key={item.expenseId} className={`border-b ${darkMode ? "border-gray-700/40" : "border-gray-100"} ${i % 2 === 0 ? "" : darkMode ? "bg-white/[0.02]" : "bg-gray-50/60"}`}>
                                        <td className={`px-4 py-2.5 font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{item.title}</td>
                                        <td className={`px-4 py-2.5 max-w-[160px] truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.description ?? "—"}</td>
                                        <td className={`px-4 py-2.5 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {semLabel(item.semester)}<br/><span className="text-[10px]">{item.schoolYear}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-red-500">{fmt(item.amount)}</td>
                                        <td className={`px-4 py-2.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{item.recordedByName}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            {receiptUrl(item.receiptPath)
                                                ? <a href={receiptUrl(item.receiptPath)!} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 text-[10px] font-semibold">
                                                    <FiExternalLink className="w-3 h-3" /> View OR
                                                  </a>
                                                : <span className={`text-[10px] ${darkMode ? "text-gray-700" : "text-gray-300"}`}>No receipt</span>}
                                        </td>
                                        <td className={`px-4 py-2.5 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{fmtDate(item.createdAt)}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => openExpenseModal(item)}
                                                    className={`p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition ${darkMode ? "text-orange-400" : "text-orange-500"}`}>
                                                    <FiEdit2 className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => setDeleteTarget({ id: item.expenseId, type: "expense" })}
                                                    className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition ${darkMode ? "text-red-400" : "text-red-500"}`}>
                                                    <FiTrash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expList.length === 0 && (
                                    <tr><td colSpan={8} className={`px-4 py-12 text-center text-sm ${darkMode ? "text-gray-600" : "text-gray-400"}`}>No expense records.</td></tr>
                                )}
                            </tbody>
                            {expList.length > 0 && (
                                <tfoot>
                                    <tr className={`border-t-2 ${darkMode ? "border-gray-600 bg-[#222]/40" : "border-gray-200 bg-gray-50"}`}>
                                        <td colSpan={3} className={`px-4 py-3 text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Expenses</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-red-500">{fmt(expList.reduce((s, r) => s + r.amount, 0))}</td>
                                        <td colSpan={4}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ─── BUDGET PROPOSALS TAB ─── */}
            {activeTab === "budget" && (
                <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden ${card}`}>
                    <div className={`px-5 py-3 border-b flex items-center justify-between ${darkMode ? "border-gray-700/50" : "border-gray-100"}`}>
                        <div>
                            <p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Budget Proposals vs. Actual Spending</p>
                            <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Actual is the total expenses for the same semester/year</p>
                        </div>
                        <button onClick={() => openBudgetModal()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600">
                            <FiPlus className="w-3 h-3" /> Add Budget
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="eso-table w-full text-xs min-w-[640px]">
                            <thead className={th}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] uppercase font-semibold tracking-wide">Budget Title</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">Semester</th>
                                    <th className="px-4 py-3 text-right text-[10px] uppercase font-semibold tracking-wide">Allocated</th>
                                    <th className="px-4 py-3 text-right text-[10px] uppercase font-semibold tracking-wide">Actual Spent</th>
                                    <th className="px-4 py-3 text-right text-[10px] uppercase font-semibold tracking-wide">Variance</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide">Utilization</th>
                                    <th className="px-4 py-3 text-center text-[10px] uppercase font-semibold tracking-wide w-16">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map((item, i) => {
                                    const pct = item.allocatedAmount > 0
                                        ? Math.min(Math.round((item.actualAmount / item.allocatedAmount) * 100), 100)
                                        : 0;
                                    const over = item.actualAmount > item.allocatedAmount;
                                    return (
                                        <tr key={item.budgetId} className={`border-b ${darkMode ? "border-gray-700/40" : "border-gray-100"} ${i % 2 === 0 ? "" : darkMode ? "bg-white/[0.02]" : "bg-gray-50/60"}`}>
                                            <td className={`px-4 py-2.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                                <p className="font-medium">{item.title}</p>
                                                {item.description && <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{item.description}</p>}
                                            </td>
                                            <td className={`px-4 py-2.5 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {semLabel(item.semester)}<br/><span className="text-[10px]">{item.schoolYear}</span>
                                            </td>
                                            <td className={`px-4 py-2.5 text-right font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{fmt(item.allocatedAmount)}</td>
                                            <td className={`px-4 py-2.5 text-right font-semibold ${over ? "text-red-500" : "text-green-600"}`}>{fmt(item.actualAmount)}</td>
                                            <td className={`px-4 py-2.5 text-right font-bold ${item.variance >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                {item.variance >= 0 ? "+" : ""}{fmt(item.variance)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex-1 h-1.5 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                                        <div
                                                            className={`h-1.5 rounded-full ${over ? "bg-red-500" : "bg-green-500"}`}
                                                            style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-semibold w-8 text-right ${over ? "text-red-500" : darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => openBudgetModal(item)}
                                                        className={`p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition ${darkMode ? "text-orange-400" : "text-orange-500"}`}>
                                                        <FiEdit2 className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget({ id: item.budgetId, type: "budget" })}
                                                        className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition ${darkMode ? "text-red-400" : "text-red-500"}`}>
                                                        <FiTrash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {budgets.length === 0 && (
                                    <tr><td colSpan={7} className={`px-4 py-12 text-center text-sm ${darkMode ? "text-gray-600" : "text-gray-400"}`}>No budget proposals yet. Add one to track planned vs. actual spending.</td></tr>
                                )}
                            </tbody>
                            {budgets.length > 0 && (
                                <tfoot>
                                    <tr className={`border-t-2 ${darkMode ? "border-gray-600 bg-[#222]/40" : "border-gray-200 bg-gray-50"}`}>
                                        <td colSpan={2} className={`px-4 py-3 text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Totals</td>
                                        <td className={`px-4 py-3 text-right text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{fmt(budgets.reduce((s, b) => s + b.allocatedAmount, 0))}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-red-500">{fmt(budgets.reduce((s, b) => s + b.actualAmount, 0))}</td>
                                        <td className={`px-4 py-3 text-right text-sm font-bold ${budgets.reduce((s, b) => s + b.variance, 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                                            {budgets.reduce((s, b) => s + b.variance, 0) >= 0 ? "+" : ""}{fmt(budgets.reduce((s, b) => s + b.variance, 0))}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ── Info Modal ── */}
            {showInfo && <InfoModal onClose={() => setShowInfo(false)} darkMode={darkMode} />}

            {/* ── Modals ── */}
            {showModal && (
                <RecordModal
                    token={accessToken!}
                    schoolYears={schoolYears.length ? schoolYears : ["2024-2025", "2025-2026"]}
                    editing={editingItem}
                    mode={modalMode}
                    onClose={() => { setShowModal(false); setEditingItem(null); }}
                    onDone={() => { setShowModal(false); setEditingItem(null); loadAll(); }}
                    darkMode={darkMode}
                />
            )}
            {deleteTarget && (
                <DeleteConfirm
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
};

export default AuditPage;
