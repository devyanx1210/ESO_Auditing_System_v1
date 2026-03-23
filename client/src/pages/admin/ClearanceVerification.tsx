import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiRefreshCw, FiCheckSquare, FiClock, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiPrinter } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { adminStudentService } from "../../services/admin-student.service";
import type { PendingClearanceItem, ClearanceHistoryItem } from "../../services/admin-student.service";

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

// ─── Sign Clearance Modal ─────────────────────────────────────────────────────

interface SignClearanceModalProps {
    student: PendingClearanceItem; token: string; onClose: () => void; onDone: () => void;
}
function SignClearanceModal({ student, token, onClose, onDone }: SignClearanceModalProps) {
    const [remarks, setRemarks] = useState("");
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState("");

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
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                <h3 className="font-bold text-gray-800 text-lg mb-1">Approve Clearance</h3>
                <p className="text-sm text-gray-600 font-medium mb-0.5">{student.lastName}, {student.firstName}</p>
                <p className="text-xs text-gray-400 mb-4">{student.studentNo} · {student.programCode} · {student.schoolYear} Sem {student.semester}</p>
                <div className="flex gap-6 mb-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400">Obligations</p>
                        <p className="font-semibold text-gray-800">{student.obligationsPaid} / {student.obligationsTotal} completed</p>
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
                            {saving ? "Approving..." : "Approve"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Sort / filter types ──────────────────────────────────────────────────────

type ClrSortKey = "name" | "year";

const PROGRAMS_LIST = [
    { code: "CpE", name: "Computer Engineering" },
    { code: "CE",  name: "Civil Engineering" },
    { code: "ECE", name: "Electronics Engineering" },
    { code: "EE",  name: "Electrical Engineering" },
    { code: "ME",  name: "Mechanical Engineering" },
];

// ─── Role constants ───────────────────────────────────────────────────────────

const CLEARANCE_ROLES = ["eso_officer", "program_head", "signatory", "dean", "system_admin"];

// ─── Main Page ────────────────────────────────────────────────────────────────

const ClearanceVerification = () => {
    const { accessToken, user } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();

    const [clearance,          setClearance]          = useState<PendingClearanceItem[]>([]);
    const [clrHistory,         setClrHistory]         = useState<ClearanceHistoryItem[]>([]);
    const [loading,            setLoading]            = useState(true);
    const [error,              setError]              = useState("");
    const [clrSubTab,          setClrSubTab]          = useState<"review" | "history">("review");
    const [signTarget,         setSignTarget]         = useState<PendingClearanceItem | null>(null);
    const [signingAll,         setSigningAll]         = useState(false);
    const [signAllMsg,         setSignAllMsg]         = useState("");
    const [selectedClearanceIds, setSelectedClearanceIds] = useState<Set<number>>(new Set());
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<number>>(new Set());
    const [bulkUnapproving, setBulkUnapproving] = useState(false);
    const [bulkDeletingClr, setBulkDeletingClr] = useState(false);
    const [historyBulkMsg, setHistoryBulkMsg] = useState("");
    const [search,        setSearch]        = useState((location.state as any)?.search ?? "");
    const [sortKey,       setSortKey]       = useState<ClrSortKey>("name");
    const [programFilter, setProgramFilter] = useState((location.state as any)?.programFilter ?? "all");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [showFilters,   setShowFilters]   = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const hasClearanceRole = CLEARANCE_ROLES.includes(user?.role ?? "");
    const canSignClearance = user?.role !== "system_admin";

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

    function toggleHistorySelect(id: number) {
        setSelectedHistoryIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function toggleHistorySelectAll(filteredHistory: typeof clrHistory) {
        if (selectedHistoryIds.size === filteredHistory.length) {
            setSelectedHistoryIds(new Set());
        } else {
            setSelectedHistoryIds(new Set(filteredHistory.map(h => h.clearanceId)));
        }
    }

    async function handleUnapproveHistory() {
        if (!accessToken || !selectedHistoryIds.size) return;
        setBulkUnapproving(true); setHistoryBulkMsg("");
        try {
            const ids = [...selectedHistoryIds];
            await adminStudentService.unapproveHistory(accessToken, ids);
            setHistoryBulkMsg(`${ids.length} clearance(s) returned to pending.`);
            setSelectedHistoryIds(new Set());
            load();
        } catch (e: any) { setHistoryBulkMsg(e.message); }
        finally { setBulkUnapproving(false); }
    }

    async function handleDeleteClearanceHistory() {
        if (!accessToken || !selectedHistoryIds.size) return;
        if (!window.confirm(`Delete ${selectedHistoryIds.size} clearance record(s)? This cannot be undone.`)) return;
        setBulkDeletingClr(true); setHistoryBulkMsg("");
        try {
            const ids = [...selectedHistoryIds];
            await adminStudentService.deleteClearanceHistory(accessToken, ids);
            setHistoryBulkMsg(`${ids.length} record(s) deleted.`);
            setSelectedHistoryIds(new Set());
            load();
        } catch (e: any) { setHistoryBulkMsg(e.message); }
        finally { setBulkDeletingClr(false); }
    }

    const load = useCallback(() => {
        if (!accessToken || !hasClearanceRole) return;
        setLoading(true);
        Promise.all([
            adminStudentService.getPendingClearance(accessToken).catch(() => [] as PendingClearanceItem[]),
            adminStudentService.getClearanceHistory(accessToken).catch(() => [] as ClearanceHistoryItem[]),
        ])
            .then(([c, ch]) => { setClearance(c); setClrHistory(ch); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken, hasClearanceRole]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node))
                setShowFilters(false);
        }
        if (showFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters]);

    async function handleSignAll() {
        if (!accessToken) return;
        setSigningAll(true); setSignAllMsg("");
        try {
            const res = await adminStudentService.signAllClearance(accessToken);
            setSignAllMsg(`${res.count} clearance(s) approved.`);
            load();
        } catch (e: any) { setSignAllMsg(e.message); }
        finally { setSigningAll(false); }
    }

    const bg = darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900";

    function applyClrSearch<T extends { firstName: string; lastName: string; studentNo: string }>(items: T[]) {
        return search ? items.filter(i =>
            `${i.firstName} ${i.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
            i.studentNo.includes(search)
        ) : items;
    }
    function applyClrProgram<T extends { programCode: string }>(items: T[]) {
        return programFilter !== "all" ? items.filter(i => i.programCode === programFilter) : items;
    }
    function applyClrStatus<T extends { clearanceStatus: string | null }>(items: T[]) {
        if (statusFilter === "all") return items;
        const map: Record<string, string> = { pending: "pending", in_progress: "in_progress", approved: "cleared", disapproved: "rejected" };
        const target = map[statusFilter] ?? statusFilter;
        return items.filter(i => (i.clearanceStatus ?? "pending") === target);
    }
    function applyClrSort(items: typeof clearance) {
        if (sortKey === "year") return [...items].sort((a, b) => a.yearLevel - b.yearLevel);
        return [...items].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }
    function applyHstSort(items: typeof clrHistory) {
        if (sortKey === "year") return [...items].sort((a, b) => a.yearLevel - b.yearLevel);
        return [...items].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }

    const filteredPendingCount = applyClrStatus(applyClrProgram(applyClrSearch(clearance))).length;
    const filteredHistoryCount = applyClrStatus(applyClrProgram(applyClrSearch(clrHistory))).length;
    const activeResultCount    = clrSubTab === "review" ? filteredPendingCount : filteredHistoryCount;
    const activeFilterCount    = [programFilter !== "all", sortKey !== "name", statusFilter !== "all"].filter(Boolean).length;

    if (!hasClearanceRole) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${bg}`}>
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-500">Access Denied</p>
                    <p className="text-sm text-gray-400 mt-1">You do not have permission to view clearance approvals.</p>
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
                        Clearance Approval
                    </h1>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                        {clearance.length} student{clearance.length !== 1 ? "s" : ""} pending clearance signature
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
                    <input type="text" placeholder="Search by student name or number..."
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
                        <div className={`absolute right-0 top-full mt-2 z-30 border rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-64 flex flex-col gap-3
                            ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sort &amp; Filter</p>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sort by</label>
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as ClrSortKey)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="name">Name (A–Z)</option>
                                    <option value="year">Year Level</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Program</label>
                                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="all">All Programs</option>
                                    {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="approved">Approved</option>
                                    <option value="disapproved">Disapproved</option>
                                </select>
                            </div>

                            {activeFilterCount > 0 && (
                                <button onClick={() => { setSortKey("name"); setProgramFilter("all"); setStatusFilter("all"); }}
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
                active={clrSubTab} onChange={setClrSubTab}
                reviewCount={filteredPendingCount}
                historyCount={filteredHistoryCount}
                reviewLabel="Pending" historyLabel="History" />

            {/* ── Pending Signature ── */}
            {clrSubTab === "review" && (() => {
                const filtered = applyClrSort(applyClrStatus(applyClrProgram(applyClrSearch(clearance))));
                return (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {filtered.length === 0
                                    ? (canSignClearance ? "No students pending approval at your step." : "No students pending approval.")
                                    : `${filtered.length} student${filtered.length !== 1 ? "s" : ""} ${canSignClearance ? "pending your approval" : "ready for clearance"}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {signAllMsg && <p className="text-sm text-green-600">{signAllMsg}</p>}
                            {clearance.length > 0 && canSignClearance && (
                                <button onClick={handleSignAll} disabled={signingAll}
                                    className="px-4 py-2 text-sm bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                                    {signingAll ? "Approving..." : `Approve All (${clearance.length})`}
                                </button>
                            )}
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className={`rounded-2xl border-2 p-10 text-center text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                            <p className={`font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>No pending approvals</p>
                            <p>Students will appear here once all obligations are paid.</p>
                        </div>
                    ) : (
                        <>
                            <div className={`rounded-2xl overflow-hidden border shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] border-collapse">
                                    <thead className={darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="pl-4 pr-2 py-2 w-8">
                                                <input type="checkbox"
                                                    checked={clearance.length > 0 && selectedClearanceIds.size === clearance.length}
                                                    onChange={toggleClearanceSelectAll}
                                                    className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Student No.</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Year / Section</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Semester</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Obligations</th>
                                            {canSignClearance && <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                                        {filtered.map((c, i) => (
                                            <tr key={c.studentId}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors ${darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"} ${selectedClearanceIds.has(c.studentId) ? (darkMode ? "bg-gray-700/60" : "bg-gray-100") : i % 2 === 0 ? (darkMode ? "bg-gray-800" : "bg-white") : (darkMode ? "bg-gray-800/60" : "bg-gray-50/70")}`}>
                                                <td className="pl-4 pr-2 py-2.5 w-8" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedClearanceIds.has(c.studentId)}
                                                        onChange={() => toggleClearanceSelect(c.studentId)}
                                                        className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" />
                                                        <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{c.lastName}, {c.firstName}</div>
                                                    </div>
                                                </td>
                                                <td className={`px-3 py-2.5 text-center text-xs font-mono ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{c.studentNo}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{c.programName}</span>
                                                </td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{c.yearLevel}-{c.section}</td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{c.schoolYear} · Sem {c.semester}</td>
                                                <td className={`px-3 py-2.5 text-center text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{c.obligationsPaid}/{c.obligationsTotal}</td>
                                                {canSignClearance && (
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button onClick={() => setSignTarget(c)}
                                                            className="px-4 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold">
                                                            Approve
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
                ); })()}

            {/* ── Signed History ── */}
            {clrSubTab === "history" && (() => {
                const filtered = applyHstSort(applyClrStatus(applyClrProgram(applyClrSearch(clrHistory))));
                const allHistSelected = filtered.length > 0 && filtered.every(h => selectedHistoryIds.has(h.clearanceId));
                return (
                    filtered.length === 0 ? (
                        <div className={`rounded-2xl border-2 p-10 text-center text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                            No approvals yet.
                        </div>
                    ) : (
                        <>
                            {/* History Action Bar */}
                            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                                    {selectedHistoryIds.size > 0 && ` · ${selectedHistoryIds.size} selected`}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {historyBulkMsg && <p className="text-sm text-green-600">{historyBulkMsg}</p>}
                                    {clrHistory.length > 0 && (
                                        <button disabled title="Print All"
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed ${darkMode ? "bg-gray-700 text-gray-300 border border-gray-600" : "bg-white text-gray-600 border border-gray-200"}`}>
                                            <FiPrinter className="w-4 h-4" /> Print All
                                        </button>
                                    )}
                                    {selectedHistoryIds.size > 0 && (
                                        <>
                                            <button onClick={handleUnapproveHistory} disabled={bulkUnapproving}
                                                className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-60 transition">
                                                {bulkUnapproving ? "Processing..." : `Unapprove (${selectedHistoryIds.size})`}
                                            </button>
                                            <button onClick={handleDeleteClearanceHistory} disabled={bulkDeletingClr}
                                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 transition">
                                                {bulkDeletingClr ? "Deleting..." : `Delete (${selectedHistoryIds.size})`}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={`rounded-2xl overflow-hidden border shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] border-collapse">
                                    <thead className={darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="pl-4 pr-2 py-2 w-8">
                                                <input type="checkbox"
                                                    checked={allHistSelected}
                                                    onChange={() => toggleHistorySelectAll(filtered)}
                                                    className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Year / Section</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Semester</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Approved</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Verified By</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Remarks</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                                        {filtered.map((h, i) => (
                                            <tr key={h.clearanceId + h.signedAt}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors cursor-pointer ${darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"} ${selectedHistoryIds.has(h.clearanceId) ? (darkMode ? "bg-orange-900/30" : "bg-orange-50") : i % 2 === 0 ? (darkMode ? "bg-gray-800" : "bg-white") : (darkMode ? "bg-gray-800/60" : "bg-gray-50/70")}`}
                                                onClick={() => toggleHistorySelect(h.clearanceId)}>
                                                <td className="pl-4 pr-2 py-2.5 w-8" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox"
                                                        checked={selectedHistoryIds.has(h.clearanceId)}
                                                        onChange={() => toggleHistorySelect(h.clearanceId)}
                                                        className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" />
                                                        <div>
                                                            <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{h.lastName}, {h.firstName}</div>
                                                            <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{h.studentNo}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{programLabel(h.programCode)}</span>
                                                </td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{h.yearLevel}-{h.section}</td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{h.schoolYear} · Sem {h.semester}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{fmtDate(h.signedAt)}</div>
                                                    <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{fmtTime(h.signedAt)}</div>
                                                </td>
                                                <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>—</td>
                                                <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h.remarks ?? "—"}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.clearanceStatus === "cleared" ? "bg-green-100 text-green-700" : h.clearanceStatus === "rejected" ? "bg-red-100 text-red-700" : h.clearanceStatus === "in_progress" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                                                        {h.clearanceStatus === "cleared" ? "Approved" : h.clearanceStatus === "rejected" ? "Disapproved" : h.clearanceStatus === "in_progress" ? "In Progress" : "Pending"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </>
                    )
                );
            })()}

            {/* ── Sign Modal ── */}
            {signTarget && (
                <SignClearanceModal student={signTarget} token={accessToken!}
                    onClose={() => setSignTarget(null)}
                    onDone={() => { setSignTarget(null); load(); }} />
            )}
        </div>
    );
};

export default ClearanceVerification;
