import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/authApi';
import {
  ROLES,
  userHasPermission,
  userHasAnyPermission,
  canAccessModule,
  getUserEffectivePermissions,
} from '../utils/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('speeddex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('speeddex_access_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize state with storage
  const setSession = (userData, accessToken, refreshToken) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('speeddex_user', JSON.stringify(userData));
    }
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('speeddex_access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('speeddex_refresh_token', refreshToken);
    }
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('speeddex_user');
    localStorage.removeItem('speeddex_access_token');
    localStorage.removeItem('speeddex_refresh_token');
  };

  // Check current user profile from server on initial load
  const verifySession = useCallback(async () => {
    const storedToken = localStorage.getItem('speeddex_access_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response?.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('speeddex_user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.warn('Session verification error:', error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();

    const handleUnauthorized = () => {
      clearSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [verifySession]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    const { user: loggedInUser, accessToken, refreshToken } = response.data;
    setSession(loggedInUser, accessToken, refreshToken);
    return loggedInUser;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('speeddex_refresh_token');
    try {
      await authApi.logout(refreshToken);
    } catch (e) {
      // Ignore network error on logout
    } finally {
      clearSession();
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await authApi.getMe();
      if (response?.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('speeddex_user', JSON.stringify(response.data.user));
      }
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  const hasRole = useCallback((...roles) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    return roles.includes(user.role);
  }, [user]);

  const hasPermission = useCallback((permission) => {
    return userHasPermission(user, permission);
  }, [user]);

  const hasAnyPermission = useCallback((...perms) => {
    return userHasAnyPermission(user, ...perms);
  }, [user]);

  const canAccess = useCallback((moduleId) => {
    return canAccessModule(user, moduleId);
  }, [user]);

  const effectivePermissions = useMemo(() => getUserEffectivePermissions(user), [user]);

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isSuperAdmin,
        login,
        logout,
        refreshProfile,
        hasRole,
        hasPermission,
        hasAnyPermission,
        canAccess,
        effectivePermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
