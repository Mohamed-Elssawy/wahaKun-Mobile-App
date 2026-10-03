import { API_BASE_URLS, API_TIMEOUT_MS } from '@/config/env';

import { API_ENDPOINTS } from './endpoints';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokenStorage';

type Listener = () => void;
const expiredListeners = new Set<Listener>();
const refreshedListeners = new Set<Listener>();
let refreshing: Promise<boolean> | null = null;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
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

async function doRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
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
    if (!response.ok) return false;
    const data = (await response.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!data.accessToken || !data.refreshToken) return false;
    await saveTokens(data.accessToken, data.refreshToken);
    refreshedListeners.forEach(l => l());
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function refreshSession(): Promise<boolean> {
  if (!refreshing)
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  return refreshing;
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
