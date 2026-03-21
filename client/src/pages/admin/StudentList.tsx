import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiRefreshCw, FiUsers, FiCreditCard, FiCheckCircle, FiCheckSquare, FiClock, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiUser } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { adminStudentService, receiptUrl } from "../../services/admin-student.service";
import type {
    AdminStudentItem, AdminObligationItem, PendingPaymentItem,
    PendingClearanceItem, PaymentHistoryItem, ClearanceHistoryItem,
} from "../../services/admin-student.service";

// ─── Program lookup ───────────────────────────────────────────────────────────

const PROGRAM_NAMES: Record<string, string> = {
    CpE: "Computer Engineering",
    CE:  "Civil Engineering",
    ECE: "Electronics Engineering",
    EE:  "Electrical Engineering",
    ME:  "Mechanical Engineering",
};
function programLabel(code: string) {
    return PROGRAM_NAMES[code] ?? code;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
    const map: Record<string, string> = {
        paid: "bg-green-500 text-white",
        waived: "bg-blue-500 text-white",
        pending_verification: "bg-amber-400 text-white",
        unpaid: "bg-red-500 text-white",
    };
    const labels: Record<string, string> = {
        paid: "Paid", waived: "Waived",
        pending_verification: "Pending", unpaid: "Unpaid",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-400 text-white"}`}>
            {labels[status] ?? status}
        </span>
    );
}

function clearanceBadge(s: string | null) {
    const map: Record<string, string> = {
        cleared: "bg-green-500 text-white",
        in_progress: "bg-orange-400 text-white",
        rejected: "bg-red-500 text-white",
        pending: "bg-gray-400 text-white",
    };
    const label = s ?? "pending";
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[label] ?? "bg-gray-400 text-white"}`}>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-md p-6">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-lg p-6">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-md p-6">
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ size = "md" }: { size?: "sm" | "md" }) {
    const sz = size === "md" ? "w-9 h-9" : "w-8 h-8";
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0`}>
            <DefaultAvatarSvg />
        </div>
    );
}

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

// ─── Student Detail Modal ─────────────────────────────────────────────────────

