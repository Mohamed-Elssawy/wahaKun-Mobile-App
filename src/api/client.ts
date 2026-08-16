/** The one fetch wrapper: JSON headers, timeout, bearer token, non-2xx to ApiError. */

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
  /** Overrides API_TIMEOUT_MS. Multipart uploads need far longer than JSON. */
  timeoutMs?: number;
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
  const {
    method = 'GET',
    body,
    authenticated = false,
    headers = {},
    timeoutMs = API_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders: Record<string, string> = { ...headers };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData) {
    // Setting Content-Type on FormData destroys the boundary and the server cannot parse it.
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

    // Several endpoints return 204 with an empty body, which JSON.parse would throw on.
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
