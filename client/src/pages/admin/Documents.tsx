import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    FiPlus, FiSave, FiTrash2, FiStar, FiChevronDown, FiAlertCircle,
    FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter, FiAlignRight,
    FiList, FiUpload, FiX, FiFileText, FiEye, FiCheck, FiRefreshCw, FiPrinter,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { documentService, printDocuments, fillTemplate } from "../../services/document.service";
import type { DocumentTemplate, FieldPositions, ApprovedStudent } from "../../services/document.service";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

// ─── Variables ────────────────────────────────────────────────────────────────

const VARIABLES = [
    { key: "full_name",       label: "Full Name" },
    { key: "student_no",      label: "Student No." },
    { key: "program_section", label: "Program & Year/Sec" },
    { key: "program",         label: "Program" },
    { key: "year_section",    label: "Year / Section" },
    { key: "school_year",     label: "School Year" },
    { key: "semester",        label: "Semester" },
    { key: "date",            label: "Date Issued" },
];

const SAMPLE: Record<string, string> = {
    full_name:       "Dela Cruz, Juan",
    student_no:      "2021-00001",
    program_section: "Computer Engineering 3A",
    program:         "Computer Engineering",
    year_section:    "3A",
    school_year:     "2024-2025",
    semester:        "1",
    date:            new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
};

// Dummy student used for HTML preview
const PREVIEW_STUDENT: ApprovedStudent = {
    studentId:   0,
    studentNo:   "2021-00001",
    firstName:   "Juan",
    lastName:    "Dela Cruz",
    yearLevel:   3,
    section:     "A",
    schoolYear:  "2024-2025",
    semester:    "1",
    programName: "Computer Engineering",
    programCode: "CpE",
    signedAt:    new Date().toISOString(),
};

// Strip editor-only .var-chip spans to leave the {{token}} text, then fill with data
function renderPreview(html: string, student: ApprovedStudent): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll(".var-chip").forEach(el => {
        el.replaceWith(document.createTextNode(el.textContent ?? ""));
    });
    return fillTemplate(div.innerHTML, student);
}

// A4 minimap dimensions
const MAP_W = 190;
const MAP_H = Math.round(MAP_W * 842 / 595); // ≈ 269

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg }: { msg: { text: string; type: "ok" | "err" } | null }) {
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${msg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
            {msg.type === "ok" ? <FiCheck className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
            {msg.text}
        </div>
    );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onCancel, darkMode }: {
    name: string; onConfirm: () => void; onCancel: () => void; darkMode: boolean;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-900"}`}
                style={{ animation: "fadeInUp 0.18s ease both" }}>
                <h3 className="font-bold text-base mb-1">Delete Template</h3>
                <p className={`text-sm mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Delete <span className="font-semibold">{name}</span>? This cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel}
                        className={`px-4 py-2 rounded-xl text-sm font-medium ${darkMode ? "bg-[#333] text-gray-300 hover:bg-[#444]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition`}>
                        Cancel
                    </button>
                    <button onClick={onConfirm}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Rich editor ──────────────────────────────────────────────────────────────

function ToolbarBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }} title={title}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition text-sm">
            {children}
        </button>
    );
}