interface StudentDetailModalProps {
    student: AdminStudentItem;
    token: string;
    onCash: (ob: AdminObligationItem) => void;
    onVerify: (p: PendingPaymentItem) => void;
    onClose: () => void;
}
function StudentDetailModal({ student, token, onCash, onVerify, onClose }: StudentDetailModalProps) {
    const [obs, setObs] = useState<AdminObligationItem[]>([]);
    const [pending, setPending] = useState<PendingPaymentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [obSearch, setObSearch] = useState("");

    useEffect(() => {
        Promise.all([
            adminStudentService.getStudentObligations(token, student.studentId),
            adminStudentService.getPendingPayments(token),
        ]).then(([o, p]) => {
            setObs(o);
            setPending(p.filter(x => x.studentNo === student.studentNo));
        }).finally(() => setLoading(false));
    }, [token, student.studentId, student.studentNo]);

    const pendingByObId: Record<number, PendingPaymentItem> = {};
    pending.forEach(p => { pendingByObId[p.studentObligationId] = p; });

    const filteredObs = obSearch
        ? obs.filter(o => o.obligationName.toLowerCase().includes(obSearch.toLowerCase()))
        : obs;

    const paidCount  = obs.filter(o => o.status === "paid" || o.status === "waived").length;
    const totalCount = obs.length;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">

                {/* Colored top accent strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-orange-600 shrink-0" />

                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center shrink-0">
                            <FiUser className="w-7 h-7 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-gray-900 text-xl leading-tight">
                                {student.firstName} {student.lastName}
                            </h2>
                            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                                <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">{student.studentNo}</span>
                                <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">{student.programName}</span>
                                <span className="text-xs text-gray-500 font-medium">Yr {student.yearLevel}-{student.section}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-lg font-bold shrink-0">
                        &times;
                    </button>
                </div>

                {/* Stats cards row */}
                <div className="grid grid-cols-3 gap-3 px-6 pb-4 shrink-0">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-xs text-gray-400 font-medium mb-1">Clearance</p>
                        {clearanceBadge(student.clearanceStatus)}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-xs text-gray-400 font-medium mb-1">Obligations</p>
                        <p className="text-sm font-bold text-gray-800">{paidCount} <span className="text-gray-400 font-normal">/ {totalCount}</span> paid</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-center">
                        <p className="text-xs text-gray-400 font-medium mb-1">School Year</p>
                        <p className="text-sm font-bold text-gray-800">{student.schoolYear}</p>
                    </div>
                </div>

                {/* Search + divider */}
                <div className="px-6 pb-3 shrink-0">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Search obligations..."
                            value={obSearch} onChange={e => setObSearch(e.target.value)}
                            className="border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl pl-8 pr-3 py-2 text-sm w-full" />
                    </div>
                </div>

                {/* Obligations list */}
                <div className="overflow-y-auto flex-1 border-t border-gray-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-14">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
                        </div>
                    ) : filteredObs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                            <p className="text-sm font-medium">{obs.length === 0 ? "No obligations assigned." : "No matching obligations."}</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-gray-100 text-gray-500 sticky top-0 z-10">
                                <tr className="border-b border-gray-200">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Obligation</th>
                                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide">Amount</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Status</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Method</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredObs.map((ob, i) => (
                                    <tr key={ob.studentObligationId} className={`hover:bg-orange-50/50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-yellow-50/40"}`}>
                                        <td className="px-6 py-3.5 font-semibold text-gray-800">
                                            {ob.obligationName}
                                            {ob.isOverdue && (
                                                <span className="ml-2 text-xs text-red-500 font-normal bg-red-50 px-1.5 py-0.5 rounded">overdue</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3.5 text-right font-semibold text-gray-700">₱{Number(ob.amount).toFixed(2)}</td>
                                        <td className="px-3 py-3.5 text-center">{statusBadge(ob.status)}</td>
                                        <td className="px-3 py-3.5 text-center">
                                            {ob.paymentType === "gcash" && <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">GCash</span>}
                                            {ob.paymentType === "cash" && <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">Cash</span>}
                                            {!ob.paymentType && <span className="text-gray-300 text-xs">—</span>}
                                        </td>
                                        <td className="px-3 py-3.5 text-center">
                                            <div className="flex gap-1.5 justify-center flex-wrap">
                                                {ob.status === "unpaid" && ob.requiresPayment && (
                                                    <button onClick={() => onCash(ob)}
                                                        className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition shadow-sm">
                                                        Record Cash
                                                    </button>
                                                )}
                                                {ob.status === "pending_verification" && ob.paymentId && ob.paymentType === "gcash" && (
                                                    <button onClick={() => { const p = pendingByObId[ob.studentObligationId]; if (p) onVerify(p); }}
                                                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm">
                                                        Verify GCash
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

interface StudentRowProps {
    student: AdminStudentItem;
    index: number;
    selected: boolean;
    onSelect: (id: number) => void;
    onOpen: (student: AdminStudentItem) => void;
}
function StudentRow({ student, index, selected, onSelect, onOpen }: StudentRowProps) {
    const rowBg = selected ? "bg-orange-50" : index % 2 === 0 ? "bg-white" : "bg-yellow-50/60";

    return (
        <>
            {/* ── Mobile row ── */}
            <tr className={`md:hidden border-b border-gray-200 ${rowBg}`}>
                <td colSpan={7} className="p-0">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                        <input type="checkbox" checked={selected}
                            onChange={e => { e.stopPropagation(); onSelect(student.studentId); }}
                            className="w-4 h-4 accent-orange-500 shrink-0 cursor-pointer" />
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(student)}>
                            <UserAvatar size="sm" />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-800 text-sm leading-tight truncate">
                                    {student.firstName} {student.lastName}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 flex-wrap">
                                    <span className="font-mono">{student.studentNo}</span>
                                    <span>·</span>
                                    <span className="bg-gray-100 text-gray-600 px-1.5 rounded font-medium">{student.programCode}</span>
                                    <span>·</span>
                                    <span>Yr{student.yearLevel}-{student.section}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                                {clearanceBadge(student.clearanceStatus)}
                                <span className="text-xs text-gray-400">{student.obligationsPaid}/{student.obligationsTotal}</span>
                            </div>
                            <FiChevronDown className="w-4 h-4 text-gray-400 ml-1 shrink-0" />
                        </div>
                    </div>
                </td>
            </tr>

            {/* ── Desktop row ── */}
            <tr className={`hidden md:table-row transition-colors hover:bg-orange-50 cursor-pointer ${rowBg}`}>
                <td className="pl-4 pr-2 py-3 w-8" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected}
                        onChange={() => onSelect(student.studentId)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer" />
                </td>
                <td className="px-3 py-3" onClick={() => onOpen(student)}>
                    <div className="flex items-center gap-3">
                        <UserAvatar />
                        <div>
                            <div className="font-semibold text-gray-800 text-sm leading-tight">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">{student.studentNo}</div>
                        </div>
                    </div>
                </td>
                <td className="px-3 py-3 text-center" onClick={() => onOpen(student)}>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{student.programName}</span>
                </td>
                <td className="px-3 py-3 text-center text-sm text-gray-600" onClick={() => onOpen(student)}>{student.yearLevel}-{student.section}</td>
                <td className="px-3 py-3 text-center" onClick={() => onOpen(student)}>
                    <div className="text-sm font-medium text-gray-700">{student.obligationsPaid}/{student.obligationsTotal}</div>
                    <div className="text-xs text-gray-400">paid</div>
                </td>
                <td className="px-3 py-3 text-center" onClick={() => onOpen(student)}>{clearanceBadge(student.clearanceStatus)}</td>
                <td className="px-3 py-3 text-center text-gray-400" onClick={() => onOpen(student)}>
                    <FiChevronDown className="w-4 h-4 mx-auto" />
                </td>
            </tr>
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
    const filterRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setShowFilters(false);
            }
        }
        if (showFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters]);

    const [selectedIds,          setSelectedIds]          = useState<Set<number>>(new Set());
    const [selectedClearanceIds, setSelectedClearanceIds] = useState<Set<number>>(new Set());
    const [modalStudent,         setModalStudent]         = useState<AdminStudentItem | null>(null);

    function toggleSelect(id: number) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function toggleSelectAll() {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(s => s.studentId)));
        }
    }
    function toggleClearanceSelect(id: number) {
        setSelectedClearanceIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function toggleClearanceSelectAll() {
        if (selectedClearanceIds.size === clearance.length) {
            setSelectedClearanceIds(new Set());
        } else {
            setSelectedClearanceIds(new Set(clearance.map(c => c.studentId)));
        }
    }

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

    const PROGRAMS_LIST = [
        { code: "CpE", name: "Computer Engineering" },
        { code: "CE",  name: "Civil Engineering" },
        { code: "ECE", name: "Electronics Engineering" },
        { code: "EE",  name: "Electrical Engineering" },
        { code: "ME",  name: "Mechanical Engineering" },
    ];

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
                <button onClick={load} disabled={loading} title="Refresh"
                    className="p-2 bg-white border-2 border-gray-200 rounded-xl text-gray-600 hover:border-orange-400 hover:text-orange-600 transition shadow-sm disabled:opacity-50">
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

            {/* ── Main Tabs ── */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
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

            {/* ── Search + Filter Bar ── */}
            <div className="flex items-center gap-2 mb-5">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search by name or student no..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full bg-white shadow-sm" />
                </div>

                {/* Filter dropdown */}
                <div className="relative" ref={filterRef}>
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm ${
                            showFilters || activeFilterCount > 0
                                ? "bg-primary text-white"
                                : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}>
                        <FiFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Sort &amp; Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {/* Floating dropdown panel */}
                    {showFilters && (
                        <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-72 flex flex-col gap-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sort &amp; Filter</p>

                            {/* Sort */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Sort by</label>
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                    <option value="name">Name (A–Z)</option>
                                    <option value="section">Section</option>
                                    <option value="year">Year Level</option>
                                    {!isRestricted && <option value="dept">Program</option>}
                                    <option value="pending">Most Pending</option>
                                    <option value="paid">Most Paid</option>
                                </select>
                            </div>

                            {/* Program */}
                            {!isRestricted && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Program</label>
                                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                                        className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                        <option value="all">All Programs</option>
                                        {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Year Level */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Year Level</label>
                                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                    <option value="all">All Year Levels</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>

                            {/* Section */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
                                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                    <option value="all">All Sections</option>
                                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                                </select>
                            </div>

                            {/* Status */}
                            {tab === "students" && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                        className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                        <option value="all">All Status</option>
                                        <option value="all_paid">All Paid</option>
                                        <option value="has_pending">Has Pending</option>
                                        <option value="has_unpaid">Has Unpaid</option>
                                    </select>
                                </div>
                            )}

                            {/* Clear filters */}
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => {
                                        setDeptFilter("all"); setYearFilter("all");
                                        setSectionFilter("all"); setStatusFilter("all");
                                        setSortKey("name");
                                    }}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition">
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results count */}
                {tab === "students" && (
                    <span className="hidden sm:flex items-center text-xs font-medium text-gray-400 bg-white border border-gray-200 px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {/* ── Student List Tab ── */}
            {tab === "students" && (
                filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-10 text-center text-gray-400 text-sm">
                        No students found.
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <thead className="hidden md:table-header-group bg-gray-100 text-gray-500">
                                <tr className="border-b border-gray-200">
                                    <th className="pl-4 pr-2 py-3 w-8">
                                        <input type="checkbox"
                                            checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Student</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Program</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Yr / Sec</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Obligations</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Clearance</th>
                                    <th className="px-3 py-3 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filtered.map((s, i) => (
                                    <StudentRow key={s.studentId} student={s} index={i}
                                        selected={selectedIds.has(s.studentId)}
                                        onSelect={toggleSelect}
                                        onOpen={setModalStudent} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
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
                            {/* Mobile cards */}
                            {pending.length === 0 ? (
                                <div className="bg-white rounded-2xl border-2 border-gray-200 p-10 text-center text-gray-400 text-sm">
                                    No payment submissions awaiting verification.
                                </div>
                            ) : (
                                <>
                                    {/* Mobile */}
                                    <div className="md:hidden flex flex-col gap-3">
                                        {pending.map(p => (
                                            <div key={p.paymentId} className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                        <UserAvatar size="sm" />
                                                        <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-800 text-sm">{p.studentName}</div>
                                                        <div className="flex flex-wrap items-center gap-1 mt-1 text-xs text-gray-500">
                                                            <span className="font-mono">{p.studentNo}</span>
                                                            <span className="text-gray-300">·</span>
                                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{programLabel(p.programCode)}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-700 mt-1.5 font-medium">{p.obligationName}</div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                            <span className="font-semibold text-gray-800">PHP {Number(p.amountPaid).toFixed(2)}</span>
                                                            <span>{fmtDate(p.submittedAt)}</span>
                                                        </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setVerifyTarget(p)}
                                                        className="shrink-0 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                                                        Review
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Desktop table */}
                                    <div className="hidden md:block bg-white border border-gray-200 shadow-sm overflow-x-auto">
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
                                                {pending.map((p, i) => (
                                                    <tr key={p.paymentId} className={`border-b border-gray-200 hover:bg-orange-100/60 ${i % 2 === 0 ? "bg-white" : "bg-yellow-50/60"}`}>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <UserAvatar size="sm" />
                                                                <div>
                                                                    <div className="font-medium text-gray-800">{p.studentName}</div>
                                                                    <div className="text-xs text-gray-400">{p.studentNo}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{programLabel(p.programCode)}</span>
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
                        </>
                    )}

                    {/* Verified History */}
                    {paySubTab === "history" && (
                        payHistory.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-gray-200 p-10 text-center text-gray-400 text-sm">
                                No verified payments yet.
                            </div>
                        ) : (
                            <>
                                {/* Mobile */}
                                <div className="md:hidden flex flex-col gap-3">
                                    {payHistory.map(h => (
                                        <div key={h.paymentId} className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-800 text-sm">{h.studentName}</div>
                                                    <div className="flex flex-wrap items-center gap-1 mt-1 text-xs text-gray-500">
                                                        <span className="font-mono">{h.studentNo}</span>
                                                        <span className="text-gray-300">·</span>
                                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{programLabel(h.programCode)}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-700 mt-1.5 font-medium">{h.obligationName}</div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                                        <span className="font-semibold text-gray-800">PHP {Number(h.amountPaid).toFixed(2)}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${h.paymentType === "gcash" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-green-50 text-green-600 border border-green-200"}`}>
                                                            {h.paymentType === "gcash" ? "GCash" : "Cash"}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${h.paymentStatus === "approved" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                                                            {h.paymentStatus}
                                                        </span>
                                                    </div>
                                                    {h.verifiedAt && (
                                                        <div className="text-xs text-gray-400 mt-1">{fmtDate(h.verifiedAt)} {fmtTime(h.verifiedAt)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop table */}
                                <div className="hidden md:block bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-x-auto">
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
                                            {payHistory.map((h, i) => (
                                                <tr key={h.paymentId} className={`border-b border-gray-200 hover:bg-orange-100/60 ${i % 2 === 0 ? "bg-white" : "bg-yellow-50/60"}`}>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <UserAvatar size="sm" />
                                                            <div>
                                                                <div className="font-medium text-gray-800">{h.studentName}</div>
                                                                <div className="text-xs text-gray-400">{h.studentNo}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{programLabel(h.programCode)}</span>
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
                            </>
                        )
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
                            {clearance.length === 0 ? (
                                <div className="bg-white rounded-2xl border-2 border-gray-200 p-10 text-center text-gray-400 text-sm">
                                    <p className="font-medium text-gray-500 mb-1">No pending clearances</p>
                                    <p>Students will appear here once all obligations are paid.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile */}
                                    <div className="md:hidden flex flex-col gap-3">
                                        {clearance.map(c => (
                                            <div key={c.studentId} className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-800 text-sm">{c.lastName}, {c.firstName}</div>
                                                        <div className="flex flex-wrap items-center gap-1 mt-1 text-xs text-gray-500">
                                                            <span className="font-mono">{c.studentNo}</span>
                                                            <span className="text-gray-300">·</span>
                                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{c.programCode}</span>
                                                            <span className="text-gray-300">·</span>
                                                            <span>Yr {c.yearLevel}-{c.section}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">{c.schoolYear} · Sem {c.semester}</div>
                                                        <div className="text-xs font-semibold text-gray-700 mt-1">
                                                            {c.obligationsPaid}/{c.obligationsTotal} obligations paid
                                                        </div>
                                                    </div>
                                                    {canSignClearance && (
                                                        <button onClick={() => setSignTarget(c)}
                                                            className="shrink-0 px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold">
                                                            Sign
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Desktop table */}
                                    <div className="hidden md:block bg-white border border-gray-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm border-collapse">
                                            <thead className="bg-gray-100 text-gray-500">
                                                <tr className="border-b border-gray-200">
                                                    <th className="pl-4 pr-2 py-3 w-8">
                                                        <input type="checkbox"
                                                            checked={clearance.length > 0 && selectedClearanceIds.size === clearance.length}
                                                            onChange={toggleClearanceSelectAll}
                                                            className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                                    </th>
                                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Student</th>
                                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Student No.</th>
                                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Dept</th>
                                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Year / Sec</th>
                                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Semester</th>
                                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Obligations</th>
                                                    {canSignClearance && <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide">Action</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {clearance.map((c, i) => (
                                                    <tr key={c.studentId} className={`transition-colors hover:bg-orange-50 ${selectedClearanceIds.has(c.studentId) ? "bg-orange-50" : i % 2 === 0 ? "bg-white" : "bg-yellow-50/60"}`}>
                                                        <td className="pl-4 pr-2 py-3 w-8" onClick={e => e.stopPropagation()}>
                                                            <input type="checkbox" checked={selectedClearanceIds.has(c.studentId)}
                                                                onChange={() => toggleClearanceSelect(c.studentId)}
                                                                className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <UserAvatar size="sm" />
                                                                <div className="font-medium text-gray-800">{c.lastName}, {c.firstName}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center text-xs font-mono text-gray-600">{c.studentNo}</td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{c.programName}</span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center text-xs text-gray-600">{c.yearLevel}-{c.section}</td>
                                                        <td className="px-3 py-3 text-center text-xs text-gray-600">{c.schoolYear} · Sem {c.semester}</td>
                                                        <td className="px-3 py-3 text-center text-xs font-medium text-gray-700">{c.obligationsPaid}/{c.obligationsTotal} paid</td>
                                                        {canSignClearance && (
                                                            <td className="px-3 py-3 text-center">
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
                        </>
                    )}

                    {/* Signed History */}
                    {clrSubTab === "history" && (
                        clrHistory.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-gray-200 p-10 text-center text-gray-400 text-sm">
                                No clearances signed yet.
                            </div>
                        ) : (
                            <>
                                {/* Mobile */}
                                <div className="md:hidden flex flex-col gap-3">
                                    {clrHistory.map(h => (
                                        <div key={h.clearanceId + h.signedAt} className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-800 text-sm">{h.lastName}, {h.firstName}</div>
                                                    <div className="flex flex-wrap items-center gap-1 mt-1 text-xs text-gray-500">
                                                        <span className="font-mono">{h.studentNo}</span>
                                                        <span className="text-gray-300">·</span>
                                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{programLabel(h.programCode)}</span>
                                                        <span className="text-gray-300">·</span>
                                                        <span>Yr {h.yearLevel}-{h.section}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">{h.schoolYear} · Sem {h.semester}</div>
                                                    {h.remarks && <div className="text-xs text-gray-500 mt-1 italic">"{h.remarks}"</div>}
                                                    <div className="text-xs text-gray-400 mt-1">{fmtDate(h.signedAt)} {fmtTime(h.signedAt)}</div>
                                                </div>
                                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${h.clearanceStatus === "cleared" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                    {h.clearanceStatus.replace("_", " ")}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop table */}
                                <div className="hidden md:block bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-x-auto">
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
                                            {clrHistory.map((h, i) => (
                                                <tr key={h.clearanceId + h.signedAt} className={`border-b border-gray-200 hover:bg-orange-100/60 ${i % 2 === 0 ? "bg-white" : "bg-yellow-50/60"}`}>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <UserAvatar size="sm" />
                                                            <div>
                                                                <div className="font-medium text-gray-800">{h.lastName}, {h.firstName}</div>
                                                                <div className="text-xs text-gray-400">{h.studentNo}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{programLabel(h.programCode)}</span>
                                                    </td>
                                                    <td className="p-3 text-center text-xs text-gray-600">{h.yearLevel}-{h.section}</td>
                                                    <td className="p-3 text-center text-xs text-gray-600">{h.schoolYear} · Sem {h.semester}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.clearanceStatus === "cleared" ? "bg-green-500 text-white" : "bg-orange-400 text-white"}`}>
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
                            </>
                        )
                    )}
                </>
            )}

            {/* Modals */}
            {modalStudent && (
                <StudentDetailModal
                    student={modalStudent}
                    token={accessToken!}
                    onCash={ob => { setModalStudent(null); setCashTarget(ob); }}
                    onVerify={p => { setModalStudent(null); setVerifyTarget(p); }}
                    onClose={() => setModalStudent(null)} />
            )}
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
