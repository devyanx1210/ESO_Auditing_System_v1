import {
    FaTachometerAlt,
    FaCog,
    FaSignOutAlt,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/index.css";
import logo from "../assets/ESO_Logo.png";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";


export default function StudentLayout() {
    const { logout, user } = useAuth();
    useTheme(); // ensure theme class is applied on mount
    const location = useLocation();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [collapsed,       setCollapsed]       = useState(false);

    const navItems = [
        { path: "/student/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
        { path: "/student/settings", label: "Settings", icon: <FaCog /> },
    ];

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    return (
        <div className="main-student-layout flex flex-col md:flex-row h-screen bg-white dark:bg-[#111111]">

            {/* Desktop Sidebar */}
            <div className={`desktop-sidebar hidden md:flex flex-col bg-orange-800 dark:bg-gray-900 transition-all duration-300 ease-in-out ${collapsed ? "w-16 p-2" : "w-52 p-5"}`}>
                <div className={`flex flex-col items-center justify-center mb-5 mt-1 ${collapsed ? "gap-1" : "gap-3"}`}>
                    <img src={logo} className="object-contain transition-all duration-300 drop-shadow-lg"
                        style={{ width: collapsed ? "32px" : "64px", height: collapsed ? "32px" : "64px" }} />
                    {!collapsed && (
                        <div className="text-center">
                            <p className="text-white font-extrabold text-sm tracking-wide leading-tight">ESO Auditing System</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/15 text-orange-200 text-[10px] font-semibold tracking-widest uppercase">
                                {user?.role === "student" ? "Student" : (user?.role ?? "")}
                            </span>
                        </div>
                    )}
                </div>
                <nav className="nav-container flex flex-col gap-2 flex-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/student/dashboard"}
                            title={collapsed ? item.label : ""}
                            className={({ isActive }) =>
                                `nav-items flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition font-medium text-sm ${collapsed ? "justify-center" : ""} ${
                                    isActive
                                        ? "bg-white/15 text-white font-bold dark:bg-orange-500/20 dark:text-orange-400"
                                        : "text-orange-100/70 hover:bg-white/10 hover:text-white dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                                }`
                            }
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}

                    <button
                        onClick={() => setShowLogoutModal(true)}
                        title={collapsed ? "Sign Out" : ""}
                        className={`logout-btn flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition font-medium text-sm text-orange-100/70 hover:bg-white/10 hover:text-white dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white ${collapsed ? "justify-center" : ""}`}
                    >
                        <FaSignOutAlt />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </nav>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(c => !c)}
                    className={`mt-3 flex items-center gap-2 py-2 rounded-lg text-orange-100/60 hover:bg-white/10 hover:text-white dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-xs font-medium ${collapsed ? "justify-center px-2" : "px-3"}`}>
                    {collapsed ? <FaChevronRight className="shrink-0" /> : <><FaChevronLeft className="shrink-0" /><span>Collapse</span></>}
                </button>
            </div>

            {/* Main Content */}
            <div className="main-content flex-1 overflow-auto pb-20 md:pb-0">
                <Outlet key={location.pathname} />
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="mobile-bottom-nav-container fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-[#0d0d0d] border-t border-gray-200 dark:border-[#2a2a2a] shadow-lg flex justify-around items-center h-14 z-50">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/student/dashboard"}
                        className={({ isActive }) =>
                            `flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                            ${isActive ? "bg-orange-500/15 text-orange-500" : "text-gray-400 dark:text-gray-500 hover:text-orange-500"}`
                        }
                    >
                        <span className="text-xl">{item.icon}</span>
                    </NavLink>
                ))}

                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-colors"
                >
                    <FaSignOutAlt className="text-xl" />
                </button>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="logout-modal fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
                    onClick={() => setShowLogoutModal(false)}>
                    <div className="anim-slide-up rounded-xl shadow-2xl w-[90%] sm:w-[400px] p-6 relative bg-white dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]"
                        onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            className="close-icon absolute top-3 right-3"
                        >
                            <FaTimes size={18} color="#FE8901" />
                        </button>

                        <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">
                            Confirm Logout
                        </h2>
                        <p className="text-sm mb-6 text-gray-600 dark:text-gray-400">
                            Are you sure you want to log out?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#333]"
                            >
                                No
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-red-700"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
