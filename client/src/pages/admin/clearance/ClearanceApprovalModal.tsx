import React, { useState } from "react";
import { FiPrinter, FiX } from "react-icons/fi";
import { adminStudentService } from "../../../services/admin-student.service";
import type { PendingClearanceItem } from "../../../services/admin-student.service";
import type { DocumentTemplate } from "../../../services/document.service";

// Status label for display in the sign modal

function statusLabel(s: number | null) {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing";
}

// Sign / approve modal

export interface SignClearanceModalProps {
    student: PendingClearanceItem;
    token: string;
    onClose: () => void;
    onDone: () => void;
}

export function SignClearanceModal({ student, token, onClose, onDone }: SignClearanceModalProps) {
    const [remarks, setRemarks] = useState("");
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await adminStudentService.signClearance(token, student.studentId, remarks);
            onDone();
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6"
                style={{ animation: "fadeInUp 0.2s ease both" }}>
                <h3 className="font-bold text-gray-800 text-lg mb-1">Approve Clearance</h3>
                <p className="text-sm text-gray-600 font-medium mb-0.5">{student.lastName}, {student.firstName}</p>
                <p className="text-xs text-gray-400 mb-4">
                    {student.studentNo} · {student.programCode} · {student.schoolYear} Sem {student.semester}
                </p>
                <div className="flex gap-6 mb-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400">Obligations</p>
                        <p className="font-semibold text-gray-800">
                            {student.obligationsPaid} / {student.obligationsTotal} completed
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Clearance</p>
                        <p className="font-semibold text-gray-800">
                            {statusLabel(student.clearanceStatus) ?? "Not Started"}
                        </p>
                    </div>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <textarea
                        rows={2}
                        placeholder="Remarks (optional)"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                    />
                    {err && <p className="text-red-500 text-sm">{err}</p>}
                    <div className="flex justify-between gap-3 mt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">
                            Cancel
                        </button>
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

// Print all approved modal

export interface PrintClearanceModalProps {
    templates: DocumentTemplate[];
    templateId: number | null;
    onTemplateChange: (id: number) => void;
    schoolYear: string;
    onSchoolYearChange: (v: string) => void;
    semester: string;
    onSemesterChange: (v: string) => void;
    printing: boolean;
    onPrint: () => void;
    onClose: () => void;
    darkMode: boolean;
}

export function PrintClearanceModal({
    templates, templateId, onTemplateChange,
    schoolYear, onSchoolYearChange,
    semester, onSemesterChange,
    printing, onPrint, onClose,
    darkMode,
}: PrintClearanceModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}>
            <div
                className={`relative rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-sm p-5
                    ${darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-900"}`}
                style={{ animation: "fadeInUp 0.2s ease both" }}
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose}
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
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Template
                        </label>
                        <select
                            value={templateId ?? ""}
                            onChange={e => onTemplateChange(Number(e.target.value))}
                            className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400
                                ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                        >
                            {templates.length === 0
                                ? <option value="">No templates — create one in Documents</option>
                                : templates.map(t => (
                                    <option key={t.templateId} value={t.templateId}>
                                        {t.isDefault ? "[Default] " : ""}{t.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            School Year <span className="font-normal opacity-60">(optional)</span>
                        </label>
                        <input
                            value={schoolYear}
                            onChange={e => onSchoolYearChange(e.target.value)}
                            placeholder="e.g. 2024-2025"
                            className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400
                                ${darkMode ? "bg-[#222] border-gray-600 text-gray-100 placeholder-gray-600" : "bg-white border-gray-200"}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Semester <span className="font-normal opacity-60">(optional)</span>
                        </label>
                        <select
                            value={semester}
                            onChange={e => onSemesterChange(e.target.value)}
                            className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400
                                ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                        >
                            <option value="">All Semesters</option>
                            <option value="1">1st Semester</option>
                            <option value="2">2nd Semester</option>
                            <option value="3">Summer</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
                    <button type="button" onClick={onClose}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium transition
                            ${darkMode ? "bg-[#333] text-gray-300 hover:bg-[#3a3a3a]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                        Cancel
                    </button>
                    <button type="button" onClick={onPrint} disabled={printing || !templateId}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                        <FiPrinter className="w-4 h-4 shrink-0" />
                        {printing ? "Loading..." : "Print Preview"}
                    </button>
                </div>
            </div>
        </div>
    );
}
