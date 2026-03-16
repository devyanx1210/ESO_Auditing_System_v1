import React, { useEffect, useState } from "react";
import { FaUsers, FaDollarSign, FaFileInvoiceDollar, FaSortAmountDown } from "react-icons/fa";
import { Bar, Doughnut } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "../../../styles/index.css";
import { useAuth } from "../../hooks/useAuth";
import { dashboardService } from "../../services/dashboard.service";
import type { DepartmentStat } from "../../services/dashboard.service";

const primaryOrange = "#C2410C";

export default function AdminDashboard() {
    const { accessToken } = useAuth();
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState("");
    const [departments, setDepartments]   = useState<DepartmentStat[]>([]);
    const [selectedDept, setSelectedDept] = useState<string>("");

    useEffect(() => {
        if (!accessToken) return;
        dashboardService.getStats(accessToken)
            .then(stats => {
                setDepartments(stats.departments);
                if (stats.departments.length) setSelectedDept(stats.departments[0].code);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    const dept = departments.find(d => d.code === selectedDept);

    const verifiedPercent = dept && dept.totalStudents > 0
        ? Math.round((dept.clearedStudents / dept.totalStudents) * 100)
        : 0;

    const paidPercent = dept && dept.totalObligations > 0
        ? Math.round((dept.paidObligations / dept.totalObligations) * 100)
        : 0;

    const barChartData = {
        labels: departments.map(d => d.code),
        datasets: [{
            label: "Cleared Students",
            data: departments.map(d => d.clearedStudents),
            backgroundColor: primaryOrange,
            borderRadius: 8,
            barThickness: 28,
        }],
    };

    const doughnutData = {
        labels: ["Paid", "Unpaid"],
        datasets: [{
            data: dept ? [dept.paidObligations, dept.totalObligations - dept.paidObligations] : [0, 1],
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
                        {departments.length > 0 && (
                            <div className="flex items-center gap-2 bg-white shadow px-4 py-2 rounded-lg">
                                <FaSortAmountDown className="text-gray-500" />
                                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                                    className="outline-none text-sm bg-transparent">
                                    {departments.map(d => (
                                        <option key={d.code} value={d.code}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <h2 className="font-semibold text-gray-700 text-lg">Cleared Students</h2>
                                <FaUsers size={22} className="text-primary" />
                            </div>
                            <div className="w-32 h-32 mx-auto mt-6">
                                <CircularProgressbar value={verifiedPercent} text={`${verifiedPercent}%`}
                                    styles={buildStyles({ pathColor: primaryOrange, textColor: "#111827", trailColor: "#F3F4F6" })} />
                            </div>
                            <p className="text-center text-gray-500 text-sm mt-4">
                                {dept?.clearedStudents ?? 0} of {dept?.totalStudents ?? 0} cleared
                            </p>
                        </div>

                        <StatMiniCard title="Total Students" icon={<FaUsers />}
                            value={dept?.totalStudents ?? 0} percent={verifiedPercent} color={primaryOrange} label="cleared" />

                        <StatMiniCard title="Paid Obligations" icon={<FaFileInvoiceDollar />}
                            value={dept?.paidObligations ?? 0} percent={paidPercent} color={primaryOrange} label="of total obligations" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h2 className="font-semibold text-gray-700 mb-4">Cleared Students by Program</h2>
                            <div className="h-[320px] w-full">
                                <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col">
                            <h2 className="font-semibold text-gray-700 mb-4">Obligation Payment Status</h2>
                            <div className="h-[320px] flex justify-center items-center">
                                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
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
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <h2 className="font-semibold text-gray-700 text-lg">{title}</h2>
                <div className="text-primary text-xl">{icon}</div>
            </div>
            <div className="mt-6">
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{percent}% {label}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-5">
                <div className="h-2 rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}
