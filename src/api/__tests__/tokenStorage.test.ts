import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../tokenStorage';

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('tokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Guards the v3 batch API. The removed multi* names are unaliased and throw
  // at runtime with no compile error, so only a test catches a regression.
  it('uses the v3 batch API, not the removed multi* names', async () => {
    await saveTokens('access-1', 'refresh-1');
    expect(storage.setMany).toHaveBeenCalledTimes(1);
    expect(storage).not.toHaveProperty('multiSet');

    await clearTokens();
    expect(storage.removeMany).toHaveBeenCalledTimes(1);
    expect(storage).not.toHaveProperty('multiRemove');
  });

  it('saves both tokens under their namespaced keys', async () => {
    await saveTokens('access-1', 'refresh-1');

    expect(storage.setMany).toHaveBeenCalledWith({
      wahakun_access_token: 'access-1',
      wahakun_refresh_token: 'refresh-1',
    });
  });

  it('coerces nullish tokens to empty strings rather than storing undefined', async () => {
    await saveTokens(undefined as unknown as string, null as unknown as string);

    expect(storage.setMany).toHaveBeenCalledWith({
      wahakun_access_token: '',
      wahakun_refresh_token: '',
    });
  });

  it('removes both keys on clear', async () => {
    await clearTokens();

    expect(storage.removeMany).toHaveBeenCalledWith([
      'wahakun_access_token',
      'wahakun_refresh_token',
    ]);
  });

  it('reads each token from its own key', async () => {
    storage.getItem.mockResolvedValueOnce('access-1');
    await expect(getAccessToken()).resolves.toBe('access-1');
    expect(storage.getItem).toHaveBeenCalledWith('wahakun_access_token');

    storage.getItem.mockResolvedValueOnce('refresh-1');
    await expect(getRefreshToken()).resolves.toBe('refresh-1');
    expect(storage.getItem).toHaveBeenCalledWith('wahakun_refresh_token');
  });
});
