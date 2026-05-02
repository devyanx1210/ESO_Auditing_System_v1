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
    const [maintenance, setMaintenance] = useState<{ on: boolean; msg: string }>({ on: false, msg: "" });

    useEffect(() => {
        sysadminService.getMaintenanceStatus().then(s => {
            setMaintenance({ on: Boolean(s.maintenance_mode), msg: s.maintenance_msg });
        }).catch(() => {});
    }, []);

    if (isLoading) return null;

    if (!user) return <Navigate to="/" replace />;
    if (!role.includes(user.role)) return <Navigate to="/" replace />;

    // Show maintenance screen to everyone except system_admin
    if (maintenance.on && user.role !== "system_admin") {
        return <MaintenanceScreen message={maintenance.msg} />;
    }

    return <>{children}</>;
}
