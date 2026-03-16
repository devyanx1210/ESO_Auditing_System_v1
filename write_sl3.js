const fs = require('fs');

const content = `import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { adminStudentService, receiptUrl } from "../../services/admin-student.service";
import type {
    AdminStudentItem, AdminObligationItem,
    PendingPaymentItem, PendingClearanceItem,
} from "../../services/admin-student.service";

// ─── Badge helpers ────────────────────────────────────────────────────────────

function statusBadge(status: string) {
    const map: Record<string, string> = {
        paid: "bg-green-100 text-green-700",
        waived: "bg-blue-100 text-blue-700",
        pending_verification: "bg-yellow-100 text-yellow-700",
        unpaid: "bg-red-100 text-red-600",
    };
    const labels: Record<string, string> = {
        paid: "Paid", waived: "Waived",
        pending_verification: "Pending Verification", unpaid: "Unpaid",
    };
    return (
        <span className={\`px-2 py-0.5 rounded-full text-xs font-semibold \${map[status] ?? "bg-gray-100 text-gray-500"}\`}>
            {labels[status] ?? status}
        </span>
    );
}

function clearanceBadge(s: string | null) {
    const map: Record<string, string> = {
        cleared: "bg-green-100 text-green-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        rejected: "bg-red-100 text-red-600",
        pending: "bg-gray-100 text-gray-500",
    };
    const label = s ?? "pending";
    return (
        <span className={\`px-2 py-0.5 rounded-full text-xs font-semibold capitalize \${map[label] ?? "bg-gray-100 text-gray-500"}\`}>
            {label.replace(/_/g, " ")}
        </span>
    );
}

// ─── Cash Payment Modal ───────────────────────────────────────────────────────

function CashModal({ item, token, onClose, onDone }: {
    item: AdminObligationItem; token: string; onClose: () => void; onDone: () => void;
}) {
    const [amount, setAmount] = useState(String(item.amount));
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount"); return; }
        setSaving(true);
        try {
            await adminStudentService.recordCash(token, item.studentObligationId, Number(amount), notes);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-1">Record Cash Payment</h3>
                <p className="text-sm text-gray-500 mb-4">{item.obligationName}</p>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <label className="text-xs font-medium text-gray-500">Amount Paid (PHP) *</label>
                    <input type="number" min="0" step="0.01"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={amount} onChange={e => setAmount(e.target.value)} />
                    <label className="text-xs font-medium text-gray-500">Notes (optional)</label>
                    <textarea rows={2}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Received in office" />
                    {err && <p className="text-red-500 text-sm">{err}</p>}
                    <div className="flex justify-between gap-3 mt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-60">
                            {saving ? "Saving..." : "Record Cash"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Verify GCash Modal ───────────────────────────────────────────────────────

function VerifyModal({ item, token, onClose, onDone }: {
    item: PendingPaymentItem | null; token: string; onClose: () => void; onDone: () => void;
}) {
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    if (!item) return null;

    async function act(status: "approved" | "rejected") {
        setSaving(true);
        try {
            await adminStudentService.verifyPayment(token, item!.paymentId, status, remarks);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Verify Payment Submission</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(item.submittedAt).toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-semibold">Pending</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1 border border-gray-200">
                    {[
                        ["Student",     item.studentName],
                        ["Student No.", item.studentNo],
                        ["Department",  item.departmentCode],
                        ["Obligation",  item.obligationName],
                    ].map(([label, val]) => (
                        <div key={label} className="flex justify-between text-sm">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-medium text-gray-800">{val}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-semibold text-orange-600">PHP {Number(item.amountPaid).toFixed(2)}</span>
                    </div>
                    {item.notes && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Note</span>
                            <span className="text-gray-700">{item.notes}</span>
                        </div>
                    )}
                </div>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">GCash Receipt</p>
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
                    <img src={receiptUrl(item.receiptPath)} alt="GCash receipt"
                        className="w-full max-h-72 object-contain bg-gray-50"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>

                <label className="text-xs font-medium text-gray-500">Remarks (optional)</label>
                <textarea rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full mt-1 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    value={remarks} onChange={e => setRemarks(e.target.value)}
                    placeholder="Reason for rejection (if applicable)" />

                {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
                <div className="flex justify-between gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                    <div className="flex gap-2">
                        <button onClick={() => act("rejected")} disabled={saving}
                            className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60">Reject</button>
                        <button onClick={() => act("approved")} disabled={saving}
                            className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60">Approve</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sign Clearance Modal ─────────────────────────────────────────────────────

function SignClearanceModal({ student, token, onClose, onDone }: {
    student: PendingClearanceItem; token: string; onClose: () => void; onDone: () => void;
}) {
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await adminStudentService.signClearance(token, student.studentId, remarks);
            onDone();
        } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-4">Sign Clearance</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 space-y-1">
                    {[
                        ["Student",     \`\${student.firstName} \${student.lastName}\`],
                        ["Student No.", student.studentNo],
                        ["Department",  student.departmentCode],
                        ["Year / Sec.", \`\${student.yearLevel} - \${student.section}\`],
                        ["School Year", student.schoolYear],
                        ["Semester",    student.semester],
                    ].map(([label, val]) => (
                        <div key={label} className="flex justify-between text-sm">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-medium text-gray-800">{val}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1 border-t border-gray-200 mt-1">
                        <span className="text-gray-500">Obligations</span>
                        <span className="font-semibold text-green-700">{student.obligationsPaid}/{student.obligationsTotal} settled</span>
                    </div>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-3">
                    <label className="text-xs font-medium text-gray-500">Remarks (optional)</label>
                    <textarea rows={2}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        value={remarks} onChange={e => setRemarks(e.target.value)}
                        placeholder="Any remarks for this clearance..." />
                    {err && <p className="text-red-500 text-sm">{err}</p>}
                    <div className="flex justify-between gap-3 mt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-60">
                            {saving ? "Signing..." : "Sign Clearance"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Expandable Student Row ───────────────────────────────────────────────────

function StudentRow({ student, token, pendingMap, onCash, onVerify, obSearch }: {
    student: AdminStudentItem; token: string;
    pendingMap: Record<number, PendingPaymentItem>;
    onCash: (ob: AdminObligationItem) => void;
    onVerify: (p: PendingPaymentItem) => void;
    obSearch: string;
}) {
    const [open, setOpen] = useState(false);
    const [obligations, setObligations] = useState<AdminObligationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        if (!open || fetched) return;
        setLoading(true);
        adminStudentService.getStudentObligations(token, student.studentId)
            .then(o => { setObligations(o); setFetched(true); })
            .finally(() => setLoading(false));
    }, [open]);

    const filtered = obSearch.trim()
        ? obligations.filter(o => o.obligationName.toLowerCase().includes(obSearch.toLowerCase()))
        : obligations;

    return (
        <>
            <tr className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer select-none"
                onClick={() => setOpen(o => !o)}>
                <td className="p-3 font-medium text-gray-800">{student.lastName}, {student.firstName}</td>
                <td className="p-3 text-center text-gray-600">{student.studentNo}</td>
                <td className="p-3 text-center text-gray-600">{student.departmentCode}</td>
                <td className="p-3 text-center text-gray-600">{student.yearLevel} - {student.section}</td>
                <td className="p-3 text-center">
                    <span className={
                        student.obligationsPaid === student.obligationsTotal && student.obligationsTotal > 0
                            ? "text-green-600 font-semibold"
                            : student.obligationsPending > 0 ? "text-yellow-600 font-semibold"
                            : "text-red-500 font-semibold"
                    }>
                        {student.obligationsPaid}/{student.obligationsTotal}
                        {student.obligationsPending > 0 && (
                            <span className="text-xs ml-1 text-yellow-600">({student.obligationsPending})</span>
                        )}
                    </span>
                </td>
                <td className="p-3 text-center">{clearanceBadge(student.clearanceStatus)}</td>
                <td className="p-3 text-center text-gray-400 text-xs font-medium">{open ? "hide" : "view"}</td>
            </tr>
            {open && (
                <tr>
                    <td colSpan={7} className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        {loading ? <p className="text-sm text-gray-400">Loading...</p>
                        : obligations.length === 0 ? <p className="text-sm text-gray-400">No obligations assigned.</p>
                        : (
                            <div className="border border-gray-300 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b border-gray-300">Obligation</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 border-b border-gray-300">Amount</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 border-b border-gray-300">Due Date</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 border-b border-gray-300">Status</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 border-b border-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-sm">No matching obligations.</td></tr>
                                        ) : filtered.map((ob, idx) => {
                                            const pend = ob.paymentId ? pendingMap[ob.paymentId] : null;
                                            return (
                                                <tr key={ob.studentObligationId}
                                                    className={\`border-t border-gray-200 \${idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}\`}>
                                                    <td className="px-3 py-2.5 text-gray-800">
                                                        {ob.obligationName}
                                                        {ob.isOverdue && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">Overdue</span>}
                                                        {ob.paymentType === "cash" && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">Cash</span>}
                                                        {ob.paymentType === "gcash" && <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">GCash</span>}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                                                        {ob.requiresPayment ? \`PHP \${ob.amount.toFixed(2)}\` : <span className="text-gray-400 text-xs">Free</span>}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{ob.dueDate ?? "-"}</td>
                                                    <td className="px-3 py-2.5 text-center">{statusBadge(ob.status)}</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <div className="flex justify-center gap-2 flex-wrap">
                                                            {ob.requiresPayment && ob.status === "unpaid" && (
                                                                <button onClick={e => { e.stopPropagation(); onCash(ob); }}
                                                                    className="px-3 py-1 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                                                                    Record Cash
                                                                </button>
                                                            )}
                                                            {ob.status === "pending_verification" && pend && (
                                                                <button onClick={e => { e.stopPropagation(); onVerify(pend); }}
                                                                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                                                                    Verify GCash
                                                                </button>
                                                            )}
                                                            {ob.receiptPath && ob.paymentType === "gcash" && (
                                                                <a href={receiptUrl(ob.receiptPath)} target="_blank" rel="noreferrer"
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                                                                    Receipt
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortKey = "name" | "section" | "year_level" | "department" | "pending" | "paid";
type TabKey = "students" | "payment_submissions" | "clearance_verification";

const StudentList = () => {
    const { accessToken, user } = useAuth();
    const [students,     setStudents]    = useState<AdminStudentItem[]>([]);
    const [payments,     setPayments]    = useState<PendingPaymentItem[]>([]);
    const [clearances,   setClearances]  = useState<PendingClearanceItem[]>([]);
    const [loading,      setLoading]     = useState(true);
    const [error,        setError]       = useState("");

    // Filters
    const [search,       setSearch]      = useState("");
    const [obSearch,     setObSearch]    = useState("");
    const [deptFilter,   setDeptFilter]  = useState("all");
    const [statusFilter, setStatusFilter]= useState("all");
    const [sortKey,      setSortKey]     = useState<SortKey>("name");
    const [tab,          setTab]         = useState<TabKey>("students");

    // Modals
    const [cashTarget,   setCashTarget]  = useState<AdminObligationItem | null>(null);
    const [verifyTarget, setVerifyTarget]= useState<PendingPaymentItem | null>(null);
    const [signTarget,   setSignTarget]  = useState<PendingClearanceItem | null>(null);

    // Bulk actions
    const [verifyingAll, setVerifyingAll]= useState(false);
    const [signingAll,   setSigningAll]  = useState(false);
    const [bulkMsg,      setBulkMsg]     = useState("");

    const isRestricted = ["class_officer", "program_head"].includes(user?.role ?? "");
    const hasClearanceRole = ["eso_officer", "program_head", "signatory", "dean"].includes(user?.role ?? "");

    const load = useCallback(() => {
        if (!accessToken) return;
        setLoading(true);
        const reqs: Promise<any>[] = [
            adminStudentService.listStudents(accessToken),
            adminStudentService.getPendingPayments(accessToken),
        ];
        if (hasClearanceRole) reqs.push(adminStudentService.getPendingClearance(accessToken));
        Promise.all(reqs)
            .then(([s, p, c]) => { setStudents(s); setPayments(p); setClearances(c ?? []); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    useEffect(() => { load(); }, [load]);

    const pendingMap: Record<number, PendingPaymentItem> = {};
    payments.forEach(p => { pendingMap[p.paymentId] = p; });

    async function handleVerifyAll() {
        if (!accessToken) return;
        setVerifyingAll(true); setBulkMsg("");
        try {
            const res = await adminStudentService.verifyAll(accessToken);
            setBulkMsg(\`\${res.count} payment(s) approved.\`);
            load();
        } catch (e: any) { setBulkMsg(e.message); } finally { setVerifyingAll(false); }
    }

    async function handleSignAll() {
        if (!accessToken) return;
        setSigningAll(true); setBulkMsg("");
        try {
            const res = await adminStudentService.signAllClearance(accessToken);
            setBulkMsg(\`\${res.count} clearance(s) signed.\`);
            load();
        } catch (e: any) { setBulkMsg(e.message); } finally { setSigningAll(false); }
    }

    const DEPTS = ["CpE", "CE", "ECE", "EE", "ME"];

    let filtered = students.filter(s =>
        \`\${s.firstName} \${s.lastName}\`.toLowerCase().includes(search.toLowerCase()) ||
        s.studentNo.toLowerCase().includes(search.toLowerCase())
    );
    if (!isRestricted && deptFilter !== "all") filtered = filtered.filter(s => s.departmentCode === deptFilter);
    if (statusFilter === "all_paid")  filtered = filtered.filter(s => s.obligationsPaid === s.obligationsTotal && s.obligationsTotal > 0);
    if (statusFilter === "pending")   filtered = filtered.filter(s => s.obligationsPending > 0);
    if (statusFilter === "unpaid")    filtered = filtered.filter(s => s.obligationsPaid < s.obligationsTotal);

    if (sortKey === "name")       filtered = [...filtered].sort((a, b) => a.lastName.localeCompare(b.lastName));
    if (sortKey === "section")    filtered = [...filtered].sort((a, b) => (a.section ?? "").localeCompare(b.section ?? ""));
    if (sortKey === "year_level") filtered = [...filtered].sort((a, b) => a.yearLevel - b.yearLevel);
    if (sortKey === "department") filtered = [...filtered].sort((a, b) => a.departmentCode.localeCompare(b.departmentCode));
    if (sortKey === "pending")    filtered = [...filtered].sort((a, b) => b.obligationsPending - a.obligationsPending);
    if (sortKey === "paid")       filtered = [...filtered].sort((a, b) => (b.obligationsPaid / Math.max(b.obligationsTotal,1)) - (a.obligationsPaid / Math.max(a.obligationsTotal,1)));

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: "students",              label: "Student List" },
        { key: "payment_submissions",   label: "Payment Submissions", count: payments.length },
        ...(hasClearanceRole ? [{ key: "clearance_verification" as TabKey, label: "Clearance Verification", count: clearances.length }] : []),
    ];

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="font-bold text-gray-800 text-2xl sm:text-3xl">Students</h1>
                {isRestricted && (
                    <p className="text-sm text-gray-400 mt-1">
                        Showing {students[0]?.departmentName ?? ""} only
                    </p>
                )}
            </div>

            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            {bulkMsg && tab !== "students" && <p className="text-green-700 text-sm mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-2">{bulkMsg}</p>}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => { setTab(t.key); setBulkMsg(""); }}
                        className={\`pb-2.5 px-4 text-sm font-semibold border-b-2 transition whitespace-nowrap \${
                            tab === t.key
                                ? "border-orange-500 text-orange-600"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                        }\`}>
                        {t.label}
                        {t.count !== undefined && t.count > 0 && (
                            <span className={\`ml-1.5 text-xs rounded-full px-1.5 py-0.5 font-bold \${
                                tab === t.key ? "bg-orange-500 text-white" : "bg-red-500 text-white"
                            }\`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Student List Tab ── */}
            {tab === "students" && (
                <>
                    <div className="flex flex-col gap-3 mb-5">
                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                            <input type="text" placeholder="Search student by name or ID..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                            <input type="text" placeholder="Filter by obligation name..."
                                value={obSearch} onChange={e => setObSearch(e.target.value)}
                                className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                            {!isRestricted && (
                                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                                    <option value="all">All Departments</option>
                                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            )}
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                                <option value="all">All Status</option>
                                <option value="all_paid">Fully Paid</option>
                                <option value="pending">Has Pending GCash</option>
                                <option value="unpaid">Has Unpaid</option>
                            </select>
                            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                                className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                                <option value="name">Sort: Name (A-Z)</option>
                                <option value="section">Sort: Section</option>
                                <option value="year_level">Sort: Year Level</option>
                                <option value="department">Sort: Department</option>
                                <option value="pending">Sort: Most Pending</option>
                                <option value="paid">Sort: Most Paid</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-400">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-3 text-left border-b border-gray-200">Name</th>
                                    <th className="p-3 text-center border-b border-gray-200">Student No.</th>
                                    <th className="p-3 text-center border-b border-gray-200">Dept</th>
                                    <th className="p-3 text-center border-b border-gray-200">Year / Sec.</th>
                                    <th className="p-3 text-center border-b border-gray-200">Obligations</th>
                                    <th className="p-3 text-center border-b border-gray-200">Clearance</th>
                                    <th className="p-3 text-center border-b border-gray-200"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">No students found.</td></tr>
                                ) : filtered.map(s => (
                                    <StudentRow key={s.studentId} student={s} token={accessToken!}
                                        pendingMap={pendingMap} onCash={setCashTarget} onVerify={setVerifyTarget}
                                        obSearch={obSearch} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── Payment Submissions Tab ── */}
            {tab === "payment_submissions" && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">
                                {payments.length === 0 ? "No pending GCash submissions." : \`\${payments.length} submission\${payments.length !== 1 ? "s" : ""} awaiting review\`}
                            </p>
                            {bulkMsg && <p className="text-green-600 text-sm mt-0.5">{bulkMsg}</p>}
                        </div>
                        {payments.length > 0 && (
                            <button onClick={handleVerifyAll} disabled={verifyingAll}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60">
                                {verifyingAll ? "Processing..." : \`Approve All (\${payments.length})\`}
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-3 text-left border-b border-gray-200">Student</th>
                                    <th className="p-3 text-center border-b border-gray-200">Dept</th>
                                    <th className="p-3 text-left border-b border-gray-200">Obligation</th>
                                    <th className="p-3 text-right border-b border-gray-200">Amount Paid</th>
                                    <th className="p-3 text-center border-b border-gray-200">Date Submitted</th>
                                    <th className="p-3 text-center border-b border-gray-200">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-gray-400">
                                        <p className="text-base font-medium text-gray-500 mb-1">All clear</p>
                                        <p className="text-sm">No GCash payment submissions pending review.</p>
                                    </td></tr>
                                ) : payments.map(p => (
                                    <tr key={p.paymentId} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-medium text-gray-800">{p.studentName}</div>
                                            <div className="text-xs text-gray-400">{p.studentNo}</div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{p.departmentCode}</span>
                                        </td>
                                        <td className="p-3 text-gray-700">{p.obligationName}</td>
                                        <td className="p-3 text-right font-semibold text-gray-800">PHP {Number(p.amountPaid).toFixed(2)}</td>
                                        <td className="p-3 text-center">
                                            <div className="text-xs text-gray-700">{new Date(p.submittedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</div>
                                            <div className="text-xs text-gray-400">{new Date(p.submittedAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => setVerifyTarget(p)}
                                                className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── Clearance Verification Tab ── */}
            {tab === "clearance_verification" && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">
                                {clearances.length === 0
                                    ? "No students pending clearance at your step."
                                    : \`\${clearances.length} student\${clearances.length !== 1 ? "s" : ""} awaiting your clearance signature\`}
                            </p>
                            {bulkMsg && <p className="text-green-600 text-sm mt-0.5">{bulkMsg}</p>}
                        </div>
                        {clearances.length > 0 && (
                            <button onClick={handleSignAll} disabled={signingAll}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60">
                                {signingAll ? "Signing..." : \`Sign All (\${clearances.length})\`}
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-3 text-left border-b border-gray-200">Student</th>
                                    <th className="p-3 text-center border-b border-gray-200">Dept</th>
                                    <th className="p-3 text-center border-b border-gray-200">Year / Sec.</th>
                                    <th className="p-3 text-center border-b border-gray-200">School Year</th>
                                    <th className="p-3 text-center border-b border-gray-200">Obligations</th>
                                    <th className="p-3 text-center border-b border-gray-200">Status</th>
                                    <th className="p-3 text-center border-b border-gray-200">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clearances.length === 0 ? (
                                    <tr><td colSpan={7} className="p-10 text-center text-gray-400">
                                        <p className="text-base font-medium text-gray-500 mb-1">Nothing to sign</p>
                                        <p className="text-sm">No students are pending clearance at your step.</p>
                                    </td></tr>
                                ) : clearances.map(c => (
                                    <tr key={c.studentId} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-medium text-gray-800">{c.lastName}, {c.firstName}</div>
                                            <div className="text-xs text-gray-400">{c.studentNo}</div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{c.departmentCode}</span>
                                        </td>
                                        <td className="p-3 text-center text-gray-600 text-xs">{c.yearLevel} - {c.section}</td>
                                        <td className="p-3 text-center text-gray-600 text-xs">{c.schoolYear} / {c.semester}</td>
                                        <td className="p-3 text-center">
                                            <span className="text-green-700 font-semibold text-sm">{c.obligationsPaid}/{c.obligationsTotal}</span>
                                            {c.obligationsTotal > 0 && c.obligationsPaid === c.obligationsTotal && (
                                                <span className="ml-1 text-xs text-green-600">All settled</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">{clearanceBadge(c.clearanceStatus)}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => setSignTarget(c)}
                                                className="px-4 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                                                Sign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modals */}
            {cashTarget && (
                <CashModal item={cashTarget} token={accessToken!}
                    onClose={() => setCashTarget(null)}
                    onDone={() => { setCashTarget(null); load(); }} />
            )}
            {verifyTarget && (
                <VerifyModal item={verifyTarget} token={accessToken!}
                    onClose={() => setVerifyTarget(null)}
                    onDone={() => { setVerifyTarget(null); load(); }} />
            )}
            {signTarget && (
                <SignClearanceModal student={signTarget} token={accessToken!}
                    onClose={() => setSignTarget(null)}
                    onDone={() => { setSignTarget(null); load(); }} />
            )}
        </div>
    );
};

export default StudentList;
`;

fs.writeFileSync('c:/Users/Ian/OneDrive/Documents/OJT_Project/ESO_Auditing_System_v1/client/src/pages/admin/StudentList.tsx', content);
console.log('done', content.length);
