import { useEffect, useRef, useState } from "react";

interface Props {
    isReady: boolean;
    onDone: () => void;
}

const MIN_DISPLAY_MS = 1200;

export default function SplashScreen({ isReady, onDone }: Props) {
    const [logoVisible, setLogoVisible] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const minTimeReached = useRef(false);
    const authReady = useRef(false);

    useEffect(() => {
        const show = setTimeout(() => setLogoVisible(true), 80);
        const minTimer = setTimeout(() => {
            minTimeReached.current = true;
            if (authReady.current) startExit();
        }, MIN_DISPLAY_MS);
        return () => { clearTimeout(show); clearTimeout(minTimer); };
    }, []);

    useEffect(() => {
        if (!isReady) return;
        authReady.current = true;
        if (minTimeReached.current) startExit();
    }, [isReady]);

    function startExit() {
        setFadeOut(true);
        setTimeout(onDone, 450);
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-950"
            style={{
                transition: "opacity 450ms ease",
                opacity: fadeOut ? 0 : 1,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    transition: "opacity 600ms ease, transform 600ms ease",
                    opacity: logoVisible ? 1 : 0,
                    transform: logoVisible ? "scale(1)" : "scale(0.72)",
                }}
                className="flex flex-col items-center gap-5"
            >
                <img
                    src="/android-chrome-512x512.png"
                    alt="ESO"
                    className="w-24 h-24 rounded-2xl shadow-lg"
                />

                <span className="text-orange-700 font-bold text-xl tracking-wide">
                    ESO Auditing System
                </span>

                {/* Loading dots — pulse while auth is pending */}
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                        <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-orange-400"
                            style={{
                                animation: "splashDot 1.2s ease-in-out infinite",
                                animationDelay: `${i * 0.2}s`,
                                opacity: isReady ? 0 : 1,
                                transition: "opacity 300ms ease",
                            }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes splashDot {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                    40%           { transform: scale(1);   opacity: 1;   }
                }
            `}</style>
        </div>
    );
}
