import { useState, useEffect, useRef } from "react";
import { FiPrinter, FiFileText, FiDownload, FiChevronDown, FiCheckSquare, FiClock } from "react-icons/fi";
import type { PendingClearanceItem, ClearanceHistoryItem } from "../../../services/admin-student.service";

// Program lookup

export const PROGRAM_NAMES: Record<string, string> = {
    CpE: "Computer Engineering",
    CE:  "Civil Engineering",
    ECE: "Electronics Engineering",
    EE:  "Electrical Engineering",
    ME:  "Mechanical Engineering",
};
export function programLabel(code: string) { return PROGRAM_NAMES[code] ?? code; }

// Date/time formatters

export function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
export function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

// Status labels

export function statusLabel(s: number | null) {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing";
}
export function historyStatusLabel(s: number | null) {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing";
}

// Print to a new window (long bond paper)

export function printReport(
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
                <td class="c">${i + 1}</td><td><b>${p.lastName}, ${p.firstName}</b></td>
                <td class="c mono">${p.studentNo}</td><td>${p.programName || programLabel(p.programCode)}</td>
                <td class="c">${p.yearLevel}–${p.section}</td><td class="c">${p.schoolYear}</td>
                <td class="c">${p.semester}</td><td class="c">${p.obligationsPaid}&nbsp;/&nbsp;${p.obligationsTotal}</td>
                <td class="c"><span class="badge s-${p.clearanceStatus === 2 ? "approved" : p.clearanceStatus === 3 ? "rejected" : "processing"}">${statusLabel(p.clearanceStatus)}</span></td>
            </tr>`).join("");
    } else {
        thHtml = ["#", "Student Name", "Student No.", "Program", "Yr / Sec", "School Year", "Sem", "Status", "Approved On", "Remarks"]
            .map(h => `<th>${h}</th>`).join("");
        tbodyHtml = (data as ClearanceHistoryItem[]).map((h, i) => `
            <tr class="${i % 2 !== 0 ? "alt" : ""}">
                <td class="c">${i + 1}</td><td><b>${h.lastName}, ${h.firstName}</b></td>
                <td class="c mono">${h.studentNo}</td><td>${programLabel(h.programCode)}</td>
                <td class="c">${h.yearLevel}–${h.section}</td><td class="c">${h.schoolYear}</td>
                <td class="c">${h.semester}</td>
                <td class="c"><span class="badge s-${h.clearanceStatus === 2 ? "approved" : h.clearanceStatus === 3 ? "rejected" : "processing"}">${historyStatusLabel(h.clearanceStatus)}</span></td>
                <td class="c">${fmtDate(h.signedAt)}</td><td>${(h.remarks ?? "—").replace(/</g, "&lt;")}</td>
            </tr>`).join("");
    }
    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title>
<style>@page{size:8.5in 13in portrait;margin:1.5cm 2cm}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:8.5pt;color:#111;background:#fff}
.no-print{position:fixed;top:0;left:0;right:0;background:#111827;color:#fff;padding:10px 20px;display:flex;align-items:center;gap:12px;z-index:999;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.no-print .btn{padding:7px 20px;background:#f97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700}.no-print .btn:hover{background:#ea580c}
.no-print .info{font-size:12px;opacity:.7}@media print{.no-print{display:none}}@media screen{body{padding-top:52px;padding-left:2cm;padding-right:2cm}}
.hdr{margin-bottom:10pt}.hdr .sys{font-size:7pt;text-transform:uppercase;letter-spacing:.5px;color:#555;margin-bottom:2pt}
.hdr h1{font-size:13pt;font-weight:700;margin-bottom:2pt}.hdr .meta{font-size:7.5pt;color:#444}.hdr .flt{font-size:7.5pt;color:#666;margin-top:1pt}
.cnt{font-size:7.5pt;color:#555;margin-bottom:7pt}table{width:100%;border-collapse:collapse}thead tr{background:#f3f4f6}
th{padding:3.5pt 5pt;text-align:left;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.4px;border-top:1.5pt solid #aaa;border-bottom:1pt solid #aaa}
td{padding:3pt 5pt;font-size:8.5pt;border-bottom:.5pt solid #e5e5e5;vertical-align:middle}tr.alt td{background:#f9fafb}
.c{text-align:center}.mono{font-family:"Courier New",monospace;font-size:8pt}
.badge{display:inline-block;padding:1pt 5pt;border-radius:10pt;font-size:7pt;font-weight:700}
.s-cleared,.s-approved{background:#dcfce7;color:#15803d}.s-pending{background:#f3f4f6;color:#6b7280}
.s-in_progress{background:#fff7ed;color:#c2410c}.s-signed{background:#dbeafe;color:#1d4ed8}.s-rejected{background:#fee2e2;color:#dc2626}
.foot{margin-top:14pt;font-size:7pt;color:#999;display:flex;justify-content:space-between}</style></head>
<body><div class="no-print"><button class="btn" onclick="window.print()">Print / Save as PDF</button>
<span class="info">${data.length} record(s) · Long Bond Paper (8.5 × 13 in)</span></div>
<div class="hdr"><div class="sys">ESO Clearance Management System</div><h1>${title}</h1>
<div class="meta">Generated: ${now}</div><div class="flt">Filter: ${filterDesc}</div></div>
<p class="cnt">${data.length} record(s)</p><table><thead><tr>${thHtml}</tr></thead><tbody>${tbodyHtml}</tbody></table>
<div class="foot"><span>ESO Auditing System</span><span>${title} · ${now}</span></div></body></html>`);
    win.document.close();
}

