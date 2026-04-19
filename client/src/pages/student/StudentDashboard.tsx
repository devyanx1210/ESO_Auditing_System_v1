import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { studentService } from "../../services/student.service";
import type { StudentProfile, StudentObligationItem, StudentClearance } from "../../services/student.service";
import { notificationService } from "../../services/notification.service";
import type { NotificationItem } from "../../services/notification.service";
import { paymentService } from "../../services/payment.service";
import { qrUrl } from "../../services/obligation.service";
import {
    FiBell, FiCreditCard, FiCamera, FiTrash2, FiX, FiZoomIn,
    FiDownload, FiCheckCircle, FiFileText, FiUpload,
    FiAlertCircle, FiClock, FiCircle,
    FiList, FiAlertTriangle, FiTrendingUp, FiShield, FiCheckSquare,
} from "react-icons/fi";

/* ── helpers ── */
function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function ordinalYear(n: number) {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
}

function cleanMessage(text: string) {
    return text.replace(/\s*[-–—]{2,}\s*/g, " ").replace(/^\s*[-–—]\s*/g, "").replace(/\s*[-–—]\s*$/g, "").trim();
}

function notifTypeIcon(type: number) {
    // 1=obligation_assigned, 2=payment_submitted, 3=payment_approved
    // 4=payment_rejected, 5=payment_returned, 6=clearance_signed
    // 7=clearance_cleared, 8=clearance_unapproved, 9=account_status
    if (type === 9)
        return <FiAlertTriangle className="w-4 h-4 text-red-500" />;
    if (type === 1)
        return <FiAlertCircle className="w-4 h-4 text-orange-500" />;
    if (type === 2)
        return <FiClock className="w-4 h-4 text-yellow-500" />;
    if (type === 3 || type === 7)
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
    if (type === 4 || type === 8)
        return <FiAlertTriangle className="w-4 h-4 text-red-400" />;
    if (type === 5)
        return <FiCreditCard className="w-4 h-4 text-orange-500" />;
    if (type === 6)
        return <FiShield className="w-4 h-4 text-green-600" />;
    // Default
    return <FiBell className="w-4 h-4 text-gray-400" />;
}

const CLEARANCE_STEPS = [
    { order: 1, label: "Class Officer" },
    { order: 2, label: "Program Officer" },
    { order: 3, label: "ESO Officer" },
    { order: 4, label: "Signatory" },
    { order: 5, label: "Program Head" },
    { order: 6, label: "Dean" },
];

type FilterMode = "all" | "settled" | "pending" | "overdue";

