import React, { useEffect, useRef, useState } from "react";
import { FiTrash2, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { obligationService, qrUrl } from "../../services/obligation.service";
import type { ObligationData, CreateObligationInput } from "../../services/obligation.service";

const DEPARTMENTS = [
    { id: 1, code: "CpE" },
    { id: 2, code: "CE" },
    { id: 3, code: "ECE" },
    { id: 4, code: "EE" },
    { id: 5, code: "ME" },
];

const SCOPES = ["all", "department", "year_level", "section"] as const;

function currentSchoolYear() {
    const y = new Date().getFullYear();
    return new Date().getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function currentSemester(): "1st" | "2nd" | "Summer" {
    const m = new Date().getMonth() + 1;
    if (m >= 8 && m <= 12) return "1st";
    if (m >= 1 && m <= 5)  return "2nd";
    return "Summer";
}

const BLANK_FORM: CreateObligationInput = {
    obligationName: "",
    description: "",
    amount: 0,
    isRequired: true,
    scope: "all",
    programId: null,
    yearLevel: null,
    section: null,
    schoolYear: currentSchoolYear(),
    semester: currentSemester(),
    dueDate: null,
    gcashQrPath: null,
};

const Obligations = () => {
    const { accessToken } = useAuth();
    const [obligations, setObligations] = useState<ObligationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [mode, setMode] = useState<"list" | "edit">("list");
    const [editing, setEditing] = useState<ObligationData | null>(null);
    const [form, setForm] = useState<CreateObligationInput>(BLANK_FORM);
    const [requiresPayment, setRequiresPayment] = useState(false);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [syncing, setSyncing] = useState<number | null>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!accessToken) return;
        obligationService.getAll(accessToken)
            .then(setObligations)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    function openAdd() {
        setEditing(null);
        setForm(BLANK_FORM);
        setRequiresPayment(false);
        setQrFile(null);
        setQrPreview(null);
        setFormError("");
        setMode("edit");
    }

    function openEdit(o: ObligationData) {
        setEditing(o);
        setForm({
            obligationName: o.obligationName,
            description: o.description ?? "",
            amount: o.amount,
            isRequired: o.isRequired,
            scope: o.scope,
            programId: o.programId,
            yearLevel: o.yearLevel,
            section: o.section,
            schoolYear: o.schoolYear,
            semester: o.semester as "1st" | "2nd" | "Summer",
            dueDate: o.dueDate,
            gcashQrPath: o.gcashQrPath,
        });
        setRequiresPayment(o.requiresPayment);
        setQrFile(null);
        setQrPreview(o.gcashQrPath ? qrUrl(o.gcashQrPath) : null);
        setFormError("");
        setMode("edit");
    }

    function cancelEdit() {
        setMode("list");
        setEditing(null);
    }

    function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setQrFile(file);
        if (file) {
            setQrPreview(URL.createObjectURL(file));
        }
    }

    async function handleSave() {
        if (!accessToken) return;
        if (!form.obligationName.trim()) { setFormError("Obligation name is required."); return; }
        if (requiresPayment && (!form.amount || form.amount <= 0)) {
            setFormError("Amount is required for paid obligations.");
            return;
        }
        setSaving(true);
        setFormError("");
        const submitForm = { ...form, amount: requiresPayment ? form.amount : 0 };
        try {
            if (editing) {
                await obligationService.update(accessToken, editing.obligationId, submitForm, qrFile);
                const updated = await obligationService.getAll(accessToken);
                setObligations(updated);
            } else {
                const created = await obligationService.create(accessToken, submitForm, qrFile);
                setObligations(prev => [created, ...prev]);
            }
            setMode("list");
        } catch (e: any) {
            setFormError(e.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        if (!accessToken) return;
        if (!window.confirm("Delete this obligation? Students will be notified.")) return;
        try {
            await obligationService.remove(accessToken, id);
            setObligations(prev => prev.filter(o => o.obligationId !== id));
            if (mode === "edit") setMode("list");
        } catch (e: any) {
            alert(e.message ?? "Failed to delete.");
        }
    }

    async function handleSync(id: number) {
        if (!accessToken) return;
        setSyncing(id);
        try {
            const res = await obligationService.sync(accessToken, id);
            alert(res.inserted > 0
                ? `Synced! ${res.inserted} student(s) newly assigned.`
                : "All matching students already have this obligation."
            );
        } catch (e: any) {
            alert(e.message ?? "Sync failed.");
        } finally {
            setSyncing(null);
        }
    }

    let filtered = obligations.filter(o =>
        o.obligationName.toLowerCase().includes(search.toLowerCase())
    );
    if (sortOption === "az") filtered = [...filtered].sort((a, b) => a.obligationName.localeCompare(b.obligationName));
    if (sortOption === "newest") filtered = [...filtered].sort((a, b) => b.obligationId - a.obligationId);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-10 bg-gray-50 min-h-screen">
            <h1 className="font-bold text-gray-800 text-2xl sm:text-4xl mb-4">Obligations</h1>

            {/* TOP BAR */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
                <input
                    className="border rounded-lg px-3 py-2 w-full sm:w-1/2 text-sm"
                    placeholder="Search obligations..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {mode === "list" ? (
                    <div className="flex gap-2 flex-wrap items-center">
                        <button onClick={openAdd} className="bg-primary text-white px-4 py-2 rounded-lg text-sm">
                            + Add Obligation
                        </button>
                        <select
                            value={sortOption}
                            onChange={e => setSortOption(e.target.value)}
                            className="border px-3 py-2 rounded-lg bg-white text-sm outline-none"
                        >
                            <option value="newest">Newest</option>
                            <option value="az">Name A–Z</option>
                        </select>
                    </div>
                ) : (
                    <button onClick={cancelEdit} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                        ← Back to List
                    </button>
                )}
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* LIST MODE */}
            {mode === "list" && (
                <>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-20 text-gray-400 opacity-60">
                            <p className="text-lg font-semibold">No obligations yet — add one to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl shadow bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-200 text-gray-800">
                                    <tr>
                                        <th className="p-3 text-left">Name</th>
                                        <th className="p-3 text-center">Payment</th>
                                        <th className="p-3 text-center">Scope</th>
                                        <th className="p-3 text-center">Program</th>
                                        <th className="p-3 text-center">Year</th>
                                        <th className="p-3 text-center">School Year</th>
                                        <th className="p-3 text-center">Semester</th>
                                        <th className="p-3 text-center">Due Date</th>
                                        <th className="p-3 text-center">GCash QR</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(o => (
                                        <tr key={o.obligationId} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium">{o.obligationName}</td>
                                            <td className="p-3 text-center">
                                                {o.requiresPayment
                                                    ? <span className="font-semibold text-gray-800">₱{Number(o.amount).toFixed(2)}</span>
                                                    : <span className="text-green-600 text-xs font-semibold">Free</span>}
                                            </td>
                                            <td className="p-3 text-center capitalize">{o.scope === "department" ? "program" : o.scope.replace("_", " ")}</td>
                                            <td className="p-3 text-center">{o.programName ?? "—"}</td>
                                            <td className="p-3 text-center">{o.yearLevel ?? "—"}</td>
                                            <td className="p-3 text-center">{o.schoolYear}</td>
                                            <td className="p-3 text-center">{o.semester}</td>
                                            <td className="p-3 text-center">{o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "—"}</td>
                                            <td className="p-3 text-center">
                                                {o.gcashQrPath
                                                    ? <a href={qrUrl(o.gcashQrPath)} target="_blank" rel="noreferrer" className="text-primary underline text-xs">View</a>
                                                    : <span className="text-gray-400 text-xs">—</span>}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${o.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                    {o.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-2 text-xs">
                                                    <button onClick={() => openEdit(o)} className="text-primary hover:underline">Edit</button>
                                                    <button
                                                        onClick={() => handleSync(o.obligationId)}
                                                        disabled={syncing === o.obligationId}
                                                        title="Sync — assign to any students missing this obligation"
                                                        className="text-blue-500 hover:bg-blue-50 p-1 rounded transition disabled:opacity-40"
                                                    >
                                                        <FiRefreshCw className={`w-4 h-4 ${syncing === o.obligationId ? "animate-spin" : ""}`} />
                                                    </button>
                                                    <button onClick={() => handleDelete(o.obligationId)} title="Delete" className="text-red-500 hover:bg-red-100 p-1 rounded transition">
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
                </>
            )}

            {/* EDIT / ADD MODE */}
            {mode === "edit" && (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 max-w-2xl">
                    <h2 className="font-bold text-xl mb-5 text-gray-800">{editing ? "Edit Obligation" : "Add Obligation"}</h2>

                    {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Obligation Name *</label>
                            <input
                                className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors"
                                placeholder="e.g. ESO T-Shirt Fee"
                                value={form.obligationName}
                                onChange={e => setForm({ ...form, obligationName: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors resize-none"
                                rows={5}
                                placeholder="Optional details..."
                                value={form.description ?? ""}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        {/* Payment Required Toggle */}
                        <div className="sm:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div
                                    onClick={() => {
                                        setRequiresPayment(p => !p);
                                        if (requiresPayment) setForm(f => ({ ...f, amount: 0 }));
                                    }}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${requiresPayment ? "bg-primary" : "bg-gray-300"}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${requiresPayment ? "translate-x-5" : "translate-x-0"}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-700">Payment Required</span>
                            </label>
                        </div>

                        {/* Amount + QR (shown only when payment required) */}
                        {requiresPayment && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors"
                                        value={form.amount || ""}
                                        onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GCash QR Code</label>
                                    <button
                                        type="button"
                                        onClick={() => qrInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 w-full text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors text-left"
                                    >
                                        {qrFile ? qrFile.name : "Click to upload QR image"}
                                    </button>
                                    <input
                                        ref={qrInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        className="hidden"
                                        onChange={handleQrChange}
                                    />
                                    {qrPreview && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <img src={qrPreview} alt="QR Preview" className="w-20 h-20 object-contain border-2 border-gray-200 rounded" />
                                            <button
                                                type="button"
                                                onClick={() => { setQrFile(null); setQrPreview(null); if (qrInputRef.current) qrInputRef.current.value = ""; }}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors"
                                value={form.dueDate ?? ""}
                                onChange={e => setForm({ ...form, dueDate: e.target.value || null })}
                            />
                        </div>

                        {/* School Year */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School Year *</label>
                            <input
                                className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors"
                                placeholder="e.g. 2024-2025"
                                value={form.schoolYear}
                                onChange={e => setForm({ ...form, schoolYear: e.target.value })}
                            />
                        </div>

                        {/* Semester */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                            <select
                                className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white transition-colors"
                                value={form.semester}
                                onChange={e => setForm({ ...form, semester: e.target.value as "1st" | "2nd" | "Summer" })}
                            >
                                <option value="1st">1st</option>
                                <option value="2nd">2nd</option>
                                <option value="Summer">Summer</option>
                            </select>
                        </div>

                        {/* Scope */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Scope *</label>
                            <select
                                className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white transition-colors"
                                value={form.scope}
                                onChange={e => setForm({ ...form, scope: e.target.value as CreateObligationInput["scope"], programId: null, yearLevel: null, section: null })}
                            >
                                {SCOPES.map(s => <option key={s} value={s}>{s === "department" ? "program" : s.replace("_", " ")}</option>)}
                            </select>
                        </div>

                        {/* Required */}
                        <div className="flex items-center gap-3 mt-6">
                            <input
                                type="checkbox"
                                id="isRequired"
                                checked={form.isRequired}
                                onChange={e => setForm({ ...form, isRequired: e.target.checked })}
                                className="w-4 h-4 accent-orange-500"
                            />
                            <label htmlFor="isRequired" className={`text-sm font-semibold ${form.isRequired ? "text-orange-600" : "text-gray-500"}`}>
                                Required obligation
                            </label>
                            {form.isRequired && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-300">Required</span>
                            )}
                        </div>

                        {/* Program */}
                        {(form.scope === "department" || form.scope === "year_level" || form.scope === "section") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                <select
                                    className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white transition-colors"
                                    value={form.programId ?? ""}
                                    onChange={e => setForm({ ...form, programId: e.target.value ? Number(e.target.value) : null })}
                                >
                                    <option value="">All Programs</option>
                                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Year Level */}
                        {(form.scope === "year_level" || form.scope === "section") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                                <select
                                    className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white transition-colors"
                                    value={form.yearLevel ?? ""}
                                    onChange={e => setForm({ ...form, yearLevel: e.target.value ? Number(e.target.value) : null })}
                                >
                                    <option value="">Any</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                        )}

                        {/* Section */}
                        {form.scope === "section" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                <input
                                    className="border-2 border-gray-300 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors"
                                    placeholder="e.g. A"
                                    value={form.section ?? ""}
                                    onChange={e => setForm({ ...form, section: e.target.value || null })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between mt-6 pt-4 border-t-2 border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-60 font-medium"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                        {editing && (
                            <button
                                onClick={() => handleDelete(editing.obligationId)}
                                title="Delete obligation"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition font-medium text-sm border border-red-200"
                            >
                                <FiTrash2 className="w-4 h-4" /> Delete
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Obligations;
