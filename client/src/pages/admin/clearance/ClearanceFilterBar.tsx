import React, { useRef, useEffect } from "react";
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";

const PROGRAMS_LIST = [
    { code: "CpE", name: "Computer Engineering" },
    { code: "CE",  name: "Civil Engineering" },
    { code: "ECE", name: "Electronics Engineering" },
    { code: "EE",  name: "Electrical Engineering" },
    { code: "ME",  name: "Mechanical Engineering" },
];

export interface ClearanceFilterBarProps {
    search: string;
    onSearchChange: (v: string) => void;
    programFilter: string;
    onProgramFilterChange: (v: string) => void;
    statusFilter: string;
    onStatusFilterChange: (v: string) => void;
    activeResultCount: number;
    darkMode: boolean;
}

export function ClearanceFilterBar({
    search, onSearchChange,
    programFilter, onProgramFilterChange,
    statusFilter, onStatusFilterChange,
    activeResultCount,
    darkMode,
}: ClearanceFilterBarProps) {
    const [showFilters, setShowFilters] = React.useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const activeFilterCount = [programFilter !== "all", statusFilter !== "all"].filter(Boolean).length;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(e.target as Node))
                setShowFilters(false);
        }
        if (showFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFilters]);

    return (
        <div className="flex items-center gap-2 mb-4">
            {/* Search input */}
            <div className="relative flex-1 max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by student name or number..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    className={`border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full shadow-sm
                        ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"}`}
                />
            </div>

            {/* Filter dropdown */}
            <div className="relative" ref={filterRef}>
                <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm
                        ${showFilters || activeFilterCount > 0 ? "bg-orange-500 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                >
                    <FiFilter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                            {activeFilterCount}
                        </span>
                    )}
                    {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                </button>

                {showFilters && (
                    <div className={`absolute right-0 top-full mt-2 z-30 rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-64 flex flex-col gap-3
                        ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Filter</p>

                        <div>
                            <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Program
                            </label>
                            <select
                                value={programFilter}
                                onChange={e => onProgramFilterChange(e.target.value)}
                                className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                    ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                            >
                                <option value="all">All Programs</option>
                                {PROGRAMS_LIST.map(p => (
                                    <option key={p.code} value={p.code}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={e => onStatusFilterChange(e.target.value)}
                                className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                    ${darkMode ? "bg-[#222] border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                            >
                                <option value="all">All Status</option>
                                <option value="processing">Processing</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => { onProgramFilterChange("all"); onStatusFilterChange("all"); }}
                                className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Result count badge */}
            <span className={`hidden sm:flex items-center text-xs font-medium px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm border
                ${darkMode ? "bg-[#1a1a1a] border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-400"}`}>
                {activeResultCount} result{activeResultCount !== 1 ? "s" : ""}
            </span>
        </div>
    );
}
