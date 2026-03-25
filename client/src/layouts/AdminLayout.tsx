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

const ALL_STUDENT_SUB_ITEMS = [
    { path: "/dashboard/students/list",             label: "Student List",        icon: <FaListUl className="text-[11px]" />,         roles: ["system_admin","eso_officer","class_officer","program_officer","program_head","signatory","dean"] },
    { path: "/dashboard/students/obligations-list", label: "Student Obligations", icon: <FaExclamationCircle className="text-[11px]" />, roles: ["system_admin","eso_officer","class_officer","program_officer"] },
    { path: "/dashboard/students/payments",         label: "Submission Review",   icon: <FaMoneyBillWave className="text-[11px]" />,  roles: ["system_admin","eso_officer","class_officer","program_officer"] },
    { path: "/dashboard/students/clearances",       label: "Clearance Approval",  icon: <FaStamp className="text-[11px]" />,          roles: ["system_admin","eso_officer","program_head","signatory","dean"] },
];

const APPROVING_AUTHORITIES = ["program_head", "signatory", "dean"];

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const role = user?.role ?? "";
    const studentSubItems = ALL_STUDENT_SUB_ITEMS.filter(i => i.roles.includes(role));
    const location  = useLocation();
    const navigate  = useNavigate();
    useTheme(); // apply dark/light class on mount and on changes

    const isStudentsPath = location.pathname.startsWith("/dashboard/students");
    const [studentsOpen,   setStudentsOpen]   = useState(isStudentsPath);
    const [studentsDropUp, setStudentsDropUp] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const dropUpRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (dropUpRef.current && !dropUpRef.current.contains(e.target as Node)) {
                setStudentsDropUp(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (isStudentsPath) setStudentsOpen(true);
    }, [isStudentsPath]);

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    const navBase   = "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-sm font-medium";
    const navActive  = "bg-orange-500/15 text-orange-600 font-semibold";
    const navInactive = "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/10";

    return (
        <div className="main-admin-layout flex flex-col md:flex-row h-screen bg-white dark:bg-[#111111]">

            {/* ── Desktop Sidebar ── */}
            <div className="desktop-sidebar hidden md:flex w-56 p-4 flex-col shrink-0 bg-gray-100 dark:bg-[#1a1a1a]">

                {/* Logo */}
                <div className="flex items-center justify-center mb-5 mt-1">
                    <img src={logo} className="object-contain"
                        style={{ width: "clamp(36px,20vw,56px)", height: "clamp(36px,20vw,56px)" }} />
                </div>

                <nav className="flex flex-col gap-1">

                    {/* Dashboard */}
                    <NavLink to="/dashboard/home" end
                        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}>
                        <FaTachometerAlt className="shrink-0" />
                        <span>Dashboard</span>
                    </NavLink>

                    {/* Students — collapsible */}
                    <div>
                        <button
                            onClick={() => setStudentsOpen(o => !o)}
                            className={`${navBase} w-full justify-between ${isStudentsPath ? navActive : navInactive}`}
                        >
                            <div className="flex items-center gap-3">
                                <FaUserGraduate className="shrink-0" />
                                <span>Students</span>
                            </div>
                            <FaChevronDown className={`text-xs shrink-0 transition-transform duration-200 ${studentsOpen ? "rotate-180" : ""}`} />
                        </button>

                        <div className={`overflow-hidden transition-all duration-200 ${studentsOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                            <div className="ml-3 pl-3 flex flex-col gap-0.5 border-l-2 border-gray-300 dark:border-gray-600">
                                {studentSubItems.map(sub => (
                                    <NavLink key={sub.path} to={sub.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150
                                            ${isActive ? "bg-orange-500/15 text-orange-600 font-semibold" : "text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"}`}>
                                        {sub.icon}
                                        <span>{sub.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Obligations — hidden for approving authorities */}
                    {!APPROVING_AUTHORITIES.includes(role) && (
                        <NavLink to="/dashboard/obligations"
                            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}>
                            <FaClipboardList className="shrink-0" />
                            <span>Obligations</span>
                        </NavLink>
                    )}

                    {/* Settings — all admin roles */}
                    <NavLink to="/dashboard/settings"
                        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}>
                        <FaCog className="shrink-0" />
                        <span>Settings</span>
                    </NavLink>

                    {/* Sign Out */}
                    <button onClick={() => setShowLogoutModal(true)}
                        className={`${navBase} ${navInactive} mt-2`}>
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
            <div className="mobile-bottom-nav-container fixed bottom-0 left-0 right-0 md:hidden
                border-t shadow-md flex justify-around items-center h-16 z-50 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-700">

                <NavLink to="/dashboard/home" end
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center text-xs gap-0.5
                        ${isActive ? "text-orange-500 font-bold" : "text-gray-500 dark:text-gray-400"}`}>
                    <FaTachometerAlt className="text-lg" />
                    <span className="text-[10px] mt-0.5">Dashboard</span>
                </NavLink>

                {/* Students — drop-up */}
                <div ref={dropUpRef} className="relative flex flex-col items-center">
                    <button
                        onClick={() => setStudentsDropUp(o => !o)}
                        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1
                            ${isStudentsPath || studentsDropUp ? "text-orange-500 font-bold" : "text-gray-500 dark:text-gray-400"}`}>
                        <FaUserGraduate className="text-lg" />
                        <span className="text-[10px] mt-0.5">Students</span>
                    </button>

                    {studentsDropUp && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                            rounded-2xl overflow-hidden shadow-[0_-8px_32px_rgba(0,0,0,0.18)]
                            w-48 z-50 bg-white dark:bg-[#1a1a1a]">
                            <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                Students
                            </div>
                            {studentSubItems.map(sub => (
                                <NavLink key={sub.path} to={sub.path}
                                    onClick={() => setStudentsDropUp(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors
                                        ${isActive ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-50 dark:text-gray-300 dark:hover:bg-orange-500/10"}`}>
                                    {sub.icon}
                                    <span>{sub.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

                {!APPROVING_AUTHORITIES.includes(role) && (
                    <NavLink to="/dashboard/obligations"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center text-xs gap-0.5
                            ${isActive ? "text-orange-500 font-bold" : "text-gray-500 dark:text-gray-400"}`}>
                        <FaClipboardList className="text-lg" />
                        <span className="text-[10px] mt-0.5">Obligations</span>
                    </NavLink>
                )}

                <NavLink to="/dashboard/settings"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center text-xs gap-0.5
                        ${isActive ? "text-orange-500 font-bold" : "text-gray-500 dark:text-gray-400"}`}>
                    <FaCog className="text-lg" />
                    <span className="text-[10px] mt-0.5">Settings</span>
                </NavLink>

                <button onClick={() => setShowLogoutModal(true)}
                    className="flex flex-col items-center justify-center text-xs gap-0.5 text-gray-500 dark:text-gray-400">
                    <FaSignOutAlt className="text-lg" />
                    <span className="text-[10px] mt-0.5">Sign Out</span>
                </button>
            </div>

            {/* ── Logout Modal ── */}
            {showLogoutModal && (
                <div className="logout-modal fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
                    onClick={() => setShowLogoutModal(false)}>
                    <div className="anim-slide-up rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.35)]
                        w-[90%] sm:w-[400px] p-6 relative bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100"
                        onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowLogoutModal(false)} className="absolute top-3 right-3">
                            <FaTimes size={18} color="#FE8901" />
                        </button>
                        <h2 className="text-lg font-bold mb-3">Confirm Logout</h2>
                        <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to log out?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded-lg text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[#2a2a2a] dark:text-gray-300 dark:hover:bg-[#333]">
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
};

export default AdminLayout;
