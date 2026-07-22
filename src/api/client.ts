/**
 * Generic fetch wrapper used by every service.
 *
 * Handles JSON headers, timeouts, bearer-token injection, and turning non-2xx
 * responses into thrown ApiErrors with a readable message. Base URLs and the
 * timeout come from src/config/env.ts.
 */

import { API_TIMEOUT_MS } from '@/config/env';

import { ApiError, NETWORK_ERROR_STATUS } from './errors';
import { getAccessToken } from './tokenStorage';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  /** Attach the saved bearer token, if there is one. */
  authenticated?: boolean;
  headers?: Record<string, string>;
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Pulls the most useful message out of an ASP.NET error body. */
function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['message', 'title', 'error'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }
  return `Request failed with status ${status}`;
}

async function request<T>(
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
    // FormData sets its own "multipart/form-data; boundary=..." header —
    // setting Content-Type manually destroys the boundary and the server
    // cannot parse the body at all.
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
      body: isFormData
        ? (body as FormData)
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
      signal: controller.signal,
    });

    // Some endpoints return 204/empty bodies (NoContent) — guard JSON parsing.
    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      throw new ApiError(
        extractErrorMessage(data, response.status),
        response.status,
        data,
      );
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('انتهت مهلة الاتصال، حاول مرة أخرى', NETWORK_ERROR_STATUS);
    }
    const message = err instanceof Error ? err.message : 'حدث خطأ في الاتصال بالخادم';
    throw new ApiError(message || 'حدث خطأ في الاتصال بالخادم', NETWORK_ERROR_STATUS);
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(baseUrl: string, path: string, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'GET' }),

  post: <T>(baseUrl: string, path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'POST', body }),

  put: <T>(baseUrl: string, path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'PUT', body }),

  delete: <T>(baseUrl: string, path: string, options?: RequestOptions) =>
    request<T>(baseUrl, path, { ...options, method: 'DELETE' }),
};
