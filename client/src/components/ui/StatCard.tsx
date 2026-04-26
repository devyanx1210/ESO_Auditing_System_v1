import type { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: ReactNode;
    subtitle?: string;
    icon: ReactNode;
    active?: boolean;
    darkMode?: boolean;
    animDelay?: number;
    onClick?: () => void;
}

export default function StatCard({
    title, value, subtitle, icon,
    active = false, darkMode = false,
    animDelay = 0, onClick,
}: StatCardProps) {
    return (
        <div
            onClick={onClick}
            style={{ animationDelay: `${animDelay}ms` }}
            className={`anim-card-pop rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3
                ${onClick ? "cursor-pointer" : ""} transition-all duration-200
                ${active
                    ? "bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_12px_32px_rgba(234,88,12,0.50)] text-white"
                    : `shadow-[0_6px_24px_rgba(0,0,0,0.13)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.20)]
                       ${darkMode ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-800"}`
                }`}
        >
            <div className="flex justify-between items-start gap-2">
                <p className={`text-[9px] sm:text-[10px] lg:text-xs font-semibold uppercase tracking-wide leading-snug
                    ${active ? "text-white/75" : darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {title}
                </p>
                <span className={`text-base sm:text-lg lg:text-xl shrink-0 ${active ? "text-white" : "text-orange-500"}`}>
                    {icon}
                </span>
            </div>
            <div>
                <p className={`leading-tight font-black tracking-tight
                    ${typeof value === "string" && value.length > 9
                        ? "text-lg sm:text-xl lg:text-2xl"
                        : "text-xl sm:text-2xl lg:text-[1.75rem]"}
                    ${active ? "text-white" : ""}`}>
                    {value}
                </p>
                {subtitle && (
                    <p className={`text-[9px] sm:text-[10px] lg:text-xs mt-0.5 line-clamp-2
                        ${active ? "text-white/70" : "text-gray-400"}`}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
