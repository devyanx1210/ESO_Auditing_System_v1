import { useEffect, useRef, useState } from "react";
import { FiTrash2, FiRefreshCw, FiEdit2, FiArchive, FiRotateCcw } from "react-icons/fi";
import { AlertModal } from "../../components/ui/AlertModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ObligationTable } from "./obligations/ObligationTable";
import { ObligationFormModal } from "./obligations/ObligationFormModal";
import { ObligationFilterPanel } from "./obligations/ObligationFilterPanel";
import { useObligations } from "./obligations/useObligations";

const Obligations = () => {
    const ob = useObligations();
    const [tab, setTab] = useState<"active" | "archived">("active");
    const [search, setSearch] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [filterPayment, setFilterPayment] = useState<"all" | "required" | "free">("all");
    const [filterProgram, setFilterProgram] = useState<number | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Close filter panel on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node))
                setShowFilter(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fetch archive when switching to archive tab
    useEffect(() => {
        if (tab === "archived") ob.fetchArchived();
    }, [tab]);

    // Selection helpers that need filtered list lengths
    function toggleSelectAll() {
        if (ob.selectedObIds.size === filtered.length) ob.setSelectedObIds(new Set());
        else ob.setSelectedObIds(new Set(filtered.map(o => o.obligationId)));
    }
    function toggleArchiveSelectAll() {
        if (ob.selectedArchiveIds.size === filteredArchive.length) ob.setSelectedArchiveIds(new Set());
        else ob.setSelectedArchiveIds(new Set(filteredArchive.map(o => o.obligationId)));
    }

    // Derived filtered + sorted lists
    const searchLower = search.toLowerCase();
    let filtered = ob.obligations.filter(o => {
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

    let filteredArchive = ob.archived.filter(o => {
        if (searchLower && !o.obligationName.toLowerCase().includes(searchLower) && !(o.createdByName ?? "").toLowerCase().includes(searchLower)) return false;
        if (filterProgram !== null && o.programId !== filterProgram) return false;
        return true;
    });

    if (ob.loading) return (
        <div className="flex items-center justify-center min-h-screen dark:bg-[#111111]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-10 bg-gray-50 dark:bg-[#111111] min-h-screen">
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {ob.alertMsg && <AlertModal message={ob.alertMsg} onClose={() => ob.setAlertMsg(null)} />}
            {ob.confirmState && <ConfirmModal message={ob.confirmState.message} confirmLabel="Confirm" danger onConfirm={ob.confirmState.onConfirm} onCancel={() => ob.setConfirmState(null)} />}

            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Obligations</h1>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => { setTab("active"); ob.setSelectedObIds(new Set()); }}
                    className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors ${tab === "active" ? "bg-white dark:bg-[#1a1a1a] text-orange-500 border-b-2 border-orange-500" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    Active
                    <span className="ml-1.5 text-xs bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5">{ob.obligations.length}</span>
                </button>
                <button
                    onClick={() => { setTab("archived"); ob.setSelectedArchiveIds(new Set()); }}
                    className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors ${tab === "archived" ? "bg-white dark:bg-[#1a1a1a] text-amber-500 border-b-2 border-amber-500" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                    Archive
                    {ob.archived.length > 0 && <span className="ml-1.5 text-xs bg-amber-100 text-amber-600 rounded-full px-1.5 py-0.5">{ob.archived.length}</span>}
                </button>
            </div>

            <ObligationFilterPanel
                tab={tab}
                search={search}
                sortOption={sortOption}
                filterPayment={filterPayment}
                filterProgram={filterProgram}
                showFilter={showFilter}
                filterRef={filterRef}
                selectedObCount={ob.selectedObIds.size}
                selectedArchiveCount={ob.selectedArchiveIds.size}
                onSearchChange={setSearch}
                onSortChange={setSortOption}
                onFilterPaymentChange={setFilterPayment}
                onFilterProgramChange={setFilterProgram}
                onToggleFilter={() => setShowFilter(f => !f)}
                onClearFilters={() => { setFilterPayment("all"); setFilterProgram(null); setSortOption("newest"); }}
                onBulkArchive={() => ob.handleBulkArchive(ob.selectedObIds)}
                onBulkRestore={() => ob.handleBulkRestore(ob.selectedArchiveIds)}
                onBulkDelete={() => ob.handleBulkPermanentDelete(ob.selectedArchiveIds)}
                onOpenAdd={ob.openAdd}
            />

            {ob.error && <p className="text-red-500 mb-4">{ob.error}</p>}
            {ob.stale && <p className="text-amber-500 text-xs mb-2">Showing cached data. Reconnect to refresh.</p>}

            {/* Active tab content */}
            {tab === "active" && (
                filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-400 opacity-60">
                        <p className="text-lg font-semibold">No obligations yet. Add one to get started.</p>
                    </div>
                ) : (
                    <ObligationTable
                        rows={filtered}
                        selected={ob.selectedObIds}
                        onToggleOne={ob.toggleSelect}
                        onToggleAll={toggleSelectAll}
                        actionSlot={(o) => (
                            <>
                                <button onClick={() => ob.openEdit(o)} title="Edit" className="p-1 rounded-lg text-orange-500 hover:bg-orange-50 transition">
                                    <FiEdit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => ob.handleSync(o.obligationId)}
                                    disabled={ob.syncing === o.obligationId}
                                    title="Sync students"
                                    className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 transition disabled:opacity-40"
                                >
                                    <FiRefreshCw className={`w-3 h-3 ${ob.syncing === o.obligationId ? "animate-spin" : ""}`} />
                                </button>
                                <button onClick={() => ob.handleArchive(o.obligationId)} title="Archive" className="p-1 rounded-lg text-amber-500 hover:bg-amber-50 transition">
                                    <FiArchive className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    />
                )
            )}

            {/* Archive tab content */}
            {tab === "archived" && (
                ob.archiveLoading ? (
                    <div className="flex items-center justify-center mt-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-amber-500" />
                    </div>
                ) : ob.archiveError ? (
                    <p className="text-red-500">{ob.archiveError}</p>
                ) : filteredArchive.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-400 opacity-60">
                        <FiArchive className="w-10 h-10 mb-3" />
                        <p className="text-lg font-semibold">No archived obligations.</p>
                    </div>
                ) : (
                    <ObligationTable
                        rows={filteredArchive}
                        selected={ob.selectedArchiveIds}
                        onToggleOne={ob.toggleArchiveSelect}
                        onToggleAll={toggleArchiveSelectAll}
                        actionSlot={(o) => (
                            <>
                                <button
                                    onClick={() => ob.handleRestore(o.obligationId)}
                                    disabled={ob.restoring === o.obligationId}
                                    title="Restore"
                                    className="p-1 rounded-lg text-green-500 hover:bg-green-50 transition disabled:opacity-40"
                                >
                                    <FiRotateCcw className={`w-3 h-3 ${ob.restoring === o.obligationId ? "animate-spin" : ""}`} />
                                </button>
                                <button onClick={() => ob.handlePermanentDelete(o.obligationId)} title="Permanently delete" className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition">
                                    <FiTrash2 className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    />
                )
            )}

            {/* Add/edit modal */}
            {ob.showModal && (
                <ObligationFormModal
                    editing={ob.editing}
                    form={ob.form}
                    requiresPayment={ob.requiresPayment}
                    qrFile={ob.qrFile}
                    qrPreview={ob.qrPreview}
                    saving={ob.saving}
                    formError={ob.formError}
                    onChangeForm={ob.setForm}
                    onTogglePayment={ob.handleTogglePayment}
                    onQrChange={ob.handleQrChange}
                    onQrRemove={ob.handleQrRemove}
                    onSave={ob.handleSave}
                    onArchive={ob.handleArchive}
                    onClose={ob.cancelEdit}
                />
            )}
        </div>
    );
};

export default Obligations;
