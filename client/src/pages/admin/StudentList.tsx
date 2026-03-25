import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiRefreshCw, FiSearch, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminStudentService } from "../../services/admin-student.service";
import type { AdminStudentItem } from "../../services/admin-student.service";

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

function clearanceBadge(s: string | null) {
    const map: Record<string, string> = {
        cleared:     "bg-green-100 text-green-700",
        in_progress: "bg-orange-100 text-orange-700",
        rejected:    "bg-red-100 text-red-700",
        pending:     "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
        cleared: "Approved", in_progress: "In Progress",
        rejected: "Disapproved", pending: "Pending",
    };
    const label = s ?? "pending";
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[label] ?? "bg-gray-100 text-gray-600"}`}>
            {labels[label] ?? label.replace("_", " ")}
        </span>
    );
}

function yearLabel(y: number) {
    const ord = ["", "1st", "2nd", "3rd", "4th"];
    return `${ord[y] ?? y + "th"} Year`;
}

function obligationsCell(paid: number, total: number) {
    if (total === 0) return <span className="text-xs text-gray-400">—</span>;
    return <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:underline">{paid}/{total} Completed</span>;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

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

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

interface StudentRowProps {
    student: AdminStudentItem;
    index: number;
}
function StudentRow({ student, index }: StudentRowProps) {
    const navigate = useNavigate();
    const rowBg = index % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-gray-50/70 dark:bg-[#222]";
    const animStyle = { animation: 'fadeInUp 0.3s ease both', animationDelay: `${index * 0.05}s` };

    function goToObligations() {
        navigate("/dashboard/students/obligations-list", { state: { search: student.studentNo } });
    }
    function goToClearance() {
        navigate("/dashboard/students/clearances", { state: { search: student.studentNo } });
    }

    return (
        <>
            <tr className={`${rowBg}`} style={animStyle}>
                <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                        <UserAvatar src={student.avatarPath} />
                        <div className="font-semibold text-gray-800 dark:text-gray-100 text-xs leading-tight">
                            {student.firstName} {student.lastName}
                        </div>
                    </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{student.studentNo}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{student.programName}</span>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600 dark:text-gray-300">
                    {yearLabel(student.yearLevel)} · Section {student.section}
                </td>
                <td className="px-3 py-2.5 text-center">
                    <button onClick={goToObligations} className="cursor-pointer hover:opacity-80">
                        {obligationsCell(student.obligationsPaid, student.obligationsTotal)}
                    </button>
                </td>
                <td className="px-3 py-2.5 text-center">
                    <button onClick={goToClearance} className="cursor-pointer hover:opacity-80">
                        {clearanceBadge(student.clearanceStatus)}
                    </button>
                </td>
            </tr>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortKey = "name" | "section" | "year" | "dept" | "pending" | "paid";

const SECTIONS = ["A","B","C","D","E","F","G","H"];

const StudentList = () => {
    const { accessToken, user } = useAuth();
    const location = useLocation();
    const [students, setStudents] = useState<AdminStudentItem[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");

    const [search,        setSearch]        = useState("");
    const [deptFilter,    setDeptFilter]    = useState((location.state as any)?.programFilter ?? "all");
    const [yearFilter,    setYearFilter]    = useState("all");
    const [sectionFilter, setSectionFilter] = useState("all");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [sortKey,       setSortKey]       = useState<SortKey>("name");

    const [showFilters,  setShowFilters]  = useState(false);
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
        statusFilter !== "all",
        sortKey !== "name",
    ].filter(Boolean).length;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen dark:bg-[#111111]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-[#111111] min-h-screen">
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {/* ── Page Header ── */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg sm:text-xl">
                        Students
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {isRestricted && students[0]
                            ? `${students[0].programName} · ${students.length} student${students.length !== 1 ? "s" : ""}`
                            : `${students.length} student${students.length !== 1 ? "s" : ""} across all programs`}
                    </p>
                </div>
                <button onClick={load} disabled={loading} title="Refresh"
                    className="p-2 bg-white border-2 border-gray-200 rounded-xl text-gray-600 hover:border-orange-400 hover:text-orange-600 transition shadow-sm disabled:opacity-50">
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

            {/* ── Search + Filter Bar ── */}
            <div className="flex items-center gap-2 mb-5">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search by name or student no..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500 shadow-sm" />
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
                        <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-72 flex flex-col gap-3">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sort &amp; Filter</p>

                            {/* Sort */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sort by</label>
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="name">Name (A–Z)</option>
                                    <option value="section">Section</option>
                                    <option value="year">Year Level</option>
                                    {!isRestricted && <option value="dept">Program</option>}
                                    <option value="pending">Most Pending</option>
                                    <option value="paid">Most Cleared</option>
                                </select>
                            </div>

                            {/* Program */}
                            {!isRestricted && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Program</label>
                                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                                        className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                        <option value="all">All Programs</option>
                                        {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Year Level */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Year Level</label>
                                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="all">All Year Levels</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>

                            {/* Section */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Section</label>
                                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="all">All Sections</option>
                                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="all">All Status</option>
                                    <option value="all_paid">All Cleared</option>
                                    <option value="has_pending">Has Pending Verification</option>
                                    <option value="has_unpaid">Has Unpaid Obligation</option>
                                </select>
                            </div>

                            {/* Clear filters */}
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => {
                                        setDeptFilter("all"); setYearFilter("all");
                                        setSectionFilter("all"); setStatusFilter("all");
                                        setSortKey("name");
                                    }}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results count */}
                <span className="hidden sm:flex items-center text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-[#2a2a2a] px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Student Table ── */}
            {filtered.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-10 text-center text-gray-400 text-sm">
                    No students found.
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] border-collapse">
                        <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student Name</th>
                                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Student No.</th>
                                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Year / Section</th>
                                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Obligations</th>
                                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Clearance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <StudentRow key={s.studentId} student={s} index={i} />
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StudentList;
