import { createContext, useContext, useState, useEffect } from 'react';
import { ROLE_PERMISSIONS } from '../utils/constants';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState(ROLE_PERMISSIONS);

  // Auto logout after 1 hour of inactivity
  useEffect(() => {
    let timeoutId;
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour

    const handleActivity = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setUser(null);
        sessionStorage.removeItem('hris-user');
        window.location.href = '/login';
      }, INACTIVITY_LIMIT);
    };

    if (user) {
      handleActivity();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user]);

  useEffect(() => {
    // Check for saved session
    const saved = sessionStorage.getItem('hris-user');
    const savedPerms = localStorage.getItem('hris-role-permissions');
    
    if (savedPerms) {
      try {
        const parsedPerms = JSON.parse(savedPerms);
        // Migration Check: If old array didn't have submenus like 'employees' or 'presence', reset to default.
        if (parsedPerms['Admin'] && !parsedPerms['Admin'].includes('employees')) {
          localStorage.removeItem('hris-role-permissions');
          setRolePermissions(ROLE_PERMISSIONS);
        } else {
          setRolePermissions(parsedPerms);
        }
      } catch {
        localStorage.removeItem('hris-role-permissions');
      }
    }
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('hris-user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('hris-user', JSON.stringify(userData));
  };

  const loginWithCredentials = async (identifier, password) => {
    try {
      const res = await api.post('/auth-custom/login', { identifier, password });
      if (res.success) {
        login(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Server error' };
    }
  };

  const signup = async (name, email, password, employeeId) => {
    // Simple signup placeholder - in real app, call backend
    return { success: false, error: 'Signup is currently disabled. Please contact HR.' };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('hris-user');
  };

  // Update specific user fields globally (e.g. after profile edit)
  const updateUser = (fields) => {
    const updated = { ...user, ...fields };
    setUser(updated);
    sessionStorage.setItem('hris-user', JSON.stringify(updated));
  };

  const updateRolePermissions = (newPermissions) => {
    setRolePermissions(newPermissions);
    localStorage.setItem('hris-role-permissions', JSON.stringify(newPermissions));
  };

  // Role-based access helpers
  const hasAccess = (menuId) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true; // Absolute Access Lock
    const permissions = rolePermissions[user.role];
    if (!permissions) return false;
    return permissions.includes(menuId);
  };

  const isSuperAdmin = () => user?.role === 'Super Admin';
  const isAdmin = () => user?.role === 'Admin' || user?.role === 'Super Admin';

  return (
    <AuthContext.Provider value={{
      user, loading, login, loginWithCredentials, signup, logout, updateUser,
      hasAccess, isSuperAdmin, isAdmin, updateRolePermissions, rolePermissions
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
