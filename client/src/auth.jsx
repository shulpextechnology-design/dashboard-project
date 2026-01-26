import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

const AuthContext = createContext(null);

const SESSION_EXPIRY_DEFAULT = 5 * 60 * 1000; // 5 minutes
const SESSION_EXPIRY_REMEMBER = 30 * 24 * 60 * 60 * 1000; // 30 days

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    rememberMe: false
  });
  const [loading, setLoading] = useState(true);

  const logout = () => {
    // Notify server (fire and forget)
    axios.post('/api/auth/logout').catch(() => { });

    console.log('[AuthDebug] Session expired or user logged out.');
    setAuthState({ user: null, token: null });
    localStorage.removeItem('auth');
    delete axios.defaults.headers.common.Authorization;
  };

  useEffect(() => {
    // Axios Interceptor for 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn('[AuthDebug] 401 Unauthorized received. Logging out.');
          logout();
        }
        return Promise.reject(error);
      }
    );

    const initAuth = () => {
      try {
        const stored = localStorage.getItem('auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          let lastActivity = parsed.lastActivity || 0;

          if (lastActivity === 0) {
            console.warn('[AuthDebug] Found token without timestamp. Repairing session.');
            lastActivity = now;
          }

          const role = String(parsed.user?.role || '').toLowerCase();
          const username = String(parsed.user?.username || '').toLowerCase();
          // Extremely robust admin check: check role OR username
          const isAdmin = role === 'admin' || username === 'admin';

          // Strictly follow the policy:
          // 1. Admins NEVER expire via inactivity on client side.
          // 2. ALL other users expire after 5 minutes, ignoring "Remember Me".
          const expiryLimit = isAdmin ? Infinity : SESSION_EXPIRY_DEFAULT;
          const rememberMe = parsed.rememberMe || false;

          const timeSinceLastActivity = now - lastActivity;

          if (timeSinceLastActivity > expiryLimit) {
            console.warn('[SessionPolicy] User session expired.', {
              timeSinceLastActivity,
              isAdmin,
              expiryLimit
            });
            logout();
          }
          else {
            console.log('[AuthDebug] Session valid.', { isAdmin, rememberMe });
            if (parsed.token) {
              axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
            }

            setAuthState({
              user: parsed.user,
              token: parsed.token,
              rememberMe: rememberMe
            });
          }
        }
      } catch (error) {
        console.error('[AuthDebug] Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Background Expiry Check (every 30 seconds)
    const expiryInterval = setInterval(() => {
      const stored = localStorage.getItem('auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          const lastActivity = parsed.lastActivity || 0;
          const role = String(parsed.user?.role || '').toLowerCase();
          const username = String(parsed.user?.username || '').toLowerCase();
          const isAdmin = role === 'admin' || username === 'admin';

          const expiryLimit = isAdmin ? Infinity : SESSION_EXPIRY_DEFAULT;

          if (now - lastActivity > expiryLimit) {
            console.warn('[SessionPolicy] Background check: Session expired.', { isAdmin });
            logout();
          }
        } catch (e) { /* ignore */ }
      }
    }, 30000);

    const handleStorageChange = (e) => {
      if (e.key === 'auth') {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setAuthState({
              user: parsed.user,
              token: parsed.token,
              rememberMe: parsed.rememberMe || false
            });
            if (parsed.token) {
              axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
            }
          } catch (err) { /* ignore */ }
        } else {
          setAuthState({ user: null, token: null });
          delete axios.defaults.headers.common.Authorization;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const updateActivity = () => {
      const stored = localStorage.getItem('auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.lastActivity = Date.now();
          localStorage.setItem('auth', JSON.stringify(parsed));
        } catch (e) { /* ignore */ }
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, updateActivity));

    return () => {
      axios.interceptors.response.eject(interceptor);
      clearInterval(expiryInterval);
      window.removeEventListener('storage', handleStorageChange);
      activityEvents.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, []);

  const login = (data, rememberMe = false) => {
    const now = Date.now();
    const authData = {
      ...data,
      lastActivity: now,
      rememberMe: rememberMe
    };
    setAuthState({ user: data.user, token: data.token, rememberMe });
    localStorage.setItem('auth', JSON.stringify(authData));
    axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
  };

  const value = {
    user: authState.user,
    token: authState.token,
    loading,
    login,
    logout
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
