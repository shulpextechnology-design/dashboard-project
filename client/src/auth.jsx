import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'https://dashboard-project-uzmg.onrender.com';

const AuthContext = createContext(null);

const SESSION_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
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

          const timeSinceLastActivity = now - lastActivity;

          console.log('[AuthDebug] Checking session:', {
            now,
            lastActivity,
            timeSinceLastActivity,
            expiryLimit: SESSION_EXPIRY,
            isValid: timeSinceLastActivity < SESSION_EXPIRY
          });

          // Only logout if STRICTLY expired
          if (timeSinceLastActivity > SESSION_EXPIRY) {
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
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (data) => {
    const now = Date.now();
    console.log('[AuthDebug] Logging in. Setting lastActivity:', now);
    const authData = {
      ...data,
      lastActivity: now
    };
    setAuthState({ user: data.user, token: data.token });
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
