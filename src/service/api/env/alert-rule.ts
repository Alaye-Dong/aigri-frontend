import { request } from '@/service/request';

/** 获取告警规则列表 */
export function fetchGetAlertRuleList(params: Api.Env.AlertRuleSearchParams) {
  return request<Api.Env.AlertRuleList>({
    url: '/env/alert-rule/list',
    method: 'get',
    params
  });
}

/** 获取告警规则详情 */
export function fetchGetAlertRuleInfo(id: CommonType.IdType) {
  return request<Api.Env.AlertRule>({
    url: `/env/alert-rule/info/${id}`,
    method: 'get'
  });
}

/** 创建告警规则 */
export function fetchCreateAlertRule(data: Api.Env.AlertRuleOperateParams) {
  return request<null>({
    url: '/env/alert-rule/create',
    method: 'post',
    data
  });
}

/** 更新告警规则 */
export function fetchUpdateAlertRule(data: Api.Env.AlertRuleOperateParams) {
  return request<null>({
    url: '/env/alert-rule/update',
    method: 'put',
    data
  });
}

/** 删除告警规则 */
export function fetchDeleteAlertRule(id: CommonType.IdType) {
  return request<null>({
    url: `/env/alert-rule/delete/${id}`,
    method: 'delete'
  });
}

/** 批量删除告警规则 */
export function fetchBatchDeleteAlertRule(ids: CommonType.IdType[]) {
  return request<null>({
    url: '/env/alert-rule/batch-delete',
    method: 'delete',
    data: ids
  });
}

/** 更新告警规则状态 */
export function fetchUpdateAlertRuleStatus(data: { id: CommonType.IdType; status: Api.Common.EnableStatus }) {
  return request<null>({
    url: '/env/alert-rule/status',
    method: 'put',
    data
  });
}