export default function StudentDashboard() {
    const { accessToken } = useAuth();
    const { darkMode, notificationsEnabled } = useTheme();
    const dk = darkMode;

    const [justSignedUp] = useState<boolean>(() => {
        const flag = sessionStorage.getItem("justSignedUp") === "1";
        if (flag) sessionStorage.removeItem("justSignedUp");
        return flag;
    });

    const [profile,       setProfile]       = useState<StudentProfile | null>(null);
    const [obligations,   setObligations]   = useState<StudentObligationItem[]>([]);
    const [clearance,     setClearance]     = useState<StudentClearance | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState("");

    // Filter for stat cards
    const [filterMode, setFilterMode] = useState<FilterMode>("all");

    // Notification bell
    const [bellOpen,   setBellOpen]   = useState(false);
    const [bellFading, setBellFading] = useState(false);
    const bellRef      = useRef<HTMLDivElement>(null);
    const bellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function startBellTimer() {
        if (bellTimerRef.current) clearTimeout(bellTimerRef.current);
        bellTimerRef.current = setTimeout(() => {
            setBellFading(true);
            setTimeout(() => { setBellOpen(false); setBellFading(false); }, 200);
        }, 10000);
    }
    function clearBellTimer() {
        if (bellTimerRef.current) clearTimeout(bellTimerRef.current);
    }

    // Payment / proof modal — reused for both payment and non-payment proof
    const [payModal,    setPayModal]    = useState<StudentObligationItem | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [payNotes,    setPayNotes]    = useState("");
    const [paying,      setPaying]      = useState(false);
    const [payError,    setPayError]    = useState("");

    // QR viewer modal
    const [qrView, setQrView] = useState<{ url: string; name: string } | null>(null);

    /* ── load data ── */
    useEffect(() => {
        if (!accessToken) return;
        Promise.all([
            studentService.getProfile(accessToken),
            studentService.getMyObligations(accessToken),
            studentService.getMyClearance(accessToken),
            notificationService.getAll(accessToken),
        ])
            .then(([p, o, c, n]) => {
                setProfile(p);
                setObligations(o);
                setClearance(c);
                setNotifications(n);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    /* ── real-time: poll notifications + obligations every 15s ── */
    useEffect(() => {
        if (!accessToken) return;
        const id = setInterval(() => {
            Promise.all([
                studentService.getMyObligations(accessToken),
                studentService.getMyClearance(accessToken),
                notificationService.getAll(accessToken),
            ]).then(([o, c, n]) => {
                setObligations(o);
                setClearance(c);
                setNotifications(n);
            }).catch(() => { /* silent — keep stale data */ });
        }, 15_000);
        return () => clearInterval(id);
    }, [accessToken]);

    /* ── close bell on outside click ── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setBellFading(true);
                setTimeout(() => { setBellOpen(false); setBellFading(false); }, 180);
                clearBellTimer();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── auto-close bell after 10s of no interaction ── */
    useEffect(() => {
        if (bellOpen) { startBellTimer(); }
        else { clearBellTimer(); }
        return clearBellTimer;
    }, [bellOpen]);

    /* ── derived stats ── */
    const paidCount      = obligations.filter(o => o.status === 2 || o.status === 3).length;
    const totalCount     = obligations.length;
    const progressPct    = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    const overdueCount   = obligations.filter(o => o.isOverdue && o.status !== 2 && o.status !== 3).length;
    const unreadCount    = notifications.filter(n => !n.isRead).length;
    const pendingCount   = obligations.filter(o => o.status === 1).length;
    const allObligationsDone = totalCount > 0 && paidCount === totalCount;

    /* ── filtered obligations based on active stat card ── */
    const visibleObs =
        filterMode === "settled" ? obligations.filter(o => o.status === 2 || o.status === 3) :
        filterMode === "pending" ? obligations.filter(o => o.status === 1) :
        filterMode === "overdue" ? obligations.filter(o => o.isOverdue && o.status !== 2 && o.status !== 3) :
        obligations;

    /* ── notification actions ── */
    async function handleMarkRead(id: number) {
        if (!accessToken) return;
        await notificationService.markRead(accessToken, id);
        setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    }
    async function handleMarkAllRead() {
        if (!accessToken) return;
        await notificationService.markAllRead(accessToken);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
    async function handleDeleteNotif(id: number) {
        if (!accessToken) return;
        try { await notificationService.delete(accessToken, id); } catch { /* silent */ }
        setNotifications(prev => prev.filter(n => n.notificationId !== id));
    }

    /* ── open modal ── */
    function openPayModal(o: StudentObligationItem) {
        setPayModal(o);
        setPayError("");
        setReceiptFile(null);
        setFilePreview(null);
        setPayNotes("");
    }

    /* ── file with image preview ── */
    function handleFileChange(file: File | null) {
        setReceiptFile(file);
        if (file && file.type.startsWith("image/")) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    }

    /* ── payment / proof submit ── */
    async function handlePaySubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!accessToken || !payModal || !receiptFile) {
            setPayError("Please attach a file.");
            return;
        }
        setPaying(true);
        setPayError("");
        try {
            if (payModal.requiresPayment) {
                await paymentService.submitReceipt(
                    accessToken,
                    payModal.studentObligationId,
                    payModal.amount,
                    receiptFile,
                    payNotes || undefined,
                );
            } else {
                await paymentService.submitProof(
                    accessToken,
                    payModal.studentObligationId,
                    receiptFile,
                );
            }
            const [updatedObs, updatedNotifs] = await Promise.all([
                studentService.getMyObligations(accessToken),
                notificationService.getAll(accessToken),
            ]);
            setObligations(updatedObs);
            setNotifications(updatedNotifs);
            setPayModal(null);
            setReceiptFile(null);
            setFilePreview(null);
            setPayNotes("");
        } catch (err: any) {
            setPayError(err.message ?? "Failed to submit.");
        } finally {
            setPaying(false);
        }
    }

    /* ── loading / error ── */
    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${dk ? "bg-[#111111]" : "bg-gray-50"}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );
    if (error) return (
        <div className={`flex items-center justify-center min-h-screen ${dk ? "bg-[#111111]" : "bg-gray-50"}`}>
            <p className="text-red-500">{error}</p>
        </div>
    );

    const isPaymentModal = payModal?.requiresPayment ?? true;
    const card = dk ? "bg-[#1a1a1a] border border-[#2a2a2a]" : "bg-white";
    const txt  = dk ? "text-white"   : "text-gray-800";
    const sub  = dk ? "text-gray-400" : "text-gray-500";

    /* ── render ── */
    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${dk ? "bg-[#111111]" : "bg-gray-50"}`}>

            {/* ── TOP BAR ── */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className={`text-2xl sm:text-3xl font-bold ${txt}`}>
                        {justSignedUp ? `Welcome, ${profile?.firstName}!` : `Welcome back, ${profile?.firstName}!`}
                    </h1>
                    {profile && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-orange-500/20 text-orange-500 text-xs font-semibold px-3 py-1 rounded-full">
                                {profile.programName}
                            </span>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${dk ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                                {profile.studentNo}
                            </span>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${dk ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                                {ordinalYear(profile.yearLevel)} Year Section {profile.section}
                            </span>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${dk ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                                {profile.schoolYear} · {profile.semester} Sem
                            </span>
                        </div>
                    )}
                </div>

                {/* Notification Bell */}
                <div className="relative mt-1" ref={bellRef}>
                    {notificationsEnabled && (<>
                    <button
                        onClick={() => setBellOpen(o => !o)}
                        className="relative p-1.5 text-orange-500 hover:text-orange-600 transition"
                        aria-label="Notifications"
                    >
                        <FiBell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {bellOpen && (
                        <div
                            className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 border overflow-hidden ${bellFading ? "anim-drop-out" : "anim-drop-in"} ${dk ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-gray-100"}`}
                            onMouseEnter={startBellTimer}
                        >
                            <div className={`flex items-center justify-between px-4 py-3 border-b ${dk ? "bg-[#0f0f0f] border-[#2a2a2a]" : "bg-gray-50"}`}>
                                <span className={`font-semibold text-sm ${dk ? "text-white" : "text-gray-800"}`}>Notifications</span>
                                {unreadCount > 0 && (
                                    <button onClick={() => { handleMarkAllRead(); startBellTimer(); }} className="text-xs text-orange-500 hover:text-orange-400 font-medium">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className={`max-h-96 overflow-y-auto divide-y ${dk ? "divide-[#2a2a2a]" : ""}`}>
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center py-10 text-gray-400">
                                        <FiBell className="w-8 h-8 mb-2 opacity-40" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : notifications.map((n, idx) => (
                                    <div
                                        key={n.notificationId}
                                        className={`anim-item px-4 py-3 transition ${!n.isRead
                                            ? dk ? "bg-orange-500/10 hover:bg-orange-500/20" : "bg-gray-100 hover:bg-gray-200"
                                            : dk ? "bg-[#1a1a1a] hover:bg-[#222]" : "bg-white hover:bg-gray-50"}`}
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                    >
                                        <div className="flex items-start">
                                            <p className={`text-sm font-semibold leading-tight ${!n.isRead ? dk ? "text-orange-300" : "text-gray-900" : dk ? "text-gray-400" : "text-gray-600"}`}>
                                                {n.title}
                                            </p>
                                        </div>
                                        <p className={`text-xs mt-1 line-clamp-2 ${dk ? "text-gray-500" : "text-gray-500"}`}>{cleanMessage(n.message)}</p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <div className="flex items-center gap-3">
                                                <p className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                                                {!n.isRead && (
                                                    <button onClick={() => { handleMarkRead(n.notificationId); startBellTimer(); }} className="text-[10px] text-orange-500 hover:text-orange-400 font-medium">
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                            <button onClick={() => { handleDeleteNotif(n.notificationId); startBellTimer(); }} className="text-red-400 hover:text-red-500 transition" title="Delete">
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </>)}
                </div>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="anim-section grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" style={{ animationDelay: "60ms", gridAutoRows: "1fr" }}>
                <StatCard
                    label="Total Obligations"
                    value={totalCount}
                    color="orange"
                    active={filterMode === "all"}
                    onClick={() => setFilterMode("all")}
                />
                <StatCard
                    label="Total Obligations Settled"
                    value={paidCount}
                    color="green"
                    active={filterMode === "settled"}
                    onClick={() => setFilterMode(f => f === "settled" ? "all" : "settled")}
                />
                <StatCard
                    label="Pending Obligations"
                    value={pendingCount}
                    color="yellow"
                    active={filterMode === "pending"}
                    onClick={() => setFilterMode(f => f === "pending" ? "all" : "pending")}
                />
                <StatCard
                    label="Overdue Obligations"
                    value={overdueCount}
                    color="red"
                    active={filterMode === "overdue"}
                    onClick={() => setFilterMode(f => f === "overdue" ? "all" : "overdue")}
                />
            </div>

            {/* ── PROGRESS + CLEARANCE CARD ── */}
            <div className={`anim-section rounded-2xl shadow-xl p-6 mb-6 ${card}`} style={{ animationDelay: "160ms" }}>

                {/* Obligation progress */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <FiTrendingUp className="w-4 h-4 text-orange-500" />
                        <h2 className={`font-semibold text-sm ${txt}`}>Progress</h2>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                    <div
                        className="h-3.5 rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%`, backgroundColor: "#EA580C" }}
                    />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                    {paidCount} of {totalCount} obligation{totalCount !== 1 ? "s" : ""} settled
                </p>

                {/* Divider */}
                <div className="border-t border-gray-100 my-5" />

                {/* Clearance stepper */}
                <div className="flex items-center gap-2 mb-4">
                    <FiShield className="w-4 h-4 text-orange-500" />
                    <h3 className={`font-semibold text-sm ${txt}`}>Clearance Status</h3>
                </div>

                {/* Status message */}
                {clearance?.clearanceId ? (
                    clearance.status === 2
                        ? <p className="text-xs text-green-600 font-semibold text-center mb-3">🎉 Clearance fully approved!</p>
                        : <p className="text-xs text-orange-500 text-center mb-3">Clearance in progress. Step {clearance.currentStep} of {CLEARANCE_STEPS.length}</p>
                ) : allObligationsDone ? (
                    <p className="text-xs text-orange-500 font-medium text-center mb-3">
                        All obligations complete. Awaiting class officer approval.
                    </p>
                ) : (
                    <p className="text-xs text-gray-400 text-center mb-3">
                        Complete all obligations to begin clearance.
                    </p>
                )}

                {/* Always show the stepper — gray if not started, active once clearance begins */}
                <div className="flex items-start">
                    {CLEARANCE_STEPS.map((step, idx) => {
                        const match      = clearance?.steps.find(s => s.stepOrder === step.order);
                        const isCurrent  = !!clearance?.clearanceId && clearance.currentStep === step.order;
                        const isDone     = match?.status === 1;
                        const isRejected = match?.status === 2;
                        // When obligations are done but clearance not yet started, highlight step 1 as "up next"
                        const isUpNext   = !clearance?.clearanceId && allObligationsDone && step.order === 1;

                        return (
                            <React.Fragment key={step.order}>
                                <div className="flex flex-col items-center flex-1">
                                    {/* Step circle */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                        isDone     ? "bg-green-500 border-green-500 text-white"   :
                                        isRejected ? "bg-red-500   border-red-500   text-white"   :
                                        isCurrent  ? "bg-orange-500 border-orange-500 text-white" :
                                        isUpNext   ? "bg-orange-100 border-orange-400 text-orange-500" :
                                        "bg-white border-gray-300 text-gray-400"
                                    }`}>
                                        {isDone ? <FiCheckCircle className="w-4 h-4" /> : isRejected ? "✕" : idx + 1}
                                    </div>
                                    {/* Step label */}
                                    <p className={`text-[10px] font-medium text-center mt-1.5 leading-tight max-w-[64px] ${
                                        isDone     ? "text-green-600"  :
                                        isRejected ? "text-red-500"    :
                                        isCurrent  ? "text-orange-600" :
                                        isUpNext   ? "text-orange-500" :
                                        "text-gray-400"
                                    }`}>
                                        {step.label}
                                    </p>
                                    {match?.verifiedAt && (
                                        <p className="text-[9px] text-gray-400 mt-0.5 text-center">
                                            {new Date(match.verifiedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                                        </p>
                                    )}
                                    {match?.remarks && isRejected && (
                                        <p className="text-[9px] text-red-500 mt-0.5 text-center leading-tight max-w-[64px]">{match.remarks}</p>
                                    )}
                                </div>
                                {/* Connector line */}
                                {idx < CLEARANCE_STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mt-4 mx-1 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── OBLIGATIONS CHECKLIST ── */}
                <div className={`anim-section lg:col-span-2 rounded-2xl shadow-xl p-5 ${card}`} style={{ animationDelay: "260ms" }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FiList className="w-4 h-4 text-orange-500" />
                            <h2 className={`font-semibold text-sm ${txt}`}>My Obligations</h2>
                        </div>
                        {filterMode !== "all" && (
                            <button
                                onClick={() => setFilterMode("all")}
                                className="text-xs text-orange-500 hover:text-orange-700 font-medium flex items-center gap-1"
                            >
                                <FiX className="w-3 h-3" /> Clear filter
                            </button>
                        )}
                    </div>

                    {visibleObs.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-10">
                            {obligations.length === 0 ? "No obligations assigned yet." : "No obligations in this category."}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {visibleObs.map((o, idx) => {
                                const isDone     = o.status === 2 || o.status === 3;
                                const isPending  = o.status === 1;
                                const isRejected = o.latestPayment?.paymentStatus === 2;
                                const canPay     = o.requiresPayment  && (o.status === 0 || (isPending && isRejected));
                                const canProof   = !o.requiresPayment && (o.status === 0 || (isPending && isRejected));

                                return (
                                    <div
                                        key={o.studentObligationId}
                                        className={`anim-item p-4 rounded-xl border shadow-sm ${dk ? "bg-[#222] border-[#2a2a2a]" : "bg-gray-50 border-gray-200"}`}
                                        style={{ animationDelay: `${idx * 60}ms` }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Status icon */}
                                            {isDone
                                                ? <FiCheckCircle className="mt-0.5 w-4 h-4 text-green-500 shrink-0" />
                                                : isPending
                                                ? <FiClock       className="mt-0.5 w-4 h-4 text-yellow-500 shrink-0" />
                                                : o.isOverdue
                                                ? <FiAlertCircle className="mt-0.5 w-4 h-4 text-red-500   shrink-0" />
                                                : <FiCircle      className="mt-0.5 w-4 h-4 text-gray-400  shrink-0" />
                                            }

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <p className={`font-medium text-sm ${isDone ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-800 dark:text-white"}`}>
                                                        {o.obligationName}
                                                    </p>
                                                    <StatusBadge obligation={o} />
                                                </div>

                                                {o.description && (
                                                    <p className="text-xs text-gray-500 mb-1">{o.description}</p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                    {o.requiresPayment
                                                        ? <span className="font-semibold text-gray-700">₱{Number(o.amount).toFixed(2)}</span>
                                                        : <span className="text-orange-600 font-semibold flex items-center gap-1">
                                                            <FiCamera className="w-3 h-3" /> Proof of Compliance
                                                          </span>
                                                    }
                                                    {o.dueDate && (
                                                        <span className={o.isOverdue && !isDone ? "text-red-600 font-semibold" : ""}>
                                                            Due: {new Date(o.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                    )}
                                                </div>

                                                {isRejected && o.latestPayment?.remarks && (
                                                    <p className="mt-1.5 text-xs text-red-600">Rejected: {o.latestPayment.remarks}</p>
                                                )}
                                            </div>

                                            {/* Pay button */}
                                            {canPay && (
                                                <button
                                                    onClick={() => openPayModal(o)}
                                                    className={`flex-shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm ${
                                                        isRejected ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                                                    }`}
                                                >
                                                    <FiCreditCard className="w-3 h-3" />
                                                    {isRejected ? "Re-submit" : "Pay"}
                                                </button>
                                            )}

                                            {/* Proof button for non-payment obligations */}
                                            {canProof && (
                                                <button
                                                    onClick={() => openPayModal(o)}
                                                    className={`flex-shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm ${
                                                        isRejected ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                                                    }`}
                                                >
                                                    <FiCamera className="w-3 h-3" />
                                                    {isRejected ? "Re-submit" : "Submit Proof"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="anim-section" style={{ animationDelay: "340ms" }}>
                    {/* CHECKLIST */}
                    <div className={`rounded-2xl shadow-xl p-5 h-full ${card}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FiCheckSquare className="w-4 h-4 text-orange-500" />
                            <h2 className={`font-semibold text-sm ${txt}`}>Checklist</h2>
                            <span className="ml-auto text-xs font-semibold text-orange-500 dark:text-orange-400">
                                {paidCount}/{totalCount}
                            </span>
                        </div>

                        {obligations.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">No obligations yet</p>
                        ) : (
                            <div className="space-y-2.5">
                                {obligations.map(o => {
                                    const isDone = o.status === 2 || o.status === 3;
                                    return (
                                        <label
                                            key={o.studentObligationId}
                                            className="flex items-center gap-3 py-2 px-1 cursor-default select-none"
                                        >
                                            <input
                                                type="checkbox"
                                                readOnly
                                                checked={isDone}
                                                className="w-4 h-4 shrink-0 pointer-events-none"
                                            />
                                            <span className={`text-sm flex-1 truncate ${isDone ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                                                {o.obligationName}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── PAYMENT / PROOF MODAL ── */}
            {payModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPayModal(null)}>
                    <div className="anim-slide-up bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="px-6 py-5 flex items-center justify-between shrink-0 bg-orange-500">
                            <div className="flex items-center gap-3">
                                {isPaymentModal
                                    ? <FiCreditCard className="w-5 h-5 text-white" />
                                    : <FiCamera className="w-5 h-5 text-white" />
                                }
                                <div>
                                    <p className="font-bold text-white text-base leading-tight">
                                        {isPaymentModal ? "Submit Payment" : "Submit Proof of Compliance"}
                                    </p>
                                    <p className="text-xs text-white/70 mt-0.5">{payModal.obligationName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPayModal(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition text-white"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handlePaySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

                            {/* Obligation summary card */}
                            <div className="rounded-xl p-4 bg-orange-50 border border-orange-100">
                                <p className="font-bold text-gray-900 text-base">{payModal.obligationName}</p>
                                {payModal.description && (
                                    <p className="text-xs text-gray-500 mt-1">{payModal.description}</p>
                                )}
                                {isPaymentModal ? (
                                    <p className="text-2xl font-extrabold text-orange-600 mt-2">
                                        ₱{Number(payModal.amount).toFixed(2)}
                                    </p>
                                ) : (
                                    <p className="text-xs text-orange-600 font-semibold mt-2 flex items-center gap-1">
                                        <FiCamera className="w-3.5 h-3.5" /> Proof of compliance required
                                    </p>
                                )}
                                {payModal.dueDate && (
                                    <p className={`text-xs mt-1 ${payModal.isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                                        Due: {new Date(payModal.dueDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                                        {payModal.isOverdue && " · OVERDUE"}
                                    </p>
                                )}
                            </div>

                            {/* GCash QR (payment only) */}
                            {isPaymentModal && payModal.gcashQrPath && (
                                <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 bg-gray-50">
                                    <img
                                        src={qrUrl(payModal.gcashQrPath)}
                                        alt="GCash QR"
                                        className="w-20 h-20 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
                                        onClick={() => setQrView({ url: qrUrl(payModal.gcashQrPath!), name: payModal.obligationName })}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">GCash QR Code</p>
                                        <p className="text-xs text-gray-500 mt-1">Scan with your GCash app to pay</p>
                                        <button
                                            type="button"
                                            onClick={() => setQrView({ url: qrUrl(payModal.gcashQrPath!), name: payModal.obligationName })}
                                            className="mt-2 text-xs text-orange-500 hover:text-orange-700 flex items-center gap-1 font-medium"
                                        >
                                            <FiZoomIn className="w-3 h-3" /> View full size
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            {isPaymentModal ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 space-y-1">
                                    <p className="font-semibold">Payment Instructions:</p>
                                    <p>1. Scan the GCash QR above or send to the ESO GCash number</p>
                                    <p>2. Take a screenshot of your GCash receipt showing the transaction</p>
                                    <p>3. Upload the screenshot below</p>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 space-y-1">
                                    <p className="font-semibold">Proof Submission Instructions:</p>
                                    <p>1. Prepare a clear screenshot or photo as proof of compliance</p>
                                    <p>2. Make sure the proof clearly shows your participation or completion</p>
                                    <p>3. Upload the file below</p>
                                </div>
                            )}

                            {/* File upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {isPaymentModal ? "GCash Receipt / Payment Screenshot" : "Proof of Compliance (screenshot or photo)"} *
                                </label>

                                {/* Image preview */}
                                {filePreview && (
                                    <div className="mb-3 relative">
                                        <img
                                            src={filePreview}
                                            alt="Preview"
                                            className="w-full max-h-52 object-contain rounded-xl border border-gray-200 bg-gray-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setReceiptFile(null); setFilePreview(null); }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {!filePreview && (
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition border-gray-300 bg-gray-50 hover:bg-gray-100">
                                        {receiptFile ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium px-4 text-center">
                                                <FiFileText className="w-5 h-5 text-orange-500" />
                                                <span className="truncate max-w-xs">{receiptFile.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center pointer-events-none">
                                                <FiUpload className="w-6 h-6 mb-2 text-orange-400" />
                                                <p className="text-sm font-medium text-gray-600">Click to upload</p>
                                                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or PDF · Max 5MB</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            className="hidden"
                                            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                    rows={2}
                                    className="w-full border border-gray-200 focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 text-sm resize-none"
                                    placeholder={isPaymentModal
                                        ? "e.g. Reference number, payment date..."
                                        : "e.g. Event name, date attended..."
                                    }
                                    value={payNotes}
                                    onChange={e => setPayNotes(e.target.value)}
                                />
                            </div>

                            {payError && <p className="text-red-500 text-sm">{payError}</p>}

                            <button
                                type="submit"
                                disabled={paying || !receiptFile}
                                className="w-full disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm bg-orange-500 hover:bg-orange-600"
                            >
                                {paying ? "Submitting..." : isPaymentModal ? "Submit Receipt" : "Submit Proof"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── QR VIEWER MODAL ── */}
            {qrView && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setQrView(null)}
                >
                    <div
                        className="anim-slide-up bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-orange-500 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FiZoomIn className="w-4 h-4 text-white" />
                                <p className="font-semibold text-white text-sm truncate">{qrView.name}</p>
                            </div>
                            <button
                                onClick={() => setQrView(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5">
                            <img src={qrView.url} alt="GCash QR Code" className="w-full rounded-xl border border-gray-200" />
                            <a
                                href={qrView.url}
                                download
                                className="mt-4 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
                            >
                                <FiDownload className="w-4 h-4" /> Download QR
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Status Badge ── */
function StatusBadge({ obligation: o }: { obligation: StudentObligationItem }) {
    if (o.status === 2 || o.status === 3) {
        // Proof-only: no paid/unpaid label, just show "Submitted"
        if (!o.requiresPayment) return <span className="text-xs font-semibold text-white dark:text-green-300 bg-green-500 dark:bg-green-900/60 px-2 py-0.5 rounded-full">{o.status === 3 ? "Waived" : "Submitted"}</span>;
        return <span className="text-xs font-semibold text-white dark:text-green-300 bg-green-500 dark:bg-green-900/60 px-2 py-0.5 rounded-full">Paid</span>;
    }
    if (o.status === 1) {
        return <span className="text-xs font-semibold text-white dark:text-yellow-300 bg-yellow-500 dark:bg-yellow-900/60 px-2 py-0.5 rounded-full">Pending Verification</span>;
    }
    if (o.isOverdue) {
        return <span className="text-xs font-semibold text-white dark:text-red-300 bg-red-500 dark:bg-red-900/60 px-2 py-0.5 rounded-full">Overdue</span>;
    }
    // Proof-only: no "Unpaid" label
    if (!o.requiresPayment) return null;
    return <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-[#2a2a2a] px-2 py-0.5 rounded-full">Unpaid</span>;
}

/* ── Stat Card ── */
const STAT_ICONS = {
    orange: FiList,
    green:  FiCheckCircle,
    yellow: FiClock,
    red:    FiAlertTriangle,
};

const ACTIVE_BG = {
    orange: "bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_12px_32px_rgba(234,88,12,0.45)]",
    green:  "bg-gradient-to-br from-green-500 to-green-700 shadow-[0_12px_32px_rgba(22,163,74,0.35)]",
    yellow: "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_12px_32px_rgba(202,138,4,0.35)]",
    red:    "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_12px_32px_rgba(220,38,38,0.35)]",
};

function StatCard({
    label, value, color, active, onClick,
}: {
    label: string; value: number; color: "orange" | "green" | "yellow" | "red";
    active?: boolean; onClick?: () => void;
}) {
    const Icon = STAT_ICONS[color];
    return (
        <button
            onClick={onClick}
            className={`rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer w-full h-full flex flex-col gap-2 sm:gap-3 relative overflow-hidden ${
                active
                    ? `${ACTIVE_BG[color]}`
                    : "bg-white dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a] shadow-[0_6px_24px_rgba(0,0,0,0.13)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.20)]"
            }`}
        >
            {/* Top row: label + icon */}
            <div className="flex items-start justify-between gap-2">
                <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide leading-snug ${active ? "text-white/75" : "text-gray-500 dark:text-gray-400"}`}>{label}</p>
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${active ? "text-white/60" : "text-orange-400"}`} />
            </div>
            {/* Number */}
            <p className={`text-2xl sm:text-[1.75rem] font-black tracking-tight leading-tight ${active ? "text-white" : "text-gray-800 dark:text-white"}`}>{value}</p>
        </button>
    );
}
