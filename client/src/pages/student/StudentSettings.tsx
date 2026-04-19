import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { studentService, avatarUrl } from "../../services/student.service";
import type { StudentProfile } from "../../services/student.service";
import { FiEdit2, FiUpload, FiRefreshCw, FiUser, FiLock, FiSave, FiRotateCcw, FiMoon, FiBell } from "react-icons/fi";

const StudentSettings = () => {
    const { accessToken, changePassword } = useAuth();
    const { darkMode, setDarkMode, notificationsEnabled, setNotificationsEnabled } = useTheme();
    const dk = darkMode;
    const card = dk ? "bg-[#1a1a1a] border border-[#2a2a2a]" : "bg-white";
    const txt  = dk ? "text-white"   : "text-gray-800";
    const sub  = dk ? "text-gray-400" : "text-gray-500";
    const inp  = dk ? "bg-[#252525] border-[#3a3a3a] text-gray-100 focus:border-orange-500" : "border-gray-300 focus:border-orange-400 text-gray-800";

    // Profile state
    const [profile,       setProfile]       = useState<StudentProfile | null>(null);
    const [loading,       setLoading]       = useState(true);
    const [profileErr,    setProfileErr]    = useState("");
    const [firstName,     setFirstName]     = useState("");
    const [lastName,      setLastName]      = useState("");
    const [middleName,    setMiddleName]    = useState("");
    const [yearLevel,     setYearLevel]     = useState("");
    const [section,       setSection]       = useState("");
    const [schoolYear,    setSchoolYear]    = useState("");
    const [semester,      setSemester]      = useState<number>(1);
    const [gender,        setGender]        = useState<number | "">("");
    const [address,       setAddress]       = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [guardianName,  setGuardianName]  = useState("");
    const [shirtSize,     setShirtSize]     = useState("");

    // Avatar state
    const [avatarFile,     setAvatarFile]     = useState<File | null>(null);
    const [avatarPreview,  setAvatarPreview]  = useState<string | null>(null);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const avatarMenuRef  = useRef<HTMLDivElement>(null);

    // Password state
    const BLANK_PW = { current: "", next: "", confirm: "" };
    const [pw,        setPw]        = useState(BLANK_PW);
    const [pwError,   setPwError]   = useState("");
    const [pwSuccess, setPwSuccess] = useState("");

    const [saving,      setSaving]      = useState(false);
    const [saveMsg,     setSaveMsg]     = useState("");
    const [saveErr,     setSaveErr]     = useState("");
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!accessToken) return;
        studentService.getProfile(accessToken)
            .then(p => {
                setProfile(p);
                setFirstName(p.firstName);
                setLastName(p.lastName);
                setMiddleName(p.middleName    ?? "");
                setYearLevel(String(p.yearLevel));
                setSection(p.section);
                setSchoolYear(p.schoolYear);
                setSemester(p.semester);
                setGender(p.gender ?? "");
                setAddress(p.address          ?? "");
                setContactNumber(p.contactNumber    ?? "");
                setGuardianName(p.guardianName     ?? "");
                setShirtSize(p.shirtSize        ?? "");
                if (p.avatarPath) setAvatarPreview(avatarUrl(p.avatarPath));
            })
            .catch(e => setProfileErr(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    // Close avatar menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node))
                setAvatarMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    function handleReset() {
        if (profile) {
            setFirstName(profile.firstName);
            setLastName(profile.lastName);
            setMiddleName(profile.middleName   ?? "");
            setYearLevel(String(profile.yearLevel));
            setSection(profile.section);
            setSchoolYear(profile.schoolYear);
            setSemester(profile.semester);
            setGender(profile.gender           ?? "");
            setAddress(profile.address         ?? "");
            setContactNumber(profile.contactNumber ?? "");
            setGuardianName(profile.guardianName   ?? "");
            setShirtSize(profile.shirtSize     ?? "");
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
            setSaveErr("First name, last name, year level, section, school year, and semester are required.");
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
                firstName:     firstName.trim(),
                lastName:      lastName.trim(),
                middleName:    middleName.trim(),
                yearLevel:     Number(yearLevel),
                section:       section.trim(),
                schoolYear:    schoolYear.trim(),
                semester,
                gender:        gender !== "" ? Number(gender) : null,
                address:       address.trim(),
                contactNumber: contactNumber.trim(),
                guardianName:  guardianName.trim(),
                shirtSize:     shirtSize.trim(),
            }, avatarFile);
            setAvatarFile(null);
            if (updated.avatarPath) setAvatarPreview(avatarUrl(updated.avatarPath));
            setProfile(updated);

            if (changingPw) {
                await changePassword(pw.current, pw.next);
                setPwSuccess("Password changed.");
                setPw(BLANK_PW);
            }
            setSaveMsg("Changes saved successfully.");
            setToastVisible(true);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
        } catch (err: any) {
            setSaveErr(err.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#111111]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-orange-500" />
        </div>
    );

    const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

    return (
        <div className={`p-4 sm:p-6 md:p-8 min-h-screen ${dk ? "bg-[#111111]" : "bg-gray-50"}`}>

            {/* ── Toast notification ── */}
            {toastVisible && (
                <div className="fixed top-5 inset-x-0 flex justify-center z-[100] anim-slide-up pointer-events-none px-4">
                    <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white dark:bg-[#1e1e1e] shadow-[0_12px_48px_rgba(0,0,0,0.22)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.75)] w-max max-w-[calc(100vw-2rem)]">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white whitespace-nowrap">Changes saved successfully</p>
                    </div>
                </div>
            )}

            <h1 className={`anim-section font-bold text-2xl sm:text-3xl mb-6 ${txt}`} style={{ animationDelay: "0ms" }}>Settings</h1>

            <form onSubmit={handleSave} className="flex flex-col gap-6 w-full">

                {/* ── PROFILE CARD ── */}
                <div className={`anim-section rounded-2xl shadow-xl p-6 w-full ${card}`} style={{ animationDelay: "80ms" }}>
                    <div className="flex items-center gap-2 mb-5 pb-4">
                        <FiUser className="w-4 h-4 text-orange-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white text-base">My Profile</h2>
                    </div>

                    {profileErr && <p className="text-red-500 text-sm mb-4">{profileErr}</p>}

                    {profile && (
                        <>
                            {/* Avatar row */}
                            <div className="flex items-center gap-5 mb-6">
                                {/* Avatar circle with pen button */}
                                <div className="relative shrink-0" ref={avatarMenuRef}>
                                    <div className="w-20 h-20 rounded-full overflow-hidden">
                                        {avatarPreview
                                            ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                            : <DefaultAvatarSvg />
                                        }
                                    </div>

                                    {/* Pen edit button */}
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMenuOpen(o => !o)}
                                        className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
                                        title="Edit profile picture"
                                    >
                                        <FiEdit2 className="w-3 h-3" />
                                    </button>

                                    {/* Dropdown menu */}
                                    {avatarMenuOpen && (
                                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 overflow-hidden min-w-[170px]">
                                            <button
                                                type="button"
                                                onClick={() => { avatarInputRef.current?.click(); setAvatarMenuOpen(false); }}
                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                <FiUpload className="w-4 h-4 text-orange-500" />
                                                Upload Photo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setAvatarFile(null); setAvatarPreview(null); setAvatarMenuOpen(false); }}
                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
                                            >
                                                <FiRefreshCw className="w-4 h-4 text-gray-400" />
                                                Reset to Default
                                            </button>
                                        </div>
                                    )}

                                    {/* Hidden file input */}
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0] ?? null;
                                            setAvatarFile(file);
                                            if (file) setAvatarPreview(URL.createObjectURL(file));
                                            e.target.value = "";
                                        }}
                                    />
                                </div>

                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-xl">{firstName} {lastName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile.studentNo}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{profile.programName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Field label="First Name">
                                    <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
                                </Field>
                                <Field label="Last Name">
                                    <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
                                </Field>
                                <Field label="Middle Name">
                                    <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Middle name (optional)" />
                                </Field>
                                <Field label="Email">
                                    <div className="border-2 border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-500">
                                        {profile.email}
                                    </div>
                                </Field>
                                <Field label="Student Number">
                                    <div className="border-2 border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-500 font-mono">
                                        {profile.studentNo}
                                    </div>
                                </Field>
                                <Field label="Program">
                                    <div className="border-2 border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-500 font-medium">
                                        {profile.programName}
                                    </div>
                                </Field>
                                <Field label="Year Level">
                                    <select className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={yearLevel} onChange={e => setYearLevel(e.target.value)}>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                        <option value="5">5th Year</option>
                                    </select>
                                </Field>
                                <Field label="Section">
                                    <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. A" />
                                </Field>
                                <Field label="School Year">
                                    <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={schoolYear} onChange={e => setSchoolYear(e.target.value)} placeholder="e.g. 2025-2026" />
                                </Field>
                                <Field label="Semester">
                                    <select className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={semester} onChange={e => setSemester(Number(e.target.value))}>
                                        <option value={1}>1st Semester</option>
                                        <option value={2}>2nd Semester</option>
                                        <option value={3}>Summer</option>
                                    </select>
                                </Field>
                                <Field label="Gender">
                                    <select className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={gender} onChange={e => setGender(e.target.value !== "" ? Number(e.target.value) : "")}>
                                        <option value="">— select —</option>
                                        <option value={1}>Male</option>
                                        <option value={2}>Female</option>
                                        <option value={3}>Other</option>
                                    </select>
                                </Field>
                                <Field label="Shirt Size">
                                    <select className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                        value={shirtSize} onChange={e => setShirtSize(e.target.value)}>
                                        <option value="">— select —</option>
                                        <option value="XS">XS</option>
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                        <option value="XXL">XXL</option>
                                    </select>
                                </Field>
                            </div>

                            {/* ── Contact & Guardian ── */}
                            <div className={`mt-6 pt-5 border-t ${dk ? "border-[#2a2a2a]" : "border-gray-100"}`}>
                                <p className={`text-xs font-bold uppercase tracking-wide mb-4 ${sub}`}>Contact &amp; Guardian Information</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Field label="Guardian Name">
                                        <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                            value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Guardian's full name" />
                                    </Field>
                                    <Field label="Emergency Contact Number">
                                        <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                            value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. 09XXXXXXXXX" />
                                    </Field>
                                    <Field label="Address">
                                        <input className={`border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]`}
                                            value={address} onChange={e => setAddress(e.target.value)} placeholder="Complete address" />
                                    </Field>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── CHANGE PASSWORD CARD ── */}
                <div className={`anim-section rounded-2xl shadow-xl p-6 w-full ${card}`} style={{ animationDelay: "160ms" }}>
                    <div className="flex items-center gap-2 mb-2 border-b pb-4">
                        <FiLock className="w-4 h-4 text-orange-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white text-base">Change Password</h2>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 mt-3">Leave these blank if you do not want to change your password.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="Current Password">
                            <input
                                type="password"
                                className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2.5 w-full text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                placeholder="Current password"
                                value={pw.current}
                                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                            />
                        </Field>
                        <Field label="New Password">
                            <input
                                type="password"
                                className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2.5 w-full text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                placeholder="Min. 8 characters"
                                value={pw.next}
                                onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                            />
                        </Field>
                        <Field label="Confirm New Password">
                            <input
                                type="password"
                                className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2.5 w-full text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                placeholder="Retype new password"
                                value={pw.confirm}
                                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                            />
                        </Field>
                    </div>

                    {pwError   && <p className="text-red-500 text-sm mt-3">{pwError}</p>}
                    {pwSuccess && <p className="text-green-600 text-sm mt-3">{pwSuccess}</p>}
                </div>

                {/* ── APPEARANCE CARD ── */}
                <div className={`anim-section rounded-2xl shadow-xl p-6 w-full ${card}`} style={{ animationDelay: "220ms" }}>
                    <div className={`flex items-center gap-2 mb-5 pb-4 border-b ${dk ? "border-[#2a2a2a]" : "border-gray-100"}`}>
                        <FiMoon className="w-4 h-4 text-orange-500" />
                        <h2 className={`font-semibold text-base ${txt}`}>Appearance & Notifications</h2>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-semibold ${txt}`}>Dark Mode</p>
                                <p className={`text-xs mt-0.5 ${sub}`}>Switch to dark orange theme</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDarkMode(d => !d)}
                                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${dk ? "bg-orange-500" : "bg-gray-300"}`}
                            >
                                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${dk ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {/* Notifications Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-semibold ${txt}`}>Notifications</p>
                                <p className={`text-xs mt-0.5 ${sub}`}>Show notification bell and alerts</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNotificationsEnabled(n => !n)}
                                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${notificationsEnabled ? "bg-orange-500" : "bg-gray-300"}`}
                            >
                                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${notificationsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── BOTTOM BUTTONS ── */}
                {saveErr && <p className="text-red-500 text-sm -mt-2">{saveErr}</p>}

                <div className="anim-section flex flex-wrap justify-between gap-3" style={{ animationDelay: "300ms" }}>
                    <button
                        type="button"
                        onClick={handleReset}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition text-xs sm:text-sm ${dk ? "bg-[#2a2a2a] text-gray-300 hover:bg-[#333]" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                    >
                        <FiRotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Reset All
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-xs sm:text-sm shadow-lg"
                    >
                        <FiSave className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
};

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

export default StudentSettings;
