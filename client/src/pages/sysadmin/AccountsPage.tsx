import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
    FiPlus, FiCheck, FiUsers, FiArchive, FiFilter, FiTrash2,
    FiChevronDown, FiChevronUp, FiSearch,
} from "react-icons/fi";
import { MdClose, MdBlock, MdDeleteOutline } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import { sysadminService } from "../../services/sysadmin.service";
import { authService } from "../../services/auth.service";
import CreateAccountModal, { BLANK_FORM, CLASS_ROLES } from "./accounts/CreateAccountModal";
import type { CreateForm } from "./accounts/CreateAccountModal";
import EditAccountModal from "./accounts/EditAccountModal";
import type { Account, EditForm } from "./accounts/EditAccountModal";
import AccountsTable from "./accounts/AccountsTable";

// Types

type SortKey = "name" | "program" | "role";

// Suspend confirmation modal (small, kept inline)

function SuspendModal({ targets, onConfirm, onClose }: {
    targets:   Account[];
    onConfirm: () => void;
    onClose:   () => void;
}) {
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const submit = () => {
        if (!password) { setErr("Enter your password to confirm."); return; }
        onConfirm();
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            style={{ animation: "fadeInScrim 0.2s ease both" }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-sm p-6 relative"
                style={{ animation: "modalPop 0.25s cubic-bezier(.34,1.4,.64,1) both" }}
                onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                    <MdClose size={20} />
                </button>
                <div className="flex items-center gap-2 mb-3">
                    <MdBlock className="text-red-500" size={20} />
                    <h3 className="text-gray-800 font-bold text-base">Confirm Suspension</h3>
                </div>
                <p className="text-gray-500 text-sm mb-3">
                    {targets.length === 1
                        ? <><strong className="text-gray-800">{targets[0].first_name} {targets[0].last_name}</strong> will be suspended.</>
                        : <>Suspend <strong className="text-gray-800">{targets.length} accounts</strong>?</>}
                </p>
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your password</label>
                    <input type="password" value={password}
                        onChange={e => { setPassword(e.target.value); setErr(""); }}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border-2 border-gray-300 focus:border-red-400 focus:outline-none px-3.5 py-2.5 text-sm"
                        onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
                    {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={submit}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white">
                        Suspend
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main

export default function AccountsPage() {
    const { accessToken } = useAuth();

    // Data
    const [accounts,  setAccounts]  = useState<Account[]>([]);
    const [programs,  setPrograms]  = useState<{ program_id: number; name: string; code: string }[]>([]);
    const [roles,     setRoles]     = useState<{ role_id: number; role_name: string; role_label: string }[]>([]);
    const [loading,   setLoading]   = useState(true);

    // UI state
    const [tab,           setTab]           = useState<"active" | "archived">("active");
    const [search,        setSearch]        = useState("");
    const [roleFilter,    setRoleFilter]    = useState("all");
    const [programFilter, setProgramFilter] = useState("all");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [sortKey,       setSortKey]       = useState<SortKey>("name");
    const [showFilters,   setShowFilters]   = useState(false);
    const [successMsg,    setSuccessMsg]    = useState("");
    const [toast,         setToast]         = useState("");

    // Selection
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // Create modal
    const [showCreate,     setShowCreate]     = useState(false);
    const [form,           setForm]           = useState<CreateForm>(BLANK_FORM);
    const [formError,      setFormError]      = useState("");
    const [saving,         setSaving]         = useState(false);
    const [showCreatePass, setShowCreatePass] = useState(false);

    // Edit modal
    const [editTarget,   setEditTarget]   = useState<Account | null>(null);
    const [editForm,     setEditForm]     = useState<EditForm>({
        firstName: "", lastName: "", email: "",
        roleId: "", programId: "", position: "",
        password: "", yearLevel: "", section: "",
    });
    const [editSaving,   setEditSaving]   = useState(false);
    const [editError,    setEditError]    = useState("");
    const [showEditPass, setShowEditPass] = useState(false);

    // Confirmation modals
    const [suspendTargets, setSuspendTargets] = useState<Account[]>([]);
    const [archiveTarget,  setArchiveTarget]  = useState<Account | null>(null);
    const [deleteTarget,   setDeleteTarget]   = useState<Account | null>(null);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteErr,      setDeleteErr]      = useState("");
    const [deleting,       setDeleting]       = useState(false);

    const filterRef   = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3000); };

    // Load all accounts, programs, and roles
    const load = async () => {
        if (!accessToken) return;
        setLoading(true); setSelected(new Set());
        try {
            const [accs, progs, rls] = await Promise.all([
                sysadminService.getAccounts(accessToken),
                sysadminService.getPrograms(accessToken),
                sysadminService.getRoles(accessToken),
            ]);
            setAccounts(accs); setPrograms(progs); setRoles(rls);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [accessToken]);

    // Close filter dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            const t = e.target as Node;
            if (!filterRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
                setShowFilters(false);
            }
        }
        if (showFilters) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showFilters]);

    // Derived lists
    const activeAccounts   = accounts.filter(a => a.status === "active");
    const archivedAccounts = accounts.filter(a => a.status !== "active");

    function filterAndSort(list: Account[]) {
        let r = [...list];
        if (search.trim()) {
            const q = search.toLowerCase();
            r = r.filter(a =>
                `${a.first_name} ${a.last_name} ${a.email} ${a.program_name ?? ""}`.toLowerCase().includes(q)
            );
        }
        if (roleFilter    !== "all") r = r.filter(a => a.role_name === roleFilter);
        if (programFilter !== "all") r = r.filter(a => (a.program_name ?? "") === programFilter);
        if (statusFilter  !== "all") r = r.filter(a => a.status === statusFilter);
        if (sortKey === "name")    r.sort((a, b) => a.last_name.localeCompare(b.last_name));
        if (sortKey === "program") r.sort((a, b) => (a.program_name ?? "").localeCompare(b.program_name ?? ""));
        if (sortKey === "role")    r.sort((a, b) => (a.role_label ?? "").localeCompare(b.role_label ?? ""));
        return r;
    }

    const displayed        = filterAndSort(tab === "active" ? activeAccounts : archivedAccounts);
    const activeFilterCount = [
        search.trim() !== "", roleFilter !== "all",
        programFilter !== "all", statusFilter !== "all", sortKey !== "name",
    ].filter(Boolean).length;

    // Selection helpers
    const selectableIds = displayed.filter(a => a.role_name !== "system_admin").map(a => a.user_id);
    const allSelected   = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));
    const someSelected  = selected.size > 0;
    const toggleAll     = () => allSelected ? setSelected(new Set()) : setSelected(new Set(selectableIds));
    const toggleOne     = (id: number) => setSelected(prev => {
        const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
    const selectedAccounts = displayed.filter(a => selected.has(a.user_id));

    // Actions
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;
        setFormError("");
        if (!form.firstName.trim() || !form.lastName.trim()) { setFormError("First and last name are required."); return; }
        if (!form.email.trim())       { setFormError("Email is required."); return; }
        if (form.password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
        const isClassOfficer = CLASS_ROLES.includes(form.role);
        let position = form.position.trim();
        if (isClassOfficer) {
            if (!form.yearLevel)          { setFormError("Year level is required for Class Officer."); return; }
            if (!form.section.trim())     { setFormError("Section is required for Class Officer."); return; }
            const yrLabel = ["1st Year","2nd Year","3rd Year","4th Year","5th Year"][Number(form.yearLevel) - 1] ?? form.yearLevel;
            position = `${yrLabel} - Section ${form.section.trim()}`;
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
            setShowCreate(false); setShowCreatePass(false); setForm(BLANK_FORM); load();
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
        try {
            await sysadminService.updateAccountStatus(accessToken, archiveTarget.user_id, "inactive");
            setArchiveTarget(null); load();
        } catch (e: any) { showToast(e.message); }
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
            await Promise.all(
                suspendTargets.map(a => sysadminService.updateAccountStatus(accessToken, a.user_id, "suspended"))
            );
            showToast(`${suspendTargets.length > 1 ? `${suspendTargets.length} accounts` : "Account"} suspended.`);
            setSuspendTargets([]); setSelected(new Set()); load();
        } catch (e: any) { showToast(e.message); }
    };

    const openEdit = (a: Account) => {
        setEditTarget(a); setEditError("");
        setEditForm({
            firstName: a.first_name, lastName: a.last_name, email: a.email,
            roleId:    String(a.role_id),
            programId: a.program_id ? String(a.program_id) : "",
            position:  a.position ?? "",
            password:  "",
            yearLevel: a.year_level ? String(a.year_level) : "",
            section:   a.section ?? "",
        });
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget || !accessToken) return;
        setEditError("");
        if (!editForm.firstName.trim() || !editForm.lastName.trim()) { setEditError("First and last name are required."); return; }
        if (!editForm.email.trim()) { setEditError("Email is required."); return; }
        if (!editForm.roleId)       { setEditError("Role is required."); return; }
        if (editForm.password && editForm.password.length < 8) { setEditError("Password must be at least 8 characters."); return; }
        setEditSaving(true);
        try {
            const editRoleName = roles.find(r => r.role_id === Number(editForm.roleId))?.role_name ?? "";
            await sysadminService.updateAccount(accessToken, editTarget.user_id, {
                firstName: editForm.firstName.trim(),
                lastName:  editForm.lastName.trim(),
                email:     editForm.email.trim(),
                roleId:    Number(editForm.roleId),
                programId: editForm.programId ? Number(editForm.programId) : null,
                position:  editForm.position.trim(),
                password:  editForm.password || undefined,
                yearLevel: CLASS_ROLES.includes(editRoleName) && editForm.yearLevel ? Number(editForm.yearLevel) : null,
                section:   CLASS_ROLES.includes(editRoleName) ? editForm.section.trim() || null : null,
            });
            setEditTarget(null); setShowEditPass(false);
            showToast(`${editForm.firstName} ${editForm.lastName} updated.`); load();
        } catch (err: any) {
            setEditError(err.message ?? "Failed to update.");
        } finally { setEditSaving(false); }
    };

    const handleBulkArchive = async () => {
        if (!accessToken || !someSelected) return;
        try {
            await Promise.all([...selected].map(id => sysadminService.updateAccountStatus(accessToken, id, "inactive")));
            showToast(`${selected.size} account(s) archived.`); setSelected(new Set()); load();
        } catch (e: any) { showToast(e.message); }
    };

    // Render
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
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">Accounts</h1>
            </div>

            {successMsg && (
                <div className="flex items-center gap-2 text-green-700 text-sm mb-4 bg-green-50 rounded-xl px-4 py-2.5"
                    style={{ animation: "slideDown 0.25s ease both" }}>
                    <FiCheck className="w-4 h-4 shrink-0" />{successMsg}
                </div>
            )}

            {/* Tabs + Create button */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4"
                style={{ animation: "fadeInUp 0.4s ease both 0.06s" }}>
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                    <button onClick={() => setTab("active")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap
                            ${tab === "active" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        <FiUsers className="w-4 h-4" /> Accounts
                        {activeAccounts.length > 0 && (
                            <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                                {activeAccounts.length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setTab("archived")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition whitespace-nowrap
                            ${tab === "archived" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        <FiArchive className="w-4 h-4" /> Archived
                        {archivedAccounts.length > 0 && (
                            <span className="bg-gray-400 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                                {archivedAccounts.length}
                            </span>
                        )}
                    </button>
                </div>
                {tab === "active" && (
                    <button onClick={() => { setShowCreate(true); setFormError(""); setForm(BLANK_FORM); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition shadow-sm">
                        <FiPlus className="w-4 h-4" /> Create Account
                    </button>
                )}
            </div>

            {/* Search + Filter */}
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
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                                {activeFilterCount}
                            </span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {showFilters && createPortal(
                        <div ref={dropdownRef}
                            className="fixed z-[9999] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-4 w-64 flex flex-col gap-3"
                            style={{
                                animation: "slideDown 0.2s ease both",
                                top:   filterRef.current ? filterRef.current.getBoundingClientRect().bottom + 8 : 0,
                                right: window.innerWidth - (filterRef.current?.getBoundingClientRect().right ?? 0),
                            }}>
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
                                    {roles.map(r => <option key={r.role_name} value={r.role_name}>{r.role_label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Program</label>
                                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                    <option value="all">All Programs</option>
                                    {programs.map(p => <option key={p.program_id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white">
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => { setSearch(""); setRoleFilter("all"); setProgramFilter("all"); setStatusFilter("all"); setSortKey("name"); }}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 rounded-xl hover:bg-red-50 transition">
                                    Clear all filters
                                </button>
                            )}
                        </div>,
                        document.body
                    )}
                </div>
                <span className="hidden sm:flex items-center text-xs font-medium text-gray-400 bg-white px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                    {displayed.length} result{displayed.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Bulk action bar */}
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

            {/* Accounts table */}
            <AccountsTable
                tab={tab} loading={loading}
                activeAccounts={activeAccounts}
                archivedAccounts={archivedAccounts}
                filterAndSort={filterAndSort}
                selected={selected} allSelected={allSelected}
                toggleAll={toggleAll} toggleOne={toggleOne}
                onEdit={openEdit}
                onSuspend={setSuspendTargets}
                onArchive={setArchiveTarget}
                onActivate={id => handleStatus(id, "active")}
                onDelete={a => { setDeleteTarget(a); setDeletePassword(""); setDeleteErr(""); }}
            />

            {/* Create account modal */}
            {showCreate && (
                <CreateAccountModal
                    form={form} setForm={setForm}
                    formError={formError} saving={saving}
                    showCreatePass={showCreatePass} setShowCreatePass={setShowCreatePass}
                    programs={programs} roles={roles}
                    onSubmit={handleCreate}
                    onClose={() => { setShowCreate(false); setFormError(""); setForm(BLANK_FORM); }}
                />
            )}

            {/* Edit account modal */}
            {editTarget && (
                <EditAccountModal
                    editTarget={editTarget}
                    editForm={editForm} setEditForm={setEditForm}
                    editError={editError} editSaving={editSaving}
                    showEditPass={showEditPass} setShowEditPass={setShowEditPass}
                    programs={programs} roles={roles}
                    onSubmit={handleEditSave}
                    onClose={() => { setEditTarget(null); setShowEditPass(false); }}
                />
            )}

            {/* Archive confirmation */}
            {archiveTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    style={{ animation: "fadeInScrim 0.2s ease both" }}
                    onClick={() => setArchiveTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6 relative"
                        style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => setArchiveTarget(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition">
                            <MdClose size={20} />
                        </button>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Archive Account</h3>
                        <p className="text-sm text-gray-600 mb-1">This will deactivate and archive the account for:</p>
                        <p className="font-semibold text-gray-800 mb-0.5">{archiveTarget.first_name} {archiveTarget.last_name}</p>
                        <p className="text-xs text-gray-500 mb-0.5">{archiveTarget.email}</p>
                        <p className="text-xs text-gray-500 mb-3">{archiveTarget.role_label}</p>
                        <p className="text-xs text-yellow-600 mb-4">The account will be moved to Archived. You can re-activate or permanently delete it from there.</p>
                        <div className="flex justify-between gap-3">
                            <button onClick={() => setArchiveTarget(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleArchive}
                                className="px-5 py-2.5 rounded-xl bg-yellow-500 text-white font-semibold text-sm hover:bg-yellow-600">
                                Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permanent delete confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    style={{ animation: "fadeInScrim 0.2s ease both" }}
                    onClick={() => { setDeleteTarget(null); setDeletePassword(""); setDeleteErr(""); }}>
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6 relative"
                        style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setDeleteTarget(null); setDeletePassword(""); setDeleteErr(""); }}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition">
                            <MdClose size={20} />
                        </button>
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
                        <input type="password" value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
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

            {/* Suspend modal */}
            {suspendTargets.length > 0 && (
                <SuspendModal
                    targets={suspendTargets}
                    onConfirm={handleSuspendConfirm}
                    onClose={() => setSuspendTargets([])}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50"
                    style={{ animation: "slideDown 0.25s ease both" }}>
                    {toast}
                </div>
            )}
        </div>
    );
}
