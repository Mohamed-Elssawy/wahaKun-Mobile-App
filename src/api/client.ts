import { API_TIMEOUT_MS, LOG_API_ERRORS } from '@/config/env';

import { ApiError } from './errors';
import { expireSession, getValidAccessToken, refreshSession } from './session';

import type { ApiErrorDetails } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  authenticated?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
  isRetry?: boolean;
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}
function firstString(r: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}
function toFieldErrors(value: unknown): Record<string, string[]> | undefined {
  const r = asRecord(value);
  if (!r) return undefined;
  const out: Record<string, string[]> = {};
  for (const [f, m] of Object.entries(r)) {
    if (Array.isArray(m)) out[f] = m.filter((x): x is string => typeof x === 'string');
    else if (typeof m === 'string') out[f] = [m];
  }
  return Object.keys(out).length ? out : undefined;
}

function parseErrorBody(
  data: unknown,
): Pick<ApiErrorDetails, 'code' | 'serverMessage' | 'fieldErrors' | 'traceId'> {
  const r = asRecord(data);
  if (!r) {
    const text = typeof data === 'string' ? data.trim() : '';
    return {
      serverMessage: text && !text.startsWith('<') ? text.slice(0, 300) : undefined,
    };
  }
  const fieldErrors = toFieldErrors(r.errors);
  const code =
    firstString(r, ['code', 'errorCode']) ??
    (fieldErrors ? 'VALIDATION_FAILED' : undefined);
  let serverMessage = firstString(r, ['message', 'detail', 'title', 'error']);
  if (!serverMessage && fieldErrors) serverMessage = Object.values(fieldErrors).flat()[0];
  return { code, serverMessage, fieldErrors, traceId: firstString(r, ['traceId']) };
}

function logFailure(error: ApiError): void {
  // eslint-disable-next-line no-console
  if (LOG_API_ERRORS) console.warn(error.toLogString(), error.details.fieldErrors ?? '');
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
    isRetry = false,
  } = options;
  const url = `${baseUrl}${path}`;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...headers,
  };
  if (!isFormData && body !== undefined)
    finalHeaders['Content-Type'] = 'application/json; charset=utf-8';
  if (authenticated) {
    const token = await getValidAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isFormData
        ? (body as FormData)
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const error = isAbort
      ? ApiError.timeout({ method, url, cause: err })
      : ApiError.network({ method, url, cause: err });
    logFailure(error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;
  if (response.ok) return data as T;

  if (response.status === 401 && authenticated && !isRetry) {
    if (await refreshSession())
      return request<T>(baseUrl, path, { ...options, isRetry: true });
    await expireSession();
  }

  const error = ApiError.fromResponse(response.status, {
    method,
    url,
    body: data,
    ...parseErrorBody(data),
  });
  logFailure(error);
  throw error;
}

export const apiClient = {
  get: <T>(b: string, p: string, o?: RequestOptions) =>
    request<T>(b, p, { ...o, method: 'GET' }),
  post: <T>(b: string, p: string, body?: unknown, o?: RequestOptions) =>
    request<T>(b, p, { ...o, method: 'POST', body }),
  put: <T>(b: string, p: string, body?: unknown, o?: RequestOptions) =>
    request<T>(b, p, { ...o, method: 'PUT', body }),
  patch: <T>(b: string, p: string, body?: unknown, o?: RequestOptions) =>
    request<T>(b, p, { ...o, method: 'PATCH', body }),
  delete: <T>(b: string, p: string, o?: RequestOptions) =>
    request<T>(b, p, { ...o, method: 'DELETE' }),
};
