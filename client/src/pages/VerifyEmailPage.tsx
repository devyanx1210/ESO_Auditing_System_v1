import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import logo from "../assets/ESO_Logo.png";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
    const [params]   = useSearchParams();
    const navigate   = useNavigate();
    const [status, setStatus]   = useState<Status>("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = params.get("token");
        if (!token) { setStatus("error"); setMessage("No verification token found in the link."); return; }
        authService.verifyEmail(token)
            .then(() => setStatus("success"))
            .catch(e  => { setStatus("error"); setMessage(e.message ?? "Verification failed."); });
    }, [params]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="w-full max-w-sm text-center flex flex-col items-center gap-5">
                <img src={logo} alt="ESO Logo" className="w-20 h-20 object-contain" />

                {status === "loading" && (
                    <>
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-orange-500" />
                        <p className="text-white/60 text-sm">Verifying your email…</p>
                    </>
                )}

                {status === "success" && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-white font-bold text-xl">Email verified!</h1>
                        <p className="text-white/60 text-sm">Your account is now active. You can log in.</p>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 text-sm transition"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-white font-bold text-xl">Verification failed</h1>
                        <p className="text-white/60 text-sm">{message}</p>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 text-sm transition"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
