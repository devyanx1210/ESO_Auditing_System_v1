import React from "react";
import { FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";

const DEPARTMENTS = [
    { id: 1, name: "Computer Engineering" },
    { id: 2, name: "Civil Engineering" },
    { id: 3, name: "Electronics Engineering" },
    { id: 4, name: "Electrical Engineering" },
    { id: 5, name: "Mechanical Engineering" },
];

export interface ObligationFilterPanelProps {
    tab: "active" | "archived";
    search: string;
    sortOption: string;
    filterPayment: "all" | "required" | "free";
    filterProgram: number | null;
    showFilter: boolean;
    filterRef: React.RefObject<HTMLDivElement | null>;
    selectedObCount: number;
    selectedArchiveCount: number;
    onSearchChange: (v: string) => void;
    onSortChange: (v: string) => void;
    onFilterPaymentChange: (v: "all" | "required" | "free") => void;
    onFilterProgramChange: (v: number | null) => void;
    onToggleFilter: () => void;
    onClearFilters: () => void;
    onBulkArchive: () => void;
    onBulkRestore: () => void;
    onBulkDelete: () => void;
    onOpenAdd: () => void;
}

export function ObligationFilterPanel({
    tab,
    search,
    sortOption,
    filterPayment,
    filterProgram,
    showFilter,
    filterRef,
    selectedObCount,
    selectedArchiveCount,
    onSearchChange,
    onSortChange,
    onFilterPaymentChange,
    onFilterProgramChange,
    onToggleFilter,
    onClearFilters,
    onBulkArchive,
    onBulkRestore,
    onBulkDelete,
    onOpenAdd,
}: ObligationFilterPanelProps) {
    const activeFilterCount = (filterPayment !== "all" ? 1 : 0) + (filterProgram !== null ? 1 : 0);

    return (
        <div className="flex flex-row flex-wrap gap-3 mb-6 items-center">
            <input
                className="border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100 dark:placeholder-gray-500 shadow-sm flex-1 min-w-[180px] max-w-xs"
                placeholder={tab === "active" ? "Search obligations..." : "Search archive..."}
                value={search}
                onChange={e => onSearchChange(e.target.value)}
            />

            <div className="flex gap-2 flex-wrap items-center">

                {/* Active tab: bulk archive + add */}
                {tab === "active" && (
                    <>
                        {selectedObCount > 0 && (
                            <button onClick={onBulkArchive}
                                className="relative px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition">
                                Archive
                                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-amber-600 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-amber-200">
                                    {selectedObCount}
                                </span>
                            </button>
                        )}
                        <button onClick={onOpenAdd} className="bg-primary text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition flex items-center gap-1.5">
                            <span className="text-base leading-none">+</span>
                            <span className="hidden sm:inline">Add Obligation</span>
                        </button>
                    </>
                )}

                {/* Archive tab: bulk restore + delete */}
                {tab === "archived" && selectedArchiveCount > 0 && (
                    <>
                        <button onClick={onBulkRestore}
                            className="relative px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition">
                            Restore
                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-green-600 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-green-200">
                                {selectedArchiveCount}
                            </span>
                        </button>
                        <button onClick={onBulkDelete}
                            className="relative px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">
                            Delete
                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-red-200">
                                {selectedArchiveCount}
                            </span>
                        </button>
                    </>
                )}

                {/* Filter/sort dropdown */}
                <div ref={filterRef} className="relative">
                    <button
                        onClick={onToggleFilter}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm ${
                            showFilter || activeFilterCount > 0
                                ? "bg-primary text-white"
                                : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}
                    >
                        <FiFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Sort &amp; Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilter ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {showFilter && (
                        <div className="absolute right-0 sm:right-0 top-full mt-2 z-30 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl ring-1 ring-black/5 p-4 w-72 max-w-[calc(100vw-2rem)] flex flex-col gap-3"
                            style={{ animation: "fadeInUp 0.15s ease both" }}>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sort &amp; Filter</p>

                            {tab === "active" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sort by</label>
                                        <select value={sortOption} onChange={e => onSortChange(e.target.value)}
                                            className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                            <option value="newest">Newest</option>
                                            <option value="az">Name A–Z</option>
                                            <option value="amount-high">Amount (High to Low)</option>
                                            <option value="amount-low">Amount (Low to High)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Payment</label>
                                        <select value={filterPayment} onChange={e => onFilterPaymentChange(e.target.value as any)}
                                            className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                            <option value="all">All</option>
                                            <option value="required">Required</option>
                                            <option value="free">Free</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Program</label>
                                <select value={filterProgram ?? ""} onChange={e => onFilterProgramChange(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#2a2a2a] dark:text-gray-100">
                                    <option value="">All Programs</option>
                                    {DEPARTMENTS.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {(activeFilterCount > 0 || sortOption !== "newest") && (
                                <button
                                    onClick={onClearFilters}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
