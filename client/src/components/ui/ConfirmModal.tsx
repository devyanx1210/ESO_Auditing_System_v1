import React from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

interface ConfirmModalProps {
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    darkMode?: boolean;
}

export function ConfirmModal({
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onConfirm,
    onCancel,
    darkMode = false,
}: ConfirmModalProps) {
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />

            {/* Modal */}
            <div className={`relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-5
                ${darkMode ? "bg-[#1a1a1a] text-gray-100" : "bg-white text-gray-800"}`}>

                {/* Close button */}
                <button onClick={onCancel}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition
                        ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-[#252525]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                    <FiX className="w-4 h-4" />
                </button>

                {/* Message */}
                <p className="text-sm leading-relaxed pr-6">{message}</p>

                {/* Buttons */}
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition
                            ${darkMode ? "bg-[#252525] text-gray-300 hover:bg-[#2e2e2e]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {cancelLabel}
                    </button>
                    <button onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition
                            ${danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
