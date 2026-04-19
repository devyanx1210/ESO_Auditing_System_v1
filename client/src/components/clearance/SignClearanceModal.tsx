import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import { adminStudentService } from "../../services/admin-student.service";
import type { PendingClearanceItem } from "../../services/admin-student.service";

interface Props {
    student: PendingClearanceItem;
    token: string;
    onClose: () => void;
    onDone: () => void;
}

function clearanceStatusLabel(s: number | null) {
    if (s === 2) return "Approved";
    if (s === 3) return "Rejected";
    return "Processing";
}

export function SignClearanceModal({ student, token, onClose, onDone }: Props) {
    const [remarks, setRemarks] = useState("");
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState("");

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await adminStudentService.signClearance(token, student.studentId, remarks);
            onDone();
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : "Failed to approve clearance");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-6 relative"
                style={{ animation: "fadeInUp 0.2s ease both" }}
                onClick={e => e.stopPropagation()}>

                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition">
                    <FiX className="w-5 h-5" />
                </button>

                <h3 className="font-bold text-gray-800 text-lg mb-1">Approve Clearance</h3>
                <p className="text-sm text-gray-600 font-medium mb-0.5">{student.lastName}, {student.firstName}</p>
                <p className="text-xs text-gray-400 mb-4">
                    {student.studentNo} · {student.programCode} · {student.schoolYear} Sem {student.semester}
                </p>

                <div className="flex gap-6 mb-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400">Obligations</p>
                        <p className="font-semibold text-gray-800">{student.obligationsPaid} / {student.obligationsTotal} completed</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Clearance</p>
                        <p className="font-semibold text-gray-800">{clearanceStatusLabel(student.clearanceStatus) ?? "Not Started"}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-3">
                    <textarea
                        rows={2}
                        placeholder="Remarks (optional)"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                    />
                    {err && <p className="text-red-500 text-sm">{err}</p>}
                    <div className="flex justify-between gap-3 mt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
                            {saving ? "Approving..." : "Approve"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
