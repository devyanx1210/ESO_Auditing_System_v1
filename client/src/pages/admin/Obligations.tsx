import React, { useEffect, useRef, useState, useMemo } from "react";
import { FiTrash2, FiRefreshCw, FiEdit2, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { obligationService, qrUrl } from "../../services/obligation.service";
import type { ObligationData, CreateObligationInput } from "../../services/obligation.service";

const DEPARTMENTS = [
    { id: 1, name: "Computer Engineering" },
    { id: 2, name: "Civil Engineering" },
    { id: 3, name: "Electronics Engineering" },
    { id: 4, name: "Electrical Engineering" },
    { id: 5, name: "Mechanical Engineering" },
];

const SCOPES = [
    { value: 0, label: "all" },
    { value: 1, label: "program" },
    { value: 2, label: "year level" },
    { value: 3, label: "section" },
] as const;

const SCOPE_LABELS: Record<number, string> = { 0: "all", 1: "program", 2: "year level", 3: "section" };
const SEMESTER_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "Summer" };

function currentSchoolYear() {
    const y = new Date().getFullYear();
    return new Date().getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function currentSemester(): number {
    const m = new Date().getMonth() + 1;
    if (m >= 8 && m <= 12) return 1;
    return 2;
}

const BLANK_FORM: CreateObligationInput = {
    obligationName: "",
    description: "",
    amount: 0,
    isRequired: true,
    scope: 0,
    programId: null,
    yearLevel: null,
    section: null,
    schoolYear: currentSchoolYear(),
    semester: currentSemester(),
    dueDate: null,
    gcashQrPath: null,
};

// ─── School Year Combobox ─────────────────────────────────────────────────────

function generateSchoolYears(center: number, range = 8): string[] {
    const years: string[] = [];
    for (let y = center - range; y <= center + range; y++) {
        years.push(`${y}-${y + 1}`);
    }
    return years;
}

interface SchoolYearComboboxProps {
    value: string;
    onChange: (v: string) => void;
}
function SchoolYearCombobox({ value, onChange }: SchoolYearComboboxProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentYear = new Date().getFullYear();

    const allOptions = useMemo(() => generateSchoolYears(currentYear, 8), [currentYear]);

    const filtered = useMemo(() => {
        const q = value.trim().toLowerCase();
        if (!q) return allOptions;
        return allOptions.filter(y => y.includes(q));
    }, [value, allOptions]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <input
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                placeholder="e.g. 2024-2025"
                value={value}
                autoComplete="off"
                onFocus={() => setOpen(true)}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
            />
            {open && filtered.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-y-auto max-h-48
                    bg-white dark:bg-[#2a2a2a] shadow-[0_8px_32px_rgba(0,0,0,0.18)]
                    ring-1 ring-black/5 text-sm">
                    {filtered.map(y => (
                        <li key={y}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { onChange(y); setOpen(false); }}
                            className={`px-3 py-2 cursor-pointer transition-colors
                                ${value === y
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-800 dark:text-gray-100 hover:bg-orange-50 dark:hover:bg-orange-500/10"}`}>
                            {y}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const Obligations = () => {
    const { accessToken } = useAuth();
    const [obligations, setObligations] = useState<ObligationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [filterPayment, setFilterPayment] = useState<"all" | "required" | "free">("all");
    const [filterProgram, setFilterProgram] = useState<number | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ObligationData | null>(null);
    const [form, setForm] = useState<CreateObligationInput>(BLANK_FORM);
    const [requiresPayment, setRequiresPayment] = useState(false);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [syncing, setSyncing] = useState<number | null>(null);
    const [selectedObIds, setSelectedObIds] = useState<Set<number>>(new Set());
    const qrInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node))
                setShowFilter(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const activeFilterCount = (filterPayment !== "all" ? 1 : 0) + (filterProgram !== null ? 1 : 0);

    function toggleObSelect(id: number) {
        setSelectedObIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function toggleObSelectAll() {
        if (selectedObIds.size === filtered.length) {
            setSelectedObIds(new Set());
        } else {
            setSelectedObIds(new Set(filtered.map(o => o.obligationId)));
        }
    }

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
        setShowModal(true);
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
            semester: o.semester,
            dueDate: o.dueDate,
            gcashQrPath: o.gcashQrPath,
        });
        setRequiresPayment(o.requiresPayment);

        setQrFile(null);
        setQrPreview(o.gcashQrPath ? qrUrl(o.gcashQrPath) : null);
        setFormError("");
        setShowModal(true);
    }

    function cancelEdit() {
        setShowModal(false);
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
            setShowModal(false);
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
            setShowModal(false);
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

    const searchLower = search.toLowerCase();
    let filtered = obligations.filter(o => {
        if (searchLower && !o.obligationName.toLowerCase().includes(searchLower) && !(o.createdByName ?? "").toLowerCase().includes(searchLower)) return false;
        if (filterPayment === "required" && o.amount <= 0) return false;
        if (filterPayment === "free" && o.amount > 0) return false;
        if (filterProgram !== null && o.programId !== filterProgram) return false;
        return true;
    });
    if (sortOption === "az") filtered = [...filtered].sort((a, b) => a.obligationName.localeCompare(b.obligationName));
    else if (sortOption === "newest") filtered = [...filtered].sort((a, b) => b.obligationId - a.obligationId);
    else if (sortOption === "amount-high") filtered = [...filtered].sort((a, b) => b.amount - a.amount);
    else if (sortOption === "amount-low") filtered = [...filtered].sort((a, b) => a.amount - b.amount);

    async function handleBulkDelete() {
        if (!accessToken || !selectedObIds.size) return;
        if (!window.confirm(`Delete ${selectedObIds.size} obligation(s)? This cannot be undone.`)) return;
        const ids = [...selectedObIds];
        for (const id of ids) {
            try {
                await obligationService.remove(accessToken, id);
            } catch { /* skip errors */ }
        }
        setObligations(prev => prev.filter(o => !ids.includes(o.obligationId)));
        setSelectedObIds(new Set());
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen dark:bg-[#111111]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-10 bg-gray-50 dark:bg-[#111111] min-h-screen">
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <h1 className="font-bold text-gray-800 dark:text-gray-100 text-2xl sm:text-4xl mb-4">Obligations</h1>

            {/* TOP BAR */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
                <input
                    className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 w-full sm:w-1/2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500 shadow-sm"
                    placeholder="Search by name or created by..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap items-center justify-between sm:justify-start w-full sm:w-auto">
                    {selectedObIds.size > 0 && (
                        <button onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">
                            <FiTrash2 className="w-3.5 h-3.5" />
                            Delete Selected ({selectedObIds.size})
                        </button>
                    )}
                    <button onClick={openAdd} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition">
                        + Add Obligation
                    </button>
                    <div ref={filterRef} className="relative">
                        <button
                            onClick={() => setShowFilter(f => !f)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm ${
                                showFilter || activeFilterCount > 0
                                    ? "bg-primary text-white"
                                    : "bg-orange-500 text-white hover:bg-orange-600"
                            }`}
                        >
                            <FiFilter className="w-4 h-4" />
                            <span className="hidden sm:inline">Sort &amp; Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                            )}
                            {showFilter ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                        </button>

                        {showFilter && (
                            <div className="absolute right-0 sm:right-0 top-full mt-2 z-30 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-72 max-w-[calc(100vw-2rem)] flex flex-col gap-3" style={{ animation: 'fadeInUp 0.15s ease both' }}>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sort &amp; Filter</p>

                                {/* Sort By */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sort by</label>
                                    <select value={sortOption} onChange={e => setSortOption(e.target.value)}
                                        className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                        <option value="newest">Newest</option>
                                        <option value="az">Name A–Z</option>
                                        <option value="amount-high">Amount (High → Low)</option>
                                        <option value="amount-low">Amount (Low → High)</option>
                                    </select>
                                </div>

                                {/* Payment */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Payment</label>
                                    <select value={filterPayment} onChange={e => setFilterPayment(e.target.value as any)}
                                        className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                        <option value="all">All</option>
                                        <option value="required">Required</option>
                                        <option value="free">Free</option>
                                    </select>
                                </div>

                                {/* Program */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Program</label>
                                    <select value={filterProgram ?? ""} onChange={e => setFilterProgram(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                        <option value="">All Programs</option>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Clear filters */}
                                {(activeFilterCount > 0 || sortOption !== "newest") && (
                                    <button
                                        onClick={() => { setFilterPayment("all"); setFilterProgram(null); setSortOption("newest"); }}
                                        className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* LIST */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 text-gray-400 opacity-60">
                    <p className="text-lg font-semibold">No obligations yet. Add one to get started.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
                    <div className="overflow-x-auto">
                    <table className="eso-table w-full text-[11px] border-collapse">
                        <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="pl-3 pr-1 py-2 w-7">
                                    <input type="checkbox"
                                        checked={filtered.length > 0 && selectedObIds.size === filtered.length}
                                        onChange={toggleObSelectAll}
                                        className="w-3.5 h-3.5 accent-orange-500 cursor-pointer" />
                                </th>
                                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Name</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Payment</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Scope</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Yr/Sec</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">School Year</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Sem</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Due Date</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">GCash QR</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Created By</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Status</th>
                                <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((o, i) => (
                                <tr key={o.obligationId}
                                    style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                    className={`transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10 ${selectedObIds.has(o.obligationId) ? "bg-orange-50 dark:bg-orange-500/10" : i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-gray-50/70 dark:bg-[#222]"}`}>
                                    <td className="pl-3 pr-1 py-2 w-7" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={selectedObIds.has(o.obligationId)}
                                            onChange={() => toggleObSelect(o.obligationId)}
                                            className="w-3.5 h-3.5 accent-orange-500 cursor-pointer" />
                                    </td>
                                    <td className="px-2 py-2 font-medium text-gray-800 dark:text-gray-100">{o.obligationName}</td>
                                    <td className="px-2 py-2 text-center">
                                        {o.amount > 0
                                            ? <span className="font-semibold text-gray-800 dark:text-gray-100">₱{Number(o.amount).toFixed(2)}</span>
                                            : <span className="text-gray-400 dark:text-gray-500">—</span>}
                                    </td>
                                    <td className="px-2 py-2 text-center capitalize dark:text-gray-300">{SCOPE_LABELS[o.scope] ?? String(o.scope)}</td>
                                    <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">{o.programName ?? "—"}</td>
                                    <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                                        {o.yearLevel != null ? `${o.yearLevel}${o.section ?? ""}` : "—"}
                                    </td>
                                    <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">{o.schoolYear}</td>
                                    <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">{SEMESTER_LABELS[o.semester] ?? String(o.semester)}</td>
                                    <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">{o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "—"}</td>
                                    <td className="px-2 py-2 text-center">
                                        {o.gcashQrPath
                                            ? <a href={qrUrl(o.gcashQrPath)} target="_blank" rel="noreferrer" className="text-primary underline">View</a>
                                            : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <div className="font-medium text-gray-700 dark:text-gray-200 leading-tight">
                                            {o.createdByName ?? "—"}
                                        </div>
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${o.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                                            {o.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <div className="flex justify-center items-center gap-0.5">
                                            <button onClick={() => openEdit(o)} title="Edit" className="p-1 rounded-lg text-orange-500 hover:bg-orange-50 transition">
                                                <FiEdit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleSync(o.obligationId)}
                                                disabled={syncing === o.obligationId}
                                                title="Sync students to this obligation"
                                                className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 transition disabled:opacity-40"
                                            >
                                                <FiRefreshCw className={`w-3 h-3 ${syncing === o.obligationId ? "animate-spin" : ""}`} />
                                            </button>
                                            <button onClick={() => handleDelete(o.obligationId)} title="Delete" className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition">
                                                <FiTrash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100">{editing ? "Edit Obligation" : "Add Obligation"}</h2>
                            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold leading-none">&times;</button>
                        </div>
                        <div className="p-6">
                            {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Obligation Name *</label>
                                    <input
                                        className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                        placeholder="e.g. ESO T-Shirt Fee"
                                        value={form.obligationName}
                                        onChange={e => setForm({ ...form, obligationName: e.target.value })}
                                    />
                                </div>

                                {/* Description */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors resize-none bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
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
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Required</span>
                                    </label>
                                </div>


                                {/* Amount + QR (shown only when payment required) */}
                                {requiresPayment && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₱) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                                value={form.amount || ""}
                                                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GCash QR Code</label>
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                        value={form.dueDate ?? ""}
                                        onChange={e => setForm({ ...form, dueDate: e.target.value || null })}
                                    />
                                </div>

                                {/* School Year */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Year *</label>
                                    <SchoolYearCombobox
                                        value={form.schoolYear}
                                        onChange={v => setForm({ ...form, schoolYear: v })}
                                    />
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester *</label>
                                    <select
                                        className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                        value={form.semester}
                                        onChange={e => setForm({ ...form, semester: Number(e.target.value) })}
                                    >
                                        <option value={1}>1st</option>
                                        <option value={2}>2nd</option>
                                        <option value={3}>Summer</option>
                                    </select>
                                </div>

                                {/* Scope */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope *</label>
                                    <select
                                        className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                        value={form.scope}
                                        onChange={e => setForm({ ...form, scope: Number(e.target.value), programId: null, yearLevel: null, section: null })}
                                    >
                                        {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                                {(form.scope === 1 || form.scope === 2 || form.scope === 3) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program</label>
                                        <select
                                            className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                            value={form.programId ?? ""}
                                            onChange={e => setForm({ ...form, programId: e.target.value ? Number(e.target.value) : null })}
                                        >
                                            <option value="">All Programs</option>
                                            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Year Level */}
                                {(form.scope === 2 || form.scope === 3) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Level</label>
                                        <select
                                            className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
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
                                {(form.scope === 2 || form.scope === 3) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                                        <input
                                            className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                            placeholder="e.g. A"
                                            value={form.section ?? ""}
                                            onChange={e => setForm({ ...form, section: e.target.value || null })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between mt-6 pt-4 border-t-2 border-gray-100 dark:border-gray-700">
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default Obligations;
