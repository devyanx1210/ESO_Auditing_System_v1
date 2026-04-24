import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiRefreshCw, FiCheckSquare, FiClock, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiPrinter, FiDownload, FiFileText, FiX } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

import { adminStudentService } from "../../services/admin-student.service";
import type { PendingClearanceItem, ClearanceHistoryItem } from "../../services/admin-student.service";
import { documentService, printDocuments } from "../../services/document.service";
import type { DocumentTemplate } from "../../services/document.service";
import { AlertModal } from "../../components/ui/AlertModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

// ─── Program lookup ───────────────────────────────────────────────────────────

const PROGRAM_NAMES: Record<string, string> = {
    CpE: "Computer Engineering",
    CE:  "Civil Engineering",
    ECE: "Electronics Engineering",
    EE:  "Electrical Engineering",
    ME:  "Mechanical Engineering",
};
function programLabel(code: string) {
    return PROGRAM_NAMES[code] ?? code;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(s: number | null) {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing"; // 0 and 1 both = Processing
}

function historyStatusLabel(s: number | null) {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing"; // 0 and 1 both = Processing
}

// ─── Print report (opens a new window, long bond paper) ───────────────────────

function printReport(
    data: (PendingClearanceItem | ClearanceHistoryItem)[],
    type: "pending" | "history",
    filterDesc: string,
    onAlert?: (msg: string) => void
) {
    const win = window.open("", "_blank");
    if (!win) { onAlert?.("Please allow pop-ups to print."); return; }

    const now = new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const title = type === "pending" ? "Pending Clearance Report" : "Clearance History Report";

    let thHtml: string;
    let tbodyHtml: string;

    if (type === "pending") {
        thHtml = ["#", "Student Name", "Student No.", "Program", "Yr / Sec", "School Year", "Sem", "Obligations", "Status"]
            .map(h => `<th>${h}</th>`).join("");
        tbodyHtml = (data as PendingClearanceItem[]).map((p, i) => `
            <tr class="${i % 2 !== 0 ? "alt" : ""}">
                <td class="c">${i + 1}</td>
                <td><b>${p.lastName}, ${p.firstName}</b></td>
                <td class="c mono">${p.studentNo}</td>
                <td>${p.programName || programLabel(p.programCode)}</td>
                <td class="c">${p.yearLevel}–${p.section}</td>
                <td class="c">${p.schoolYear}</td>
                <td class="c">${p.semester}</td>
                <td class="c">${p.obligationsPaid}&nbsp;/&nbsp;${p.obligationsTotal}</td>
                <td class="c"><span class="badge s-${p.clearanceStatus === 2 ? "approved" : p.clearanceStatus === 3 ? "rejected" : "processing"}">${statusLabel(p.clearanceStatus)}</span></td>
            </tr>`).join("");
    } else {
        thHtml = ["#", "Student Name", "Student No.", "Program", "Yr / Sec", "School Year", "Sem", "Status", "Approved On", "Remarks"]
            .map(h => `<th>${h}</th>`).join("");
        tbodyHtml = (data as ClearanceHistoryItem[]).map((h, i) => `
            <tr class="${i % 2 !== 0 ? "alt" : ""}">
                <td class="c">${i + 1}</td>
                <td><b>${h.lastName}, ${h.firstName}</b></td>
                <td class="c mono">${h.studentNo}</td>
                <td>${programLabel(h.programCode)}</td>
                <td class="c">${h.yearLevel}–${h.section}</td>
                <td class="c">${h.schoolYear}</td>
                <td class="c">${h.semester}</td>
                <td class="c"><span class="badge s-${h.clearanceStatus === 2 ? "approved" : h.clearanceStatus === 3 ? "rejected" : "processing"}">${historyStatusLabel(h.clearanceStatus)}</span></td>
                <td class="c">${fmtDate(h.signedAt)}</td>
                <td>${(h.remarks ?? "—").replace(/</g, "&lt;")}</td>
            </tr>`).join("");
    }

    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>${title}</title>
<style>
@page{size:8.5in 13in portrait;margin:1.5cm 2cm}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:8.5pt;color:#111;background:#fff}
.no-print{position:fixed;top:0;left:0;right:0;background:#111827;color:#fff;
  padding:10px 20px;display:flex;align-items:center;gap:12px;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.no-print .btn{padding:7px 20px;background:#f97316;color:#fff;border:none;border-radius:6px;
  cursor:pointer;font-size:12px;font-weight:700}.no-print .btn:hover{background:#ea580c}
.no-print .info{font-size:12px;opacity:.7}
@media print{.no-print{display:none}}
@media screen{body{padding-top:52px;padding-left:2cm;padding-right:2cm}}
.hdr{margin-bottom:10pt}
.hdr .sys{font-size:7pt;text-transform:uppercase;letter-spacing:.5px;color:#555;margin-bottom:2pt}
.hdr h1{font-size:13pt;font-weight:700;margin-bottom:2pt}
.hdr .meta{font-size:7.5pt;color:#444}
.hdr .flt{font-size:7.5pt;color:#666;margin-top:1pt}
.cnt{font-size:7.5pt;color:#555;margin-bottom:7pt}
table{width:100%;border-collapse:collapse}
thead tr{background:#f3f4f6}
th{padding:3.5pt 5pt;text-align:left;font-size:7pt;font-weight:700;text-transform:uppercase;
  letter-spacing:.4px;border-top:1.5pt solid #aaa;border-bottom:1pt solid #aaa}
td{padding:3pt 5pt;font-size:8.5pt;border-bottom:.5pt solid #e5e5e5;vertical-align:middle}
tr.alt td{background:#f9fafb}
.c{text-align:center}
.mono{font-family:"Courier New",monospace;font-size:8pt}
.badge{display:inline-block;padding:1pt 5pt;border-radius:10pt;font-size:7pt;font-weight:700}
.s-cleared,.s-approved{background:#dcfce7;color:#15803d}
.s-pending{background:#f3f4f6;color:#6b7280}
.s-in_progress{background:#fff7ed;color:#c2410c}
.s-signed{background:#dbeafe;color:#1d4ed8}
.s-rejected{background:#fee2e2;color:#dc2626}
.foot{margin-top:14pt;font-size:7pt;color:#999;display:flex;justify-content:space-between}
</style></head>
<body>
<div class="no-print">
  <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  <span class="info">${data.length} record(s) · Long Bond Paper (8.5 × 13 in)</span>
</div>
<div class="hdr">
  <div class="sys">ESO Clearance Management System</div>
  <h1>${title}</h1>
  <div class="meta">Generated: ${now}</div>
  <div class="flt">Filter: ${filterDesc}</div>
</div>
<p class="cnt">${data.length} record(s)</p>
<table>
  <thead><tr>${thHtml}</tr></thead>
  <tbody>${tbodyHtml}</tbody>
</table>
<div class="foot">
  <span>ESO Auditing System</span>
  <span>${title} · ${now}</span>
</div>
</body></html>`);
    win.document.close();
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(
    data: (PendingClearanceItem | ClearanceHistoryItem)[],
    type: "pending" | "history"
) {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    let headers: string[];
    let rows: string[][];

    if (type === "pending") {
        headers = ["#", "Last Name", "First Name", "Student No.", "Program", "Year", "Section",
            "School Year", "Semester", "Obligations Paid", "Obligations Total", "Clearance Status"];
        rows = (data as PendingClearanceItem[]).map((p, i) => [
            String(i + 1), p.lastName, p.firstName, p.studentNo,
            p.programName || programLabel(p.programCode),
            String(p.yearLevel), p.section, p.schoolYear, String(p.semester),
            String(p.obligationsPaid), String(p.obligationsTotal),
            statusLabel(p.clearanceStatus),
        ]);
    } else {
        headers = ["#", "Last Name", "First Name", "Student No.", "Program", "Year", "Section",
            "School Year", "Semester", "Status", "Approved On", "Remarks"];
        rows = (data as ClearanceHistoryItem[]).map((h, i) => [
            String(i + 1), h.lastName, h.firstName, h.studentNo,
            programLabel(h.programCode),
            String(h.yearLevel), h.section, h.schoolYear, String(h.semester),
            historyStatusLabel(h.clearanceStatus), fmtDate(h.signedAt), h.remarks ?? "",
        ]);
    }

    const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM for Excel
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `eso-clearance-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─── Print/Export dropdown button ────────────────────────────────────────────

function PrintDropdown({ onPrint, onExport, darkMode }: {
    onPrint: () => void; onExport: () => void; darkMode: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)} title="Print / Export"
                className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-sm font-medium transition shadow-sm border
                    ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                <FiPrinter className="w-4 h-4" />
                <FiChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {open && (
                <div className={`absolute right-0 top-full mt-1.5 z-30 rounded-xl shadow-2xl ring-1 ring-black/5 py-1.5 w-44
                    ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                    <button onClick={() => { setOpen(false); onPrint(); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-sm transition
                            ${darkMode ? "text-gray-300 hover:bg-[#252525]" : "text-gray-700 hover:bg-gray-50"}`}>
                        <FiFileText className="w-4 h-4 text-orange-500 shrink-0" /> Print as PDF
                    </button>
                    <button onClick={() => { setOpen(false); onExport(); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-sm transition
                            ${darkMode ? "text-gray-300 hover:bg-[#252525]" : "text-gray-700 hover:bg-gray-50"}`}>
                        <FiDownload className="w-4 h-4 text-orange-500 shrink-0" /> Export CSV
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

function UserAvatar({ size = "md", src }: { size?: "sm" | "md"; src?: string | null }) {
    const sz = size === "md" ? "w-9 h-9" : "w-8 h-8";
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0`}>
            {src
                ? <img src={src.startsWith("http") ? src : src.startsWith("/uploads") ? src : `/uploads/${src}`} alt="" className="w-full h-full object-cover" />
                : <DefaultAvatarSvg />}
        </div>
    );
}

// ─── Sub-tab toggle ───────────────────────────────────────────────────────────

interface SubTabsProps {
    active: "review" | "history";
    onChange: (v: "review" | "history") => void;
    reviewCount: number;
    historyCount: number;
    reviewLabel?: string;
    historyLabel?: string;
}
function SubTabs({ active, onChange, reviewCount, historyCount, reviewLabel = "For Review", historyLabel = "History" }: SubTabsProps) {
    return (
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1 w-fit">
            <button
                onClick={() => onChange("review")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "review"
                        ? "bg-white dark:bg-[#1a1a1a] text-orange-600 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}>
                <FiCheckSquare className="w-4 h-4" />
                {reviewLabel}
                {reviewCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{reviewCount}</span>
                )}
            </button>
            <button
                onClick={() => onChange("history")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "history"
                        ? "bg-white dark:bg-[#1a1a1a] text-orange-600 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}>
                <FiClock className="w-4 h-4" />
                {historyLabel}
                {historyCount > 0 && (
                    <span className="bg-gray-400 dark:bg-gray-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{historyCount}</span>
                )}
            </button>
        </div>
    );
}

// ─── Sign Clearance Modal ─────────────────────────────────────────────────────

interface SignClearanceModalProps {
    student: PendingClearanceItem; token: string; onClose: () => void; onDone: () => void;
}
function SignClearanceModal({ student, token, onClose, onDone }: SignClearanceModalProps) {
    const [remarks, setRemarks] = useState("");
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await adminStudentService.signClearance(token, student.studentId, remarks);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                <h3 className="font-bold text-gray-800 text-lg mb-1">Approve Clearance</h3>
                <p className="text-sm text-gray-600 font-medium mb-0.5">{student.lastName}, {student.firstName}</p>
                <p className="text-xs text-gray-400 mb-4">{student.studentNo} · {student.programCode} · {student.schoolYear} Sem {student.semester}</p>
                <div className="flex gap-6 mb-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400">Obligations</p>
                        <p className="font-semibold text-gray-800">{student.obligationsPaid} / {student.obligationsTotal} completed</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Clearance</p>
                        <p className="font-semibold text-gray-800">{statusLabel(student.clearanceStatus) ?? "Not Started"}</p>
                    </div>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <textarea rows={2} placeholder="Remarks (optional)"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        value={remarks} onChange={e => setRemarks(e.target.value)} />
                    {err && <p className="text-red-500 text-sm">{err}</p>}
                    <div className="flex justify-between gap-3 mt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                            {saving ? "Approving..." : "Approve"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Sort / filter types ──────────────────────────────────────────────────────

type ClrSortKey = "name" | "year";

const PROGRAMS_LIST = [
    { code: "CpE", name: "Computer Engineering" },
    { code: "CE",  name: "Civil Engineering" },
    { code: "ECE", name: "Electronics Engineering" },
    { code: "EE",  name: "Electrical Engineering" },
    { code: "ME",  name: "Mechanical Engineering" },
];

// ─── Role constants ───────────────────────────────────────────────────────────

const CLEARANCE_ROLES = ["class_officer", "program_officer", "eso_officer", "program_head", "signatory", "dean", "system_admin"];

// ─── Main Page ────────────────────────────────────────────────────────────────

const ClearanceVerification = () => {
    const { accessToken, user } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();

    const [clearance,          setClearance]          = useState<PendingClearanceItem[]>([]);
    const [clrHistory,         setClrHistory]         = useState<ClearanceHistoryItem[]>([]);
    const [loading,            setLoading]            = useState(true);
    const [error,              setError]              = useState("");
    const [clrSubTab,          setClrSubTab]          = useState<"review" | "history">("review");
    const [signTarget,         setSignTarget]         = useState<PendingClearanceItem | null>(null);
    const [signingAll,         setSigningAll]         = useState(false);
    const [signAllMsg,         setSignAllMsg]         = useState("");
    const [selectedClearanceIds, setSelectedClearanceIds] = useState<Set<number>>(new Set());
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<number>>(new Set());
    const [bulkUnapproving,  setBulkUnapproving]  = useState(false);
    const [bulkDeletingClr,  setBulkDeletingClr]  = useState(false);
    const [markingPrinted,   setMarkingPrinted]   = useState(false);
    const [historyBulkMsg, setHistoryBulkMsg] = useState("");
    const [search,        setSearch]        = useState((location.state as any)?.search ?? "");
    const [sortKey,       setSortKey]       = useState<ClrSortKey>("name");
    const [programFilter, setProgramFilter] = useState((location.state as any)?.programFilter ?? "all");
    const [statusFilter,  setStatusFilter]  = useState("all");
    const [showFilters,   setShowFilters]   = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [showPrintModal,  setShowPrintModal]  = useState(false);
    const [printTemplates,  setPrintTemplates]  = useState<DocumentTemplate[]>([]);
    const [printTplId,      setPrintTplId]      = useState<number | null>(null);
    const [printSchoolYear, setPrintSchoolYear] = useState("");
    const [printSemester,   setPrintSemester]   = useState("");
    const [printing,        setPrinting]        = useState(false);
    const [alertMsg,        setAlertMsg]        = useState<string | null>(null);
    const [confirmState,    setConfirmState]    = useState<{ message: string; onConfirm: () => void } | null>(null);

    const hasClearanceRole = CLEARANCE_ROLES.includes(user?.role ?? "");
    const canSignClearance = user?.role !== "system_admin";

    function toggleClearanceSelect(id: number) {
        setSelectedClearanceIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function toggleClearanceSelectAll() {
        if (selectedClearanceIds.size === clearance.length) {
            setSelectedClearanceIds(new Set());
        } else {
            setSelectedClearanceIds(new Set(clearance.map(c => c.studentId)));
        }
    }

    function toggleHistorySelect(id: number) {
        setSelectedHistoryIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function toggleHistorySelectAll(filteredHistory: typeof clrHistory) {
        if (selectedHistoryIds.size === filteredHistory.length) {
            setSelectedHistoryIds(new Set());
        } else {
            setSelectedHistoryIds(new Set(filteredHistory.map(h => h.clearanceId)));
        }
    }

    async function handleUnapproveHistory() {
        if (!accessToken || !selectedHistoryIds.size) return;
        setBulkUnapproving(true); setHistoryBulkMsg("");
        try {
            const ids = [...selectedHistoryIds];
            await adminStudentService.unapproveHistory(accessToken, ids);
            setHistoryBulkMsg(`${ids.length} clearance(s) returned to pending.`);
            setSelectedHistoryIds(new Set());
            load();
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
            setSelectedHistoryIds(new Set());
            load();
        } catch (e: any) { setHistoryBulkMsg(e.message); }
        finally { setMarkingPrinted(false); }
    }

    function handleDeleteClearanceHistory() {
        if (!accessToken || !selectedHistoryIds.size) return;
        setConfirmState({
            message: `Delete ${selectedHistoryIds.size} clearance record(s)? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmState(null);
                setBulkDeletingClr(true); setHistoryBulkMsg("");
                try {
                    const ids = [...selectedHistoryIds];
                    await adminStudentService.deleteClearanceHistory(accessToken, ids);
                    setHistoryBulkMsg(`${ids.length} record(s) deleted.`);
                    setSelectedHistoryIds(new Set());
                    load();
                } catch (e: any) { setHistoryBulkMsg(e.message); }
                finally { setBulkDeletingClr(false); }
            },
        });
    }

    const load = useCallback(() => {
        if (!accessToken || !hasClearanceRole) return;
        setLoading(true);
        setError("");
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
    useEffect(() => {
        const id = setInterval(load, 20_000);
        return () => clearInterval(id);
    }, [load]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node))
                setShowFilters(false);
        }
        if (showFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters]);

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

    async function handlePrint() {
        if (!accessToken || !printTplId) return;
        setPrinting(true);
        try {
            const tpl = await documentService.getTemplate(accessToken, printTplId);
            setShowPrintModal(false);

            if (tpl.pdfPath) {
                // PDF template — server stamps the data; fetch as blob then open
                const url = documentService.printMergeUrl(
                    printTplId,
                    printSchoolYear || undefined,
                    printSemester   || undefined
                );
                const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
                if (!resp.ok) { const j = await resp.json().catch(() => ({})); throw new Error((j as any).message ?? "Print failed"); }
                const blob = await resp.blob();
                const objUrl = URL.createObjectURL(blob);
                const win = window.open(objUrl, "_blank");
                // revoke after a short delay
                setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
                if (!win) setAlertMsg("Please allow pop-ups to view the print preview.");
            } else {
                // HTML template — client-side fill + print window
                const students = await documentService.getApprovedStudents(
                    accessToken,
                    printSchoolYear || undefined,
                    printSemester   || undefined
                );
                printDocuments(tpl.content, students);
            }
        } catch (e: any) { setAlertMsg(e.message); }
        finally { setPrinting(false); }
    }

    async function handleSignAll() {
        if (!accessToken) return;
        setSigningAll(true); setSignAllMsg("");
        try {
            const res = await adminStudentService.signAllClearance(accessToken);
            setSignAllMsg(`${res.count} clearance(s) approved.`);
            load();
        } catch (e: any) { setSignAllMsg(e.message); }
        finally { setSigningAll(false); }
    }

    const bg = darkMode ? "bg-[#111111] text-gray-100" : "bg-gray-50 text-gray-900";

    function applyClrSearch<T extends { firstName: string; lastName: string; studentNo: string }>(items: T[]) {
        return search ? items.filter(i =>
            `${i.firstName} ${i.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
            i.studentNo.includes(search)
        ) : items;
    }
    function applyClrProgram<T extends { programCode: string }>(items: T[]) {
        return programFilter !== "all" ? items.filter(i => i.programCode === programFilter) : items;
    }
    function applyClrStatus<T extends { clearanceStatus: number | string | null }>(items: T[]) {
        if (statusFilter === "all") return items;
        return items.filter(i => {
            const s = i.clearanceStatus ?? 0;
            if (statusFilter === "processing") return s === 0 || s === 1;
            if (statusFilter === "approved")   return s === 2;
            if (statusFilter === "rejected")   return s === 3;
            return true;
        });
    }
    function applyClrSort(items: typeof clearance) {
        if (sortKey === "year") return [...items].sort((a, b) => a.yearLevel - b.yearLevel);
        return [...items].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }
    function applyHstSort(items: typeof clrHistory) {
        if (sortKey === "year") return [...items].sort((a, b) => a.yearLevel - b.yearLevel);
        return [...items].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }

    const filteredPending = applyClrSort(applyClrStatus(applyClrProgram(applyClrSearch(clearance))));
    const filteredHistory  = applyHstSort(applyClrStatus(applyClrProgram(applyClrSearch(clrHistory))));
    const filteredPendingCount = filteredPending.length;
    const filteredHistoryCount = filteredHistory.length;
    const activeResultCount    = clrSubTab === "review" ? filteredPendingCount : filteredHistoryCount;
    const activeFilterCount    = [programFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

    function buildFilterDesc() {
        const parts: string[] = [];
        if (programFilter !== "all") parts.push(`Program: ${programLabel(programFilter)}`);
        if (statusFilter  !== "all") parts.push(`Status: ${statusFilter.replace(/_/g, " ")}`);
        if (search)                  parts.push(`Search: "${search}"`);
        return parts.join("  ·  ");
    }

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
            {confirmState && <ConfirmModal message={confirmState.message} confirmLabel="Delete" danger onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} darkMode={darkMode} />}
            {/* ── Page Header ── */}
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h1 className={`text-lg sm:text-2xl lg:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        Clearance Approval
                    </h1>
                </div>
                <button onClick={load} disabled={loading} title="Refresh"
                    className={`p-2 border-2 rounded-xl transition shadow-sm disabled:opacity-50 ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && <div className="bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-red-500 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            {/* ── Search + Filter Bar ── */}
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search by student name or number..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className={`border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full shadow-sm
                            ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"}`} />
                </div>

                {/* Sort & Filter */}
                <div className="relative" ref={filterRef}>
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm
                            ${showFilters || activeFilterCount > 0 ? "bg-orange-500 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                        <FiFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {showFilters && (
                        <div className={`absolute right-0 top-full mt-2 z-30 rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-64 flex flex-col gap-3
                            ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Filter</p>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Program</label>
                                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="all">All Programs</option>
                                    {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Status</label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="all">All Status</option>
                                    <option value="processing">Processing</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            {activeFilterCount > 0 && (
                                <button onClick={() => { setProgramFilter("all"); setStatusFilter("all"); }}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition">
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results count */}
                <span className={`hidden sm:flex items-center text-xs font-medium px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm border
                    ${darkMode ? "bg-[#1a1a1a] border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                    {activeResultCount} result{activeResultCount !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Sub-tabs + inline actions ── */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pt-1">
                <SubTabs
                    active={clrSubTab} onChange={setClrSubTab}
                    reviewCount={filteredPendingCount}
                    historyCount={filteredHistoryCount}
                    reviewLabel="Pending" historyLabel="History" />

                {clrSubTab === "review" && (
                    <div className="flex items-center gap-3 flex-wrap pt-1 pb-1 pr-2">
                        {signAllMsg && <p className="text-sm text-green-600">{signAllMsg}</p>}
                        <PrintDropdown
                            darkMode={darkMode}
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

            {/* ── Pending Signature ── */}
            {clrSubTab === "review" && (() => {
                const filtered = filteredPending;
                return (
                <>

                    {filtered.length === 0 ? (
                        <div className={`rounded-xl p-10 text-center text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a] text-gray-400" : "bg-white text-gray-400"}`}>
                            <p className={`font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>No pending approvals</p>
                            <p>Students will appear here once all obligations are paid.</p>
                        </div>
                    ) : (
                        <>
                            <div className={`rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                                <table className="eso-table w-full min-w-[700px] border-collapse">
                                    <thead className={darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-500"}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="pl-4 pr-2 py-2 w-8">
                                                <input type="checkbox"
                                                    checked={clearance.length > 0 && selectedClearanceIds.size === clearance.length}
                                                    onChange={toggleClearanceSelectAll}
                                                    className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Student No.</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Year / Section</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Semester</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Obligations</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Printed</th>
                                            {canSignClearance && <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="">
                                        {filtered.map((c, i) => (
                                            <tr key={c.studentId}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors ${darkMode ? "hover:bg-[#222]/50" : "hover:bg-gray-100"} ${selectedClearanceIds.has(c.studentId) ? (darkMode ? "bg-[#222]/60" : "bg-gray-100") : i % 2 === 0 ? (darkMode ? "bg-[#1a1a1a]" : "bg-white") : (darkMode ? "bg-[#1a1a1a]/60" : "bg-gray-50/70")}`}>
                                                <td className="pl-4 pr-2 py-2.5 w-8" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedClearanceIds.has(c.studentId)}
                                                        onChange={() => toggleClearanceSelect(c.studentId)}
                                                        className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" src={c.avatarPath} />
                                                        <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{c.lastName}, {c.firstName}</div>
                                                    </div>
                                                </td>
                                                <td className={`px-3 py-2.5 text-center text-xs font-mono ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{c.studentNo}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-600"}`}>{c.programName}</span>
                                                </td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{c.yearLevel}-{c.section}</td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{c.schoolYear} · Sem {c.semester}</td>
                                                <td className={`px-3 py-2.5 text-center text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{c.obligationsPaid}/{c.obligationsTotal}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {c.isPrinted
                                                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">Printed</span>
                                                        : <span className={`text-[10px] ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>}
                                                </td>
                                                {canSignClearance && (
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button onClick={() => setSignTarget(c)}
                                                            className="px-4 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold">
                                                            Approve
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
                ); })()}

            {/* ── Signed History ── */}
            {clrSubTab === "history" && (() => {
                const filtered = filteredHistory;
                const allHistSelected = filtered.length > 0 && filtered.every(h => selectedHistoryIds.has(h.clearanceId));
                return (
                    filtered.length === 0 ? (
                        <div className={`rounded-xl p-10 text-center text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a] text-gray-400" : "bg-white text-gray-400"}`}>
                            No approvals yet.
                        </div>
                    ) : (
                        <>
                            {/* History Action Bar */}
                            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap pt-1 pb-1">
                                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                                    {selectedHistoryIds.size > 0 && ` · ${selectedHistoryIds.size} selected`}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap pt-1 pr-2">
                                    {historyBulkMsg && <p className="text-sm text-green-600">{historyBulkMsg}</p>}
                                    <PrintDropdown
                                        darkMode={darkMode}
                                        onPrint={() => printReport(filtered, "history", buildFilterDesc(), setAlertMsg)}
                                        onExport={() => exportCSV(filtered, "history")} />
                                    <button onClick={openPrintModal}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shadow-sm
                                            ${darkMode ? "bg-[#222] text-gray-300 border border-gray-600 hover:border-orange-500 hover:text-orange-400" : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400 hover:text-orange-600"}`}>
                                        <FiPrinter className="w-4 h-4" /> Print All Approved
                                    </button>
                                    {selectedHistoryIds.size > 0 && (
                                        <>
                                            <button onClick={handleMarkPrinted} disabled={markingPrinted}
                                                className="relative px-4 py-2 text-sm bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 transition">
                                                {markingPrinted ? "Marking..." : "Mark Printed"}
                                                {!markingPrinted && (
                                                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-green-700 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-green-200">
                                                        {selectedHistoryIds.size}
                                                    </span>
                                                )}
                                            </button>
                                            <button onClick={handleUnapproveHistory} disabled={bulkUnapproving}
                                                className="relative px-4 py-2 text-sm bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-60 transition">
                                                {bulkUnapproving ? "Processing..." : "Unapprove"}
                                                {!bulkUnapproving && (
                                                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-yellow-700 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-yellow-200">
                                                        {selectedHistoryIds.size}
                                                    </span>
                                                )}
                                            </button>
                                            <button onClick={handleDeleteClearanceHistory} disabled={bulkDeletingClr}
                                                className="relative px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 transition">
                                                {bulkDeletingClr ? "Deleting..." : "Delete"}
                                                {!bulkDeletingClr && (
                                                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-red-200">
                                                        {selectedHistoryIds.size}
                                                    </span>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={`rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                                <table className="eso-table w-full min-w-[700px] border-collapse">
                                    <thead className={darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-500"}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="pl-4 pr-2 py-2 w-8">
                                                <input type="checkbox"
                                                    checked={allHistSelected}
                                                    onChange={() => toggleHistorySelectAll(filtered)}
                                                    className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Year / Section</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Semester</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Approved</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Verified By</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Remarks</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Printed</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="">
                                        {filtered.map((h, i) => (
                                            <tr key={h.clearanceId + h.signedAt}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`transition-colors cursor-pointer ${darkMode ? "hover:bg-[#222]/50" : "hover:bg-gray-100"} ${selectedHistoryIds.has(h.clearanceId) ? (darkMode ? "bg-orange-900/30" : "bg-orange-50") : i % 2 === 0 ? (darkMode ? "bg-[#1a1a1a]" : "bg-white") : (darkMode ? "bg-[#1a1a1a]/60" : "bg-gray-50/70")}`}
                                                onClick={() => toggleHistorySelect(h.clearanceId)}>
                                                <td className="pl-4 pr-2 py-2.5 w-8" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox"
                                                        checked={selectedHistoryIds.has(h.clearanceId)}
                                                        onChange={() => toggleHistorySelect(h.clearanceId)}
                                                        className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" src={h.avatarPath} />
                                                        <div>
                                                            <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{h.lastName}, {h.firstName}</div>
                                                            <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{h.studentNo}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-600"}`}>{programLabel(h.programCode)}</span>
                                                </td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{h.yearLevel}-{h.section}</td>
                                                <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{h.schoolYear} · Sem {h.semester}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{fmtDate(h.signedAt)}</div>
                                                    <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{fmtTime(h.signedAt)}</div>
                                                </td>
                                                <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>—</td>
                                                <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h.remarks ?? "—"}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {h.isPrinted
                                                        ? <div className="flex flex-col items-center gap-0.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">Printed</span>
                                                            {h.printedAt && <span className={`text-[9px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>{fmtDate(h.printedAt)}</span>}
                                                          </div>
                                                        : <span className={`text-[10px] ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.clearanceStatus === 2 ? "bg-green-100 text-green-700" : h.clearanceStatus === 3 ? "bg-red-100 text-red-700" : h.clearanceStatus === 1 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                                        {historyStatusLabel(h.clearanceStatus)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )
                );
            })()}

            {/* ── Sign Modal ── */}
            {signTarget && (
                <SignClearanceModal student={signTarget} token={accessToken!}
                    onClose={() => setSignTarget(null)}
                    onDone={() => { setSignTarget(null); load(); }} />
            )}

            {/* ── Print Modal ── */}
            {showPrintModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowPrintModal(false)}>
                    <div className={`relative rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-sm p-5 ${darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-900"}`}
                        style={{ animation: "fadeInUp 0.2s ease both" }}
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowPrintModal(false)}
                            className={`absolute top-3 right-3 p-1.5 rounded-lg transition
                                ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-[#252525]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                            <FiX className="w-4 h-4" />
                        </button>
                        <h3 className="font-bold text-base mb-1 pr-8">Print All Approved</h3>
                        <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Choose a template and optional filters.
                        </p>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Template</label>
                                <select value={printTplId ?? ""} onChange={e => setPrintTplId(Number(e.target.value))}
                                    className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400
                                        ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    {printTemplates.length === 0
                                        ? <option value="">No templates — create one in Documents</option>
                                        : printTemplates.map(t => (
                                            <option key={t.templateId} value={t.templateId}>
                                                {t.isDefault ? "[Default] " : ""}{t.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>School Year <span className="font-normal opacity-60">(optional)</span></label>
                                <input value={printSchoolYear} onChange={e => setPrintSchoolYear(e.target.value)}
                                    placeholder="e.g. 2024-2025"
                                    className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400
                                        ${darkMode ? "bg-[#222] border-gray-600 text-gray-100 placeholder-gray-600" : "bg-white border-gray-200"}`} />
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Semester <span className="font-normal opacity-60">(optional)</span></label>
                                <select value={printSemester} onChange={e => setPrintSemester(e.target.value)}
                                    className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400
                                        ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}>
                                    <option value="">All Semesters</option>
                                    <option value="1">1st Semester</option>
                                    <option value="2">2nd Semester</option>
                                    <option value="3">Summer</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
                            <button type="button" onClick={() => setShowPrintModal(false)}
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium ${darkMode ? "bg-[#333] text-gray-300 hover:bg-[#3a3a3a]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition`}>
                                Cancel
                            </button>
                            <button type="button" onClick={handlePrint} disabled={printing || !printTplId}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                                <FiPrinter className="w-4 h-4 shrink-0" />
                                {printing ? "Loading…" : "Print Preview"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClearanceVerification;
