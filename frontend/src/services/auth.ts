import { api, setAccessToken } from '../lib/api';
import { AuthUser } from '../types/api';

interface LoginResponse {
  access: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await api.post<LoginResponse>('/api/auth/login/', { email, password });
  setAccessToken(res.access);
  return res.user;
}

export async function registerClient(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<AuthUser> {
  const res = await api.post<LoginResponse>('/api/auth/register/', data);
  setAccessToken(res.access);
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout/');
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<AuthUser> {
  return api.get<AuthUser>('/api/auth/me/');
}

interface RefreshResponse {
  access: string;
}

/** Attempts to restore a session from the HttpOnly refresh cookie —
 * called once on app load so a page refresh doesn't force a re-login. */
export async function silentRefresh(): Promise<AuthUser | null> {
  try {
    const res = await api.post<RefreshResponse>('/api/auth/refresh/');
    setAccessToken(res.access);
    return await fetchMe();
  } catch {
    return null;
  }
}

/** Always resolves — the backend deliberately never reveals whether the
 * email matches an account, so there's nothing to branch on here either. */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/api/auth/password-reset/', { email });
}

export async function confirmPasswordReset(uid: string, token: string, newPassword: string): Promise<void> {
  await api.post('/api/auth/password-reset-confirm/', { uid, token, newPassword });
}
