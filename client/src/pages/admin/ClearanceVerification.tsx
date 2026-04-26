import { useEffect, useState, useCallback } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

import { adminStudentService } from "../../services/admin-student.service";
import type { PendingClearanceItem, ClearanceHistoryItem } from "../../services/admin-student.service";
import { documentService, printDocuments } from "../../services/document.service";
import type { DocumentTemplate } from "../../services/document.service";
import { AlertModal } from "../../components/ui/AlertModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

import { ClearanceFilterBar } from "./clearance/ClearanceFilterBar";
import { PendingClearanceTable, ClearanceHistoryTable } from "./clearance/StudentClearanceCard";
import { SignClearanceModal, PrintClearanceModal } from "./clearance/ClearanceApprovalModal";
import { printReport, exportCSV, programLabel, PrintDropdown, SubTabs, HistoryBulkBar } from "./clearance/clearanceUtils";

// Roles that can access this page

const CLEARANCE_ROLES = ["class_officer", "program_officer", "eso_officer", "program_head", "signatory", "dean", "system_admin"];

type ClrSortKey = "name" | "year";

const ClearanceVerification = () => {
    const { accessToken, user } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();

    // Data
    const [clearance,    setClearance]    = useState<PendingClearanceItem[]>([]);
    const [clrHistory,   setClrHistory]   = useState<ClearanceHistoryItem[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState("");

    // UI
    const [clrSubTab,    setClrSubTab]    = useState<"review" | "history">("review");
    const [signTarget,   setSignTarget]   = useState<PendingClearanceItem | null>(null);
    const [signingAll,   setSigningAll]   = useState(false);
    const [signAllMsg,   setSignAllMsg]   = useState("");
    const [alertMsg,     setAlertMsg]     = useState<string | null>(null);
    const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

    // Selection
    const [selectedClearanceIds, setSelectedClearanceIds] = useState<Set<number>>(new Set());
    const [selectedHistoryIds,   setSelectedHistoryIds]   = useState<Set<number>>(new Set());

    // Bulk history actions
    const [bulkUnapproving, setBulkUnapproving] = useState(false);
    const [bulkDeletingClr, setBulkDeletingClr] = useState(false);
    const [markingPrinted,  setMarkingPrinted]  = useState(false);
    const [historyBulkMsg,  setHistoryBulkMsg]  = useState("");

    // Filters
    const [search,        setSearch]        = useState((location.state as any)?.search ?? "");
    const [sortKey]                         = useState<ClrSortKey>("name");
    const [programFilter, setProgramFilter] = useState((location.state as any)?.programFilter ?? "all");
    const [statusFilter,  setStatusFilter]  = useState("all");

    // Print modal
    const [showPrintModal,  setShowPrintModal]  = useState(false);
    const [printTemplates,  setPrintTemplates]  = useState<DocumentTemplate[]>([]);
    const [printTplId,      setPrintTplId]      = useState<number | null>(null);
    const [printSchoolYear, setPrintSchoolYear] = useState("");
    const [printSemester,   setPrintSemester]   = useState("");
    const [printing,        setPrinting]        = useState(false);

    const hasClearanceRole = CLEARANCE_ROLES.includes(user?.role ?? "");
    const canSignClearance = user?.role !== "system_admin";

    // Filter pipeline
    function applySearch<T extends { firstName: string; lastName: string; studentNo: string }>(items: T[]) {
        return search ? items.filter(i =>
            `${i.firstName} ${i.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
            i.studentNo.includes(search)
        ) : items;
    }
    function applyProgram<T extends { programCode: string }>(items: T[]) {
        return programFilter !== "all" ? items.filter(i => i.programCode === programFilter) : items;
    }
    function applyStatus<T extends { clearanceStatus: number | string | null }>(items: T[]) {
        if (statusFilter === "all") return items;
        return items.filter(i => {
            const s = i.clearanceStatus ?? 0;
            if (statusFilter === "processing") return s === 0 || s === 1;
            if (statusFilter === "approved")   return s === 2;
            if (statusFilter === "rejected")   return s === 3;
            return true;
        });
    }
    function applySort(items: typeof clearance) {
        if (sortKey === "year") return [...items].sort((a, b) => a.yearLevel - b.yearLevel);
        return [...items].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }
    function applySortH(items: typeof clrHistory) {
        if (sortKey === "year") return [...items].sort((a, b) => a.yearLevel - b.yearLevel);
        return [...items].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }

    const filteredPending = applySort(applyStatus(applyProgram(applySearch(clearance))));
    const filteredHistory = applySortH(applyStatus(applyProgram(applySearch(clrHistory))));
    const activeResultCount = clrSubTab === "review" ? filteredPending.length : filteredHistory.length;
    const allHistSelected = filteredHistory.length > 0 && filteredHistory.every(h => selectedHistoryIds.has(h.clearanceId));

    function buildFilterDesc() {
        const parts: string[] = [];
        if (programFilter !== "all") parts.push(`Program: ${programLabel(programFilter)}`);
        if (statusFilter  !== "all") parts.push(`Status: ${statusFilter.replace(/_/g, " ")}`);
        if (search)                  parts.push(`Search: "${search}"`);
        return parts.join("  ·  ");
    }

    // Selection handlers
    function toggleClearanceSelect(id: number) {
        setSelectedClearanceIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    function toggleClearanceSelectAll() {
        setSelectedClearanceIds(selectedClearanceIds.size === clearance.length ? new Set() : new Set(clearance.map(c => c.studentId)));
    }
    function toggleHistorySelect(id: number) {
        setSelectedHistoryIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    function toggleHistorySelectAll() {
        setSelectedHistoryIds(selectedHistoryIds.size === filteredHistory.length ? new Set() : new Set(filteredHistory.map(h => h.clearanceId)));
    }

    // Data load
    const load = useCallback(() => {
        if (!accessToken || !hasClearanceRole) return;
        setLoading(true); setError("");
        Promise.all([
            adminStudentService.getPendingClearance(accessToken),
            adminStudentService.getClearanceHistory(accessToken),
        ])
            .then(([c, ch]) => { setClearance(c); setClrHistory(ch); })
            .catch(e => setError(e.message ?? "Failed to load clearance data"))
            .finally(() => setLoading(false));
    }, [accessToken, hasClearanceRole]);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 20 seconds
    useEffect(() => { const id = setInterval(load, 20_000); return () => clearInterval(id); }, [load]);

    // Bulk history actions
    async function handleUnapproveHistory() {
        if (!accessToken || !selectedHistoryIds.size) return;
        setBulkUnapproving(true); setHistoryBulkMsg("");
        try {
            const ids = [...selectedHistoryIds];
            await adminStudentService.unapproveHistory(accessToken, ids);
            setHistoryBulkMsg(`${ids.length} clearance(s) returned to pending.`);
            setSelectedHistoryIds(new Set()); load();
        } catch (e: any) { setHistoryBulkMsg(e.message); }
        finally { setBulkUnapproving(false); }
    }
    async function handleMarkPrinted() {
        if (!accessToken || !selectedHistoryIds.size) return;
        setMarkingPrinted(true); setHistoryBulkMsg("");
        try {
            const ids = [...selectedHistoryIds];
            await adminStudentService.markClearancePrinted(accessToken, ids);
            setHistoryBulkMsg(`${ids.length} clearance(s) marked as printed.`);
            setSelectedHistoryIds(new Set()); load();
        } catch (e: any) { setHistoryBulkMsg(e.message); }
        finally { setMarkingPrinted(false); }
    }
    function handleDeleteClearanceHistory() {
        if (!accessToken || !selectedHistoryIds.size) return;
        setConfirmState({
            message: `Delete ${selectedHistoryIds.size} clearance record(s)? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmState(null); setBulkDeletingClr(true); setHistoryBulkMsg("");
                try {
                    const ids = [...selectedHistoryIds];
                    await adminStudentService.deleteClearanceHistory(accessToken, ids);
                    setHistoryBulkMsg(`${ids.length} record(s) deleted.`);
                    setSelectedHistoryIds(new Set()); load();
                } catch (e: any) { setHistoryBulkMsg(e.message); }
                finally { setBulkDeletingClr(false); }
            },
        });
    }
    async function handleSignAll() {
        if (!accessToken) return;
        setSigningAll(true); setSignAllMsg("");
        try {
            const res = await adminStudentService.signAllClearance(accessToken);
            setSignAllMsg(`${res.count} clearance(s) approved.`); load();
        } catch (e: any) { setSignAllMsg(e.message); }
        finally { setSigningAll(false); }
    }

    // Print modal — load templates on open
    async function openPrintModal() {
        if (!accessToken) return;
        try {
            const list = await documentService.getTemplates(accessToken);
            setPrintTemplates(list);
            const def = list.find(t => t.isDefault) ?? list[0];
            setPrintTplId(def?.templateId ?? null);
        } catch { /* ignore */ }
        setShowPrintModal(true);
    }

    // Execute print: PDF blob or HTML fill
    async function handlePrint() {
        if (!accessToken || !printTplId) return;
        setPrinting(true);
        try {
            const tpl = await documentService.getTemplate(accessToken, printTplId);
            setShowPrintModal(false);
            if (tpl.pdfPath) {
                const url = documentService.printMergeUrl(printTplId, printSchoolYear || undefined, printSemester || undefined);
                const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
                if (!resp.ok) { const j = await resp.json().catch(() => ({})); throw new Error((j as any).message ?? "Print failed"); }
                const blob = await resp.blob();
                const objUrl = URL.createObjectURL(blob);
                const win = window.open(objUrl, "_blank");
                setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
                if (!win) setAlertMsg("Please allow pop-ups to view the print preview.");
            } else {
                const students = await documentService.getApprovedStudents(accessToken, printSchoolYear || undefined, printSemester || undefined);
                printDocuments(tpl.content, students);
            }
        } catch (e: any) { setAlertMsg(e.message); }
        finally { setPrinting(false); }
    }

    const bg = darkMode ? "bg-[#111111] text-gray-100" : "bg-gray-50 text-gray-900";

    if (!hasClearanceRole) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${bg}`}>
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-500">Access Denied</p>
                    <p className="text-sm text-gray-400 mt-1">You do not have permission to view clearance approvals.</p>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${bg}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${bg}`}>
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg(null)} darkMode={darkMode} />}
            {confirmState && (
                <ConfirmModal message={confirmState.message} confirmLabel="Delete" danger
                    onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} darkMode={darkMode} />
            )}

            {/* Page header */}
            <div className="mb-5 flex items-start justify-between gap-4">
                <h1 className={`text-lg sm:text-2xl lg:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    Clearance Approval
                </h1>
                <button onClick={load} disabled={loading} title="Refresh"
                    className={`p-2 border-2 rounded-xl transition shadow-sm disabled:opacity-50 ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && (
                <div className="bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-red-500 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            )}

            {/* Search + filter bar */}
            <ClearanceFilterBar
                search={search} onSearchChange={setSearch}
                programFilter={programFilter} onProgramFilterChange={setProgramFilter}
                statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
                activeResultCount={activeResultCount}
                darkMode={darkMode}
            />

            {/* Sub-tabs and pending tab actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pt-1">
                <SubTabs active={clrSubTab} onChange={setClrSubTab}
                    reviewCount={filteredPending.length} historyCount={filteredHistory.length}
                    reviewLabel="Pending" historyLabel="History" />

                {clrSubTab === "review" && (
                    <div className="flex items-center gap-3 flex-wrap pt-1 pb-1 pr-2">
                        {signAllMsg && <p className="text-sm text-green-600">{signAllMsg}</p>}
                        <PrintDropdown darkMode={darkMode}
                            onPrint={() => printReport(filteredPending, "pending", buildFilterDesc(), setAlertMsg)}
                            onExport={() => exportCSV(filteredPending, "pending")} />
                        {clearance.length > 0 && canSignClearance && (
                            <button onClick={handleSignAll} disabled={signingAll}
                                className="relative px-4 py-2 text-sm bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                                {signingAll ? "Approving..." : "Approve All"}
                                {!signingAll && (
                                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-orange-600 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-orange-200">
                                        {clearance.length}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pending tab */}
            {clrSubTab === "review" && (
                <PendingClearanceTable
                    items={filteredPending}
                    selectedIds={selectedClearanceIds}
                    allSelected={clearance.length > 0 && selectedClearanceIds.size === clearance.length}
                    onToggleAll={toggleClearanceSelectAll}
                    onToggleOne={toggleClearanceSelect}
                    canSign={canSignClearance}
                    darkMode={darkMode}
                    onApprove={setSignTarget}
                />
            )}

            {/* History tab */}
            {clrSubTab === "history" && filteredHistory.length > 0 && (
                <>
                    <HistoryBulkBar
                        count={filteredHistory.length}
                        selectedCount={selectedHistoryIds.size}
                        bulkMsg={historyBulkMsg}
                        darkMode={darkMode}
                        markingPrinted={markingPrinted}
                        bulkUnapproving={bulkUnapproving}
                        bulkDeletingClr={bulkDeletingClr}
                        onPrint={() => printReport(filteredHistory, "history", buildFilterDesc(), setAlertMsg)}
                        onExport={() => exportCSV(filteredHistory, "history")}
                        onOpenPrintModal={openPrintModal}
                        onMarkPrinted={handleMarkPrinted}
                        onUnapprove={handleUnapproveHistory}
                        onDelete={handleDeleteClearanceHistory}
                    />
                    <ClearanceHistoryTable
                        items={filteredHistory}
                        selectedIds={selectedHistoryIds}
                        allSelected={allHistSelected}
                        onToggleAll={toggleHistorySelectAll}
                        onToggleOne={toggleHistorySelect}
                        darkMode={darkMode}
                    />
                </>
            )}

            {/* History empty state */}
            {clrSubTab === "history" && filteredHistory.length === 0 && (
                <div className={`rounded-xl p-10 text-center text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a] text-gray-400" : "bg-white text-gray-400"}`}>
                    No approvals yet.
                </div>
            )}

            {/* Sign / approve modal */}
            {signTarget && (
                <SignClearanceModal student={signTarget} token={accessToken!}
                    onClose={() => setSignTarget(null)}
                    onDone={() => { setSignTarget(null); load(); }} />
            )}

            {/* Print all approved modal */}
            {showPrintModal && (
                <PrintClearanceModal
                    templates={printTemplates} templateId={printTplId}
                    onTemplateChange={setPrintTplId}
                    schoolYear={printSchoolYear} onSchoolYearChange={setPrintSchoolYear}
                    semester={printSemester} onSemesterChange={setPrintSemester}
                    printing={printing} onPrint={handlePrint}
                    onClose={() => setShowPrintModal(false)}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
};

export default ClearanceVerification;
