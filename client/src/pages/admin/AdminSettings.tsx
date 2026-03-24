import React, { useEffect, useState, useRef } from "react";
import { FiTrash2, FiPlus, FiCheck, FiUsers, FiArchive, FiUser, FiFilter, FiChevronDown, FiChevronUp, FiSearch } from "react-icons/fi";
import { userService } from "../../services/user.service";
import type { AdminUserItem, CreateAdminInput } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";

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

const ROLES: { value: CreateAdminInput["role"]; label: string }[] = [
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

const COLLEGES = [
    { id: 6, name: "Engineering" },
];

const BLANK: CreateAdminInput = {
    firstName: "", lastName: "", email: "", password: "",
    role: "eso_officer", programId: null, position: "",
};

type AdminSortKey = "name" | "program" | "year_level" | "section" | "role";

const AdminSettings = () => {
    const { accessToken } = useAuth();
    const [admins,             setAdmins]             = useState<AdminUserItem[]>([]);
    const [loadingAdmins,      setLoadingAdmins]      = useState(true);
    const [form,               setForm]               = useState<CreateAdminInput>(BLANK);
    const [saving,             setSaving]             = useState(false);
    const [formError,          setFormError]          = useState("");
    const [successMsg,         setSuccessMsg]         = useState("");
    const [deleteTarget,       setDeleteTarget]       = useState<AdminUserItem | null>(null);
    const [permDeleteTarget,   setPermDeleteTarget]   = useState<AdminUserItem | null>(null);
    const [deleting,           setDeleting]           = useState(false);
    const [deleteErr,          setDeleteErr]          = useState("");
    const [permDeletePassword, setPermDeletePassword] = useState("");
    const [togglingId,         setTogglingId]         = useState<number | null>(null);
    const [showForm,           setShowForm]           = useState(false);
    const [accountTab,         setAccountTab]         = useState<"active" | "archived">("active");
    const [adminSearch,        setAdminSearch]        = useState("");
    const [roleFilter,         setRoleFilter]         = useState("all");
    const [adminSortKey,       setAdminSortKey]       = useState<AdminSortKey>("name");
    const [showAdminFilters,   setShowAdminFilters]   = useState(false);
    const adminFilterRef = useRef<HTMLDivElement>(null);

    const activeAdmins   = admins.filter(a => a.status === "active");
    const archivedAdmins = admins.filter(a => a.status !== "active");

    useEffect(() => {
        if (!accessToken) return;
        userService.getAdmins(accessToken)
            .then(setAdmins)
            .catch(() => {})
            .finally(() => setLoadingAdmins(false));
    }, [accessToken]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!accessToken) return;
        setFormError(""); setSuccessMsg("");
        if (!form.firstName.trim() || !form.lastName.trim()) { setFormError("First and last name are required."); return; }
        if (!form.email.trim())       { setFormError("Email is required."); return; }
        if (form.password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
        if (!form.position.trim())    { setFormError("Position is required."); return; }
        setSaving(true);
        try {
            const created = await userService.createAdmin(accessToken, form);
            setAdmins(prev => [created, ...prev]);
            setForm(BLANK);
            setShowForm(false);
            setSuccessMsg(`Account for ${created.firstName} ${created.lastName} created successfully.`);
        } catch (err: any) {
            setFormError(err.message ?? "Failed to create account.");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(admin: AdminUserItem) {
        if (!accessToken) return;
        setTogglingId(admin.userId);
        try {
            const result = await userService.toggleAdmin(accessToken, admin.userId);
            setAdmins(prev => prev.map(a => a.userId === admin.userId ? { ...a, status: result.status } : a));
        } catch (err: any) {
            alert(err.message ?? "Failed to toggle status.");
        } finally {
            setTogglingId(null);
        }
    }

    // Archive: just deactivates (toggles to inactive), keeps re-activatable
    async function confirmArchive() {
        if (!deleteTarget || !accessToken) return;
        setDeleting(true); setDeleteErr("");
        try {
            const result = await userService.toggleAdmin(accessToken, deleteTarget.userId);
            setAdmins(prev => prev.map(a =>
                a.userId === deleteTarget.userId ? { ...a, status: result.status } : a
            ));
            setDeleteTarget(null);
        } catch (err: any) {
            setDeleteErr(err.message ?? "Failed to archive account.");
        } finally {
            setDeleting(false);
        }
    }

    // Permanent delete: verify password first, then remove
    async function confirmPermanentDelete() {
        if (!permDeleteTarget || !accessToken) return;
        setDeleting(true); setDeleteErr("");
        try {
            await authService.verifyPassword(accessToken, permDeletePassword);
            await userService.deleteAdmin(accessToken, permDeleteTarget.userId);
            setAdmins(prev => prev.filter(a => a.userId !== permDeleteTarget.userId));
            setPermDeleteTarget(null);
            setPermDeletePassword("");
        } catch (err: any) {
            setDeleteErr(err.message ?? "Failed to delete.");
        } finally {
            setDeleting(false);
        }
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (adminFilterRef.current && !adminFilterRef.current.contains(e.target as Node))
                setShowAdminFilters(false);
        }
        if (showAdminFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAdminFilters]);

    // Filter + sort active admins
    function filterAdmins(list: AdminUserItem[]) {
        let result = list;
        if (adminSearch.trim()) {
            const q = adminSearch.toLowerCase();
            result = result.filter(a =>
                `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q) ||
                (a.programName ?? "").toLowerCase().includes(q)
            );
        }
        if (roleFilter !== "all") {
            result = result.filter(a => a.roleLabel?.toLowerCase().replace(/\s/g, "_") === roleFilter || a.roleLabel === roleFilter);
        }
        if (adminSortKey === "name") result = [...result].sort((a, b) => a.lastName.localeCompare(b.lastName));
        if (adminSortKey === "program") result = [...result].sort((a, b) => (a.programName ?? "").localeCompare(b.programName ?? ""));
        if (adminSortKey === "role") result = [...result].sort((a, b) => (a.roleLabel ?? "").localeCompare(b.roleLabel ?? ""));
        return result;
    }

    const filteredActiveAdmins = filterAdmins(activeAdmins);
    const filteredArchivedAdmins = filterAdmins(archivedAdmins);
    const activeAdminFilterCount = [adminSearch.trim() !== "", roleFilter !== "all", adminSortKey !== "name"].filter(Boolean).length;

    const inputCls  = "border-2 border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white";
    const selectCls = inputCls;

    const isDean = form.role === "dean";
    const programLabel   = "Program";
    const programOptions = isDean ? COLLEGES : DEPARTMENTS;

    // ── Shared table header styles ─────────────────────────────────────────────
    const thCls = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide";
    const thCtrCls = "px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide";

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <div className="mb-6">
                <h1 className="font-bold text-gray-800 text-2xl sm:text-3xl">Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Manage admin accounts and system configuration</p>
            </div>

            <div className="flex flex-col gap-6 w-full">

                {/* ── ADMIN ACCOUNTS (tabbed) ───────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full">
                    {successMsg && (
                        <div className="flex items-center gap-2 text-green-700 text-sm mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                            <FiCheck className="w-4 h-4 flex-shrink-0" />
                            {successMsg}
                        </div>
                    )}
                    {/* Card header: title + tab toggle + create button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b-2 border-gray-100">
                        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                            <button
                                onClick={() => setAccountTab("active")}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                                    accountTab === "active" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                }`}>
                                <FiUsers className="w-4 h-4" />
                                Accounts
                                {activeAdmins.length > 0 && (
                                    <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeAdmins.length}</span>
                                )}
                            </button>
                            <button
                                onClick={() => setAccountTab("archived")}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                                    accountTab === "archived" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                }`}>
                                <FiArchive className="w-4 h-4" />
                                Archived
                                {archivedAdmins.length > 0 && (
                                    <span className="bg-gray-400 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{archivedAdmins.length}</span>
                                )}
                            </button>
                        </div>
                        {accountTab === "active" && (
                            <button
                                onClick={() => { setShowForm(true); setFormError(""); setSuccessMsg(""); setForm(BLANK); }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-orange-600 transition shadow-sm"
                            >
                                <FiPlus className="w-4 h-4" />
                                Create Admin Account
                            </button>
                        )}
                    </div>

                    {/* ── Search + Filter Bar ── */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input type="text" placeholder="Search by name, email, or program..."
                                value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                                className="border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full bg-white shadow-sm" />
                        </div>
                        <div className="relative" ref={adminFilterRef}>
                            <button onClick={() => setShowAdminFilters(f => !f)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm ${showAdminFilters || activeAdminFilterCount > 0 ? "bg-orange-500 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                                <FiFilter className="w-4 h-4" />
                                <span className="hidden sm:inline">Sort &amp; Filter</span>
                                {activeAdminFilterCount > 0 && (
                                    <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeAdminFilterCount}</span>
                                )}
                                {showAdminFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                            </button>
                            {showAdminFilters && (
                                <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-64 flex flex-col gap-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sort &amp; Filter</p>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Sort by</label>
                                        <select value={adminSortKey} onChange={e => setAdminSortKey(e.target.value as AdminSortKey)}
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
                                        </select>
                                    </div>
                                    {activeAdminFilterCount > 0 && (
                                        <button onClick={() => { setAdminSearch(""); setRoleFilter("all"); setAdminSortKey("name"); }}
                                            className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition">
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <span className="hidden sm:flex items-center text-xs font-medium text-gray-400 bg-white border border-gray-200 px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                            {accountTab === "active" ? filteredActiveAdmins.length : filteredArchivedAdmins.length} result{(accountTab === "active" ? filteredActiveAdmins.length : filteredArchivedAdmins.length) !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* ── Active tab ── */}
                    {accountTab === "active" && (loadingAdmins ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent"/>
                            Loading accounts...
                        </div>
                    ) : activeAdmins.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-gray-500">No active admin accounts</p>
                            <p className="text-sm mt-1">Create the first admin account to get started.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto border border-gray-200 rounded-2xl overflow-hidden">
                                <table className="w-full min-w-[800px] text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-y border-gray-300">
                                            <th className={thCls}>Name</th>
                                            <th className={thCls}>Email</th>
                                            <th className={thCls}>Role</th>
                                            <th className={thCls}>Program / Dept</th>
                                            <th className={thCls}>Position</th>
                                            <th className={thCtrCls}>Status</th>
                                            <th className={thCtrCls}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredActiveAdmins.map((a, i) => (
                                            <tr key={a.userId}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`hover:bg-orange-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" />
                                                        <span className="font-medium text-gray-800">{a.lastName}, {a.firstName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{a.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2.5 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold whitespace-nowrap">{a.roleLabel}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 text-sm">{a.programName ?? <span className="text-gray-300">—</span>}</td>
                                                <td className="px-4 py-3 text-gray-600 text-sm">{a.position ?? <span className="text-gray-300">—</span>}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white/70"/>Active
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleToggle(a)} disabled={togglingId === a.userId}
                                                            className="px-3 py-1.5 text-xs rounded-lg font-semibold transition disabled:opacity-50 bg-yellow-500 text-white hover:bg-yellow-600">
                                                            {togglingId === a.userId ? "..." : "Deactivate"}
                                                        </button>
                                                        <button onClick={() => { setDeleteTarget(a); setDeleteErr(""); }}
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
                        </>
                    ))}

                    {/* ── Archived tab ── */}
                    {accountTab === "archived" && (
                        archivedAdmins.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <FiArchive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No archived accounts yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto border border-gray-200 rounded-2xl overflow-hidden">
                                    <table className="w-full min-w-[700px] text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-y border-gray-300">
                                                <th className={thCls}>Name</th>
                                                <th className={thCls}>Email</th>
                                                <th className={thCls}>Role</th>
                                                <th className={thCls}>Program / Dept</th>
                                                <th className={thCls}>Position</th>
                                                <th className={thCtrCls}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredArchivedAdmins.map((a, i) => (
                                                <tr key={a.userId}
                                                    style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                    className={`transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}`}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <UserAvatar size="sm" />
                                                            <span className="font-medium text-gray-500">{a.lastName}, {a.firstName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{a.email}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-semibold whitespace-nowrap">{a.roleLabel}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-sm">{a.programName ?? <span className="text-gray-300">—</span>}</td>
                                                    <td className="px-4 py-3 text-gray-400 text-sm">{a.position ?? <span className="text-gray-300">—</span>}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleToggle(a)} disabled={togglingId === a.userId}
                                                                className="px-3 py-1.5 text-xs rounded-lg font-semibold transition disabled:opacity-50 bg-green-600 text-white hover:bg-green-700">
                                                                {togglingId === a.userId ? "..." : "Activate"}
                                                            </button>
                                                            <button onClick={() => { setPermDeleteTarget(a); setPermDeletePassword(""); setDeleteErr(""); }}
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
                            </>
                        )
                    )}
                </div>

            </div>

            {/* ── CREATE ADMIN MODAL ──────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                        <div className="flex items-center justify-between mb-5 border-b-2 border-gray-200 pb-3">
                            <h2 className="font-semibold text-gray-800 text-lg">Create Admin Account</h2>
                            <button onClick={() => { setShowForm(false); setFormError(""); setForm(BLANK); }}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                        </div>

                        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                    <input className={inputCls}
                                        value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                    <input className={inputCls}
                                        value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dela Cruz" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input type="email" className={inputCls}
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="officer@eso.edu.ph" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input type="password" className={inputCls}
                                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                    <select className={selectCls}
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value as CreateAdminInput["role"], programId: null })}>
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{programLabel}</label>
                                    <select className={selectCls}
                                        value={form.programId ?? ""}
                                        onChange={e => setForm({ ...form, programId: e.target.value ? Number(e.target.value) : null })}>
                                        <option value="">None</option>
                                        {programOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                                    <input className={inputCls}
                                        value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="e.g. ESO President" />
                                </div>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => { setForm(BLANK); setFormError(""); }}
                                    className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm">
                                    Reset
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-sm">
                                    {saving ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── ARCHIVE (SOFT-DELETE) CONFIRMATION ─────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6">
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Archive Admin Account</h3>
                        <p className="text-sm text-gray-600 mb-1">This will deactivate and archive the account for:</p>
                        <p className="font-semibold text-gray-800 mb-1">{deleteTarget.firstName} {deleteTarget.lastName}</p>
                        <p className="text-xs text-gray-500 mb-1">{deleteTarget.email}</p>
                        <p className="text-xs text-gray-500 mb-4">{deleteTarget.roleLabel}</p>
                        <p className="text-xs text-yellow-600 mb-4">The account will be moved to the Archived section. You can re-activate or permanently delete it from there.</p>
                        {deleteErr && <p className="text-red-500 text-sm mb-3">{deleteErr}</p>}
                        <div className="flex justify-between gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={confirmArchive} disabled={deleting}
                                className="px-5 py-2.5 rounded-xl bg-yellow-500 text-white font-semibold text-sm hover:bg-yellow-600 disabled:opacity-60">
                                {deleting ? "Archiving..." : "Yes, Archive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PERMANENT DELETE CONFIRMATION ──────────────────────────────── */}
            {permDeleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6">
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
                            <p className="font-semibold text-gray-800 text-sm">{permDeleteTarget.firstName} {permDeleteTarget.lastName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{permDeleteTarget.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{permDeleteTarget.roleLabel}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Enter your password to confirm deletion:</p>
                        <input
                            type="password"
                            value={permDeletePassword}
                            onChange={e => setPermDeletePassword(e.target.value)}
                            placeholder="Your password"
                            className="border-2 border-gray-300 focus:border-red-400 focus:outline-none rounded-xl px-3 py-2 w-full text-sm mb-4"
                        />
                        {deleteErr && <p className="text-red-500 text-sm mb-3">{deleteErr}</p>}
                        <div className="flex justify-between gap-3">
                            <button onClick={() => { setPermDeleteTarget(null); setPermDeletePassword(""); setDeleteErr(""); }}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={confirmPermanentDelete} disabled={deleting || !permDeletePassword}
                                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition">
                                {deleting ? "Verifying..." : "Yes, Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
