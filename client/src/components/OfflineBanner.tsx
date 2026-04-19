import React from "react";
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

interface OfflineBannerProps {
    stale: boolean;
    online: boolean;
    onRefresh?: () => void;
    cachedAt?: string;
}

export default function OfflineBanner({ stale, online, onRefresh, cachedAt }: OfflineBannerProps) {
    if (online && !stale) return null;

    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 text-sm shadow-[0_4px_16px_rgba(0,0,0,0.08)] bg-white
            ${online && stale ? "text-amber-600" : "text-red-500"}`}>
            <FiWifiOff className="w-4 h-4 shrink-0" />
            <span className="flex-1">
                {!online
                    ? "You are offline. Showing cached data."
                    : "Showing cached data. Could not reach server."}
                {cachedAt && <span className="ml-1 opacity-70 text-xs">Last updated: {cachedAt}</span>}
            </span>
            {onRefresh && online && (
                <button onClick={onRefresh}
                    className="flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition">
                    <FiRefreshCw className="w-3 h-3" /> Retry
                </button>
            )}
        </div>
    );
}
