import { useEffect, useState } from "react";
import type React from "react";
import { obligationService, qrUrl } from "../../../services/obligation.service";
import type { ObligationData, CreateObligationInput } from "../../../services/obligation.service";
import { useAuth } from "../../../hooks/useAuth";
import { useOnlineStatus } from "../../../hooks/useOfflineCache";
import { AuthError } from "../../../services/api";

// Cache helpers

const OB_CACHE_KEY = "eso_cache_obligations";

export function readObCache(): ObligationData[] | null {
    try {
        const raw = localStorage.getItem(OB_CACHE_KEY);
        if (!raw) return null;
        const { data, cachedAt } = JSON.parse(raw);
        if (Date.now() - cachedAt < 3600000) return data;
    } catch {}
    return null;
}

export function writeObCache(data: ObligationData[]) {
    try { localStorage.setItem(OB_CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() })); } catch {}
}

function currentSchoolYear() {
    const y = new Date().getFullYear();
    return new Date().getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function currentSemester(): number {
    const m = new Date().getMonth() + 1;
    if (m >= 8 && m <= 12) return 1;
    return 2;
}

export const BLANK_FORM: CreateObligationInput = {
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

export function useObligations() {
    const { accessToken } = useAuth();
    const online = useOnlineStatus();

    // Active list
    const [obligations, setObligations] = useState<ObligationData[]>(() => readObCache() ?? []);
    const [loading, setLoading] = useState(() => readObCache() === null);
    const [stale, setStale] = useState(() => readObCache() !== null);
    const [error, setError] = useState("");

    // Archive list
    const [archived, setArchived] = useState<ObligationData[]>([]);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveError, setArchiveError] = useState("");

    // Modal/form
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ObligationData | null>(null);
    const [form, setForm] = useState<CreateObligationInput>(BLANK_FORM);
    const [requiresPayment, setRequiresPayment] = useState(false);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    // Row-level actions
    const [syncing, setSyncing] = useState<number | null>(null);
    const [restoring, setRestoring] = useState<number | null>(null);

    // Selection
    const [selectedObIds, setSelectedObIds] = useState<Set<number>>(new Set());
    const [selectedArchiveIds, setSelectedArchiveIds] = useState<Set<number>>(new Set());

    // Dialogs
    const [alertMsg, setAlertMsg] = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

    // Selection helpers
    function toggleSelect(id: number) {
        setSelectedObIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    function toggleArchiveSelect(id: number) {
        setSelectedArchiveIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }

    // Data fetching
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

    // Modal helpers
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

    function handleQrRemove() { setQrFile(null); setQrPreview(null); }

    function handleTogglePayment() {
        setRequiresPayment(p => {
            if (p) setForm(f => ({ ...f, amount: 0 }));
            return !p;
        });
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

    function handleBulkArchive(selectedIds: Set<number>) {
        if (!accessToken || !selectedIds.size) return;
        setConfirmState({
            message: `Archive ${selectedIds.size} obligation(s)? You can restore them from the Archive tab.`,
            onConfirm: async () => {
                setConfirmState(null);
                const ids = [...selectedIds];
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

    function handleBulkRestore(selectedIds: Set<number>) {
        if (!accessToken || !selectedIds.size) return;
        setConfirmState({
            message: `Restore ${selectedIds.size} obligation(s)?`,
            onConfirm: async () => {
                setConfirmState(null);
                const ids = [...selectedIds];
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

    function handleBulkPermanentDelete(selectedIds: Set<number>) {
        if (!accessToken || !selectedIds.size) return;
        setConfirmState({
            message: `Permanently delete ${selectedIds.size} obligation(s)? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmState(null);
                const ids = [...selectedIds];
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

    return {
        // Data
        obligations,
        archived,
        loading,
        stale,
        error,
        archiveLoading,
        archiveError,
        // Modal
        showModal,
        editing,
        form,
        requiresPayment,
        qrFile,
        qrPreview,
        saving,
        formError,
        setForm,
        // Row actions
        syncing,
        restoring,
        // Selection
        selectedObIds,
        selectedArchiveIds,
        setSelectedObIds,
        setSelectedArchiveIds,
        // Dialogs
        alertMsg,
        confirmState,
        setAlertMsg,
        setConfirmState,
        // Handlers
        fetchArchived,
        toggleSelect,
        toggleArchiveSelect,
        openAdd,
        openEdit,
        cancelEdit,
        handleQrChange,
        handleQrRemove,
        handleTogglePayment,
        handleSave,
        handleArchive,
        handleBulkArchive,
        handleRestore,
        handleBulkRestore,
        handlePermanentDelete,
        handleBulkPermanentDelete,
        handleSync,
    };
}
