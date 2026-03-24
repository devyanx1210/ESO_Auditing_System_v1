import { useEffect, useState } from "react";
import { MdBuild, MdSave } from "react-icons/md";
import { useAuth } from "../../hooks/useAuth";
import { sysadminService } from "../../services/sysadmin.service";

export default function MaintenancePage() {
    const { accessToken } = useAuth();
    const [mode,    setMode]    = useState(false);
    const [msg,     setMsg]     = useState("");
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [toast,   setToast]   = useState("");

    useEffect(() => {
        if (!accessToken) return;
        sysadminService.getSettings(accessToken).then(s => {
            setMode(Boolean(s.maintenance_mode));
            setMsg(s.maintenance_msg);
        }).finally(() => setLoading(false));
    }, [accessToken]);

    const showToast = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3000); };

    const handleSave = async () => {
        if (!accessToken) return;
        setSaving(true);
        try {
            await sysadminService.updateMaintenance(accessToken, mode, msg);
            showToast("Maintenance settings saved.");
        } catch (e: any) {
            showToast(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-3 sm:p-5 lg:p-8 min-h-screen bg-gray-50">

            <div className="mb-5 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Maintenance Mode</h1>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
                    <p className="text-gray-400 text-sm">Loading...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 sm:p-6 space-y-6 max-w-2xl">

                    {/* Toggle */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-gray-800 font-semibold text-sm">Maintenance Mode</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                                When ON, students and other users see a maintenance screen instead of the system.
                            </p>
                        </div>
                        <button
                            onClick={() => setMode(m => !m)}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none shrink-0
                                ${mode ? "bg-red-500" : "bg-gray-300"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300
                                ${mode ? "translate-x-7" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border
                        ${mode
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "bg-green-50 border-green-200 text-green-600"}`}
                    >
                        <MdBuild size={16} className="shrink-0" />
                        <span className="text-sm font-medium">
                            {mode
                                ? "Maintenance is currently ON. Users cannot access the system."
                                : "System is operational. All users can access normally."}
                        </span>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Maintenance Message
                        </label>
                        <textarea
                            value={msg}
                            onChange={e => setMsg(e.target.value)}
                            rows={3}
                            placeholder="System is currently under maintenance. Please try again later."
                            className="w-full rounded-xl bg-white border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                        <p className="text-gray-400 text-xs mt-1">This message is shown to users on the maintenance screen.</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60"
                    >
                        <MdSave size={16} />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">
                    {toast}
                </div>
            )}
        </div>
    );
}
