import { useEffect, useState } from "react";
import { MdSearch, MdChevronLeft, MdChevronRight, MdDeleteOutline } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import { sysadminService } from "../../services/sysadmin.service";

interface AuditLog {
    audit_id: number;
    action: string;
    target_type: string | null;
    target_id: number | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
    performed_by_name: string;
    performed_by_role: string;
}

const fmtDate = (d: string) =>
    new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

const actionColor = (action: string) => {
    if (action.includes("login"))   return "text-blue-600";
    if (action.includes("delete"))  return "text-red-600";
    if (action.includes("create") || action.includes("register")) return "text-green-600";
    if (action.includes("update") || action.includes("approve"))  return "text-orange-500";
    return "text-gray-500";
};

export default function AuditLogsPage() {
    const { accessToken } = useAuth();
    const [logs,    setLogs]    = useState<AuditLog[]>([]);
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(1);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState("");
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [toast,   setToast]   = useState("");
    const LIMIT = 50;

    const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3000); };

    const load = async (p: number) => {
        if (!accessToken) return;
        setLoading(true);
        setSelected(new Set());
        try {
            const data = await sysadminService.getAuditLogs(accessToken, p, LIMIT);
            setLogs(data.logs);
            setTotal(data.total);
            setPage(p);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(1); }, [accessToken]);

    const filtered = logs.filter(l => {
        const q = search.toLowerCase();
        return (
            l.performed_by_name.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q) ||
            (l.target_type ?? "").toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(total / LIMIT);

    const allSelected = filtered.length > 0 && filtered.every(l => selected.has(l.audit_id));
    const someSelected = selected.size > 0;

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map(l => l.audit_id)));
        }
    };

    const toggleOne = (id: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleBulkDelete = () => {
        showToast(`${selected.size} log(s) marked for deletion (feature coming soon).`);
        setSelected(new Set());
    };

    return (
        <div className="p-3 sm:p-5 lg:p-8 min-h-screen bg-gray-50">
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-5 sm:mb-6"
                style={{ animation: "fadeInUp 0.35s ease both" }}>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">Audit Logs</h1>
                <p className="text-gray-400 text-xs sm:text-sm">{total} total entries</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm mb-4" style={{ animation: "fadeInUp 0.38s ease both 0.05s" }}>
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search action, user, type…"
                    className="w-full rounded-xl bg-white border border-gray-200 pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {/* Bulk Action Bar */}
            {someSelected && (
                <div className="flex flex-wrap items-center gap-3 mb-3 py-2"
                    style={{ animation: "slideDown 0.22s cubic-bezier(.34,1.3,.64,1) both" }}>
                    <span className="text-sm font-semibold text-gray-600">{selected.size} selected</span>
                    <div className="flex gap-2 ml-auto">
                        <button onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-xs font-semibold transition">
                            <MdDeleteOutline size={14} /> Delete
                        </button>
                        <button onClick={() => setSelected(new Set())}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 transition">
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden"
                style={{ animation: "fadeInUp 0.42s ease both 0.08s" }}>
                <div className="overflow-x-auto">
                    <table className="eso-table w-full min-w-[720px] text-xs">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500">
                                <th className="px-3 py-2 w-10">
                                    <input type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                </th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Date & Time</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Performed By</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Action</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Target</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No logs found.</td></tr>
                            ) : filtered.map((l, i) => (
                                <tr key={l.audit_id}
                                    style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.03}s` }}
                                    className={`transition-colors ${selected.has(l.audit_id) ? "bg-orange-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                                    <td className="px-3 py-2.5">
                                        <input type="checkbox"
                                            checked={selected.has(l.audit_id)}
                                            onChange={() => toggleOne(l.audit_id)}
                                            className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                                        {fmtDate(l.created_at)}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <p className="text-gray-800 text-xs font-medium whitespace-nowrap">{l.performed_by_name}</p>
                                        <p className="text-gray-400 text-[11px]">{l.performed_by_role}</p>
                                    </td>
                                    <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${actionColor(l.action)}`}>
                                        {l.action}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 text-xs">
                                        {l.target_type ? `${l.target_type}${l.target_id ? ` #${l.target_id}` : ""}` : ""}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-400 text-xs">
                                        {l.ip_address ?? ""}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-gray-400 text-xs">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => load(page - 1)}
                            className="p-2 rounded-lg bg-white shadow-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 transition">
                            <MdChevronLeft size={18} />
                        </button>
                        <button disabled={page === totalPages} onClick={() => load(page + 1)}
                            className="p-2 rounded-lg bg-white shadow-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 transition">
                            <MdChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50"
                    style={{ animation: "slideDown 0.25s ease both" }}>
                    {toast}
                </div>
            )}
        </div>
    );
}
