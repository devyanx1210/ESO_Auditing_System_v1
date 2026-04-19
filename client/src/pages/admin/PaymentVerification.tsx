import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    FiRefreshCw, FiCheckSquare, FiClock, FiSearch, FiFilter,
    FiChevronDown, FiChevronUp, FiTrash2, FiList, FiCreditCard,
    FiCamera, FiChevronLeft, FiChevronRight, FiCheck, FiX,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

import { adminStudentService, receiptUrl } from "../../services/admin-student.service";
import type { PendingPaymentItem, PendingProofItem, PaymentHistoryItem } from "../../services/admin-student.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROGRAM_NAMES: Record<string, string> = {
    CpE: "Computer Engineering",
    CE:  "Civil Engineering",
    ECE: "Electronics Engineering",
    EE:  "Electrical Engineering",
    ME:  "Mechanical Engineering",
};
function programLabel(code: string) { return PROGRAM_NAMES[code] ?? code; }
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}
function UserAvatar({ size = "md", src }: { size?: "sm" | "md" | "lg"; src?: string | null }) {
    const sz = size === "lg" ? "w-14 h-14" : size === "md" ? "w-9 h-9" : "w-8 h-8";
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0`}>
            {src
                ? <img src={src.startsWith("http") ? src : src.startsWith("/uploads") ? src : `/uploads/${src}`} alt="" className="w-full h-full object-cover" />
                : <DefaultAvatarSvg />}
        </div>
    );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({ items, onClose, onConfirm, confirming }: {
    items: PaymentHistoryItem[]; onClose: () => void; onConfirm: () => void; confirming: boolean;
}) {
    const [input, setInput] = useState("");
    const isSingle = items.length === 1;
    const expected = isSingle ? items[0].obligationName : "DELETE";
    const matches = input === expected;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"><FiX className="w-5 h-5" /></button>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <FiTrash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Delete Submission{items.length > 1 ? "s" : ""}</h3>
                        <p className="text-xs text-gray-500">This cannot be undone.</p>
                    </div>
                </div>
                {isSingle && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-700">
                        <span className="font-semibold">{items[0].studentName}</span> · {items[0].obligationName}
                    </div>
                )}
                <p className="text-sm text-gray-600 mb-1">
                    {isSingle ? `Type the obligation name to confirm:` : `Type DELETE to confirm ${items.length} deletions:`}
                </p>
                <p className="text-xs text-gray-400 mb-2">Expected: "{expected}"</p>
                <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={expected}
                    className="w-full border-2 border-gray-300 focus:border-red-400 focus:outline-none rounded-xl px-3 py-2 text-sm mb-4" />
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} disabled={confirming}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 disabled:opacity-60">Cancel</button>
                    <button onClick={onConfirm} disabled={!matches || confirming}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition">
                        {confirming ? "Deleting..." : `Delete${items.length > 1 ? ` (${items.length})` : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Image Preview Modal ──────────────────────────────────────────────────────

function ImagePreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-9 right-0 text-white text-sm font-medium hover:text-gray-300 flex items-center gap-1">
                    ✕ Close
                </button>
                <img src={url} alt="Receipt" className="w-full rounded-2xl object-contain max-h-[80vh] bg-gray-900" />
            </div>
        </div>
    );
}

// ─── Password Confirm Modal ───────────────────────────────────────────────────

