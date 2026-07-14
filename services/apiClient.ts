/**
 * Generic fetch wrapper used by every service (authService, userService, ...).
 * Handles: JSON headers, timeouts, auth token injection, and turning
 * non-2xx responses into thrown errors with a readable message.
 *
 * You should not need to edit this file when the backend address changes —
 * that all lives in `config/api.ts`.
 */

import { API_TIMEOUT_MS } from '../config/api';
import { getAccessToken } from './tokenStorage';

export class ApiError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  authenticated?: boolean; // attach Bearer token if available
  headers?: Record<string, string>;
};

async function request<T = any>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, authenticated = false, headers = {} } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const finalHeaders: Record<string, string> = { ...headers };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData) {
    // FormData sets its own "Content-Type: multipart/form-data; boundary=..."
    // header — setting it manually breaks the boundary and the server won't
    // be able to parse the multipart body at all.
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (authenticated) {
    const token = await getAccessToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: finalHeaders,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Some endpoints return 204/empty bodies (e.g. NoContent) — guard JSON parsing.
    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const message =
        (data && (data.message || data.title || data.error)) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') {
      throw new ApiError('انتهت مهلة الاتصال، حاول مرة أخرى', 0);
    }
    throw new ApiError(err.message || 'حدث خطأ في الاتصال بالخادم', 0);
  }
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = {
  get: <T = any>(baseUrl: string, path: string, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'GET' }),
  post: <T = any>(baseUrl: string, path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'POST', body }),
  put: <T = any>(baseUrl: string, path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'PUT', body }),
  delete: <T = any>(baseUrl: string, path: string, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'DELETE' }),
};
