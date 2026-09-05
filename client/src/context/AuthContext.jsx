import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

const ROLE_DEFAULT_PERMISSIONS = {
  owner: ['*'],
  manager: [
    'dashboard.view', 'projects.view', 'suppliers.view',
    'labourers.view', 'labourers.create', 'labourers.update', 'labourers.delete',
    'attendance.view', 'attendance.create', 'attendance.update',
    'payroll.view', 'reports.view',
  ],
  accountant: [
    'dashboard.view', 'payroll.view', 'payroll.manage',
    'payments.view', 'payments.manage', 'reports.view',
  ],
  supervisor: ['dashboard.view', 'labourers.view', 'attendance.view', 'attendance.create'],
};

export function hasUserPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.includes('*') ||
    permissions.includes(permission) ||
    (permissions.length === 0 && (ROLE_DEFAULT_PERMISSIONS[user.role] || []).includes(permission));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('clm_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('clm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.data.user);
        localStorage.setItem('clm_user', JSON.stringify(res.data.data.user));
      })
      .catch(() => {
        localStorage.removeItem('clm_token');
        localStorage.removeItem('clm_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedInUser } = res.data.data;
    localStorage.setItem('clm_token', token);
    localStorage.setItem('clm_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('clm_token');
    localStorage.removeItem('clm_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, isAuthenticated: Boolean(user), hasPermission: (permission) => hasUserPermission(user, permission) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
