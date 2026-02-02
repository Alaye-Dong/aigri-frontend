import { post } from '@/service/hook-fetch/request';

export function hookFetchChatStream(queryText: string) {
  return post('/ai/chat', { message: queryText });
}
