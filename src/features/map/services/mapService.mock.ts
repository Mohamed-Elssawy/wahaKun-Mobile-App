// Seeded because MapService needs a live backend; laid out across Siwa to reach all three of F-05's zoom states.

import { emptyOnEmptyScenario, failOnErrorScenario, mockDelay } from '@/api/mockScenario';

import type { MapApi, MapIssue } from '../types';

const LATENCY = { all: 600, one: 300 } as const;

const FAILURE = 'Mock: the map service is unavailable in this scenario';

/** Siwa, the same centre the camera opens on. */
const CENTRE = { latitude: 29.2041, longitude: 25.5195 };

// A fifth of a cell apart: clusterIssues buckets by Math.floor(coordinate / cell), so a wider offset can straddle a boundary.
const CANAL_HEAD = { latitude: 29.2057, longitude: 25.5231 };

const SEED: MapIssue[] = [
  {
    id: 'm-1',
    title: 'تسريب كبير في القناة الرئيسية قرب مزرعة النخيل',
    latitude: CANAL_HEAD.latitude,
    longitude: CANAL_HEAD.longitude,
    photoUrl: 'https://picsum.photos/seed/wahakun-map-1/600/450',
    status: 'Reported',
    tier: 'critical',
    createdAt: '2026-06-14T06:20:00Z',
  },
  {
    id: 'm-2',
    title: 'تشقق في جدار القناة عند نفس الموضع',
    latitude: CANAL_HEAD.latitude + 0.00005,
    longitude: CANAL_HEAD.longitude + 0.00003,
    status: 'Diagnosed',
    tier: 'medium',
    createdAt: '2026-06-13T15:05:00Z',
  },
  {
    id: 'm-3',
    title: 'ضعف في ضغط المياه على نفس الخط',
    latitude: CANAL_HEAD.latitude + 0.0001,
    longitude: CANAL_HEAD.longitude + 0.00006,
    status: 'Scheduled',
    tier: 'low',
    createdAt: '2026-06-12T09:40:00Z',
  },
  {
    id: 'm-4',
    title: 'كسر في خط التغذية الفرعي خلف محطة الرفع',
    latitude: CENTRE.latitude + 0.012,
    longitude: CENTRE.longitude - 0.009,
    photoUrl: 'https://picsum.photos/seed/wahakun-map-4/600/450',
    status: 'Assigned',
    tier: 'critical',
    createdAt: '2026-06-11T11:00:00Z',
  },
  {
    id: 'm-5',
    title: 'ملوحة مرتفعة في مياه الري بالقطاع الشرقي',
    latitude: CENTRE.latitude - 0.018,
    longitude: CENTRE.longitude + 0.014,
    status: 'Reviewed',
    tier: 'medium',
    createdAt: '2026-06-10T07:30:00Z',
  },
  {
    id: 'm-6',
    title: 'صوت غير معتاد من مضخة الغرب',
    latitude: CENTRE.latitude + 0.026,
    longitude: CENTRE.longitude + 0.021,
    status: 'Diagnosed',
    tier: 'low',
    createdAt: '2026-06-09T16:45:00Z',
  },
  {
    id: 'm-7',
    title: 'تلف في بوابة التحكم الرئيسية — المدخل الغربي',
    latitude: CENTRE.latitude - 0.031,
    longitude: CENTRE.longitude - 0.024,
    photoUrl: 'https://picsum.photos/seed/wahakun-map-7/600/450',
    status: 'Repaired',
    tier: 'critical',
    createdAt: '2026-06-08T05:15:00Z',
  },
  {
    id: 'm-8',
    title: 'انسداد في القناة الفرعية الشمالية',
    latitude: CENTRE.latitude + 0.041,
    longitude: CENTRE.longitude - 0.033,
    status: 'completed',
    tier: 'resolved',
    createdAt: '2026-06-05T12:00:00Z',
  },
  {
    id: 'm-9',
    title: 'تآكل في الوصلة الرئيسية لخط الري الممتد من محطة الضخ حتى حدود الأرض الشرقية',
    latitude: CENTRE.latitude - 0.044,
    longitude: CENTRE.longitude + 0.038,
    status: 'completed',
    tier: 'resolved',
    createdAt: '2026-06-04T08:20:00Z',
  },
  {
    id: 'm-10',
    title: 'تسرب بسيط عند وصلة أنبوب التغذية الجانبي',
    latitude: CENTRE.latitude + 0.055,
    longitude: CENTRE.longitude + 0.049,
    status: 'Reported',
    tier: 'low',
    createdAt: '2026-06-03T14:10:00Z',
  },
  {
    // No photo and no fix on the title: the peek card has to hold up without either.
    id: 'm-11',
    title: 'بلاغ بدون صورة',
    latitude: CENTRE.latitude - 0.058,
    longitude: CENTRE.longitude - 0.052,
    status: 'Reported',
    tier: 'medium',
    createdAt: '2026-06-02T10:05:00Z',
  },
];

export async function getMapIssues(): Promise<MapIssue[]> {
  await mockDelay(LATENCY.all);
  failOnErrorScenario(FAILURE);

  return [...emptyOnEmptyScenario(SEED)];
}

export async function getMapIssueById(issueId: string): Promise<MapIssue | null> {
  await mockDelay(LATENCY.one);
  failOnErrorScenario(FAILURE);

  return SEED.find(issue => issue.id === issueId) ?? null;
}

export const mapApi: MapApi = { getMapIssues, getMapIssueById };
