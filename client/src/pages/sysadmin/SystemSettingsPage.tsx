import { useEffect, useState } from "react";
import { MdSave, MdSettings, MdBuild, MdSchool, MdClose } from "react-icons/md";
import { FiArrowUp, FiUserCheck } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { sysadminService } from "../../services/sysadmin.service";

interface AdvancementStudent {
    student_id: number;
    first_name: string;
    last_name: string;
    student_no: string;
    year_level: number;
    department_name: string;
}

interface AdvancementPreview {
    toAdvance: AdvancementStudent[];
    toGraduate: AdvancementStudent[];
    totalAffected: number;
}

const YEAR_LABELS: Record<number, string> = {
    1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year", 5: "5th Year",
};

// Groups list by year_level for display
function groupByYear(list: AdvancementStudent[]) {
    const map: Record<number, AdvancementStudent[]> = {};
    for (const s of list) {
        if (!map[s.year_level]) map[s.year_level] = [];
        map[s.year_level].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b));
}

export default function SystemSettingsPage() {
    const { accessToken } = useAuth();

    // Maintenance state
    const [mode, setMode] = useState(false);
    const [msg,  setMsg]  = useState("");

    // Semester state
    const [schoolYear,      setSchoolYear]      = useState("");
    const [semester,        setSemester]        = useState("");
    const [savedSchoolYear, setSavedSchoolYear] = useState(""); // tracks what's in DB
    const [yearAutoChanged, setYearAutoChanged] = useState(false); // highlights school year input

    const [loading,  setLoading]  = useState(true);
    const [savingM,  setSavingM]  = useState(false);
    const [savingS,  setSavingS]  = useState(false);
    const [toast,    setToast]    = useState("");

    // Advancement modal state
    const [preview,       setPreview]       = useState<AdvancementPreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [savingAdvance, setSavingAdvance]  = useState(false);

    useEffect(() => {
        if (!accessToken) return;
        sysadminService.getSettings(accessToken).then(s => {
            setMode(Boolean(s.maintenance_mode));
            setMsg(s.maintenance_msg);
            setSchoolYear(s.school_year);
            setSemester(s.current_semester);
            setSavedSchoolYear(s.school_year);
        }).finally(() => setLoading(false));
    }, [accessToken]);

    const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3500); };

    const advanceSchoolYear = (sy: string): string => {
        const m = sy.match(/^(\d{4})-(\d{4})$/);
        if (!m) return sy;
        const end = parseInt(m[2]);
        return `${end}-${end + 1}`;
    };

    const handleSemesterChange = (newSem: string) => {
        setSemester(newSem);
        if (newSem === "1st") {
            const next = advanceSchoolYear(savedSchoolYear);
            setSchoolYear(next);
            setYearAutoChanged(next !== savedSchoolYear);
        } else {
            setSchoolYear(savedSchoolYear);
            setYearAutoChanged(false);
        }
    };

    const handleSaveMaintenance = async () => {
        if (!accessToken) return;
        setSavingM(true);
        try {
            await sysadminService.updateMaintenance(accessToken, mode, msg);
            showToast("Maintenance settings saved.");
        } catch (e: any) { showToast(e.message); }
        finally { setSavingM(false); }
    };

    // Detect if this save requires year advancement
    const isNewAcademicYear = schoolYear !== savedSchoolYear && semester === "1st";

    const handleSaveSemester = async () => {
        if (!accessToken || !schoolYear || !semester) { showToast("Please fill in all fields."); return; }

        // If new school year + 1st sem: fetch preview first, show modal
        if (isNewAcademicYear) {
            setLoadingPreview(true);
            try {
                const data = await sysadminService.previewAdvancement(accessToken);
                setPreview(data);
            } catch (e: any) {
                showToast(e.message);
            } finally {
                setLoadingPreview(false);
            }
            return;
        }

        // Otherwise just save
        setSavingS(true);
        try {
            await sysadminService.updateSemester(accessToken, schoolYear, semester);
            setSavedSchoolYear(schoolYear);
            showToast("Academic settings saved.");
        } catch (e: any) { showToast(e.message); }
        finally { setSavingS(false); }
    };

    const handleConfirmSave = async (withAdvancement: boolean) => {
        if (!accessToken) return;
        setSavingAdvance(true);
        try {
            // Save semester settings first
            await sysadminService.updateSemester(accessToken, schoolYear, semester);
            setSavedSchoolYear(schoolYear);

            if (withAdvancement) {
                const result = await sysadminService.executeAdvancement(accessToken, schoolYear);
                showToast(`Saved. ${result.advancedCount} student(s) advanced, ${result.graduatedCount} graduated & archived.`);
            } else {
                showToast("Academic settings saved. Student year levels unchanged.");
            }
            setPreview(null);
        } catch (e: any) { showToast(e.message); }
        finally { setSavingAdvance(false); }
    };

    const inp = "w-full rounded-xl bg-white border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500";
    const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2";

    const currentYear = new Date().getFullYear();
    const yearSuggestions = Array.from({ length: 11 }, (_, i) => {
        const y = currentYear - 5 + i;
        return `${y}-${y + 1}`;
    });

    return (
        <div className="p-3 sm:p-5 lg:p-8 min-h-screen bg-gray-50">
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInScrim {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.94) translateY(12px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            <div className="mb-5 sm:mb-6" style={{ animation: "fadeInUp 0.35s ease both" }}>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">System Settings</h1>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
                    <p className="text-gray-400 text-sm">Loading...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-5 max-w-2xl">

                    {/* ── Maintenance Mode ── */}
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 sm:p-6 space-y-6"
                        style={{ animation: "fadeInUp 0.4s ease both 0.06s" }}>
                        <div className="flex items-center gap-2">
                            <MdBuild className="text-orange-500" size={18} />
                            <h2 className="text-gray-700 font-semibold text-sm">Maintenance Mode</h2>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-gray-800 font-semibold text-sm">Enable Maintenance</p>
                                <p className="text-gray-500 text-xs mt-0.5">
                                    When ON, students and other users see a maintenance screen.
                                </p>
                            </div>
                            <button
                                onClick={() => setMode(m => !m)}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none shrink-0
                                    ${mode ? "bg-red-500" : "bg-gray-300"}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300
                                    ${mode ? "translate-x-7" : "translate-x-0"}`} />
                            </button>
                        </div>

                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl
                            ${mode ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            <MdBuild size={16} className="shrink-0" />
                            <span className="text-sm font-medium">
                                {mode
                                    ? "Maintenance is currently ON. Users cannot access the system."
                                    : "System is operational. All users can access normally."}
                            </span>
                        </div>

                        <div>
                            <label className={lbl}>Maintenance Message</label>
                            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
                                placeholder="System is currently under maintenance. Please try again later."
                                className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                            <p className="text-gray-400 text-xs mt-1">This message is shown to users on the maintenance screen.</p>
                        </div>

                        <button onClick={handleSaveMaintenance} disabled={savingM}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60">
                            <MdSave size={16} />
                            {savingM ? "Saving..." : "Save"}
                        </button>
                    </div>

                    {/* ── Academic Period ── */}
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 sm:p-6 space-y-5"
                        style={{ animation: "fadeInUp 0.4s ease both 0.12s" }}>
                        <div className="flex items-center gap-2">
                            <MdSettings className="text-orange-500" size={18} />
                            <h2 className="text-gray-700 font-semibold text-sm">Academic Period</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>
                                    School Year
                                    {yearAutoChanged && (
                                        <span className="ml-2 text-blue-500 normal-case font-normal">auto-updated</span>
                                    )}
                                </label>
                                <input
                                    list="school-year-suggestions"
                                    value={schoolYear}
                                    onChange={e => { setSchoolYear(e.target.value); setYearAutoChanged(false); }}
                                    placeholder="e.g. 2025-2026"
                                    className={inp + (yearAutoChanged ? " ring-2 ring-blue-400 border-blue-300" : "")}
                                />
                                <datalist id="school-year-suggestions">
                                    {yearSuggestions.map(y => <option key={y} value={y} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className={lbl}>Current Semester</label>
                                <select value={semester} onChange={e => handleSemesterChange(e.target.value)}
                                    className={inp + " cursor-pointer"}>
                                    <option value="" disabled hidden>Select semester</option>
                                    <option value="1st">1st Semester</option>
                                    <option value="2nd">2nd Semester</option>
                                </select>
                            </div>
                        </div>

                        {/* Advancement notice */}
                        {isNewAcademicYear && (
                            <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl px-4 py-3"
                                style={{ animation: "fadeInUp 0.25s ease both" }}>
                                <MdSchool className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-blue-700 text-xs">
                                    <strong>New academic year detected.</strong> Saving will prompt you to advance student year levels for {schoolYear}.
                                </p>
                            </div>
                        )}

                        {!isNewAcademicYear && (
                            <div className="bg-orange-50 rounded-xl px-4 py-3">
                                <p className="text-orange-700 text-xs">
                                    <strong>Note:</strong> Changing the semester affects which obligations and clearances are active.
                                    Make sure all records for the current period are finalized before switching.
                                </p>
                            </div>
                        )}

                        <button onClick={handleSaveSemester} disabled={savingS || loadingPreview}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60">
                            <MdSave size={16} />
                            {loadingPreview ? "Checking..." : savingS ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Advancement Confirmation Modal ── */}
            {preview && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    style={{ animation: "fadeInScrim 0.2s ease both" }}>
                    <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-lg my-4"
                        style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <MdSchool className="text-blue-600" size={18} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 text-base">Academic Year Advancement</h2>
                                    <p className="text-gray-400 text-xs">Switching to {schoolYear} — 1st Semester</p>
                                </div>
                            </div>
                            <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                                <MdClose size={20} />
                            </button>
                        </div>

                        <div className="px-5 pb-5 space-y-4">

                            {preview.totalAffected === 0 ? (
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-gray-500 text-sm">No enrolled students found. Settings will be saved without any year advancement.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Summary */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <FiArrowUp className="text-blue-500 mx-auto mb-1" size={18} />
                                            <p className="text-2xl font-black text-blue-600">{preview.toAdvance.length}</p>
                                            <p className="text-xs text-blue-500 font-medium">Will Advance</p>
                                            <p className="text-[11px] text-blue-400">to next year level</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                                            <FiUserCheck className="text-orange-500 mx-auto mb-1" size={18} />
                                            <p className="text-2xl font-black text-orange-600">{preview.toGraduate.length}</p>
                                            <p className="text-xs text-orange-500 font-medium">Will Graduate</p>
                                            <p className="text-[11px] text-orange-400">archived as inactive</p>
                                        </div>
                                    </div>

                                    {/* Advance breakdown */}
                                    {preview.toAdvance.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Students Advancing</p>
                                            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                                {groupByYear(preview.toAdvance).map(([year, students]) => (
                                                    <div key={year} className="bg-gray-50 rounded-xl px-3 py-2">
                                                        <p className="text-xs font-semibold text-gray-600 mb-1">
                                                            {YEAR_LABELS[Number(year)]} → {YEAR_LABELS[Number(year) + 1]}
                                                            <span className="ml-1.5 text-gray-400 font-normal">({students.length} students)</span>
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {students.slice(0, 6).map(s => (
                                                                <span key={s.student_id} className="text-[11px] bg-white rounded-lg px-2 py-0.5 text-gray-600 shadow-sm">
                                                                    {s.last_name}, {s.first_name}
                                                                </span>
                                                            ))}
                                                            {students.length > 6 && (
                                                                <span className="text-[11px] text-gray-400">+{students.length - 6} more</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Graduate breakdown */}
                                    {preview.toGraduate.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Students Graduating</p>
                                            <div className="bg-orange-50 rounded-xl px-3 py-2 max-h-32 overflow-y-auto">
                                                <div className="flex flex-wrap gap-1">
                                                    {preview.toGraduate.slice(0, 8).map(s => (
                                                        <span key={s.student_id} className="text-[11px] bg-white rounded-lg px-2 py-0.5 text-orange-700 shadow-sm">
                                                            {s.last_name}, {s.first_name}
                                                        </span>
                                                    ))}
                                                    {preview.toGraduate.length > 8 && (
                                                        <span className="text-[11px] text-orange-400">+{preview.toGraduate.length - 8} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <button onClick={() => setPreview(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition">
                                    Cancel
                                </button>
                                <button onClick={() => handleConfirmSave(false)} disabled={savingAdvance}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60">
                                    {savingAdvance ? "Saving..." : "Save Without Advancing"}
                                </button>
                                {preview.totalAffected > 0 && (
                                    <button onClick={() => handleConfirmSave(true)} disabled={savingAdvance}
                                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                                        {savingAdvance ? "Advancing..." : "Save & Advance"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">
                    {toast}
                </div>
            )}
        </div>
    );
}
