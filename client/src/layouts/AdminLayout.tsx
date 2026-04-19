import {
    FaTachometerAlt,
    FaUserGraduate,
    FaClipboardList,
    FaCog,
    FaSignOutAlt,
    FaTimes,
    FaChevronDown,
    FaChevronLeft,
    FaChevronRight,
    FaListUl,
    FaExclamationCircle,
    FaMoneyBillWave,
    FaStamp,
    FaFileAlt,
    FaFileUpload,
    FaChartBar,
} from "react-icons/fa";

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../../styles/index.css";
import logo from "../assets/ESO_Logo.png";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

const ALL_STUDENT_SUB_ITEMS = [
    { path: "/dashboard/students/import",           label: "Import Students",     icon: <FaFileUpload className="text-[11px]" />,     roles: ["eso_officer"] },
    { path: "/dashboard/students/list",             label: "Student List",        icon: <FaListUl className="text-[11px]" />,         roles: ["system_admin","eso_officer","class_officer","program_officer","program_head","signatory","dean"] },
    { path: "/dashboard/students/obligations-list", label: "Student Obligations", icon: <FaExclamationCircle className="text-[11px]" />, roles: ["system_admin","eso_officer","class_officer","program_officer"] },
    { path: "/dashboard/students/payments",         label: "Submission Review",   icon: <FaMoneyBillWave className="text-[11px]" />,  roles: ["system_admin","eso_officer","class_officer","program_officer"] },
    { path: "/dashboard/students/clearances",       label: "Clearance Approval",  icon: <FaStamp className="text-[11px]" />,          roles: ["system_admin","eso_officer","class_officer","program_officer","program_head","signatory","dean"] },
];

const APPROVING_AUTHORITIES = ["program_head", "signatory", "dean"];

