import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import NotFoundPage from "@/pages/NotFoundPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import SalesPipelinePage from "@/pages/sales/SalesPipelinePage";
import InventoryPage from "@/pages/inventory/InventoryPage";
import WeeklyReportPage from "@/pages/reports/WeeklyReportPage";
import BDDashboardPage from "@/pages/bd/BDDashboardPage";
import GrantsPipelinePage from "@/pages/bd/GrantsPipelinePage";
import MealMatePage from "@/pages/mealmate/MealMatePage";
import SocialMediaPage from "@/pages/social/SocialMediaPage";
import InsightsPage from "@/pages/insights/InsightsPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import { SECTIONS, ACCESS_LEVELS } from "../../shared/constants.js";

/* ── Root redirect based on auth ── */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? (
    <Navigate to="/app/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

/* ── App Routes ── */
function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="reports/weekly" element={<WeeklyReportPage />} />

        <Route
          path="inventory"
          element={
            <ProtectedRoute section={SECTIONS.INVENTORY}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="sales"
          element={
            <ProtectedRoute section={SECTIONS.PIPELINE}>
              <SalesPipelinePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="bd"
          element={
            <ProtectedRoute section={SECTIONS.PIPELINE}>
              <BDDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="bd/grants"
          element={
            <ProtectedRoute section={SECTIONS.PIPELINE} minLevel="edit">
              <GrantsPipelinePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="mealmate"
          element={
            <ProtectedRoute section={SECTIONS.MEALMATE}>
              <MealMatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="social"
          element={
            <ProtectedRoute
              section={SECTIONS.SOCIAL}
              minLevel={ACCESS_LEVELS.VIEW}
            >
              <SocialMediaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="gaps"
          element={
            <ProtectedRoute section={SECTIONS.BUSINESS_GAPS} minLevel="view">
              <InsightsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/users"
          element={
            <ProtectedRoute section={SECTIONS.USER_MGMT} minLevel="edit">
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Error pages */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer theme="dark" position="bottom-right" />
    </AuthProvider>
  );
}
