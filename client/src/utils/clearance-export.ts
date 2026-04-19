// Print and CSV export helpers for clearance pages
import type { PendingClearanceItem, ClearanceHistoryItem } from "../services/admin-student.service";
import { programLabel } from "../constants/programs";
import { fmtDate } from "./formatters";

function clearanceStatusLabel(s: number | null): string {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing";
}

export function printClearanceReport(
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
                <td class="c">${p.yearLevel}-${p.section}</td>
                <td class="c">${p.schoolYear}</td>
                <td class="c">${p.semester}</td>
                <td class="c">${p.obligationsPaid}&nbsp;/&nbsp;${p.obligationsTotal}</td>
                <td class="c"><span class="badge s-${p.clearanceStatus === 2 ? "approved" : p.clearanceStatus === 3 ? "rejected" : "processing"}">${clearanceStatusLabel(p.clearanceStatus)}</span></td>
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
                <td class="c">${h.yearLevel}-${h.section}</td>
                <td class="c">${h.schoolYear}</td>
                <td class="c">${h.semester}</td>
                <td class="c"><span class="badge s-${h.clearanceStatus === 2 ? "approved" : h.clearanceStatus === 3 ? "rejected" : "processing"}">${clearanceStatusLabel(h.clearanceStatus)}</span></td>
                <td class="c">${fmtDate(h.signedAt)}</td>
                <td>${(h.remarks ?? "").replace(/</g, "&lt;")}</td>
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
.s-approved{background:#dcfce7;color:#15803d}
.s-processing{background:#fff7ed;color:#c2410c}
.s-rejected{background:#fee2e2;color:#dc2626}
.foot{margin-top:14pt;font-size:7pt;color:#999;display:flex;justify-content:space-between}
</style></head>
<body>
<div class="no-print">
  <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  <span class="info">${data.length} record(s) · Long Bond Paper (8.5 x 13 in)</span>
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

export function exportClearanceCSV(
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
            clearanceStatusLabel(p.clearanceStatus),
        ]);
    } else {
        headers = ["#", "Last Name", "First Name", "Student No.", "Program", "Year", "Section",
            "School Year", "Semester", "Status", "Approved On", "Remarks"];
        rows = (data as ClearanceHistoryItem[]).map((h, i) => [
            String(i + 1), h.lastName, h.firstName, h.studentNo,
            programLabel(h.programCode),
            String(h.yearLevel), h.section, h.schoolYear, String(h.semester),
            clearanceStatusLabel(h.clearanceStatus), fmtDate(h.signedAt), h.remarks ?? "",
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
