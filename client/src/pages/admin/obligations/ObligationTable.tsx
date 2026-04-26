import React from "react";
import { qrUrl } from "../../../services/obligation.service";
import type { ObligationData } from "../../../services/obligation.service";

const SCOPE_LABELS: Record<number, string> = { 0: "all", 1: "program", 2: "year level", 3: "section" };
const SEMESTER_LABELS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "Summer" };

export interface ObligationTableProps {
    rows: ObligationData[];
    selected: Set<number>;
    onToggleOne: (id: number) => void;
    onToggleAll: () => void;
    actionSlot: (o: ObligationData) => React.ReactNode;
    syncing?: number | null;
}

export function ObligationTable({ rows, selected, onToggleOne, onToggleAll, actionSlot }: ObligationTableProps) {
    return (
        <div className="rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-x-auto">
            <table className="eso-table w-full text-[11px] border-collapse bg-white dark:bg-[#1a1a1a]" style={{ minWidth: 1000 }}>
                <thead className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400">
                    <tr>
                        <th className="col-check py-2 w-8 shrink-0">
                            <input
                                type="checkbox"
                                checked={rows.length > 0 && selected.size === rows.length}
                                onChange={onToggleAll}
                                className="w-3.5 h-3.5 accent-orange-500 cursor-pointer"
                            />
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ minWidth: 160 }}>Name</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Payment</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Scope</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Program</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Yr/Sec</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">School Year</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Sem</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Due Date</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">GCash QR</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Created By</th>
                        <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((o, i) => (
                        <tr
                            key={o.obligationId}
                            style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.05}s` }}
                            className={`transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10 ${
                                selected.has(o.obligationId)
                                    ? "bg-orange-50 dark:bg-orange-500/10"
                                    : i % 2 === 0
                                        ? "bg-white dark:bg-[#1a1a1a]"
                                        : "bg-gray-50/70 dark:bg-[#222]"
                            }`}
                        >
                            <td className="col-check py-2" onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selected.has(o.obligationId)}
                                    onChange={() => onToggleOne(o.obligationId)}
                                    className="w-3.5 h-3.5 accent-orange-500 cursor-pointer"
                                />
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100 max-w-[200px] truncate" title={o.obligationName}>
                                {o.obligationName}
                            </td>
                            <td className="px-2 py-2 text-center">
                                {o.amount > 0
                                    ? <span className="font-semibold text-gray-800 dark:text-gray-100">₱{Number(o.amount).toFixed(2)}</span>
                                    : <span className="text-gray-400 dark:text-gray-500">—</span>}
                            </td>
                            <td className="px-2 py-2 text-center capitalize dark:text-gray-300">
                                {SCOPE_LABELS[o.scope] ?? String(o.scope)}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                                {o.programName ?? "—"}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                                {o.yearLevel != null ? `${o.yearLevel}${o.section ?? ""}` : "—"}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                                {o.schoolYear}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                                {SEMESTER_LABELS[o.semester] ?? String(o.semester)}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                                {o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-2 py-2 text-center">
                                {o.gcashQrPath
                                    ? <a href={qrUrl(o.gcashQrPath)} target="_blank" rel="noreferrer" className="text-primary underline">View</a>
                                    : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-2 py-2 text-center">
                                <div className="font-medium text-gray-700 dark:text-gray-200 leading-tight">
                                    {o.createdByName ?? "—"}
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}
                                </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                                <div className="flex justify-center items-center gap-0.5">
                                    {actionSlot(o)}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
