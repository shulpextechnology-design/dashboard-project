import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'https://dashboard-project-uzmg.onrender.com';

const AuthContext = createContext(null);

const SESSION_EXPIRY_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_EXPIRY_REMEMBER = 30 * 24 * 60 * 60 * 1000; // 30 days

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    rememberMe: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const stored = localStorage.getItem('auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          // Fail-open: If lastActivity is missing/invalid, treat as active and repair it.
          let lastActivity = parsed.lastActivity || 0;

          // If we have a token but no timestamp, assume it's valid and start tracking now.
          if (lastActivity === 0) {
            console.warn('[AuthDebug] Found token without timestamp. Repairing session.');
            lastActivity = now;
          }

          const rememberMe = parsed.rememberMe || false;
          const expiryLimit = rememberMe ? SESSION_EXPIRY_REMEMBER : SESSION_EXPIRY_DEFAULT;

          const timeSinceLastActivity = now - lastActivity;

          console.log('[AuthDebug] Checking session:', {
            now,
            lastActivity,
            timeSinceLastActivity,
            expiryLimit,
            rememberMe,
            isValid: timeSinceLastActivity < expiryLimit
          });

          // Only logout if STRICTLY expired
          if (timeSinceLastActivity > expiryLimit) {
            console.warn('[AuthDebug] Session expired. Logging out.', { timeSinceLastActivity });
            localStorage.removeItem('auth');
          } else {
            console.log('[AuthDebug] Session valid/repaired. Recovering user:', parsed.user?.username);

            if (parsed.token) {
              axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
            }

            setAuthState({
              user: parsed.user,
              token: parsed.token,
              rememberMe: parsed.rememberMe
            });

            // Refresh timestamp (Sliding Window)
            parsed.lastActivity = now;
            localStorage.setItem('auth', JSON.stringify(parsed));
          }
        } else {
          console.log('[AuthDebug] No session found in localStorage.');
        }
      } catch (error) {
        console.error('[AuthDebug] Init error:', error);
        // Do NOT clear auth on error unless we are sure. 
        // Better to let the user try logging in again manually if it's broken.
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for changes in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'auth') {
        console.log('[AuthDebug] Storage changed in another tab');
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setAuthState({ user: parsed.user, token: parsed.token });
            if (parsed.token) {
              axios.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
            }
          } catch (err) {
            console.error('[AuthDebug] Error parsing storage change:', err);
          }
        } else {
          setAuthState({ user: null, token: null });
          delete axios.defaults.headers.common.Authorization;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Active Activity Tracking (Sliding Window)
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
      window.removeEventListener('storage', handleStorageChange);
      activityEvents.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, []);

  const login = (data, rememberMe = false) => {
    const now = Date.now();
    console.log('[AuthDebug] Logging in. Setting lastActivity:', now, 'RememberMe:', rememberMe);
    const authData = {
      ...data,
      lastActivity: now,
      rememberMe: rememberMe
    };
    setAuthState({ user: data.user, token: data.token, rememberMe });
    localStorage.setItem('auth', JSON.stringify(authData));
    axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
  };

  const logout = () => {
    console.log('[AuthDebug] User initiated logout.');
    setAuthState({ user: null, token: null });
    localStorage.removeItem('auth');
    delete axios.defaults.headers.common.Authorization;
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
