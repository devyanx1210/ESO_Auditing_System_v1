import logo from "../assets/ESO_Logo.png";

export default function MaintenanceScreen({ message }: { message?: string }) {
    return (
        <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-6 text-center">
            <div style={{ animation: "fadeInUp 0.4s ease both" }}>
                <img src={logo} alt="ESO Logo" className="h-20 w-20 object-contain mx-auto mb-6 opacity-60" />
                <div className="mb-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        Under Maintenance
                    </span>
                </div>
                <h1 className="text-white font-extrabold text-2xl sm:text-3xl mb-3">
                    System Temporarily Unavailable
                </h1>
                <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                    {message ?? "The ESO Auditing System is currently undergoing maintenance. Please check back later."}
                </p>
                <p className="text-gray-600 text-xs mt-6">
                    If you need immediate assistance, please contact the ESO office directly.
                </p>
            </div>
        </div>
    );
}
