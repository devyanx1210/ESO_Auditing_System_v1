import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiRefreshCw, FiCheckSquare, FiClock, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiTrash2 } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { adminStudentService, receiptUrl } from "../../services/admin-student.service";
import type { PendingPaymentItem, PaymentHistoryItem } from "../../services/admin-student.service";

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

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
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

function UserAvatar({ size = "md" }: { size?: "sm" | "md" }) {
    const sz = size === "md" ? "w-9 h-9" : "w-8 h-8";
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0`}>
            <DefaultAvatarSvg />
        </div>
    );
}

// ─── Sub-tab toggle ───────────────────────────────────────────────────────────

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

// ─── Verify Payment Modal ─────────────────────────────────────────────────────

interface VerifyModalProps {
    item: PendingPaymentItem | null; token: string; onClose: () => void; onDone: () => void;
}
function VerifyModal({ item, token, onClose, onDone }: VerifyModalProps) {
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving]   = useState(false);
    const [err, setErr]         = useState("");
    const [imgError, setImgError] = useState(false);
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
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-lg p-6" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                <h3 className="font-bold text-gray-800 text-lg">Review Submission</h3>
                <p className="text-sm text-gray-500 mb-4">{item.studentName} · {item.obligationName}</p>
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
                        {imgError ? (
                            <div className="w-full mb-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-6 gap-2">
                                <p className="text-xs text-gray-400">Image could not be loaded.</p>
                                <a href={receiptUrl(item.receiptPath)} target="_blank" rel="noreferrer"
                                    className="text-xs text-orange-500 underline font-medium">Open in new tab</a>
                            </div>
                        ) : (
                            <a href={receiptUrl(item.receiptPath)} target="_blank" rel="noreferrer" className="block mb-4">
                                <img src={receiptUrl(item.receiptPath)} alt="GCash receipt"
                                    onError={() => setImgError(true)}
                                    className="w-full max-h-64 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                            </a>
                        )}
                    </>
                )}
                <textarea rows={2} placeholder="Remarks (optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    value={remarks} onChange={e => setRemarks(e.target.value)} />
                {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                    <button onClick={() => act("approved")} disabled={saving}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                        {saving ? "Saving..." : "Verify"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteModalProps {
    items: PaymentHistoryItem[];
    onClose: () => void;
    onConfirm: () => void;
    confirming: boolean;
}
function DeleteConfirmModal({ items, onClose, onConfirm, confirming }: DeleteModalProps) {
    const [input, setInput] = useState("");
    const isSingle = items.length === 1;
    const expected = isSingle ? items[0].obligationName : "DELETE";
    const label = isSingle
        ? `Type the obligation name to confirm deletion:`
        : `Type DELETE to confirm deletion of ${items.length} submissions:`;
    const hint = isSingle ? `"${expected}"` : `"DELETE"`;
    const matches = input === expected;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <FiTrash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Delete Submission{items.length > 1 ? "s" : ""}</h3>
                        <p className="text-xs text-gray-500">This action cannot be undone.</p>
                    </div>
                </div>

                {isSingle && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-700">
                        <span className="font-semibold">{items[0].studentName}</span> · {items[0].obligationName}
                    </div>
                )}

                <p className="text-sm text-gray-600 mb-2">{label}</p>
                <p className="text-xs text-gray-400 mb-2">Expected: {hint}</p>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={expected}
                    className="w-full border-2 border-gray-300 focus:border-red-400 focus:outline-none rounded-xl px-3 py-2 text-sm mb-4"
                />
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} disabled={confirming}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 disabled:opacity-60">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={!matches || confirming}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition">
                        {confirming ? "Deleting..." : `Delete${items.length > 1 ? ` (${items.length})` : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Image Preview Modal ──────────────────────────────────────────────────────

function ImagePreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <button onClick={onClose}
                    className="absolute -top-9 right-0 text-white text-sm font-medium hover:text-gray-300 flex items-center gap-1">
                    ✕ Close
                </button>
                <img src={url} alt="Receipt" className="w-full rounded-2xl object-contain max-h-[80vh] bg-gray-900" />
            </div>
        </div>
    );
}

// ─── Sort / filter types ──────────────────────────────────────────────────────

type PaySortKey = "name" | "date" | "amount";

const PROGRAMS_LIST = [
    { code: "CpE", name: "Computer Engineering" },
    { code: "CE",  name: "Civil Engineering" },
    { code: "ECE", name: "Electronics Engineering" },
    { code: "EE",  name: "Electrical Engineering" },
    { code: "ME",  name: "Mechanical Engineering" },
];

