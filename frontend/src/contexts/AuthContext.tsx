import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  username: string;
  role: string;
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
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Code verification failed');
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
      if (!res.ok) throw new Error('Session expired');
      setUser(await res.json());
    } catch { logout(); }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, verifyLoginCode, logout, refreshToken, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
