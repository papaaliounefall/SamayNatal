import { toCamel, toSnake } from './case';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8010';

// Kept in memory only — never localStorage/sessionStorage, so an XSS
// payload can't exfiltrate a long-lived credential. Lost on page reload
// by design; AuthProvider re-derives it via the HttpOnly refresh cookie.
let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown, message?: string) {
    super(message || `Erreur API (${status})`);
    this.status = status;
    this.data = data;
  }

  /** DRF's conventional {"detail": "..."} shape, when present. */
  get detail(): string | undefined {
    if (this.data && typeof this.data === 'object' && 'detail' in this.data) {
      return String((this.data as Record<string, unknown>).detail);
    }
    return undefined;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        accessToken = data.access as string;
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Internal — prevents infinite refresh loops. */
  _retried?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, _retried, headers: rawHeaders, ...rest } = options;
  const headers = new Headers(rawHeaders);
  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(toSnake(body));
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: requestBody,
    credentials: 'include',
  });

  if (response.status === 401 && !_retried && path !== '/api/auth/refresh/') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const raw = contentType.includes('application/json') ? await response.json() : await response.text();
  const data = typeof raw === 'string' ? raw : toCamel(raw);

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiFetchOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  put: <T = unknown>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  delete: <T = unknown>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};

/** Multipart upload with real progress — fetch() can't report upload
 * progress, so this is the one place we drop down to XMLHttpRequest. */
export function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}${path}`);
    xhr.withCredentials = true;
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let parsed: unknown = null;
      try {
        parsed = toCamel(JSON.parse(xhr.responseText));
      } catch {
        parsed = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsed as T);
      } else {
        reject(new ApiError(xhr.status, parsed));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, null, 'Erreur réseau pendant l\'envoi.'));
    xhr.send(formData);
  });
}
