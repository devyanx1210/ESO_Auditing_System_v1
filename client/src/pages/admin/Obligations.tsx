import React, { useEffect, useRef, useState, useMemo } from "react";
import { FiTrash2, FiRefreshCw, FiEdit2, FiFilter, FiChevronDown, FiChevronUp, FiArchive, FiRotateCcw } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { obligationService, qrUrl } from "../../services/obligation.service";
import type { ObligationData, CreateObligationInput } from "../../services/obligation.service";
import { useOnlineStatus } from "../../hooks/useOfflineCache";
import { AuthError } from "../../services/api";
import { AlertModal } from "../../components/ui/AlertModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

const OB_CACHE_KEY = "eso_cache_obligations";
function readObCache(): ObligationData[] | null {
    try {
        const raw = localStorage.getItem(OB_CACHE_KEY);
        if (!raw) return null;
        const { data, cachedAt } = JSON.parse(raw);
        if (Date.now() - cachedAt < 3600000) return data;
    } catch {}
    return null;
}
function writeObCache(data: ObligationData[]) {
    try { localStorage.setItem(OB_CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() })); } catch {}
}

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

// ─── Shared table component ───────────────────────────────────────────────────

interface ObligationTableProps {
    rows: ObligationData[];
    selected: Set<number>;
    onToggleOne: (id: number) => void;
    onToggleAll: () => void;
    actionSlot: (o: ObligationData) => React.ReactNode;
    syncing?: number | null;
}

