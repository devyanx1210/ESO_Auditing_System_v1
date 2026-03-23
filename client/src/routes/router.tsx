import { createBrowserRouter, Navigate } from "react-router-dom";

/* Layouts */
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import StudentLayout from "../layouts/StudentLayout";

/* Pages - Public */
import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";
import SignupPage from "../pages/SignupPage";
import MoreInfo from "../pages/MoreInfo";

/* Pages - Admin (shared dashboard for all non-student roles) */
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminSettings from "../pages/admin/AdminSettings";           // system_admin ONLY
import StudentList from "../pages/admin/StudentList";
import StudentObligationList from "../pages/admin/StudentObligationList";
import PaymentVerification from "../pages/admin/PaymentVerification";
import ClearanceVerification from "../pages/admin/ClearanceVerification";
import Obligations from "../pages/admin/Obligations";
import Documents from "../pages/admin/Documents";
import Reports from "../pages/admin/Reports";

/* Pages - Student */
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentSettings from "../pages/student/StudentSettings";

/* Protected Route */
import ProtectedRoute from "./ProtectedRoute";

const router = createBrowserRouter([

    /* ─── PUBLIC ROUTES ─── */
    {
        path: "/",
        element: <MainLayout />,
        errorElement: <NotFoundPage />,
        children: [
            { index: true, element: <LandingPage /> },
            { path: "signup", element: <SignupPage /> },
            { path: "more-info", element: <MoreInfo /> },
        ],
    },

    /* ─── ADMIN ROUTES ─────────────────────────────────────────
       Accessible by: system_admin, eso_officer, class_officer,
                      program_head, signatory, dean
    ─────────────────────────────────────────────────────────── */
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute
                role={[
                    "system_admin",
                    "eso_officer",
                    "class_officer",
                    "program_head",
                    "signatory",
                    "dean",
                ]}
            >
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="home" replace /> },
            { path: "home", element: <AdminDashboard /> },
            { path: "students", element: <Navigate to="/dashboard/students/list" replace /> },
            { path: "students/list", element: <StudentList /> },
            { path: "students/obligations-list", element: <StudentObligationList /> },
            { path: "students/payments", element: <PaymentVerification /> },
            { path: "students/clearances", element: <ClearanceVerification /> },
            { path: "obligations", element: <Obligations /> },
            { path: "documents", element: <Documents /> },
            { path: "reports", element: <Reports /> },

            /* Settings — system_admin ONLY */
            {
                path: "settings",
                element: (
                    <ProtectedRoute role={["system_admin"]}>
                        <AdminSettings />
                    </ProtectedRoute>
                ),
            },
        ],
    },

    /* ─── STUDENT ROUTES ─── */
    {
        path: "/student",
        element: (
            <ProtectedRoute role={["student"]}>
                <StudentLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="dashboard" replace /> },
            { path: "dashboard", element: <StudentDashboard /> },
            { path: "settings", element: <StudentSettings /> },
        ],
    },

    /* ─── FALLBACK ─── */
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);

export default router;