import {
    FaTachometerAlt,
    FaCog,
    FaSignOutAlt,
    FaTimes,
} from "react-icons/fa";

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../styles/index.css";
import logo from "../assets/ESO_Logo.png";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";


export default function StudentLayout() {
    const { logout } = useAuth();
    useTheme(); // ensure theme class is applied on mount
    const location = useLocation();
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

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
            <div className="desktop-sidebar hidden md:flex w-52 p-5 flex-col bg-gray-100 dark:bg-[#0d0d0d] dark:border-r dark:border-[#2a2a2a]">
                <div className="logo-container flex w-full items-center justify-center">
                    <img src={logo} className="logo object-contain mb-5"
                        style={{ width: "clamp(36px,20vw,64px)", height: "clamp(36px,20vw,64px)" }} />
                </div>
                <nav className="nav-container flex flex-col gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/student/dashboard"}
                            className={({ isActive }) =>
                                `nav-items flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition font-medium text-sm ${
                                    isActive
                                        ? "bg-orange-500/20 text-orange-500 dark:text-orange-400 font-bold"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]"
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="logout-btn flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition font-medium text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]"
                    >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="main-content flex-1 overflow-auto pb-20 md:pb-0">
                <Outlet key={location.pathname} />
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="mobile-bottom-nav-container fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-[#0d0d0d] border-t-2 border-gray-300 dark:border-[#2a2a2a] shadow-lg flex justify-around items-center z-50" style={{ height: "4.5rem" }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/student/dashboard"}
                        className={({ isActive }) =>
                            `mobile-bottom-nav flex flex-col items-center justify-center gap-1 px-4 ${isActive ? "text-orange-500 font-bold" : "text-gray-500 dark:text-gray-400"}`
                        }
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-[11px] font-medium">{item.label}</span>
                    </NavLink>
                ))}

                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="mobile-logout-button flex flex-col items-center justify-center gap-1 px-4 text-gray-500 dark:text-gray-400 hover:text-orange-500"
                >
                    <span className="text-xl"><FaSignOutAlt /></span>
                    <span className="text-[11px] font-medium">Sign Out</span>
                </button>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="logout-modal fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="anim-slide-up rounded-xl shadow-2xl w-[90%] sm:w-[400px] p-6 relative bg-white dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
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
