import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/auth.types";

type Props = {
    role: UserRole[];
    children: React.ReactNode;
};

export default function ProtectedRoute({ role, children }: Props) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500" />
            </div>
        );
    }

    if (!user) return <Navigate to="/" replace />;
    if (!role.includes(user.role)) return <Navigate to="/" replace />;

    return <>{children}</>;
}
