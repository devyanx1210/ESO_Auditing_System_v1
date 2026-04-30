import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import logo from "../assets/ESO_Logo.png";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email,       setEmail]       = useState("");
    const [submitted,   setSubmitted]   = useState(false);
    const [isLoading,   setIsLoading]   = useState(false);
    const [error,       setError]       = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email) { setError("Please enter your email address."); return; }
        setIsLoading(true);
        try {
            await authService.forgotPassword(email.trim());
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="w-full max-w-sm flex flex-col items-center gap-6">
                <img src={logo} alt="ESO Logo" className="w-20 h-20 object-contain" />

                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-4">
                    {!submitted ? (
                        <>
                            <div>
                                <h1 className="text-white font-bold text-xl">Forgot password?</h1>
                                <p className="text-white/50 text-sm mt-1">
                                    Enter your registered email and we'll send you a reset link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                                {error && <p className="text-red-400 text-xs">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 text-sm transition disabled:opacity-60"
                                >
                                    {isLoading ? "Sending…" : "Send Reset Link"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-2">
                            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-white font-bold text-lg">Check your email</h2>
                            <p className="text-white/60 text-sm text-center">
                                If <span className="text-orange-400">{email}</span> is registered, you'll receive a password reset link shortly.
                            </p>
                            <p className="text-white/40 text-xs text-center">
                                Didn't get it? Check your spam folder. The link expires in 1 hour.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => navigate("/")}
                        className="text-xs text-white/40 hover:text-white/70 transition text-center mt-1"
                    >
                        ← Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}
