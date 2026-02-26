import { request } from '@/service/request';

/** 获取智能建议列表 */
export function fetchGetSuggestionList(params: Api.Ai.SuggestionSearchParams) {
  return request<Api.Ai.SuggestionList>({
    url: '/ai/suggestion/record/list',
    method: 'get',
    params
  });
}

/** 获取智能建议详情 */
export function fetchGetSuggestionInfo(id: CommonType.IdType) {
  return request<Api.Ai.Suggestion>({
    url: `/ai/suggestion/record/${id}`,
    method: 'get'
  });
}

/** 采纳智能建议 */
export function fetchAdoptSuggestion(id: CommonType.IdType) {
  return request<boolean>({
    url: `/ai/suggestion/record/adopt/${id}`,
    method: 'put'
  });
}

/** 批量删除智能建议 */
export function fetchBatchDeleteSuggestion(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/ai/suggestion/record/${ids.join(',')}`,
    method: 'delete'
  });
}