import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, token, type User } from './api';

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!token.get()) {
      setUser(null);
      return;
    }
    try {
      setUser(await api<User>('/users/me'));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const accept = (res: { token: string; user: User }) => {
    token.set(res.token);
    setUser(res.user);
    return res.user;
  };

  const value: AuthState = {
    user,
    ready,
    refresh,
    login: async (email, password) => accept(await api('/auth/login', { body: { email, password } })),
    register: async (data) => accept(await api('/auth/register', { body: data })),
    logout: () => {
      token.set(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
