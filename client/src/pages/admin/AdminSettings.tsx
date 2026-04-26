import React, { useEffect, useState, useRef } from "react";
import { FiTrash2, FiPlus, FiCheck, FiUsers, FiArchive, FiUser, FiFilter, FiChevronDown, FiChevronUp, FiSearch, FiLock, FiEdit2, FiUpload, FiRefreshCw, FiSave } from "react-icons/fi";
import { AlertModal } from "../../components/ui/AlertModal";
import { userService } from "../../services/user.service";
import type { AdminUserItem, CreateAdminInput } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import { adminProfileService, adminAvatarUrl } from "../../services/admin-profile.service";
import type { AdminProfile } from "../../services/admin-profile.service";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

function DefaultAvatarSvg() {
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
            <circle cx="50" cy="50" r="50" fill="#E4E6E9" />
            <ellipse cx="50" cy="37" rx="17" ry="20" fill="#6B7280" />
            <ellipse cx="50" cy="95" rx="35" ry="28" fill="#6B7280" />
        </svg>
    );
}

function UserAvatar({ size = "md", src }: { size?: "sm" | "md"; src?: string | null }) {
    const sz = size === "md" ? "w-9 h-9" : "w-8 h-8";
    const imgSrc = src ? (src.startsWith("http") ? src : src.startsWith("/uploads") ? src : `/uploads/${src}`) : null;
    return (
        <div className={`${sz} rounded-full overflow-hidden shrink-0 relative`}>
            <DefaultAvatarSvg />
            {imgSrc && (
                <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
        </div>
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

const ROLES: { value: CreateAdminInput["role"]; label: string }[] = [
    { value: "class_officer",   label: "Class Officer" },
    { value: "program_officer", label: "Program Officer" },
    { value: "program_head",    label: "Program Head" },
    { value: "signatory",       label: "Signatory" },
    { value: "dean",            label: "Dean" },
];

const DEPARTMENTS = [
    { id: 1, name: "Computer Engineering" },
    { id: 2, name: "Civil Engineering" },
    { id: 3, name: "Electronics Engineering" },
    { id: 4, name: "Electrical Engineering" },
    { id: 5, name: "Mechanical Engineering" },
];

const COLLEGES = [
    { id: 6, name: "Engineering" },
];

const BLANK: CreateAdminInput = {
    firstName: "", lastName: "", email: "", password: "",
    role: "eso_officer", programId: null, yearLevel: null, section: null, position: "",
};

type AdminSortKey = "name" | "program" | "year_level" | "section" | "role";

const AdminSettings = () => {
    const { accessToken, user, changePassword } = useAuth();
    const { darkMode, setDarkMode, notificationsEnabled, setNotificationsEnabled } = useTheme();
    const isSysAdmin = user?.role === "system_admin";

    // ── Profile state ──────────────────────────────────────────────────────────
    const [profile,       setProfile]       = useState<AdminProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileErr,    setProfileErr]    = useState("");
    const [firstName,     setFirstName]     = useState("");
    const [lastName,      setLastName]      = useState("");
    const [position,      setPosition]      = useState("");
    const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [clearAvatar,   setClearAvatar]   = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const avatarMenuRef  = useRef<HTMLDivElement>(null);

    const [saving,     setSaving]     = useState(false);
    const [saveMsg,    setSaveMsg]    = useState("");
    const [saveErr,    setSaveErr]    = useState("");
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Change Password state ──────────────────────────────────────────────────
    const BLANK_PW = { current: "", next: "", confirm: "" };
    const [pw,        setPw]        = useState(BLANK_PW);
    const [pwError,   setPwError]   = useState("");
    const [pwSuccess, setPwSuccess] = useState("");
    const [pwSaving,  setPwSaving]  = useState(false);

    // ── Accounts state (system_admin only) ────────────────────────────────────
    const [admins,             setAdmins]             = useState<AdminUserItem[]>([]);
    const [loadingAdmins,      setLoadingAdmins]      = useState(true);
    const [form,               setForm]               = useState<CreateAdminInput>(BLANK);
    const [formSaving,         setFormSaving]         = useState(false);
    const [formError,          setFormError]          = useState("");
    const [successMsg,         setSuccessMsg]         = useState("");
    const [deleteTarget,       setDeleteTarget]       = useState<AdminUserItem | null>(null);
    const [permDeleteTarget,   setPermDeleteTarget]   = useState<AdminUserItem | null>(null);
    const [deleting,           setDeleting]           = useState(false);
    const [deleteErr,          setDeleteErr]          = useState("");
    const [permDeletePassword, setPermDeletePassword] = useState("");
    const [togglingId,         setTogglingId]         = useState<number | null>(null);
    const [showForm,           setShowForm]           = useState(false);
    const [accountTab,         setAccountTab]         = useState<"active" | "archived">("active");
    const [alertMsg,           setAlertMsg]           = useState<string | null>(null);
    const [adminSearch,        setAdminSearch]        = useState("");
    const [roleFilter,         setRoleFilter]         = useState("all");
    const [adminSortKey,       setAdminSortKey]       = useState<AdminSortKey>("name");
    const [showAdminFilters,   setShowAdminFilters]   = useState(false);
    const adminFilterRef = useRef<HTMLDivElement>(null);

    const activeAdmins   = admins.filter(a => a.status === "active");
    const archivedAdmins = admins.filter(a => a.status !== "active");

    // ── Load profile ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!accessToken) return;
        adminProfileService.getProfile(accessToken)
            .then(p => {
                setProfile(p);
                setFirstName(p.firstName);
                setLastName(p.lastName);
                setPosition(p.position ?? "");
                if (p.avatarPath) setAvatarPreview(adminAvatarUrl(p.avatarPath));
            })
            .catch(e => setProfileErr(e.message))
            .finally(() => setProfileLoading(false));
    }, [accessToken]);

    // ── Load admins (system_admin only) ────────────────────────────────────────
    useEffect(() => {
        if (!accessToken || !isSysAdmin) { setLoadingAdmins(false); return; }
        userService.getAdmins(accessToken)
            .then(setAdmins)
            .catch(() => {})
            .finally(() => setLoadingAdmins(false));
    }, [accessToken, isSysAdmin]);

    // ── Close avatar menu on outside click ────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node))
                setAvatarMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (adminFilterRef.current && !adminFilterRef.current.contains(e.target as Node))
                setShowAdminFilters(false);
        }
        if (showAdminFilters) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAdminFilters]);

    // ── Save profile ───────────────────────────────────────────────────────────
    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        if (!accessToken) return;
        setSaveErr(""); setSaveMsg("");
        if (!firstName.trim() || !lastName.trim()) { setSaveErr("First and last name are required."); return; }
        setSaving(true);
        try {
            const updated = await adminProfileService.updateProfile(
                accessToken,
                { firstName: firstName.trim(), lastName: lastName.trim(), position: position.trim(), clearAvatar },
                avatarFile
            );
            setProfile(updated);
            setAvatarFile(null);
            setClearAvatar(false);
            if (updated.avatarPath) setAvatarPreview(adminAvatarUrl(updated.avatarPath));
            else if (clearAvatar) setAvatarPreview(null);
            setSaveMsg("Profile updated successfully.");
            setToastVisible(true);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
        } catch (err: any) {
            setSaveErr(err.message ?? "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    }

    // ── Change Password ────────────────────────────────────────────────────────
    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setPwError(""); setPwSuccess("");
        if (!pw.current)            { setPwError("Enter your current password."); return; }
        if (pw.next.length < 8)     { setPwError("New password must be at least 8 characters."); return; }
        if (pw.next !== pw.confirm) { setPwError("New passwords do not match."); return; }
        setPwSaving(true);
        try {
            await changePassword(pw.current, pw.next);
            setPwSuccess("Password changed successfully.");
            setPw(BLANK_PW);
        } catch (err: any) {
            setPwError(err.message ?? "Failed to change password.");
        } finally {
            setPwSaving(false);
        }
    }

    // ── Accounts handlers ──────────────────────────────────────────────────────
    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!accessToken) return;
        setFormError(""); setSuccessMsg("");
        if (!form.firstName.trim() || !form.lastName.trim()) { setFormError("First and last name are required."); return; }
        if (!form.email.trim())       { setFormError("Email is required."); return; }
        if (form.password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
        if (!form.position.trim())    { setFormError("Position is required."); return; }
        setFormSaving(true);
        try {
            const created = await userService.createAdmin(accessToken, form);
            setAdmins(prev => [created, ...prev]);
            setForm(BLANK);
            setShowForm(false);
            setSuccessMsg(`Account for ${created.firstName} ${created.lastName} created successfully.`);
        } catch (err: any) {
            setFormError(err.message ?? "Failed to create account.");
        } finally {
            setFormSaving(false);
        }
    }

    async function handleToggle(admin: AdminUserItem) {
        if (!accessToken) return;
        setTogglingId(admin.userId);
        try {
            const result = await userService.toggleAdmin(accessToken, admin.userId);
            setAdmins(prev => prev.map(a => a.userId === admin.userId ? { ...a, status: result.status } : a));
        } catch (err: any) {
            setAlertMsg(err.message ?? "Failed to toggle status.");
        } finally {
            setTogglingId(null);
        }
    }

    async function confirmArchive() {
        if (!deleteTarget || !accessToken) return;
        setDeleting(true); setDeleteErr("");
        try {
            const result = await userService.toggleAdmin(accessToken, deleteTarget.userId);
            setAdmins(prev => prev.map(a =>
                a.userId === deleteTarget.userId ? { ...a, status: result.status } : a
            ));
            setDeleteTarget(null);
        } catch (err: any) {
            setDeleteErr(err.message ?? "Failed to archive account.");
        } finally {
            setDeleting(false);
        }
    }

    async function confirmPermanentDelete() {
        if (!permDeleteTarget || !accessToken) return;
        setDeleting(true); setDeleteErr("");
        try {
            await authService.verifyPassword(accessToken, permDeletePassword);
            await userService.deleteAdmin(accessToken, permDeleteTarget.userId);
            setAdmins(prev => prev.filter(a => a.userId !== permDeleteTarget.userId));
            setPermDeleteTarget(null);
            setPermDeletePassword("");
        } catch (err: any) {
            setDeleteErr(err.message ?? "Failed to delete.");
        } finally {
            setDeleting(false);
        }
    }

    function filterAdmins(list: AdminUserItem[]) {
        let result = list;
        if (adminSearch.trim()) {
            const q = adminSearch.toLowerCase();
            result = result.filter(a =>
                `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q) ||
                (a.programName ?? "").toLowerCase().includes(q)
            );
        }
        if (roleFilter !== "all") {
            result = result.filter(a => a.roleLabel?.toLowerCase().replace(/\s/g, "_") === roleFilter || a.roleLabel === roleFilter);
        }
        if (adminSortKey === "name")    result = [...result].sort((a, b) => a.lastName.localeCompare(b.lastName));
        if (adminSortKey === "program") result = [...result].sort((a, b) => (a.programName ?? "").localeCompare(b.programName ?? ""));
        if (adminSortKey === "role")    result = [...result].sort((a, b) => (a.roleLabel ?? "").localeCompare(b.roleLabel ?? ""));
        return result;
    }

    const filteredActiveAdmins   = filterAdmins(activeAdmins);
    const filteredArchivedAdmins = filterAdmins(archivedAdmins);
    const activeAdminFilterCount = [adminSearch.trim() !== "", roleFilter !== "all", adminSortKey !== "name"].filter(Boolean).length;

    const inputCls  = "rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 focus:border-orange-400";
    const selectCls = inputCls;

    const isDean         = form.role === "dean";
    const programOptions = isDean ? COLLEGES : DEPARTMENTS;

    const thCls    = "px-4 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide";
    const thCtrCls = "px-4 py-2 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide";

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-[#111111] min-h-screen">
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg(null)} />}
            <datalist id="officer-positions">
                <option value="ESO President" />
                <option value="ESO Vice President" />
                <option value="ESO Secretary" />
                <option value="ESO Treasurer" />
                <option value="ESO Auditor" />
                <option value="ESO Public Relations Officer" />
                <option value="ESO Business Manager" />
                <option value="ESO Peace Officer" />
                <option value="ESO Sergeant-at-Arms" />
                <option value="ESO Historian" />
                <option value="Class President" />
                <option value="Class Vice President" />
                <option value="Class Secretary" />
                <option value="Class Treasurer" />
                <option value="Class Auditor" />
                <option value="Program Head" />
                <option value="Dean" />
                <option value="Faculty Adviser" />
                <option value="ESO Officer" />
            </datalist>

            {/* ── Toast ── */}
            {toastVisible && (
                <div className="fixed top-5 inset-x-0 flex justify-center z-[100] pointer-events-none px-4">
                    <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white dark:bg-[#1e1e1e] shadow-[0_12px_48px_rgba(0,0,0,0.22)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.75)] w-max max-w-[calc(100vw-2rem)]">
                        <FiCheck className="w-4 h-4 text-green-500 shrink-0" />
                        <p className="text-sm font-semibold text-gray-800 dark:text-white whitespace-nowrap">{saveMsg}</p>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Manage your profile and account preferences</p>
            </div>

            <div className="flex flex-col gap-6 w-full">

                {/* ── PROFILE CARD ──────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.13)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-4 sm:p-6 w-full">
                    <div className="flex items-center gap-2 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                        <FiUser className="w-4 h-4 text-orange-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base">My Profile</h2>
                    </div>

                    {profileErr && <p className="text-red-500 text-sm mb-4">{profileErr}</p>}

                    {profileLoading ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent" />
                            Loading profile...
                        </div>
                    ) : profile && (
                        <form onSubmit={handleSaveProfile}>
                            {/* Avatar row */}
                            <div className="flex items-center gap-4 sm:gap-5 mb-5 sm:mb-6">
                                <div className="relative shrink-0" ref={avatarMenuRef}>
                                    <div className="w-20 h-20 rounded-full overflow-hidden relative">
                                        <DefaultAvatarSvg />
                                        {avatarPreview && (
                                            <img src={avatarPreview} alt="Profile" className="absolute inset-0 w-full h-full object-cover"
                                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMenuOpen(o => !o)}
                                        className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
                                        title="Edit profile picture"
                                    >
                                        <FiEdit2 className="w-3 h-3" />
                                    </button>
                                    {avatarMenuOpen && (
                                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden min-w-[170px]">
                                            <button
                                                type="button"
                                                onClick={() => { avatarInputRef.current?.click(); setAvatarMenuOpen(false); }}
                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                                <FiUpload className="w-4 h-4 text-orange-500" />
                                                Upload Photo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setAvatarFile(null); setAvatarPreview(null); setClearAvatar(true); setAvatarMenuOpen(false); }}
                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition border-t border-gray-100 dark:border-gray-700">
                                                <FiRefreshCw className="w-4 h-4 text-gray-400" />
                                                Reset to Default
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0] ?? null;
                                            setAvatarFile(file);
                                            setClearAvatar(false);
                                            if (file) setAvatarPreview(URL.createObjectURL(file));
                                            e.target.value = "";
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-base sm:text-xl">{firstName} {lastName}</p>
                                    <p className="text-sm text-orange-500 font-medium mt-0.5">{profile.roleLabel}</p>
                                    {profile.programName && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{profile.programName}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                                <Field label="First Name">
                                    <input
                                        className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="First name"
                                    />
                                </Field>
                                <Field label="Last Name">
                                    <input
                                        className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder="Last name"
                                    />
                                </Field>
                                <Field label="Position">
                                    <input
                                        list="officer-positions"
                                        className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                        value={position}
                                        onChange={e => setPosition(e.target.value)}
                                        placeholder="e.g. ESO President"
                                        autoComplete="off"
                                    />
                                </Field>
                                <Field label="Email">
                                    <div className="border-2 border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-500">
                                        {profile.email}
                                    </div>
                                </Field>
                                <Field label="Role">
                                    <div className="border-2 border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-500 font-medium">
                                        {profile.roleLabel}
                                    </div>
                                </Field>
                                {profile.programName && (
                                    <Field label="Program">
                                        <div className="border-2 border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-500 font-medium">
                                            {profile.programName}
                                        </div>
                                    </Field>
                                )}
                                <Field label="Email">
                                    <div className="border-2 border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm bg-gray-50 dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-500 font-mono text-xs">
                                        {profile.email}
                                    </div>
                                </Field>
                            </div>

                            {saveErr && <p className="text-red-500 text-sm mb-3">{saveErr}</p>}

                            <div className="flex justify-end">
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-xs sm:text-sm">
                                    <FiSave className="w-4 h-4" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* ── CHANGE PASSWORD CARD ──────────────────────────────────── */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.13)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-4 sm:p-6 w-full">
                    <div className="flex items-center gap-2 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                        <FiLock className="w-4 h-4 text-orange-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base">Change Password</h2>
                    </div>
                    <p className="text-xs text-gray-400 mb-5">Leave these blank if you do not want to change your password.</p>

                    <form onSubmit={handleChangePassword}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                            <Field label="Current Password">
                                <input
                                    type="password"
                                    className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                    value={pw.current}
                                    onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                                    placeholder="Current password"
                                />
                            </Field>
                            <Field label="New Password">
                                <input
                                    type="password"
                                    className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                    value={pw.next}
                                    onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                                    placeholder="Min. 8 characters"
                                />
                            </Field>
                            <Field label="Confirm New Password">
                                <input
                                    type="password"
                                    className="border-2 border-gray-300 dark:border-[#3a3a3a] focus:border-orange-400 focus:outline-none rounded-lg px-3 py-2 sm:py-2.5 w-full text-xs sm:text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-[#252525]"
                                    value={pw.confirm}
                                    onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                                    placeholder="Confirm new password"
                                />
                            </Field>
                        </div>

                        {pwError   && <p className="text-red-500 text-sm mb-3">{pwError}</p>}
                        {pwSuccess && <p className="text-green-500 text-sm mb-3">{pwSuccess}</p>}

                        <div className="flex justify-end">
                            <button type="submit" disabled={pwSaving}
                                className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-xs sm:text-sm">
                                <FiLock className="w-4 h-4" />
                                {pwSaving ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── ADMIN ACCOUNTS (system_admin only) ───────────────────── */}
                {isSysAdmin && (
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.13)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-4 sm:p-6 w-full">
                        {successMsg && (
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm mb-4 bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2.5">
                                <FiCheck className="w-4 h-4 flex-shrink-0" />
                                {successMsg}
                            </div>
                        )}
                        {/* Card header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b-2 border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl">
                                <button
                                    onClick={() => setAccountTab("active")}
                                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                        accountTab === "active" ? "bg-white dark:bg-[#111111] text-orange-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}>
                                    <FiUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Accounts
                                    {activeAdmins.length > 0 && (
                                        <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeAdmins.length}</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setAccountTab("archived")}
                                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                        accountTab === "archived" ? "bg-white dark:bg-[#111111] text-orange-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}>
                                    <FiArchive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Archived
                                    {archivedAdmins.length > 0 && (
                                        <span className="bg-gray-400 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{archivedAdmins.length}</span>
                                    )}
                                </button>
                            </div>
                            {accountTab === "active" && (
                                <button
                                    onClick={() => { setShowForm(true); setFormError(""); setSuccessMsg(""); setForm(BLANK); }}
                                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-primary text-white text-xs sm:text-sm font-medium hover:bg-orange-600 transition shadow-sm">
                                    <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Create Admin Account</span>
                                    <span className="sm:hidden">New Admin</span>
                                </button>
                            )}
                        </div>

                        {/* Search + Filter */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="relative flex-1 max-w-sm">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="text" placeholder="Search by name, email, or program..."
                                    value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                                    className="rounded-xl pl-9 pr-3 py-2 text-sm w-full shadow-sm focus:outline-none border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
                            </div>
                            <div className="relative" ref={adminFilterRef}>
                                <button onClick={() => setShowAdminFilters(f => !f)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition shrink-0 shadow-sm bg-orange-500 text-white hover:bg-orange-600">
                                    <FiFilter className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sort &amp; Filter</span>
                                    {activeAdminFilterCount > 0 && (
                                        <span className="bg-white text-orange-600 text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{activeAdminFilterCount}</span>
                                    )}
                                    {showAdminFilters ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                                </button>
                                {showAdminFilters && (
                                    <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 p-4 w-64 flex flex-col gap-3">
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sort &amp; Filter</p>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sort by</label>
                                            <select value={adminSortKey} onChange={e => setAdminSortKey(e.target.value as AdminSortKey)}
                                                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-gray-100">
                                                <option value="name">Name (A–Z)</option>
                                                <option value="program">Program</option>
                                                <option value="role">Role</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Role</label>
                                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-gray-100">
                                                <option value="all">All Roles</option>
                                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                        </div>
                                        {activeAdminFilterCount > 0 && (
                                            <button onClick={() => { setAdminSearch(""); setRoleFilter("all"); setAdminSortKey("name"); }}
                                                className="w-full text-xs text-red-500 hover:text-red-600 font-semibold py-1.5 border border-red-200 rounded-xl hover:bg-red-50 transition">
                                                Clear all filters
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="hidden sm:flex items-center text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-[#2a2a2a] px-2.5 py-2 rounded-xl whitespace-nowrap shadow-sm">
                                {accountTab === "active" ? filteredActiveAdmins.length : filteredArchivedAdmins.length} result{(accountTab === "active" ? filteredActiveAdmins.length : filteredArchivedAdmins.length) !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Active tab */}
                        {accountTab === "active" && (loadingAdmins ? (
                            <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent"/>
                                Loading accounts...
                            </div>
                        ) : activeAdmins.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium text-gray-500">No active admin accounts</p>
                                <p className="text-sm mt-1">Create the first admin account to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                                <table className="eso-table w-full min-w-[1100px] text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#222]">
                                            <th className={thCls}>Name</th>
                                            <th className={thCls}>Email</th>
                                            <th className={thCls}>Role</th>
                                            <th className={thCls}>Program / Dept</th>
                                            <th className={thCls}>Position</th>
                                            <th className={thCtrCls}>Status</th>
                                            <th className={thCtrCls}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredActiveAdmins.map((a, i) => (
                                            <tr key={a.userId}
                                                style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                className={`hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors ${i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-gray-50/70 dark:bg-[#222]"}`}>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar size="sm" src={a.avatarPath} />
                                                        <span className="font-medium text-gray-800 dark:text-gray-100 text-xs">{a.lastName}, {a.firstName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{a.email}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className="px-2.5 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold whitespace-nowrap">{a.roleLabel}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{a.programName ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{a.position ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white/70"/>Active
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleToggle(a)} disabled={togglingId === a.userId}
                                                            className="px-3 py-1.5 text-xs rounded-lg font-semibold transition disabled:opacity-50 bg-yellow-500 text-white hover:bg-yellow-600">
                                                            {togglingId === a.userId ? "..." : "Deactivate"}
                                                        </button>
                                                        <button onClick={() => { setDeleteTarget(a); setDeleteErr(""); }}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        {/* Archived tab */}
                        {accountTab === "archived" && (
                            archivedAdmins.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <FiArchive className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No archived accounts yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                                    <table className="eso-table w-full min-w-[1000px] text-xs">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-[#222]">
                                                <th className={thCls}>Name</th>
                                                <th className={thCls}>Email</th>
                                                <th className={thCls}>Role</th>
                                                <th className={thCls}>Program / Dept</th>
                                                <th className={thCls}>Position</th>
                                                <th className={thCtrCls}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredArchivedAdmins.map((a, i) => (
                                                <tr key={a.userId}
                                                    style={{ animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.05}s` }}
                                                    className={`transition-colors ${i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-gray-50/70 dark:bg-[#222]"}`}>
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <UserAvatar size="sm" src={a.avatarPath} />
                                                            <span className="font-medium text-gray-500 dark:text-gray-400 text-xs">{a.lastName}, {a.firstName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500 text-xs">{a.email}</td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap">{a.roleLabel}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500 text-xs">{a.programName ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                    <td className="px-3 py-2.5 text-gray-400 dark:text-gray-500 text-xs">{a.position ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleToggle(a)} disabled={togglingId === a.userId}
                                                                className="px-3 py-1.5 text-xs rounded-lg font-semibold transition disabled:opacity-50 bg-green-600 text-white hover:bg-green-700">
                                                                {togglingId === a.userId ? "..." : "Activate"}
                                                            </button>
                                                            <button onClick={() => { setPermDeleteTarget(a); setPermDeletePassword(""); setDeleteErr(""); }}
                                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                                <FiTrash2 className="w-4 h-4" />
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
                    </div>
                )}

                {/* ── APPEARANCE ───────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.13)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-4 sm:p-5 w-full">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Appearance</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Switch between light and dark mode</p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={darkMode}
                            onClick={() => setDarkMode(!darkMode)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                                ${darkMode ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300
                                ${darkMode ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>

                {/* ── NOTIFICATIONS ─────────────────────────────────────────── */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.13)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-4 sm:p-5 w-full">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Notifications</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Enable or disable in-app notifications</p>
                        </div>
                        <button
                            role="switch"
                            aria-checked={notificationsEnabled}
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                                ${notificationsEnabled ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300
                                ${notificationsEnabled ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>

            </div>

            {/* ── CREATE ADMIN MODAL ──────────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                        <div className="flex items-center justify-between mb-4 sm:mb-5 border-b-2 border-gray-200 dark:border-gray-700 pb-3">
                            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base sm:text-lg">Create Admin Account</h2>
                            <button onClick={() => { setShowForm(false); setFormError(""); setForm(BLANK); }}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                        </div>

                        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                                    <input className={inputCls}
                                        value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                                    <input className={inputCls}
                                        value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dela Cruz" />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                    <input type="email" className={inputCls}
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="officer@eso.edu.ph" />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                                    <input type="password" className={inputCls}
                                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                                    <select className={selectCls}
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value as CreateAdminInput["role"], programId: null, yearLevel: null, section: null })}>
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program</label>
                                    <select className={selectCls}
                                        value={form.programId ?? ""}
                                        onChange={e => setForm({ ...form, programId: e.target.value ? Number(e.target.value) : null })}>
                                        <option value="">None</option>
                                        {programOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                {form.role === "class_officer" && (
                                    <>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Level</label>
                                            <select className={selectCls}
                                                value={form.yearLevel ?? ""}
                                                onChange={e => setForm({ ...form, yearLevel: e.target.value ? Number(e.target.value) : null })}>
                                                <option value="">— select year —</option>
                                                <option value="1">1st Year</option>
                                                <option value="2">2nd Year</option>
                                                <option value="3">3rd Year</option>
                                                <option value="4">4th Year</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                                            <input className={inputCls}
                                                value={form.section ?? ""}
                                                onChange={e => setForm({ ...form, section: e.target.value || null })}
                                                placeholder="e.g. A" />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position *</label>
                                    <input list="officer-positions" className={inputCls}
                                        value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="e.g. ESO President" autoComplete="off" />
                                </div>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button type="button" onClick={() => { setForm(BLANK); setFormError(""); }}
                                    className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-[#333] transition text-xs sm:text-sm">
                                    Reset
                                </button>
                                <button type="submit" disabled={formSaving}
                                    className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-xs sm:text-sm">
                                    {formSaving ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── ARCHIVE CONFIRMATION ─────────────────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-4 sm:p-6">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg mb-2">Archive Admin Account</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This will deactivate and archive the account for:</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{deleteTarget.firstName} {deleteTarget.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{deleteTarget.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{deleteTarget.roleLabel}</p>
                        <p className="text-xs text-yellow-600 mb-4">The account will be moved to the Archived section. You can re-activate or permanently delete it from there.</p>
                        {deleteErr && <p className="text-red-500 text-sm mb-3">{deleteErr}</p>}
                        <div className="flex justify-between gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-300 dark:hover:bg-[#333]">
                                Cancel
                            </button>
                            <button onClick={confirmArchive} disabled={deleting}
                                className="px-5 py-2.5 rounded-xl bg-yellow-500 text-white font-semibold text-sm hover:bg-yellow-600 disabled:opacity-60">
                                {deleting ? "Archiving..." : "Yes, Archive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PERMANENT DELETE CONFIRMATION ──────────────────────────────── */}
            {permDeleteTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-md p-4 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg">Permanently Delete Account</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#222] rounded-xl p-3 mb-4">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{permDeleteTarget.firstName} {permDeleteTarget.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{permDeleteTarget.email}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{permDeleteTarget.roleLabel}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Enter your password to confirm deletion:</p>
                        <input
                            type="password"
                            value={permDeletePassword}
                            onChange={e => setPermDeletePassword(e.target.value)}
                            placeholder="Your password"
                            className="rounded-xl px-3 py-2 w-full text-sm mb-4 focus:outline-none border-2 border-gray-300 dark:border-gray-600 focus:border-red-400 bg-white dark:bg-[#2a2a2a] text-gray-800 dark:text-gray-100"
                        />
                        {deleteErr && <p className="text-red-500 text-sm mb-3">{deleteErr}</p>}
                        <div className="flex justify-between gap-3">
                            <button onClick={() => { setPermDeleteTarget(null); setPermDeletePassword(""); setDeleteErr(""); }}
                                className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-300 dark:hover:bg-[#333]">
                                Cancel
                            </button>
                            <button onClick={confirmPermanentDelete} disabled={deleting || !permDeletePassword}
                                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition">
                                {deleting ? "Verifying..." : "Yes, Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
