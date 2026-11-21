import { API_ENDPOINTS } from '@/api';
import { API_BASE_URLS } from '@/config/env';

import {
  profilePictureStorageUrl,
  resolveProfilePictureUrl,
  uploadProfilePicture,
} from '../services/userService';

const mockPost = jest.fn();

jest.mock('@/api', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
    post: (...args: unknown[]) => mockPost(...args),
  },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
}));

// jest.setup's stub never returns what it stored, and the local photo index is a read path here.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
      setItem: (key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        store.delete(key);
        return Promise.resolve();
      },
    },
  };
});

describe('profilePictureStorageUrl', () => {
  it('points an avatar object key straight at the storage endpoint', () => {
    // Storage/upload answers with this shape, and it is already MediaStorage's objectName.
    expect(profilePictureStorageUrl('profile-pictures/abc-123.png')).toBe(
      `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download('profile-pictures/abc-123.png')}`,
    );
  });

  it('leaves a report-shaped key to the shared resolver', () => {
    expect(profilePictureStorageUrl('reportimage/abc-123.jpg')).toBe(
      `${API_BASE_URLS.media}/Storage?objectName=reportimage%2Fabc-123.jpg`,
    );
  });
});

// STORAGE_SERVES_BYTES is on, so a key with no local file resolves to the storage endpoint.
describe('resolveProfilePictureUrl', () => {
  it.each(['profile-pictures/abc-123.png', 'reportimage/abc-123.jpg'])(
    'resolves the object key %s to the storage endpoint',
    key => {
      expect(resolveProfilePictureUrl(key)).toBe(profilePictureStorageUrl(key));
    },
  );

  // uploadProfilePicture on the mock hands back the picked file's own path, and it must render.
  it.each([
    'file:///data/user/0/com.myapp/cache/avatar.jpg',
    'https://cdn.example/a.png',
  ])(
    'passes %s through, since nothing has to be fetched from storage to show it',
    uri => {
      expect(resolveProfilePictureUrl(uri)).toBe(uri);
    },
  );
});

// The upload response is the one place the key and the local file meet.
describe('the avatar this device uploaded', () => {
  const KEY = 'profile-pictures/abc-123.png';
  const LOCAL = 'file:///data/user/0/com.myapp/cache/avatar.jpg';

  it('renders from the local file once the upload has named its key', async () => {
    mockPost.mockResolvedValue({ fileName: 'abc-123.png', filePath: KEY, fileUrl: '' });

    const stored = await uploadProfilePicture({ uri: LOCAL, type: 'image/png' });

    // What goes to User/update is still the server's key, unchanged - only the drawing is local.
    expect(stored).toBe(KEY);
    expect(resolveProfilePictureUrl(KEY)).toBe(LOCAL);
  });

  // Another account's avatar: storage answers for it, since this device holds no file.
  it('falls back to storage for a key this device has no file for', () => {
    const other = 'profile-pictures/someone-else.png';

    expect(resolveProfilePictureUrl(other)).toBe(profilePictureStorageUrl(other));
  });
});
