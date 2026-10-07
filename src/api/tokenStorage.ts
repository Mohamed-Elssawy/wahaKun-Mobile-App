/** In api/ rather than features/auth: client.ts reads tokens, and the reverse would cycle. */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'wahakun_access_token';
const REFRESH_TOKEN_KEY = 'wahakun_refresh_token';

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  // async-storage v3 removed multiSet/multiGet/multiRemove without aliasing them.
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

type Listener = () => void;
const clearedListeners = new Set<Listener>();

/** Fired once the session's tokens are gone, which is both logout (useLogout) and an expired
 * session (expireSession). features/user/role.ts subscribes to drop its cached JWT identity.
 * The listener lives here rather than this file importing role.ts, because api/ reaching into
 * features/ would close a cycle: role.ts -> user/services -> userService.ts -> @/api -> here. */
export function onTokensCleared(listener: Listener): () => void {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeMany([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  clearedListeners.forEach(listener => listener());
}
