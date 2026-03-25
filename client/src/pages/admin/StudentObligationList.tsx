import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiRefreshCw, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiChevronRight, FiImage } from "react-icons/fi";
import { receiptUrl } from "../../services/admin-student.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

import { adminStudentService } from "../../services/admin-student.service";
import type { AdminStudentItem, AdminObligationItem } from "../../services/admin-student.service";

// ─── Cash Modal ───────────────────────────────────────────────────────────────

interface CashModalProps { studentObligationId: number; obligationName: string; token: string; onClose: () => void; onDone: () => void; }
function CashModal({ studentObligationId, obligationName, token, onClose, onDone }: CashModalProps) {
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    async function submit() {
        if (!amount || isNaN(Number(amount))) return setErr("Enter a valid amount");
        setSaving(true);
        try {
            await adminStudentService.recordCash(token, studentObligationId, Number(amount), notes);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl w-full max-w-sm p-6" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                <h3 className="font-bold text-gray-800 mb-1">Record Cash Payment</h3>
                <p className="text-sm text-gray-500 mb-4">{obligationName}</p>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount Paid (PHP)</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm mb-3" placeholder="0.00" />
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm mb-4" placeholder="Notes..." />
                {err && <p className="text-red-500 text-xs mb-2">{err}</p>}
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">Cancel</button>
                    <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                        {saving ? "Saving..." : "Record"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Program lookup ───────────────────────────────────────────────────────────

const PROGRAM_NAMES: Record<string, string> = {
    CpE: "Computer Engineering",
    CE:  "Civil Engineering",
    ECE: "Electronics Engineering",
    EE:  "Electrical Engineering",
    ME:  "Mechanical Engineering",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
    const map: Record<string, string> = {
        paid:                 "bg-green-100 text-green-700",
        waived:               "bg-blue-100 text-blue-700",
        pending_verification: "bg-yellow-100 text-yellow-700",
        unpaid:               "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
        paid: "Paid", waived: "Waived",
        pending_verification: "Pending", unpaid: "Unpaid",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
            {labels[status] ?? status}
        </span>
    );
}

function proofStatusBadge(status: string) {
    const map: Record<string, string> = {
        paid:                 "bg-green-100 text-green-700",
        waived:               "bg-blue-100 text-blue-700",
        pending_verification: "bg-yellow-100 text-yellow-700",
        unpaid:               "bg-yellow-100 text-yellow-700",
    };
    const labels: Record<string, string> = {
        paid:                 "Verified",
        waived:               "Waived",
        pending_verification: "Pending",
        unpaid:               "Pending",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
            {labels[status] ?? status}
        </span>
    );
}

function clearanceBadge(s: string | null) {
    const map: Record<string, string> = {
        cleared:     "bg-green-100 text-green-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        rejected:    "bg-red-100 text-red-700",
        pending:     "bg-yellow-100 text-yellow-700",
    };
    const label = s ?? "pending";
    const labels: Record<string, string> = {
        cleared: "Approved", in_progress: "In Progress",
        rejected: "Disapproved", pending: "Pending",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[label] ?? "bg-gray-100 text-gray-600"}`}>
            {labels[label] ?? label.replace("_", " ")}
        </span>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

function UserAvatar({ size = "md", src }: { size?: "sm" | "md"; src?: string | null }) {
    const sz = size === "md" ? "w-9 h-9" : "w-8 h-8";
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0`}>
            {src
                ? <img src={src.startsWith("http") ? src : src.startsWith("/") ? `http://localhost:5000${src}` : `http://localhost:5000/uploads/${src}`} alt="" className="w-full h-full object-cover" />
                : <DefaultAvatarSvg />}
        </div>
    );
}

function yearLabel(y: number) {
    const ord = ["", "1st", "2nd", "3rd", "4th"];
    return `${ord[y] ?? y + "th"} Year`;
}

function obligationsCell(paid: number, total: number, darkMode: boolean) {
    if (total === 0) return <span className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-400"}`}>—</span>;
    return <span className={`text-xs font-semibold hover:underline ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{paid}/{total} Completed</span>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(d: string) {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        + " " + dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

// ─── Desktop Obligation Accordion Row ─────────────────────────────────────────

interface ObligationAccordionProps {
    studentId: number;
    token: string;
    cache: Record<number, AdminObligationItem[]>;
    onCache: (id: number, data: AdminObligationItem[]) => void;
    darkMode: boolean;
}
function ObligationAccordion({ studentId, token, cache, onCache, darkMode }: ObligationAccordionProps) {
    const [loading, setLoading] = useState(false);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
    const [cashTarget, setCashTarget] = useState<{ soId: number; name: string } | null>(null);

    useEffect(() => {
        if (cache[studentId] !== undefined) return;
        setLoading(true);
        adminStudentService.getStudentObligations(token, studentId)
            .then(data => onCache(studentId, data))
            .finally(() => setLoading(false));
    }, [studentId, token, cache, onCache]);

    const obs = cache[studentId];

    async function handleVerifyProof(soId: number, status: "paid" | "unpaid") {
        setVerifyingId(soId);
        try {
            await adminStudentService.verifyProof(token, soId, status);
            // Update cache in-place
            onCache(studentId, (cache[studentId] ?? []).map(ob =>
                ob.studentObligationId === soId ? { ...ob, status } : ob
            ));
        } catch { /* silent */ } finally { setVerifyingId(null); }
    }

    const panelOuter = darkMode ? "bg-[#111111] border-t border-b border-gray-700/60" : "bg-gray-100 border-t border-b border-gray-200";
    const panelInner = darkMode ? "bg-[#1a1a1a] rounded-xl" : "bg-white rounded-xl shadow-sm";
    const thCls      = darkMode ? "text-gray-400 border-gray-700" : "text-gray-500 border-gray-200";

    if (loading) return (
        <tr><td colSpan={9} className={`${panelOuter} px-6 py-6`}>
            <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500" />
            </div>
        </td></tr>
    );

    if (!obs || obs.length === 0) return (
        <tr><td colSpan={9} className={`${panelOuter} px-6 py-4`}>
            <p className="text-sm text-center text-gray-400">No obligations assigned.</p>
        </td></tr>
    );

    // Split obligations by type so we render the right columns per group
    const payObs   = obs.filter(ob => ob.requiresPayment);
    const proofObs = obs.filter(ob => !ob.requiresPayment);

    return (
        <>
        {cashTarget && (
            <CashModal
                studentObligationId={cashTarget.soId}
                obligationName={cashTarget.name}
                token={token}
                onClose={() => setCashTarget(null)}
                onDone={() => {
                    setCashTarget(null);
                    // Refresh obligations for this student
                    adminStudentService.getStudentObligations(token, studentId)
                        .then(data => onCache(studentId, data))
                        .catch(() => {});
                }} />
        )}
        {viewImageUrl && (
            <tr><td colSpan={9} className="p-0">
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewImageUrl(null)}>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewImageUrl(null)}
                            className="absolute -top-9 right-0 text-white text-sm font-medium hover:text-gray-300">✕ Close</button>
                        <img src={viewImageUrl} alt="Proof" className="w-full rounded-2xl object-contain max-h-[80vh] bg-gray-900" />
                    </div>
                </div>
            </td></tr>
        )}
        <tr>
            <td colSpan={9} className={`${panelOuter} px-4 py-3`}>
                <div className={`${panelInner} overflow-x-auto`}>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className={`border-b-2 ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                <th className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Obligation Name</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Method</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Proof</th>
                                <th className={`px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide w-20 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Amount</th>
                                <th className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Verified By</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-32 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Verified At</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-24 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Status</th>
                                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-16">Action</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? "divide-gray-600" : "divide-gray-300"}`}>

                            {/* ── Payment Submissions section ── */}
                            {payObs.length > 0 && (
                                <>
                                    <tr className={darkMode ? "bg-[#222]/30" : "bg-gray-50"}>
                                        <td colSpan={7} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            Payment Submissions
                                        </td>
                                    </tr>
                                    {payObs.map((ob, ri) => (
                                        <tr key={ob.studentObligationId}
                                            style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${ri * 0.05}s` }}
                                            className={`transition-colors ${ri % 2 === 0 ? (darkMode ? "bg-[#1a1a1a]" : "bg-white") : (darkMode ? "bg-[#1a1a1a]/60" : "bg-gray-50/70")} ${darkMode ? "hover:bg-[#222]/30" : "hover:bg-gray-50"}`}>
                                            <td className={`px-3 py-2 font-medium border-r ${darkMode ? "text-gray-200 border-gray-600" : "text-gray-800 border-gray-300"}`}>
                                                {ob.obligationName}
                                                {ob.isOverdue && <span className="ml-1.5 text-red-500 bg-red-50 px-1.5 py-0.5 rounded text-[10px] font-normal">overdue</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                                {ob.paymentType === "gcash" && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">GCash</span>}
                                                {ob.paymentType === "cash"  && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">Cash</span>}
                                                {!ob.paymentType && <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                                {ob.receiptPath
                                                    ? <button onClick={() => setViewImageUrl(receiptUrl(ob.receiptPath!))}
                                                        className="text-orange-500 hover:text-orange-600 text-xs font-semibold hover:underline inline-flex items-center gap-1">
                                                        <FiImage className="w-3 h-3" /> View
                                                      </button>
                                                    : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-right font-semibold border-r ${darkMode ? "text-gray-300 border-gray-600" : "text-gray-700 border-gray-300"}`}>
                                                {ob.amountPaid != null ? `₱${Number(ob.amountPaid).toFixed(2)}` : `₱${Number(ob.amount).toFixed(2)}`}
                                            </td>
                                            <td className={`px-3 py-2 border-r ${darkMode ? "text-gray-300 border-gray-600" : "text-gray-700 border-gray-300"}`}>
                                                {ob.verifiedByName
                                                    ? <><span className="font-medium">{ob.verifiedByName}</span>{ob.verifiedByRole && <span className={`ml-1 text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>({ob.verifiedByRole})</span>}</>
                                                    : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "text-gray-400 border-gray-600" : "text-gray-500 border-gray-300"}`}>
                                                {ob.verifiedAt ? fmtDateTime(ob.verifiedAt) : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>{statusBadge(ob.status)}</td>
                                            <td className="px-3 py-2 text-center">
                                                <button onClick={() => setCashTarget({ soId: ob.studentObligationId, name: ob.obligationName })}
                                                    className="text-orange-500 hover:text-orange-600 text-xs font-semibold hover:underline">
                                                    Cash
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* ── Proof of Compliance section ── */}
                            {proofObs.length > 0 && (
                                <>
                                    <tr className={darkMode ? "bg-[#222]/30" : "bg-gray-50"}>
                                        <td colSpan={7} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            Proof of Compliance
                                        </td>
                                    </tr>
                                    {proofObs.map((ob, ri) => (
                                        <tr key={ob.studentObligationId}
                                            style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${ri * 0.05}s` }}
                                            className={`transition-colors ${ri % 2 === 0 ? (darkMode ? "bg-[#1a1a1a]" : "bg-white") : (darkMode ? "bg-[#1a1a1a]/60" : "bg-gray-50/70")} ${darkMode ? "hover:bg-[#222]/30" : "hover:bg-gray-50"}`}>
                                            <td className={`px-3 py-2 font-medium border-r ${darkMode ? "text-gray-200 border-gray-600" : "text-gray-800 border-gray-300"}`}>
                                                {ob.obligationName}
                                                {ob.isOverdue && <span className="ml-1.5 text-red-500 bg-red-50 px-1.5 py-0.5 rounded text-[10px] font-normal">overdue</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                                <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>—</span>
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                                {ob.proofImage
                                                    ? <button onClick={() => setViewImageUrl(receiptUrl(ob.proofImage!))}
                                                        className="text-orange-500 hover:text-orange-600 text-xs font-semibold hover:underline inline-flex items-center gap-1">
                                                        <FiImage className="w-3 h-3" /> View
                                                      </button>
                                                    : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-right border-r ${darkMode ? "text-gray-400 border-gray-600" : "text-gray-400 border-gray-300"}`}>—</td>
                                            <td className={`px-3 py-2 border-r ${darkMode ? "text-gray-300 border-gray-600" : "text-gray-700 border-gray-300"}`}>
                                                {ob.verifiedByName
                                                    ? <><span className="font-medium">{ob.verifiedByName}</span>{ob.verifiedByRole && <span className={`ml-1 text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>({ob.verifiedByRole})</span>}</>
                                                    : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "text-gray-400 border-gray-600" : "text-gray-500 border-gray-300"}`}>
                                                {ob.verifiedAt ? fmtDateTime(ob.verifiedAt) : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                                {ob.status === "pending_verification" && ob.proofImage ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleVerifyProof(ob.studentObligationId, "paid")}
                                                            disabled={verifyingId === ob.studentObligationId}
                                                            className="px-2 py-0.5 text-[10px] bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-60">
                                                            {verifyingId === ob.studentObligationId ? "..." : "Verify"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyProof(ob.studentObligationId, "unpaid")}
                                                            disabled={verifyingId === ob.studentObligationId}
                                                            className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200 disabled:opacity-60">
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : proofStatusBadge(ob.status)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className={`text-[10px] ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}

                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
        </>
    );
}

// ─── Mobile Obligation Accordion Content ─────────────────────────────────────

interface MobileObligationAccordionProps {
    studentId: number;
    token: string;
    cache: Record<number, AdminObligationItem[]>;
    onCache: (id: number, data: AdminObligationItem[]) => void;
    darkMode: boolean;
}
function MobileObligationAccordion({ studentId, token, cache, onCache, darkMode }: MobileObligationAccordionProps) {
    const [loading, setLoading] = useState(false);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);

    useEffect(() => {
        if (cache[studentId] !== undefined) return;
        setLoading(true);
        adminStudentService.getStudentObligations(token, studentId)
            .then(data => onCache(studentId, data))
            .finally(() => setLoading(false));
    }, [studentId, token, cache, onCache]);

    async function handleVerifyProof(soId: number, status: "paid" | "unpaid") {
        setVerifyingId(soId);
        try {
            await adminStudentService.verifyProof(token, soId, status);
            onCache(studentId, (cache[studentId] ?? []).map(ob =>
                ob.studentObligationId === soId ? { ...ob, status } : ob
            ));
        } catch { /* silent */ } finally { setVerifyingId(null); }
    }

    const obs = cache[studentId];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (!obs || obs.length === 0) {
        return <p className="text-xs text-gray-400 py-2 text-center">No obligations assigned.</p>;
    }

    const payObs   = obs.filter(ob => ob.requiresPayment);
    const proofObs = obs.filter(ob => !ob.requiresPayment);

    return (
        <div className="flex flex-col gap-3 mt-2">
            {payObs.length > 0 && (
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Payment Submissions</p>
                    <div className="flex flex-col gap-1">
                        {payObs.map(ob => (
                            <div key={ob.studentObligationId}
                                className={`rounded-lg border px-3 py-2 ${darkMode ? "bg-[#222]/40 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                            {ob.obligationName}
                                            {ob.isOverdue && <span className="ml-1 text-red-500 text-[10px]">(overdue)</span>}
                                        </p>
                                        <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {ob.paymentType === "gcash" && <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">GCash</span>}
                                            {ob.paymentType === "cash"  && <span className="px-1 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-semibold">Cash</span>}
                                            {ob.amountPaid != null
                                                ? <span className="font-semibold">₱{Number(ob.amountPaid).toFixed(2)}</span>
                                                : <span>₱{Number(ob.amount).toFixed(2)}</span>}
                                        </div>
                                        {ob.verifiedByName && (
                                            <p className={`text-[10px] mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                                By: {ob.verifiedByName} {ob.verifiedByRole && `(${ob.verifiedByRole})`}
                                            </p>
                                        )}
                                    </div>
                                    {statusBadge(ob.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {proofObs.length > 0 && (
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Proof of Compliance</p>
                    <div className="flex flex-col gap-1">
                        {proofObs.map(ob => (
                            <div key={ob.studentObligationId}
                                className={`rounded-lg border px-3 py-2 ${darkMode ? "bg-[#222]/40 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                            {ob.obligationName}
                                            {ob.isOverdue && <span className="ml-1 text-red-500 text-[10px]">(overdue)</span>}
                                        </p>
                                        {ob.proofImage
                                            ? <a href={receiptUrl(ob.proofImage)} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-orange-500 hover:underline">
                                                <FiImage className="w-3 h-3" /> View Proof
                                              </a>
                                            : <p className={`text-[10px] mt-0.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>No proof submitted</p>}
                                        {ob.verifiedByName && (
                                            <p className={`text-[10px] mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                                By: {ob.verifiedByName} {ob.verifiedByRole && `(${ob.verifiedByRole})`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        {proofStatusBadge(ob.status)}
                                        {ob.status === "pending_verification" && ob.proofImage && (
                                            <div className="flex gap-1 mt-1">
                                                <button
                                                    onClick={() => handleVerifyProof(ob.studentObligationId, "paid")}
                                                    disabled={verifyingId === ob.studentObligationId}
                                                    className="px-2 py-0.5 text-[10px] bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-60">
                                                    {verifyingId === ob.studentObligationId ? "..." : "Verify"}
                                                </button>
                                                <button
                                                    onClick={() => handleVerifyProof(ob.studentObligationId, "unpaid")}
                                                    disabled={verifyingId === ob.studentObligationId}
                                                    className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200 disabled:opacity-60">
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortKey = "name" | "section" | "year" | "dept" | "pending" | "paid";

const SECTIONS = ["A","B","C","D","E","F","G","H"];

const StudentObligationList = () => {
    const { accessToken, user } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [students,   setStudents]   = useState<AdminStudentItem[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [obsCache,   setObsCache]   = useState<Record<number, AdminObligationItem[]>>({});

    const [search,           setSearch]           = useState((location.state as any)?.search ?? "");
    const [obligationFilter, setObligationFilter] = useState<string>((location.state as any)?.obligationFilter ?? "");
    const [deptFilter,       setDeptFilter]       = useState((location.state as any)?.programFilter ?? "all");
    const [yearFilter,    setYearFilter]    = useState("all");
    const [sectionFilter, setSectionFilter] = useState("all");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [sortKey,       setSortKey]       = useState<SortKey>("name");
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

    const isRestricted = ["class_officer", "program_head"].includes(user?.role ?? "");

    const load = useCallback(() => {
        if (!accessToken) return;
        setLoading(true);
        adminStudentService.listStudents(accessToken)
            .then(setStudents)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    useEffect(() => { load(); }, [load]);

    // Auto-expand first student row when arriving with an obligation filter
    useEffect(() => {
        if (obligationFilter && students.length > 0 && expandedId === null) {
            setExpandedId(students[0].studentId);
        }
    }, [obligationFilter, students]);

    const handleCache = useCallback((id: number, data: AdminObligationItem[]) => {
        setObsCache(prev => ({ ...prev, [id]: data }));
    }, []);

    function toggleExpand(studentId: number) {
        setExpandedId(prev => prev === studentId ? null : studentId);
    }

    const PROGRAMS_LIST = [
        { code: "CpE", name: "Computer Engineering" },
        { code: "CE",  name: "Civil Engineering" },
        { code: "ECE", name: "Electronics Engineering" },
        { code: "EE",  name: "Electrical Engineering" },
        { code: "ME",  name: "Mechanical Engineering" },
    ];

    const q = search.toLowerCase();
    const obQ = obligationFilter.toLowerCase();
    let filtered = students.filter(s => {
        // If an obligation name filter is active, only show students who have that obligation
        if (obQ) {
            const hasObligation = (obsCache[s.studentId] ?? []).some(ob => ob.obligationName.toLowerCase().includes(obQ));
            // Also allow rows not yet loaded in cache — show all if cache empty for this student
            const cacheLoaded = s.studentId in obsCache;
            if (cacheLoaded && !hasObligation) return false;
        }
        if (!q) return true;
        const byName = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentNo.toLowerCase().includes(q);
        const byObligation = (obsCache[s.studentId] ?? []).some(ob => ob.obligationName.toLowerCase().includes(q));
        return byName || byObligation;
    });
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
        statusFilter !== "all",
        sortKey !== "name",
    ].filter(Boolean).length;

    const bg   = darkMode ? "bg-[#111111] text-gray-100" : "bg-gray-50 text-gray-900";
    const card = darkMode ? "bg-[#1a1a1a]" : "bg-white";
    const th   = darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-500";

    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${bg}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${bg}`}>
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {/* ── Page Header ── */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className={`font-bold text-lg sm:text-xl ${darkMode ? "text-white" : "text-gray-800"}`}>
                        Student Obligations
                    </h1>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                        {isRestricted && students[0]
                            ? `${students[0].programName} · ${students.length} student${students.length !== 1 ? "s" : ""}`
                            : `${students.length} student${students.length !== 1 ? "s" : ""} across all programs`}
                    </p>
                </div>
                <button onClick={load} disabled={loading} title="Refresh"
                    className={`p-2 border-2 rounded-xl transition shadow-sm disabled:opacity-50 ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

            {/* ── Search + Filter Bar ── */}
            <div className="flex items-center gap-2 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search by name or student no..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className={`border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full shadow-sm ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"}`} />
                </div>

                <div className="relative" ref={filterRef}>
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm ${
                            showFilters || activeFilterCount > 0 ? "bg-primary text-white" : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}>
                        <FiFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Sort &amp; Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {showFilters && (
                        <div className={`absolute right-0 top-full mt-2 z-30 rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-72 flex flex-col gap-3 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                            <p className={`text-xs font-bold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-400"}`}>Sort &amp; Filter</p>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sort by</label>
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="name">Name (A–Z)</option>
                                    <option value="section">Section</option>
                                    <option value="year">Year Level</option>
                                    {!isRestricted && <option value="dept">Program</option>}
                                    <option value="pending">Most Pending</option>
                                    <option value="paid">Most Cleared</option>
                                </select>
                            </div>

                            {!isRestricted && (
                                <div>
                                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Program</label>
                                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                                        className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                        <option value="all">All Programs</option>
                                        {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Year Level</label>
                                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="all">All Year Levels</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Section</label>
                                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="all">All Sections</option>
                                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="all">All Status</option>
                                    <option value="all_paid">All Cleared</option>
                                    <option value="has_pending">Has Pending Verification</option>
                                    <option value="has_unpaid">Has Unpaid Obligation</option>
                                </select>
                            </div>

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

                <span className={`hidden sm:flex items-center text-xs font-medium border px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm ${darkMode ? "bg-[#1a1a1a] border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Student Accordion Table ── */}
            {filtered.length === 0 ? (
                <div className={`rounded-2xl border-2 p-10 text-center text-sm ${darkMode ? "bg-[#1a1a1a] border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                    No students found.
                </div>
            ) : (
                <>
                    <div className={`rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)] ${card}`}>
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] border-collapse">
                            <thead className={`${th}`}>
                                <tr className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                                    <th className="pl-4 pr-2 py-2 w-8"></th>
                                    <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student Name</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Student No.</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Year / Section</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Obligations</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Clearance</th>
                                    <th className="px-3 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s, i) => {
                                    const isExpanded = expandedId === s.studentId;
                                    const rowBg = isExpanded
                                        ? (darkMode ? "bg-[#222]/60" : "bg-gray-100")
                                        : i % 2 === 0
                                            ? (darkMode ? "bg-[#1a1a1a]" : "bg-white")
                                            : (darkMode ? "bg-[#1a1a1a]/60" : "bg-gray-50/70");
                                    return (
                                        <React.Fragment key={s.studentId}>
                                            <tr
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors cursor-pointer ${darkMode ? "hover:bg-[#222]/60" : "hover:bg-gray-100"} ${rowBg} border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                                                onClick={() => toggleExpand(s.studentId)}>
                                                <td className="pl-4 pr-2 py-2.5 w-8">
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar src={s.avatarPath} />
                                                        <div className={`font-semibold text-xs leading-tight ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                                                            {s.firstName} {s.lastName}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`text-xs font-mono ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{s.studentNo}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{s.programName}</span>
                                                </td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                                    {yearLabel(s.yearLevel)} · Section {s.section}
                                                </td>
                                                <td className="px-3 py-2.5 text-center" onClick={e => { e.stopPropagation(); navigate("/dashboard/students/obligations-list", { state: { search: s.studentNo } }); }}>
                                                    {obligationsCell(s.obligationsPaid, s.obligationsTotal, darkMode)}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {clearanceBadge(s.clearanceStatus)}
                                                </td>
                                                <td className={`px-3 py-2.5 text-center ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                                                    {isExpanded
                                                        ? <FiChevronUp className="w-4 h-4 mx-auto text-orange-500" />
                                                        : <FiChevronRight className="w-4 h-4 mx-auto" />}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <ObligationAccordion
                                                    studentId={s.studentId}
                                                    token={accessToken!}
                                                    cache={obsCache}
                                                    onCache={handleCache}
                                                    darkMode={darkMode} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};

export default StudentObligationList;
