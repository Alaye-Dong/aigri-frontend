import { post } from '@/service/hook-fetch/request';
import { request } from '@/service/request';

export function hookFetchChatStream(queryText: string) {
  return post('/ai/chat', { message: queryText });
}

export function fetchGetChatHistory(params: { current?: number; size?: number }) {
  return request<Api.Ai.ChatHistoryList>({
    url: '/ai/chat/history',
    method: 'get',
    params
  });
}

export function fetchClearChatHistory() {
  return request<void>({
    url: '/ai/chat/history',
    method: 'delete'
  });
}
