import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/auth';
import { AuthUser } from '../types/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  registerClient: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
  /** Call after an action that changes the photographer's own status/profile
   * (e.g. right after registering) so `user.photographerStatus` stays current. */
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip the network round-trip (and its guaranteed 401) entirely when
    // nothing suggests a session ever existed on this browser — the
    // common case for anonymous gallery visitors.
    if (!authService.hadSessionHint()) {
      setIsLoading(false);
      return;
    }
    authService
      .silentRefresh()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const registerClient = useCallback(
    async (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
      const newUser = await authService.registerClient(data);
      setUser(newUser);
      return newUser;
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await authService.fetchMe();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, registerClient, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
