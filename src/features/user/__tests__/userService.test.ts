import { API_ENDPOINTS } from '@/api';
import { API_BASE_URLS } from '@/config/env';

import { resolveProfilePictureUrl } from '../services/userService';

jest.mock('@/api', () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
}));

describe('resolveProfilePictureUrl', () => {
  it('points an avatar object key straight at the storage endpoint', () => {
    // Storage/upload answers with this shape, and it is already MediaStorage's objectName.
    expect(resolveProfilePictureUrl('profile-pictures/abc-123.png')).toBe(
      `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download('profile-pictures/abc-123.png')}`,
    );
  });

  it('leaves a report-shaped key to the shared resolver', () => {
    expect(resolveProfilePictureUrl('reportimage/abc-123.jpg')).toBe(
      `${API_BASE_URLS.media}/storage?objectName=reportimage%2Fabc-123.jpg`,
    );
  });
});
