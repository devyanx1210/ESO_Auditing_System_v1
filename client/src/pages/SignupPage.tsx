import React, { useState } from "react";
import { IoArrowBackOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface SignupProps {
    onCancel: () => void;
}

const DEPARTMENTS = [
    { id: 1, code: "CpE", name: "Computer Engineering" },
    { id: 2, code: "CE",  name: "Civil Engineering" },
    { id: 3, code: "ECE", name: "Electronics Engineering" },
    { id: 4, code: "EE",  name: "Electrical Engineering" },
    { id: 5, code: "ME",  name: "Mechanical Engineering" },
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
        firstName: "",
        lastName: "",
        middleName: "",
        email: "",
        studentNo: "",
        programId: "",
        yearLevel: "",
        section: "",
        password: "",
        retypePassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showRetype, setShowRetype]     = useState(false);
    const [error, setError]               = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.firstName || !form.lastName || !form.email || !form.studentNo) {
            setError("Please fill in all required fields.");
            return;
        }
        if (!form.programId || !form.yearLevel || !form.section) {
            setError("Please fill in your program, year level, and section.");
            return;
        }
        if (!form.password || !form.retypePassword) {
            setError("Please enter and confirm your password.");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (form.password !== form.retypePassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            await register({
                firstName:    form.firstName.trim(),
                lastName:     form.lastName.trim(),
                middleName:   form.middleName.trim() || undefined,
                email:        form.email.trim(),
                password:     form.password,
                studentNo:    form.studentNo.trim(),
                programId: Number(form.programId),
                yearLevel:    Number(form.yearLevel),
                section:      form.section.trim(),
                schoolYear:   getCurrentSchoolYear(),
                semester:     getCurrentSemester(),
            });
            navigate("/student/dashboard");
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-container w-full h-full flex justify-center items-center">
            <div
                className="relative w-[700px] bg-black/50 backdrop-blur-md rounded-xl p-6 text-white flex flex-col gap-4"
                style={{ maxHeight: "600px" }}
            >
                {/* Back Button */}
                <button
                    className="absolute top-4 right-4 text-white hover:text-orange-400"
                    onClick={onCancel}
                >
                    <IoArrowBackOutline size={24} />
                </button>

                <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-center">Sign Up</h2>

                <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4 overflow-y-auto">

                    {/* First & Last Name */}
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-1 flex flex-col">
                            <label className="mb-1 text-sm">First Name *</label>
                            <input
                                required
                                type="text"
                                placeholder="Enter your first name"
                                value={form.firstName}
                                onChange={e => handleChange("firstName", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="mb-1 text-sm">Last Name *</label>
                            <input
                                required
                                type="text"
                                placeholder="Enter your last name"
                                value={form.lastName}
                                onChange={e => handleChange("lastName", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            />
                        </div>
                    </div>

                    {/* Middle Name */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm">Middle Name (optional)</label>
                        <input
                            type="text"
                            placeholder="Enter your middle name"
                            value={form.middleName}
                            onChange={e => handleChange("middleName", e.target.value)}
                            className="w-full rounded-md p-3 text-black"
                        />
                    </div>

                    {/* Email & Student Number */}
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-1 flex flex-col">
                            <label className="mb-1 text-sm">Email *</label>
                            <input
                                required
                                type="email"
                                placeholder="Enter email"
                                value={form.email}
                                onChange={e => handleChange("email", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="mb-1 text-sm">Student Number *</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. 2021-00001"
                                value={form.studentNo}
                                onChange={e => handleChange("studentNo", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            />
                        </div>
                    </div>

                    {/* Program */}
                    <div className="flex flex-col">
                        <label className="mb-1 text-sm">Program *</label>
                        <select
                            required
                            value={form.programId}
                            onChange={e => handleChange("programId", e.target.value)}
                            className="w-full rounded-md p-3 text-black"
                        >
                            <option value="">Select Program</option>
                            {DEPARTMENTS.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Year Level & Section */}
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-1 flex flex-col">
                            <label className="mb-1 text-sm">Year Level *</label>
                            <select
                                required
                                value={form.yearLevel}
                                onChange={e => handleChange("yearLevel", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            >
                                <option value="">Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <label className="mb-1 text-sm">Section *</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. A, B"
                                value={form.section}
                                onChange={e => handleChange("section", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            />
                        </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="flex-1 flex flex-col relative">
                            <label className="mb-1 text-sm">Password *</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
                                value={form.password}
                                onChange={e => handleChange("password", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-[38px] text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col relative">
                            <label className="mb-1 text-sm">Confirm Password *</label>
                            <input
                                type={showRetype ? "text" : "password"}
                                placeholder="Retype password"
                                autoComplete="new-password"
                                value={form.retypePassword}
                                onChange={e => handleChange("retypePassword", e.target.value)}
                                className="w-full rounded-md p-3 text-black"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-[38px] text-gray-600"
                                onClick={() => setShowRetype(!showRetype)}
                            >
                                {showRetype ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-md bg-primary p-3 font-bold hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}

                <p className="text-sm text-center mt-2">
                    Already have an account?{" "}
                    <span className="cursor-pointer text-primary" onClick={onCancel}>
                        Sign in here
                    </span>
                </p>
            </div>
        </div>
    );
}
