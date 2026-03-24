import {
    MdDashboard, MdPeople, MdSettings, MdArticle,
} from "react-icons/md";
import { FaSignOutAlt, FaTimes } from "react-icons/fa";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/ESO_Logo.png";
import { useAuth } from "../hooks/useAuth";

const navItems = [
    { path: "/sysadmin/home",     label: "Dashboard",  icon: <MdDashboard /> },
    { path: "/sysadmin/accounts", label: "Accounts",   icon: <MdPeople /> },
    { path: "/sysadmin/settings", label: "System Settings", icon: <MdSettings /> },
    { path: "/sysadmin/audit",    label: "Audit Logs", icon: <MdArticle /> },
];

// Always force light mode for admin panel
function useForceLightMode() {
    useEffect(() => { document.documentElement.classList.remove("dark"); }, []);
}

export default function SysAdminLayout() {
    const { logout }  = useAuth();
    const navigate    = useNavigate();
    const location    = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    useForceLightMode();

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    const navBase    = "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-sm font-medium";
    const navActive  = "bg-orange-500/15 text-orange-600 font-semibold";
    const navInactive = "text-gray-600 hover:bg-gray-200";

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white">

            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-56 p-4 flex-col shrink-0 bg-gray-100">
                <div className="flex items-center justify-center mb-5 mt-1">
                    <img src={logo} className="object-contain"
                        style={{ width: "clamp(36px,20vw,56px)", height: "clamp(36px,20vw,56px)" }} />
                </div>

                <nav className="flex flex-col gap-1">
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path}
                            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}>
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <button onClick={() => setShowLogoutModal(true)}
                        className={`${navBase} ${navInactive} mt-2`}>
                        <FaSignOutAlt className="shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto pb-20 md:pb-0">
                <Outlet key={location.pathname} />
            </div>

            {/* Mobile Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 md:hidden border-t shadow-md flex justify-around items-center h-16 z-50 bg-white border-gray-200">
                {navItems.map(item => (
                    <NavLink key={item.path} to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center text-xs gap-0.5
                            ${isActive ? "text-orange-500 font-bold" : "text-gray-500"}`}>
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-[10px] mt-0.5">{item.label.split(" ")[0]}</span>
                    </NavLink>
                ))}
                <button onClick={() => setShowLogoutModal(true)}
                    className="flex flex-col items-center justify-center text-xs gap-0.5 text-gray-500">
                    <FaSignOutAlt className="text-lg" />
                    <span className="text-[10px] mt-0.5">Sign Out</span>
                </button>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-[90%] sm:w-[400px] p-6 relative bg-white text-gray-800">
                        <button onClick={() => setShowLogoutModal(false)} className="absolute top-3 right-3">
                            <FaTimes size={18} color="#FE8901" />
                        </button>
                        <h2 className="text-lg font-bold mb-3">Confirm Logout</h2>
                        <p className="text-sm mb-6 text-gray-600">Are you sure you want to log out?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded-lg text-sm bg-gray-200 text-gray-700 hover:bg-gray-300">
                                No
                            </button>
                            <button onClick={handleLogout}
                                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-semibold">
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