function ObligationTable({ rows, selected, onToggleOne, onToggleAll, actionSlot }: ObligationTableProps) {
    return (
        <div className="rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-x-auto">
            <table className="eso-table w-full text-[11px] border-collapse bg-white dark:bg-[#1a1a1a]" style={{ minWidth: 1000 }}>
                <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400">
                    <tr>
                        <th className="col-check py-2 w-8 shrink-0">
                            <input type="checkbox"
                                checked={rows.length > 0 && selected.size === rows.length}
                                onChange={onToggleAll}
                                className="w-3.5 h-3.5 accent-orange-500 cursor-pointer" />
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ minWidth: 160 }}>Name</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Payment</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Scope</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Program</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Yr/Sec</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">School Year</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Sem</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Due Date</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">GCash QR</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Created By</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((o, i) => (
                        <tr key={o.obligationId}
                            style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                            className={`transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10 ${selected.has(o.obligationId) ? "bg-orange-50 dark:bg-orange-500/10" : i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-gray-50/70 dark:bg-[#222]"}`}>
                            <td className="col-check py-2" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={selected.has(o.obligationId)}
                                    onChange={() => onToggleOne(o.obligationId)}
                                    className="w-3.5 h-3.5 accent-orange-500 cursor-pointer" />
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100 max-w-[200px] truncate" title={o.obligationName}>{o.obligationName}</td>
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
                                <div className="flex justify-center items-center gap-0.5">
                                    {actionSlot(o)}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Obligations = () => {
    const { accessToken } = useAuth();
    const online = useOnlineStatus();
    const [tab, setTab] = useState<"active" | "archived">("active");

    // Active
    const [obligations, setObligations] = useState<ObligationData[]>(() => readObCache() ?? []);
    const [loading, setLoading] = useState(() => readObCache() === null);
    const [stale,   setStale]   = useState(() => readObCache() !== null);
    const [error, setError] = useState("");

    // Archive
    const [archived, setArchived] = useState<ObligationData[]>([]);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveError, setArchiveError] = useState("");

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
    const [restoring, setRestoring] = useState<number | null>(null);
    const [selectedObIds, setSelectedObIds] = useState<Set<number>>(new Set());
    const [selectedArchiveIds, setSelectedArchiveIds] = useState<Set<number>>(new Set());
    const [alertMsg, setAlertMsg] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
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

    function toggleSelect(id: number) {
        setSelectedObIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    function toggleSelectAll() {
        if (selectedObIds.size === filtered.length) setSelectedObIds(new Set());
        else setSelectedObIds(new Set(filtered.map(o => o.obligationId)));
    }
    function toggleArchiveSelect(id: number) {
        setSelectedArchiveIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    function toggleArchiveSelectAll() {
        if (selectedArchiveIds.size === filteredArchive.length) setSelectedArchiveIds(new Set());
        else setSelectedArchiveIds(new Set(filteredArchive.map(o => o.obligationId)));
    }

    const fetchObligations = () => {
        if (!accessToken) return;
        if (!navigator.onLine) {
            const cached = readObCache();
            if (cached) { setObligations(cached); setStale(true); }
            setLoading(false);
            return;
        }
        setLoading(true);
        obligationService.getAll(accessToken)
            .then(data => { setObligations(data); writeObCache(data); setStale(false); })
            .catch(e => {
                if (e instanceof AuthError) return;
                const cached = readObCache();
                if (cached) { setObligations(cached); setStale(true); }
                else setError(e.message);
            })
            .finally(() => setLoading(false));
    };

    const fetchArchived = () => {
        if (!accessToken) return;
        setArchiveLoading(true);
        obligationService.getArchived(accessToken)
            .then(data => setArchived(data))
            .catch(e => { if (!(e instanceof AuthError)) setArchiveError(e.message); })
            .finally(() => setArchiveLoading(false));
    };

    useEffect(() => { fetchObligations(); }, [accessToken]);
    useEffect(() => { if (online) fetchObligations(); }, [online]);
    useEffect(() => { if (tab === "archived") fetchArchived(); }, [tab, accessToken]);

    function openAdd() {
        setEditing(null); setForm(BLANK_FORM); setRequiresPayment(false);
        setQrFile(null); setQrPreview(null); setFormError(""); setShowModal(true);
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
        setQrFile(null); setQrPreview(o.gcashQrPath ? qrUrl(o.gcashQrPath) : null);
        setFormError(""); setShowModal(true);
    }

    function cancelEdit() { setShowModal(false); setEditing(null); }

    function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setQrFile(file);
        if (file) setQrPreview(URL.createObjectURL(file));
    }

    async function handleSave() {
        if (!accessToken) return;
        if (!form.obligationName.trim()) { setFormError("Obligation name is required."); return; }
        if (requiresPayment && (!form.amount || form.amount <= 0)) {
            setFormError("Amount is required for paid obligations."); return;
        }
        setSaving(true); setFormError("");
        const submitForm = { ...form, amount: requiresPayment ? form.amount : 0 };
        try {
            if (editing) {
                await obligationService.update(accessToken, editing.obligationId, submitForm, qrFile);
                const updated = await obligationService.getAll(accessToken);
                setObligations(updated); writeObCache(updated);
            } else {
                const created = await obligationService.create(accessToken, submitForm, qrFile);
                setObligations(prev => { const next = [created, ...prev]; writeObCache(next); return next; });
            }
            setShowModal(false);
        } catch (e: any) {
            setFormError(e.message ?? "Failed to save.");
        } finally { setSaving(false); }
    }

    // Archive (soft delete) from active list
    function handleArchive(id: number) {
        if (!accessToken) return;
        setConfirmState({
            message: "Archive this obligation? You can restore it later from the Archive tab.",
            onConfirm: async () => {
                setConfirmState(null);
                try {
                    await obligationService.remove(accessToken, id);
                    setObligations(prev => { const next = prev.filter(o => o.obligationId !== id); writeObCache(next); return next; });
                    setShowModal(false);
                } catch (e: any) { setAlertMsg(e.message ?? "Failed to archive."); }
            },
        });
    }

    function handleBulkArchive() {
        if (!accessToken || !selectedObIds.size) return;
        setConfirmState({
            message: `Archive ${selectedObIds.size} obligation(s)? You can restore them from the Archive tab.`,
            onConfirm: async () => {
                setConfirmState(null);
                const ids = [...selectedObIds];
                for (const id of ids) {
                    try { await obligationService.remove(accessToken, id); } catch { /* skip */ }
                }
                setObligations(prev => { const next = prev.filter(o => !ids.includes(o.obligationId)); writeObCache(next); return next; });
                setSelectedObIds(new Set());
            },
        });
    }

    // Restore from archive
    async function handleRestore(id: number) {
        if (!accessToken) return;
        setRestoring(id);
        try {
            await obligationService.restore(accessToken, id);
            setArchived(prev => prev.filter(o => o.obligationId !== id));
            fetchObligations();
        } catch (e: any) { setAlertMsg(e.message ?? "Failed to restore."); }
        finally { setRestoring(null); }
    }

    function handleBulkRestore() {
        if (!accessToken || !selectedArchiveIds.size) return;
        setConfirmState({
            message: `Restore ${selectedArchiveIds.size} obligation(s)?`,
            onConfirm: async () => {
                setConfirmState(null);
                const ids = [...selectedArchiveIds];
                for (const id of ids) {
                    try { await obligationService.restore(accessToken, id); } catch { /* skip */ }
                }
                setArchived(prev => prev.filter(o => !ids.includes(o.obligationId)));
                setSelectedArchiveIds(new Set());
                fetchObligations();
            },
        });
    }

    // Permanent delete (only from archive)
    function handlePermanentDelete(id: number) {
        if (!accessToken) return;
        setConfirmState({
            message: "Permanently delete this obligation? This cannot be undone and students will be notified.",
            onConfirm: async () => {
                setConfirmState(null);
                try {
                    await obligationService.permanentDelete(accessToken, id);
                    setArchived(prev => prev.filter(o => o.obligationId !== id));
                } catch (e: any) { setAlertMsg(e.message ?? "Failed to delete."); }
            },
        });
    }

    function handleBulkPermanentDelete() {
        if (!accessToken || !selectedArchiveIds.size) return;
        setConfirmState({
            message: `Permanently delete ${selectedArchiveIds.size} obligation(s)? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmState(null);
                const ids = [...selectedArchiveIds];
                for (const id of ids) {
                    try { await obligationService.permanentDelete(accessToken, id); } catch { /* skip */ }
                }
                setArchived(prev => prev.filter(o => !ids.includes(o.obligationId)));
                setSelectedArchiveIds(new Set());
            },
        });
    }

    async function handleSync(id: number) {
        if (!accessToken) return;
        setSyncing(id);
        try {
            const res = await obligationService.sync(accessToken, id);
            setAlertMsg(res.inserted > 0
                ? `Synced! ${res.inserted} student(s) newly assigned.`
                : "All matching students already have this obligation."
            );
        } catch (e: any) { setAlertMsg(e.message ?? "Sync failed."); }
        finally { setSyncing(null); }
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

    let filteredArchive = archived.filter(o => {
        if (searchLower && !o.obligationName.toLowerCase().includes(searchLower) && !(o.createdByName ?? "").toLowerCase().includes(searchLower)) return false;
        if (filterProgram !== null && o.programId !== filterProgram) return false;
        return true;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen dark:bg-[#111111]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-10 bg-gray-50 dark:bg-[#111111] min-h-screen">
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg(null)} />}
            {confirmState && <ConfirmModal message={confirmState.message} confirmLabel="Confirm" danger onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} />}
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Obligations</h1>

            {/* TABS */}
            <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => { setTab("active"); setSelectedObIds(new Set()); }}
                    className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors ${tab === "active" ? "bg-white dark:bg-[#1a1a1a] text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    Active
                    <span className="ml-1.5 text-xs bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5">{obligations.length}</span>
                </button>
                <button
                    onClick={() => { setTab("archived"); setSelectedArchiveIds(new Set()); }}
                    className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors ${tab === "archived" ? "bg-white dark:bg-[#1a1a1a] text-amber-500 border-b-2 border-amber-500" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    Archive
                    {archived.length > 0 && <span className="ml-1.5 text-xs bg-amber-100 text-amber-600 rounded-full px-1.5 py-0.5">{archived.length}</span>}
                </button>
            </div>

            {/* TOP BAR */}
            <div className="flex flex-row flex-wrap gap-3 mb-6 items-center">
                <input
                    className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500 shadow-sm flex-1 min-w-[180px] max-w-xs"
                    placeholder={tab === "active" ? "Search obligations..." : "Search archive..."}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap items-center">

                    {/* Active tab bulk/add actions */}
                    {tab === "active" && (
                        <>
                            {selectedObIds.size > 0 && (
                                <button onClick={handleBulkArchive}
                                    className="relative px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition">
                                    Archive
                                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-amber-600 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-amber-200">
                                        {selectedObIds.size}
                                    </span>
                                </button>
                            )}
                            <button onClick={openAdd} className="bg-primary text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition flex items-center gap-1.5">
                                <span className="text-base leading-none">+</span>
                                <span className="hidden sm:inline">Add Obligation</span>
                            </button>
                        </>
                    )}

                    {/* Archive tab bulk actions */}
                    {tab === "archived" && selectedArchiveIds.size > 0 && (
                        <>
                            <button onClick={handleBulkRestore}
                                className="relative px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition">
                                Restore
                                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-green-600 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-green-200">
                                    {selectedArchiveIds.size}
                                </span>
                            </button>
                            <button onClick={handleBulkPermanentDelete}
                                className="relative px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">
                                Delete
                                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-red-200">
                                    {selectedArchiveIds.size}
                                </span>
                            </button>
                        </>
                    )}

                    {/* Filter (shared) */}
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
                                {tab === "active" && (
                                    <>
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
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Payment</label>
                                            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value as any)}
                                                className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                                <option value="all">All</option>
                                                <option value="required">Required</option>
                                                <option value="free">Free</option>
                                            </select>
                                        </div>
                                    </>
                                )}
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
            {stale && <p className="text-amber-500 text-xs mb-2">Showing cached data. Reconnect to refresh.</p>}

            {/* ACTIVE TAB */}
            {tab === "active" && (
                filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-400 opacity-60">
                        <p className="text-lg font-semibold">No obligations yet. Add one to get started.</p>
                    </div>
                ) : (
                    <ObligationTable
                        rows={filtered}
                        selected={selectedObIds}
                        onToggleOne={toggleSelect}
                        onToggleAll={toggleSelectAll}
                        actionSlot={(o) => (
                            <>
                                <button onClick={() => openEdit(o)} title="Edit" className="p-1 rounded-lg text-orange-500 hover:bg-orange-50 transition">
                                    <FiEdit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => handleSync(o.obligationId)}
                                    disabled={syncing === o.obligationId}
                                    title="Sync students"
                                    className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 transition disabled:opacity-40"
                                >
                                    <FiRefreshCw className={`w-3 h-3 ${syncing === o.obligationId ? "animate-spin" : ""}`} />
                                </button>
                                <button onClick={() => handleArchive(o.obligationId)} title="Archive" className="p-1 rounded-lg text-amber-500 hover:bg-amber-50 transition">
                                    <FiArchive className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    />
                )
            )}

            {/* ARCHIVE TAB */}
            {tab === "archived" && (
                archiveLoading ? (
                    <div className="flex items-center justify-center mt-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-amber-500" />
                    </div>
                ) : archiveError ? (
                    <p className="text-red-500">{archiveError}</p>
                ) : filteredArchive.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-400 opacity-60">
                        <FiArchive className="w-10 h-10 mb-3" />
                        <p className="text-lg font-semibold">No archived obligations.</p>
                    </div>
                ) : (
                    <ObligationTable
                        rows={filteredArchive}
                        selected={selectedArchiveIds}
                        onToggleOne={toggleArchiveSelect}
                        onToggleAll={toggleArchiveSelectAll}
                        actionSlot={(o) => (
                            <>
                                <button
                                    onClick={() => handleRestore(o.obligationId)}
                                    disabled={restoring === o.obligationId}
                                    title="Restore"
                                    className="p-1 rounded-lg text-green-500 hover:bg-green-50 transition disabled:opacity-40"
                                >
                                    <FiRotateCcw className={`w-3 h-3 ${restoring === o.obligationId ? "animate-spin" : ""}`} />
                                </button>
                                <button onClick={() => handlePermanentDelete(o.obligationId)} title="Permanently delete" className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition">
                                    <FiTrash2 className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    />
                )
            )}

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
                    onClick={cancelEdit}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[88vh] sm:max-h-[90vh] overflow-y-auto" style={{ animation: 'fadeInUp 0.2s ease both' }}
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-bold text-base sm:text-xl text-gray-800 dark:text-gray-100">{editing ? "Edit Obligation" : "Add Obligation"}</h2>
                            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold leading-none">&times;</button>
                        </div>

                        <div className="px-4 sm:px-6 py-3 sm:py-5">
                            {formError && <p className="text-red-500 text-xs sm:text-sm mb-3">{formError}</p>}

                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4">

                                <div className="col-span-2">
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Obligation Name *</label>
                                    <input
                                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                        placeholder="e.g. ESO T-Shirt Fee"
                                        value={form.obligationName}
                                        onChange={e => setForm({ ...form, obligationName: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</label>
                                    <textarea
                                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors resize-none bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                        rows={3}
                                        placeholder="Optional details..."
                                        value={form.description ?? ""}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <div
                                            onClick={() => { setRequiresPayment(p => !p); if (requiresPayment) setForm(f => ({ ...f, amount: 0 })); }}
                                            className={`relative w-9 h-5 sm:w-11 sm:h-6 rounded-full transition-colors ${requiresPayment ? "bg-primary" : "bg-gray-300"}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${requiresPayment ? "translate-x-4 sm:translate-x-5" : "translate-x-0"}`} />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Payment Required</span>
                                    </label>
                                </div>

                                {requiresPayment && (
                                    <>
                                        <div>
                                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Amount (₱) *</label>
                                            <input
                                                type="number" step="0.01" min="0.01"
                                                className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                                value={form.amount || ""}
                                                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">GCash QR Code</label>
                                            <button
                                                type="button"
                                                onClick={() => qrInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors text-left"
                                            >
                                                {qrFile ? qrFile.name : "Upload QR image"}
                                            </button>
                                            <input ref={qrInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleQrChange} />
                                            {qrPreview && (
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <img src={qrPreview} alt="QR Preview" className="w-14 h-14 sm:w-20 sm:h-20 object-contain border-2 border-gray-200 rounded" />
                                                    <button type="button"
                                                        onClick={() => { setQrFile(null); setQrPreview(null); if (qrInputRef.current) qrInputRef.current.value = ""; }}
                                                        className="text-xs text-red-500 hover:underline">Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100"
                                        value={form.dueDate ?? ""}
                                        onChange={e => setForm({ ...form, dueDate: e.target.value || null })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">School Year *</label>
                                    <SchoolYearCombobox value={form.schoolYear} onChange={v => setForm({ ...form, schoolYear: v })} />
                                </div>

                                <div>
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Semester *</label>
                                    <select
                                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                        value={form.semester}
                                        onChange={e => setForm({ ...form, semester: Number(e.target.value) })}
                                    >
                                        <option value={1}>1st</option>
                                        <option value={2}>2nd</option>
                                        <option value={3}>Summer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Scope *</label>
                                    <select
                                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                        value={form.scope}
                                        onChange={e => setForm({ ...form, scope: Number(e.target.value), programId: null, yearLevel: null, section: null })}
                                    >
                                        {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2 flex items-center gap-2.5">
                                    <input
                                        type="checkbox" id="isRequired"
                                        checked={form.isRequired}
                                        onChange={e => setForm({ ...form, isRequired: e.target.checked })}
                                        className="w-4 h-4 accent-orange-500 shrink-0"
                                    />
                                    <label htmlFor="isRequired" className={`text-xs sm:text-sm font-semibold ${form.isRequired ? "text-orange-600" : "text-gray-500"}`}>
                                        Required obligation
                                    </label>
                                    {form.isRequired && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-300">Required</span>
                                    )}
                                </div>

                                {(form.scope === 1 || form.scope === 2 || form.scope === 3) && (
                                    <div>
                                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Program</label>
                                        <select
                                            className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                            value={form.programId ?? ""}
                                            onChange={e => setForm({ ...form, programId: e.target.value ? Number(e.target.value) : null })}
                                        >
                                            <option value="">All Programs</option>
                                            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {(form.scope === 2 || form.scope === 3) && (
                                    <div>
                                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Year Level</label>
                                        <select
                                            className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
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

                                {(form.scope === 2 || form.scope === 3) && (
                                    <div>
                                        <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Section</label>
                                        <input
                                            className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                            placeholder="e.g. A"
                                            value={form.section ?? ""}
                                            onChange={e => setForm({ ...form, section: e.target.value || null })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg disabled:opacity-60 font-semibold text-xs sm:text-sm"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                                {editing && (
                                    <button
                                        onClick={() => handleArchive(editing.obligationId)}
                                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition font-medium text-xs sm:text-sm border border-amber-200"
                                    >
                                        <FiArchive className="w-3.5 h-3.5" /> Archive
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
