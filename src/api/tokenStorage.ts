/**
 * Persists the access/refresh tokens returned by AuthService across app
 * restarts.
 *
 * Lives under api/ rather than features/auth/ because the HTTP client reads the
 * access token to sign requests. In the auth feature it would make api/ depend
 * on features/, inverting the layering and creating an import cycle.
 *
 * The batch calls must stay on the v3 names (setMany/getMany/removeMany).
 * async-storage v3 removed multiSet/multiGet/multiRemove without aliasing them,
 * so the old names are `undefined` on the exported object and throw at runtime
 * rather than failing to compile.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'wahakun_access_token';
const REFRESH_TOKEN_KEY = 'wahakun_refresh_token';

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await AsyncStorage.setMany({
    [ACCESS_TOKEN_KEY]: accessToken ?? '',
    [REFRESH_TOKEN_KEY]: refreshToken ?? '',
  });
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeMany([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}
