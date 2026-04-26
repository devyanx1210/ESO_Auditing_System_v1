import { useEffect, useState } from "react";
import { MdPeople, MdBuild, MdCalendarToday } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { sysadminService } from "../../services/sysadmin.service";
import StatCard from "../../components/ui/StatCard";

interface Settings {
    maintenance_mode:  boolean;
    maintenance_msg:   string;
    school_year:       string;
    current_semester:  string;
}
interface Account {
    user_id:   number;
    role_name: string;
    status:    string;
}

type CardKey = "accounts" | "active" | "maintenance";

export default function SysAdminDashboard() {
    const { accessToken } = useAuth();
    const navigate = useNavigate();

    const [settings,   setSettings]   = useState<Settings | null>(null);
    const [accounts,   setAccounts]   = useState<Account[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [activeCard, setActiveCard] = useState<CardKey>("accounts");

    useEffect(() => {
        if (!accessToken) return;
        setLoading(true);
        sysadminService.getSettings(accessToken).then(s => setSettings(s)).catch(() => {});
        sysadminService.getAccounts(accessToken)
            .then(a => setAccounts(Array.isArray(a) ? a : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [accessToken]);

    const totalAccounts  = accounts.length;
    const activeAccounts = accounts.filter(a => a.status === "active").length;
    const students       = accounts.filter(a => a.role_name === "student").length;
    const maintenanceOn  = !!settings?.maintenance_mode;

    return (
        <div className="p-3 sm:p-5 lg:p-8 min-h-screen bg-gray-50">
            <style>{`@keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }`}</style>

            <div className="mb-5 sm:mb-6" style={{ animation: "fadeInUp 0.35s ease both" }}>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">System Admin Dashboard</h1>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
                <StatCard title="Total Accounts"  value={loading ? "..." : totalAccounts}
                    icon={<MdPeople />} active={activeCard === "accounts"} animDelay={0}
                    onClick={() => { setActiveCard("accounts"); navigate("/sysadmin/accounts"); }} />
                <StatCard title="Active Accounts" value={loading ? "..." : activeAccounts}
                    icon={<MdPeople />} active={activeCard === "active"} animDelay={90}
                    onClick={() => { setActiveCard("active"); navigate("/sysadmin/accounts"); }} />
                <StatCard title="Students"        value={loading ? "..." : students}
                    icon={<MdPeople />} active={false} animDelay={180} />
                <StatCard title="Maintenance"     value={loading ? "..." : (maintenanceOn ? "ON" : "OFF")}
                    icon={<MdBuild />} active={activeCard === "maintenance"} animDelay={270}
                    onClick={() => { setActiveCard("maintenance"); navigate("/sysadmin/settings"); }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animation: "fadeInUp 0.4s ease both 0.18s" }}>

                <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.13)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <MdCalendarToday className="text-orange-500" size={18} />
                        <h2 className="text-gray-700 font-semibold text-sm">Current Semester</h2>
                    </div>
                    {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">School Year</span>
                                <span className="text-gray-800 font-medium">{settings?.school_year}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Semester</span>
                                <span className="text-gray-800 font-medium">{settings?.current_semester} Semester</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.13)] p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <MdBuild className="text-orange-500" size={18} />
                        <h2 className="text-gray-700 font-semibold text-sm">Maintenance Mode</h2>
                    </div>
                    {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
                        <div className="space-y-2">
                            <span className={`text-sm font-semibold ${maintenanceOn ? "text-red-600" : "text-green-600"}`}>
                                {maintenanceOn ? "System is under maintenance" : "System is operational"}
                            </span>
                            {maintenanceOn && <p className="text-gray-500 text-xs mt-1">{settings?.maintenance_msg}</p>}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
