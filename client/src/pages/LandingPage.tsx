import { useState, useReducer, useEffect } from "react";
import "../../styles/index.css";
import Signup from "./SignupPage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

import logo from "../assets/ESO_Logo.png";
import MarSU_BG from "../assets/MarSU_BG.png";

interface SigninState { email: string; password: string; }
export type FormAction =
    | { type: "SIGNIN_CHANGE"; field: keyof SigninState; value: string }
    | { type: "RESET_SIGNIN" };

const initialState: SigninState = { email: "", password: "" };

function signinReducer(state: SigninState, action: FormAction): SigninState {
    switch (action.type) {
        case "SIGNIN_CHANGE": return { ...state, [action.field]: action.value };
        case "RESET_SIGNIN":  return initialState;
        default:              return state;
    }
}

const LandingPage = () => {
    const [showSignup,   setShowSignup]   = useState(false);
    const [state,        dispatch]        = useReducer(signinReducer, initialState);
    const [signinError,  setSigninError]  = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading,      setLoading]      = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSigninSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSigninError("");
        const { email, password } = state;
        if (!email || !password) { setSigninError("Please enter both email and password."); return; }
        setIsSubmitting(true);
        try {
            const user = await login({ email, password });
            dispatch({ type: "RESET_SIGNIN" });
            if (user.role === "student")       navigate("/student/dashboard");
            else if (user.role === "system_admin") navigate("/sysadmin/home");
            else                                navigate("/dashboard/home");
        } catch (error) {
            setSigninError(error instanceof Error ? error.message : "Login failed. Please try again.");
        } finally {
            setIsSubmitting(false);
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

            <header className="landing-header relative z-10 flex h-[72px] w-full items-center justify-between px-6 text-white"
                style={{ background: "linear-gradient(to right, #fbbf24, #f97316, #ea580c)" }}>
                <div className="flex items-center gap-3">
                    <img src={logo} alt="ESO Logo" className="h-10 w-10 object-contain drop-shadow" />
                    <div className="leading-tight">
                        <div className="font-bold text-[clamp(13px,1.4vw,18px)] tracking-wide">
                            Marinduque State University
                        </div>
                        <div className="text-white/80 text-[10px] tracking-widest uppercase font-medium hidden sm:block">
                            College of Engineering &nbsp;·&nbsp; Engineering Student Organization
                        </div>
                    </div>
                </div>
                <a
                    href="https://www.marsu.edu.ph"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-[clamp(12px,1.2vw,15px)] text-white/90 hover:text-white
                        border border-white/30 hover:border-white px-4 py-1.5 rounded-full transition-all"
                >
                    More Info
                </a>
            </header>
            {/* Accent line under header */}
            <div className="relative z-10 h-[3px]"
                style={{ background: "linear-gradient(to right, #fbbf24, #ea580c, #9a3412)" }} />

            <main className="landing-main relative z-10 flex min-h-[calc(100vh-75px)] overflow-y-auto
                flex-col items-center justify-center gap-4 py-8 px-4
                md:flex-row md:items-center md:justify-start md:gap-0 md:py-0">

                {/* Logo */}
                <div className="flex items-center justify-center md:w-[50%]">
                    <img
                        src={logo}
                        alt="Logo"
                        className="object-contain md:translate-x-6"
                        style={{
                            width: "clamp(150px,22vw,280px)",
                            height: "clamp(150px,22vw,280px)",
                        }}
                    />
                </div>

                {/* Form area */}
                <div className="w-full max-w-sm flex flex-col items-center text-center text-white
                    md:w-[80%] md:max-w-none md:items-start md:text-left">

                    {showSignup ? (
                        <Signup onCancel={() => setShowSignup(false)} />
                    ) : (
                        <>
                            <h1 className="mb-5 font-extrabold leading-tight md:leading-snug tracking-tight
                                text-3xl sm:text-4xl md:text-[clamp(32px,4vw,60px)]">
                                Engineering Student
                                <br className="hidden sm:block" />{" "}
                                Organization{" "}
                                <span className="text-orange-400">(ESO)</span>
                                <br />
                                Auditing System
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
                            </form>

                            <p className="mt-3 text-sm">
                                Does not have an account?{" "}
                                <span
                                    className="cursor-pointer text-orange-400 hover:text-orange-300 font-semibold"
                                    onClick={() => setShowSignup(true)}
                                >
                                    Sign up here
                                </span>
                            </p>
                        </>
                    )}
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
