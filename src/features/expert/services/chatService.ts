// No chat endpoint exists at all yet - E-10, the message list and the composer are a separate
// unit. See USE_MOCK_EXPERT_CHATS in config/env.

import type { ChatThread } from '../types';

const NO_CHAT_ENDPOINT = 'No chat-facing endpoint exists yet.';

export async function getThreads(): Promise<ChatThread[]> {
  throw new Error(NO_CHAT_ENDPOINT);
}
