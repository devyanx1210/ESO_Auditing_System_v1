import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUsers,
    FaCheckCircle,
    FaDollarSign,
    FaMoneyBillWave,
    FaChartBar,
    FaClipboardList,
    FaFilter,
    FaChevronDown,
} from "react-icons/fa";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useAuth } from "../../hooks/useAuth";

import { dashboardService } from "../../services/dashboard.service";
import type { DashboardStats } from "../../services/dashboard.service";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatPhp(amount: number): string {
    return "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getOrdinal(n: number): string {
    const labels: Record<number, string> = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year", 5: "5th Year" };
    return labels[n] ?? `${n}th Year`;
}

// ─── Program Dropdown ─────────────────────────────────────────────────────────

interface ProgramOption { programId: number; name: string; }
interface ProgramDropdownProps {
    programs: ProgramOption[];
    value: number | "";
    onChange: (val: number | "") => void;
    darkMode: boolean;
}

function ProgramDropdown({ programs, value, onChange, darkMode }: ProgramDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = programs.find(p => p.programId === value);
    const label = selected ? selected.name : "All Programs";

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const options: Array<{ id: number | ""; name: string }> = [
        { id: "", name: "All Programs" },
        ...programs.map(p => ({ id: p.programId, name: p.name })),
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium
                    transition-all duration-200 shadow-sm
                    ${open
                        ? "bg-orange-500 text-white shadow-[0_4px_16px_rgba(234,88,12,0.4)]"
                        : darkMode
                            ? "bg-gray-800 border border-gray-700 text-white hover:border-orange-500"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-orange-400"
                    }
                `}
            >
                <FaFilter className={`text-[10px] shrink-0 ${open ? "text-white" : "text-orange-500"}`} />
                <span className="truncate max-w-[120px] sm:max-w-[180px]">{label}</span>
                <FaChevronDown className={`text-[10px] shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-white" : "text-orange-500"}`} />
            </button>

            <div className={`
                absolute right-0 top-full mt-2 z-30
                w-48 sm:w-auto sm:min-w-[220px] sm:max-w-[300px]
                rounded-2xl overflow-hidden
                ${darkMode ? "bg-gray-800 shadow-[0_16px_48px_rgba(0,0,0,0.6)]" : "bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)]"}
                transition-all duration-200 origin-top-right
                ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}
            `}>
                <div className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest
                    ${darkMode ? "text-gray-500 border-b border-gray-700" : "text-gray-400 border-b border-gray-100"}`}>
                    Filter by Program
                </div>
                <div className="py-1 max-h-56 overflow-y-auto">
                    {options.map(opt => (
                        <button
                            key={String(opt.id)}
                            onClick={() => { onChange(opt.id); setOpen(false); }}
                            className={`
                                w-full flex items-center gap-2 px-3 py-2 text-xs text-left
                                transition-colors duration-150
                                ${opt.id === value
                                    ? "bg-orange-500 text-white font-semibold"
                                    : darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-orange-50"}
                            `}
                        >
                            <span className="truncate">{opt.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type CardKey = "registered" | "verified" | "collect" | "payments";

interface StatCardProps {
    cardKey: CardKey;
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ReactNode;
    active: boolean;
    darkMode: boolean;
    animDelay?: number;
    onClick: () => void;
}

function StatCard({ title, value, subtitle, icon, active, darkMode, animDelay = 0, onClick }: StatCardProps) {
    return (
        <div
            onClick={onClick}
            style={{ animationDelay: `${animDelay}ms` }}
            className={`anim-card-pop rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3
                cursor-pointer transition-all duration-200
                ${active
                    ? "bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_12px_32px_rgba(234,88,12,0.50)] text-white"
                    : `shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)]
                       ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`
                }
            `}
        >
            <div className="flex justify-between items-start gap-2">
                <p className={`text-[9px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wide leading-snug
                    ${active ? "text-white/75" : darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {title}
                </p>
                <span className={`text-base sm:text-lg lg:text-xl shrink-0 ${active ? "text-white" : "text-orange-500"}`}>
                    {icon}
                </span>
            </div>
            <div>
                <p className={`text-xl sm:text-2xl lg:text-[1.75rem] leading-tight font-black tracking-tight
                    ${active ? "text-white" : ""}`}>
                    {value}
                </p>
                {subtitle && (
                    <p className={`text-[9px] sm:text-[10px] lg:text-xs mt-0.5 line-clamp-2
                        ${active ? "text-white/70" : darkMode ? "text-gray-400" : "text-gray-400"}`}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { user, accessToken } = useAuth();
    const darkMode = false;
    const navigate = useNavigate();

    const [loading, setLoading]                       = useState(true);
    const [error, setError]                           = useState("");
    const [stats, setStats]                           = useState<DashboardStats | null>(null);
    const [selectedProgram, setSelectedProgram]       = useState<number | "">("");
    const [activeCard, setActiveCard]                 = useState<CardKey>("registered");

    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!accessToken) return;
        dashboardService
            .getStats(accessToken)
            .then(data => setStats(data))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    const isClassOfficer   = user?.role === "class_officer";
    const isProgramHead    = user?.role === "program_head";
    const canFilterProgram = !isClassOfficer && !isProgramHead;

    const filteredProgram = selectedProgram !== "" && stats
        ? stats.programs.find(p => p.programId === selectedProgram) ?? null
        : null;

    const displayRegistered = filteredProgram ? filteredProgram.totalStudents        : (stats?.totalRegisteredStudents ?? 0);
    const displayVerified   = filteredProgram ? filteredProgram.verifiedStudents      : (stats?.totalVerifiedStudents   ?? 0);
    const displayTotal      = filteredProgram ? filteredProgram.totalStudents        : (stats?.totalRegisteredStudents  ?? 0);
    const displayCollect    = filteredProgram ? filteredProgram.totalAmountToCollect  : (stats?.totalAmountToCollect    ?? 0);
    const displayPayments   = filteredProgram ? filteredProgram.totalApprovedPayments : (stats?.totalApprovedPayments   ?? 0);

    // ─── Chart data ───────────────────────────────────────────────────────────
    const chartLabels: string[]      = [];
    const chartValues: number[]      = [];
    const chartTotalValues: number[] = [];

    if (filteredProgram) {
        for (const yl of filteredProgram.yearLevelBreakdown) {
            chartLabels.push(getOrdinal(yl.yearLevel));
            chartValues.push(yl.verifiedStudents);
            chartTotalValues.push(yl.totalStudents);
        }
    } else if (stats) {
        for (const p of stats.programs) {
            chartLabels.push(p.name);
            chartValues.push(p.verifiedStudents);
            chartTotalValues.push(p.totalStudents);
        }
    }

    const totalVerifiedInChart = chartValues.reduce((a, b) => a + b, 0);
    const totalInChart         = chartTotalValues.reduce((a, b) => a + b, 0);
    const overallRate          = totalInChart > 0 ? Math.round((totalVerifiedInChart / totalInChart) * 100) : 0;
    const barData = {
        labels: chartLabels,
        datasets: [
            {
                label: "Registered Students",
                data: chartTotalValues,
                backgroundColor: darkMode ? "#4B5563" : "#CBD5E1",
                borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                maxBarThickness: 56,
                categoryPercentage: 0.75,
                barPercentage: 0.85,
                order: 2,
            },
            {
                label: "Verified Clearances",
                data: chartValues,
                backgroundColor: (context: any) => {
                    const { chart } = context;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return "#f97316";
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, "#fb923c");
                    gradient.addColorStop(1, "#c2410c");
                    return gradient;
                },
                borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                maxBarThickness: 56,
                categoryPercentage: 0.75,
                barPercentage: 0.85,
                order: 1,
            },
        ],
    };

    const barOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 600,
            easing: "easeInOutQuart",
            delay: (context: any) => {
                if (context.type === "data" && context.mode === "default") return context.dataIndex * 100;
                return 0;
            },
        },
        layout: { padding: { top: 4, bottom: 0, left: 0, right: 0 } },
        plugins: {
            legend: {
                display: true,
                position: "top" as const,
                align: "end" as const,
                labels: {
                    color: darkMode ? "#9CA3AF" : "#6B7280",
                    font: { size: 10, family: "inherit" },
                    boxWidth: 9,
                    boxHeight: 9,
                    borderRadius: 3,
                    useBorderRadius: true,
                    padding: 12,
                },
            },
            tooltip: {
                backgroundColor: darkMode ? "#1F2937" : "#ffffff",
                titleColor: darkMode ? "#F9FAFB" : "#111827",
                bodyColor: darkMode ? "#D1D5DB" : "#374151",
                borderColor: darkMode ? "#374151" : "#E5E7EB",
                borderWidth: 1,
                padding: 10,
                cornerRadius: 10,
                displayColors: true,
                boxWidth: 9,
                boxHeight: 9,
                callbacks: {
                    label: (item: any) => {
                        const total = chartTotalValues[item.dataIndex] ?? 0;
                        if (item.dataset.label === "Verified Clearances") {
                            const pct = total > 0 ? Math.round((item.raw / total) * 100) : 0;
                            return `  Verified: ${item.raw} (${pct}%)`;
                        }
                        return `  Registered: ${item.raw}`;
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: { color: darkMode ? "#9CA3AF" : "#6B7280", maxRotation: 30, font: { size: 9, family: "inherit" } },
                grid: { display: false },
                border: { display: false },
            },
            y: {
                ticks: { color: darkMode ? "#9CA3AF" : "#9CA3AF", font: { size: 9, family: "inherit" }, stepSize: 1, padding: 6 },
                grid: { color: darkMode ? "rgba(55,65,81,0.6)" : "rgba(243,244,246,1)", drawTicks: false },
                border: { display: false, dash: [4, 4] },
                beginAtZero: true,
            },
        },
        onClick: (_event: any, elements: any[]) => {
            if (elements.length > 0 && stats) {
                const idx = elements[0].index;
                if (filteredProgram) {
                    const yl = filteredProgram.yearLevelBreakdown[idx];
                    if (yl) navigate(`/dashboard/students/list?program=${filteredProgram.programId}&year=${yl.yearLevel}`);
                } else {
                    const prog = stats.programs[idx];
                    if (prog) navigate(`/dashboard/students/list?program=${prog.programId}`);
                }
            }
        },
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <div className="animate-spin rounded-full h-14 w-14 sm:h-16 sm:w-16 border-t-4 border-b-4 border-orange-500" />
            </div>
        );
    }

    const scopeLabel: Record<string, string> = {
        all: "All Programs", department: "Per Program", year_level: "Per Year Level", section: "Per Section",
    };

    const allObs = stats?.obligations ?? [];
    const visibleObs = (() => {
        let obs = isClassOfficer ? allObs.filter(ob => ob.scope !== "all") : allObs;
        if (selectedProgram !== "") {
            // Show "all" scope obligations + per-program obligations for this specific program
            obs = obs.filter(ob => ob.scope === "all" || ob.programId === selectedProgram);
        }
        return obs;
    })();

    return (
        <div className={`p-3 sm:p-5 lg:p-8 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>

            {/* ── Header ── */}
            <div className="flex flex-row items-center justify-between gap-3 mb-5 sm:mb-6">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold">Dashboard</h1>
                {canFilterProgram && stats && stats.programs.length > 0 && (
                    <ProgramDropdown
                        programs={stats.programs}
                        value={selectedProgram}
                        onChange={setSelectedProgram}
                        darkMode={darkMode}
                    />
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">{error}</div>
            )}

            {/* ── Stat cards: 2 col phone, 4 col desktop ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
                <StatCard
                    cardKey="registered"
                    title="Total Registered Students"
                    value={displayRegistered}
                    subtitle="Total students with registered accounts"
                    icon={<FaUsers />}
                    active={activeCard === "registered"}
                    darkMode={darkMode}
                    animDelay={0}
                    onClick={() => {
                        setActiveCard("registered");
                        navigate("/dashboard/students", {
                            state: { programFilter: filteredProgram?.code ?? "all" }
                        });
                    }}
                />
                <StatCard
                    cardKey="verified"
                    title="Verified Clearances"
                    value={
                        <span>
                            <span className={activeCard === "verified" ? "text-white" : ""}>{displayVerified}</span>
                            <span className={`text-base font-normal ${activeCard === "verified" ? "text-white/70" : darkMode ? "text-gray-400" : "text-gray-400"}`}>
                                {" "}/ {displayTotal}
                            </span>
                        </span>
                    }
                    subtitle="Fully verified student clearances"
                    icon={<FaCheckCircle />}
                    active={activeCard === "verified"}
                    darkMode={darkMode}
                    animDelay={90}
                    onClick={() => {
                        setActiveCard("verified");
                        navigate("/dashboard/students/clearances", {
                            state: { programFilter: filteredProgram?.code ?? "all" }
                        });
                    }}
                />
                <StatCard
                    cardKey="collect"
                    title="Amount to Collect"
                    value={formatPhp(displayCollect)}
                    subtitle="Total amount to be collected"
                    icon={<FaDollarSign />}
                    active={activeCard === "collect"}
                    darkMode={darkMode}
                    animDelay={180}
                    onClick={() => {
                        setActiveCard("collect");
                        navigate("/dashboard/students/obligations-list", {
                            state: { programFilter: filteredProgram?.code ?? "all" }
                        });
                    }}
                />
                <StatCard
                    cardKey="payments"
                    title="Total Payments"
                    value={formatPhp(displayPayments)}
                    subtitle={`${formatPhp(Math.max(0, displayCollect - displayPayments))} remaining to collect`}
                    icon={<FaMoneyBillWave />}
                    active={activeCard === "payments"}
                    darkMode={darkMode}
                    animDelay={270}
                    onClick={() => {
                        setActiveCard("payments");
                        navigate("/dashboard/students/payments", {
                            state: { programFilter: filteredProgram?.code ?? "all" }
                        });
                    }}
                />
            </div>

            {/* ── Main panel — graph + obligations side by side ── */}
            <div
                style={{ animationDelay: "360ms" }}
                className={`anim-section rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden
                    ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
                {/* Two-column body: stacks on mobile, side-by-side on lg+ */}
                <div className="flex flex-col lg:flex-row">

                    {/* ── Graph column (60%) ── */}
                    <div className="w-full lg:w-[60%] min-w-0 p-4 sm:p-5 lg:p-6">
                        {/* Section header */}
                        <div className="flex items-center gap-2 mb-3">
                            <FaChartBar className="text-orange-500 text-sm shrink-0" />
                            <h2 className={`font-bold text-xs sm:text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                                Verified Clearances Graph
                            </h2>
                        </div>
                        <p className={`text-[9px] sm:text-[10px] lg:text-xs mb-3 sm:mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {chartLabels.length > 0
                                ? filteredProgram
                                    ? `${filteredProgram.name} has ${overallRate}% clearance rate across all year levels`
                                    : `All programs have a ${overallRate}% overall clearance rate`
                                : "No data to display"}
                        </p>

                        {chartLabels.length > 0 ? (
                            <div className="h-[260px] sm:h-[300px] lg:h-[320px]">
                                <Bar ref={chartRef} data={barData} options={barOptions} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[260px] gap-2">
                                <FaChartBar className={`text-3xl ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                                <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No data available.</p>
                            </div>
                        )}
                    </div>

                    {/* ── Divider ── */}
                    <div className={`border-t-2 lg:border-t-0 lg:border-l-2 ${darkMode ? "border-gray-600" : "border-gray-200"}`} />

                    {/* ── Obligations column (40%) ── */}
                    <div className="w-full lg:w-[40%] shrink-0 p-4 sm:p-5 lg:p-6 flex flex-col">
                        {/* Section header */}
                        <div className="flex items-center gap-2 mb-3">
                            <FaClipboardList className="text-orange-500 text-sm shrink-0" />
                            <h2 className={`font-bold text-xs sm:text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                                Obligation Status
                            </h2>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full
                                ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
                                {isClassOfficer
                                    ? (stats?.obligations.filter(o => o.scope !== "all").length ?? 0)
                                    : (stats?.obligations.length ?? 0)}
                            </span>
                        </div>

                        {!stats || visibleObs.length === 0 ? (
                            <p className={`text-sm text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                                No obligations to display.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2 sm:gap-2.5 max-h-[300px] lg:max-h-[360px] overflow-y-auto pr-1">
                                {visibleObs.map((ob, idx) => {
                                    const paidPct = ob.totalStudents > 0
                                        ? Math.round((ob.paidCount / ob.totalStudents) * 100)
                                        : 0;
                                    return (
                                        <button
                                            key={ob.obligationId}
                                            style={{ animationDelay: `${idx * 55}ms` }}
                                            onClick={() => navigate("/dashboard/students/obligations-list", {
                                                state: {
                                                    obligationFilter: ob.obligationName,
                                                    programFilter: ob.programCode ?? "all",
                                                }
                                            })}
                                            className={`
                                                anim-card-pop w-full text-left rounded-xl border px-3 py-2.5 transition
                                                hover:shadow-md cursor-pointer
                                                ${darkMode
                                                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                                                    : "bg-gray-50 border-gray-200 hover:bg-white"}
                                            `}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <p className="font-semibold text-xs leading-snug line-clamp-2 flex-1">
                                                    {ob.obligationName}
                                                </p>
                                                <span className="text-[10px] font-bold text-orange-500 shrink-0">{paidPct}%</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                                <span className={`
                                                    px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide
                                                    ${darkMode ? "bg-orange-900/60 text-orange-300" : "bg-orange-100 text-orange-600"}
                                                `}>
                                                    {ob.scope === "department" && ob.programName
                                                        ? ob.programName
                                                        : scopeLabel[ob.scope] ?? ob.scope.replace("_", " ")}
                                                </span>
                                                <span className={`text-[10px] font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                                    {ob.paidCount}/{ob.totalStudents}
                                                </span>
                                            </div>
                                            <div className={`w-full rounded-full h-1.5 overflow-hidden ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>
                                                <div
                                                    className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                                                    style={{ width: `${paidPct}%` }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