function RichEditor({ html, onChange, darkMode }: { html: string; onChange: (h: string) => void; darkMode: boolean }) {
    const ref  = useRef<HTMLDivElement>(null);
    const skip = useRef(false);
    const prev = useRef("");

    useEffect(() => {
        const key = html.slice(0, 32);
        if (key === prev.current) return;
        prev.current = key;
        if (!ref.current) return;
        skip.current = true;
        ref.current.innerHTML = html;
        skip.current = false;
    }, [html]);

    const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); ref.current?.focus(); };

    function insert(val: string) {
        ref.current?.focus();
        const span = document.createElement("span");
        span.className = "var-chip";
        span.contentEditable = "false";
        span.style.cssText = "display:inline-block;background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;border-radius:4px;padding:0 5px;font-size:12px;font-family:monospace;user-select:none;cursor:default;";
        span.textContent = val;
        const sel = window.getSelection();
        if (sel?.rangeCount) {
            const r = sel.getRangeAt(0);
            r.deleteContents(); r.insertNode(span);
            r.setStartAfter(span); r.collapse(true);
            sel.removeAllRanges(); sel.addRange(r);
        } else { ref.current?.appendChild(span); }
        if (ref.current) onChange(ref.current.innerHTML);
    }

    const divider = `w-px h-5 mx-1 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`;
    return (
        <div className={`flex flex-col rounded-xl overflow-hidden border-2 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b ${darkMode ? "bg-[#222] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <ToolbarBtn onClick={() => exec("bold")}                title="Bold">         <FiBold /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("italic")}              title="Italic">       <FiItalic /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("underline")}           title="Underline">    <FiUnderline /></ToolbarBtn>
                <div className={divider} />
                <ToolbarBtn onClick={() => exec("justifyLeft")}         title="Left">   <FiAlignLeft /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("justifyCenter")}       title="Center"> <FiAlignCenter /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("justifyRight")}        title="Right">  <FiAlignRight /></ToolbarBtn>
                <div className={divider} />
                <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="List">   <FiList /></ToolbarBtn>
                <div className={divider} />
                <select onMouseDown={e => e.stopPropagation()} defaultValue=""
                    onChange={e => { exec("fontSize", e.target.value); e.target.value = ""; }}
                    className={`text-xs px-1.5 py-1 rounded border ${darkMode ? "bg-[#333] border-gray-600 text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}>
                    <option value="" disabled>Size</option>
                    {[1,2,3,4,5,6,7].map(s => <option key={s} value={s}>{[8,10,12,14,18,24,36][s-1]}pt</option>)}
                </select>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1.5 border-b overflow-x-auto scrollbar-none ${darkMode ? "bg-[#222] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <span className={`text-[9px] font-bold uppercase tracking-wide shrink-0 mr-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Vars:</span>
                {VARIABLES.map(v => (
                    <button key={v.key} type="button" onMouseDown={e => { e.preventDefault(); insert(`{{${v.key}}}`); }}
                        className="shrink-0 px-1 sm:px-2 py-0.5 rounded text-[9px] sm:text-[11px] font-mono bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition">
                        {`{{${v.key}}}`}
                    </button>
                ))}
            </div>
            <div ref={ref} contentEditable suppressContentEditableWarning
                onInput={() => { if (!skip.current && ref.current) onChange(ref.current.innerHTML); }}
                className={`min-h-[480px] p-6 outline-none leading-relaxed overflow-auto ${darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-900"}`}
                style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt" }} />
        </div>
    );
}

// ─── Print Modal ─────────────────────────────────────────────────────────────

function PrintModal({ templateId, token, darkMode, onClose }: {
    templateId: number; token: string; darkMode: boolean; onClose: () => void;
}) {
    const [schoolYear, setSchoolYear] = useState("2025-2026");
    const [semester,   setSemester]   = useState("2");
    const [count,      setCount]      = useState<number | null>(null);
    const [checking,   setChecking]   = useState(false);
    const [printing,   setPrinting]   = useState(false);
    const [err,        setErr]        = useState("");

    async function checkCount() {
        setChecking(true); setErr("");
        try {
            const students = await documentService.getApprovedStudents(token, schoolYear, semester);
            setCount(students.length);
        } catch (e: any) { setErr(e.message); setCount(null); }
        finally { setChecking(false); }
    }

    async function handlePrint() {
        setPrinting(true); setErr("");
        try {
            const url  = documentService.printMergeUrl(templateId, schoolYear, semester);
            const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body?.message ?? `Server error ${resp.status}`);
            }
            const blob   = await resp.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Open in a print-ready window
            const win = window.open("", "_blank");
            if (!win) { setErr("Pop-ups are blocked — please allow pop-ups and try again."); return; }
            win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Print Clearances</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{display:flex;flex-direction:column;height:100vh;background:#374151;font-family:system-ui,sans-serif}
  .bar{background:#111827;color:#fff;padding:10px 20px;display:flex;align-items:center;gap:14px;flex-shrink:0}
  .btn{background:#f97316;color:#fff;border:none;padding:8px 22px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer}
  .btn:hover{background:#ea580c}
  .info{font-size:12px;opacity:.6}
  iframe{flex:1;border:none;width:100%;background:#374151}
  @media print{.bar{display:none}iframe{position:fixed;inset:0;width:100%;height:100%}}
</style></head>
<body>
  <div class="bar">
    <button class="btn" onclick="frames[0].focus();frames[0].print()">&#128438; Print</button>
    <span class="info">Use the Print button above or Ctrl+P · close this tab when done</span>
  </div>
  <iframe src="${blobUrl}" id="pdf"></iframe>
  <script>
    // auto-trigger after PDF loads
    document.getElementById('pdf').onload = function(){
      try{ this.contentWindow.print(); }catch(e){}
    };
    setTimeout(()=>URL.revokeObjectURL('${blobUrl}'), 120000);
  </script>
</body></html>`);
            win.document.close();
            onClose();
        } catch (e: any) { setErr(e.message); }
        finally { setPrinting(false); }
    }

    const card = darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-900";
    const inp  = `w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${card}`}
                style={{ animation: "fadeInUp 0.18s ease both" }}>
                <h3 className="font-bold text-base mb-1">Print Clearance Documents</h3>
                <p className={`text-xs mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Filter which approved students to include in the print.
                </p>

                <div className="space-y-3 mb-4">
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>School Year</label>
                        <input value={schoolYear} onChange={e => { setSchoolYear(e.target.value); setCount(null); }}
                            placeholder="e.g. 2025-2026" className={inp} />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Semester</label>
                        <select value={semester} onChange={e => { setSemester(e.target.value); setCount(null); }} className={inp}>
                            <option value="">All Semesters</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                            <option value="3">Summer</option>
                        </select>
                    </div>
                </div>

                {/* Count check */}
                <button onClick={checkCount} disabled={checking}
                    className={`w-full text-xs font-semibold py-1.5 rounded-xl mb-3 border transition ${darkMode ? "border-gray-700 text-gray-400 hover:text-orange-400 hover:border-orange-700" : "border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300"}`}>
                    {checking ? "Checking…" : "Check approved students"}
                </button>
                {count !== null && (
                    <p className={`text-xs mb-3 font-medium ${count === 0 ? "text-red-500" : "text-green-600"}`}>
                        {count === 0 ? "No approved students match this filter." : `${count} student${count !== 1 ? "s" : ""} will be printed.`}
                    </p>
                )}
                {err && <p className="text-xs text-red-500 mb-3">{err}</p>}

                <div className="flex gap-2">
                    <button onClick={onClose}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${darkMode ? "bg-[#333] text-gray-300 hover:bg-[#444]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                        Cancel
                    </button>
                    <button onClick={handlePrint} disabled={printing || count === 0}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition">
                        {printing ? "Generating…" : "Print PDF"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Print HTML Modal ─────────────────────────────────────────────────────────

function PrintHtmlModal({ content, token, darkMode, onClose }: {
    content: string; token: string; darkMode: boolean; onClose: () => void;
}) {
    const [schoolYear, setSchoolYear] = useState("2025-2026");
    const [semester,   setSemester]   = useState("2");
    const [count,      setCount]      = useState<number | null>(null);
    const [checking,   setChecking]   = useState(false);
    const [printing,   setPrinting]   = useState(false);
    const [err,        setErr]        = useState("");

    async function checkCount() {
        setChecking(true); setErr("");
        try {
            const students = await documentService.getApprovedStudents(token, schoolYear, semester);
            setCount(students.length);
        } catch (e: any) { setErr(e.message); setCount(null); }
        finally { setChecking(false); }
    }

    async function handlePrint() {
        setPrinting(true); setErr("");
        try {
            const students = await documentService.getApprovedStudents(token, schoolYear, semester);
            if (!students.length) { setErr("No approved students found for the selected filters."); return; }
            // Strip var-chip spans and fill template for each student
            const div = document.createElement("div");
            div.innerHTML = content;
            div.querySelectorAll(".var-chip").forEach(el => el.replaceWith(document.createTextNode(el.textContent ?? "")));
            const cleanContent = div.innerHTML;
            printDocuments(cleanContent, students);
            onClose();
        } catch (e: any) { setErr(e.message); }
        finally { setPrinting(false); }
    }

    const card = darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-900";
    const inp  = `w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl shadow-2xl w-full max-w-sm p-6 ${card}`}
                style={{ animation: "fadeInUp 0.18s ease both" }}>
                <h3 className="font-bold text-base mb-1">Print Clearance Documents</h3>
                <p className={`text-xs mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Filter which approved students to include. Each student gets their own page.
                </p>
                <div className="space-y-3 mb-4">
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>School Year</label>
                        <input value={schoolYear} onChange={e => { setSchoolYear(e.target.value); setCount(null); }}
                            placeholder="e.g. 2025-2026" className={inp} />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Semester</label>
                        <select value={semester} onChange={e => { setSemester(e.target.value); setCount(null); }} className={inp}>
                            <option value="">All Semesters</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                            <option value="3">Summer</option>
                        </select>
                    </div>
                </div>
                <button onClick={checkCount} disabled={checking}
                    className={`w-full text-xs font-semibold py-1.5 rounded-xl mb-3 border transition ${darkMode ? "border-gray-700 text-gray-400 hover:text-orange-400 hover:border-orange-700" : "border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300"}`}>
                    {checking ? "Checking…" : "Check approved students"}
                </button>
                {count !== null && (
                    <p className={`text-xs mb-3 font-medium ${count === 0 ? "text-red-500" : "text-green-600"}`}>
                        {count === 0 ? "No approved students match this filter." : `${count} student${count !== 1 ? "s" : ""} will be printed.`}
                    </p>
                )}
                {err && <p className="text-xs text-red-500 mb-3">{err}</p>}
                <div className="flex gap-2">
                    <button onClick={onClose}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${darkMode ? "bg-[#333] text-gray-300 hover:bg-[#444]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                        Cancel
                    </button>
                    <button onClick={handlePrint} disabled={printing || count === 0}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition">
                        {printing ? "Loading…" : "Print PDF"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── PDF Canvas Viewer ────────────────────────────────────────────────────────

const RENDER_SCALE = 1.5; // render at 1.5× for sharpness

function PdfCanvasViewer({
    pdfUrl, reloadKey, positions, isDragging, overlayRef, darkMode,
    onCanvasDrop, onPositionChange, onRemoveChip,
}: {
    pdfUrl: string | null; reloadKey: number; positions: FieldPositions;
    isDragging: boolean; overlayRef: React.RefObject<HTMLDivElement>; darkMode: boolean;
    onCanvasDrop: (e: React.DragEvent, canvas: HTMLCanvasElement) => void;
    onPositionChange: (key: string, x: number, y: number) => void;
    onRemoveChip: (key: string) => void;
}) {
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const [rendered, setRendered]       = useState(false);
    const [renderErr, setRenderErr]     = useState("");
    const [dragOver,  setDragOver]      = useState(false);

    // Pointer-based chip repositioning (more reliable than HTML5 DnD)
    const [ptrDragging, setPtrDragging] = useState<string | null>(null);
    const ptrOffset   = useRef({ dx: 0, dy: 0 }); // cursor offset from chip centre (CSS px)
    const ptrKeyRef   = useRef<string | null>(null);
    const onChgRef    = useRef(onPositionChange);
    useEffect(() => { onChgRef.current = onPositionChange; });

    // PDF render
    useEffect(() => {
        if (!pdfUrl) return;
        let cancelled = false;
        setRendered(false); setRenderErr("");
        (async () => {
            try {
                const pdfjsLib = await import("pdfjs-dist");
                (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
                    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                const pdf  = await (pdfjsLib as any).getDocument(pdfUrl).promise;
                if (cancelled) return;
                const page = await pdf.getPage(1);
                if (cancelled) return;
                const vp   = page.getViewport({ scale: RENDER_SCALE });
                const canvas = canvasRef.current;
                if (!canvas) return;
                canvas.width  = vp.width;
                canvas.height = vp.height;
                await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
                if (!cancelled) setRendered(true);
            } catch (e: any) {
                if (!cancelled) setRenderErr(e.message ?? "Failed to render PDF");
            }
        })();
        return () => { cancelled = true; };
    }, [pdfUrl, reloadKey]);

    // Global pointer listeners while a chip is being dragged
    useEffect(() => {
        if (!ptrDragging) { ptrKeyRef.current = null; return; }
        ptrKeyRef.current = ptrDragging;

        function onMove(e: PointerEvent) {
            const key = ptrKeyRef.current;
            if (!key || !canvasRef.current) return;
            const canvas = canvasRef.current;
            const rect   = canvas.getBoundingClientRect();
            const dispScale = rect.width / canvas.width;
            const relX = e.clientX - rect.left - ptrOffset.current.dx;
            const relY = e.clientY - rect.top  - ptrOffset.current.dy;
            const pdfX = Math.min(595, Math.max(0, Math.round(relX / dispScale / RENDER_SCALE)));
            const pdfY = Math.min(842, Math.max(0, Math.round(relY / dispScale / RENDER_SCALE)));
            onChgRef.current(key, pdfX, pdfY);
        }
        function onUp() { setPtrDragging(null); }

        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup",   onUp);
        return () => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup",   onUp);
        };
    }, [ptrDragging]);

    function handleChipPointerDown(e: React.PointerEvent, key: string, pos: { x: number; y: number }) {
        e.preventDefault();
        e.stopPropagation();
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect   = canvas.getBoundingClientRect();
        const dispScale = rect.width / canvas.width;
        // chip bottom-left in client coordinates (matches translate(0,-100%) anchor)
        const chipClientX = rect.left + pos.x * RENDER_SCALE * dispScale;
        const chipClientY = rect.top  + pos.y * RENDER_SCALE * dispScale;
        ptrOffset.current = { dx: e.clientX - chipClientX, dy: e.clientY - chipClientY };
        setPtrDragging(key);
    }

    if (!pdfUrl) return (
        <div className={`flex-1 flex items-center justify-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            No PDF loaded
        </div>
    );

    return (
        <div className="flex-1 min-h-0 overflow-auto flex justify-center"
            style={{ background: darkMode ? "#0d0d0d" : "#d1d5db" }}>
            <div className="relative my-6 shadow-2xl self-start">
                {!rendered && !renderErr && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white" style={{ minWidth: 200, minHeight: 280 }}>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500" />
                    </div>
                )}
                {renderErr && (
                    <div className="flex items-center justify-center bg-white p-8 text-sm text-red-500">{renderErr}</div>
                )}

                <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />

                {/* Overlay — receives DnD drops from sidebar and acts as pointer-move surface */}
                <div
                    ref={overlayRef}
                    className={`absolute inset-0 transition-colors ${dragOver && isDragging ? "bg-orange-500/10" : ""}`}
                    style={{ pointerEvents: "auto", cursor: ptrDragging ? "grabbing" : "default" }}
                    onDragOver={e => { e.preventDefault(); if (isDragging) setDragOver(true); }}
                    onDragLeave={e => {
                        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
                            setDragOver(false);
                    }}
                    onDrop={e => {
                        setDragOver(false);
                        if (canvasRef.current) onCanvasDrop(e, canvasRef.current);
                    }}>

                    {isDragging && dragOver && (
                        <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                            <span className="bg-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
                                Drop here to place on PDF
                            </span>
                        </div>
                    )}

                    {/* Chips */}
                    {rendered && VARIABLES.map(v => {
                        const pos    = positions[v.key];
                        const canvas = canvasRef.current;
                        if (!pos || !canvas) return null;
                        const dispScale = canvas.clientWidth > 0 ? canvas.clientWidth / canvas.width : 1;
                        const cssX = pos.x * RENDER_SCALE * dispScale;
                        const cssY = pos.y * RENDER_SCALE * dispScale;
                        const isMoving = ptrDragging === v.key;
                        return (
                            <div key={v.key}
                                className="absolute group"
                                style={{ left: cssX, top: cssY, transform: "translate(0,-100%)", zIndex: isMoving ? 20 : 10 }}>

                                {/* Label chip — pointer-down starts repositioning */}
                                <div
                                    onPointerDown={e => handleChipPointerDown(e, v.key, pos)}
                                    title={`${v.label} · x:${pos.x} y:${pos.y} ${pos.size}pt · Drag to reposition`}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500 text-white shadow-md whitespace-nowrap select-none transition-opacity ${isMoving ? "cursor-grabbing opacity-75" : "cursor-grab"}`}>
                                    {v.label}
                                </div>

                                {/* Remove button — visible on hover */}
                                <button
                                    onPointerDown={e => e.stopPropagation()}
                                    onClick={e => { e.stopPropagation(); onRemoveChip(v.key); }}
                                    title="Remove"
                                    className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] font-bold hidden group-hover:flex items-center justify-center shadow transition">
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── PDF Panel ────────────────────────────────────────────────────────────────

type PdfTab = "vars" | "map" | "tune";
type MobilePane = "actions" | "view";

function PdfPanel({ template, token, darkMode, onSaved }: {
    template: DocumentTemplate; token: string; darkMode: boolean; onSaved: () => Promise<void>;
}) {
    const defaultPos = (): FieldPositions =>
        Object.fromEntries(VARIABLES.map((v, i) => [v.key, { x: 72, y: 160 + i * 28, size: 12 }]));

    const [positions,       setPositions]       = useState<FieldPositions>(template.fieldPositions ?? defaultPos());
    const [activeTab,       setActiveTab]       = useState<PdfTab>("vars");
    const [mobilePane,      setMobilePane]      = useState<MobilePane>("view");
    const [isDragging,      setIsDragging]      = useState(false);
    const [mapDragOver,     setMapDragOver]     = useState(false);
    const [uploading,       setUploading]       = useState(false);
    const [saving,          setSaving]          = useState(false);
    const [removing,        setRemoving]        = useState(false);
    const [previewing,      setPreviewing]      = useState(false);
    const [showPrintModal,  setShowPrintModal]  = useState(false);
    const [msg,             setMsg]             = useState<{ text: string; type: "ok" | "err" } | null>(null);
    const [reloadKey,       setReloadKey]       = useState(0);
    const [confirmState,    setConfirmState]    = useState<{ message: string; onConfirm: () => void } | null>(null);
    const fileRef    = useRef<HTMLInputElement>(null);
    const mapRef     = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const chipOffset = useRef({ dx: 0, dy: 0 });

    const pdfSrc = template.pdfUrl ?? null;

    function flash(text: string, type: "ok" | "err" = "ok") {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3500);
    }

    // ── Coordinate helpers (minimap) ──────────────────────────────────────────
    const toMapX = (px: number) => Math.round(px * MAP_W / 595);
    const toMapY = (py: number) => Math.round(py * MAP_H / 842);
    const toPdfX = (mx: number) => Math.min(595, Math.max(0, Math.round(mx * 595 / MAP_W)));
    const toPdfY = (my: number) => Math.min(842, Math.max(0, Math.round(my * 842 / MAP_H)));

    function upd(key: string, field: "x" | "y" | "size", val: number) {
        setPositions(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
    }

    // ── Drag from variable chip list ──────────────────────────────────────────
    function onVarDragStart(e: React.DragEvent, key: string) {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("var-key", key);
        e.dataTransfer.setData("source", "list");
        setIsDragging(true);
    }
    function onVarDragEnd() { setIsDragging(false); }

    // ── Drag existing chip in minimap ─────────────────────────────────────────
    function onMapChipDragStart(e: React.DragEvent, key: string) {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("var-key", key);
        e.dataTransfer.setData("source", "map");
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        chipOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
        setIsDragging(true);
    }

    function onMapDragOver(e: React.DragEvent) { e.preventDefault(); setMapDragOver(true); }
    function onMapDragLeave(e: React.DragEvent) {
        if (!mapRef.current?.contains(e.relatedTarget as Node)) setMapDragOver(false);
    }
    function onMapDrop(e: React.DragEvent) {
        e.preventDefault(); setMapDragOver(false); setIsDragging(false);
        const key = e.dataTransfer.getData("var-key");
        const source = e.dataTransfer.getData("source");
        if (!key || !mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        let relX = e.clientX - rect.left;
        let relY = e.clientY - rect.top;
        if (source === "map") { relX -= chipOffset.current.dx; relY -= chipOffset.current.dy; }
        setPositions(p => ({ ...p, [key]: { x: toPdfX(relX), y: toPdfY(relY), size: p[key]?.size ?? 12 } }));
    }

    // ── Update chip position (called live by PdfCanvasViewer pointer move) ──────
    function onPositionChange(key: string, x: number, y: number) {
        setPositions(p => ({ ...p, [key]: { ...p[key], x, y } }));
    }

    // ── Remove chip from canvas ───────────────────────────────────────────────
    function onRemoveChip(key: string) {
        setPositions(p => { const n = { ...p }; delete n[key]; return n; });
    }

    // Called only for sidebar→canvas drops (chips on canvas use pointer events now)
    function onCanvasDrop(e: React.DragEvent, canvas: HTMLCanvasElement) {
        e.preventDefault(); setIsDragging(false);
        const key = e.dataTransfer.getData("var-key");
        if (!key) return;
        const rect = canvas.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const dispScale = rect.width / canvas.width;
        const pdfX = Math.min(595, Math.max(0, Math.round(relX / dispScale / RENDER_SCALE)));
        const pdfY = Math.min(842, Math.max(0, Math.round(relY / dispScale / RENDER_SCALE)));
        setPositions(p => ({ ...p, [key]: { x: pdfX, y: pdfY, size: p[key]?.size ?? 12 } }));
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { await documentService.uploadPdf(token, template.templateId, file); flash("PDF uploaded."); await onSaved(); setReloadKey(k => k + 1); }
        catch (err: any) { flash(err.message, "err"); }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
    }
    function handleRemove() {
        setConfirmState({
            message: "Remove the attached PDF?",
            onConfirm: async () => {
                setConfirmState(null);
                setRemoving(true);
                try { await documentService.removePdf(token, template.templateId); flash("PDF removed."); onSaved(); }
                catch (err: any) { flash(err.message, "err"); }
                finally { setRemoving(false); }
            },
        });
    }
    async function handleSave() {
        setSaving(true);
        try { await documentService.savePositions(token, template.templateId, positions); flash("Positions saved."); }
        catch (err: any) { flash(err.message, "err"); }
        finally { setSaving(false); }
    }
    const lb  = darkMode ? "bg-[#1a1a1a]" : "bg-white";
    const inp = `w-full text-center border-2 rounded-lg px-1 py-1 text-xs focus:outline-none focus:border-orange-400 transition ${darkMode ? "bg-[#222] border-gray-700 text-gray-100" : "bg-white border-gray-200"}`;
    const tabBtn = (t: PdfTab, label: string) => (
        <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide transition border-b-2
                ${activeTab === t
                    ? "border-orange-500 text-orange-500"
                    : `border-transparent ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}`}>
            {label}
        </button>
    );

    const mobilePaneBtn = (pane: MobilePane, label: string) => (
        <button key={pane} onClick={() => setMobilePane(pane)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition border-b-2
                ${mobilePane === pane
                    ? "border-orange-500 text-orange-500"
                    : `border-transparent ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}`}>
            {label}
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 h-full">
            {confirmState && <ConfirmModal message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} darkMode={darkMode} />}
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />

            {/* ── Mobile section tab bar ── */}
            <div className={`lg:hidden shrink-0 flex border-b mb-2 rounded-t-2xl overflow-hidden ${darkMode ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100"}`}>
                {mobilePaneBtn("view", "PDF View")}
                {mobilePaneBtn("actions", "Actions")}
            </div>

            {/* ── Left sidebar — single compact panel ── */}
            <div className={`flex-1 min-h-0 lg:flex-none lg:w-56 lg:shrink-0 flex-col rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.16)] ${lb}
                ${mobilePane === "actions" ? "flex" : "hidden"} lg:flex`}>

                {/* Tab bar */}
                <div className={`flex shrink-0 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                    {tabBtn("vars", "Variables")}
                    {tabBtn("map",  "Map")}
                    {tabBtn("tune", "Fine-tune")}
                </div>

                {/* Tab content — scrollable */}
                <div className="flex-1 overflow-y-auto p-3 min-h-0">

                    {/* ── Variables tab ── */}
                    {activeTab === "vars" && (
                        <div>
                            <p className={`text-[10px] mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                Drag a variable onto the PDF preview to place it, or onto the Map tab.
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {VARIABLES.map(v => (
                                    <div key={v.key}
                                        draggable
                                        onDragStart={e => onVarDragStart(e, v.key)}
                                        onDragEnd={onVarDragEnd}
                                        className="px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition cursor-grab active:cursor-grabbing select-none">
                                        {`{{${v.key}}}`}
                                    </div>
                                ))}
                            </div>
                            <p className={`text-[10px] mt-3 leading-relaxed ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                                Chips already on the PDF can be dragged to reposition. Use <strong>Fine-tune</strong> for exact coordinates.
                            </p>
                        </div>
                    )}

                    {/* ── Map tab ── */}
                    {activeTab === "map" && (
                        <div>
                            <p className={`text-[10px] mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>A4 · 595 × 842 pt</p>
                            <div
                                ref={mapRef}
                                onDragOver={onMapDragOver}
                                onDragLeave={onMapDragLeave}
                                onDrop={onMapDrop}
                                className={`relative rounded overflow-hidden ${darkMode ? "bg-[#252525]" : "bg-gray-50"} ${mapDragOver ? "ring-2 ring-orange-400" : ""}`}
                                style={{ width: MAP_W, height: MAP_H, userSelect: "none" }}>
                                <svg className="absolute inset-0 pointer-events-none" width={MAP_W} height={MAP_H}>
                                    {[1, 2, 3].map(n => (
                                        <g key={n}>
                                            <line x1={MAP_W * n / 4} y1={0} x2={MAP_W * n / 4} y2={MAP_H} stroke={darkMode ? "#444" : "#e0e0e0"} strokeWidth={0.5} />
                                            <line x1={0} y1={MAP_H * n / 4} x2={MAP_W} y2={MAP_H * n / 4} stroke={darkMode ? "#444" : "#e0e0e0"} strokeWidth={0.5} />
                                        </g>
                                    ))}
                                </svg>
                                {!VARIABLES.some(v => positions[v.key]) && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className={`text-[10px] text-center leading-relaxed ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Drag variables<br />here to place</span>
                                    </div>
                                )}
                                {VARIABLES.map(v => {
                                    const pos = positions[v.key]; if (!pos) return null;
                                    return (
                                        <div key={v.key} draggable onDragStart={e => onMapChipDragStart(e, v.key)} onDragEnd={() => setIsDragging(false)}
                                            title={`${v.label}: x=${pos.x}, y=${pos.y}, ${pos.size}pt`}
                                            className="absolute px-1 py-0.5 rounded text-[8px] font-bold bg-orange-500 text-white shadow cursor-grab whitespace-nowrap z-10"
                                            style={{ left: toMapX(pos.x), top: toMapY(pos.y), transform: "translate(-50%, -50%)" }}>
                                            {v.label}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className={`text-[9px] mt-1.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Drag chips to reposition</p>
                        </div>
                    )}

                    {/* ── Fine-tune tab ── */}
                    {activeTab === "tune" && (
                        <div className="space-y-1.5">
                            {VARIABLES.map((v, i) => {
                                const pos = positions[v.key] ?? { x: 72, y: 160 + i * 28, size: 12 };
                                return (
                                    <div key={v.key} className={`rounded-lg p-1.5 ${darkMode ? "bg-[#222]" : "bg-gray-50"}`}>
                                        <div className={`text-[10px] font-semibold mb-1 ${darkMode ? "text-orange-400" : "text-orange-600"}`}>{v.label}</div>
                                        <div className="flex gap-1">
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[9px] text-center mb-0.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>X</div>
                                                <input type="number" value={pos.x} min={0} max={595} onChange={e => upd(v.key, "x", +e.target.value)} className={inp} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[9px] text-center mb-0.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Y</div>
                                                <input type="number" value={pos.y} min={0} max={842} onChange={e => upd(v.key, "y", +e.target.value)} className={inp} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[9px] text-center mb-0.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>pt</div>
                                                <input type="number" value={pos.size} min={6} max={72} onChange={e => upd(v.key, "size", +e.target.value)} className={inp} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Action buttons — always at bottom */}
                <div className={`shrink-0 border-t p-3 flex flex-col gap-1.5 ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                    {msg && <Toast msg={msg} />}
                    <button onClick={handleSave} disabled={saving}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition">
                        <FiSave className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Positions"}
                    </button>
                    <button onClick={async () => {
                        setPreviewing(true); flash("Generating preview…");
                        try {
                            const blobUrl = await documentService.fetchPreviewPdf(token, template.templateId);
                            const win = window.open(blobUrl, "_blank");
                            if (!win) flash("Allow pop-ups to see the preview.", "err");
                            else setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                        } catch (e: any) { flash(e.message, "err"); }
                        finally { setPreviewing(false); }
                    }} disabled={previewing}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${darkMode ? "border-gray-700 text-gray-300 hover:text-orange-400 hover:border-orange-700" : "border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-300"} disabled:opacity-50`}>
                        <FiEye className="w-3.5 h-3.5" /> {previewing ? "Generating…" : "Preview Filled"}
                    </button>
                    <button onClick={() => setShowPrintModal(true)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition">
                        <FiPrinter className="w-3.5 h-3.5" /> Print Documents
                    </button>
                    <div className="flex gap-1.5">
                        <button onClick={() => fileRef.current?.click()} disabled={uploading}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium border transition ${darkMode ? "border-gray-700 text-gray-400 hover:text-blue-400 hover:border-blue-700" : "border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300"}`}>
                            <FiUpload className="w-3 h-3" /> {uploading ? "…" : "Replace"}
                        </button>
                        <button onClick={handleRemove} disabled={removing}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium border transition ${darkMode ? "border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-700" : "border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300"}`}>
                            <FiX className="w-3 h-3" /> {removing ? "…" : "Remove"}
                        </button>
                    </div>
                </div>

                {showPrintModal && (
                    <PrintModal
                        templateId={template.templateId}
                        token={token}
                        darkMode={darkMode}
                        onClose={() => setShowPrintModal(false)} />
                )}
            </div>

            {/* ── Right: PDF canvas + drag overlay ── */}
            <div className={`flex-1 min-w-0 flex-col rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)] ${lb}
                ${mobilePane === "view" ? "flex" : "hidden"} lg:flex`}
                style={{ minHeight: 0, height: "100%" }}>

                {/* Header */}
                <div className={`px-4 py-2.5 shrink-0 flex items-center justify-between border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>PDF Preview</span>
                    <div className="flex items-center gap-3">
                        {isDragging && (
                            <span className="text-[10px] text-orange-500 font-semibold animate-pulse">Drop on PDF to place →</span>
                        )}
                        <button onClick={() => setReloadKey(k => k + 1)}
                            className={`flex items-center gap-1 text-[11px] transition ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                            <FiRefreshCw className="w-3 h-3" /> Reload
                        </button>
                        {pdfSrc && (
                            <a href={pdfSrc} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-orange-500 hover:text-orange-600 transition">
                                <FiEye className="w-3 h-3" /> Open in tab
                            </a>
                        )}
                    </div>
                </div>

                {/* Canvas viewer */}
                <PdfCanvasViewer
                    pdfUrl={pdfSrc}
                    reloadKey={reloadKey}
                    positions={positions}
                    isDragging={isDragging}
                    overlayRef={overlayRef}
                    darkMode={darkMode}
                    onCanvasDrop={onCanvasDrop}
                    onPositionChange={onPositionChange}
                    onRemoveChip={onRemoveChip} />
            </div>
        </div>
    );
}

// ─── Template dropdown selector ───────────────────────────────────────────────

function TemplateDropdown({ templates, selected, onSelect, isDirty, darkMode }: {
    templates: DocumentTemplate[];
    selected: DocumentTemplate | null;
    onSelect: (t: DocumentTemplate) => void;
    isDirty: boolean;
    darkMode: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative shrink-0">
            {confirmState && <ConfirmModal message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} darkMode={darkMode} />}
            <button onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition min-w-[150px] max-w-[200px]
                    ${open
                        ? darkMode ? "bg-[#222] border-orange-600 text-orange-400" : "bg-orange-50 border-orange-400 text-orange-700"
                        : darkMode ? "bg-[#222] border-gray-700 text-gray-300 hover:border-orange-600 hover:text-orange-400" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600"}`}>
                <FiFileText className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate text-left font-medium text-sm">
                    {selected ? selected.name : "Select…"}
                </span>
                <FiChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className={`absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.22)] overflow-hidden ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}
                    style={{ animation: "fadeInUp 0.14s ease both" }}>
                    {templates.length === 0
                        ? <p className={`px-4 py-4 text-xs text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No templates yet.</p>
                        : <ul className="max-h-64 overflow-y-auto py-1">
                            {templates.map(t => (
                                <li key={t.templateId}>
                                    <button onClick={() => {
                                        if (!isDirty) { onSelect(t); setOpen(false); return; }
                                        setConfirmState({ message: "Discard changes?", onConfirm: () => { setConfirmState(null); onSelect(t); setOpen(false); } });
                                    }}
                                        className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 transition
                                            ${selected?.templateId === t.templateId
                                                ? darkMode ? "border-l-2 border-orange-500 text-orange-400 pl-[14px]" : "border-l-2 border-orange-500 text-orange-700 pl-[14px]"
                                                : darkMode ? "hover:bg-[#222] text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}>
                                        {t.isDefault
                                            ? <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                                            : <span className="w-3 h-3 shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{t.name}</div>
                                            {t.pdfPath && <div className="text-[10px] text-orange-500 font-medium">PDF template</div>}
                                        </div>
                                        {selected?.templateId === t.templateId && <FiCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    }
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Documents() {
    const { accessToken } = useAuth();
    const { darkMode }    = useTheme();

    const [templates,    setTemplates]    = useState<DocumentTemplate[]>([]);
    const [selected,     setSelected]     = useState<DocumentTemplate | null>(null);
    const [name,         setName]         = useState("");
    const [content,      setContent]      = useState("");
    const [isDirty,      setIsDirty]      = useState(false);
    const [loading,      setLoading]      = useState(true);
    const [saving,       setSaving]       = useState(false);
    const [deleting,     setDeleting]     = useState(false);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [confirmDel,   setConfirmDel]   = useState(false);
    const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
    const [printing,         setPrinting]         = useState(false);
    const [msg,              setMsg]              = useState<{ text: string; type: "ok" | "err" } | null>(null);
    const [previewMode,      setPreviewMode]      = useState(false);
    const [showPrintHtmlModal, setShowPrintHtmlModal] = useState(false);
    const pdfRef = useRef<HTMLInputElement>(null);

    const bg = darkMode ? "bg-[#111111] text-gray-100" : "bg-gray-50 text-gray-900";

    function flash(text: string, type: "ok" | "err" = "ok") {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3000);
    }

    const loadTemplates = useCallback(async () => {
        if (!accessToken) return [] as DocumentTemplate[];
        try {
            const list = await documentService.getTemplates(accessToken);
            setTemplates(list);
            return list;
        } catch (e: any) { flash(e.message, "err"); return [] as DocumentTemplate[]; }
        finally { setLoading(false); }
    }, [accessToken]);

    useEffect(() => {
        loadTemplates().then(list => {
            if (!list.length) return;
            openTemplate(list.find(t => t.isDefault) ?? list[0]);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    async function openTemplate(tpl: DocumentTemplate) {
        if (!accessToken) return;
        try {
            const full = await documentService.getTemplate(accessToken, tpl.templateId);
            setSelected(full); setName(full.name); setContent(full.content ?? ""); setIsDirty(false);
        } catch {
            setSelected(tpl); setName(tpl.name); setContent(tpl.content ?? ""); setIsDirty(false);
        }
    }

    function handleNew() {
        if (isDirty) {
            setConfirmState({ message: "Discard unsaved changes?", onConfirm: () => { setConfirmState(null); doNew(); } });
            return;
        }
        doNew();
    }
    function doNew() {
        setSelected(null);
        setName("New Template");
        setContent(
            "<p style=\"text-align:center\"><strong>STUDENT CLEARANCE</strong></p><p><br></p>" +
            "<p>This certifies that <strong>{{full_name}}</strong> ({{student_no}}), a {{year_section}} student of " +
            "<strong>{{program}}</strong>, has been cleared of all ESO obligations for School Year " +
            "<strong>{{school_year}}</strong>, Semester <strong>{{semester}}</strong>.</p>" +
            "<p><br></p><p>Issued on {{date}}.</p>"
        );
        setIsDirty(true);
    }

    async function handleSave() {
        if (!accessToken || !name.trim()) return;
        setSaving(true);
        try {
            if (selected) {
                await documentService.updateTemplate(accessToken, selected.templateId, name.trim(), content);
                flash("Saved.");
                const list = await loadTemplates();
                const upd  = list.find(t => t.templateId === selected.templateId);
                if (upd) await openTemplate(upd);
            } else {
                const { templateId } = await documentService.createTemplate(accessToken, name.trim(), content);
                flash("Template created.");
                const list = await loadTemplates();
                const upd  = list.find(t => t.templateId === templateId);
                if (upd) await openTemplate(upd);
            }
            setIsDirty(false);
        } catch (e: any) { flash(e.message, "err"); }
        finally { setSaving(false); }
    }

    async function confirmDelete() {
        if (!selected || !accessToken) return;
        setDeleting(true);
        try {
            await documentService.deleteTemplate(accessToken, selected.templateId);
            flash("Deleted.");
            setSelected(null); setName(""); setContent(""); setIsDirty(false);
            const list = await loadTemplates();
            if (list.length) openTemplate(list[0]);
        } catch (e: any) { flash(e.message, "err"); }
        finally { setDeleting(false); setConfirmDel(false); }
    }

    async function handleToggleDefault() {
        if (!selected || !accessToken) return;
        try {
            if (selected.isDefault) {
                await documentService.unsetDefault(accessToken, selected.templateId);
                flash("Removed from favorites.");
            } else {
                await documentService.setDefault(accessToken, selected.templateId);
                flash("Set as default.");
            }
            const list = await loadTemplates();
            const upd  = list.find(t => t.templateId === selected.templateId);
            if (upd) setSelected(upd);
        } catch (e: any) { flash(e.message, "err"); }
    }

    async function handlePdfFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !accessToken) return;
        let tid = selected?.templateId;
        if (!tid) {
            if (!name.trim()) { flash("Enter a template name first.", "err"); return; }
            setSaving(true);
            try {
                const { templateId } = await documentService.createTemplate(accessToken, name.trim(), content ?? "");
                tid = templateId; setIsDirty(false);
            } catch (err: any) { flash(err.message, "err"); setSaving(false); return; }
            finally { setSaving(false); }
        }
        setPdfUploading(true);
        try {
            await documentService.uploadPdf(accessToken, tid, file);
            flash("PDF uploaded.");
            const list = await loadTemplates();
            const upd  = list.find(t => t.templateId === tid);
            if (upd) await openTemplate(upd);
        } catch (err: any) { flash(err.message, "err"); }
        finally { setPdfUploading(false); if (pdfRef.current) pdfRef.current.value = ""; }
    }

    async function handlePrintHtml() {
        if (!accessToken || !content) return;
        setPrinting(true);
        try {
            const students = await documentService.getApprovedStudents(accessToken);
            printDocuments(content, students);
        } catch (e: any) { flash(e.message, "err"); }
        finally { setPrinting(false); }
    }

    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${bg}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${bg}`}>
            <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
            {confirmState && <ConfirmModal message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} darkMode={darkMode} />}

            {/* Header */}
            <div className="px-4 sm:px-6 pt-5 pb-3 shrink-0 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className={`text-base sm:text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Document Templates</h1>

                </div>
                <button onClick={handleNew}
                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition shadow">
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Template</span>
                </button>
            </div>

            {/* Action bar */}
            <div className={`relative rounded-2xl px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center gap-2 sm:gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.16)] mb-3 mx-4 sm:mx-6 shrink-0 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>

                {/* Template selector dropdown */}
                <TemplateDropdown
                    templates={templates}
                    selected={selected}
                    onSelect={openTemplate}
                    isDirty={isDirty}
                    darkMode={darkMode}
                />

                {/* Template name input */}
                <input value={name} onChange={e => { setName(e.target.value); setIsDirty(true); }} placeholder="Template name…"
                    className={`flex-1 min-w-[110px] border-2 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-orange-400
                        ${darkMode ? "bg-[#222] border-gray-700 text-gray-100 placeholder-gray-600" : "bg-gray-50 border-gray-200 text-gray-900"}`} />

                <Toast msg={msg} />

                {/* Attach PDF — only when no PDF on this template yet */}
                {!selected?.pdfPath && (
                    <>
                        <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfFile} />
                        <button onClick={() => pdfRef.current?.click()} disabled={pdfUploading}
                            title="Attach a pre-made PDF"
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition
                                ${darkMode ? "border-gray-700 text-gray-400 hover:text-orange-400 hover:border-orange-600" : "border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300"}`}>
                            <FiUpload className="w-3.5 h-3.5" />
                            {pdfUploading ? "Uploading…" : "Attach PDF"}
                        </button>
                    </>
                )}

                {/* Delete */}
                {selected && (
                    <button onClick={() => setConfirmDel(true)} disabled={deleting}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition
                            ${darkMode ? "border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-700" : "border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300"}`}>
                        <FiTrash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                )}

                {/* Star — set/unset default */}
                {selected && (
                    <button onClick={handleToggleDefault}
                        title={selected.isDefault ? "Remove default" : "Set as default"}
                        className={`p-1.5 sm:p-2 rounded-xl border transition
                            ${selected.isDefault
                                ? darkMode ? "border-yellow-600 text-yellow-400 bg-yellow-900/20" : "border-yellow-400 text-yellow-600 bg-yellow-50"
                                : darkMode ? "border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-600" : "border-gray-200 text-gray-500 hover:text-yellow-600 hover:border-yellow-400"}`}>
                        <FiStar className={`w-3.5 h-3.5 ${selected.isDefault ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                )}

                {/* Edit / Preview toggle — HTML templates only */}
                {!selected?.pdfPath && (
                    <div className={`flex items-center gap-0.5 rounded-lg p-0.5 sm:p-1 ${darkMode ? "bg-[#222]" : "bg-gray-100"}`}>
                        <button onClick={() => setPreviewMode(false)}
                            className={`px-2.5 sm:px-3 py-1 rounded text-xs font-semibold transition ${!previewMode
                                ? "bg-white text-orange-600 shadow-sm"
                                : darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}>
                            Edit
                        </button>
                        <button onClick={() => setPreviewMode(true)}
                            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded text-xs font-semibold transition ${previewMode
                                ? "bg-white text-orange-600 shadow-sm"
                                : darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}>
                            <FiEye className="w-3 h-3" /> Preview
                        </button>
                    </div>
                )}

                {/* Print — HTML templates only, when template is saved */}
                {selected && !selected.pdfPath && (
                    <button onClick={() => setShowPrintHtmlModal(true)} disabled={printing}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition
                            ${darkMode ? "border-gray-700 text-gray-400 hover:text-orange-400 hover:border-orange-600" : "border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300"}`}>
                        <FiPrinter className="w-3.5 h-3.5" /> Print
                    </button>
                )}

                {/* Save — always visible so name can be saved on PDF templates too */}
                <button onClick={handleSave} disabled={saving || !isDirty}
                    className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition shadow">
                    <FiSave className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {saving ? "Saving…" : "Save"}
                </button>
            </div>

            {/* PDF panel or HTML editor — fills remaining viewport height */}
            <div className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
                {selected?.pdfPath && accessToken
                    ? <PdfPanel
                        key={selected.templateId}
                        template={selected}
                        token={accessToken}
                        darkMode={darkMode}
                        onSaved={async () => {
                            const list = await loadTemplates();
                            const upd  = list.find(t => t.templateId === selected.templateId);
                            if (upd) await openTemplate(upd);
                        }} />
                    : <div className="h-full overflow-y-auto space-y-4 pr-1">
                        {previewMode
                            ? (
                                <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] overflow-hidden ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                                    <div className={`px-4 py-2 border-b flex items-center gap-2 ${darkMode ? "border-gray-800 bg-[#111]" : "border-gray-100 bg-gray-50"}`}>
                                        <FiEye className="w-3.5 h-3.5 text-orange-500" />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            Preview — sample data
                                        </span>
                                        <span className={`ml-2 text-[10px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                                            Showing: {PREVIEW_STUDENT.lastName}, {PREVIEW_STUDENT.firstName} · {PREVIEW_STUDENT.studentNo}
                                        </span>
                                    </div>
                                    <div className="p-8 sm:p-12 max-w-3xl mx-auto"
                                        style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: 1.6, color: "#000" }}
                                        dangerouslySetInnerHTML={{ __html: renderPreview(content, PREVIEW_STUDENT) }} />
                                </div>
                            )
                            : (
                                <RichEditor
                                    key={selected?.templateId ?? "new"}
                                    html={content}
                                    onChange={v => { setContent(v); setIsDirty(true); }}
                                    darkMode={darkMode} />
                            )
                        }
                        <div className={`rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.16)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Variables</p>
                            <div className="flex flex-wrap gap-1.5">
                                {VARIABLES.map(v => (
                                    <span key={v.key} className="px-2 py-0.5 rounded text-[11px] font-mono bg-orange-50 text-orange-600 border border-orange-200">
                                        {`{{${v.key}}}`}
                                    </span>
                                ))}
                            </div>
                            <p className={`text-[11px] mt-2 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                                Click a variable in the toolbar to insert it. To use a pre-made PDF instead, click <strong>Attach PDF</strong>.
                            </p>
                        </div>
                      </div>
                }
            </div>

            {/* Delete confirm modal */}
            {confirmDel && selected && (
                <DeleteModal
                    name={selected.name}
                    darkMode={darkMode}
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmDel(false)} />
            )}

            {/* Print HTML modal */}
            {showPrintHtmlModal && accessToken && (
                <PrintHtmlModal
                    content={content}
                    token={accessToken}
                    darkMode={darkMode}
                    onClose={() => setShowPrintHtmlModal(false)} />
            )}
        </div>
    );
}
