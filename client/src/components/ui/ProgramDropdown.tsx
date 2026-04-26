import { useEffect, useRef, useState } from "react";
import { FaFilter, FaChevronDown } from "react-icons/fa";

interface ProgramOption {
    programId: number;
    name: string;
}

interface ProgramDropdownProps {
    programs: ProgramOption[];
    value: number | "";
    onChange: (val: number | "") => void;
    darkMode: boolean;
}

export default function ProgramDropdown({ programs, value, onChange, darkMode }: ProgramDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = programs.find(p => p.programId === value);
    const label = selected ? selected.name : "All Programs";

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const options: Array<{ id: number | ""; name: string }> = [
        { id: "", name: "All Programs" },
        ...programs.map(p => ({ id: p.programId, name: p.name })),
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium
                    transition-all duration-200 shadow-sm
                    ${open
                        ? "bg-orange-500 text-white shadow-[0_4px_16px_rgba(234,88,12,0.4)]"
                        : darkMode
                            ? "bg-[#1a1a1a] border border-gray-700 text-white hover:border-orange-500"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-orange-400"
                    }
                `}
            >
                <FaFilter className={`text-[10px] shrink-0 ${open ? "text-white" : "text-orange-500"}`} />
                <span className="truncate max-w-[120px] sm:max-w-[180px]">{label}</span>
                <FaChevronDown className={`text-[10px] shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-white" : "text-orange-500"}`} />
            </button>

            <div className={`
                absolute right-0 top-full mt-2 z-30
                w-48 sm:w-auto sm:min-w-[220px] sm:max-w-[300px]
                rounded-2xl overflow-hidden
                ${darkMode ? "bg-[#1a1a1a] shadow-[0_16px_48px_rgba(0,0,0,0.6)]" : "bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)]"}
                transition-all duration-200 origin-top-right
                ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}
            `}>
                <div className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest
                    ${darkMode ? "text-gray-500 border-b border-gray-700" : "text-gray-400 border-b border-gray-100"}`}>
                    Filter by Program
                </div>
                <div className="py-1 max-h-56 overflow-y-auto">
                    {options.map(opt => (
                        <button
                            key={String(opt.id)}
                            onClick={() => { onChange(opt.id); setOpen(false); }}
                            className={`
                                w-full flex items-center gap-2 px-3 py-2 text-xs text-left
                                transition-colors duration-150
                                ${opt.id === value
                                    ? "bg-orange-500 text-white font-semibold"
                                    : darkMode ? "text-gray-200 hover:bg-[#222]" : "text-gray-700 hover:bg-orange-50"}
                            `}
                        >
                            <span className="truncate">{opt.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
