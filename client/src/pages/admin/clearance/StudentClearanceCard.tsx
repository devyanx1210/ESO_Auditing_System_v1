import type { PendingClearanceItem, ClearanceHistoryItem } from "../../../services/admin-student.service";

// Shared helpers

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}
function historyStatusLabel(s: number | null) {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing";
}

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

// Avatar

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
    const imgSrc = src ? (src.startsWith("http") ? src : src.startsWith("/uploads") ? src : `/uploads/${src}`) : null;
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0 relative`}>
            <DefaultAvatarSvg />
            {imgSrc && (
                <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
        </div>
    );
}

// Pending clearance table

export interface PendingClearanceTableProps {
    items: PendingClearanceItem[];
    selectedIds: Set<number>;
    allSelected: boolean;
    onToggleAll: () => void;
    onToggleOne: (id: number) => void;
    canSign: boolean;
    darkMode: boolean;
    onApprove: (item: PendingClearanceItem) => void;
}

export function PendingClearanceTable({
    items, selectedIds, allSelected,
    onToggleAll, onToggleOne,
    canSign, darkMode, onApprove,
}: PendingClearanceTableProps) {
    if (items.length === 0) {
        return (
            <div className={`rounded-xl p-10 text-center text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a] text-gray-400" : "bg-white text-gray-400"}`}>
                <p className={`font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>No pending approvals</p>
                <p>Students will appear here once all obligations are paid.</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
            <table className="eso-table w-full min-w-[700px] border-collapse">
                <thead className={darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-500"}>
                    <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                        <th className="pl-4 pr-2 py-2 w-8">
                            <input type="checkbox"
                                checked={allSelected}
                                onChange={onToggleAll}
                                className="w-4 h-4 accent-orange-500 cursor-pointer" />
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                        <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Student No.</th>
                        <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Program</th>
                        <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Year / Section</th>
                        <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Semester</th>
                        <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Obligations</th>
                        <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Printed</th>
                        {canSign && <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide">Action</th>}
                    </tr>
                </thead>
                <tbody>
                    {items.map((c, i) => (
                        <tr key={c.studentId}
                            style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.05}s` }}
                            className={`transition-colors ${darkMode ? "hover:bg-[#222]/50" : "hover:bg-gray-100"} ${
                                selectedIds.has(c.studentId)
                                    ? (darkMode ? "bg-[#222]/60" : "bg-gray-100")
                                    : i % 2 === 0
                                        ? (darkMode ? "bg-[#1a1a1a]" : "bg-white")
                                        : (darkMode ? "bg-[#1a1a1a]/60" : "bg-gray-50/70")
                            }`}>
                            <td className="pl-4 pr-2 py-2.5 w-8" onClick={e => e.stopPropagation()}>
                                <input type="checkbox"
                                    checked={selectedIds.has(c.studentId)}
                                    onChange={() => onToggleOne(c.studentId)}
                                    className="w-4 h-4 accent-orange-500 cursor-pointer" />
                            </td>
                            <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                    <UserAvatar size="sm" src={c.avatarPath} />
                                    <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                        {c.lastName}, {c.firstName}
                                    </div>
                                </div>
                            </td>
                            <td className={`px-3 py-2.5 text-center text-xs font-mono ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {c.studentNo}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                    {c.programName}
                                </span>
                            </td>
                            <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {c.yearLevel}-{c.section}
                            </td>
                            <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {c.schoolYear} · Sem {c.semester}
                            </td>
                            <td className={`px-3 py-2.5 text-center text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {c.obligationsPaid}/{c.obligationsTotal}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                {c.isPrinted
                                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">Printed</span>
                                    : <span className={`text-[10px] ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>}
                            </td>
                            {canSign && (
                                <td className="px-3 py-2.5 text-center">
                                    <button
                                        onClick={() => onApprove(c)}
                                        className="px-4 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold"
                                    >
                                        Approve
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// History table

export interface ClearanceHistoryTableProps {
    items: ClearanceHistoryItem[];
    selectedIds: Set<number>;
    allSelected: boolean;
    onToggleAll: () => void;
    onToggleOne: (id: number) => void;
    darkMode: boolean;
}

export function ClearanceHistoryTable({
    items, selectedIds, allSelected,
    onToggleAll, onToggleOne,
    darkMode,
}: ClearanceHistoryTableProps) {
    if (items.length === 0) {
        return (
            <div className={`rounded-xl p-10 text-center text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a] text-gray-400" : "bg-white text-gray-400"}`}>
                No approvals yet.
            </div>
        );
    }

    return (
        <div className={`rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
            <table className="eso-table w-full min-w-[700px] border-collapse">
                <thead className={darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-500"}>
                    <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                        <th className="pl-4 pr-2 py-2 w-8">
                            <input type="checkbox"
                                checked={allSelected}
                                onChange={onToggleAll}
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
                <tbody>
                    {items.map((h, i) => (
                        <tr key={h.clearanceId + h.signedAt}
                            style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.05}s` }}
                            className={`transition-colors cursor-pointer ${darkMode ? "hover:bg-[#222]/50" : "hover:bg-gray-100"} ${
                                selectedIds.has(h.clearanceId)
                                    ? (darkMode ? "bg-orange-900/30" : "bg-orange-50")
                                    : i % 2 === 0
                                        ? (darkMode ? "bg-[#1a1a1a]" : "bg-white")
                                        : (darkMode ? "bg-[#1a1a1a]/60" : "bg-gray-50/70")
                            }`}
                            onClick={() => onToggleOne(h.clearanceId)}>
                            <td className="pl-4 pr-2 py-2.5 w-8" onClick={e => e.stopPropagation()}>
                                <input type="checkbox"
                                    checked={selectedIds.has(h.clearanceId)}
                                    onChange={() => onToggleOne(h.clearanceId)}
                                    className="w-4 h-4 accent-orange-500 cursor-pointer" />
                            </td>
                            <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                    <UserAvatar size="sm" src={h.avatarPath} />
                                    <div>
                                        <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                            {h.lastName}, {h.firstName}
                                        </div>
                                        <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{h.studentNo}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-[#222] text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                    {programLabel(h.programCode)}
                                </span>
                            </td>
                            <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {h.yearLevel}-{h.section}
                            </td>
                            <td className={`px-3 py-2.5 text-center text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                {h.schoolYear} · Sem {h.semester}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                <div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{fmtDate(h.signedAt)}</div>
                                <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{fmtTime(h.signedAt)}</div>
                            </td>
                            <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>—</td>
                            <td className={`px-3 py-2.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {h.remarks ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                {h.isPrinted
                                    ? <div className="flex flex-col items-center gap-0.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">Printed</span>
                                        {h.printedAt && (
                                            <span className={`text-[9px] ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                                                {fmtDate(h.printedAt)}
                                            </span>
                                        )}
                                      </div>
                                    : <span className={`text-[10px] ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    h.clearanceStatus === 2 ? "bg-green-100 text-green-700"
                                    : h.clearanceStatus === 3 ? "bg-red-100 text-red-700"
                                    : h.clearanceStatus === 1 ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}>
                                    {historyStatusLabel(h.clearanceStatus)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
