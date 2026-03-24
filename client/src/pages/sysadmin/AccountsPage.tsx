import { useEffect, useState, useRef } from "react";
import {
    FiTrash2, FiPlus, FiCheck, FiUsers, FiArchive, FiFilter,
    FiChevronDown, FiChevronUp, FiSearch,
} from "react-icons/fi";
import { MdClose, MdBlock, MdDeleteOutline } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import { sysadminService } from "../../services/sysadmin.service";
import { authService } from "../../services/auth.service";

interface Account {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role_name: string;
    role_label: string;
    program_name: string | null;
    position: string | null;
    status: string;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}
function UserAvatar() {
    return <div className="w-8 h-8 rounded-full overflow-hidden shrink-0"><DefaultAvatarSvg /></div>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES = [
    { value: "eso_officer",   label: "ESO Officer" },
    { value: "class_officer", label: "Class Officer" },
    { value: "program_head",  label: "Program Head" },
    { value: "signatory",     label: "Signatory" },
    { value: "dean",          label: "Dean" },
];

const DEPARTMENTS = [
    { id: 1, name: "Computer Engineering" },
    { id: 2, name: "Civil Engineering" },
    { id: 3, name: "Electronics Engineering" },
    { id: 4, name: "Electrical Engineering" },
    { id: 5, name: "Mechanical Engineering" },
];

const COLLEGES = [{ id: 6, name: "Engineering" }];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

type SortKey = "name" | "program" | "role";

const BLANK = {
    firstName: "", lastName: "", email: "", password: "",
    role: "eso_officer", programId: "", position: "",
    yearLevel: "", section: "",
};

const thCls    = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide";
const thCtrCls = "px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide";

// ─── Suspend Modal ────────────────────────────────────────────────────────────

function SuspendModal({ targets, onConfirm, onClose }: { targets: Account[]; onConfirm: () => void; onClose: () => void }) {
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const submit = () => { if (!password) { setErr("Enter your password to confirm."); return; } onConfirm(); };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" style={{ animation: "fadeInScrim 0.2s ease both" }}>
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-sm p-6 relative" style={{ animation: "modalPop 0.25s cubic-bezier(.34,1.4,.64,1) both" }}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
                <div className="flex items-center gap-2 mb-3">
                    <MdBlock className="text-red-500" size={20} />
                    <h3 className="text-gray-800 font-bold text-base">Confirm Suspension</h3>
                </div>
                <p className="text-gray-500 text-sm mb-3">
                    {targets.length === 1
                        ? <>Suspend <strong className="text-gray-800">{targets[0].first_name} {targets[0].last_name}</strong>?</>
                        : <>Suspend <strong className="text-gray-800">{targets.length} accounts</strong>?</>}
                </p>
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your password</label>
                    <input type="password" value={password} onChange={e => { setPassword(e.target.value); setErr(""); }}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border-2 border-gray-300 focus:border-red-400 focus:outline-none px-3.5 py-2.5 text-sm"
                        onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
                    {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white">Suspend</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
    const { accessToken } = useAuth();
    const [accounts,       setAccounts]       = useState<Account[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [tab,            setTab]            = useState<"active" | "archived">("active");
    const [search,         setSearch]         = useState("");
    const [roleFilter,     setRoleFilter]     = useState("all");
    const [sortKey,        setSortKey]        = useState<SortKey>("name");
    const [showFilters,    setShowFilters]    = useState(false);
    const [showCreate,     setShowCreate]     = useState(false);
    const [successMsg,     setSuccessMsg]     = useState("");
    const [saving,         setSaving]         = useState(false);
    const [formError,      setFormError]      = useState("");
    const [form,           setForm]           = useState(BLANK);
    const [toast,          setToast]          = useState("");
    const [selected,       setSelected]       = useState<Set<number>>(new Set());
    const [suspendTargets, setSuspendTargets] = useState<Account[]>([]);
    const [archiveTarget,  setArchiveTarget]  = useState<Account | null>(null);
    const [deleteTarget,   setDeleteTarget]   = useState<Account | null>(null);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteErr,      setDeleteErr]      = useState("");
    const [deleting,       setDeleting]       = useState(false);

    const filterRef = useRef<HTMLDivElement>(null);
    const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3000); };

    const load = async () => {
        if (!accessToken) return;
        setLoading(true); setSelected(new Set());
        try { setAccounts(await sysadminService.getAccounts(accessToken)); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [accessToken]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
        }
        if (showFilters) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showFilters]);

    // ─── Derived ─────────────────────────────────────────────────────────────

    const activeAccounts   = accounts.filter(a => a.status === "active");
    const archivedAccounts = accounts.filter(a => a.status !== "active");

    function filterAndSort(list: Account[]) {
        let r = [...list];
        if (search.trim()) {
            const q = search.toLowerCase();
            r = r.filter(a => `${a.first_name} ${a.last_name} ${a.email} ${a.program_name ?? ""}`.toLowerCase().includes(q));
        }
        if (roleFilter !== "all") r = r.filter(a => a.role_name === roleFilter);
        if (sortKey === "name")    r.sort((a, b) => a.last_name.localeCompare(b.last_name));
        if (sortKey === "program") r.sort((a, b) => (a.program_name ?? "").localeCompare(b.program_name ?? ""));
        if (sortKey === "role")    r.sort((a, b) => (a.role_label ?? "").localeCompare(b.role_label ?? ""));
        return r;
    }

    const filteredActive   = filterAndSort(activeAccounts);
    const filteredArchived = filterAndSort(archivedAccounts);
    const displayed        = tab === "active" ? filteredActive : filteredArchived;
    const activeFilterCount = [search.trim() !== "", roleFilter !== "all", sortKey !== "name"].filter(Boolean).length;

    // ─── Selection ────────────────────────────────────────────────────────────

    const selectableIds = displayed.filter(a => a.role_name !== "system_admin").map(a => a.user_id);
    const allSelected   = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));
    const someSelected  = selected.size > 0;
    const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(selectableIds));
    const toggleOne = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const selectedAccounts = displayed.filter(a => selected.has(a.user_id));

    // ─── Actions ──────────────────────────────────────────────────────────────

    const isDean         = form.role === "dean";
    const isClassOfficer = form.role === "class_officer";
    const programOptions = isDean ? COLLEGES : DEPARTMENTS;
    const inputCls = "border-2 border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white";

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;
        setFormError("");
        if (!form.firstName.trim() || !form.lastName.trim()) { setFormError("First and last name are required."); return; }
        if (!form.email.trim())       { setFormError("Email is required."); return; }
        if (form.password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
        let position = form.position.trim();
        if (isClassOfficer) {
            if (!form.yearLevel) { setFormError("Year level is required for Class Officer."); return; }
            if (!form.section.trim()) { setFormError("Section is required for Class Officer."); return; }
            position = `${form.yearLevel} - Section ${form.section.trim()}`;
        } else {
            if (!position) { setFormError("Position is required."); return; }
        }
        setSaving(true);
        try {
            await sysadminService.createAccount(accessToken, {
                firstName: form.firstName, lastName: form.lastName,
                email: form.email, password: form.password, role: form.role,
                programId: form.programId ? Number(form.programId) : null,
                position,
            });
            setSuccessMsg(`Account for ${form.firstName} ${form.lastName} created successfully.`);
            setShowCreate(false); setForm(BLANK); load();
        } catch (err: any) {
            setFormError(err.message ?? "Failed to create account.");
        } finally { setSaving(false); }
    };

    const handleStatus = async (userId: number, status: "active" | "inactive" | "suspended") => {
        if (!accessToken) return;
        try { await sysadminService.updateAccountStatus(accessToken, userId, status); load(); }
        catch (e: any) { showToast(e.message); }
    };

    const handleArchive = async () => {
        if (!archiveTarget || !accessToken) return;
        try { await sysadminService.updateAccountStatus(accessToken, archiveTarget.user_id, "inactive"); setArchiveTarget(null); load(); }
        catch (e: any) { showToast(e.message); }
    };

    const handlePermanentDelete = async () => {
        if (!deleteTarget || !accessToken) return;
        setDeleting(true); setDeleteErr("");
        try {
            await authService.verifyPassword(accessToken, deletePassword);
            await sysadminService.deleteAccount(accessToken, deleteTarget.user_id);
            setDeleteTarget(null); setDeletePassword(""); load();
        } catch (e: any) { setDeleteErr(e.message ?? "Failed to delete."); }
        finally { setDeleting(false); }
    };

    const handleSuspendConfirm = async () => {
        if (!accessToken) return;
        try {
            await Promise.all(suspendTargets.map(a => sysadminService.updateAccountStatus(accessToken, a.user_id, "suspended")));
            showToast(`${suspendTargets.length > 1 ? `${suspendTargets.length} accounts` : "Account"} suspended.`);
            setSuspendTargets([]); setSelected(new Set()); load();
        } catch (e: any) { showToast(e.message); }
    };

    const handleBulkArchive = async () => {
        if (!accessToken || !someSelected) return;
        try {
            await Promise.all([...selected].map(id => sysadminService.updateAccountStatus(accessToken, id, "inactive")));
            showToast(`${selected.size} account(s) archived.`); setSelected(new Set()); load();
        } catch (e: any) { showToast(e.message); }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gray-50">
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInScrim {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.94) translateY(12px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            <div className="mb-6" style={{ animation: "fadeInUp 0.35s ease both" }}>
                <h1 className="font-bold text-gray-800 text-2xl sm:text-3xl">Accounts</h1>
            </div>

            {successMsg && (
                <div className="flex items-center gap-2 text-green-700 text-sm mb-4 bg-green-50 rounded-xl px-4 py-2.5"
                    style={{ animation: "slideDown 0.25s ease both" }}>
                    <FiCheck className="w-4 h-4 shrink-0" />{successMsg}
                </div>
            )}

            {/* ── Tabs + Create button ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4"
                style={{ animation: "fadeInUp 0.4s ease both 0.06s" }}>
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                        <button onClick={() => setTab("active")}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap
                                ${tab === "active" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            <FiUsers className="w-4 h-4" /> Accounts
                            {activeAccounts.length > 0 && (
                                <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeAccounts.length}</span>
                            )}
                        </button>
                        <button onClick={() => setTab("archived")}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap
                                ${tab === "archived" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            <FiArchive className="w-4 h-4" /> Archived
                            {archivedAccounts.length > 0 && (
                                <span className="bg-gray-400 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{archivedAccounts.length}</span>
                            )}
                        </button>
                    </div>
                    {tab === "active" && (
                        <button onClick={() => { setShowCreate(true); setFormError(""); setForm(BLANK); }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition shadow-sm">
                            <FiPlus className="w-4 h-4" /> Create Account
                        </button>
                    )}
            </div>

            {/* ── Search + Filter ── */}
            <div className="flex items-center gap-2 mb-4"
                style={{ animation: "fadeInUp 0.4s ease both 0.09s" }}>
                    <div className="relative flex-1 max-w-sm">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Search by name, email, or program..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full bg-white shadow-sm" />
                    </div>
                    <div className="relative" ref={filterRef}>
                        <button onClick={() => setShowFilters(f => !f)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition shadow-sm">
                            <FiFilter className="w-4 h-4" />
                            <span className="hidden sm:inline">Sort &amp; Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                            )}
                            {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                        </button>
                        {showFilters && (
                            <div className="absolute right-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-2xl p-4 w-64 flex flex-col gap-3"
                                style={{ animation: "slideDown 0.2s ease both" }}>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sort &amp; Filter</p>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sort by</label>
                                    <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                                        className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                        <option value="name">Name (A–Z)</option>
                                        <option value="program">Program</option>
                                        <option value="role">Role</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                        className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                        <option value="all">All Roles</option>
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        <option value="system_admin">System Admin</option>
                                    </select>
                                </div>
                                {activeFilterCount > 0 && (
                                    <button onClick={() => { setSearch(""); setRoleFilter("all"); setSortKey("name"); }}
                                        className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition">
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <span className="hidden sm:flex items-center text-xs font-medium text-gray-400 bg-white px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                        {displayed.length} result{displayed.length !== 1 ? "s" : ""}
                    </span>
            </div>

            {/* ── Bulk Action Bar ── */}
            {someSelected && (
                <div className="flex flex-wrap items-center gap-3 mb-3 py-2"
                    style={{ animation: "slideDown 0.22s cubic-bezier(.34,1.3,.64,1) both" }}>
                        <span className="text-sm font-semibold text-gray-600">{selected.size} selected</span>
                        {tab === "active" && (
                            <button onClick={() => setSuspendTargets(selectedAccounts)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition">
                                <MdBlock size={13} /> Suspend
                            </button>
                        )}
                        <button onClick={handleBulkArchive}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold transition">
                            <MdDeleteOutline size={13} /> Archive
                        </button>
                        <button onClick={() => setSelected(new Set())}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 transition">
                            Clear
                        </button>
                </div>
            )}

            {/* ── Active Table ── */}
            {tab === "active" && (loading ? (
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] flex items-center gap-2 text-gray-400 text-sm py-10 justify-center"
                    style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent" />
                    Loading accounts...
                </div>
            ) : activeAccounts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] text-center py-12 text-gray-400"
                    style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                    <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-500">No active accounts</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden"
                    style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500">
                                    <th className="px-4 py-3 w-10">
                                        <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                            className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                    </th>
                                    <th className={thCls}>Name</th>
                                    <th className={thCls}>Email</th>
                                    <th className={thCls}>Role</th>
                                    <th className={thCls}>Program / Dept</th>
                                    <th className={thCls}>Position</th>
                                    <th className={thCtrCls}>Status</th>
                                    <th className={thCtrCls}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActive.map((a, i) => (
                                    <tr key={a.user_id}
                                        style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.04}s` }}
                                        className={`transition-colors hover:bg-orange-50 ${selected.has(a.user_id) ? "bg-orange-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}`}>
                                        <td className="px-4 py-3">
                                            {a.role_name !== "system_admin" && (
                                                <input type="checkbox" checked={selected.has(a.user_id)} onChange={() => toggleOne(a.user_id)}
                                                    className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <UserAvatar />
                                                <span className="font-medium text-gray-800 whitespace-nowrap">{a.last_name}, {a.first_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{a.email}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold whitespace-nowrap">{a.role_label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-sm">{a.program_name ?? <span className="text-gray-300">—</span>}</td>
                                        <td className="px-4 py-3 text-gray-600 text-sm">{a.position ?? <span className="text-gray-300">—</span>}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />Active
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {a.role_name !== "system_admin" && (
                                                    <>
                                                        <button onClick={() => setSuspendTargets([a])}
                                                            className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition">
                                                            Suspend
                                                        </button>
                                                        <button onClick={() => setArchiveTarget(a)}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* ── Archived Table ── */}
            {tab === "archived" && (
                archivedAccounts.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] text-center py-10 text-gray-400"
                        style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                        <FiArchive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No archived accounts yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden"
                        style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[780px] text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500">
                                        <th className="px-4 py-3 w-10">
                                            <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                                className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                        </th>
                                        <th className={thCls}>Name</th>
                                        <th className={thCls}>Email</th>
                                        <th className={thCls}>Role</th>
                                        <th className={thCls}>Program / Dept</th>
                                        <th className={thCls}>Position</th>
                                        <th className={thCtrCls}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredArchived.map((a, i) => (
                                        <tr key={a.user_id}
                                            style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.04}s` }}
                                            className={`transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}`}>
                                            <td className="px-4 py-3">
                                                <input type="checkbox" checked={selected.has(a.user_id)} onChange={() => toggleOne(a.user_id)}
                                                    className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <UserAvatar />
                                                    <span className="font-medium text-gray-500 whitespace-nowrap">{a.last_name}, {a.first_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">{a.email}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-semibold whitespace-nowrap">{a.role_label}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">{a.program_name ?? <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">{a.position ?? <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleStatus(a.user_id, "active")}
                                                        className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                                                        Activate
                                                    </button>
                                                    <button onClick={() => { setDeleteTarget(a); setDeletePassword(""); setDeleteErr(""); }}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* ── Create Account Modal ─────────────────────────────────────────── */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    style={{ animation: "fadeInScrim 0.2s ease both" }}>
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                        style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}>
                        <div className="flex items-center justify-between mb-5 pb-3">
                            <h2 className="font-semibold text-gray-800 text-lg">Create Account</h2>
                            <button onClick={() => { setShowCreate(false); setFormError(""); setForm(BLANK); }}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                        </div>
                        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input className={inputCls} value={form.firstName}
                                        onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input className={inputCls} value={form.lastName}
                                        onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dela Cruz" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input type="email" className={inputCls} value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@eso.edu.ph" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input type="password" className={inputCls} value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                    <select className={inputCls} value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value, programId: "", yearLevel: "", section: "" })}>
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isDean ? "College" : "Program"}
                                    </label>
                                    <select className={inputCls} value={form.programId}
                                        onChange={e => setForm({ ...form, programId: e.target.value })}>
                                        <option value="">None</option>
                                        {programOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>

                                {isClassOfficer && (
                                    <div style={{ animation: "fadeInUp 0.2s ease both" }}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                                        <select className={inputCls} value={form.yearLevel}
                                            onChange={e => setForm({ ...form, yearLevel: e.target.value })}>
                                            <option value="" disabled hidden>Select year level</option>
                                            {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                )}

                                {isClassOfficer && (
                                    <div style={{ animation: "fadeInUp 0.2s ease both 0.05s" }}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                                        <input className={inputCls} value={form.section}
                                            onChange={e => setForm({ ...form, section: e.target.value })}
                                            placeholder="e.g. A, B, Section 1" />
                                    </div>
                                )}

                                {!isClassOfficer && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                                        <input className={inputCls} value={form.position}
                                            onChange={e => setForm({ ...form, position: e.target.value })}
                                            placeholder="e.g. ESO President" />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between pt-2">
                                <button type="button" onClick={() => { setForm(BLANK); setFormError(""); }}
                                    className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm">
                                    Reset
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-sm">
                                    {saving ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Archive Confirmation ─────────────────────────────────────────── */}
            {archiveTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    style={{ animation: "fadeInScrim 0.2s ease both" }}>
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6"
                        style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Archive Account</h3>
                        <p className="text-sm text-gray-600 mb-1">This will deactivate and archive the account for:</p>
                        <p className="font-semibold text-gray-800 mb-0.5">{archiveTarget.first_name} {archiveTarget.last_name}</p>
                        <p className="text-xs text-gray-500 mb-0.5">{archiveTarget.email}</p>
                        <p className="text-xs text-gray-500 mb-3">{archiveTarget.role_label}</p>
                        <p className="text-xs text-yellow-600 mb-4">The account will be moved to Archived. You can re-activate or permanently delete it from there.</p>
                        <div className="flex justify-between gap-3">
                            <button onClick={() => setArchiveTarget(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300">Cancel</button>
                            <button onClick={handleArchive}
                                className="px-5 py-2.5 rounded-xl bg-yellow-500 text-white font-semibold text-sm hover:bg-yellow-600">Archive</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Permanent Delete ─────────────────────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    style={{ animation: "fadeInScrim 0.2s ease both" }}>
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6"
                        style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <FiTrash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Permanently Delete Account</h3>
                                <p className="text-xs text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                            <p className="font-semibold text-gray-800 text-sm">{deleteTarget.first_name} {deleteTarget.last_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{deleteTarget.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{deleteTarget.role_label}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Enter your password to confirm deletion:</p>
                        <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full rounded-xl border-2 border-gray-300 focus:border-red-400 focus:outline-none px-3.5 py-2.5 text-sm mb-2"
                            onKeyDown={e => e.key === "Enter" && handlePermanentDelete()} autoFocus />
                        {deleteErr && <p className="text-red-500 text-xs mb-3">{deleteErr}</p>}
                        <div className="flex gap-3 mt-3">
                            <button onClick={() => { setDeleteTarget(null); setDeletePassword(""); setDeleteErr(""); }}
                                className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handlePermanentDelete} disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60">
                                {deleting ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Suspend Modal ── */}
            {suspendTargets.length > 0 && (
                <SuspendModal
                    targets={suspendTargets}
                    onConfirm={handleSuspendConfirm}
                    onClose={() => setSuspendTargets([])}
                />
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
