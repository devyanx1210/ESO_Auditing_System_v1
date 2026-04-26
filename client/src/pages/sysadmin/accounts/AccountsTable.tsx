import { FiTrash2, FiEdit2, FiUsers, FiArchive } from "react-icons/fi";
import type { Account } from "./EditAccountModal";

// Avatar

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

function UserAvatar() {
    return (
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            <DefaultAvatarSvg />
        </div>
    );
}

// Shared header cell classes
const thCls    = "px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide";
const thCtrCls = "px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide";

// Props

export interface AccountsTableProps {
    tab:             "active" | "archived";
    loading:         boolean;
    activeAccounts:  Account[];
    archivedAccounts: Account[];
    filterAndSort:   (list: Account[]) => Account[];
    selected:        Set<number>;
    allSelected:     boolean;
    toggleAll:       () => void;
    toggleOne:       (id: number) => void;
    onEdit:          (a: Account) => void;
    onSuspend:       (targets: Account[]) => void;
    onArchive:       (a: Account) => void;
    onActivate:      (userId: number) => void;
    onDelete:        (a: Account) => void;
}

export default function AccountsTable({
    tab, loading,
    activeAccounts, archivedAccounts,
    filterAndSort,
    selected, allSelected, toggleAll, toggleOne,
    onEdit, onSuspend, onArchive, onActivate, onDelete,
}: AccountsTableProps) {

    // Active tab
    if (tab === "active") {
        if (loading) {
            return (
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex items-center gap-2 text-gray-400 text-sm py-10 justify-center"
                    style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent" />
                    Loading accounts...
                </div>
            );
        }

        if (activeAccounts.length === 0) {
            return (
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] text-center py-12 text-gray-400"
                    style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                    <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-500">No active accounts</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden"
                style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                <div className="overflow-x-auto">
                    <table className="eso-table w-full min-w-[860px] text-xs">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500">
                                <th className="px-3 py-2 w-10">
                                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                        className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                </th>
                                <th className={thCls}>Name</th>
                                <th className={thCls}>Email</th>
                                <th className={thCls}>Role</th>
                                <th className={thCls}>Program</th>
                                <th className={thCls}>Position</th>
                                <th className={thCtrCls}>Status</th>
                                <th className={thCtrCls}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filterAndSort(activeAccounts).map((a, i) => (
                                <tr key={a.user_id}
                                    style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.04}s` }}
                                    className={`transition-colors hover:bg-orange-50 ${
                                        selected.has(a.user_id) ? "bg-orange-50"
                                        : i % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                                    }`}>
                                    <td className="px-3 py-2.5">
                                        {a.role_name !== "system_admin" && (
                                            <input type="checkbox" checked={selected.has(a.user_id)}
                                                onChange={() => toggleOne(a.user_id)}
                                                className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <UserAvatar />
                                            <span className="font-medium text-gray-800 whitespace-nowrap">
                                                {a.last_name}, {a.first_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 text-xs">{a.email}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="px-2.5 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-semibold whitespace-nowrap">
                                            {a.role_label}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                                        {a.program_name ?? <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                                        {a.position ?? <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />Active
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button onClick={() => onEdit(a)}
                                                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit account">
                                                <FiEdit2 className="w-3.5 h-3.5" />
                                            </button>
                                            {a.role_name !== "system_admin" && (
                                                <>
                                                    <button onClick={() => onSuspend([a])}
                                                        className="px-2.5 py-1.5 text-xs rounded-lg font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition">
                                                        Suspend
                                                    </button>
                                                    <button onClick={() => onArchive(a)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Archived tab
    if (archivedAccounts.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] text-center py-10 text-gray-400"
                style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                <FiArchive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No archived accounts yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden"
            style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
            <div className="overflow-x-auto">
                <table className="eso-table w-full min-w-[780px] text-xs">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500">
                            <th className="px-3 py-2 w-10">
                                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                    className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                            </th>
                            <th className={thCls}>Name</th>
                            <th className={thCls}>Email</th>
                            <th className={thCls}>Role</th>
                            <th className={thCls}>Program</th>
                            <th className={thCls}>Position</th>
                            <th className={thCtrCls}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filterAndSort(archivedAccounts).map((a, i) => (
                            <tr key={a.user_id}
                                style={{ animation: "fadeInUp 0.3s ease both", animationDelay: `${i * 0.04}s` }}
                                className={`transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}`}>
                                <td className="px-3 py-2.5">
                                    <input type="checkbox" checked={selected.has(a.user_id)}
                                        onChange={() => toggleOne(a.user_id)}
                                        className="rounded border-gray-300 accent-orange-500 cursor-pointer" />
                                </td>
                                <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <UserAvatar />
                                        <span className="font-medium text-gray-500 whitespace-nowrap">
                                            {a.last_name}, {a.first_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-gray-400 text-xs">{a.email}</td>
                                <td className="px-3 py-2.5">
                                    <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-500 font-semibold whitespace-nowrap">
                                        {a.role_label}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-gray-400 text-xs">
                                    {a.program_name ?? <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-3 py-2.5 text-gray-400 text-xs">
                                    {a.position ?? <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-3 py-2.5">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => onActivate(a.user_id)}
                                            className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                                            Activate
                                        </button>
                                        <button onClick={() => onDelete(a)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