// CSV export

export function exportCSV(data: (PendingClearanceItem | ClearanceHistoryItem)[], type: "pending" | "history") {
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
            String(p.obligationsPaid), String(p.obligationsTotal), statusLabel(p.clearanceStatus),
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
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eso-clearance-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Print/Export dropdown button

export function PrintDropdown({ onPrint, onExport, darkMode }: {
    onPrint: () => void; onExport: () => void; darkMode: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
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

// Sub-tab toggle

interface SubTabsProps {
    active: "review" | "history";
    onChange: (v: "review" | "history") => void;
    reviewCount: number;
    historyCount: number;
    reviewLabel?: string;
    historyLabel?: string;
}
export function SubTabs({ active, onChange, reviewCount, historyCount, reviewLabel = "For Review", historyLabel = "History" }: SubTabsProps) {
    return (
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1 w-fit">
            <button onClick={() => onChange("review")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "review" ? "bg-white dark:bg-[#1a1a1a] text-orange-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}>
                <FiCheckSquare className="w-4 h-4" />
                {reviewLabel}
                {reviewCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{reviewCount}</span>
                )}
            </button>
            <button onClick={() => onChange("history")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "history" ? "bg-white dark:bg-[#1a1a1a] text-orange-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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

// History tab bulk action bar

export interface HistoryBulkBarProps {
    count: number;
    selectedCount: number;
    bulkMsg: string;
    darkMode: boolean;
    markingPrinted: boolean;
    bulkUnapproving: boolean;
    bulkDeletingClr: boolean;
    onPrint: () => void;
    onExport: () => void;
    onOpenPrintModal: () => void;
    onMarkPrinted: () => void;
    onUnapprove: () => void;
    onDelete: () => void;
}

export function HistoryBulkBar({
    count, selectedCount, bulkMsg, darkMode,
    markingPrinted, bulkUnapproving, bulkDeletingClr,
    onPrint, onExport, onOpenPrintModal,
    onMarkPrinted, onUnapprove, onDelete,
}: HistoryBulkBarProps) {
    return (
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap pt-1 pb-1">
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {count} record{count !== 1 ? "s" : ""}
                {selectedCount > 0 && ` · ${selectedCount} selected`}
            </p>
            <div className="flex items-center gap-2 flex-wrap pt-1 pr-2">
                {bulkMsg && <p className="text-sm text-green-600">{bulkMsg}</p>}
                <PrintDropdown darkMode={darkMode} onPrint={onPrint} onExport={onExport} />
                <button onClick={onOpenPrintModal}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shadow-sm
                        ${darkMode ? "bg-[#222] text-gray-300 border border-gray-600 hover:border-orange-500 hover:text-orange-400" : "bg-white text-gray-600 border border-gray-200 hover:border-orange-400 hover:text-orange-600"}`}>
                    <FiPrinter className="w-4 h-4" /> Print All Approved
                </button>
                {selectedCount > 0 && (
                    <>
                        <button onClick={onMarkPrinted} disabled={markingPrinted}
                            className="relative px-4 py-2 text-sm bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 transition">
                            {markingPrinted ? "Marking..." : "Mark Printed"}
                            {!markingPrinted && <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-green-700 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-green-200">{selectedCount}</span>}
                        </button>
                        <button onClick={onUnapprove} disabled={bulkUnapproving}
                            className="relative px-4 py-2 text-sm bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-60 transition">
                            {bulkUnapproving ? "Processing..." : "Unapprove"}
                            {!bulkUnapproving && <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-yellow-700 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-yellow-200">{selectedCount}</span>}
                        </button>
                        <button onClick={onDelete} disabled={bulkDeletingClr}
                            className="relative px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 transition">
                            {bulkDeletingClr ? "Deleting..." : "Delete"}
                            {!bulkDeletingClr && <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-red-200">{selectedCount}</span>}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
