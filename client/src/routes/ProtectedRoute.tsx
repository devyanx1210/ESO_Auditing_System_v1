import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth.types";
import MaintenanceScreen from "../pages/MaintenanceScreen";
import { sysadminService } from "../services/sysadmin.service";

type Props = {
    role: UserRole[];
    children: React.ReactNode;
};

export default function ProtectedRoute({ role, children }: Props) {
    const { user, isLoading } = useAuth();
    const [maintenance, setMaintenance] = useState<{ on: boolean; msg: string } | null>(null);

    useEffect(() => {
        sysadminService.getMaintenanceStatus().then(s => {
            setMaintenance({ on: Boolean(s.maintenance_mode), msg: s.maintenance_msg });
        }).catch(() => {
            setMaintenance({ on: false, msg: "" });
        });
    }, []);

    if (isLoading || maintenance === null) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500" />
            </div>
        );
    }

    if (!user) return <Navigate to="/" replace />;
    if (!role.includes(user.role)) return <Navigate to="/" replace />;

    // Show maintenance screen to everyone except system_admin
    if (maintenance.on && user.role !== "system_admin") {
        return <MaintenanceScreen message={maintenance.msg} />;
    }

    return <>{children}</>;
}
