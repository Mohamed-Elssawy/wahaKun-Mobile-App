// E-09's list over an always-empty fixture: E-10 and the first real thread are a separate
// unit, so there is nothing to seed yet. The error/latency scenarios stay wired so this
// screen's loading and error states are walkable even before content exists.
import { failOnErrorScenario, mockDelay } from '@/api/mockScenario';

import type { ChatThread } from '../types';

const LATENCY = { read: 500 } as const;

export async function getThreads(): Promise<ChatThread[]> {
  await mockDelay(LATENCY.read);
  failOnErrorScenario('تعذر تحميل المحادثات');

  return [];
}
