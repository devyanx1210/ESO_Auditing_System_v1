import {
    FaTachometerAlt,
    FaUserGraduate,
    FaClipboardList,
    FaCog,
    FaSignOutAlt,
    FaTimes,
    FaChevronDown,
    FaListUl,
    FaExclamationCircle,
    FaMoneyBillWave,
    FaStamp,
} from "react-icons/fa";

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../../styles/index.css";
import logo from "../assets/ESO_Logo.png";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

const studentSubItems = [
    { path: "/dashboard/students/list",             label: "Student List",            icon: <FaListUl className="text-[11px]" /> },
    { path: "/dashboard/students/obligations-list", label: "Student Obligations",     icon: <FaExclamationCircle className="text-[11px]" /> },
    { path: "/dashboard/students/payments",         label: "Submission Review",       icon: <FaMoneyBillWave className="text-[11px]" /> },
    { path: "/dashboard/students/clearances",       label: "Clearance Approval",      icon: <FaStamp className="text-[11px]" /> },
];

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const isStudentsPath = location.pathname.startsWith("/dashboard/students");
    const [studentsOpen, setStudentsOpen] = useState(isStudentsPath);
    const [studentsDropUp, setStudentsDropUp] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const dropUpRef = useRef<HTMLDivElement>(null);

    // Close drop-up on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (dropUpRef.current && !dropUpRef.current.contains(e.target as Node)) {
                setStudentsDropUp(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Auto-open when navigating into a students sub-route
    useEffect(() => {
        if (isStudentsPath) setStudentsOpen(true);
    }, [isStudentsPath]);

    const topNavItems = [
        { path: "/dashboard/home",        label: "Dashboard",   icon: <FaTachometerAlt /> },
        { path: "/dashboard/obligations", label: "Obligations", icon: <FaClipboardList /> },
        ...(user?.role === "system_admin"
            ? [{ path: "/dashboard/settings", label: "Settings", icon: <FaCog /> }]
            : []),
    ];

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    const navBase = `flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-sm font-medium`;
    const navActive = darkMode
        ? "bg-orange-500/20 text-orange-400 font-semibold"
        : "bg-orange-500/15 text-orange-600 font-semibold";
    const navInactive = darkMode
        ? "text-gray-300 hover:bg-gray-700"
        : "text-gray-600 hover:bg-gray-200";

    return (
        <div className={`main-admin-layout flex flex-col md:flex-row h-screen ${darkMode ? "bg-gray-900" : "bg-white"}`}>

            {/* ── Desktop Sidebar ── */}
            <div className={`desktop-sidebar hidden md:flex w-56 p-4 flex-col shrink-0
                ${darkMode ? "bg-gray-900 border-r border-gray-800" : "bg-gray-100"}`}>

                {/* Logo */}
                <div className="flex items-center justify-center mb-5 mt-1">
                    <img src={logo} className="object-contain"
                        style={{ width: "clamp(36px,20vw,56px)", height: "clamp(36px,20vw,56px)" }} />
                </div>

                <nav className="flex flex-col gap-1">

                    {/* Dashboard */}
                    <NavLink
                        to="/dashboard/home"
                        end
                        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
                    >
                        <FaTachometerAlt className="shrink-0" />
                        <span>Dashboard</span>
                    </NavLink>

                    {/* Students — collapsible */}
                    <div>
                        <button
                            onClick={() => setStudentsOpen(o => !o)}
                            className={`${navBase} w-full justify-between
                                ${isStudentsPath ? navActive : navInactive}`}
                        >
                            <div className="flex items-center gap-3">
                                <FaUserGraduate className="shrink-0" />
                                <span>Students</span>
                            </div>
                            <FaChevronDown className={`text-xs shrink-0 transition-transform duration-200
                                ${studentsOpen ? "rotate-180" : ""}`} />
                        </button>

                        {/* Sub-items */}
                        <div className={`overflow-hidden transition-all duration-200
                            ${studentsOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                            <div className={`ml-3 pl-3 flex flex-col gap-0.5
                                border-l-2 ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                                {studentSubItems.map(sub => (
                                    <NavLink
                                        key={sub.path}
                                        to={sub.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150
                                            ${isActive
                                                ? darkMode
                                                    ? "bg-orange-500/20 text-orange-400 font-semibold"
                                                    : "bg-orange-500/15 text-orange-600 font-semibold"
                                                : darkMode
                                                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                                                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                            }`}
                                    >
                                        {sub.icon}
                                        <span>{sub.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Obligations */}
                    <NavLink
                        to="/dashboard/obligations"
                        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
                    >
                        <FaClipboardList className="shrink-0" />
                        <span>Obligations</span>
                    </NavLink>

                    {/* Settings (system_admin only) */}
                    {user?.role === "system_admin" && (
                        <NavLink
                            to="/dashboard/settings"
                            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
                        >
                            <FaCog className="shrink-0" />
                            <span>Settings</span>
                        </NavLink>
                    )}

                    {/* Sign Out */}
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className={`${navBase} ${navInactive} mt-2`}
                    >
                        <FaSignOutAlt className="shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </nav>
            </div>

            {/* ── Main Content ── */}
            <div className="main-content flex-1 overflow-auto pb-20 md:pb-0">
                <Outlet key={location.pathname} />
            </div>

            {/* ── Mobile Bottom Navigation ── */}
            <div className={`mobile-bottom-nav-container fixed bottom-0 left-0 right-0 md:hidden
                border-t shadow-md flex justify-around items-center h-16 z-50
                ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>

                <NavLink
                    to="/dashboard/home"
                    end
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center text-xs gap-0.5
                        ${isActive ? "text-orange-500 font-bold" : darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                    <FaTachometerAlt className="text-lg" />
                    <span className="text-[10px] mt-0.5">Dashboard</span>
                </NavLink>

                {/* Students — drop-up trigger */}
                <div ref={dropUpRef} className="relative flex flex-col items-center">
                    <button
                        onClick={() => setStudentsDropUp(o => !o)}
                        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1
                            ${isStudentsPath || studentsDropUp ? "text-orange-500 font-bold" : darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                        <FaUserGraduate className="text-lg" />
                        <span className="text-[10px] mt-0.5">Students</span>
                    </button>

                    {/* Drop-up panel */}
                    {studentsDropUp && (
                        <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                            rounded-2xl overflow-hidden shadow-[0_-8px_32px_rgba(0,0,0,0.18)]
                            w-48 z-50
                            ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
                            <div className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest
                                ${darkMode ? "text-gray-500 border-b border-gray-700" : "text-gray-400 border-b border-gray-100"}`}>
                                Students
                            </div>
                            {studentSubItems.map(sub => (
                                <NavLink
                                    key={sub.path}
                                    to={sub.path}
                                    onClick={() => setStudentsDropUp(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors
                                        ${isActive
                                            ? "bg-orange-500 text-white"
                                            : darkMode
                                                ? "text-gray-200 hover:bg-gray-700"
                                                : "text-gray-700 hover:bg-orange-50"}`}
                                >
                                    {sub.icon}
                                    <span>{sub.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

                <NavLink
                    to="/dashboard/obligations"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center text-xs gap-0.5
                        ${isActive ? "text-orange-500 font-bold" : darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                    <FaClipboardList className="text-lg" />
                    <span className="text-[10px] mt-0.5">Obligations</span>
                </NavLink>

                {user?.role === "system_admin" && (
                    <NavLink
                        to="/dashboard/settings"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center text-xs gap-0.5
                            ${isActive ? "text-orange-500 font-bold" : darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                        <FaCog className="text-lg" />
                        <span className="text-[10px] mt-0.5">Settings</span>
                    </NavLink>
                )}

                <button
                    onClick={() => setShowLogoutModal(true)}
                    className={`flex flex-col items-center justify-center text-xs gap-0.5
                        ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                    <FaSignOutAlt className="text-lg" />
                    <span className="text-[10px] mt-0.5">Sign Out</span>
                </button>
            </div>


            {/* ── Logout Modal ── */}
            {showLogoutModal && (
                <div className="logout-modal fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className={`anim-slide-up rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.35)]
                        w-[90%] sm:w-[400px] p-6 relative
                        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute top-3 right-3"
                        >
                            <FaTimes size={18} color="#FE8901" />
                        </button>
                        <h2 className="text-lg font-bold mb-3">Confirm Logout</h2>
                        <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            Are you sure you want to log out?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className={`px-4 py-2 rounded-lg text-sm
                                    ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                            >
                                No
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-semibold"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
