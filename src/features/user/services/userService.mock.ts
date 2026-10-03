// A signed-in farmer for DEMO_MODE. Without one the header, the profile and the ownership
// gate on F-04 all sit empty, because UserService is the only thing that answers "who am I".

import { mockDelay } from '@/api/mockScenario';
import type { PickedImage } from '@/types/image';

import type { UserApi, UserDetails, UserUpdateRequest } from '../types';

const LATENCY = { read: 300, write: 400 } as const;

/**
 * The same id reportService.mock stamps on every seeded report, so the F-04 tracker link
 * appears for this farmer's own reports and stays hidden on the community feed's.
 */
export const DEMO_USER_ID = '8f1c2b1e-0000-4000-8000-000000000001';

const ME: UserDetails = {
  id: DEMO_USER_ID,
  fullName: 'يوسف زين',
  email: 'farmer@wahakun.local',
  phoneNumber: '+201000000001',
  picture: '',
  village: 'شالي',
  region: 'واحة سيوة',
  // The committed MOCK_ROLE is what resolveRole actually answers with; these keep the record
  // internally consistent for anything reading UserDetails directly.
  role: 'farmer',
  status: 'approved',
};

/** The feed's and the thread's authors, so a comment resolves a name instead of the fallback. */
const OTHERS: Readonly<Record<string, string>> = {
  'u-1': 'محمود مصطفى',
  'u-2': 'سيد حسن',
  'u-3': 'فاطمة سالم',
  'u-4': 'أحمد حسين',
  'u-5': 'عبد الرحمن الشيخ',
  'u-6': 'ناصر عبد العظيم',
  'u-7': 'سعاد المرسي',
  'u-9': 'سارة محمود',
};

let me: UserDetails = { ...ME };

export async function getUserDetails(userId?: string): Promise<UserDetails> {
  await mockDelay(LATENCY.read);

  if (!userId || userId === me.id) {
    return { ...me };
  }

  // Unknown ids resolve to a blank name rather than throwing: the real service answers 404
  // and communityService already falls back to a placeholder.
  return { ...ME, id: userId, fullName: OTHERS[userId] ?? '', picture: '' };
}

export async function updateUserDetails(payload: UserUpdateRequest): Promise<void> {
  await mockDelay(LATENCY.write);
  me = { ...me, ...payload };
}

export async function uploadProfilePicture(image: PickedImage): Promise<string> {
  await mockDelay(LATENCY.write);
  // The picker's local uri stands in for the object key; resolveProfilePictureUrl passes a
  // file:// path straight through, so the new avatar renders.
  return image.uri;
}

export const userApi: UserApi = {
  getUserDetails,
  updateUserDetails,
  uploadProfilePicture,
};
