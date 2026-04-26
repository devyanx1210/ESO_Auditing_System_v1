import React, { useEffect, useRef, useMemo, useState } from "react";
import { FiArchive } from "react-icons/fi";
import type { ObligationData, CreateObligationInput } from "../../../services/obligation.service";

// Constants shared with the modal

const DEPARTMENTS = [
    { id: 1, name: "Computer Engineering" },
    { id: 2, name: "Civil Engineering" },
    { id: 3, name: "Electronics Engineering" },
    { id: 4, name: "Electrical Engineering" },
    { id: 5, name: "Mechanical Engineering" },
];

const SCOPES = [
    { value: 0, label: "all" },
    { value: 1, label: "program" },
    { value: 2, label: "year level" },
    { value: 3, label: "section" },
] as const;

// School year dropdown with free-text entry

function generateSchoolYears(center: number, range = 8): string[] {
    const years: string[] = [];
    for (let y = center - range; y <= center + range; y++) {
        years.push(`${y}-${y + 1}`);
    }
    return years;
}

interface SchoolYearComboboxProps {
    value: string;
    onChange: (v: string) => void;
}

function SchoolYearCombobox({ value, onChange }: SchoolYearComboboxProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentYear = new Date().getFullYear();

    const allOptions = useMemo(() => generateSchoolYears(currentYear, 8), [currentYear]);

    const filtered = useMemo(() => {
        const q = value.trim().toLowerCase();
        if (!q) return allOptions;
        return allOptions.filter(y => y.includes(q));
    }, [value, allOptions]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <input
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 w-full text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                placeholder="e.g. 2024-2025"
                value={value}
                autoComplete="off"
                onFocus={() => setOpen(true)}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
            />
            {open && filtered.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-y-auto max-h-48
                    bg-white dark:bg-[#2a2a2a] shadow-[0_8px_32px_rgba(0,0,0,0.18)]
                    ring-1 ring-black/5 text-sm">
                    {filtered.map(y => (
                        <li key={y}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { onChange(y); setOpen(false); }}
                            className={`px-3 py-2 cursor-pointer transition-colors
                                ${value === y
                                    ? "bg-orange-500 text-white"
                                    : "text-gray-800 dark:text-gray-100 hover:bg-orange-50 dark:hover:bg-orange-500/10"}`}>
                            {y}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Props

export interface ObligationFormModalProps {
    editing: ObligationData | null;
    form: CreateObligationInput;
    requiresPayment: boolean;
    qrFile: File | null;
    qrPreview: string | null;
    saving: boolean;
    formError: string;
    onChangeForm: (f: CreateObligationInput) => void;
    onTogglePayment: () => void;
    onQrChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onQrRemove: () => void;
    onSave: () => void;
    onArchive: (id: number) => void;
    onClose: () => void;
}

export function ObligationFormModal({
    editing,
    form,
    requiresPayment,
    qrFile,
    qrPreview,
    saving,
    formError,
    onChangeForm,
    onTogglePayment,
    onQrChange,
    onQrRemove,
    onSave,
    onArchive,
    onClose,
}: ObligationFormModalProps) {
    const qrInputRef = useRef<HTMLInputElement>(null);

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[88vh] sm:max-h-[90vh] overflow-y-auto"
                style={{ animation: "fadeInUp 0.2s ease both" }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-base sm:text-xl text-gray-800 dark:text-gray-100">
                        {editing ? "Edit Obligation" : "Add Obligation"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="px-4 sm:px-6 py-3 sm:py-5">
                    {formError && (
                        <p className="text-red-500 text-xs sm:text-sm mb-3">{formError}</p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4">

                        <div className="col-span-2">
                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Obligation Name *
                            </label>
                            <input
                                className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                placeholder="e.g. ESO T-Shirt Fee"
                                value={form.obligationName}
                                onChange={e => onChangeForm({ ...form, obligationName: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Description
                            </label>
                            <textarea
                                className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors resize-none bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                rows={3}
                                placeholder="Optional details..."
                                value={form.description ?? ""}
                                onChange={e => onChangeForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <div
                                    onClick={onTogglePayment}
                                    className={`relative w-9 h-5 sm:w-11 sm:h-6 rounded-full transition-colors ${requiresPayment ? "bg-primary" : "bg-gray-300"}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${requiresPayment ? "translate-x-4 sm:translate-x-5" : "translate-x-0"}`} />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Payment Required
                                </span>
                            </label>
                        </div>

                        {requiresPayment && (
                            <>
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Amount (₱) *
                                    </label>
                                    <input
                                        type="number" step="0.01" min="0.01"
                                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                        value={form.amount || ""}
                                        onChange={e => onChangeForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                        GCash QR Code
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => qrInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors text-left"
                                    >
                                        {qrFile ? qrFile.name : "Upload QR image"}
                                    </button>
                                    <input
                                        ref={qrInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        className="hidden"
                                        onChange={onQrChange}
                                    />
                                    {qrPreview && (
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <img src={qrPreview} alt="QR Preview" className="w-14 h-14 sm:w-20 sm:h-20 object-contain border-2 border-gray-200 rounded" />
                                            <button
                                                type="button"
                                                onClick={onQrRemove}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100"
                                value={form.dueDate ?? ""}
                                onChange={e => onChangeForm({ ...form, dueDate: e.target.value || null })}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                School Year *
                            </label>
                            <SchoolYearCombobox
                                value={form.schoolYear}
                                onChange={v => onChangeForm({ ...form, schoolYear: v })}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Semester *
                            </label>
                            <select
                                className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                value={form.semester}
                                onChange={e => onChangeForm({ ...form, semester: Number(e.target.value) })}
                            >
                                <option value={1}>1st</option>
                                <option value={2}>2nd</option>
                                <option value={3}>Summer</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Scope *
                            </label>
                            <select
                                className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                value={form.scope}
                                onChange={e => onChangeForm({
                                    ...form,
                                    scope: Number(e.target.value),
                                    programId: null,
                                    yearLevel: null,
                                    section: null,
                                })}
                            >
                                {SCOPES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 flex items-center gap-2.5">
                            <input
                                type="checkbox" id="isRequired"
                                checked={form.isRequired}
                                onChange={e => onChangeForm({ ...form, isRequired: e.target.checked })}
                                className="w-4 h-4 accent-orange-500 shrink-0"
                            />
                            <label htmlFor="isRequired" className={`text-xs sm:text-sm font-semibold ${form.isRequired ? "text-orange-600" : "text-gray-500"}`}>
                                Required obligation
                            </label>
                            {form.isRequired && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-300">
                                    Required
                                </span>
                            )}
                        </div>

                        {(form.scope === 1 || form.scope === 2 || form.scope === 3) && (
                            <div>
                                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Program
                                </label>
                                <select
                                    className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                    value={form.programId ?? ""}
                                    onChange={e => onChangeForm({ ...form, programId: e.target.value ? Number(e.target.value) : null })}
                                >
                                    <option value="">All Programs</option>
                                    {DEPARTMENTS.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {(form.scope === 2 || form.scope === 3) && (
                            <div>
                                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Year Level
                                </label>
                                <select
                                    className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 transition-colors"
                                    value={form.yearLevel ?? ""}
                                    onChange={e => onChangeForm({ ...form, yearLevel: e.target.value ? Number(e.target.value) : null })}
                                >
                                    <option value="">Any</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                        )}

                        {(form.scope === 2 || form.scope === 3) && (
                            <div>
                                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Section
                                </label>
                                <input
                                    className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 w-full text-xs sm:text-sm transition-colors bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500"
                                    placeholder="e.g. A"
                                    value={form.section ?? ""}
                                    onChange={e => onChangeForm({ ...form, section: e.target.value || null })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="bg-primary text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg disabled:opacity-60 font-semibold text-xs sm:text-sm"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                        {editing && (
                            <button
                                onClick={() => onArchive(editing.obligationId)}
                                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition font-medium text-xs sm:text-sm border border-amber-200"
                            >
                                <FiArchive className="w-3.5 h-3.5" /> Archive
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
