import { Fragment, useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FiRefreshCw, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiChevronRight, FiImage, FiX } from "react-icons/fi";
import { receiptUrl } from "../../services/admin-student.service";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useOfflineCache } from "../../hooks/useOfflineCache";

import { adminStudentService } from "../../services/admin-student.service";
import type { AdminStudentItem, AdminObligationItem } from "../../services/admin-student.service";

// ─── Cash Modal ───────────────────────────────────────────────────────────────

interface CashModalProps { studentObligationId: number; obligationName: string; amount: number; token: string; onClose: () => void; onDone: () => void; }
function CashModal({ studentObligationId, obligationName, amount, token, onClose, onDone }: CashModalProps) {
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    async function submit() {
        setSaving(true);
        try {
            await adminStudentService.recordCash(token, studentObligationId, amount, notes);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }
    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl w-full max-w-sm p-6 relative" style={{ animation: 'fadeInUp 0.2s ease both' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"><FiX className="w-4 h-4" /></button>
                <h3 className="font-bold text-gray-800 mb-1">Record Cash Payment</h3>
                <p className="text-sm text-gray-500 mb-4">{obligationName}</p>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (PHP)</label>
                <div className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm mb-3 font-semibold text-gray-800">
                    ₱{Number(amount).toFixed(2)}
                </div>
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
        </div>,
        document.body
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: number, paymentStatus?: number | null) {
    // Payment was rejected — overrides obligation status
    if (paymentStatus === 2 && status === 0) {
        return <span className="text-xs font-semibold text-red-500">Rejected</span>;
    }
    const colors: Record<number, string> = {
        2: "text-green-600",
        3: "text-blue-500",
        1: "text-yellow-500",
        0: "text-gray-400",
    };
    const labels: Record<number, string> = {
        2: "Verified", 3: "Waived",
        1: "Pending", 0: "Pending",
    };
    return (
        <span className={`text-xs font-semibold ${colors[status] ?? "text-gray-400"}`}>
            {labels[status] ?? String(status)}
        </span>
    );
}

function proofStatusBadge(status: number) {
    const colors: Record<number, string> = {
        2: "text-green-600",
        3: "text-blue-500",
        1: "text-yellow-500",
        0: "text-gray-400",
    };
    const labels: Record<number, string> = {
        2: "Verified",
        3: "Waived",
        1: "Pending",
        0: "Pending",
    };
    return (
        <span className={`text-xs font-semibold ${colors[status] ?? "text-gray-400"}`}>
            {labels[status] ?? String(status)}
        </span>
    );
}

function clearanceBadge(s: number | null) {
    const colors: Record<number, string> = {
        2: "text-green-600",
        1: "text-blue-500",
        3: "text-red-500",
        0: "text-blue-500",
    };
    const val = s ?? 0;
    const labels: Record<number, string> = {
        2: "Approved", 1: "Processing",
        3: "Rejected", 0: "Processing",
    };
    return (
        <span className={`text-xs font-semibold ${colors[val] ?? "text-gray-400"}`}>
            {labels[val] ?? String(val)}
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
    const imgSrc = src ? (src.startsWith("http") ? src : src.startsWith("/uploads") ? src : `/uploads/${src}`) : null;
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0 relative`}>
            <DefaultAvatarSvg />
            {imgSrc && (
                <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
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
    const [cashTarget, setCashTarget] = useState<{ soId: number; name: string; amount: number } | null>(null);

    useEffect(() => {
        if (cache[studentId] !== undefined) return;
        // Try localStorage cache first (supports offline mode)
        try {
            const raw = localStorage.getItem(`eso_cache_admin_obs_${studentId}`);
            if (raw) {
                const { data, cachedAt } = JSON.parse(raw);
                if (Date.now() - cachedAt < 3600000) { onCache(studentId, data); return; }
            }
        } catch {}
        if (!navigator.onLine) return;
        setLoading(true);
        adminStudentService.getStudentObligations(token, studentId)
            .then(data => onCache(studentId, data))
            .finally(() => setLoading(false));
    }, [studentId, token, cache, onCache]);

    const obs = cache[studentId];

    async function handleVerifyProof(soId: number, status: number) {
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

    if (loading) return (
        <tr><td colSpan={8} className={`${panelOuter} px-6 py-6`}>
            <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500" />
            </div>
        </td></tr>
    );

    if (!obs || obs.length === 0) return (
        <tr><td colSpan={8} className={`${panelOuter} px-6 py-4`}>
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
                amount={cashTarget.amount}
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
            <tr><td colSpan={8} className="p-0">
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
            <td colSpan={8} className={`${panelOuter} px-4 py-3`}>
                <div className={`${panelInner} overflow-x-auto`}>
                    <table className="eso-table w-full text-xs border-collapse">
                        <thead>
                            <tr className={`border-b-2 ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                <th className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Obligation Name</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Method</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Proof</th>
                                <th className={`px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide w-20 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Amount</th>
                                <th className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide w-36 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Verified By</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-40 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Verified At</th>
                                <th className={`px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-32 border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>Status</th>
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
                                                {ob.paymentType === 1 && <span className="text-xs font-semibold text-blue-500">GCash</span>}
                                                {ob.paymentType === 2  && <span className="text-xs font-semibold text-orange-500">Cash</span>}
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
                                            <td className={`px-3 py-2 border-r max-w-[9rem] ${darkMode ? "text-gray-300 border-gray-600" : "text-gray-700 border-gray-300"}`}>
                                                {ob.verifiedByName
                                                    ? <div className="min-w-0">
                                                        <p className="font-medium truncate text-xs">{ob.verifiedByName}</p>
                                                        {ob.verifiedByRole && <p className={`text-[10px] truncate ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{ob.verifiedByRole}</p>}
                                                      </div>
                                                    : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "text-gray-400 border-gray-600" : "text-gray-500 border-gray-300"}`}>
                                                {ob.verifiedAt ? fmtDateTime(ob.verifiedAt) : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>{statusBadge(ob.status)}</td>
                                            <td className="px-3 py-2 text-center">
                                                {ob.paymentType !== 1 && ob.status !== 2 ? (
                                                    <button onClick={() => setCashTarget({ soId: ob.studentObligationId, name: ob.obligationName, amount: ob.amount })}
                                                        className="text-orange-500 hover:text-orange-600 text-xs font-semibold hover:underline">
                                                        Cash
                                                    </button>
                                                ) : (
                                                    <span className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>
                                                )}
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
                                            <td className={`px-3 py-2 border-r max-w-[9rem] ${darkMode ? "text-gray-300 border-gray-600" : "text-gray-700 border-gray-300"}`}>
                                                {ob.verifiedByName
                                                    ? <div className="min-w-0">
                                                        <p className="font-medium truncate text-xs">{ob.verifiedByName}</p>
                                                        {ob.verifiedByRole && <p className={`text-[10px] truncate ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{ob.verifiedByRole}</p>}
                                                      </div>
                                                    : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "text-gray-400 border-gray-600" : "text-gray-500 border-gray-300"}`}>
                                                {ob.verifiedAt ? fmtDateTime(ob.verifiedAt) : <span className={darkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                                            </td>
                                            <td className={`px-3 py-2 text-center border-r ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                                {ob.status === 1 && ob.proofImage ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleVerifyProof(ob.studentObligationId, 2)}
                                                            disabled={verifyingId === ob.studentObligationId}
                                                            className="px-2 py-0.5 text-[10px] bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-60">
                                                            {verifyingId === ob.studentObligationId ? "..." : "Verify"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerifyProof(ob.studentObligationId, 0)}
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

                        {/* ── Payment Summary Footer ── */}
                        {payObs.length > 0 && (() => {
                            const totalPayable = payObs.reduce((sum, ob) => sum + Number(ob.amount), 0);
                            const totalPaid    = payObs.filter(ob => ob.status === 2).reduce((sum, ob) => sum + Number(ob.amountPaid ?? ob.amount), 0);
                            const remaining    = totalPayable - totalPaid;
                            const cellCls = `px-3 py-2 text-right text-xs font-bold border-t-2 ${darkMode ? "border-gray-600 text-gray-200" : "border-gray-300 text-gray-700"}`;
                            const labelCls = `px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide border-t-2 ${darkMode ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-500"}`;
                            return (
                                <tfoot>
                                    <tr className={darkMode ? "bg-[#222]/40" : "bg-gray-50"}>
                                        <td colSpan={2} className={labelCls}>Payment Summary</td>
                                        <td className={`${cellCls} text-center`}>—</td>
                                        <td className={cellCls}>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`text-[10px] font-normal ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Assessment</span>
                                                <span>₱{totalPayable.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td colSpan={2} className={cellCls}>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`text-[10px] font-normal ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Collected</span>
                                                <span className="text-green-600">₱{totalPaid.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className={`${cellCls} ${remaining > 0 ? "text-red-500" : "text-green-600"}`}>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`text-[10px] font-normal ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Outstanding</span>
                                                <span>₱{remaining.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className={`border-t-2 ${darkMode ? "border-gray-600" : "border-gray-300"}`}></td>
                                    </tr>
                                </tfoot>
                            );
                        })()}
                    </table>
                </div>
            </td>
        </tr>
        </>
    );
}

export function _unusedMobileAccordion({ studentId, token, cache, onCache, darkMode }: { studentId: number; token: string; cache: Record<number, AdminObligationItem[]>; onCache: (id: number, data: AdminObligationItem[]) => void; darkMode: boolean; }) {
    const [loading, setLoading] = useState(false);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);

    useEffect(() => {
        if (cache[studentId] !== undefined) return;
        // Try localStorage cache first (supports offline mode)
        try {
            const raw = localStorage.getItem(`eso_cache_admin_obs_${studentId}`);
            if (raw) {
                const { data, cachedAt } = JSON.parse(raw);
                if (Date.now() - cachedAt < 3600000) { onCache(studentId, data); return; }
            }
        } catch {}
        if (!navigator.onLine) return;
        setLoading(true);
        adminStudentService.getStudentObligations(token, studentId)
            .then(data => onCache(studentId, data))
            .finally(() => setLoading(false));
    }, [studentId, token, cache, onCache]);

    async function handleVerifyProof(soId: number, status: number) {
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
                                            {ob.paymentType === 1 && <span className="text-[10px] font-semibold text-blue-500">GCash</span>}
                                            {ob.paymentType === 2  && <span className="text-[10px] font-semibold text-orange-500">Cash</span>}
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
                                        {ob.status === 1 && ob.proofImage && (
                                            <div className="flex gap-1 mt-1">
                                                <button
                                                    onClick={() => handleVerifyProof(ob.studentObligationId, 2)}
                                                    disabled={verifyingId === ob.studentObligationId}
                                                    className="px-2 py-0.5 text-[10px] bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-60">
                                                    {verifyingId === ob.studentObligationId ? "..." : "Verify"}
                                                </button>
                                                <button
                                                    onClick={() => handleVerifyProof(ob.studentObligationId, 0)}
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
            {/* ── Mobile Payment Summary ── */}
            {payObs.length > 0 && (() => {
                const totalPayable = payObs.reduce((sum, ob) => sum + Number(ob.amount), 0);
                const totalPaid    = payObs.filter(ob => ob.status === 2).reduce((sum, ob) => sum + Number(ob.amountPaid ?? ob.amount), 0);
                const remaining    = totalPayable - totalPaid;
                return (
                    <div className={`mt-3 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 ${darkMode ? "bg-[#222]/60 border border-gray-700" : "bg-white border border-gray-200"}`}>
                        <div className="text-center flex-1">
                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Assessment</p>
                            <p className={`text-xs font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>₱{totalPayable.toFixed(2)}</p>
                        </div>
                        <div className={`w-px h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className="text-center flex-1">
                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Collected</p>
                            <p className="text-xs font-bold text-green-600">₱{totalPaid.toFixed(2)}</p>
                        </div>
                        <div className={`w-px h-8 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className="text-center flex-1">
                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Outstanding</p>
                            <p className={`text-xs font-bold ${remaining > 0 ? "text-red-500" : "text-green-600"}`}>₱{remaining.toFixed(2)}</p>
                        </div>
                    </div>
                );
            })()}
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
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [obsCache,   setObsCache]   = useState<Record<number, AdminObligationItem[]>>({});

    const { data: studentsData, loading, error, refresh: load } = useOfflineCache<AdminStudentItem[]>(
        `admin_students_${accessToken ?? ""}`,
        () => adminStudentService.listStudents(accessToken!),
        [accessToken]
    );
    const students = studentsData ?? [];

    const [search,           setSearch]           = useState((location.state as any)?.search ?? "");
    const [obligationFilter] = useState<string>((location.state as any)?.obligationFilter ?? "");
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

    // Auto-expand first student row when arriving with an obligation filter
    useEffect(() => {
        if (obligationFilter && students.length > 0 && expandedId === null) {
            setExpandedId(students[0].studentId);
        }
    }, [obligationFilter, students]);

    const handleCache = useCallback((id: number, data: AdminObligationItem[]) => {
        setObsCache(prev => ({ ...prev, [id]: data }));
        try {
            localStorage.setItem(`eso_cache_admin_obs_${id}`,
                JSON.stringify({ data, cachedAt: Date.now() }));
        } catch {}
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
            {(() => {
                const grandPayable = filtered.reduce((s, st) => s + (st.totalPayable ?? 0), 0);
                const grandPaid    = filtered.reduce((s, st) => s + (st.totalPaid    ?? 0), 0);
                const grandBalance = grandPayable - grandPaid;
                return (
                    <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className={`text-base sm:text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                                Student Obligations
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {/* Financial Summary Card */}
                            {grandPayable > 0 && (
                                <div className={`flex items-stretch divide-x rounded-xl shadow-sm text-right text-xs ${darkMode ? "bg-[#1a1a1a] divide-gray-700" : "bg-white divide-gray-100"}`}>
                                    <div className="px-3 py-2">
                                        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Total Assessment</p>
                                        <p className={`font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>₱{grandPayable.toFixed(2)}</p>
                                    </div>
                                    <div className="px-3 py-2">
                                        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Total Collected</p>
                                        <p className="font-bold text-green-600">₱{grandPaid.toFixed(2)}</p>
                                    </div>
                                    <div className="px-3 py-2">
                                        <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Outstanding Balance</p>
                                        <p className={`font-bold ${grandBalance > 0 ? "text-red-500" : "text-green-600"}`}>₱{grandBalance.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}

                            <button onClick={load} disabled={loading} title="Refresh"
                                className={`p-2 border-2 rounded-xl transition shadow-sm disabled:opacity-50 ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                                <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>
                );
            })()}

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

            </div>

            {/* ── Student Accordion Table ── */}
            {filtered.length === 0 ? (
                <div className={`rounded-2xl border-2 p-10 text-center text-sm ${darkMode ? "bg-[#1a1a1a] border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                    No students found.
                </div>
            ) : (
                <>
                    <div className={`rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${card}`}>
                        <table className="eso-table w-full min-w-[750px] border-collapse">
                            <thead className={`${th}`}>
                                <tr className={`border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
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
                                        <Fragment key={s.studentId}>
                                            <tr
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors cursor-pointer ${darkMode ? "hover:bg-[#222]/60" : "hover:bg-gray-100"} ${rowBg} border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                                                onClick={() => toggleExpand(s.studentId)}>
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
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </>
            )}
        </div>
    );
};

export default StudentObligationList;
