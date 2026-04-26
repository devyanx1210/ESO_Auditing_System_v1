import {
    MdDashboard, MdPeople, MdSettings, MdArticle, MdUploadFile,
} from "react-icons/md";
import { FaSignOutAlt, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/ESO_Logo.png";
import { useAuth } from "../hooks/useAuth";

const navItems = [
    { path: "/sysadmin/home",     label: "Dashboard",      icon: <MdDashboard /> },
    { path: "/sysadmin/accounts", label: "Accounts",       icon: <MdPeople /> },
    { path: "/sysadmin/import",   label: "Import Students",icon: <MdUploadFile /> },
    { path: "/sysadmin/settings", label: "System Settings",icon: <MdSettings /> },
    { path: "/sysadmin/audit",    label: "Audit Logs",     icon: <MdArticle /> },
];

// Always force light mode for sysadmin panel
// Intercepts any theme change events so child components using useTheme() cannot re-apply dark
function useForceLightMode() {
    useEffect(() => {
        document.documentElement.classList.remove("dark");
        const forceLight = () => { document.documentElement.classList.remove("dark"); };
        window.addEventListener("themechange", forceLight);
        return () => { window.removeEventListener("themechange", forceLight); };
    }, []);
}

export default function SysAdminLayout() {
    const { logout, user } = useAuth();
    const navigate    = useNavigate();
    const location    = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [collapsed,       setCollapsed]       = useState(false);
    useForceLightMode();

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    const navBase    = "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-sm font-medium";
    const navActive  = "bg-white/15 text-white font-semibold";
    const navInactive = "text-orange-200/70 hover:bg-white/10 hover:text-white";

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white">

            {/* Desktop Sidebar */}
            <div className={`hidden md:flex flex-col shrink-0 bg-orange-800 transition-all duration-300 ease-in-out ${collapsed ? "w-16 p-2" : "w-56 p-4"}`}>
                <div className={`flex flex-col items-center justify-center mb-5 mt-2 ${collapsed ? "gap-1" : "gap-3"}`}>
                    <img src={logo} className="object-contain transition-all duration-300 drop-shadow-lg"
                        style={{ width: collapsed ? "32px" : "64px", height: collapsed ? "32px" : "64px" }} />
                    {!collapsed && (
                        <div className="text-center">
                            <p className="text-white font-extrabold text-sm tracking-wide leading-tight">ESO Auditing System</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/15 text-orange-200 text-[10px] font-semibold tracking-widest uppercase">
                                {user?.role === "system_admin" ? "System Admin" : (user?.role ?? "")}
                            </span>
                        </div>
                    )}
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path} title={collapsed ? item.label : ""}
                            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive} ${collapsed ? "justify-center px-2" : ""}`}>
                            <span className="shrink-0">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}

                    <button onClick={() => setShowLogoutModal(true)} title={collapsed ? "Sign Out" : ""}
                        className={`${navBase} ${navInactive} mt-2 ${collapsed ? "justify-center px-2" : ""}`}>
                        <FaSignOutAlt className="shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </nav>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(c => !c)}
                    className={`mt-3 flex items-center gap-2 py-2 rounded-lg text-orange-100/60 hover:bg-white/10 hover:text-white transition-colors text-xs font-medium ${collapsed ? "justify-center px-2" : "px-3"}`}>
                    {collapsed ? <FaChevronRight className="shrink-0" /> : <><FaChevronLeft className="shrink-0" /><span>Collapse</span></>}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto pb-20 md:pb-0">
                <Outlet key={location.pathname} />
            </div>

            {/* Mobile Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 md:hidden border-t shadow-md flex justify-around items-center h-14 z-50 bg-white border-gray-200">
                {navItems.map(item => (
                    <NavLink key={item.path} to={item.path}
                        className={({ isActive }) =>
                            `flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                            ${isActive ? "bg-orange-500/15 text-orange-500" : "text-gray-400 hover:text-orange-500"}`}>
                        <span className="text-xl">{item.icon}</span>
                    </NavLink>
                ))}
                <button onClick={() => setShowLogoutModal(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-orange-500 transition-colors">
                    <FaSignOutAlt className="text-xl" />
                </button>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
                    onClick={() => setShowLogoutModal(false)}>
                    <div className="rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-[90%] sm:w-[400px] p-6 relative bg-white text-gray-800"
                        onClick={e => e.stopPropagation()}>
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
