import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'talendro_token';
const USER_KEY = 'talendro_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Verify token with server and refresh user data
  const refreshUser = useCallback(async (authToken) => {
    const t = authToken || token;
    if (!t) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!res.ok) {
        // Token invalid — clear auth
        logout();
        return null;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.warn('[AuthContext] refreshUser failed:', err.message);
    }
    return null;
  }, [token]);

  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear any session storage too
    sessionStorage.clear();
  }, []);

  // Save onboarding progress to server
  const saveProgress = useCallback(async (step, formData) => {
    if (!token) return;
    try {
      await fetch('/api/auth/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ step, formData })
      });
      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        onboardingProgress: { ...prev.onboardingProgress, step },
        onboardingData: formData || prev.onboardingData
      } : prev);
    } catch (err) {
      console.warn('[AuthContext] saveProgress failed:', err.message);
    }
  }, [token]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
      refreshUser,
      saveProgress,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
