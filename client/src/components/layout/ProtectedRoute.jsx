import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common';

export default function ProtectedRoute({ children, section, minLevel = 'view' }) {
  const { user, loading, hasPermission } = useAuth();

  // Auth check still in progress
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-dark">
        <LoadingSpinner size="lg" label="Loading..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but lacks permission for this section
  if (section && !hasPermission(section, minLevel)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
