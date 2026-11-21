/** Import expertApi/chatApi from here, never the implementations, so the flag is the switch. */
import { USE_MOCK_EXPERT_CHATS, USE_MOCK_EXPERT_QUEUE } from '@/config/env';

import * as chatReal from './chatService';
import * as chatMock from './chatService.mock';
import * as real from './expertService';
import * as mock from './expertService.mock';

import type { ChatApi, ExpertApi } from '../types';

export const expertApi: ExpertApi = USE_MOCK_EXPERT_QUEUE ? mock : real;

/** Its own flag: no chat endpoint exists at all yet, independent of the expert queue. */
export const chatApi: ChatApi = USE_MOCK_EXPERT_CHATS ? chatMock : chatReal;
