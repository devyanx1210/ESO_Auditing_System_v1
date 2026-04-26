import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiUploadCloud, FiCheckCircle, FiAlertCircle, FiLock, FiClock, FiTrash2, FiInfo, FiX } from "react-icons/fi";
import { useAuth }  from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { studentImportService } from "../../services/student-import.service";
import type { ImportCheckResult, ImportResult, ImportSession } from "../../services/student-import.service";

const SEMESTERS = ["1st", "2nd", "Summer"] as const;

const EXPECTED_HEADERS = [
    "NAME", "STUDENT NUMBER", "PROGRAM", "YEAR/SECTION",
    "ADDRESS", "CONTACT", "EMAIL ADDRESS",
    "GUARDIAN", "CONTACT NUMBER", "SHIRT SIZE",
];

// Some CAPS exports use "EMERGENCY CONTACT NUMBER" instead of "CONTACT NUMBER"
const HEADER_ALIASES: Record<string, string[]> = {
    "CONTACT NUMBER": ["EMERGENCY CONTACT NUMBER", "CONTACT NUMBER"],
};

function headerPresent(expected: string, csvHeaders: string[]): boolean {
    const aliases = HEADER_ALIASES[expected] ?? [expected];
    return aliases.some(a => csvHeaders.includes(a));
}

/** Properly splits a CSV line, respecting double-quoted fields (RFC 4180). */
function splitCSVLine(line: string): string[] {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            cells.push(current.trim());
            current = "";
        } else {
            current += ch;
        }
    }
    cells.push(current.trim());
    return cells;
}

function parseCSVPreview(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return { headers: [], rows: [] };
    const headers = splitCSVLine(lines[0]);
    const rows    = lines.slice(1, 11).map(splitCSVLine);
    return { headers, rows };
}