// ─── Role guard ───────────────────────────────────────────────────────────────

const PAYMENT_ROLES = ["system_admin", "eso_officer", "class_officer", "program_head"];

// ─── Main Page ────────────────────────────────────────────────────────────────

const PaymentVerification = () => {
    const { accessToken, user } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();

    const [pending,      setPending]      = useState<PendingPaymentItem[]>([]);
    const [payHistory,   setPayHistory]   = useState<PaymentHistoryItem[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState("");
    const [paySubTab,    setPaySubTab]    = useState<"review" | "history">("review");
    const [verifyTarget, setVerifyTarget] = useState<PendingPaymentItem | null>(null);
    const [verifyingAll, setVerifyingAll] = useState(false);
    const [verifyAllMsg, setVerifyAllMsg] = useState("");
    const [search,             setSearch]             = useState("");
    const [sortKey,            setSortKey]            = useState<PaySortKey>("date");
    const [programFilter,      setProgramFilter]      = useState((location.state as any)?.programFilter ?? "all");
    const [verifiedByFilter,   setVerifiedByFilter]   = useState("");
    const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
    const [showFilters,        setShowFilters]        = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // ── Bulk selection state ──
    const [selectedPending,  setSelectedPending]  = useState<Set<number>>(new Set());
    const [selectedHistory,  setSelectedHistory]  = useState<Set<number>>(new Set());
    const [bulkVerifying,    setBulkVerifying]    = useState(false);
    const [bulkUnverifying,  setBulkUnverifying]  = useState(false);
    const [bulkMsg,          setBulkMsg]          = useState("");

    // ── Delete modal state ──
    const [deleteItems,   setDeleteItems]   = useState<PaymentHistoryItem[]>([]);
    const [deleting,      setDeleting]      = useState(false);
    const showDeleteModal = deleteItems.length > 0;
    const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

    const canAccessPayments = PAYMENT_ROLES.includes(user?.role ?? "");

    const load = useCallback(() => {
        if (!accessToken || !canAccessPayments) return;
        setLoading(true);
        setSelectedPending(new Set());
        setSelectedHistory(new Set());
        setBulkMsg("");
        Promise.all([
            adminStudentService.getPendingPayments(accessToken).catch(() => [] as PendingPaymentItem[]),
            adminStudentService.getPaymentHistory(accessToken).catch(() => [] as PaymentHistoryItem[]),
        ])
            .then(([p, ph]) => { setPending(p); setPayHistory(ph); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken, canAccessPayments]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node))
                setShowFilters(false);
        }
        if (showFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters]);

    // ── Verify all ──
    async function handleVerifyAll() {
        if (!accessToken) return;
        setVerifyingAll(true); setVerifyAllMsg("");
        try {
            const res = await adminStudentService.verifyAll(accessToken);
            setVerifyAllMsg(`${res.count} submission(s) verified.`);
            load();
        } catch (e: any) { setVerifyAllMsg(e.message); }
        finally { setVerifyingAll(false); }
    }

    // ── Bulk verify selected pending ──
    async function handleBulkVerify() {
        if (!accessToken || !selectedPending.size) return;
        setBulkVerifying(true); setBulkMsg("");
        try {
            const ids = [...selectedPending];
            await adminStudentService.bulkVerify(accessToken, ids);
            setBulkMsg(`${ids.length} submission(s) verified.`);
            load();
        } catch (e: any) { setBulkMsg(e.message); }
        finally { setBulkVerifying(false); }
    }

    // ── Bulk unverify selected history ──
    async function handleBulkUnverify() {
        if (!accessToken || !selectedHistory.size) return;
        setBulkUnverifying(true); setBulkMsg("");
        try {
            const ids = [...selectedHistory];
            await adminStudentService.bulkUnverify(accessToken, ids);
            setBulkMsg(`${ids.length} submission(s) returned to pending.`);
            load();
        } catch (e: any) { setBulkMsg(e.message); }
        finally { setBulkUnverifying(false); }
    }

    // ── Open delete modal ──
    function openDeleteModal() {
        const ids = [...selectedHistory];
        const items = payHistory.filter(h => ids.includes(h.paymentId));
        setDeleteItems(items);
    }

    // ── Confirm delete ──
    async function handleConfirmDelete() {
        if (!accessToken || !deleteItems.length) return;
        setDeleting(true);
        try {
            const ids = deleteItems.map(d => d.paymentId);
            await adminStudentService.bulkDelete(accessToken, ids);
            setBulkMsg(`${ids.length} submission(s) deleted.`);
            setDeleteItems([]);
            load();
        } catch (e: any) { setBulkMsg(e.message); }
        finally { setDeleting(false); }
    }

    const bg = darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900";

    function applyPaySearch<T extends { studentName: string; obligationName: string }>(items: T[]) {
        return search ? items.filter(i =>
            i.studentName.toLowerCase().includes(search.toLowerCase()) ||
            i.obligationName.toLowerCase().includes(search.toLowerCase())
        ) : items;
    }
    function applyProgram<T extends { programCode: string }>(items: T[]) {
        return programFilter !== "all" ? items.filter(i => i.programCode === programFilter) : items;
    }
    function applyVerifiedByFilter(items: PaymentHistoryItem[]) {
        if (!verifiedByFilter.trim()) return items;
        const q = verifiedByFilter.toLowerCase();
        return items.filter(i => (i.verifiedByName ?? "").toLowerCase().includes(q));
    }
    function applyHistoryStatus(items: PaymentHistoryItem[]) {
        if (historyStatusFilter === "verified")   return items.filter(i => i.paymentStatus === "approved");
        if (historyStatusFilter === "unverified") return items.filter(i => i.paymentStatus === "rejected");
        return items;
    }
    function applyPaySort(items: PendingPaymentItem[]) {
        if (sortKey === "name")   return [...items].sort((a, b) => a.studentName.localeCompare(b.studentName));
        if (sortKey === "amount") return [...items].sort((a, b) => b.amountPaid - a.amountPaid);
        return [...items].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }
    function applyHistSort(items: PaymentHistoryItem[]) {
        if (sortKey === "name")   return [...items].sort((a, b) => a.studentName.localeCompare(b.studentName));
        if (sortKey === "amount") return [...items].sort((a, b) => b.amountPaid - a.amountPaid);
        return [...items].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    const filteredPending       = applyPaySort(applyProgram(applyPaySearch(pending)));
    const filteredHistory       = applyHistSort(applyHistoryStatus(applyVerifiedByFilter(applyProgram(applyPaySearch(payHistory)))));
    const filteredPendingCount  = filteredPending.length;
    const filteredHistoryCount  = filteredHistory.length;
    const activeResultCount     = paySubTab === "review" ? filteredPendingCount : filteredHistoryCount;
    const activeFilterCount     = [programFilter !== "all", sortKey !== "date", verifiedByFilter.trim() !== "", historyStatusFilter !== "all"].filter(Boolean).length;

    // ── Select-all helpers ──
    function toggleAllPending(checked: boolean) {
        setSelectedPending(checked ? new Set(filteredPending.map(p => p.paymentId)) : new Set());
    }
    function togglePending(id: number, checked: boolean) {
        setSelectedPending(prev => { const s = new Set(prev); checked ? s.add(id) : s.delete(id); return s; });
    }
    function toggleAllHistory(checked: boolean) {
        setSelectedHistory(checked ? new Set(filteredHistory.map(h => h.paymentId)) : new Set());
    }
    function toggleHistory(id: number, checked: boolean) {
        setSelectedHistory(prev => { const s = new Set(prev); checked ? s.add(id) : s.delete(id); return s; });
    }

    const allPendingSelected = filteredPending.length > 0 && filteredPending.every(p => selectedPending.has(p.paymentId));
    const allHistorySelected = filteredHistory.length > 0 && filteredHistory.every(h => selectedHistory.has(h.paymentId));

    if (!canAccessPayments) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${bg}`}>
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-500">Access Denied</p>
                    <p className="text-sm text-gray-400 mt-1">You do not have permission to view submissions.</p>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${bg}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${bg}`}>
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {/* ── Page Header ── */}
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h1 className={`font-bold text-lg sm:text-xl ${darkMode ? "text-white" : "text-gray-800"}`}>
                        Submission Review
                    </h1>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                        {pending.length} submission{pending.length !== 1 ? "s" : ""} pending review
                    </p>
                </div>
                <button onClick={load} disabled={loading} title="Refresh"
                    className={`p-2 border-2 rounded-xl transition shadow-sm disabled:opacity-50 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            {/* ── Search + Filter Bar ── */}
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search by student name or obligation..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className={`border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full shadow-sm
                            ${darkMode ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"}`} />
                </div>

                {/* Sort & Filter */}
                <div className="relative" ref={filterRef}>
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm
                            ${showFilters || activeFilterCount > 0 ? "bg-orange-500 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                        <FiFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Sort &amp; Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {showFilters && (
                        <div className={`absolute right-0 top-full mt-2 z-30 rounded-2xl p-4 w-72 flex flex-col gap-3
                            ${darkMode
                                ? "bg-gray-900 border border-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
                                : "bg-white border border-gray-300 shadow-[0_8px_32px_rgba(0,0,0,0.18)] ring-1 ring-black/5"}`}>
                            <p className={`text-xs font-bold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sort &amp; Filter</p>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sort by</label>
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as PaySortKey)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
                                    <option value="date">Date Submitted (Newest)</option>
                                    <option value="name">Name (A–Z)</option>
                                    <option value="amount">Amount (Highest)</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Program</label>
                                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
                                    <option value="all">All Programs</option>
                                    {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>History Status</label>
                                <select value={historyStatusFilter} onChange={e => setHistoryStatusFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
                                    <option value="all">All</option>
                                    <option value="verified">Verified</option>
                                    <option value="unverified">Unverified</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Verified By</label>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input type="text" placeholder="Search verifier name..."
                                        value={verifiedByFilter} onChange={e => setVerifiedByFilter(e.target.value)}
                                        className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-8 pr-3 py-2 text-sm
                                            ${darkMode ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-800"}`} />
                                </div>
                            </div>

                            {activeFilterCount > 0 && (
                                <button onClick={() => { setSortKey("date"); setProgramFilter("all"); setVerifiedByFilter(""); setHistoryStatusFilter("all"); }}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition">
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results count */}
                <span className={`hidden sm:flex items-center text-xs font-medium px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm border
                    ${darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                    {activeResultCount} result{activeResultCount !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Sub-tabs ── */}
            <SubTabs
                active={paySubTab} onChange={tab => { setPaySubTab(tab); setBulkMsg(""); }}
                reviewCount={filteredPendingCount}
                historyCount={filteredHistoryCount}
                reviewLabel="Pending" historyLabel="History" />

            {/* ── Feedback message ── */}
            {bulkMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2.5 mb-3">
                    {bulkMsg}
                </div>
            )}

            {/* ── Pending Tab ── */}
            {paySubTab === "review" && (
                <>
                    {/* Action bar */}
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {filteredPending.length} submission{filteredPending.length !== 1 ? "s" : ""} pending
                            {selectedPending.size > 0 && ` · ${selectedPending.size} selected`}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {verifyAllMsg && <p className="text-sm text-green-600">{verifyAllMsg}</p>}
                            {selectedPending.size > 0 && (
                                <button onClick={handleBulkVerify} disabled={bulkVerifying}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 transition">
                                    {bulkVerifying ? "Verifying..." : `Verify Selected (${selectedPending.size})`}
                                </button>
                            )}
                            {filteredPending.length > 0 && (
                                <button onClick={handleVerifyAll} disabled={verifyingAll}
                                    className="px-4 py-2 text-sm bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                                    {verifyingAll ? "Processing..." : `Verify All (${filteredPending.length})`}
                                </button>
                            )}
                        </div>
                    </div>

                    {filteredPending.length === 0 ? (
                        <div className={`rounded-2xl border-2 p-10 text-center text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                            No pending submissions.
                        </div>
                    ) : (
                        <>
                            <div className={`rounded-2xl overflow-hidden border shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] border-collapse">
                                    <thead className={`${darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="px-3 py-2 text-center w-10">
                                                <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                    checked={allPendingSelected}
                                                    onChange={e => toggleAllPending(e.target.checked)} />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Obligation</th>
                                            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide">Amount</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Submitted</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20">Receipt</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                                        {filteredPending.map((p, i) => (
                                            <tr key={p.paymentId}
                                                onClick={() => togglePending(p.paymentId, !selectedPending.has(p.paymentId))}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors cursor-pointer
                                                    ${selectedPending.has(p.paymentId)
                                                        ? darkMode ? "bg-orange-900/30" : "bg-orange-50"
                                                        : i % 2 === 0
                                                            ? darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
                                                            : darkMode ? "bg-gray-800/60 hover:bg-gray-750" : "bg-gray-50/70 hover:bg-gray-100/50"
                                                    }`}>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                        checked={selectedPending.has(p.paymentId)}
                                                        onChange={e => togglePending(p.paymentId, e.target.checked)} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar size="sm" />
                                                        <div>
                                                            <div className={`font-semibold text-xs leading-tight ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{p.studentName}</div>
                                                            <div className={`text-xs font-mono mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{p.studentNo}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{programLabel(p.programCode)}</span>
                                                </td>
                                                <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{p.obligationName}</td>
                                                <td className={`px-3 py-2.5 text-right font-semibold text-xs ${darkMode ? "text-gray-200" : "text-gray-800"}`}>PHP {Number(p.amountPaid).toFixed(2)}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{fmtDate(p.submittedAt)}</div>
                                                    <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{fmtTime(p.submittedAt)}</div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    {p.receiptPath
                                                        ? <button onClick={() => setPreviewReceiptUrl(receiptUrl(p.receiptPath))}
                                                            className="text-orange-500 hover:text-orange-600 text-xs font-semibold hover:underline">
                                                            View
                                                          </button>
                                                        : <span className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setVerifyTarget(p)}
                                                        className="text-orange-500 hover:text-orange-600 text-xs font-semibold hover:underline">
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── History Tab ── */}
            {paySubTab === "history" && (
                <>
                    {/* Action bar */}
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {filteredHistory.length} reviewed submission{filteredHistory.length !== 1 ? "s" : ""}
                            {selectedHistory.size > 0 && ` · ${selectedHistory.size} selected`}
                        </p>
                        {selectedHistory.size > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={handleBulkUnverify} disabled={bulkUnverifying}
                                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-60 transition">
                                    {bulkUnverifying ? "Processing..." : `Return to Pending (${selectedHistory.size})`}
                                </button>
                                <button onClick={openDeleteModal}
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition flex items-center gap-1.5">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                    Delete Selected ({selectedHistory.size})
                                </button>
                            </div>
                        )}
                    </div>

                    {filteredHistory.length === 0 ? (
                        <div className={`rounded-2xl border-2 p-10 text-center text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                            No reviewed submissions yet.
                        </div>
                    ) : (
                        <>
                            <div className={`rounded-2xl overflow-hidden border shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] border-collapse">
                                    <thead className={`${darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="px-3 py-2 text-center w-10">
                                                <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                    checked={allHistorySelected}
                                                    onChange={e => toggleAllHistory(e.target.checked)} />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide w-52">Student</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Obligation</th>
                                            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide w-28">Amount</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20">Type</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Verified By</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-32">Verified At</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-24">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                                        {filteredHistory.map((h, i) => (
                                            <tr key={h.paymentId}
                                                onClick={() => toggleHistory(h.paymentId, !selectedHistory.has(h.paymentId))}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors cursor-pointer
                                                    ${selectedHistory.has(h.paymentId)
                                                        ? darkMode ? "bg-orange-900/30" : "bg-orange-50"
                                                        : i % 2 === 0
                                                            ? darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
                                                            : darkMode ? "bg-gray-800/60 hover:bg-gray-750" : "bg-gray-50/70 hover:bg-gray-100/50"
                                                    }`}>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                        checked={selectedHistory.has(h.paymentId)}
                                                        onChange={e => toggleHistory(h.paymentId, e.target.checked)} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar size="sm" />
                                                        <div>
                                                            <div className={`font-semibold text-xs leading-tight ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{h.studentName}</div>
                                                            <div className={`text-xs font-mono mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{h.studentNo}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{programLabel(h.programCode)}</span>
                                                </td>
                                                <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{h.obligationName}</td>
                                                <td className={`px-3 py-2.5 text-right font-semibold text-xs ${darkMode ? "text-gray-200" : "text-gray-800"}`}>PHP {Number(h.amountPaid).toFixed(2)}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.paymentType === "gcash" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                                                        {h.paymentType === "gcash" ? "GCash" : "Cash"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {h.verifiedByName
                                                        ? <div>
                                                            <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{h.verifiedByName}</div>
                                                            {h.verifiedByRole && <div className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{h.verifiedByRole}</div>}
                                                          </div>
                                                        : <span className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {h.verifiedAt
                                                        ? <>
                                                            <div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{fmtDate(h.verifiedAt)}</div>
                                                            <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{fmtTime(h.verifiedAt)}</div>
                                                          </>
                                                        : <span className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.paymentStatus === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {h.paymentStatus === "approved" ? "Verified" : "Unverified"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ── Image Preview Modal ── */}
            {previewReceiptUrl && (
                <ImagePreviewModal url={previewReceiptUrl} onClose={() => setPreviewReceiptUrl(null)} />
            )}

            {/* ── Verify Modal ── */}
            {verifyTarget && (
                <VerifyModal item={verifyTarget} token={accessToken!}
                    onClose={() => setVerifyTarget(null)}
                    onDone={() => { setVerifyTarget(null); load(); }} />
            )}

            {/* ── Delete Confirm Modal ── */}
            {showDeleteModal && (
                <DeleteConfirmModal
                    items={deleteItems}
                    onClose={() => setDeleteItems([])}
                    onConfirm={handleConfirmDelete}
                    confirming={deleting} />
            )}
        </div>
    );
};

export default PaymentVerification;
