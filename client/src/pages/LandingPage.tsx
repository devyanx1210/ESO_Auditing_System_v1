import { useState, useReducer, useEffect } from "react";
import "../../styles/index.css";
import Signup from "./SignupPage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Assets
import logo from "../assets/ESO_Logo.png";
import MarSU_BG from "../assets/MarSU_BG.png";

/* ================= TYPES ================= */

interface SigninState {
    email: string;
    password: string;
}

export type FormAction =
    | { type: "SIGNIN_CHANGE"; field: keyof SigninState; value: string }
    | { type: "RESET_SIGNIN" };

/* ================= INITIAL STATE ================= */

const initialState: SigninState = { email: "", password: "" };

/* ================= REDUCER ================= */

function signinReducer(state: SigninState, action: FormAction): SigninState {
    switch (action.type) {
        case "SIGNIN_CHANGE":
            return { ...state, [action.field]: action.value };
        case "RESET_SIGNIN":
            return initialState;
        default:
            return state;
    }
}

/* ================= COMPONENT ================= */

const LandingPage = () => {
    const [showSignup, setShowSignup] = useState(false);
    const [state, dispatch] = useReducer(signinReducer, initialState);
    const [signinError, setSigninError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const { login } = useAuth();

    /* ================= LOGIN ================= */

    const handleSigninSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSigninError("");

        const { email, password } = state;

        if (!email || !password) {
            setSigninError("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);
        try {
            const user = await login({ email, password });
            dispatch({ type: "RESET_SIGNIN" });

            if (user.role === "student") {
                navigate("/student/dashboard");
            } else {
                navigate("/dashboard/home");
            }
        } catch (error: any) {
            setSigninError(error.message || "Login failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ================= LOADING ================= */

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    /* ================= RENDER ================= */

    return (
        <div className="landing-page relative h-screen w-screen bg-black overflow-auto">

            <div
                className="landing-bg absolute md:fixed inset-0 bg-cover bg-center z-0 min-h-screen"
                style={{ backgroundImage: `url(${MarSU_BG})` }}
            />

            <div className="landing-overlay absolute md:fixed inset-0 bg-black bg-opacity-60 z-0" />

            <header className="landing-header relative z-10 flex h-[80px] w-full items-center justify-between bg-primary px-6 text-white">
                <div className="font-bold text-[clamp(14px,1.5vw,50px)]">
                    Marinduque State University
                </div>

                <button className="hover:underline text-[clamp(14px,1.5vw,50px)]">
                    More Info
                </button>
            </header>

            <main className="landing-main relative z-10 flex h-[700px] overflow-y-auto flex-col items-center mt-2 md:flex-row px-4">

                <div className="logo-container flex w-[60%] items-center justify-center">
                    <img
                        src={logo}
                        alt="Logo"
                        className="object-contain md:translate-x-6"
                        style={{
                            width: "clamp(130px,28vw,320px)",
                            height: "clamp(130px,28vw,320px)",
                        }}
                    />
                </div>

                <div className="landing-form-container w-[90%] md:w-[80%] flex flex-col text-white">

                    {showSignup ? (
                        <Signup onCancel={() => setShowSignup(false)} />
                    ) : (
                        <>
                            <h1 className="mb-6 font-bold text-[clamp(30px,4vw,70px)] leading-[1.2]">
                                Engineering Student Organization (ESO)
                                <br />
                                Auditing System
                            </h1>

                            <form onSubmit={handleSigninSubmit} className="flex flex-col gap-4">

                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={state.email}
                                    onChange={e =>
                                        dispatch({
                                            type: "SIGNIN_CHANGE",
                                            field: "email",
                                            value: e.target.value,
                                        })
                                    }
                                    className="w-[clamp(280px,30vw,400px)] rounded-md p-3 text-black"
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={state.password}
                                    onChange={e =>
                                        dispatch({
                                            type: "SIGNIN_CHANGE",
                                            field: "password",
                                            value: e.target.value,
                                        })
                                    }
                                    className="w-[clamp(280px,30vw,400px)] rounded-md p-3 text-black"
                                />

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-[clamp(200px,30vw,230px)] rounded-md bg-primary p-3 font-bold hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Logging in..." : "Login"}
                                </button>

                                {signinError && (
                                    <p className="text-red-400 text-sm mt-2">
                                        {signinError}
                                    </p>
                                )}
                            </form>

                            <p className="mt-2 text-sm">
                                Does not have an account?{" "}
                                <span
                                    className="cursor-pointer text-primary"
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
