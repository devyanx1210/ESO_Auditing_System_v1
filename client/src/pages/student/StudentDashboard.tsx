import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { studentService, receiptUrl } from "../../services/student.service";
import type { StudentProfile, StudentObligationItem, StudentClearance } from "../../services/student.service";
import { notificationService } from "../../services/notification.service";
import type { NotificationItem } from "../../services/notification.service";
import { paymentService } from "../../services/payment.service";
import { qrUrl } from "../../services/obligation.service";

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

const CLEARANCE_STEPS = [
    { order: 1, label: "ESO Officer" },
    { order: 2, label: "Program Head" },
    { order: 3, label: "Signatory" },
    { order: 4, label: "Dean" },
];

export default function StudentDashboard() {
    const { accessToken } = useAuth();

    const [profile,       setProfile]       = useState<StudentProfile | null>(null);
    const [obligations,   setObligations]   = useState<StudentObligationItem[]>([]);
    const [clearance,     setClearance]     = useState<StudentClearance | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState("");

    // Notification bell
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    // Payment modal
    const [payModal,    setPayModal]    = useState<StudentObligationItem | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
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

    /* ── close bell on outside click ── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node))
                setBellOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── derived stats ── */
    const paidCount    = obligations.filter(o => o.status === "paid" || o.status === "waived").length;
    const totalCount   = obligations.length;
    const progressPct  = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    const overdueCount = obligations.filter(o => o.isOverdue).length;
    const unreadCount  = notifications.filter(n => !n.isRead).length;
    const pendingCount = obligations.filter(o => o.status === "pending_verification").length;

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

    /* ── payment submit ── */
    async function handlePaySubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!accessToken || !payModal || !receiptFile) {
            setPayError("Please attach a receipt file.");
            return;
        }
        setPaying(true);
        setPayError("");
        try {
            await paymentService.submitReceipt(
                accessToken,
                payModal.studentObligationId,
                payModal.amount,
                receiptFile,
                payNotes || undefined
            );
            const [updatedObs, updatedNotifs] = await Promise.all([
                studentService.getMyObligations(accessToken),
                notificationService.getAll(accessToken),
            ]);
            setObligations(updatedObs);
            setNotifications(updatedNotifs);
            setPayModal(null);
            setReceiptFile(null);
            setPayNotes("");
        } catch (err: any) {
            setPayError(err.message ?? "Failed to submit payment.");
        } finally {
            setPaying(false);
        }
    }

    /* ── loading / error ── */
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <p className="text-red-500">{error}</p>
        </div>
    );

    /* ── render ── */
    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">

            {/* ── TOP BAR ── */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        Welcome back, {profile?.firstName}!
                    </h1>
                    {profile && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                                {profile.programCode}
                            </span>
                            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                                {profile.studentNo}
                            </span>
                            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                                Year {profile.yearLevel} — {profile.section}
                            </span>
                            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                                {profile.schoolYear} · {profile.semester} Sem
                            </span>
                        </div>
                    )}
                </div>

                {/* Notification Bell */}
                <div className="relative mt-1" ref={bellRef}>
                    <button
                        onClick={() => setBellOpen(o => !o)}
                        className="relative p-2 rounded-full bg-white shadow hover:bg-gray-100 transition"
                        aria-label="Notifications"
                    >
                        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v2.586l-1.707 1.707A1 1 0 003 14h14a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6zm0 16a2 2 0 002-2H8a2 2 0 002 2z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {bellOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                                <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllRead} className="text-xs text-orange-500 hover:text-orange-700 font-medium">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto divide-y">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-gray-400">
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : notifications.map(n => (
                                    <div
                                        key={n.notificationId}
                                        className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition ${!n.isRead ? "bg-orange-50" : ""}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                        </div>
                                        {!n.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(n.notificationId)}
                                                className="self-start mt-1 text-[10px] text-orange-500 hover:text-orange-700 whitespace-nowrap"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total" value={totalCount}   color="orange" />
                <StatCard label="Settled" value={paidCount}  color="green" />
                <StatCard label="Pending" value={pendingCount} color="yellow" />
                <StatCard label="Overdue" value={overdueCount} color="red" />
            </div>

            {/* ── PROGRESS BAR ── */}
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-semibold text-gray-800 text-sm">Obligation Progress</h2>
                    <span className="text-sm font-bold text-orange-600">{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%`, backgroundColor: "#FE8901" }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {paidCount} of {totalCount} obligation{totalCount !== 1 ? "s" : ""} settled
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── OBLIGATIONS CHECKLIST ── */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-5">
                    <h2 className="font-semibold text-gray-800 mb-4 text-sm">My Obligations</h2>

                    {obligations.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-10">No obligations assigned yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {obligations.map(o => {
                                const isDone = o.status === "paid" || o.status === "waived";
                                const isPending = o.status === "pending_verification";
                                const isRejected = o.latestPayment?.paymentStatus === "rejected";
                                const canPay = o.requiresPayment && (o.status === "unpaid" || (isPending && isRejected));

                                return (
                                    <div
                                        key={o.studentObligationId}
                                        className={`p-4 rounded-xl border ${
                                            o.isOverdue && !isDone
                                                ? "border-red-200 bg-red-50"
                                                : isDone
                                                ? "border-green-200 bg-green-50"
                                                : isPending
                                                ? "border-yellow-200 bg-yellow-50"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Status dot */}
                                            <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                                isDone     ? "bg-green-500"  :
                                                isPending  ? "bg-yellow-400" :
                                                o.isOverdue ? "bg-red-500"  :
                                                "bg-gray-400"
                                            }`} />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <p className={`font-medium text-sm ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>
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
                                                        : <span className="text-green-600 font-semibold">Free</span>
                                                    }
                                                    {o.dueDate && (
                                                        <span className={o.isOverdue && !isDone ? "text-red-600 font-semibold" : ""}>
                                                            Due: {new Date(o.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                    )}
                                                    {/* GCash QR link */}
                                                    {o.requiresPayment && o.gcashQrPath && !isDone && (
                                                        <button
                                                            onClick={() => setQrView({ url: qrUrl(o.gcashQrPath!), name: o.obligationName })}
                                                            className="text-orange-500 hover:underline font-medium"
                                                        >
                                                            View GCash QR
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Receipt link + rejection remark */}
                                                {o.latestPayment && (
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                                                        <a
                                                            href={receiptUrl(o.latestPayment.receiptPath)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-orange-600 hover:underline"
                                                        >
                                                            View Receipt
                                                        </a>
                                                        {isRejected && o.latestPayment.remarks && (
                                                            <span className="text-red-600">Rejected: {o.latestPayment.remarks}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pay / Re-submit button */}
                                            {canPay && (
                                                <button
                                                    onClick={() => { setPayModal(o); setPayError(""); setReceiptFile(null); setPayNotes(""); }}
                                                    className={`flex-shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                                                        isRejected ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                                                    }`}
                                                >
                                                    {isRejected ? "Re-submit" : "Pay"}
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
                <div className="space-y-6">

                    {/* CLEARANCE STATUS */}
                    <div className="bg-white rounded-2xl shadow-md p-5">
                        <h2 className="font-semibold text-gray-800 mb-4 text-sm">Clearance Status</h2>

                        {!clearance || clearance.clearanceId === null ? (
                            <div className="text-center py-4 text-gray-400">
                                <p className="text-xs">No clearance record yet.</p>
                                <p className="text-xs mt-1">Complete all obligations to begin clearance.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                        clearance.status === "cleared"     ? "bg-green-100 text-green-700"  :
                                        clearance.status === "in_progress" ? "bg-blue-100 text-blue-700"    :
                                        clearance.status === "rejected"    ? "bg-red-100 text-red-700"      :
                                        "bg-gray-100 text-gray-600"
                                    }`}>
                                        {clearance.status === "cleared"     ? "Fully Cleared"  :
                                         clearance.status === "in_progress" ? "In Progress"    :
                                         clearance.status === "rejected"    ? "Rejected"        :
                                         "Pending"}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {CLEARANCE_STEPS.map(step => {
                                        const match      = clearance.steps.find(s => s.stepOrder === step.order);
                                        const isCurrent  = clearance.currentStep === step.order;
                                        const isDone     = match?.status === "signed";
                                        const isRejected = match?.status === "rejected";

                                        return (
                                            <div key={step.order} className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                                    isDone     ? "bg-green-500 text-white"  :
                                                    isRejected ? "bg-red-500 text-white"    :
                                                    isCurrent  ? "bg-orange-500 text-white" :
                                                    "bg-gray-200 text-gray-500"
                                                }`}>
                                                    {isDone ? "✓" : isRejected ? "✕" : step.order}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-xs font-medium ${
                                                        isDone     ? "text-green-700"  :
                                                        isRejected ? "text-red-600"    :
                                                        isCurrent  ? "text-orange-600" :
                                                        "text-gray-500"
                                                    }`}>
                                                        {step.label}
                                                    </p>
                                                    {match?.verifiedAt && (
                                                        <p className="text-[10px] text-gray-400">
                                                            {new Date(match.verifiedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                                                        </p>
                                                    )}
                                                    {match?.remarks && isRejected && (
                                                        <p className="text-[10px] text-red-500">{match.remarks}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* QUICK CHECKLIST */}
                    <div className="bg-white rounded-2xl shadow-md p-5">
                        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Checklist</h2>
                        <div className="space-y-2">
                            {obligations.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-2">No obligations yet</p>
                            )}
                            {obligations.map(o => {
                                const isDone = o.status === "paid" || o.status === "waived";
                                return (
                                    <div key={o.studentObligationId} className="flex items-center gap-2">
                                        <span className={`text-sm leading-none ${
                                            isDone               ? "text-green-500" :
                                            o.status === "pending_verification" ? "text-yellow-500" :
                                            o.isOverdue          ? "text-red-500"   :
                                            "text-gray-400"
                                        }`}>
                                            {isDone ? "✓" : o.isOverdue ? "!" : "○"}
                                        </span>
                                        <span className={`text-xs truncate ${isDone ? "line-through text-gray-400" : "text-gray-700"}`}>
                                            {o.obligationName}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PAYMENT MODAL ── */}
            {payModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
                            <span className="font-semibold text-white">Submit Payment</span>
                            <button onClick={() => setPayModal(null)} className="text-white hover:text-orange-200 text-xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
                            {/* Obligation info */}
                            <div className="bg-orange-50 rounded-xl p-4">
                                <p className="font-semibold text-gray-800 text-sm">{payModal.obligationName}</p>
                                {payModal.description && (
                                    <p className="text-xs text-gray-500 mt-1">{payModal.description}</p>
                                )}
                                <p className="text-lg font-bold text-orange-600 mt-2">
                                    ₱{Number(payModal.amount).toFixed(2)}
                                </p>
                                {payModal.dueDate && (
                                    <p className={`text-xs mt-1 ${payModal.isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                                        Due: {new Date(payModal.dueDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                                        {payModal.isOverdue && " · OVERDUE"}
                                    </p>
                                )}
                            </div>

                            {/* GCash QR in modal */}
                            {payModal.gcashQrPath && (
                                <div className="border rounded-xl p-3 text-center">
                                    <p className="text-xs font-medium text-gray-700 mb-2">GCash QR Code</p>
                                    <img
                                        src={qrUrl(payModal.gcashQrPath)}
                                        alt="GCash QR"
                                        className="w-32 h-32 object-contain mx-auto border rounded cursor-pointer"
                                        onClick={() => setQrView({ url: qrUrl(payModal.gcashQrPath!), name: payModal.obligationName })}
                                        title="Click to view fullscreen"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Click image to enlarge</p>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                                <p className="font-semibold">GCash Payment Instructions:</p>
                                <p>1. Scan the QR code above or send to the ESO GCash number</p>
                                <p>2. Take a screenshot of your GCash receipt</p>
                                <p>3. Upload the screenshot below</p>
                            </div>

                            {/* File upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Receipt / Proof of Payment *
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer bg-orange-50 hover:bg-orange-100 transition">
                                    {receiptFile ? (
                                        <span className="text-sm text-orange-700 font-medium px-4 truncate max-w-full">
                                            {receiptFile.name}
                                        </span>
                                    ) : (
                                        <div className="flex flex-col items-center text-orange-400">
                                            <span className="text-xs">Click to upload JPG, PNG, or PDF</span>
                                            <span className="text-[10px] text-gray-400 mt-0.5">Max 5MB</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        className="hidden"
                                        onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                    rows={2}
                                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                                    placeholder="e.g. Reference number, payment date..."
                                    value={payNotes}
                                    onChange={e => setPayNotes(e.target.value)}
                                />
                            </div>

                            {payError && <p className="text-red-500 text-sm">{payError}</p>}

                            <button
                                type="submit"
                                disabled={paying || !receiptFile}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
                            >
                                {paying ? "Submitting..." : "Submit Receipt"}
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
                        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-semibold text-gray-800 text-sm truncate">{qrView.name} — GCash QR</p>
                            <button onClick={() => setQrView(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
                        </div>
                        <img src={qrView.url} alt="GCash QR Code" className="w-full max-w-xs mx-auto rounded-xl border" />
                        <a
                            href={qrView.url}
                            download
                            className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-6 py-2 rounded-lg transition"
                        >
                            Download QR
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Status Badge ── */
function StatusBadge({ obligation: o }: { obligation: StudentObligationItem }) {
    if (o.status === "paid" || o.status === "waived") {
        return <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{o.status === "waived" ? "Waived" : "Paid"}</span>;
    }
    if (o.status === "pending_verification") {
        return <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pending Verification</span>;
    }
    if (o.isOverdue) {
        return <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Overdue</span>;
    }
    return <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Unpaid</span>;
}

/* ── Stat Card ── */
function StatCard({ label, value, color }: { label: string; value: number; color: "orange" | "green" | "yellow" | "red" }) {
    const styles: Record<string, string> = {
        orange: "bg-orange-50 border-orange-200 text-orange-600",
        green:  "bg-green-50  border-green-200  text-green-600",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
        red:    "bg-red-50    border-red-200    text-red-600",
    };
    return (
        <div className={`rounded-xl border p-4 shadow-md ${styles[color]}`}>
            <p className="text-xs text-gray-600 font-medium mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}
