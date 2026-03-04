import { request } from '@/service/request';

/** 获取建议类型枚举 */
export function fetchSuggestionTypes() {
  return request<Api.Ai.SuggestionTypeItem[]>({
    url: '/ai/proactive-suggestion/types',
    method: 'get'
  });
}

/** 获取紧急程度枚举 */
export function fetchUrgencyLevels() {
  return request<Api.Ai.UrgencyLevelItem[]>({
    url: '/ai/proactive-suggestion/urgency-levels',
    method: 'get'
  });
}

/** 生成智能建议 */
export function fetchGenerateSuggestion(farmlandId: number, suggestionType?: string) {
  return request<Api.Ai.StructuredSuggestion>({
    url: '/ai/proactive-suggestion/generate',
    method: 'post',
    params: { farmlandId, suggestionType }
  });
}

/** 生成紧急建议 */
export function fetchGenerateUrgentSuggestions(farmlandId: number) {
  return request<Api.Ai.StructuredSuggestion[]>({
    url: '/ai/proactive-suggestion/generate-urgent',
    method: 'post',
    params: { farmlandId }
  });
}

/** 生成并推送建议 */
export function fetchGenerateAndPushSuggestion(farmlandId: number, suggestionType: string) {
  return request<void>({
    url: '/ai/proactive-suggestion/generate-and-push',
    method: 'post',
    params: { farmlandId, suggestionType }
  });
}

/** 分页获取建议列表 */
export function fetchGetSuggestionPage(params: Api.Ai.SuggestionSearchParams) {
  return request<Api.Ai.SuggestionList>({
    url: '/ai/proactive-suggestion/page',
    method: 'get',
    params
  });
}

/** 获取建议详情 */
export function fetchGetSuggestionInfo(id: CommonType.IdType) {
  return request<Api.Ai.Suggestion>({
    url: `/ai/proactive-suggestion/${id}`,
    method: 'get'
  });
}

/** 获取当前用户的建议列表 */
export function fetchMySuggestions() {
  return request<Api.Ai.Suggestion[]>({
    url: '/ai/proactive-suggestion/my',
    method: 'get'
  });
}

/** 获取当前用户的紧急建议 */
export function fetchUrgentSuggestions() {
  return request<Api.Ai.Suggestion[]>({
    url: '/ai/proactive-suggestion/urgent',
    method: 'get'
  });
}

/** 标记建议为已采纳 */
export function fetchAdoptSuggestion(id: CommonType.IdType) {
  return request<void>({
    url: `/ai/proactive-suggestion/${id}/adopt`,
    method: 'put'
  });
}

/** 清理过期建议 */
export function fetchCleanupSuggestions(days: number = 30) {
  return request<number>({
    url: '/ai/proactive-suggestion/cleanup',
    method: 'delete',
    params: { days }
  });
}
