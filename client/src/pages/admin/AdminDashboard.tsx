import React, { useEffect, useState } from "react";
import { FaUsers, FaDollarSign, FaFileInvoiceDollar, FaSortAmountDown } from "react-icons/fa";
import { Bar, Doughnut } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "../../../styles/index.css";
import { useAuth } from "../../hooks/useAuth";
import { dashboardService } from "../../services/dashboard.service";
import type { ProgramStat } from "../../services/dashboard.service";

const primaryOrange = "#C2410C";

export default function AdminDashboard() {
    const { accessToken } = useAuth();
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState("");
    const [programs, setPrograms]         = useState<ProgramStat[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>("");

    useEffect(() => {
        if (!accessToken) return;
        dashboardService.getStats(accessToken)
            .then(stats => {
                setPrograms(stats.programs);
                if (stats.programs.length) setSelectedDept(stats.programs[0].code);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    const dept = programs.find(d => d.code === selectedDept);

    const verifiedPercent = dept && dept.totalStudents > 0
        ? Math.round((dept.clearedStudents / dept.totalStudents) * 100)
        : 0;

    const paidPercent = dept && dept.totalObligations > 0
        ? Math.round((dept.paidObligations / dept.totalObligations) * 100)
        : 0;

    const barChartData = {
        labels: programs.map(d => d.code),
        datasets: [{
            label: "Cleared Students",
            data: programs.map(d => d.clearedStudents),
            backgroundColor: primaryOrange,
            borderRadius: 8,
            barThickness: 28,
        }],
    };

    const doughnutData = {
        labels: ["Paid", "Unpaid"],
        datasets: [{
            data: dept ? [dept.paidObligations, dept.totalObligations - dept.paidObligations] : [0, 0],
            backgroundColor: [primaryOrange, "#E5E7EB"],
            borderWidth: 0,
        }],
    };

    return (
        <div className="relative">
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500" />
                </div>
            )}

            {!loading && (
                <div className="p-4 sm:p-6 md:p-10 bg-gray-50 min-h-screen">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                        {programs.length > 0 && (
                            <div className="flex items-center gap-2 bg-white shadow-md border border-gray-100 px-4 py-2 rounded-xl">
                                <FaSortAmountDown className="text-gray-500" />
                                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                                    className="outline-none text-sm bg-transparent">
                                    {programs.map(d => (
                                        <option key={d.code} value={d.code}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Cleared Students</p>
                                    <h2 className="font-bold text-gray-800 text-lg">{dept?.clearedStudents ?? 0} / {dept?.totalStudents ?? 0}</h2>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <FaUsers size={18} className="text-primary" />
                                </div>
                            </div>
                            <div className="w-28 h-28 mx-auto mt-5">
                                <CircularProgressbar value={verifiedPercent} text={`${verifiedPercent}%`}
                                    styles={buildStyles({ pathColor: primaryOrange, textColor: "#111827", trailColor: "#F3F4F6", textSize: "22px" })} />
                            </div>
                            <p className="text-center text-gray-400 text-xs mt-3">students cleared this period</p>
                        </div>

                        <StatMiniCard title="Total Students" icon={<FaUsers />}
                            value={dept?.totalStudents ?? 0} percent={verifiedPercent} color={primaryOrange} label="cleared" />

                        <StatMiniCard title="Paid Obligations" icon={<FaFileInvoiceDollar />}
                            value={dept?.paidObligations ?? 0} percent={paidPercent} color={primaryOrange} label="of total obligations" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="font-semibold text-gray-800 mb-1">Cleared Students by Program</h2>
                            <p className="text-xs text-gray-400 mb-4">Number of fully cleared students per program</p>
                            <div className="h-[300px] w-full">
                                <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col">
                            <h2 className="font-semibold text-gray-800 mb-1">Obligation Payment Status</h2>
                            <p className="text-xs text-gray-400 mb-4">Paid vs unpaid obligations for selected program</p>
                            <div className="h-[300px] flex justify-center items-center">
                                {dept && dept.totalObligations > 0 ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: "70%" }} />
                                        <div className="absolute flex flex-col items-center pointer-events-none">
                                            <span className="text-2xl font-extrabold text-gray-800">{paidPercent}%</span>
                                            <span className="text-xs text-gray-400 font-medium">paid</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                                        <div className="w-24 h-24 rounded-full border-8 border-gray-100" />
                                        <p className="text-sm font-medium text-gray-400">No obligation data yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatMiniCard({ title, icon, value, percent, color, label }: {
    title: string; icon: React.ReactNode; value: number; percent: number; color: string; label: string;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{title}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-primary text-lg">{icon}</div>
            </div>
            <div className="mt-4">
                <p className="text-4xl font-extrabold text-gray-800">{value}</p>
                <p className="text-sm text-gray-400 mt-1">{percent}% {label}</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-5 overflow-hidden">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                    style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
