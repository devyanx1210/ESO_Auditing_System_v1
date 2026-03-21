import React, { useState } from "react";
import { IoArrowBackOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface SignupProps { onCancel: () => void; }

const PROGRAMS = [
    { id: 1, name: "Computer Engineering" },
    { id: 2, name: "Civil Engineering" },
    { id: 3, name: "Electronics Engineering" },
    { id: 4, name: "Electrical Engineering" },
    { id: 5, name: "Mechanical Engineering" },
];

function getCurrentSchoolYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getCurrentSemester(): "1st" | "2nd" | "Summer" {
    const month = new Date().getMonth() + 1;
    if (month >= 8 && month <= 12) return "1st";
    if (month >= 1 && month <= 5) return "2nd";
    return "Summer";
}

export default function Signup({ onCancel }: SignupProps) {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [form, setForm] = useState({
        firstName: "", lastName: "", middleName: "",
        email: "", studentNo: "", programId: "",
        yearLevel: "", section: "", password: "", retypePassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showRetype,   setShowRetype]   = useState(false);
    const [error,        setError]        = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const set = (field: keyof typeof form, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.firstName || !form.lastName || !form.email || !form.studentNo) {
            setError("Please fill in all required fields."); return;
        }
        if (!form.programId || !form.yearLevel || !form.section) {
            setError("Please fill in your program, year level, and section."); return;
        }
        if (!form.password || !form.retypePassword) {
            setError("Please enter and confirm your password."); return;
        }
        if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
        if (form.password !== form.retypePassword) { setError("Passwords do not match."); return; }

        setIsSubmitting(true);
        try {
            await register({
                firstName:  form.firstName.trim(),
                lastName:   form.lastName.trim(),
                middleName: form.middleName.trim() || undefined,
                email:      form.email.trim(),
                password:   form.password,
                studentNo:  form.studentNo.trim(),
                programId:  Number(form.programId),
                yearLevel:  Number(form.yearLevel),
                section:    form.section.trim(),
                schoolYear: getCurrentSchoolYear(),
                semester:   getCurrentSemester(),
            });
            sessionStorage.setItem("justSignedUp", "1");
            navigate("/student/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 border-2 border-transparent transition";
    const lbl = "block text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wide mb-1.5";

    return (
        <div className="w-full min-h-full flex items-start justify-center py-4 px-4">
            <div className="w-full max-w-xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl text-white">

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10">
                    <div>
                        <h2 className="font-bold text-base sm:text-lg">Create Account</h2>
                        <p className="text-[10px] sm:text-xs text-white/50 mt-0.5">Student registration</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
                        title="Back to sign in"
                    >
                        <IoArrowBackOutline size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-5 flex flex-col gap-3 sm:gap-4">

                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={lbl}>First Name *</label>
                            <input type="text" placeholder="Juan" value={form.firstName}
                                onChange={e => set("firstName", e.target.value)} className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Last Name *</label>
                            <input type="text" placeholder="Dela Cruz" value={form.lastName}
                                onChange={e => set("lastName", e.target.value)} className={inp} />
                        </div>
                    </div>

                    <div>
                        <label className={lbl}>
                            Middle Name{" "}
                            <span className="normal-case font-normal text-white/40 tracking-normal">(optional)</span>
                        </label>
                        <input type="text" placeholder="Santos" value={form.middleName}
                            onChange={e => set("middleName", e.target.value)} className={inp} />
                    </div>

                    {/* Email & Student No */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={lbl}>Email *</label>
                            <input type="email" placeholder="you@email.com" value={form.email}
                                onChange={e => set("email", e.target.value)}
                                className={inp} autoComplete="email" />
                        </div>
                        <div>
                            <label className={lbl}>Student Number *</label>
                            <input type="text" placeholder="2021-00001" value={form.studentNo}
                                onChange={e => set("studentNo", e.target.value)} className={inp} />
                        </div>
                    </div>

                    {/* Program, Year, Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className={lbl}>Program *</label>
                            <select value={form.programId} onChange={e => set("programId", e.target.value)}
                                className={inp + " cursor-pointer"}>
                                <option value="">Select program</option>
                                {PROGRAMS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={lbl}>Year Level *</label>
                            <select value={form.yearLevel} onChange={e => set("yearLevel", e.target.value)}
                                className={inp + " cursor-pointer"}>
                                <option value="">Year</option>
                                <option value="1">1st</option>
                                <option value="2">2nd</option>
                                <option value="3">3rd</option>
                                <option value="4">4th</option>
                            </select>
                        </div>
                        <div>
                            <label className={lbl}>Section *</label>
                            <input type="text" placeholder="A, B…" value={form.section}
                                onChange={e => set("section", e.target.value)} className={inp} />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={lbl}>Password *</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
                                    autoComplete="new-password" value={form.password}
                                    onChange={e => set("password", e.target.value)}
                                    className={inp + " pr-10"} />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    {showPassword ? <IoEyeOffOutline size={17} /> : <IoEyeOutline size={17} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={lbl}>Confirm Password *</label>
                            <div className="relative">
                                <input type={showRetype ? "text" : "password"} placeholder="Re-enter password"
                                    autoComplete="new-password" value={form.retypePassword}
                                    onChange={e => set("retypePassword", e.target.value)}
                                    className={inp + " pr-10"} />
                                <button type="button" onClick={() => setShowRetype(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    {showRetype ? <IoEyeOffOutline size={17} /> : <IoEyeOutline size={17} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-3.5 py-2.5">
                            <p className="text-red-300 text-xs sm:text-sm">{error}</p>
                        </div>
                    )}

                    <button type="submit" disabled={isSubmitting}
                        className="w-full mt-1 rounded-xl bg-primary py-2.5 sm:py-3 text-sm font-bold text-white hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-900/30 disabled:opacity-60 disabled:cursor-not-allowed">
                        {isSubmitting ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="text-xs sm:text-sm text-center text-white/50 pb-1">
                        Already registered?{" "}
                        <button type="button" onClick={onCancel}
                            className="text-orange-400 font-semibold hover:text-orange-300 transition">
                            Sign in here
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
