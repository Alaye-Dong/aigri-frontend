import { get } from '@/service/hook-fetch/request';

export function hookFetchChatStream(queryText: string) {
  return get('/ai/chat', { query: queryText });
}
