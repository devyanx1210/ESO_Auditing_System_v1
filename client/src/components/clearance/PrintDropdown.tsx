import { useState, useRef, useEffect } from "react";
import { FiPrinter, FiChevronDown, FiFileText, FiDownload } from "react-icons/fi";

interface Props {
    onPrint: () => void;
    onExport: () => void;
    darkMode: boolean;
}

export function PrintDropdown({ onPrint, onExport, darkMode }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                title="Print / Export"
                className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-sm font-medium transition shadow-sm border
                    ${darkMode
                        ? "bg-[#1a1a1a] border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-400"
                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"}`}>
                <FiPrinter className="w-4 h-4" />
                <FiChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {open && (
                <div className={`absolute right-0 top-full mt-1.5 z-30 rounded-xl shadow-2xl ring-1 ring-black/5 py-1.5 w-44
                    ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
                    <button
                        onClick={() => { setOpen(false); onPrint(); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-sm transition
                            ${darkMode ? "text-gray-300 hover:bg-[#252525]" : "text-gray-700 hover:bg-gray-50"}`}>
                        <FiFileText className="w-4 h-4 text-orange-500 shrink-0" /> Print as PDF
                    </button>
                    <button
                        onClick={() => { setOpen(false); onExport(); }}
                        className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-sm transition
                            ${darkMode ? "text-gray-300 hover:bg-[#252525]" : "text-gray-700 hover:bg-gray-50"}`}>
                        <FiDownload className="w-4 h-4 text-orange-500 shrink-0" /> Export CSV
                    </button>
                </div>
            )}
        </div>
    );
}
