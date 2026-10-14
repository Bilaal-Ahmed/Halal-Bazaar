import { auth } from '../firebase';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = apiBaseUrl ? new URL(path, `${apiBaseUrl}/`).toString() : path;
  const response = await fetch(url, { ...options, headers });
  const result = await response.json().catch(() => null) as
    | { error?: { message?: string; code?: string } }
    | T
    | null;

  if (!response.ok) {
    const error = result && typeof result === 'object' && 'error' in result
      ? result.error
      : undefined;
    throw new ApiError(
      error?.message || `Request failed with status ${response.status}.`,
      response.status,
      error?.code || 'request_failed',
    );
  }
  if (result === null) throw new ApiError('The server returned an empty response.', response.status, 'empty_response');
  return result as T;
}
