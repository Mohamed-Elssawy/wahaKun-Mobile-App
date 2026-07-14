/**
 * Persists the access/refresh tokens returned by AuthService across app
 * restarts, using AsyncStorage.
 *
 * NOTE: this file requires the AsyncStorage package. If it's not installed
 * yet, run:
 *   npm install @react-native-async-storage/async-storage
 *   cd ios && pod install
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'wahakun_access_token';
const REFRESH_TOKEN_KEY = 'wahakun_refresh_token';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken ?? ''],
    [REFRESH_TOKEN_KEY, refreshToken ?? ''],
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}
