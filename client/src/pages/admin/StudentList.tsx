import React, { useEffect, useState, useCallback } from "react";
import { FiRefreshCw, FiUsers, FiCreditCard, FiCheckCircle, FiCheckSquare, FiClock, FiSearch, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { adminStudentService, receiptUrl } from "../../services/admin-student.service";
import type {
    AdminStudentItem, AdminObligationItem, PendingPaymentItem,
    PendingClearanceItem, PaymentHistoryItem, ClearanceHistoryItem,
} from "../../services/admin-student.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
    const map: Record<string, string> = {
        paid: "bg-green-100 text-green-700",
        waived: "bg-blue-100 text-blue-700",
        pending_verification: "bg-yellow-100 text-yellow-700",
        unpaid: "bg-red-100 text-red-600",
    };
    const labels: Record<string, string> = {
        paid: "Paid", waived: "Waived",
        pending_verification: "Pending Verification", unpaid: "Unpaid",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
            {labels[status] ?? status}
        </span>
    );
}

function clearanceBadge(s: string | null) {
    const map: Record<string, string> = {
        cleared: "bg-green-100 text-green-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        rejected: "bg-red-100 text-red-600",
        pending: "bg-gray-100 text-gray-500",
    };
    const label = s ?? "pending";
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[label] ?? "bg-gray-100 text-gray-500"}`}>
            {label.replace("_", " ")}
        </span>
    );
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-tab toggle (Review | History) ───────────────────────────────────────

interface SubTabsProps {
    active: "review" | "history";
    onChange: (v: "review" | "history") => void;
    reviewCount: number;
    historyCount: number;
    reviewLabel?: string;
    historyLabel?: string;
}
function SubTabs({ active, onChange, reviewCount, historyCount, reviewLabel = "For Review", historyLabel = "History" }: SubTabsProps) {
    return (
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5">
            <button
                onClick={() => onChange("review")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "review"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                }`}>
                <FiCheckSquare className="w-4 h-4" />
                {reviewLabel}
                {reviewCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{reviewCount}</span>
                )}
            </button>
            <button
                onClick={() => onChange("history")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "history"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                }`}>
                <FiClock className="w-4 h-4" />
                {historyLabel}
                {historyCount > 0 && (
                    <span className="bg-gray-400 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{historyCount}</span>
                )}
            </button>
        </div>
    );
}

// ─── Cash Modal ───────────────────────────────────────────────────────────────

interface CashModalProps {
    item: AdminObligationItem; token: string; onClose: () => void; onDone: () => void;
}
function CashModal({ item, token, onClose, onDone }: CashModalProps) {
    const [amount, setAmount] = useState(String(item.amount));
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount"); return; }
        setSaving(true);
        try {
            await adminStudentService.recordCash(token, item.studentObligationId, Number(amount), notes);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-1">Record Cash Payment</h3>
                <p className="text-sm text-gray-500 mb-4">{item.obligationName}</p>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <label className="text-xs font-medium text-gray-500">Amount Paid (PHP) *</label>
                    <input type="number" min="0" step="0.01"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={amount} onChange={e => setAmount(e.target.value)} />
                    <label className="text-xs font-medium text-gray-500">Notes (optional)</label>
                    <textarea rows={2}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Received in office" />
                    {err && <p className="text-red-500 text-sm">{err}</p>}
                    <div className="flex justify-between gap-3 mt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-60">
                            {saving ? "Saving..." : "Record Cash"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Verify Payment Modal ─────────────────────────────────────────────────────

interface VerifyModalProps {
    item: PendingPaymentItem | null; token: string; onClose: () => void; onDone: () => void;
}
function VerifyModal({ item, token, onClose, onDone }: VerifyModalProps) {
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    if (!item) return null;

    async function act(status: "approved" | "rejected") {
        setSaving(true);
        try {
            await adminStudentService.verifyPayment(token, item!.paymentId, status, remarks);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                <h3 className="font-bold text-gray-800 text-lg">Review Payment Submission</h3>
                <p className="text-sm text-gray-500 mb-4">{item.studentName} — {item.obligationName}</p>
                <div className="flex gap-6 mb-4">
                    <div>
                        <p className="text-xs text-gray-400">Amount Paid</p>
                        <p className="font-semibold text-gray-800">PHP {Number(item.amountPaid).toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Submitted</p>
                        <p className="text-sm text-gray-700">{fmtDate(item.submittedAt)}</p>
                    </div>
                </div>
                {item.receiptPath && (
                    <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">GCash Receipt</p>
                        <a href={receiptUrl(item.receiptPath)} target="_blank" rel="noreferrer" className="block mb-4">
                            <img src={receiptUrl(item.receiptPath)} alt="GCash receipt"
                                className="w-full max-h-64 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                        </a>
                    </>
                )}
                <textarea rows={2} placeholder="Remarks (optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    value={remarks} onChange={e => setRemarks(e.target.value)} />
                {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                    <button onClick={() => act("rejected")} disabled={saving}
                        className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 disabled:opacity-60">Reject</button>
                    <button onClick={() => act("approved")} disabled={saving}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                        {saving ? "Saving..." : "Approve"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Sign Clearance Modal ─────────────────────────────────────────────────────

interface SignClearanceModalProps {
    student: PendingClearanceItem; token: string; onClose: () => void; onDone: () => void;
}
function SignClearanceModal({ student, token, onClose, onDone }: SignClearanceModalProps) {
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await adminStudentService.signClearance(token, student.studentId, remarks);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-1">Sign Clearance</h3>
                <p className="text-sm text-gray-600 font-medium mb-0.5">{student.lastName}, {student.firstName}</p>
                <p className="text-xs text-gray-400 mb-4">{student.studentNo} · {student.programCode} · {student.schoolYear} Sem {student.semester}</p>
                <div className="flex gap-6 mb-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400">Obligations</p>
                        <p className="font-semibold text-gray-800">{student.obligationsPaid} / {student.obligationsTotal} paid</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Clearance</p>
                        <p className="font-semibold text-gray-800">{student.clearanceStatus ?? "not started"}</p>
                    </div>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <textarea rows={2} placeholder="Remarks (optional)"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        value={remarks} onChange={e => setRemarks(e.target.value)} />
                    {err && <p className="text-red-500 text-sm">{err}</p>}
                    <div className="flex justify-between gap-3 mt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                            {saving ? "Signing..." : "Sign Clearance"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

interface StudentRowProps {
    student: AdminStudentItem;
    token: string;
    onCash: (ob: AdminObligationItem) => void;
    onVerify: (p: PendingPaymentItem) => void;
    obligationSearch: string;
}
function StudentRow({ student, token, onCash, onVerify, obligationSearch }: StudentRowProps) {
    const [open, setOpen] = useState(false);
    const [obs, setObs] = useState<AdminObligationItem[]>([]);
    const [pending, setPending] = useState<PendingPaymentItem[]>([]);
    const [loading, setLoading] = useState(false);

    async function toggle() {
        if (open) { setOpen(false); return; }
        setOpen(true);
        if (obs.length) return;
        setLoading(true);
        try {
            const [o, p] = await Promise.all([
                adminStudentService.getStudentObligations(token, student.studentId),
                adminStudentService.getPendingPayments(token),
            ]);
            setObs(o);
            setPending(p.filter(x => x.studentNo === student.studentNo));
        } finally { setLoading(false); }
    }

    const pendingByObId: Record<number, PendingPaymentItem> = {};
    pending.forEach(p => { pendingByObId[p.studentObligationId] = p; });

    const filtered = obligationSearch
        ? obs.filter(o => o.obligationName.toLowerCase().includes(obligationSearch.toLowerCase()))
        : obs;

    return (
        <>
            <tr className="border-b-2 border-gray-300 hover:bg-orange-50 cursor-pointer transition-colors"
                onClick={toggle}>
                <td className="p-3 font-medium text-gray-800">{student.lastName}, {student.firstName}</td>
                <td className="p-3 text-center text-gray-600 text-xs font-mono">{student.studentNo}</td>
                <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{student.programCode}</span>
                </td>
                <td className="p-3 text-center text-gray-600 text-xs">{student.yearLevel}-{student.section}</td>
                <td className="p-3 text-center text-xs text-gray-700">
                    {student.obligationsPaid}/{student.obligationsTotal} paid
                </td>
                <td className="p-3 text-center">{clearanceBadge(student.clearanceStatus)}</td>
                <td className="p-3 text-center text-gray-400">{open ? <FiChevronUp className="w-4 h-4 mx-auto" /> : <FiChevronDown className="w-4 h-4 mx-auto" />}</td>
            </tr>
            {open && (
                <tr className="border-b-2 border-gray-300 bg-orange-50/40">
                    <td colSpan={7} className="px-5 pb-4 pt-2">
                        {loading ? (
                            <p className="text-sm text-gray-400 py-3">Loading obligations...</p>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-gray-400 py-3">{obs.length === 0 ? "No obligations assigned." : "No matching obligations."}</p>
                        ) : (
                            <div className="rounded-xl overflow-hidden border-2 border-orange-200 shadow-sm mt-1">
                                <table className="w-full text-sm">
                                    <thead className="bg-orange-100 text-orange-800">
                                        <tr>
                                            <th className="p-2.5 text-left border-b-2 border-orange-200 font-semibold">Obligation</th>
                                            <th className="p-2.5 text-right border-b-2 border-orange-200 font-semibold">Amount</th>
                                            <th className="p-2.5 text-center border-b-2 border-orange-200 font-semibold">Status</th>
                                            <th className="p-2.5 text-center border-b-2 border-orange-200 font-semibold">Type</th>
                                            <th className="p-2.5 text-center border-b-2 border-orange-200 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((ob, i) => (
                                            <tr key={ob.studentObligationId}
                                                className={`border-b border-orange-100 ${i % 2 === 0 ? "bg-white" : "bg-orange-50/50"}`}>
                                                <td className="p-2.5 text-gray-800 font-medium">
                                                    {ob.obligationName}
                                                    {ob.isOverdue && <span className="ml-2 text-xs text-red-500 font-normal">(overdue)</span>}
                                                </td>
                                                <td className="p-2.5 text-right text-gray-700">PHP {Number(ob.amount).toFixed(2)}</td>
                                                <td className="p-2.5 text-center">{statusBadge(ob.status)}</td>
                                                <td className="p-2.5 text-center">
                                                    {ob.paymentType === "gcash" && (
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium border border-blue-200">GCash</span>
                                                    )}
                                                    {ob.paymentType === "cash" && (
                                                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded font-medium border border-green-200">Cash</span>
                                                    )}
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <div className="flex gap-2 justify-center flex-wrap">
                                                        {ob.status === "unpaid" && ob.requiresPayment && (
                                                            <button onClick={e => { e.stopPropagation(); onCash(ob); }}
                                                                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium border border-orange-200">
                                                                Record Cash
                                                            </button>
                                                        )}
                                                        {ob.status === "pending_verification" && ob.paymentId && ob.paymentType === "gcash" && (
                                                            <button onClick={e => {
                                                                e.stopPropagation();
                                                                const p = pendingByObId[ob.studentObligationId];
                                                                if (p) onVerify(p);
                                                            }}
                                                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium border border-blue-200">
                                                                Verify GCash
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortKey = "name" | "section" | "year" | "dept" | "pending" | "paid";
type TabKey  = "students" | "submissions" | "clearance";

const CLEARANCE_ROLES = ["eso_officer", "program_head", "signatory", "dean", "system_admin"];
const SECTIONS = ["A","B","C","D","E","F","G","H"];

const StudentList = () => {
    const { accessToken, user } = useAuth();
    const [students,     setStudents]     = useState<AdminStudentItem[]>([]);
    const [pending,      setPending]      = useState<PendingPaymentItem[]>([]);
    const [payHistory,   setPayHistory]   = useState<PaymentHistoryItem[]>([]);
    const [clearance,    setClearance]    = useState<PendingClearanceItem[]>([]);
    const [clrHistory,   setClrHistory]   = useState<ClearanceHistoryItem[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState("");

    // Filters — persist across all tabs
    const [search,        setSearch]        = useState("");
    const [obSearch,      setObSearch]      = useState("");
    const [deptFilter,    setDeptFilter]    = useState("all");
    const [yearFilter,    setYearFilter]    = useState("all");
    const [sectionFilter, setSectionFilter] = useState("all");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [sortKey,       setSortKey]       = useState<SortKey>("name");

    const [tab,           setTab]           = useState<TabKey>("students");
    const [paySubTab,     setPaySubTab]     = useState<"review" | "history">("review");
    const [clrSubTab,     setClrSubTab]     = useState<"review" | "history">("review");

    const [cashTarget,    setCashTarget]    = useState<AdminObligationItem | null>(null);
    const [verifyTarget,  setVerifyTarget]  = useState<PendingPaymentItem | null>(null);
    const [signTarget,    setSignTarget]    = useState<PendingClearanceItem | null>(null);
    const [verifyingAll,  setVerifyingAll]  = useState(false);
    const [verifyAllMsg,  setVerifyAllMsg]  = useState("");
    const [signingAll,    setSigningAll]    = useState(false);
    const [signAllMsg,    setSignAllMsg]    = useState("");
    const [showFilters,   setShowFilters]   = useState(false);

    const isRestricted     = ["class_officer", "program_head"].includes(user?.role ?? "");
    const hasClearanceRole = CLEARANCE_ROLES.includes(user?.role ?? "");
    const canSignClearance = user?.role !== "system_admin";
    // Payment endpoints only allow: system_admin, eso_officer, class_officer, program_head
    const canAccessPayments = ["system_admin", "eso_officer", "class_officer", "program_head"].includes(user?.role ?? "");

    const load = useCallback(() => {
        if (!accessToken) return;
        setLoading(true);
        Promise.all([
            adminStudentService.listStudents(accessToken).catch(() => [] as AdminStudentItem[]),
            canAccessPayments
                ? adminStudentService.getPendingPayments(accessToken).catch(() => [] as PendingPaymentItem[])
                : Promise.resolve([] as PendingPaymentItem[]),
            canAccessPayments
                ? adminStudentService.getPaymentHistory(accessToken).catch(() => [] as PaymentHistoryItem[])
                : Promise.resolve([] as PaymentHistoryItem[]),
            hasClearanceRole
                ? adminStudentService.getPendingClearance(accessToken).catch(() => [] as PendingClearanceItem[])
                : Promise.resolve([] as PendingClearanceItem[]),
            hasClearanceRole
                ? adminStudentService.getClearanceHistory(accessToken).catch(() => [] as ClearanceHistoryItem[])
                : Promise.resolve([] as ClearanceHistoryItem[]),
        ])
            .then(([s, p, ph, c, ch]) => {
                setStudents(s);
                setPending(p);
                setPayHistory(ph);
                setClearance(c);
                setClrHistory(ch);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken, hasClearanceRole, canAccessPayments]);

    useEffect(() => { load(); }, [load]);

    async function handleVerifyAll() {
        if (!accessToken) return;
        setVerifyingAll(true); setVerifyAllMsg("");
        try {
            const res = await adminStudentService.verifyAll(accessToken);
            setVerifyAllMsg(`${res.count} payment(s) approved.`);
            load();
        } catch (e: any) { setVerifyAllMsg(e.message); }
        finally { setVerifyingAll(false); }
    }

    async function handleSignAll() {
        if (!accessToken) return;
        setSigningAll(true); setSignAllMsg("");
        try {
            const res = await adminStudentService.signAllClearance(accessToken);
            setSignAllMsg(`${res.count} clearance(s) signed.`);
            load();
        } catch (e: any) { setSignAllMsg(e.message); }
        finally { setSigningAll(false); }
    }

    const DEPTS = ["CpE", "CE", "ECE", "EE", "ME"];

    let filtered = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        s.studentNo.toLowerCase().includes(search.toLowerCase())
    );
    if (!isRestricted && deptFilter !== "all")
        filtered = filtered.filter(s => s.programCode === deptFilter);
    if (yearFilter !== "all")
        filtered = filtered.filter(s => String(s.yearLevel) === yearFilter);
    if (sectionFilter !== "all")
        filtered = filtered.filter(s => (s.section ?? "").toUpperCase() === sectionFilter);
    if (statusFilter === "all_paid")
        filtered = filtered.filter(s => s.obligationsPaid === s.obligationsTotal && s.obligationsTotal > 0);
    if (statusFilter === "has_pending")
        filtered = filtered.filter(s => s.obligationsPending > 0);
    if (statusFilter === "has_unpaid")
        filtered = filtered.filter(s => s.obligationsPaid < s.obligationsTotal);

    if (sortKey === "name")    filtered = [...filtered].sort((a, b) => a.lastName.localeCompare(b.lastName));
    if (sortKey === "section") filtered = [...filtered].sort((a, b) => (a.section ?? "").localeCompare(b.section ?? ""));
    if (sortKey === "year")    filtered = [...filtered].sort((a, b) => a.yearLevel - b.yearLevel);
    if (sortKey === "dept")    filtered = [...filtered].sort((a, b) => a.programCode.localeCompare(b.programCode));
    if (sortKey === "pending") filtered = [...filtered].sort((a, b) => b.obligationsPending - a.obligationsPending);
    if (sortKey === "paid")    filtered = [...filtered].sort((a, b) => (b.obligationsPaid / Math.max(b.obligationsTotal, 1)) - (a.obligationsPaid / Math.max(a.obligationsTotal, 1)));

    const activeFilterCount = [
        !isRestricted && deptFilter !== "all",
        yearFilter !== "all",
        sectionFilter !== "all",
        tab === "students" && statusFilter !== "all",
        sortKey !== "name",
    ].filter(Boolean).length;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            {/* ── Page Header ── */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-bold text-gray-800 text-2xl sm:text-3xl">Students</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {isRestricted && students[0]
                            ? `${students[0].programName} — ${students.length} student${students.length !== 1 ? "s" : ""}`
                            : `${students.length} student${students.length !== 1 ? "s" : ""} across all programs`}
                    </p>
                </div>
                <button onClick={load} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border-2 border-gray-200 rounded-xl text-gray-600 hover:border-orange-400 hover:text-orange-600 transition shadow-sm disabled:opacity-50">
                    <FiRefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

            {/* ── Main Tabs ── */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
                <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
                    <button onClick={() => setTab("students")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${tab === "students" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        <FiUsers className="w-4 h-4" />
                        <span className="hidden sm:inline">Student List</span>
                        <span className="sm:hidden">Students</span>
                    </button>
                    {canAccessPayments && (
                        <button onClick={() => setTab("submissions")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${tab === "submissions" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            <FiCreditCard className="w-4 h-4" />
                            <span className="hidden sm:inline">Payment Submissions</span>
                            <span className="sm:hidden">Payments</span>
                            {pending.length > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{pending.length}</span>
                            )}
                        </button>
                    )}
                    {hasClearanceRole && (
                        <button onClick={() => setTab("clearance")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${tab === "clearance" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            <FiCheckCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Clearance Verification</span>
                            <span className="sm:hidden">Clearance</span>
                            {clearance.length > 0 && (
                                <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{clearance.length}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Filter / Sort Bar ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-5">
                {/* Search inputs — students tab only */}
                {tab === "students" && (
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input type="text" placeholder="Search by name or student no..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full" />
                        </div>
                        <input type="text" placeholder="Filter by obligation..."
                            value={obSearch} onChange={e => setObSearch(e.target.value)}
                            className="border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm flex-1" />
                    </div>
                )}

                {/* Mobile: toggle button */}
                <div className="flex items-center gap-2 sm:hidden mb-2">
                    <button onClick={() => setShowFilters(f => !f)}
                        className="flex items-center gap-1.5 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600 transition bg-white">
                        <FiFilter className="w-4 h-4" />
                        Filters &amp; Sort
                        {activeFilterCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>
                    {tab === "students" && (
                        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {/* Dropdowns — always visible on desktop, toggle on mobile */}
                <div className={`${showFilters ? "grid" : "hidden"} grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2 sm:items-center`}>
                    {!isRestricted && (
                        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                            className="w-full sm:w-auto border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                            <option value="all">All Programs</option>
                            {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    )}
                    <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                        className="w-full sm:w-auto border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                        <option value="all">All Year Levels</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                    <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
                        className="w-full sm:w-auto border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                        <option value="all">All Sections</option>
                        {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                    {tab === "students" && (
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                            <option value="all">All Status</option>
                            <option value="all_paid">All Paid</option>
                            <option value="has_pending">Has Pending</option>
                            <option value="has_unpaid">Has Unpaid</option>
                        </select>
                    )}
                    <div className="col-span-2 flex items-center gap-2 sm:ml-auto">
                        <label className="text-xs text-gray-400 font-medium whitespace-nowrap">Sort:</label>
                        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                            className="flex-1 sm:w-auto border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                            <option value="name">Name (A–Z)</option>
                            <option value="section">Section</option>
                            <option value="year">Year Level</option>
                            {!isRestricted && <option value="dept">Program</option>}
                            <option value="pending">Most Pending</option>
                            <option value="paid">Most Paid</option>
                        </select>
                    </div>
                    {tab === "students" && (
                        <span className="hidden sm:block text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Student List Tab ── */}
            {tab === "students" && (
                <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="p-3 text-left border-b-2 border-gray-300">Name</th>
                                <th className="p-3 text-center border-b-2 border-gray-300">Student No.</th>
                                <th className="p-3 text-center border-b-2 border-gray-300">Dept</th>
                                <th className="p-3 text-center border-b-2 border-gray-300">Year / Sec</th>
                                <th className="p-3 text-center border-b-2 border-gray-300">Obligations</th>
                                <th className="p-3 text-center border-b-2 border-gray-300">Clearance</th>
                                <th className="p-3 text-center border-b-2 border-gray-300"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="p-10 text-center text-gray-400">No students found.</td></tr>
                            ) : filtered.map(s => (
                                <StudentRow key={s.studentId} student={s} token={accessToken!}
                                    onCash={setCashTarget} onVerify={setVerifyTarget}
                                    obligationSearch={obSearch} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Payment Submissions Tab ── */}
            {tab === "submissions" && (
                <>
                    <SubTabs
                        active={paySubTab} onChange={setPaySubTab}
                        reviewCount={pending.length} historyCount={payHistory.length}
                        reviewLabel="Awaiting Verification" historyLabel="Verified History" />

                    {/* Awaiting Verification */}
                    {paySubTab === "review" && (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-500">
                                    {pending.length === 0
                                        ? "No submissions awaiting verification."
                                        : `${pending.length} submission${pending.length !== 1 ? "s" : ""} awaiting verification.`}
                                </p>
                                {verifyAllMsg && <p className="text-sm text-green-600">{verifyAllMsg}</p>}
                                {pending.length > 0 && (
                                    <button onClick={handleVerifyAll} disabled={verifyingAll}
                                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 transition">
                                        {verifyingAll ? "Processing..." : `Approve All (${pending.length})`}
                                    </button>
                                )}
                            </div>
                            <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-3 text-left border-b-2 border-gray-300">Student</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Dept</th>
                                            <th className="p-3 text-left border-b-2 border-gray-300">Obligation</th>
                                            <th className="p-3 text-right border-b-2 border-gray-300">Amount</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Submitted</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.length === 0 ? (
                                            <tr><td colSpan={6} className="p-10 text-center text-gray-400">
                                                No payment submissions awaiting verification.
                                            </td></tr>
                                        ) : pending.map(p => (
                                            <tr key={p.paymentId} className="border-b-2 border-gray-200 hover:bg-gray-50">
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-800">{p.studentName}</div>
                                                    <div className="text-xs text-gray-400">{p.studentNo}</div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{p.programCode}</span>
                                                </td>
                                                <td className="p-3 text-gray-700">{p.obligationName}</td>
                                                <td className="p-3 text-right font-semibold text-gray-800">PHP {Number(p.amountPaid).toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <div className="text-xs text-gray-700">{fmtDate(p.submittedAt)}</div>
                                                    <div className="text-xs text-gray-400">{fmtTime(p.submittedAt)}</div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => setVerifyTarget(p)}
                                                        className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Verified History */}
                    {paySubTab === "history" && (
                        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-3 text-left border-b-2 border-gray-300">Student</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Dept</th>
                                        <th className="p-3 text-left border-b-2 border-gray-300">Obligation</th>
                                        <th className="p-3 text-right border-b-2 border-gray-300">Amount</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Type</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Status</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Verified</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payHistory.length === 0 ? (
                                        <tr><td colSpan={7} className="p-10 text-center text-gray-400">No verified payments yet.</td></tr>
                                    ) : payHistory.map(h => (
                                        <tr key={h.paymentId} className="border-b-2 border-gray-200 hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-800">{h.studentName}</div>
                                                <div className="text-xs text-gray-400">{h.studentNo}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{h.programCode}</span>
                                            </td>
                                            <td className="p-3 text-gray-700">{h.obligationName}</td>
                                            <td className="p-3 text-right font-semibold text-gray-800">PHP {Number(h.amountPaid).toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.paymentType === "gcash" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-green-50 text-green-600 border border-green-200"}`}>
                                                    {h.paymentType === "gcash" ? "GCash" : "Cash"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.paymentStatus === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                    {h.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {h.verifiedAt && (
                                                    <>
                                                        <div className="text-xs text-gray-700">{fmtDate(h.verifiedAt)}</div>
                                                        <div className="text-xs text-gray-400">{fmtTime(h.verifiedAt)}</div>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── Clearance Verification Tab ── */}
            {tab === "clearance" && hasClearanceRole && (
                <>
                    <SubTabs
                        active={clrSubTab} onChange={setClrSubTab}
                        reviewCount={clearance.length} historyCount={clrHistory.length}
                        reviewLabel="Pending Signature" historyLabel="Signed History" />

                    {/* Pending Signature */}
                    {clrSubTab === "review" && (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {clearance.length === 0
                                            ? (canSignClearance ? "No students pending clearance at your step." : "No students with all obligations paid pending clearance.")
                                            : `${clearance.length} student${clearance.length !== 1 ? "s" : ""} ${canSignClearance ? "pending your signature" : "ready for clearance"}.`}
                                    </p>
                                    {!canSignClearance && (
                                        <p className="text-xs text-gray-400 mt-0.5">Viewing as System Administrator — signing is done by authorized officers.</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {signAllMsg && <p className="text-sm text-green-600">{signAllMsg}</p>}
                                    {clearance.length > 0 && canSignClearance && (
                                        <button onClick={handleSignAll} disabled={signingAll}
                                            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                                            {signingAll ? "Signing..." : `Sign All (${clearance.length})`}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600">
                                        <tr>
                                            <th className="p-3 text-left border-b-2 border-gray-300">Student</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Student No.</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Dept</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Year / Sec</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Semester</th>
                                            <th className="p-3 text-center border-b-2 border-gray-300">Obligations</th>
                                            {canSignClearance && <th className="p-3 text-center border-b-2 border-gray-300">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clearance.length === 0 ? (
                                            <tr><td colSpan={canSignClearance ? 7 : 6} className="p-10 text-center text-gray-400">
                                                <p className="font-medium text-gray-500 mb-1">No pending clearances</p>
                                                <p className="text-sm">Students will appear here once all obligations are paid.</p>
                                            </td></tr>
                                        ) : clearance.map(c => (
                                            <tr key={c.studentId} className="border-b-2 border-gray-200 hover:bg-orange-50">
                                                <td className="p-3 font-medium text-gray-800">{c.lastName}, {c.firstName}</td>
                                                <td className="p-3 text-center text-xs font-mono text-gray-600">{c.studentNo}</td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{c.programCode}</span>
                                                </td>
                                                <td className="p-3 text-center text-xs text-gray-600">{c.yearLevel}-{c.section}</td>
                                                <td className="p-3 text-center text-xs text-gray-600">{c.schoolYear} · Sem {c.semester}</td>
                                                <td className="p-3 text-center text-xs font-medium text-gray-700">{c.obligationsPaid}/{c.obligationsTotal} paid</td>
                                                {canSignClearance && (
                                                <td className="p-3 text-center">
                                                    <button onClick={() => setSignTarget(c)}
                                                        className="px-4 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold">
                                                        Sign
                                                    </button>
                                                </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Signed History */}
                    {clrSubTab === "history" && (
                        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-3 text-left border-b-2 border-gray-300">Student</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Dept</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Year / Sec</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Semester</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Status</th>
                                        <th className="p-3 text-center border-b-2 border-gray-300">Signed</th>
                                        <th className="p-3 text-left border-b-2 border-gray-300">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clrHistory.length === 0 ? (
                                        <tr><td colSpan={7} className="p-10 text-center text-gray-400">No clearances signed yet.</td></tr>
                                    ) : clrHistory.map(h => (
                                        <tr key={h.clearanceId + h.signedAt} className="border-b-2 border-gray-200 hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-800">{h.lastName}, {h.firstName}</div>
                                                <div className="text-xs text-gray-400">{h.studentNo}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{h.programCode}</span>
                                            </td>
                                            <td className="p-3 text-center text-xs text-gray-600">{h.yearLevel}-{h.section}</td>
                                            <td className="p-3 text-center text-xs text-gray-600">{h.schoolYear} · Sem {h.semester}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.clearanceStatus === "cleared" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                    {h.clearanceStatus.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="text-xs text-gray-700">{fmtDate(h.signedAt)}</div>
                                                <div className="text-xs text-gray-400">{fmtTime(h.signedAt)}</div>
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">{h.remarks ?? "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {cashTarget && (
                <CashModal item={cashTarget} token={accessToken!}
                    onClose={() => setCashTarget(null)}
                    onDone={() => { setCashTarget(null); load(); }} />
            )}
            {verifyTarget && (
                <VerifyModal item={verifyTarget} token={accessToken!}
                    onClose={() => setVerifyTarget(null)}
                    onDone={() => { setVerifyTarget(null); load(); }} />
            )}
            {signTarget && (
                <SignClearanceModal student={signTarget} token={accessToken!}
                    onClose={() => setSignTarget(null)}
                    onDone={() => { setSignTarget(null); load(); }} />
            )}
        </div>
    );
};

export default StudentList;
