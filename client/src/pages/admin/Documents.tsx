import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    FiPlus, FiSave, FiTrash2, FiStar, FiChevronRight, FiAlertCircle,
    FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter, FiAlignRight,
    FiList, FiUpload, FiX, FiFileText, FiEye, FiCheck,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { documentService } from "../../services/document.service";
import type { DocumentTemplate, FieldPositions } from "../../services/document.service";

// ─── Variables ────────────────────────────────────────────────────────────────

const VARIABLES = [
    { key: "full_name",    label: "Full Name" },
    { key: "student_no",   label: "Student No." },
    { key: "program",      label: "Program" },
    { key: "year_section", label: "Year / Section" },
    { key: "school_year",  label: "School Year" },
    { key: "semester",     label: "Semester" },
    { key: "date",         label: "Date Issued" },
];

const SAMPLE: Record<string, string> = {
    full_name:    "Dela Cruz, Juan",
    student_no:   "2021-00001",
    program:      "Computer Engineering",
    year_section: "3A",
    school_year:  "2024-2025",
    semester:     "1",
    date:         new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
};

// ─── Small inline toast ───────────────────────────────────────────────────────

function Toast({ msg }: { msg: { text: string; type: "ok" | "err" } | null }) {
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${msg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
            {msg.type === "ok" ? <FiCheck className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
            {msg.text}
        </div>
    );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

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

// ─── HTML rich editor ─────────────────────────────────────────────────────────

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

    const div = `w-px h-5 mx-1 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`;
    return (
        <div className={`flex flex-col rounded-xl overflow-hidden border-2 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b ${darkMode ? "bg-[#222] border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <ToolbarBtn onClick={() => exec("bold")}               title="Bold">         <FiBold /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("italic")}             title="Italic">       <FiItalic /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("underline")}          title="Underline">    <FiUnderline /></ToolbarBtn>
                <div className={div} />
                <ToolbarBtn onClick={() => exec("justifyLeft")}        title="Left">   <FiAlignLeft /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("justifyCenter")}      title="Center"> <FiAlignCenter /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec("justifyRight")}       title="Right">  <FiAlignRight /></ToolbarBtn>
                <div className={div} />
                <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="List">  <FiList /></ToolbarBtn>
                <div className={div} />
                <select onMouseDown={e => e.stopPropagation()} defaultValue=""
                    onChange={e => { exec("fontSize", e.target.value); e.target.value = ""; }}
                    className={`text-xs px-1.5 py-1 rounded border ${darkMode ? "bg-[#333] border-gray-600 text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}>
                    <option value="" disabled>Size</option>
                    {[1,2,3,4,5,6,7].map(s => <option key={s} value={s}>{[8,10,12,14,18,24,36][s-1]}pt</option>)}
                </select>
                <div className={div} />
                {VARIABLES.map(v => (
                    <button key={v.key} type="button" onMouseDown={e => { e.preventDefault(); insert(`{{${v.key}}}`); }}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition">
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

// ─── PDF mode panel ───────────────────────────────────────────────────────────

function PdfPanel({ template, token, darkMode, onSaved }: {
    template: DocumentTemplate; token: string; darkMode: boolean; onSaved: () => void;
}) {
    const [positions, setPositions] = useState<FieldPositions>(
        template.fieldPositions ?? Object.fromEntries(VARIABLES.map((v, i) => [v.key, { x: 72, y: 160 + i * 24, size: 12 }]))
    );
    const [uploading, setUploading] = useState(false);
    const [saving,    setSaving]    = useState(false);
    const [removing,  setRemoving]  = useState(false);
    const [msg,       setMsg]       = useState<{ text: string; type: "ok" | "err" } | null>(null);
    const [blobUrl,   setBlobUrl]   = useState<string | null>(null);
    const [pdfState,  setPdfState]  = useState<"loading" | "ready" | "error">("loading");
    const [pdfErrMsg, setPdfErrMsg] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    function flash(text: string, type: "ok" | "err" = "ok") {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3000);
    }

    function loadBlob() {
        if (!template.pdfPath) return;
        setPdfState("loading");
        setPdfErrMsg("");
        let url: string;
        documentService.fetchPdfBlob(token, template.templateId)
            .then(u => { url = u; setBlobUrl(u); setPdfState("ready"); })
            .catch(e => { setPdfState("error"); setPdfErrMsg(e.message ?? "Failed to load PDF"); });
        return () => { if (url) URL.revokeObjectURL(url); };
    }

    useEffect(() => {
        if (!template.pdfPath) { setBlobUrl(null); setPdfState("loading"); return; }
        return loadBlob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template.templateId, template.pdfPath]);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await documentService.uploadPdf(token, template.templateId, file);
            flash("PDF uploaded.");
            onSaved();
        } catch (err: any) { flash(err.message, "err"); }
        finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
    }

    async function handleRemove() {
        setRemoving(true);
        try {
            await documentService.removePdf(token, template.templateId);
            flash("PDF removed.");
            onSaved();
        } catch (err: any) { flash(err.message, "err"); }
        finally { setRemoving(false); }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await documentService.savePositions(token, template.templateId, positions);
            flash("Positions saved.");
            onSaved();
        } catch (err: any) { flash(err.message, "err"); }
        finally { setSaving(false); }
    }

    async function handlePreview() {
        const url = documentService.printMergeUrl(template.templateId);
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
        if (!resp?.ok) { flash("No approved students found to preview with.", "err"); return; }
        const blob = await resp.blob();
        const obj  = URL.createObjectURL(blob);
        window.open(obj, "_blank");
        setTimeout(() => URL.revokeObjectURL(obj), 60_000);
    }

    function upd(key: string, field: "x" | "y" | "size", val: number) {
        setPositions(p => ({ ...p, [key]: { ...p[key], [field]: val } }));
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Action bar */}
            <div className={`rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
                <FiFileText className={`w-4 h-4 shrink-0 ${template.pdfPath ? "text-orange-500" : darkMode ? "text-gray-500" : "text-gray-400"}`} />
                <span className={`flex-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {template.pdfPath ? "PDF attached" : "No PDF — upload your pre-made PDF form"}
                </span>
                <Toast msg={msg} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition">
                    <FiUpload className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : template.pdfPath ? "Replace PDF" : "Upload PDF"}
                </button>
                {template.pdfPath && (
                    <>
                        <button onClick={handleRemove} disabled={removing}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                                ${darkMode ? "border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-700" : "border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300"}`}>
                            <FiX className="w-3.5 h-3.5" /> {removing ? "Removing…" : "Remove"}
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                                ${darkMode ? "border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-700" : "border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-300"}`}>
                            <FiSave className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Positions"}
                        </button>
                        <button onClick={handlePreview}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition
                                ${darkMode ? "border-gray-700 text-gray-400 hover:text-orange-400 hover:border-orange-700" : "border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300"}`}>
                            <FiEye className="w-3.5 h-3.5" /> Preview Merged
                        </button>
                    </>
                )}
            </div>

            {template.pdfPath && (
                <div className="flex gap-3 flex-col xl:flex-row">

                    {/* PDF preview */}
                    <div className={`xl:w-[440px] shrink-0 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                        <div className={`px-4 py-2.5 border-b flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-100 text-gray-500"}`}>
                            <span>PDF Preview</span>
                            {blobUrl && (
                                <a href={blobUrl} target="_blank" rel="noreferrer"
                                    className="normal-case font-normal text-orange-500 hover:underline flex items-center gap-1">
                                    <FiEye className="w-3 h-3" /> Open full
                                </a>
                            )}
                        </div>
                        {pdfState === "ready" && blobUrl ? (
                            <iframe src={blobUrl} title="PDF" className="w-full" style={{ height: 620, border: "none" }} />
                        ) : pdfState === "error" ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
                                <FiAlertCircle className="w-5 h-5 text-red-400" />
                                <p className="text-xs text-red-500">{pdfErrMsg}</p>
                                <button onClick={loadBlob} className="text-xs text-orange-500 hover:underline">Retry</button>
                            </div>
                        ) : (
                            <div className={`flex items-center justify-center h-48 gap-2 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                Loading…
                            </div>
                        )}
                    </div>

                    {/* Field positions table */}
                    <div className={`flex-1 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                        <div className={`px-4 py-2.5 border-b text-[10px] font-bold uppercase tracking-widest ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-100 text-gray-500"}`}>
                            Field Positions
                        </div>
                        <div className="overflow-x-auto">
                            <table className="eso-table w-full min-w-[380px]">
                                <thead className={darkMode ? "bg-[#222] text-gray-400" : "bg-gray-50 text-gray-500"}>
                                    <tr>
                                        <th className="px-4 py-2.5 text-left   text-[11px] font-semibold uppercase tracking-wide">Variable</th>
                                        <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide w-20">X →</th>
                                        <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide w-20">Y ↓</th>
                                        <th className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide w-16">Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {VARIABLES.map((v, i) => {
                                        const pos = positions[v.key] ?? { x: 72, y: 160 + i * 24, size: 12 };
                                        const inp = `w-full text-center border-2 rounded-lg px-1 py-1 text-xs focus:outline-none focus:border-orange-400 ${darkMode ? "bg-[#222] border-gray-700 text-gray-100" : "bg-white border-gray-200"}`;
                                        return (
                                            <tr key={v.key} className={darkMode ? "border-t border-gray-800" : "border-t border-gray-100"}>
                                                <td className="px-4 py-2">
                                                    <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{v.label}</div>
                                                    <div className="text-[10px] font-mono text-orange-500">{`{{${v.key}}}`}</div>
                                                    <div className={`text-[10px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>{SAMPLE[v.key]}</div>
                                                </td>
                                                <td className="px-2 py-2"><input type="number" value={pos.x}    min={0} max={2000} onChange={e => upd(v.key,"x",   +e.target.value)} className={inp} /></td>
                                                <td className="px-2 py-2"><input type="number" value={pos.y}    min={0} max={2000} onChange={e => upd(v.key,"y",   +e.target.value)} className={inp} /></td>
                                                <td className="px-2 py-2"><input type="number" value={pos.size} min={6} max={72}   onChange={e => upd(v.key,"size",+e.target.value)} className={inp} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className={`px-4 py-3 border-t text-[11px] ${darkMode ? "border-gray-800 text-gray-600" : "border-gray-100 text-gray-400"}`}>
                            A4 = 595 × 842 pt · origin top-left · 1 pt ≈ 0.35 mm
                        </div>
                    </div>
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
    const [msg,          setMsg]          = useState<{ text: string; type: "ok" | "err" } | null>(null);
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
        if (isDirty && !window.confirm("Discard unsaved changes?")) return;
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
                const list = await loadTemplates();
                const upd  = list.find(t => t.templateId === templateId);
                if (upd) await openTemplate(upd);
                flash("Template created.");
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

    async function handleSetDefault() {
        if (!selected || !accessToken) return;
        try {
            await documentService.setDefault(accessToken, selected.templateId);
            flash("Set as default.");
            await loadTemplates();
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
                tid = templateId;
                setIsDirty(false);
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

    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${bg}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className={`min-h-screen p-4 sm:p-6 md:p-8 ${bg}`}>
            <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className={`font-bold text-lg sm:text-xl ${darkMode ? "text-white" : "text-gray-800"}`}>Document Templates</h1>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                        Design clearance documents with the HTML editor, or upload a pre-made PDF and set where each field is stamped.
                    </p>
                </div>
                <button onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition shadow">
                    <FiPlus className="w-4 h-4" /> New Template
                </button>
            </div>

            <div className="flex gap-5 flex-col lg:flex-row">

                {/* Sidebar */}
                <div className={`lg:w-60 shrink-0 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                    <div className={`px-4 py-3 border-b text-[10px] font-bold uppercase tracking-widest ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-100 text-gray-500"}`}>
                        Templates ({templates.length})
                    </div>
                    {templates.length === 0 ? (
                        <p className={`px-4 py-5 text-xs text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No templates yet.</p>
                    ) : (
                        <ul>
                            {templates.map(t => (
                                <li key={t.templateId}>
                                    <button onClick={() => { if (!isDirty || window.confirm("Discard changes?")) openTemplate(t); }}
                                        className={`w-full text-left flex items-center gap-2.5 px-4 py-3 transition
                                            ${selected?.templateId === t.templateId
                                                ? darkMode ? "bg-orange-900/30 text-orange-400" : "bg-orange-50 text-orange-700"
                                                : darkMode ? "hover:bg-[#222] text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}>
                                        {t.isDefault && <FiStar className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{t.name}</div>
                                            {t.pdfPath && <div className="text-[10px] text-orange-500 font-medium">PDF template</div>}
                                        </div>
                                        {selected?.templateId === t.templateId && <FiChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Editor panel */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* Hidden PDF input */}
                    <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfFile} />

                    {/* Action bar */}
                    <div className={`rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                        <input value={name} onChange={e => { setName(e.target.value); setIsDirty(true); }} placeholder="Template name…"
                            className={`flex-1 min-w-0 border-2 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-orange-400
                                ${darkMode ? "bg-[#222] border-gray-700 text-gray-100 placeholder-gray-600" : "bg-gray-50 border-gray-200 text-gray-900"}`} />

                        <Toast msg={msg} />

                        {/* Attach PDF button */}
                        <button onClick={() => pdfRef.current?.click()} disabled={pdfUploading}
                            title={selected?.pdfPath ? "Replace PDF" : "Attach a pre-made PDF"}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition
                                ${selected?.pdfPath
                                    ? darkMode ? "border-orange-700 text-orange-400 hover:bg-orange-900/20" : "border-orange-300 text-orange-600 hover:bg-orange-50"
                                    : darkMode ? "border-gray-700 text-gray-400 hover:text-orange-400 hover:border-orange-600" : "border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300"}`}>
                            {selected?.pdfPath ? <FiFileText className="w-4 h-4" /> : <FiUpload className="w-4 h-4" />}
                            {pdfUploading ? "Uploading…" : selected?.pdfPath ? "Replace PDF" : "Attach PDF"}
                        </button>

                        {selected && !selected.isDefault && (
                            <button onClick={handleSetDefault}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition
                                    ${darkMode ? "border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-600" : "border-gray-200 text-gray-500 hover:text-yellow-600 hover:border-yellow-400"}`}>
                                <FiStar className="w-4 h-4" /> Set Default
                            </button>
                        )}
                        {selected && (
                            <button onClick={() => setConfirmDel(true)} disabled={deleting}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition
                                    ${darkMode ? "border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-700" : "border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300"}`}>
                                <FiTrash2 className="w-4 h-4" /> Delete
                            </button>
                        )}
                        {!selected?.pdfPath && (
                            <button onClick={handleSave} disabled={saving || !isDirty}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition shadow">
                                <FiSave className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                            </button>
                        )}
                    </div>

                    {/* PDF panel */}
                    {selected?.pdfPath && accessToken && (
                        <PdfPanel
                            key={selected.templateId}
                            template={selected}
                            token={accessToken}
                            darkMode={darkMode}
                            onSaved={async () => {
                                const list = await loadTemplates();
                                const upd  = list.find(t => t.templateId === selected.templateId);
                                if (upd) await openTemplate(upd);
                            }}
                        />
                    )}

                    {/* HTML editor */}
                    {!selected?.pdfPath && (
                        <>
                            <RichEditor
                                key={selected?.templateId ?? "new"}
                                html={content}
                                onChange={v => { setContent(v); setIsDirty(true); }}
                                darkMode={darkMode}
                            />
                            <div className={`rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Variables</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {VARIABLES.map(v => (
                                        <span key={v.key} className="px-2 py-0.5 rounded text-[11px] font-mono bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                            {`{{${v.key}}}`}
                                        </span>
                                    ))}
                                </div>
                                <p className={`text-[11px] mt-2 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                                    Click a variable in the toolbar to insert it. To use a pre-made PDF instead, click <strong>Attach PDF</strong>.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete confirm modal */}
            {confirmDel && selected && (
                <DeleteModal
                    name={selected.name}
                    darkMode={darkMode}
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmDel(false)}
                />
            )}
        </div>
    );
}