function PasswordModal({ token, onConfirm, onClose }: {
    token: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const [pw, setPw]     = useState("");
    const [err, setErr]   = useState("");
    const [busy, setBusy] = useState(false);

    async function submit() {
        if (!pw) return setErr("Enter your password");
        setBusy(true); setErr("");
        try {
            const { apiFetch } = await import("../../services/api");
            await apiFetch<null>("/auth/verify-password", {
                method: "POST",
                body: JSON.stringify({ password: pw }),
            }, token);
            onConfirm();
        } catch {
            setErr("Incorrect password");
        } finally { setBusy(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"><FiX className="w-4 h-4" /></button>
                <h3 className="font-bold text-gray-800 text-base mb-1">Confirm Verification</h3>
                <p className="text-xs text-gray-500 mb-4">Enter your password once to proceed.</p>
                <input
                    type="password"
                    autoFocus
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    placeholder="Password"
                    className="w-full border-2 border-gray-200 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm mb-3"
                />
                {err && <p className="text-red-500 text-xs mb-2">{err}</p>}
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} disabled={busy}
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-60">
                        Cancel
                    </button>
                    <button onClick={submit} disabled={busy}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                        {busy ? "Checking..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Swipe Review Panel — Payments ────────────────────────────────────────────

interface PaySwipeProps {
    items: PendingPaymentItem[];
    token: string;
    darkMode: boolean;
    onDone: () => void;
}
function PaySwipePanel({ items, token, darkMode, onDone }: PaySwipeProps) {
    const [idx, setIdx]         = useState(0);
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving]   = useState(false);
    const [err, setErr]         = useState("");
    const [done, setDone]       = useState<Set<number>>(new Set());
    const [preview, setPreview] = useState<string | null>(null);
    const [pendingStatus, setPendingStatus] = useState<number | null>(null);
    const [isAuthed, setIsAuthed] = useState(false);

    const active = items.filter(p => !done.has(p.paymentId));
    const cur    = active[idx] ?? null;

    useEffect(() => {
        setRemarks(""); setErr("");
    }, [idx]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft")  setIdx(i => Math.max(0, i - 1));
            if (e.key === "ArrowRight") setIdx(i => Math.min(active.length - 1, i + 1));
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [active.length]);

    async function act(status: number) {
        if (!cur) return;
        setSaving(true); setErr("");
        try {
            await adminStudentService.verifyPayment(token, cur.paymentId, status, remarks);
            setDone(prev => new Set(prev).add(cur.paymentId));
            setRemarks("");
            if (idx >= active.length - 1) setIdx(Math.max(0, active.length - 2));
        } catch (e: any) { setErr(e.message); }
        finally { setSaving(false); }
    }

    function handleClick(status: number) {
        if (isAuthed) { act(status); }
        else { setPendingStatus(status); }
    }

    const card = darkMode ? "bg-[#1a1a1a]" : "bg-white";
    const txt  = darkMode ? "text-white" : "text-gray-800";
    const sub  = darkMode ? "text-gray-400" : "text-gray-500";

    if (active.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center py-20 ${card} rounded-2xl shadow-xl`}>
                <FiCheck className="w-12 h-12 text-green-500 mb-3" />
                <p className={`font-semibold text-lg ${txt}`}>All payments reviewed!</p>
                <button onClick={onDone} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition">
                    Done
                </button>
            </div>
        );
    }

    return (
        <>
        {preview && <ImagePreviewModal url={preview} onClose={() => setPreview(null)} />}
        <div className={`${card} rounded-2xl shadow-xl overflow-hidden`}>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
                <div className="h-1 bg-orange-500 transition-all duration-300"
                    style={{ width: `${((idx + 1) / active.length) * 100}%` }} />
            </div>

            {/* Nav header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition">
                    <FiChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <span className={`text-sm font-semibold ${txt}`}>
                    {idx + 1} <span className={`font-normal ${sub}`}>of</span> {active.length}
                    <span className={`ml-2 text-xs ${sub}`}>pending</span>
                </span>
                <button onClick={() => setIdx(i => Math.min(active.length - 1, i + 1))} disabled={idx >= active.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition">
                    <FiChevronRight className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {cur && (
                <div className="flex flex-col md:flex-row gap-0">
                    {/* Image side */}
                    <div className={`md:w-1/2 flex items-center justify-center p-4 min-h-[260px] ${darkMode ? "bg-[#111]" : "bg-gray-50"}`}>
                        {cur.receiptPath ? (
                            <button onClick={() => setPreview(receiptUrl(cur.receiptPath))} className="block w-full">
                                <img src={receiptUrl(cur.receiptPath)} alt="Receipt"
                                    className="w-full max-h-[340px] object-contain rounded-xl cursor-zoom-in" />
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400 py-10">
                                <FiCreditCard className="w-10 h-10 opacity-30" />
                                <span className="text-xs">No receipt image</span>
                            </div>
                        )}
                    </div>

                    {/* Details side */}
                    <div className="md:w-1/2 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <UserAvatar size="lg" src={cur.avatarPath} />
                                <div>
                                    <p className={`font-bold text-base leading-tight ${txt}`}>{cur.studentName}</p>
                                    <p className={`text-xs font-mono mt-0.5 ${sub}`}>{cur.studentNo}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${darkMode ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                        {programLabel(cur.programCode)}
                                    </span>
                                </div>
                            </div>

                            <div className={`rounded-xl p-3 mb-4 ${darkMode ? "bg-[#222]" : "bg-gray-50"}`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide ${sub} mb-1`}>Obligation</p>
                                <p className={`font-semibold text-sm ${txt}`}>{cur.obligationName}</p>
                                <p className="text-orange-500 font-bold text-lg mt-1">PHP {Number(cur.amountPaid).toFixed(2)}</p>
                                <p className={`text-xs ${sub} mt-0.5`}>Submitted {fmtDate(cur.submittedAt)} · {fmtTime(cur.submittedAt)}</p>
                                {cur.notes && <p className={`text-xs mt-1 italic ${sub}`}>"{cur.notes}"</p>}
                            </div>

                            <textarea rows={2} placeholder="Remarks (optional, visible to student if rejected)"
                                value={remarks} onChange={e => setRemarks(e.target.value)}
                                className={`w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 border-2
                                    ${darkMode ? "bg-[#222] border-gray-600 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-800"}`} />
                            {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button onClick={() => handleClick(2)} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-60 transition">
                                Reject
                            </button>
                            <button onClick={() => handleClick(1)} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-60 transition">
                                {saving ? "Saving…" : "Verify"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        {pendingStatus !== null && (
            <PasswordModal
                token={token}
                onConfirm={() => {
                    const s = pendingStatus;
                    setPendingStatus(null);
                    setIsAuthed(true);
                    act(s);
                }}
                onClose={() => setPendingStatus(null)}
            />
        )}
        </>
    );
}

// ─── Swipe Review Panel — Proof of Compliance ─────────────────────────────────

interface ProofSwipeProps {
    items: PendingProofItem[];
    token: string;
    darkMode: boolean;
    onDone: () => void;
}
function ProofSwipePanel({ items, token, darkMode, onDone }: ProofSwipeProps) {
    const [idx, setIdx]       = useState(0);
    const [saving, setSaving] = useState(false);
    const [err, setErr]       = useState("");
    const [done, setDone]     = useState<Set<number>>(new Set());
    const [preview, setPreview] = useState<string | null>(null);
    const [pendingApprove, setPendingApprove] = useState<boolean | null>(null);
    const [isAuthed, setIsAuthed] = useState(false);

    const active = items.filter(p => !done.has(p.studentObligationId));
    const cur    = active[idx] ?? null;

    useEffect(() => { setErr(""); }, [idx]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft")  setIdx(i => Math.max(0, i - 1));
            if (e.key === "ArrowRight") setIdx(i => Math.min(active.length - 1, i + 1));
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [active.length]);

    // backend: 2 = approved/paid, 0 = rejected/unpaid
    async function act(approve: boolean) {
        if (!cur) return;
        setSaving(true); setErr("");
        try {
            await adminStudentService.verifyProof(token, cur.studentObligationId, approve ? 2 : 0);
            setDone(prev => new Set(prev).add(cur.studentObligationId));
            if (idx >= active.length - 1) setIdx(Math.max(0, active.length - 2));
        } catch (e: any) { setErr(e.message); }
        finally { setSaving(false); }
    }

    function handleClick(approve: boolean) {
        if (isAuthed) { act(approve); }
        else { setPendingApprove(approve); }
    }

    const card = darkMode ? "bg-[#1a1a1a]" : "bg-white";
    const txt  = darkMode ? "text-white" : "text-gray-800";
    const sub  = darkMode ? "text-gray-400" : "text-gray-500";

    if (active.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center py-20 ${card} rounded-2xl shadow-xl`}>
                <FiCheck className="w-12 h-12 text-green-500 mb-3" />
                <p className={`font-semibold text-lg ${txt}`}>All proofs reviewed!</p>
                <button onClick={onDone} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition">
                    Done
                </button>
            </div>
        );
    }

    return (
        <>
        {preview && <ImagePreviewModal url={preview} onClose={() => setPreview(null)} />}
        <div className={`${card} rounded-2xl shadow-xl overflow-hidden`}>
            <div className="h-1 bg-gray-100">
                <div className="h-1 bg-orange-500 transition-all duration-300"
                    style={{ width: `${((idx + 1) / active.length) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition">
                    <FiChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <span className={`text-sm font-semibold ${txt}`}>
                    {idx + 1} <span className={`font-normal ${sub}`}>of</span> {active.length}
                    <span className={`ml-2 text-xs ${sub}`}>pending</span>
                </span>
                <button onClick={() => setIdx(i => Math.min(active.length - 1, i + 1))} disabled={idx >= active.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition">
                    <FiChevronRight className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {cur && (
                <div className="flex flex-col md:flex-row gap-0">
                    <div className={`md:w-1/2 flex items-center justify-center p-4 min-h-[260px] ${darkMode ? "bg-[#111]" : "bg-gray-50"}`}>
                        {cur.proofImage ? (
                            <button onClick={() => setPreview(receiptUrl(cur.proofImage))} className="block w-full">
                                <img src={receiptUrl(cur.proofImage)} alt="Proof"
                                    className="w-full max-h-[340px] object-contain rounded-xl cursor-zoom-in" />
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400 py-10">
                                <FiCamera className="w-10 h-10 opacity-30" />
                                <span className="text-xs">No proof image</span>
                            </div>
                        )}
                    </div>

                    <div className="md:w-1/2 p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <UserAvatar size="lg" src={cur.avatarPath} />
                                <div>
                                    <p className={`font-bold text-base leading-tight ${txt}`}>{cur.studentName}</p>
                                    <p className={`text-xs font-mono mt-0.5 ${sub}`}>{cur.studentNo}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${darkMode ? "bg-[#2a2a2a] text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                        {programLabel(cur.programCode)}
                                    </span>
                                </div>
                            </div>

                            <div className={`rounded-xl p-3 mb-4 ${darkMode ? "bg-[#222]" : "bg-gray-50"}`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide ${sub} mb-1`}>Obligation</p>
                                <p className={`font-semibold text-sm ${txt}`}>{cur.obligationName}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <FiCamera className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-orange-500 text-xs font-semibold">Proof of Compliance</span>
                                </div>
                                <p className={`text-xs ${sub} mt-1`}>Submitted {fmtDate(cur.submittedAt)} · {fmtTime(cur.submittedAt)}</p>
                            </div>

                            {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button onClick={() => handleClick(false)} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-60 transition">
                                Reject
                            </button>
                            <button onClick={() => handleClick(true)} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-60 transition">
                                {saving ? "Saving…" : "Approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        {pendingApprove !== null && (
            <PasswordModal
                token={token}
                onConfirm={() => {
                    const a = pendingApprove;
                    setPendingApprove(null);
                    setIsAuthed(true);
                    act(a);
                }}
                onClose={() => setPendingApprove(null)}
            />
        )}
        </>
    );
}

// ─── Sort/filter types ────────────────────────────────────────────────────────

type PaySortKey = "name" | "date" | "amount";

const PROGRAMS_LIST = [
    { code: "CpE", name: "Computer Engineering" },
    { code: "CE",  name: "Civil Engineering" },
    { code: "ECE", name: "Electronics Engineering" },
    { code: "EE",  name: "Electrical Engineering" },
    { code: "ME",  name: "Mechanical Engineering" },
];

const PAYMENT_ROLES = ["system_admin", "eso_officer", "class_officer", "program_head"];

// ─── Main Page ────────────────────────────────────────────────────────────────

const PaymentVerification = () => {
    const { accessToken, user } = useAuth();
    const { darkMode } = useTheme();
    const location = useLocation();

    // Data
    const [pending,       setPending]       = useState<PendingPaymentItem[]>([]);
    const [pendingProofs, setPendingProofs] = useState<PendingProofItem[]>([]);
    const [payHistory,    setPayHistory]    = useState<PaymentHistoryItem[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState("");

    // Tab / mode
    const [mainTab,   setMainTab]   = useState<"payments" | "proof">("payments");
    const [pendingVerifyId, setPendingVerifyId] = useState<number | null>(null);
    const [listIsAuthed, setListIsAuthed] = useState(false);
    const [subTab,    setSubTab]    = useState<"pending" | "history">("pending");
    const [viewMode,  setViewMode]  = useState<"list" | "swipe">("list");

    // Search / filter
    const [search,             setSearch]             = useState("");
    const [sortKey,            setSortKey]            = useState<PaySortKey>("date");
    const [programFilter,      setProgramFilter]      = useState((location.state as any)?.programFilter ?? "all");
    const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
    const [showFilters,        setShowFilters]        = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Bulk selection
    const [selectedPending,  setSelectedPending]  = useState<Set<number>>(new Set());
    const [selectedHistory,  setSelectedHistory]  = useState<Set<number>>(new Set());
    const [bulkVerifying,    setBulkVerifying]    = useState(false);
    const [bulkUnverifying,  setBulkUnverifying]  = useState(false);
    const [bulkMsg,          setBulkMsg]          = useState("");

    // Delete modal
    const [deleteItems,   setDeleteItems]   = useState<PaymentHistoryItem[]>([]);
    const [deleting,      setDeleting]      = useState(false);
    const showDeleteModal = deleteItems.length > 0;

    // Image preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const canAccess = PAYMENT_ROLES.includes(user?.role ?? "");

    const load = useCallback(() => {
        if (!accessToken || !canAccess) return;
        setLoading(true);
        setSelectedPending(new Set());
        setSelectedHistory(new Set());
        setBulkMsg("");
        Promise.all([
            adminStudentService.getPendingPayments(accessToken).catch(() => [] as PendingPaymentItem[]),
            adminStudentService.getPendingProofs(accessToken).catch(() => [] as PendingProofItem[]),
            adminStudentService.getPaymentHistory(accessToken).catch(() => [] as PaymentHistoryItem[]),
        ])
            .then(([p, pp, ph]) => { setPending(p); setPendingProofs(pp); setPayHistory(ph); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken, canAccess]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { const id = setInterval(load, 20_000); return () => clearInterval(id); }, [load]);

    useEffect(() => {
        if (!showFilters) return;
        const h = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [showFilters]);

    // ── Bulk verify ──
    async function handleBulkVerify() {
        if (!accessToken || !selectedPending.size) return;
        setBulkVerifying(true); setBulkMsg("");
        try {
            const ids = [...selectedPending];
            await adminStudentService.bulkVerify(accessToken, ids);
            setBulkMsg(`${ids.length} payment(s) verified.`);
            load();
        } catch (e: any) { setBulkMsg(e.message); }
        finally { setBulkVerifying(false); }
    }

    async function handleBulkUnverify() {
        if (!accessToken || !selectedHistory.size) return;
        setBulkUnverifying(true); setBulkMsg("");
        try {
            const ids = [...selectedHistory];
            await adminStudentService.bulkUnverify(accessToken, ids);
            setBulkMsg(`${ids.length} submission(s) returned to pending.`);
            load();
        } catch (e: any) { setBulkMsg(e.message); }
        finally { setBulkUnverifying(false); }
    }

    function openDeleteModal() {
        const ids = [...selectedHistory];
        setDeleteItems(payHistory.filter(h => ids.includes(h.paymentId)));
    }

    async function handleConfirmDelete() {
        if (!accessToken || !deleteItems.length) return;
        setDeleting(true);
        try {
            await adminStudentService.bulkDelete(accessToken, deleteItems.map(d => d.paymentId));
            setBulkMsg(`${deleteItems.length} submission(s) deleted.`);
            setDeleteItems([]);
            load();
        } catch (e: any) { setBulkMsg(e.message); }
        finally { setDeleting(false); }
    }

    const bg   = darkMode ? "bg-[#111111] text-gray-100" : "bg-gray-50 text-gray-900";
    const card = darkMode ? "bg-[#1a1a1a]" : "bg-white";
    const txt  = darkMode ? "text-white" : "text-gray-800";
    const sub  = darkMode ? "text-gray-400" : "text-gray-500";

    // ── Search filters by obligation name ──
    function applyObligationSearch<T extends { obligationName: string }>(items: T[]) {
        const q = search.trim().toLowerCase();
        return q ? items.filter(i => i.obligationName.toLowerCase().includes(q)) : items;
    }
    function applyProgram<T extends { programCode: string }>(items: T[]) {
        return programFilter !== "all" ? items.filter(i => i.programCode === programFilter) : items;
    }
    function applyHistoryStatus(items: PaymentHistoryItem[]) {
        if (historyStatusFilter === "verified")   return items.filter(i => i.paymentStatus === 1);
        if (historyStatusFilter === "unverified") return items.filter(i => i.paymentStatus === 2);
        return items;
    }
    function applyPaySort(items: PendingPaymentItem[]) {
        if (sortKey === "name")   return [...items].sort((a, b) => a.studentName.localeCompare(b.studentName));
        if (sortKey === "amount") return [...items].sort((a, b) => b.amountPaid - a.amountPaid);
        return [...items].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }
    function applyHistSort(items: PaymentHistoryItem[]) {
        if (sortKey === "name")   return [...items].sort((a, b) => a.studentName.localeCompare(b.studentName));
        if (sortKey === "amount") return [...items].sort((a, b) => b.amountPaid - a.amountPaid);
        return [...items].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }
    function applyProofSort(items: PendingProofItem[]) {
        return [...items].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    const filteredPending = applyPaySort(applyProgram(applyObligationSearch(pending)));
    const filteredProofs  = applyProofSort(applyProgram(applyObligationSearch(pendingProofs)));
    const filteredHistory = applyHistSort(applyHistoryStatus(applyProgram(applyObligationSearch(payHistory))));

    const allPendingSel = filteredPending.length > 0 && filteredPending.every(p => selectedPending.has(p.paymentId));
    const allHistorySel = filteredHistory.length > 0 && filteredHistory.every(h => selectedHistory.has(h.paymentId));

    const activeFilterCount = [programFilter !== "all", sortKey !== "date", historyStatusFilter !== "all"].filter(Boolean).length;

    function togglePending(id: number, v: boolean) {
        setSelectedPending(prev => { const s = new Set(prev); v ? s.add(id) : s.delete(id); return s; });
    }
    function toggleHistory(id: number, v: boolean) {
        setSelectedHistory(prev => { const s = new Set(prev); v ? s.add(id) : s.delete(id); return s; });
    }

    if (!canAccess) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${bg}`}>
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-500">Access Denied</p>
                    <p className="text-sm text-gray-400 mt-1">You do not have permission to view submissions.</p>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${bg}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${bg}`}>
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            {previewUrl && <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
            {showDeleteModal && (
                <DeleteConfirmModal items={deleteItems} onClose={() => setDeleteItems([])}
                    onConfirm={handleConfirmDelete} confirming={deleting} />
            )}

            {/* ── Page Title ── */}
            <div className="mb-5">
                <h1 className={`text-lg sm:text-2xl lg:text-3xl font-bold ${txt}`}>Submission Review</h1>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            {/* ── Search + Filter + Refresh Bar ── */}
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search by obligation name..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className={`border-2 focus:border-orange-400 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm w-full shadow-sm
                            ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100 placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"}`} />
                </div>

                <div className="relative" ref={filterRef}>
                    <button onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm bg-orange-500 text-white hover:bg-orange-600`}>
                        <FiFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeFilterCount}</span>
                        )}
                        {showFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>

                    {showFilters && (
                        <div className={`absolute right-0 top-full mt-2 z-30 rounded-2xl p-4 w-64 flex flex-col gap-3 shadow-2xl
                            ${darkMode ? "bg-[#1a1a1a] ring-1 ring-white/5" : "bg-white border border-gray-200"}`}>
                            <p className={`text-xs font-bold uppercase tracking-wide ${sub}`}>Filter</p>
                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${sub}`}>Sort by</label>
                                <select value={sortKey} onChange={e => setSortKey(e.target.value as PaySortKey)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
                                    <option value="date">Date (Newest)</option>
                                    <option value="name">Name (A–Z)</option>
                                    <option value="amount">Amount (Highest)</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-xs font-semibold mb-1 ${sub}`}>Program</label>
                                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}
                                    className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                        ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
                                    <option value="all">All Programs</option>
                                    {PROGRAMS_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                </select>
                            </div>
                            {viewMode === "list" && subTab === "history" && (
                                <div>
                                    <label className={`block text-xs font-semibold mb-1 ${sub}`}>Status</label>
                                    <select value={historyStatusFilter} onChange={e => setHistoryStatusFilter(e.target.value)}
                                        className={`w-full border-2 focus:border-orange-400 focus:outline-none rounded-xl px-3 py-2 text-sm
                                            ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
                                        <option value="all">All</option>
                                        <option value="verified">Verified</option>
                                        <option value="unverified">Rejected</option>
                                    </select>
                                </div>
                            )}
                            {activeFilterCount > 0 && (
                                <button onClick={() => { setSortKey("date"); setProgramFilter("all"); setHistoryStatusFilter("all"); }}
                                    className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <button onClick={load} disabled={loading} title="Refresh"
                    className={`p-2 border-2 rounded-xl transition shadow-sm disabled:opacity-50 ${darkMode ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400" : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* ── Sub-tabs + View mode toggle ── */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                {/* List mode: Pending | History */}
                {viewMode === "list" && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1">
                        <button onClick={() => setSubTab("pending")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                                subTab === "pending"
                                    ? "bg-white text-orange-600 shadow-sm"
                                    : `${sub} hover:text-gray-700`
                            }`}>
                            <FiCheckSquare className="w-4 h-4" />
                            Pending
                            {filteredPending.length > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                                    {filteredPending.length}
                                </span>
                            )}
                        </button>
                        <button onClick={() => setSubTab("history")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                                subTab === "history"
                                    ? "bg-white text-orange-600 shadow-sm"
                                    : `${sub} hover:text-gray-700`
                            }`}>
                            <FiClock className="w-4 h-4" />
                            History
                            {filteredHistory.length > 0 && (
                                <span className={`text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none ${darkMode ? "bg-gray-600" : "bg-gray-400"}`}>
                                    {filteredHistory.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Swipe mode: Payments | Proof of Compliance */}
                {viewMode === "swipe" && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1">
                        <button onClick={() => setMainTab("payments")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                                mainTab === "payments"
                                    ? "bg-white text-orange-600 shadow-sm"
                                    : `${sub} hover:text-gray-700`
                            }`}>
                            <FiCreditCard className="w-4 h-4" />
                            Payments
                            {pending.length > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{pending.length}</span>
                            )}
                        </button>
                        <button onClick={() => setMainTab("proof")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                                mainTab === "proof"
                                    ? "bg-white text-orange-600 shadow-sm"
                                    : `${sub} hover:text-gray-700`
                            }`}>
                            <FiCamera className="w-4 h-4" />
                            Proof of Compliance
                            {pendingProofs.length > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{pendingProofs.length}</span>
                            )}
                        </button>
                    </div>
                )}

                {/* View mode toggle (only in list + pending) */}
                {viewMode === "list" && subTab === "pending" && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1">
                        <button onClick={() => setViewMode("list")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                                viewMode === "list"
                                    ? "bg-white text-orange-600 shadow-sm"
                                    : `${sub} hover:text-gray-700`
                            }`}>
                            <FiList className="w-4 h-4" /> List
                        </button>
                        <button onClick={() => { setViewMode("swipe"); setMainTab("payments"); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${sub} hover:text-gray-700`}>
                            <FiChevronRight className="w-4 h-4" /> Swipe Review
                        </button>
                    </div>
                )}

                {/* Back to list (in swipe mode) */}
                {viewMode === "swipe" && (
                    <button onClick={() => { setViewMode("list"); setSubTab("pending"); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition
                            ${darkMode ? "border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400" : "border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                        <FiChevronLeft className="w-4 h-4" /> List
                    </button>
                )}

                {/* Bulk actions for list mode pending payments */}
                {viewMode === "list" && subTab === "pending" && selectedPending.size > 0 && (
                    <button onClick={handleBulkVerify} disabled={bulkVerifying}
                        className="relative px-4 py-2 text-sm bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-60 transition">
                        {bulkVerifying ? "Verifying..." : "Verify Selected"}
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-orange-600 rounded-full text-[9px] font-black flex items-center justify-center leading-none px-1 shadow ring-1 ring-orange-200">
                            {selectedPending.size}
                        </span>
                    </button>
                )}

                {/* Bulk actions for history */}
                {viewMode === "list" && subTab === "history" && selectedHistory.size > 0 && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleBulkUnverify} disabled={bulkUnverifying}
                            className="relative px-4 py-2 text-sm bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 disabled:opacity-60 transition">
                            {bulkUnverifying ? "Processing..." : "Return to Pending"}
                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-yellow-700 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-yellow-200">
                                {selectedHistory.size}
                            </span>
                        </button>
                        <button onClick={openDeleteModal}
                            className="relative px-4 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition flex items-center gap-1.5">
                            <FiTrash2 className="w-3.5 h-3.5" /> Delete
                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-red-600 rounded-full text-[9px] font-black flex items-center justify-center px-1 shadow ring-1 ring-red-200">
                                {selectedHistory.size}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {bulkMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2.5 mb-3">{bulkMsg}</div>
            )}

            {/* ══ SWIPE MODE ══ */}
            {viewMode === "swipe" && mainTab === "payments" && (
                <PaySwipePanel items={filteredPending} token={accessToken!} darkMode={darkMode}
                    onDone={() => { setViewMode("list"); setSubTab("pending"); load(); }} />
            )}
            {viewMode === "swipe" && mainTab === "proof" && (
                <ProofSwipePanel items={filteredProofs} token={accessToken!} darkMode={darkMode}
                    onDone={() => { setViewMode("list"); setSubTab("pending"); load(); }} />
            )}

            {/* ══ LIST MODE ══ */}
            {viewMode === "list" && (
                <>
                    {/* Pending — List mode */}
                    {subTab === "pending" && (
                        filteredPending.length === 0 ? (
                            <div className={`rounded-xl p-10 text-center text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${card} ${sub}`}>
                                {search ? `No payments matching "${search}".` : "No pending payment submissions."}
                            </div>
                        ) : (
                            <div className={`rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${card}`}>
                                <table className="eso-table w-full min-w-[640px] border-collapse">
                                    <thead className={`${darkMode ? "bg-[#222] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="px-3 py-2 text-center w-10">
                                                <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                    checked={allPendingSel}
                                                    onChange={e => setSelectedPending(e.target.checked ? new Set(filteredPending.map(p => p.paymentId)) : new Set())} />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Obligation</th>
                                            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide w-24">Amount</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-28">Submitted</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-16">Receipt</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPending.map((p, i) => (
                                            <tr key={p.paymentId}
                                                onClick={() => togglePending(p.paymentId, !selectedPending.has(p.paymentId))}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.04}s` }}
                                                className={`transition-colors cursor-pointer ${
                                                    selectedPending.has(p.paymentId)
                                                        ? darkMode ? "bg-orange-900/30" : "bg-orange-50"
                                                        : i % 2 === 0
                                                            ? darkMode ? "bg-[#1a1a1a] hover:bg-[#2a2a2a]" : "bg-white hover:bg-gray-50"
                                                            : darkMode ? "bg-[#1a1a1a]/60 hover:bg-[#2a2a2a]" : "bg-gray-50/60 hover:bg-gray-100/50"
                                                }`}>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                        checked={selectedPending.has(p.paymentId)}
                                                        onChange={e => togglePending(p.paymentId, e.target.checked)} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" src={p.avatarPath} />
                                                        <div>
                                                            <div className={`font-semibold text-xs leading-tight ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{p.studentName}</div>
                                                            <div className={`text-xs font-mono ${sub}`}>{p.studentNo} · {programLabel(p.programCode)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={`px-3 py-2.5 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{p.obligationName}</td>
                                                <td className={`px-3 py-2.5 text-right font-bold text-xs ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                                    PHP {Number(p.amountPaid).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{fmtDate(p.submittedAt)}</div>
                                                    <div className={`text-[10px] ${sub}`}>{fmtTime(p.submittedAt)}</div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    {p.receiptPath
                                                        ? <button onClick={() => setPreviewUrl(receiptUrl(p.receiptPath))}
                                                            className="text-orange-500 hover:text-orange-600 text-xs font-semibold hover:underline">View</button>
                                                        : <span className={`text-xs ${sub}`}>—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => listIsAuthed
                                                            ? adminStudentService.verifyPayment(accessToken!, p.paymentId, 1, "").then(load)
                                                            : setPendingVerifyId(p.paymentId)}
                                                            className="px-2 py-1 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-700 transition">
                                                            Verify
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* History */}
                    {subTab === "history" && (
                        filteredHistory.length === 0 ? (
                            <div className={`rounded-xl p-10 text-center text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${card} ${sub}`}>
                                {search ? `No history matching "${search}".` : "No reviewed submissions yet."}
                            </div>
                        ) : (
                            <div className={`rounded-xl overflow-x-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${card}`}>
                                <table className="eso-table w-full min-w-[700px] border-collapse">
                                    <thead className={`${darkMode ? "bg-[#222] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                                        <tr className={`border-b ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
                                            <th className="px-3 py-2 text-center w-10">
                                                <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                    checked={allHistorySel}
                                                    onChange={e => setSelectedHistory(e.target.checked ? new Set(filteredHistory.map(h => h.paymentId)) : new Set())} />
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Student</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Obligation</th>
                                            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide w-24">Amount</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide">Verified By</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-28">Verified At</th>
                                            <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide w-20">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((h, i) => (
                                            <tr key={h.paymentId}
                                                onClick={() => toggleHistory(h.paymentId, !selectedHistory.has(h.paymentId))}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.04}s` }}
                                                className={`transition-colors cursor-pointer ${
                                                    selectedHistory.has(h.paymentId)
                                                        ? darkMode ? "bg-orange-900/30" : "bg-orange-50"
                                                        : i % 2 === 0
                                                            ? darkMode ? "bg-[#1a1a1a] hover:bg-[#2a2a2a]" : "bg-white hover:bg-gray-50"
                                                            : darkMode ? "bg-[#1a1a1a]/60 hover:bg-[#2a2a2a]" : "bg-gray-50/60 hover:bg-gray-100/50"
                                                }`}>
                                                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" className="w-4 h-4 accent-orange-500 cursor-pointer"
                                                        checked={selectedHistory.has(h.paymentId)}
                                                        onChange={e => toggleHistory(h.paymentId, e.target.checked)} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" src={h.avatarPath} />
                                                        <div>
                                                            <div className={`font-semibold text-xs leading-tight ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{h.studentName}</div>
                                                            <div className={`text-xs font-mono ${sub}`}>{h.studentNo} · {programLabel(h.programCode)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={`px-3 py-2.5 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{h.obligationName}</td>
                                                <td className={`px-3 py-2.5 text-right font-bold text-xs ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                                    PHP {Number(h.amountPaid).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {h.verifiedByName
                                                        ? <div>
                                                            <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{h.verifiedByName}</div>
                                                            {h.verifiedByRole && <div className={`text-xs ${sub}`}>{h.verifiedByRole}</div>}
                                                          </div>
                                                        : <span className={`text-xs ${sub}`}>—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {h.verifiedAt
                                                        ? <><div className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{fmtDate(h.verifiedAt)}</div>
                                                           <div className={`text-[10px] ${sub}`}>{fmtTime(h.verifiedAt)}</div></>
                                                        : <span className={`text-xs ${sub}`}>—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.paymentStatus === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {h.paymentStatus === 1 ? "Verified" : "Rejected"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Password modal for inline list-mode verify */}
            {pendingVerifyId !== null && accessToken && (
                <PasswordModal
                    token={accessToken}
                    onConfirm={() => {
                        const id = pendingVerifyId;
                        setPendingVerifyId(null);
                        setListIsAuthed(true);
                        adminStudentService.verifyPayment(accessToken!, id, 1, "").then(load);
                    }}
                    onClose={() => setPendingVerifyId(null)}
                />
            )}
        </div>
    );
};

export default PaymentVerification;
