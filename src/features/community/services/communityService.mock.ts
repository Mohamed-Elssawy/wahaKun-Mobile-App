// Seeded feed for when CommunityService has no GetFeed, so F-01 can show the author and counts the real path cannot; ./index.ts picks one.

import { isResolvedStatus } from '@/features/reports/status';

import { distanceKm } from '../distance';

import type { CommentsPage, CommunityApi, FeedPage, FeedPost, FeedQuery } from '../types';

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

const LATENCY = { feed: 700, comments: 500 } as const;

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

// The four posts on F-01, in the order the frame lists them.
const SEED: FeedPost[] = [
  {
    issueId: 'i-1043',
    title: 'تسريب كبير في القناة الرئيسية قرب مزرعة النخيل — المياه تفقد بشكل ملحوظ',
    photoUrl: 'https://picsum.photos/seed/wahakun-canal/900/600',
    status: 'Reported',
    tier: 'critical',
    createdAt: hoursAgo(0.75),
    latitude: 29.2048,
    longitude: 25.5203,
    reporterId: 'u-1',
    reporterName: 'محمود مصطفى',
    confirmations: 4,
    commentCount: 7,
    shareCount: 2,
    hasConfirmed: false,
  },
  {
    issueId: 'i-1044',
    title: 'انخفاض ملحوظ في ضغط المياه في القطاع الشرقي، يؤثر على الري الصباحي',
    status: 'Scheduled',
    tier: 'low',
    createdAt: hoursAgo(2),
    latitude: 29.2131,
    longitude: 25.5312,
    reporterId: 'u-2',
    reporterName: 'سيد حسن',
    confirmations: 2,
    commentCount: 4,
    shareCount: 2,
    hasConfirmed: false,
  },
  {
    issueId: 'i-1045',
    title: 'تسريب في أنبوب التغذية الرئيسي',
    photoUrl: 'https://picsum.photos/seed/wahakun-pipe/900/600',
    status: 'Diagnosed',
    tier: 'medium',
    createdAt: hoursAgo(24),
    latitude: 29.2122,
    longitude: 25.5288,
    reporterId: 'u-3',
    reporterName: 'فاطمة سالم',
    confirmations: 3,
    commentCount: 5,
    shareCount: 1,
    hasConfirmed: true,
  },
  {
    issueId: 'i-1046',
    title: 'انسداد كامل في قناة فرعية — المياه تتجمع وتتسبب في أضرار للمحاصيل المجاورة',
    status: 'Completed',
    tier: 'resolved',
    createdAt: hoursAgo(72),
    latitude: 29.2312,
    longitude: 25.5498,
    reporterId: 'u-4',
    reporterName: 'أحمد حسين',
    confirmations: 6,
    commentCount: 8,
    shareCount: 4,
    hasConfirmed: false,
  },
];

// F-04's thread, including the expert reply that earns the خبير معتمد badge.
const COMMENTS = [
  {
    id: 'c-1',
    issueId: 'i-1043',
    authorId: 'u-2',
    authorName: 'سيد حسن',
    isExpert: false,
    text: 'لاحظت نفس الشيء في القناة الفرعية القريبة أيضًا. يبدو أن المشكلة تمتد.',
    createdAt: hoursAgo(0.5),
  },
  {
    id: 'c-2',
    issueId: 'i-1043',
    authorId: 'u-4',
    authorName: 'أحمد حسين',
    isExpert: false,
    text: 'المياه وصلت إلى حدود أرضي. نحتاج تدخل سريع.',
    createdAt: hoursAgo(0.5),
  },
  {
    id: 'c-3',
    issueId: 'i-1043',
    authorId: 'u-9',
    authorName: 'سارة محمود',
    isExpert: true,
    text: 'تم استلام البلاغ وسيتم إرسال فريق للفحص الميداني خلال 24-48 ساعة. يُرجى عدم محاولة الإصلاح بشكل شخصي.',
    createdAt: hoursAgo(0.5),
  },
  {
    id: 'c-4',
    issueId: 'i-1043',
    authorId: 'u-3',
    authorName: 'فاطمة سالم',
    isExpert: false,
    text: 'شكرًا للخبيرة سارة. هل يمكن معرفة موعد الفريق تحديدًا؟',
    createdAt: hoursAgo(0.5),
  },
];

const MATCHES: Record<FeedQuery['filter'], (post: FeedPost) => boolean> = {
  all: () => true,
  critical: post => post.tier === 'critical',
  nearby: () => true,
  inProgress: post => !isResolvedStatus(post.status),
  resolved: post => isResolvedStatus(post.status),
};

export async function getFeed(query: FeedQuery): Promise<FeedPage> {
  await delay(LATENCY.feed);

  let posts = SEED.filter(MATCHES[query.filter]);

  if (query.filter === 'nearby' && query.origin) {
    const origin = query.origin;
    posts = [...posts].sort(
      (a, b) =>
        distanceKm(origin, { latitude: a.latitude!, longitude: a.longitude! }) -
        distanceKm(origin, { latitude: b.latitude!, longitude: b.longitude! }),
    );
  }

  const start = (query.page - 1) * query.pageSize;
  const slice = posts.slice(start, start + query.pageSize);

  return { posts: slice, hasMore: start + slice.length < posts.length };
}

export async function getComments(
  issueId: string,
  page: number,
  pageSize: number,
): Promise<CommentsPage> {
  await delay(LATENCY.comments);

  const all = COMMENTS.filter(comment => comment.issueId === issueId);
  const start = (page - 1) * pageSize;
  const slice = all.slice(start, start + pageSize);

  return {
    comments: slice,
    total: all.length,
    hasMore: start + slice.length < all.length,
  };
}

export const communityApi: CommunityApi = { getFeed, getComments };
