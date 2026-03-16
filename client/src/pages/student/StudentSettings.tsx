import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { studentService } from "../../services/student.service";
import type { StudentProfile } from "../../services/student.service";

const StudentSettings = () => {
    const { accessToken, changePassword } = useAuth();

    // Profile state
    const [profile,    setProfile]    = useState<StudentProfile | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [profileErr, setProfileErr] = useState("");
    const [firstName,  setFirstName]  = useState("");
    const [lastName,   setLastName]   = useState("");
    const [yearLevel,  setYearLevel]  = useState("");
    const [section,    setSection]    = useState("");
    const [schoolYear, setSchoolYear] = useState("");
    const [semester,   setSemester]   = useState("");

    // Password state
    const BLANK_PW = { current: "", next: "", confirm: "" };
    const [pw,        setPw]        = useState(BLANK_PW);
    const [pwError,   setPwError]   = useState("");
    const [pwSuccess, setPwSuccess] = useState("");

    const [saving,  setSaving]  = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [saveErr, setSaveErr] = useState("");

    useEffect(() => {
        if (!accessToken) return;
        studentService.getProfile(accessToken)
            .then(p => {
                setProfile(p);
                setFirstName(p.firstName);
                setLastName(p.lastName);
                setYearLevel(String(p.yearLevel));
                setSection(p.section);
                setSchoolYear(p.schoolYear);
                setSemester(p.semester);
            })
            .catch(e => setProfileErr(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    function handleReset() {
        if (profile) {
            setFirstName(profile.firstName);
            setLastName(profile.lastName);
            setYearLevel(String(profile.yearLevel));
            setSection(profile.section);
            setSchoolYear(profile.schoolYear);
            setSemester(profile.semester);
        }
        setPw(BLANK_PW);
        setPwError("");
        setPwSuccess("");
        setSaveErr("");
        setSaveMsg("");
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!accessToken) return;
        setSaveErr(""); setSaveMsg(""); setPwError(""); setPwSuccess("");

        if (!firstName.trim() || !lastName.trim() || !yearLevel || !section.trim() || !schoolYear.trim() || !semester) {
            setSaveErr("All profile fields are required.");
            return;
        }

        const changingPw = pw.current || pw.next || pw.confirm;
        if (changingPw) {
            if (!pw.current)            { setPwError("Enter your current password."); return; }
            if (pw.next.length < 8)     { setPwError("New password must be at least 8 characters."); return; }
            if (pw.next !== pw.confirm) { setPwError("New passwords do not match."); return; }
        }

        setSaving(true);
        try {
            const updated = await studentService.updateProfile(accessToken, {
                firstName:  firstName.trim(),
                lastName:   lastName.trim(),
                yearLevel:  Number(yearLevel),
                section:    section.trim(),
                schoolYear: schoolYear.trim(),
                semester,
            });
            setProfile(updated);

            if (changingPw) {
                await changePassword(pw.current, pw.next);
                setPwSuccess("Password changed.");
                setPw(BLANK_PW);
            }
            setSaveMsg("Changes saved successfully.");
        } catch (err: any) {
            setSaveErr(err.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="font-bold text-gray-800 text-2xl sm:text-3xl mb-6">Settings</h1>

            <form onSubmit={handleSave} className="flex flex-col gap-6 w-full">

                {/* ── PROFILE CARD ── */}
                <div className="bg-white rounded-2xl shadow-md p-6 w-full">
                    <h2 className="font-semibold text-gray-700 text-base mb-5 border-b pb-3">My Profile</h2>

                    {profileErr && <p className="text-red-500 text-sm mb-4">{profileErr}</p>}

                    {profile && (
                        <>
                            {/* Avatar */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl font-bold select-none flex-shrink-0">
                                    {firstName[0] ?? ""}{lastName[0] ?? ""}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-lg">{firstName} {lastName}</p>
                                    <p className="text-sm text-gray-500">{profile.studentNo}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                {/* Editable fields */}
                                <Field label="First Name *">
                                    <input
                                        className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="First name"
                                    />
                                </Field>
                                <Field label="Last Name *">
                                    <input
                                        className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder="Last name"
                                    />
                                </Field>
                                <Field label="Year Level *">
                                    <select
                                        className="border rounded-lg px-3 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={yearLevel}
                                        onChange={e => setYearLevel(e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </Field>
                                <Field label="Section *">
                                    <input
                                        className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={section}
                                        onChange={e => setSection(e.target.value)}
                                        placeholder="e.g. A"
                                    />
                                </Field>
                                <Field label="School Year *">
                                    <input
                                        className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={schoolYear}
                                        onChange={e => setSchoolYear(e.target.value)}
                                        placeholder="e.g. 2025-2026"
                                    />
                                </Field>
                                <Field label="Semester *">
                                    <select
                                        className="border rounded-lg px-3 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        value={semester}
                                        onChange={e => setSemester(e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="1st">1st Semester</option>
                                        <option value="2nd">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                </Field>

                                {/* Read-only */}
                                <Field label="Program">
                                    <div className="border rounded-lg px-3 py-2 w-full text-sm bg-gray-50 text-gray-500">
                                        {profile.departmentName}
                                    </div>
                                </Field>
                                <Field label="Student Number">
                                    <div className="border rounded-lg px-3 py-2 w-full text-sm bg-gray-50 text-gray-500">
                                        {profile.studentNo}
                                    </div>
                                </Field>
                            </div>
                        </>
                    )}
                </div>

                {/* ── CHANGE PASSWORD CARD ── */}
                <div className="bg-white rounded-2xl shadow-md p-6 w-full">
                    <h2 className="font-semibold text-gray-700 text-base mb-2 border-b pb-3">Change Password</h2>
                    <p className="text-xs text-gray-400 mb-4">Leave these blank if you do not want to change your password.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Current Password">
                            <input
                                type="password"
                                className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                placeholder="Current password"
                                value={pw.current}
                                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                            />
                        </Field>
                        <Field label="New Password">
                            <input
                                type="password"
                                className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                placeholder="Min. 8 characters"
                                value={pw.next}
                                onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                            />
                        </Field>
                        <Field label="Confirm New Password">
                            <input
                                type="password"
                                className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                placeholder="Retype new password"
                                value={pw.confirm}
                                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                            />
                        </Field>
                    </div>

                    {pwError   && <p className="text-red-500 text-sm mt-3">{pwError}</p>}
                    {pwSuccess && <p className="text-green-600 text-sm mt-3">{pwSuccess}</p>}
                </div>

                {/* ── BOTTOM BUTTONS ── */}
                {saveErr && <p className="text-red-500 text-sm">{saveErr}</p>}
                {saveMsg && <p className="text-green-600 text-sm">{saveMsg}</p>}

                <div className="flex justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm"
                    >
                        Reset All
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-sm"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

            </form>
        </div>
    );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            {children}
        </div>
    );
}

export default StudentSettings;
