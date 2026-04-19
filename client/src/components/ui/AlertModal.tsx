import React from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

interface AlertModalProps {
    message: string;
    onClose: () => void;
    darkMode?: boolean;
}

export function AlertModal({ message, onClose, darkMode = false }: AlertModalProps) {
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            {/* Modal */}
            <div className={`relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-5
                ${darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-800"}`}>

                {/* Close button */}
                <button onClick={onClose}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition
                        ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-[#252525]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                    <FiX className="w-4 h-4" />
                </button>

                {/* Message */}
                <p className="text-sm leading-relaxed pr-6">{message}</p>

                {/* OK button */}
                <div className="mt-4 flex justify-end">
                    <button onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition">
                        OK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
