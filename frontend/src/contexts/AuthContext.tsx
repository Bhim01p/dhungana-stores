import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { readApiResponse } from '../api/readResponse';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  permissions?: string[];
  imageUrl?: string | null;
}

interface LoginChallenge {
  challengeId: string;
  emailHint: string;
  expiresInSeconds: number;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginChallenge>;
  verifyLoginCode: (challengeId: string, code: string) => Promise<void>;
  logout: () => void;
  syncUser: (updates: Partial<AdminUser>, replacementToken?: string) => void;
  refreshToken: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    const storedToken = sessionStorage.getItem('adminToken');
    const storedUser = sessionStorage.getItem('adminUser');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AdminUser;
        if (!parsed || typeof parsed.id !== 'string' || typeof parsed.username !== 'string') throw new Error('Invalid saved session');
        setToken(storedToken);
        setUser(parsed);
      } catch {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<LoginChallenge> => {
    try {
      setError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await readApiResponse<LoginChallenge>(res, '/auth/login');
      if (!data.challengeId || !data.emailHint) throw new Error('The sign-in code could not be started. Please try again.');
      return data as LoginChallenge;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const verifyLoginCode = async (challengeId: string, code: string) => {
    try {
      setError(null);
      const res = await fetch('/api/auth/verify-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, code }),
      });
      const data = await readApiResponse<{ token: string; admin: AdminUser }>(res, '/auth/verify-login-code');
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
      setToken(data.token);
      setUser(data.admin);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = await readApiResponse<AdminUser>(res, '/auth/me');
      setUser(updated);
      sessionStorage.setItem('adminUser', JSON.stringify(updated));
    } catch { logout(); }
  };

  const syncUser = (updates: Partial<AdminUser>, replacementToken?: string) => {
    if (replacementToken) {
      sessionStorage.setItem('adminToken', replacementToken);
      setToken(replacementToken);
    }
    setUser(current => {
      if (!current) return current;
      const updated = { ...current, ...updates };
      sessionStorage.setItem('adminUser', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, verifyLoginCode, logout, syncUser, refreshToken, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
