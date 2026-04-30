import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import logo from "../assets/ESO_Logo.png";

export default function ResetPasswordPage() {
    const [params]  = useSearchParams();
    const navigate  = useNavigate();
    const token     = params.get("token") ?? "";

    const [password,     setPassword]     = useState("");
    const [confirm,      setConfirm]      = useState("");
    const [showPw,       setShowPw]       = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);
    const [error,        setError]        = useState("");
    const [success,      setSuccess]      = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="text-center text-white/60">
                    <p>Invalid or missing reset link.</p>
                    <button onClick={() => navigate("/")} className="mt-4 text-orange-400 underline text-sm">Back to login</button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!password) { setError("Please enter a new password."); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
        if (password !== confirm) { setError("Passwords do not match."); return; }
        setIsLoading(true);
        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Reset failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const inp = "w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm bg-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400";

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="w-full max-w-sm flex flex-col items-center gap-6">
                <img src={logo} alt="ESO Logo" className="w-20 h-20 object-contain" />

                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-4">
                    {!success ? (
                        <>
                            <div>
                                <h1 className="text-white font-bold text-xl">Set new password</h1>
                                <p className="text-white/50 text-sm mt-1">Must be at least 8 characters.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <div className="relative">
                                    <input
                                        type={showPw ? "text" : "password"}
                                        placeholder="New password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className={inp}
                                    />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        {showPw ? <IoEyeOffOutline size={17} /> : <IoEyeOutline size={17} />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        autoComplete="new-password"
                                        className={inp}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        {showConfirm ? <IoEyeOffOutline size={17} /> : <IoEyeOutline size={17} />}
                                    </button>
                                </div>

                                {error && <p className="text-red-400 text-xs">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 text-sm transition disabled:opacity-60"
                                >
                                    {isLoading ? "Resetting…" : "Reset Password"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-2">
                            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-white font-bold text-lg">Password reset!</h2>
                            <p className="text-white/60 text-sm text-center">
                                Your password has been updated. You can now log in with your new password.
                            </p>
                            <button
                                onClick={() => navigate("/")}
                                className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 text-sm transition"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {!success && (
                        <button onClick={() => navigate("/")} className="text-xs text-white/40 hover:text-white/70 transition text-center mt-1">
                            ← Back to login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