export default function StudentImportPage() {
    const { accessToken } = useAuth();
    const { darkMode }    = useTheme();

    // ── Period selection ──────────────────────────────────────────────────────
    const [schoolYear, setSchoolYear] = useState("2025-2026");
    const [semester,   setSemester]   = useState<typeof SEMESTERS[number]>("1st");

    // ── Import status ─────────────────────────────────────────────────────────
    const [checkResult,  setCheckResult]  = useState<ImportCheckResult | null>(null);
    const [checkLoading, setCheckLoading] = useState(false);

    // ── File / preview ────────────────────────────────────────────────────────
    const [file,       setFile]       = useState<File | null>(null);
    const [preview,    setPreview]    = useState<{ headers: string[]; rows: string[][] } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Import result ─────────────────────────────────────────────────────────
    const [importing,    setImporting]    = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [importError,  setImportError]  = useState("");

    // ── History ───────────────────────────────────────────────────────────────
    const [sessions,        setSessions]        = useState<ImportSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    // ── Delete confirm modal ──────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<ImportSession | null>(null);
    const [deleting,     setDeleting]     = useState(false);
    const [deleteError,  setDeleteError]  = useState("");

    // ── Info modal ────────────────────────────────────────────────────────────
    const [showInfo, setShowInfo] = useState(false);

    // ── Load history ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!accessToken) return;
        studentImportService.getSessions(accessToken)
            .then(setSessions)
            .catch(() => {})
            .finally(() => setSessionsLoading(false));
    }, [accessToken]);

    // ── Auto-check when period is filled ─────────────────────────────────────
    const periodComplete = schoolYear.trim().length > 0 && !!semester;

    useEffect(() => {
        if (!periodComplete || !accessToken) { setCheckResult(null); return; }
        let cancelled = false;
        setCheckLoading(true);
        studentImportService.check(accessToken, { schoolYear: schoolYear.trim(), semester: (SEMESTERS.indexOf(semester) + 1) as 1 | 2 | 3 })
            .then(r => { if (!cancelled) setCheckResult(r); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setCheckLoading(false); });
        return () => { cancelled = true; };
    }, [schoolYear, semester, accessToken]);

    // ── File handling ─────────────────────────────────────────────────────────
    function handleFileChange(f: File | null) {
        setFile(f);
        setImportResult(null);
        setImportError("");
        if (!f) { setPreview(null); return; }
        const reader = new FileReader();
        reader.onload = e => setPreview(parseCSVPreview(e.target?.result as string));
        reader.readAsText(f);
    }

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.name.endsWith(".csv")) handleFileChange(dropped);
    }, []);

    // ── Run import ────────────────────────────────────────────────────────────
    async function handleImport() {
        if (!file || !accessToken || !periodComplete) return;
        setImporting(true);
        setImportError("");
        setImportResult(null);
        try {
            const result = await studentImportService.import(accessToken, { schoolYear: schoolYear.trim(), semester: (SEMESTERS.indexOf(semester) + 1) as 1 | 2 | 3 }, file);
            setImportResult(result);
            setFile(null);
            setPreview(null);
            const [newCheck, newSessions] = await Promise.all([
                studentImportService.check(accessToken, { schoolYear: schoolYear.trim(), semester: (SEMESTERS.indexOf(semester) + 1) as 1 | 2 | 3 }),
                studentImportService.getSessions(accessToken),
            ]);
            setCheckResult(newCheck);
            setSessions(newSessions);
        } catch (err: any) {
            setImportError(err.message ?? "Import failed.");
        } finally {
            setImporting(false);
        }
    }

    // ── Delete session ────────────────────────────────────────────────────────
    async function handleDeleteConfirm() {
        if (!deleteTarget || !accessToken) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await studentImportService.deleteSession(accessToken, deleteTarget.importId);
            const newSessions = await studentImportService.getSessions(accessToken);
            setSessions(newSessions);
            if (periodComplete) {
                const newCheck = await studentImportService.check(accessToken, { schoolYear: schoolYear.trim(), semester: (SEMESTERS.indexOf(semester) + 1) as 1 | 2 | 3 });
                setCheckResult(newCheck);
            }
            setDeleteTarget(null);
        } catch (err: any) {
            setDeleteError(err.message ?? "Delete failed.");
        } finally {
            setDeleting(false);
        }
    }

    const isLocked  = checkResult?.exists === true;
    const inputCls  = `w-full focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm border-2 ${darkMode ? "bg-[#222] border-gray-600 text-gray-100 placeholder-gray-600" : "bg-white border-gray-200 text-gray-800"}`;
    const selectCls = inputCls;

    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${darkMode ? "bg-[#111111] text-gray-100" : "bg-gray-50 text-gray-900"}`}>
            <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* ── Header ── */}
            <div className="mb-6 flex items-center gap-3">
                <h1 className={`text-lg sm:text-2xl lg:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Student CSV Import</h1>
                <button
                    onClick={() => setShowInfo(true)}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-500 hover:bg-orange-200 transition shrink-0"
                    title="CSV format guide"
                >
                    <FiInfo className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* ── LEFT: PERIOD + UPLOAD ── */}
                <div className="flex flex-col gap-5">

                    {/* Period Selection */}
                    <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                        <h2 className={`font-semibold text-base mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>1. Select School Year &amp; Semester</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>School Year</label>
                                <input value={schoolYear} onChange={e => setSchoolYear(e.target.value)} placeholder="2025-2026" className={inputCls} />
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Semester</label>
                                <select value={semester} onChange={e => setSemester(e.target.value as any)} className={selectCls}>
                                    {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Period status */}
                        {periodComplete && (
                            <div className="mt-4">
                                {checkLoading ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-400 border-t-transparent" />
                                        Checking import status...
                                    </div>
                                ) : isLocked ? (
                                    <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl px-4 py-3">
                                        <FiLock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-amber-700">Already Imported</p>
                                            <p className="text-xs text-amber-600 mt-0.5">
                                                {checkResult?.recordCount} students were imported for {schoolYear} {semester} semester
                                                {checkResult?.importedAt ? ` on ${new Date(checkResult.importedAt).toLocaleDateString()}` : ""}.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2.5">
                                        <FiCheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        <p className="text-xs text-green-700 font-medium">
                                            {schoolYear} {semester} semester has not been imported yet. Ready to import.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* File Upload */}
                    <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"} ${isLocked ? "opacity-60 pointer-events-none" : ""}`}>
                        <h2 className={`font-semibold text-base mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            2. Upload CSV File
                            {isLocked && <span className="ml-2 text-xs text-amber-600 font-normal">(locked — already imported)</span>}
                        </h2>

                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                                ${isDragging ? "border-orange-400 bg-orange-50/20" : file ? "border-green-400 bg-green-50/20" : darkMode ? "border-gray-600 hover:border-orange-400 hover:bg-orange-900/10" : "border-gray-300 hover:border-orange-300 hover:bg-orange-50/50"}`}
                        >
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                                onChange={e => handleFileChange(e.target.files?.[0] ?? null)} />
                            <FiUploadCloud className={`w-10 h-10 mx-auto mb-3 ${file ? "text-green-500" : darkMode ? "text-gray-500" : "text-gray-400"}`} />
                            {file ? (
                                <>
                                    <p className="font-semibold text-green-500 text-sm">{file.name}</p>
                                    <p className="text-xs text-green-500/80 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                                </>
                            ) : (
                                <>
                                    <p className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Drop your CSV here or click to browse</p>
                                    <p className={`text-xs mt-1 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>Only .csv files accepted (max 10 MB)</p>
                                </>
                            )}
                        </div>

                        <p className={`text-xs mt-3 text-center font-mono text-[10px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                            {EXPECTED_HEADERS.join(", ")}
                        </p>
                    </div>

                    {/* Import Button */}
                    <button
                        onClick={handleImport}
                        disabled={!file || !periodComplete || isLocked || importing || checkLoading}
                        className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600
                            transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {importing ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Importing students...</>
                        ) : isLocked ? (
                            <><FiLock className="w-4 h-4" />Already Imported</>
                        ) : (
                            <><FiUploadCloud className="w-4 h-4" />Import Students</>
                        )}
                    </button>

                    {/* Import result */}
                    {importResult && (
                        <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`} style={{ animation: "fadeInUp 0.3s ease both" }}>
                            <div className="flex items-center gap-2 mb-4">
                                <FiCheckCircle className="w-5 h-5 text-green-500" />
                                <h3 className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Import Complete</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-green-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                                    <p className="text-xs text-green-700 mt-0.5">Imported</p>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                                    <p className="text-xs text-yellow-700 mt-0.5">Skipped</p>
                                </div>
                                <div className="bg-red-50 rounded-xl p-3 text-center">
                                    <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                                    <p className="text-xs text-red-700 mt-0.5">Errors</p>
                                </div>
                            </div>
                            {importResult.errors.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-3 max-h-36 overflow-y-auto">
                                    <p className="text-xs font-semibold text-red-600 mb-1.5">Error details:</p>
                                    {importResult.errors.map((e, i) => (
                                        <p key={i} className="text-[11px] text-red-500 leading-5">{e}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {importError && (
                        <div className="flex items-start gap-2 bg-red-50 rounded-xl px-4 py-3">
                            <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600">{importError}</p>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: PREVIEW + HISTORY ── */}
                <div className="flex flex-col gap-5">

                    {/* CSV Preview */}
                    {preview && (
                        <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`} style={{ animation: "fadeInUp 0.25s ease both" }}>
                            <h2 className={`font-semibold text-base mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Preview (first 10 rows)</h2>

                            {preview.headers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {EXPECTED_HEADERS.map(h => {
                                        const found = headerPresent(h, preview.headers);
                                        return (
                                            <span key={h} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                found ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                            }`}>
                                                {found ? "+" : "-"} {h}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-xl">
                                <table className="eso-table w-full text-[11px] border-collapse">
                                    <thead>
                                        <tr className={darkMode ? "bg-[#222] text-gray-400" : "bg-gray-100 text-gray-500"}>
                                            {preview.headers.map(h => (
                                                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.rows.map((row, ri) => (
                                            <tr key={ri} className={ri % 2 === 0 ? (darkMode ? "bg-[#1a1a1a]" : "bg-white") : (darkMode ? "bg-white/[0.02]" : "bg-gray-50/60")}>
                                                {row.map((cell, ci) => (
                                                    <td key={ci} className={`px-3 py-2 whitespace-nowrap max-w-[160px] truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Showing up to 10 rows. All rows in the file will be processed on import.</p>
                        </div>
                    )}

                    {/* Import History */}
                    <div className={`rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FiClock className="w-4 h-4 text-orange-500" />
                            <h2 className={`font-semibold text-base ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Import History</h2>
                        </div>

                        {sessionsLoading ? (
                            <div className={`flex items-center gap-2 text-sm py-6 justify-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent" />
                                Loading history...
                            </div>
                        ) : sessions.length === 0 ? (
                            <p className={`text-center text-sm py-8 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No imports yet.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl">
                                <table className="eso-table w-full text-xs border-collapse min-w-[500px]">
                                    <thead>
                                        <tr className={darkMode ? "bg-[#222] text-gray-400" : "bg-gray-50 text-gray-500"}>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">School Year</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Semester</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Imported</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Skipped</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">By</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Date</th>
                                            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map((s, i) => (
                                            <tr key={s.importId} className={`transition-colors ${i % 2 === 0 ? (darkMode ? "bg-[#1a1a1a]" : "bg-white") : (darkMode ? "bg-white/[0.02]" : "bg-gray-50/60")}`}>
                                                <td className={`px-3 py-2.5 font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{s.schoolYear}</td>
                                                <td className={`px-3 py-2.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{s.semester} Semester</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold text-[10px]">{s.recordCount}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {s.skippedCount > 0
                                                        ? <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-semibold text-[10px]">{s.skippedCount}</span>
                                                        : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className={`px-3 py-2.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{s.importedBy}</td>
                                                <td className={`px-3 py-2.5 whitespace-nowrap ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{new Date(s.importedAt).toLocaleDateString()}</td>
                                                <td className="px-3 py-2.5">
                                                    <button
                                                        onClick={() => { setDeleteTarget(s); setDeleteError(""); }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                                        title="Delete this import record"
                                                    >
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── INFO MODAL ── */}
            {showInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    onClick={() => setShowInfo(false)}>
                    <div className={`rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 w-full max-w-md ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "fadeInUp 0.2s ease both" }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-orange-100 rounded-lg">
                                    <FiInfo className="w-4 h-4 text-orange-500" />
                                </div>
                                <h3 className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>CSV Format Guide</h3>
                            </div>
                            <button onClick={() => setShowInfo(false)} className={`p-1.5 rounded-lg transition ${darkMode ? "text-gray-400 hover:bg-white/10" : "text-gray-400 hover:bg-gray-100"}`}>
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <ul className={`space-y-2.5 text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            <li className="flex gap-2">
                                <span className="text-orange-400 font-bold shrink-0">·</span>
                                <div>Header row must be in <strong>ALL CAPS</strong>:<br />
                                <code className={`mt-1 inline-block rounded px-2 py-1 font-mono text-[10px] break-all ${darkMode ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-100"}`}>{EXPECTED_HEADERS.join(", ")}</code></div>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-orange-400 font-bold shrink-0">·</span>
                                NAME format: <strong>Bunyi, Mariel Andrea L.</strong> (Last, First Middle Initial)
                            </li>
                            <li className="flex gap-2">
                                <span className="text-orange-400 font-bold shrink-0">·</span>
                                YEAR/SECTION combined: <strong>1A</strong>, <strong>2B</strong>, etc.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-orange-400 font-bold shrink-0">·</span>
                                PROGRAM must match exactly: e.g. <strong>Civil Engineering</strong>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-orange-400 font-bold shrink-0">·</span>
                                CONTACT NUMBER column = guardian's emergency contact number
                            </li>
                            <li className="flex gap-2">
                                <span className="text-orange-400 font-bold shrink-0">·</span>
                                SHIRT SIZE: XS, S, M, L, XL, or XXL
                            </li>
                            <li className="flex gap-2">
                                <span className="text-orange-400 font-bold shrink-0">·</span>
                                Default password = <strong>Student Number</strong>
                            </li>
                            <li className="flex gap-2 bg-amber-50 rounded-lg px-2 py-1.5">
                                <span className="text-amber-500 font-bold shrink-0">!</span>
                                <div><strong>Fields with commas</strong> (names, addresses) must be wrapped in quotes in your CSV file. Save from <strong>Excel or Google Sheets</strong> — they do this automatically. Do not copy-paste raw text into a .csv file.</div>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* ── DELETE CONFIRM MODAL ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    onClick={() => { if (!deleting) setDeleteTarget(null); }}>
                    <div className={`rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 w-full max-w-sm relative ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}
                        onClick={e => e.stopPropagation()}
                        style={{ animation: "fadeInUp 0.2s ease both" }}>
                        <button onClick={() => { if (!deleting) setDeleteTarget(null); }} className={`absolute top-3 right-3 transition ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                            <FiX className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <FiTrash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Delete Import Record</h3>
                                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className={`text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Remove the import record for{" "}
                            <strong>{deleteTarget.schoolYear} {deleteTarget.semester} Semester</strong>?
                        </p>
                        <p className={`text-xs mb-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                            Only the lock record is deleted — student accounts already created will remain. The period becomes available for re-import.
                        </p>

                        {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}

                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                                className={`flex-1 py-2 rounded-xl text-sm transition disabled:opacity-50 border ${darkMode ? "text-gray-300 hover:bg-white/10 border-gray-600" : "text-gray-600 hover:bg-gray-50 border-gray-200"}`}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} disabled={deleting}
                                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleting ? (
                                    <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />Deleting...</>
                                ) : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