const ROLE_LABELS: Record<string, string> = {
    system_admin:    "System Admin",
    eso_officer:     "ESO Officer",
    class_officer:   "Class Officer",
    program_officer: "Program Officer",
    program_head:    "Program Head",
    signatory:       "Signatory",
    dean:            "Dean",
    student:         "Student",
};

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const role = user?.role ?? "";
    const studentSubItems = ALL_STUDENT_SUB_ITEMS.filter(i => i.roles.includes(role));
    const location  = useLocation();
    const navigate  = useNavigate();
    useTheme(); // apply dark/light class on mount and on changes

    const isStudentsPath = location.pathname.startsWith("/dashboard/students");
    const [studentsOpen,    setStudentsOpen]    = useState(isStudentsPath);
    const [studentsDropUp,  setStudentsDropUp]  = useState(false);
    const [studentsFlyout,  setStudentsFlyout]  = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [collapsed,       setCollapsed]       = useState(() => window.innerWidth >= 768 && window.innerWidth < 1024);
    const dropUpRef  = useRef<HTMLDivElement>(null);
    const flyoutRef  = useRef<HTMLDivElement>(null);

    // Auto-collapse on tablet (768–1023px), auto-expand on laptop (≥1024px)
    useEffect(() => {
        const tabletMQ = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
        const laptopMQ = window.matchMedia("(min-width: 1024px)");
        function handleChange() {
            if (laptopMQ.matches)      setCollapsed(false);
            else if (tabletMQ.matches) setCollapsed(true);
        }
        handleChange();
        tabletMQ.addEventListener("change", handleChange);
        laptopMQ.addEventListener("change", handleChange);
        return () => {
            tabletMQ.removeEventListener("change", handleChange);
            laptopMQ.removeEventListener("change", handleChange);
        };
    }, []);

    // Close mobile drop-up on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (dropUpRef.current && !dropUpRef.current.contains(e.target as Node))
                setStudentsDropUp(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close collapsed flyout on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node))
                setStudentsFlyout(false);
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

    const navBase    = "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-sm font-medium";
    const navActive  = "bg-white/15 text-white font-semibold dark:bg-orange-500/20 dark:text-orange-400";
    const navInactive = "text-orange-100/70 hover:bg-white/10 hover:text-white dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white";

    return (
        <div className="main-admin-layout flex flex-col md:flex-row h-screen bg-white dark:bg-[#111111]">

            {/* ── Desktop Sidebar ── */}
            <div className={`desktop-sidebar hidden md:flex flex-col shrink-0 bg-orange-800 dark:bg-gray-900 transition-all duration-300 ease-in-out ${collapsed ? "w-16 p-2" : "w-56 p-4"}`}>

                {/* Logo */}
                <div className={`flex flex-col items-center justify-center mb-6 mt-2 ${collapsed ? "gap-1" : "gap-3"}`}>
                    <img src={logo} className="object-contain transition-all duration-300 drop-shadow-lg"
                        style={{ width: collapsed ? "32px" : "64px", height: collapsed ? "32px" : "64px" }} />
                    {!collapsed && (
                        <div className="text-center">
                            <p className="text-white font-extrabold text-sm tracking-wide leading-tight">ESO Auditing System</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/15 text-orange-200 text-[10px] font-semibold tracking-widest uppercase">
                                {ROLE_LABELS[role] ?? role}
                            </span>
                        </div>
                    )}
                </div>

                <nav className="flex flex-col gap-1 flex-1">

                    {/* Dashboard */}
                    <NavLink to="/dashboard/home" end title={collapsed ? "Dashboard" : ""}
                        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive} ${collapsed ? "justify-center px-2" : ""}`}>
                        <FaTachometerAlt className="shrink-0" />
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>

                    {/* Students */}
                    {collapsed ? (
                        <div className="relative" ref={flyoutRef}>
                            <button
                                onClick={() => setStudentsFlyout(o => !o)}
                                title="Students"
                                className={`${navBase} justify-center px-2 w-full ${isStudentsPath || studentsFlyout ? navActive : navInactive}`}>
                                <FaUserGraduate className="shrink-0" />
                            </button>
                            {studentsFlyout && (
                                <div className="absolute left-full top-0 ml-2 z-50 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.22)] min-w-[200px] overflow-hidden"
                                    style={{ animation: "fadeInUp 0.15s ease both" }}>
                                    <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                                        Students
                                    </div>
                                    {studentSubItems.map(sub => (
                                        <NavLink key={sub.path} to={sub.path}
                                            onClick={() => setStudentsFlyout(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors
                                                ${isActive ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-50 dark:text-gray-300 dark:hover:bg-orange-500/10"}`}>
                                            {sub.icon}
                                            <span>{sub.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setStudentsOpen(o => !o)}
                                className={`${navBase} w-full justify-between ${isStudentsPath ? navActive : navInactive}`}>
                                <div className="flex items-center gap-3">
                                    <FaUserGraduate className="shrink-0" />
                                    <span>Students</span>
                                </div>
                                <FaChevronDown className={`text-xs shrink-0 transition-transform duration-200 ${studentsOpen ? "rotate-180" : ""}`} />
                            </button>
                            <div className={`overflow-hidden transition-all duration-200 ${studentsOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                                <div className="ml-3 pl-3 flex flex-col gap-0.5 border-l-2 border-orange-500 dark:border-gray-700">
                                    {studentSubItems.map(sub => (
                                        <NavLink key={sub.path} to={sub.path}
                                            className={({ isActive }) =>
                                                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150
                                                ${isActive ? "bg-white/15 text-white font-semibold dark:bg-orange-500/20 dark:text-orange-400" : "text-orange-100/60 hover:bg-white/10 hover:text-white dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-200"}`}>
                                            {sub.icon}
                                            <span>{sub.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Obligations */}
                    {!APPROVING_AUTHORITIES.includes(role) && (
                        <NavLink to="/dashboard/obligations" title={collapsed ? "Obligations" : ""}
                            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive} ${collapsed ? "justify-center px-2" : ""}`}>
                            <FaClipboardList className="shrink-0" />
                            {!collapsed && <span>Obligations</span>}
                        </NavLink>
                    )}

                    {/* Documents */}
                    {["system_admin", "eso_officer"].includes(role) && (
                        <NavLink to="/dashboard/documents" title={collapsed ? "Documents" : ""}
                            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive} ${collapsed ? "justify-center px-2" : ""}`}>
                            <FaFileAlt className="shrink-0" />
                            {!collapsed && <span>Documents</span>}
                        </NavLink>
                    )}

                    {/* Audit */}
                    {["system_admin", "eso_officer"].includes(role) && (
                        <NavLink to="/dashboard/audit" title={collapsed ? "Audit" : ""}
                            className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive} ${collapsed ? "justify-center px-2" : ""}`}>
                            <FaChartBar className="shrink-0" />
                            {!collapsed && <span>Audit</span>}
                        </NavLink>
                    )}

                    {/* Settings */}
                    <NavLink to="/dashboard/settings" title={collapsed ? "Settings" : ""}
                        className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive} ${collapsed ? "justify-center px-2" : ""}`}>
                        <FaCog className="shrink-0" />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>

                    {/* Sign Out */}
                    <button onClick={() => setShowLogoutModal(true)} title={collapsed ? "Sign Out" : ""}
                        className={`${navBase} ${navInactive} mt-2 ${collapsed ? "justify-center px-2" : ""}`}>
                        <FaSignOutAlt className="shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </nav>

                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(c => !c)}
                    className={`mt-3 flex items-center gap-2 py-2 rounded-lg text-orange-100/60 hover:bg-white/10 hover:text-white dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-xs font-medium ${collapsed ? "justify-center px-2" : "px-3"}`}>
                    {collapsed ? <FaChevronRight className="shrink-0" /> : <><FaChevronLeft className="shrink-0" /><span>Collapse</span></>}
                </button>
            </div>

            {/* ── Main Content ── */}
            <div className="main-content flex-1 overflow-auto pb-20 md:pb-0">
                <Outlet key={location.pathname} />
            </div>

            {/* ── Mobile Bottom Navigation ── */}
            <div className="mobile-bottom-nav-container fixed bottom-0 left-0 right-0 md:hidden
                border-t shadow-md flex justify-around items-center h-14 z-50 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-700">

                <NavLink to="/dashboard/home" end
                    className={({ isActive }) =>
                        `flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                        ${isActive ? "bg-orange-500/15 text-orange-500" : "text-gray-400 dark:text-gray-500 hover:text-orange-500"}`}>
                    <FaTachometerAlt className="text-xl" />
                </NavLink>

                {/* Students — drop-up */}
                <div ref={dropUpRef} className="relative flex items-center justify-center">
                    <button
                        onClick={() => setStudentsDropUp(o => !o)}
                        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                            ${isStudentsPath || studentsDropUp ? "bg-orange-500/15 text-orange-500" : "text-gray-400 dark:text-gray-500 hover:text-orange-500"}`}>
                        <FaUserGraduate className="text-xl" />
                    </button>

                    {studentsDropUp && (
                        <div className="fixed bottom-16 left-1/2 -translate-x-1/2
                            rounded-2xl overflow-hidden shadow-[0_-8px_32px_rgba(0,0,0,0.18)]
                            w-56 z-50 bg-white dark:bg-[#1a1a1a]">
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
                            `flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                            ${isActive ? "bg-orange-500/15 text-orange-500" : "text-gray-400 dark:text-gray-500 hover:text-orange-500"}`}>
                        <FaClipboardList className="text-xl" />
                    </NavLink>
                )}

                {["system_admin", "eso_officer"].includes(role) && (
                    <NavLink to="/dashboard/audit"
                        className={({ isActive }) =>
                            `flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                            ${isActive ? "bg-orange-500/15 text-orange-500" : "text-gray-400 dark:text-gray-500 hover:text-orange-500"}`}>
                        <FaChartBar className="text-xl" />
                    </NavLink>
                )}

                <NavLink to="/dashboard/settings"
                    className={({ isActive }) =>
                        `flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                        ${isActive ? "bg-orange-500/15 text-orange-500" : "text-gray-400 dark:text-gray-500 hover:text-orange-500"}`}>
                    <FaCog className="text-xl" />
                </NavLink>

                <button onClick={() => setShowLogoutModal(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-colors">
                    <FaSignOutAlt className="text-xl" />
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
