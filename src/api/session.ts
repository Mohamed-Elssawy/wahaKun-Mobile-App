import { API_BASE_URLS, API_TIMEOUT_MS } from '@/config/env';

import { API_ENDPOINTS } from './endpoints';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokenStorage';

type Listener = () => void;
/** `network` = the server was never reached, so the session may still be good; boot keeps it. */
export type RefreshOutcome = 'refreshed' | 'refused' | 'network';
const expiredListeners = new Set<Listener>();
const refreshedListeners = new Set<Listener>();
let refreshing: Promise<RefreshOutcome> | null = null;

/** The payload only; the server validates what it issued. One decoder, shared with api/jwt.ts. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map(c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null, skewSeconds = 30): boolean {
  if (!token) return true;
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

/** A gateway, proxy or ingress answering for a service that never saw the token. */
const GATEWAY_OUTAGE: ReadonlySet<number> = new Set([502, 503, 504]);

/** Defensive: a throw here would be reported as network, which is the failure this prevents. */
function contentTypeOf(response: Response): string {
  return response.headers?.get('content-type') ?? '';
}

async function doRefresh(): Promise<RefreshOutcome> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return 'refused';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${API_BASE_URLS.auth}${API_ENDPOINTS.auth.refreshToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ RefreshToken: refreshToken }),
        signal: controller.signal,
      },
    );
    // A response AuthService produced is a refusal; a gateway status or HTML means it never arrived.
    if (GATEWAY_OUTAGE.has(response.status)) return 'network';
    if (contentTypeOf(response).includes('text/html')) return 'network';
    if (!response.ok) return 'refused';
    const data = (await response.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!data.accessToken || !data.refreshToken) return 'refused';
    await saveTokens(data.accessToken, data.refreshToken);
    refreshedListeners.forEach(l => l());
    return 'refreshed';
  } catch {
    return 'network';
  } finally {
    clearTimeout(timeout);
  }
}

/** Single-flight: concurrent 401s share one refresh, since a refresh token is single-use. */
export function refreshSessionOutcome(): Promise<RefreshOutcome> {
  if (!refreshing)
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function refreshSession(): Promise<boolean> {
  return (await refreshSessionOutcome()) === 'refreshed';
}

export function onSessionExpired(listener: Listener): () => void {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}
export function onSessionRefreshed(listener: Listener): () => void {
  refreshedListeners.add(listener);
  return () => {
    refreshedListeners.delete(listener);
  };
}
export async function getValidAccessToken(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;
  if (!isTokenExpired(token)) return token;
  return (await refreshSession()) ? getAccessToken() : null;
}

let expiring = false;
export async function expireSession(): Promise<void> {
  if (expiring) return;
  expiring = true;
  try {
    await clearTokens();
    expiredListeners.forEach(l => l());
  } finally {
    expiring = false;
  }
}
/* eslint-disable no-bitwise -- base64 is bit packing; the rule has nothing to catch here. */
function atob(padded: string): string[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  let buffer = 0;
  let bitCount = 0;

  for (const char of padded.replace(/[=]+$/, '')) {
    const value = alphabet.indexOf(char);
    if (value === -1) throw new Error('Invalid base64 string');
    buffer = (buffer << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((buffer >> bitCount) & 0xff);
    }
  }

  return bytes.map(byte => String.fromCharCode(byte));
}
/* eslint-enable no-bitwise */
