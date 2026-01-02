import { request } from '@/service/request';

/** 获取告警日志列表 */
export function fetchGetAlertLogList(params: Api.Env.AlertLogSearchParams) {
  return request<Api.Env.AlertLogList>({
    url: '/env/alertLog/list',
    method: 'get',
    params
  });
}

/** 获取告警日志详情 */
export function fetchGetAlertLogInfo(id: CommonType.IdType) {
  return request<Api.Env.AlertLog>({
    url: `/env/alertLog/${id}`,
    method: 'get'
  });
}

/** 更新告警日志状态 */
export function fetchUpdateAlertLogStatus(data: { id: CommonType.IdType; status: Api.Env.ProcessStatusType }) {
  return request<null>({
    url: '/env/alertLog/status',
    method: 'put',
    data
  });
}

/** 删除告警日志 */
export function fetchDeleteAlertLog(id: CommonType.IdType) {
  return request<null>({
    url: `/env/alertLog/${id}`,
    method: 'delete'
  });
}

/** 批量删除告警日志 */
export function fetchBatchDeleteAlertLog(ids: CommonType.IdType[]) {
  return request<null>({
    url: `/env/alertLog//${ids.join(',')}`,
    method: 'delete',
  });
}
