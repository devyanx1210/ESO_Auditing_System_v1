import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { FiRefreshCw, FiSearch, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminStudentService } from "../../services/admin-student.service";
import type { AdminStudentItem } from "../../services/admin-student.service";

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ src }: { src?: string | null }) {
    const imgSrc = src ? (src.startsWith("http") ? src : src.startsWith("/uploads") ? src : `/uploads/${src}`) : null;
    return (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 relative">
            <DefaultAvatarSvg />
            {imgSrc && (
                <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
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

// ─── Cell helpers ─────────────────────────────────────────────────────────────

function Cell({ value }: { value: string | null | undefined }) {
    if (!value) return <span className="text-gray-300 dark:text-gray-600">—</span>;
    return <span>{value}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortKey = "name" | "section" | "year" | "dept";
type StatusFilter = "all" | "active" | "inactive" | "suspended";

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
    const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("all");
    const [sortKey,       setSortKey]       = useState<SortKey>("name");

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
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

    // Derive program and section options from actual data
    const PROGRAMS_LIST = useMemo(() => {
        const seen = new Map<string, string>();
        students.forEach(s => { if (s.programCode && s.programName) seen.set(s.programCode, s.programName); });
        return [...seen.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [students]);

    const SECTIONS = useMemo(() => {
        const seen = new Set<string>();
        students.forEach(s => { if (s.section) seen.add(s.section.toUpperCase()); });
        return [...seen].sort();
    }, [students]);

    const YEAR_LEVELS = useMemo(() => {
        const seen = new Set<number>();
        students.forEach(s => { if (s.yearLevel) seen.add(s.yearLevel); });
        return [...seen].sort((a, b) => a - b);
    }, [students]);

    let filtered = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        s.studentNo.toLowerCase().includes(search.toLowerCase())
    );
    if (!isRestricted && deptFilter !== "all") filtered = filtered.filter(s => s.programCode === deptFilter);
    if (yearFilter    !== "all") filtered = filtered.filter(s => String(s.yearLevel) === yearFilter);
    if (sectionFilter !== "all") filtered = filtered.filter(s => (s.section ?? "").toUpperCase() === sectionFilter);
    if (statusFilter  !== "all") filtered = filtered.filter(s => s.userStatus === statusFilter);

    if (sortKey === "name")    filtered = [...filtered].sort((a, b) => a.lastName.localeCompare(b.lastName));
    if (sortKey === "section") filtered = [...filtered].sort((a, b) => (a.section ?? "").localeCompare(b.section ?? ""));
    if (sortKey === "year")    filtered = [...filtered].sort((a, b) => a.yearLevel - b.yearLevel);
    if (sortKey === "dept")    filtered = [...filtered].sort((a, b) => a.programCode.localeCompare(b.programCode));

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
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">Students</h1>
                </div>
                <button onClick={load} disabled={loading} title="Refresh"
                    className="p-2 bg-white dark:bg-[#1a1a1a] rounded-xl text-gray-600 dark:text-gray-400 hover:text-orange-600 transition shadow-sm disabled:opacity-50">
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

            {/* ── Search + Filter Bar ── */}
            <div className="flex items-center gap-2 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search by name or student no..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500 shadow-sm border-2 border-gray-200 dark:border-gray-600" />
                </div>

                <div className="relative" ref={filterRef}>
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm ${
                            showFilters || activeFilterCount > 0 ? "bg-orange-600 text-white" : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}>
                        <FiFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Sort &amp; Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {showFilters && (
                        <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-4 w-72 flex flex-col gap-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sort &amp; Filter</p>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Sort by</label>
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="name">Name (A–Z)</option>
                                    <option value="section">Section</option>
                                    <option value="year">Year Level</option>
                                    {!isRestricted && <option value="dept">Program</option>}
                                </select>
                            </div>
                            {!isRestricted && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Program</label>
                                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                                        className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                        <option value="all">All Programs</option>
                                        {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Year Level</label>
                                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="all">All Year Levels</option>
                                    {YEAR_LEVELS.map(y => (
                                        <option key={y} value={String(y)}>
                                            {y === 1 ? "1st" : y === 2 ? "2nd" : y === 3 ? "3rd" : `${y}th`} Year
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
                                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="all">All Sections</option>
                                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                            {activeFilterCount > 0 && (
                                <button onClick={() => { setDeptFilter("all"); setYearFilter("all"); setSectionFilter("all"); setStatusFilter("all"); setSortKey("name"); }}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 rounded-xl hover:bg-red-50 transition">
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* ── Student Table ── */}
            {filtered.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-10 text-center text-gray-400 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                    No students found.
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                        <table className="eso-table w-full border-collapse" style={{ minWidth: "1100px" }}>
                            <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-3 py-2 text-left   text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Full Name</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Student Number</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Program</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Year / Section</th>
                                    <th className="px-3 py-2 text-left   text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Address</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Contact Number</th>
                                    <th className="px-3 py-2 text-left   text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Email Address</th>
                                    <th className="px-3 py-2 text-left   text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Guardian</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Emergency Contact Number</th>
                                    <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Shirt Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s, i) => {
                                    const rowBg = i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-gray-50/70 dark:bg-[#222]";
                                    const animStyle = { animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.03}s` };
                                    return (
                                        <tr key={s.studentId} className={rowBg} style={animStyle}>
                                            {/* Name */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <UserAvatar src={s.avatarPath} />
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                                            {s.lastName}, {s.firstName}
                                                        </span>
                                                        {s.userStatus !== "active" && (
                                                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                s.userStatus === "suspended"
                                                                    ? "bg-red-100 text-red-600"
                                                                    : "bg-gray-100 text-gray-500"
                                                            }`}>
                                                                {s.userStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Student Number */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{s.studentNo}</span>
                                            </td>
                                            {/* Program */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{s.programName}</span>
                                            </td>
                                            {/* Year / Section */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{s.yearLevel}{s.section}</span>
                                            </td>
                                            {/* Address */}
                                            <td className="px-3 py-2.5 max-w-[160px]">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate block"><Cell value={s.address} /></span>
                                            </td>
                                            {/* Contact */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap"><Cell value={s.contactNumber} /></span>
                                            </td>
                                            {/* Email */}
                                            <td className="px-3 py-2.5 max-w-[160px]">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate block"><Cell value={s.email} /></span>
                                            </td>
                                            {/* Guardian */}
                                            <td className="px-3 py-2.5">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap"><Cell value={s.guardianName} /></span>
                                            </td>
                                            {/* Emergency Contact */}
                                            <td className="px-3 py-2.5 text-center">
                                                <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap"><Cell value={s.emergencyContact} /></span>
                                            </td>
                                            {/* Shirt Size */}
                                            <td className="px-3 py-2.5 text-center">
                                                {s.shirtSize
                                                    ? <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-semibold">{s.shirtSize}</span>
                                                    : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                </div>
            )}
        </div>
    );
};

export default StudentList;
