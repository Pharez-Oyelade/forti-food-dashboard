import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '@/services/api';
import {
  ACCESS_LEVELS,
  canRead as sharedCanRead,
  canWrite as sharedCanWrite,
  canDelete as sharedCanDelete,
} from '../../../shared/constants.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session from httpOnly cookie on mount
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const data = await get('/auth/me');
        if (!cancelled) {
          setUser(data.data.user);
        }
      } catch {
        // No valid session — user stays null
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await post('/auth/login', { email, password });
      if (data.data.token) {
        localStorage.setItem('auth_token', data.data.token);
      }
      setUser(data.data.user);
      navigate('/app/dashboard');
      return data;
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout');
    } catch {
      // Even if the server call fails, clear local state
    }
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Check if user has at least `minLevel` permission on `section`
  const hasPermission = useCallback(
    (section, minLevel = ACCESS_LEVELS.VIEW) => {
      if (!user?.role?.permissions) return false;
      const userLevel = user.role.permissions[section]?.access;
      if (!userLevel || userLevel === ACCESS_LEVELS.NONE) return false;

      // Build a hierarchy for comparison
      const hierarchy = [
        ACCESS_LEVELS.NONE,
        ACCESS_LEVELS.VIEW_RESTRICTED,
        ACCESS_LEVELS.VIEW_OWN,
        ACCESS_LEVELS.VIEW,
        ACCESS_LEVELS.EDIT_OWN,
        ACCESS_LEVELS.EDIT_RULES,
        ACCESS_LEVELS.EDIT,
        ACCESS_LEVELS.FULL,
      ];

      const userIdx = hierarchy.indexOf(userLevel);
      const requiredIdx = hierarchy.indexOf(minLevel);
      return userIdx >= requiredIdx;
    },
    [user]
  );

  const canRead = useCallback(
    (section) => {
      if (!user?.role?.permissions) return false;
      return sharedCanRead(user.role.permissions[section]?.access);
    },
    [user]
  );

  const canWrite = useCallback(
    (section) => {
      if (!user?.role?.permissions) return false;
      return sharedCanWrite(user.role.permissions[section]?.access);
    },
    [user]
  );

  const canDelete = useCallback(
    (section) => {
      if (!user?.role?.permissions) return false;
      return sharedCanDelete(user.role.permissions[section]?.access);
    },
    [user]
  );

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    canRead,
    canWrite,
    canDelete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
