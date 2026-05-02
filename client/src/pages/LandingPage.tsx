import { useState, useReducer, useEffect } from "react";
import "../../styles/index.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/auth.service";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

import logo from "../assets/ESO_Logo.png";
import MarSU_BG from "../assets/CENG_BG.png";

interface SigninState { email: string; password: string; }
export type FormAction =
    | { type: "SIGNIN_CHANGE"; field: keyof SigninState; value: string }
    | { type: "RESET_SIGNIN" };

const initialState: SigninState = { email: "", password: "" };

function signinReducer(state: SigninState, action: FormAction): SigninState {
    switch (action.type) {
        case "SIGNIN_CHANGE": return { ...state, [action.field]: action.value };
        case "RESET_SIGNIN": return initialState;
        default: return state;
    }
}

const LandingPage = () => {
    const [state, dispatch] = useReducer(signinReducer, initialState);
    const [signinError, setSigninError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState("");

    const navigate = useNavigate();
    const { login, user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && user) {
            if (user.role === "student") navigate("/student/dashboard", { replace: true });
            else if (user.role === "system_admin") navigate("/sysadmin/home", { replace: true });
            else navigate("/dashboard/home", { replace: true });
        }
    }, [user, isLoading, navigate]);

    const handleSigninSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSigninError(""); setUnverifiedEmail(null); setResendMsg("");
        const { email, password } = state;
        if (!email)    { setSigninError("Please enter your email address."); return; }
        if (!password) { setSigninError("Please enter your password."); return; }
        setIsSubmitting(true);
        try {
            const user = await login({ email, password });
            dispatch({ type: "RESET_SIGNIN" });
            if (user.role === "student") navigate("/student/dashboard");
            else if (user.role === "system_admin") navigate("/sysadmin/home");
            else navigate("/dashboard/home");
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Login failed. Please try again.";
            if (msg === "EMAIL_NOT_VERIFIED") {
                setUnverifiedEmail(state.email);
            } else {
                setSigninError(msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedEmail || resending) return;
        setResending(true); setResendMsg("");
        try {
            await authService.resendVerification(unverifiedEmail);
            setResendMsg("Verification email sent. Please check your inbox.");
        } catch {
            setResendMsg("Failed to resend. Please try again.");
        } finally {
            setResending(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="landing-page relative min-h-screen w-screen bg-black overflow-x-hidden">

            <div
                className="landing-bg fixed inset-0 bg-cover bg-center z-0"
                style={{ backgroundImage: `url(${MarSU_BG})`, filter: "blur(2px) brightness(0.55)", transform: "scale(1.04)" }}
            />
            <div className="landing-overlay fixed inset-0 bg-black bg-opacity-75 z-0" />
            {/* Subtle orange glow accent */}
            <div className="fixed inset-0 z-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 60% 50% at 18% 8%, rgba(234,88,12,0.18) 0%, transparent 60%)" }} />

            <header className="landing-header fixed top-0 left-0 right-0 z-20 flex min-h-[72px] w-full items-center justify-between px-4 sm:px-6 text-white py-2"
                style={{ background: "linear-gradient(to right, #fbbf24, #f97316, #ea580c)" }}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
                    <div className="leading-snug min-w-0">
                        <div className="font-bold text-xs sm:text-base tracking-wide">
                            Marinduque State University
                        </div>
                        <div className="text-white/80 text-[8px] sm:text-[10px] tracking-wider uppercase font-medium leading-tight">
                            <div>College of Engineering</div>
                            <div>Engineering Student Organization</div>
                        </div>
                    </div>
                </div>
                <a
                    href="https://www.marsu.edu.ph"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-[11px] sm:text-[clamp(12px,1.2vw,15px)] text-white/90 hover:text-white
                        border border-white/30 hover:border-white px-3 sm:px-4 py-1.5 rounded-full transition-all whitespace-nowrap"
                >
                    More Info
                </a>
            </header>
            <main className="landing-main relative z-10 min-h-screen overflow-x-hidden overflow-y-auto pt-[72px]">

                    <div className="flex flex-col items-center justify-center gap-4 py-8 px-4
                        md:flex-row md:items-center md:justify-start md:gap-0 md:py-0 min-h-[calc(100vh-75px)]">

                        {/* Logo */}
                        <div className="flex items-center justify-center md:w-[50%]">
                            <img
                                src={logo}
                                alt="Logo"
                                className="object-contain md:translate-x-6"
                                style={{
                                    width: "clamp(180px,32vw,380px)",
                                    height: "clamp(180px,32vw,380px)",
                                }}
                            />
                        </div>

                        {/* Login form */}
                        <div className="w-full max-w-sm flex flex-col items-center text-center text-white
                            md:w-[50%] md:max-w-none md:items-start md:text-left">

                            <h1 className="mb-5 font-extrabold leading-tight tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                                <span className="block">Engineering Student</span>
                                <span className="block">Organization <span className="text-orange-400">(ESO)</span></span>
                                <span className="block">Auditing System</span>
                            </h1>

                            <form onSubmit={handleSigninSubmit} className="flex flex-col gap-3 w-full max-w-[280px] md:max-w-[300px]">

                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={state.email}
                                    autoComplete="email"
                                    onChange={e =>
                                        dispatch({ type: "SIGNIN_CHANGE", field: "email", value: e.target.value })
                                    }
                                    className="w-full rounded-md px-3 py-2.5 text-sm bg-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />

                                <div className="relative w-full">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={state.password}
                                        autoComplete="current-password"
                                        onChange={e =>
                                            dispatch({ type: "SIGNIN_CHANGE", field: "password", value: e.target.value })
                                        }
                                        className="w-full rounded-md px-3 py-2.5 pr-10 text-sm bg-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <IoEyeOffOutline size={17} /> : <IoEyeOutline size={17} />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-bold hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Logging in..." : "Login"}
                                </button>

                                {signinError && (
                                    <p className="text-red-400 text-sm">{signinError}</p>
                                )}

                                {unverifiedEmail && (
                                    <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-3 py-2.5 text-sm">
                                        <p className="text-orange-300 font-medium mb-1">Email not verified</p>
                                        <p className="text-orange-200/70 text-xs mb-2">
                                            Please check your inbox for the verification link.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleResendVerification}
                                            disabled={resending}
                                            className="text-xs text-orange-400 underline hover:text-orange-300 disabled:opacity-50"
                                        >
                                            {resending ? "Sending..." : "Resend verification email"}
                                        </button>
                                        {resendMsg && <p className="text-xs text-green-400 mt-1">{resendMsg}</p>}
                                    </div>
                                )}
                            </form>

                            <p className="mt-3 text-sm">
                                <span
                                    className="cursor-pointer text-white/50 hover:text-orange-300 transition"
                                    onClick={() => navigate("/forgot-password")}
                                >
                                    Forgot password?
                                </span>
                            </p>
                        </div>
                    </div>
            </main>

            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
