import { Routes, Route, Navigate } from "react-router-dom";
import {
  Package,
  TrendingUp,
  UtensilsCrossed,
  Instagram,
  AlertTriangle,
  Users,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/common";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import NotFoundPage from "@/pages/NotFoundPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import { SECTIONS } from "../../shared/constants.js";

/* ── Placeholder pages for future phases ── */
function PlaceholderPage({ icon, title, phase }) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={`This module is coming in ${phase}. Stay tuned!`}
    />
  );
}

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

        <Route
          path="inventory"
          element={
            <ProtectedRoute section={SECTIONS.INVENTORY}>
              <PlaceholderPage
                icon={Package}
                title="Inventory Management"
                phase="Phase 2"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="sales"
          element={
            <ProtectedRoute section={SECTIONS.PIPELINE}>
              <PlaceholderPage
                icon={TrendingUp}
                title="Sales Pipeline"
                phase="Phase 3"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="mealmate"
          element={
            <ProtectedRoute section={SECTIONS.MEALMATE}>
              <PlaceholderPage
                icon={UtensilsCrossed}
                title="My Meal Mate"
                phase="Phase 4"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="social"
          element={
            <ProtectedRoute section={SECTIONS.SOCIAL}>
              <PlaceholderPage
                icon={Instagram}
                title="Social Media Analytics"
                phase="Phase 4"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="gaps"
          element={
            <ProtectedRoute section={SECTIONS.BUSINESS_GAPS}>
              <PlaceholderPage
                icon={AlertTriangle}
                title="Business Gaps"
                phase="Phase 5"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/users"
          element={
            <ProtectedRoute section={SECTIONS.USER_MGMT} minLevel="edit">
              <PlaceholderPage
                icon={Users}
                title="User Management"
                phase="Phase 6"
              />
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
