import { api, setAccessToken } from '../lib/api';
import { AuthUser } from '../types/api';

interface LoginResponse {
  access: string;
  user: AuthUser;
}

// A plain (non-HttpOnly) marker so the app can skip the silent-refresh
// call entirely for the vast majority of visits (anonymous gallery
// browsing) instead of always firing a request that's guaranteed to 401
// when there was never a session to restore. Holds no session data itself
// — the real refresh token stays HttpOnly, this is only a hint.
const SESSION_HINT_KEY = 'sn_had_session';

function markSessionHint(): void {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1');
  } catch {
    // Private browsing / blocked storage — worst case we fall back to
    // always attempting silentRefresh, same as before this optimization.
  }
}

function clearSessionHint(): void {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Ignore — see markSessionHint().
  }
}

export function hadSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return true;
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await api.post<LoginResponse>('/api/auth/login/', { email, password });
  setAccessToken(res.access);
  markSessionHint();
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
  markSessionHint();
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout/');
  } finally {
    setAccessToken(null);
    clearSessionHint();
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
    const user = await fetchMe();
    markSessionHint();
    return user;
  } catch {
    clearSessionHint();
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
