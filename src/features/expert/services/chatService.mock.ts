// E-09's list over a seeded fixture; nothing here opens, but the rows need content to walk.
import {
  ENGLISH_CHAT_FROM_EXPERT,
  ENGLISH_CHAT_FROM_FARMER,
  LATIN_FARMER_NAME,
  LONG_ARABIC_FARMER_NAME,
  MIXED_CHAT_MESSAGE,
} from '@/__fixtures__/expertBidi';
import { emptyOnEmptyScenario, failOnErrorScenario, mockDelay } from '@/api/mockScenario';

import type { ChatThread } from '../types';

const LATENCY = { read: 500 } as const;

/** Relative to the device clock, so today/yesterday/older stay true whenever this is demoed. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60_000).toISOString();
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}

/** One of each preview kind, plus the orphan نشطة فقط exists to hide. */
const THREADS: ChatThread[] = [
  {
    id: 'thread-2001',
    reportId: '2001',
    farmerName: 'محمود عبد الرحمن',
    lastMessage: {
      kind: 'text',
      text: 'الموعد مش مناسب لي، ممكن نأجله؟',
      fromExpert: false,
    },
    lastMessageAt: hoursAgo(1),
    isUnread: true,
    isActive: true,
  },
  {
    id: 'thread-2002',
    reportId: '2002',
    farmerName: 'سعاد الفرجاني',
    farmerAvatar: 'https://i.pravatar.cc/150?img=47',
    lastMessage: { kind: 'voice', fromExpert: false },
    lastMessageAt: hoursAgo(20),
    isUnread: true,
    isActive: true,
  },
  {
    id: 'thread-2003',
    reportId: '2003',
    farmerName: 'إبراهيم الشحات',
    lastMessage: { kind: 'text', text: 'تمام، هتوصل الساعة كام؟', fromExpert: true },
    lastMessageAt: daysAgo(3),
    isUnread: false,
    isActive: true,
  },
  // E-10's English content, both directions: tests the ✓✓ receipt against Latin text, same reason ChatThreadRow isolates the body separately.
  {
    id: 'thread-2011',
    reportId: '2011',
    farmerName: LATIN_FARMER_NAME,
    farmerAvatar: 'https://i.pravatar.cc/150?img=33',
    lastMessage: { kind: 'text', text: ENGLISH_CHAT_FROM_EXPERT, fromExpert: true },
    lastMessageAt: hoursAgo(4),
    isUnread: false,
    isActive: true,
  },
  {
    id: 'thread-2011b',
    reportId: '2011',
    farmerName: LATIN_FARMER_NAME,
    lastMessage: { kind: 'text', text: ENGLISH_CHAT_FROM_FARMER, fromExpert: false },
    lastMessageAt: hoursAgo(6),
    isUnread: true,
    isActive: true,
  },
  // Mixed-script message plus the longest name the row can take, proving the timestamp isn't pushed off the leading edge by either.
  {
    id: 'thread-2012',
    reportId: '2012',
    farmerName: LONG_ARABIC_FARMER_NAME,
    lastMessage: { kind: 'text', text: MIXED_CHAT_MESSAGE, fromExpert: false },
    lastMessageAt: daysAgo(1),
    isUnread: true,
    isActive: true,
  },
  {
    id: 'thread-2004',
    reportId: '2004',
    farmerName: 'نادية حسن',
    farmerAvatar: 'https://i.pravatar.cc/150?img=32',
    lastMessage: { kind: 'image', fromExpert: false },
    lastMessageAt: daysAgo(9),
    // Left behind by an Admin reassignment: read-only, and what نشطة فقط exists to hide.
    isUnread: false,
    isActive: false,
  },
];

export async function getThreads(): Promise<ChatThread[]> {
  await mockDelay(LATENCY.read);
  failOnErrorScenario('تعذر تحميل المحادثات');

  return [...emptyOnEmptyScenario(THREADS)];
}
