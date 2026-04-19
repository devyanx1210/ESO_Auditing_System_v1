import { FiCheckSquare, FiClock } from "react-icons/fi";

interface Props {
    active: "review" | "history";
    onChange: (v: "review" | "history") => void;
    reviewCount: number;
    historyCount: number;
    reviewLabel?: string;
    historyLabel?: string;
}

export function ClearanceSubTabs({
    active, onChange, reviewCount, historyCount,
    reviewLabel = "For Review", historyLabel = "History",
}: Props) {
    return (
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1 w-fit">
            <button
                onClick={() => onChange("review")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "review"
                        ? "bg-white dark:bg-[#1a1a1a] text-orange-600 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}>
                <FiCheckSquare className="w-4 h-4" />
                {reviewLabel}
                {reviewCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                        {reviewCount}
                    </span>
                )}
            </button>
            <button
                onClick={() => onChange("history")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    active === "history"
                        ? "bg-white dark:bg-[#1a1a1a] text-orange-600 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}>
                <FiClock className="w-4 h-4" />
                {historyLabel}
                {historyCount > 0 && (
                    <span className="bg-gray-400 dark:bg-gray-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                        {historyCount}
                    </span>
                )}
            </button>
        </div>
    );
}
