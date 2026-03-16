import React, { useEffect, useState } from "react";
import { FiTrash2, FiPlus, FiCheck, FiUsers } from "react-icons/fi";
import { userService } from "../../services/user.service";
import type { AdminUserItem, CreateAdminInput } from "../../services/user.service";
import { useAuth } from "../../hooks/useAuth";

const ROLES: { value: CreateAdminInput["role"]; label: string }[] = [
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

const BLANK: CreateAdminInput = {
    firstName: "", lastName: "", email: "", password: "",
    role: "eso_officer", departmentId: null, position: "",
};

const AdminSettings = () => {
    const { accessToken } = useAuth();
    const [admins,        setAdmins]        = useState<AdminUserItem[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(true);
    const [form,          setForm]          = useState<CreateAdminInput>(BLANK);
    const [saving,        setSaving]        = useState(false);
    const [formError,     setFormError]     = useState("");
    const [successMsg,    setSuccessMsg]    = useState("");
    const [deleteTarget,  setDeleteTarget]  = useState<AdminUserItem | null>(null);
    const [deleting,      setDeleting]      = useState(false);
    const [deleteErr,     setDeleteErr]     = useState("");
    const [togglingId,    setTogglingId]    = useState<number | null>(null);
    const [showForm,      setShowForm]      = useState(false);

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

    async function confirmDelete() {
        if (!deleteTarget || !accessToken) return;
        setDeleting(true); setDeleteErr("");
        try {
            await userService.deleteAdmin(accessToken, deleteTarget.userId);
            setAdmins(prev => prev.filter(a => a.userId !== deleteTarget.userId));
            setDeleteTarget(null);
        } catch (err: any) {
            setDeleteErr(err.message ?? "Failed to delete.");
        } finally {
            setDeleting(false);
        }
    }

    const inputCls = "border-2 border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white";
    const selectCls = inputCls;

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="font-bold text-gray-800 text-2xl sm:text-3xl">Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Manage admin accounts and system configuration</p>
            </div>

            <div className="flex flex-col gap-6 w-full">

                {/* ADMIN ACCOUNTS LIST */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 w-full">
                    {successMsg && (
                        <div className="flex items-center gap-2 text-green-700 text-sm mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                            <FiCheck className="w-4 h-4 flex-shrink-0" />
                            {successMsg}
                        </div>
                    )}
                    <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-gray-100">
                        <div>
                            <h2 className="font-semibold text-gray-800 text-base">Admin Accounts</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{admins.length} account{admins.length !== 1 ? "s" : ""}</p>
                        </div>
                        <button
                            onClick={() => { setShowForm(true); setFormError(""); setSuccessMsg(""); setForm(BLANK); }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-orange-600 transition shadow-sm"
                        >
                            <FiPlus className="w-4 h-4" />
                            Create Admin Account
                        </button>
                    </div>
                    {loadingAdmins ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent"/>
                            Loading accounts...
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-gray-500">No admin accounts yet</p>
                            <p className="text-sm mt-1">Create the first admin account to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-y-2 border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Program</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {admins.map((a, i) => (
                                        <tr key={a.userId} className={`hover:bg-orange-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                                            <td className="px-4 py-3 font-medium text-gray-800">{a.lastName}, {a.firstName}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{a.email}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2.5 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold">
                                                    {a.roleLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">{a.departmentName ?? <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">{a.position ?? <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-green-500" : "bg-gray-400"}`}/>
                                                    {a.status === "active" ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleToggle(a)}
                                                        disabled={togglingId === a.userId}
                                                        title={a.status === "active" ? "Deactivate account" : "Activate account"}
                                                        className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition disabled:opacity-50 ${
                                                            a.status === "active"
                                                                ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                                                                : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                                        }`}
                                                    >
                                                        {togglingId === a.userId ? "..." : a.status === "active" ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTarget(a); setDeleteErr(""); }}
                                                        title="Delete account"
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* CREATE ADMIN MODAL */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-5 border-b-2 border-gray-200 pb-3">
                                <h2 className="font-semibold text-gray-800 text-lg">Create Admin Account</h2>
                                <button onClick={() => { setShowForm(false); setFormError(""); setForm(BLANK); }}
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                            </div>

                            {formError  && <p className="text-red-500 text-sm mb-4">{formError}</p>}

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
                                            value={form.role} onChange={e => setForm({ ...form, role: e.target.value as CreateAdminInput["role"] })}>
                                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                        <select className={selectCls}
                                            value={form.departmentId ?? ""} onChange={e => setForm({ ...form, departmentId: e.target.value ? Number(e.target.value) : null })}>
                                            <option value="">None</option>
                                            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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

            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Delete Admin Account</h3>
                        <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete the account for:</p>
                        <p className="font-semibold text-gray-800 mb-1">{deleteTarget.firstName} {deleteTarget.lastName}</p>
                        <p className="text-xs text-gray-500 mb-1">{deleteTarget.email}</p>
                        <p className="text-xs text-gray-500 mb-4">{deleteTarget.roleLabel}</p>
                        <p className="text-xs text-red-500 mb-4">This action cannot be undone.</p>
                        {deleteErr && <p className="text-red-500 text-sm mb-3">{deleteErr}</p>}
                        <div className="flex justify-between gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300">
                                No, Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60">
                                {deleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
