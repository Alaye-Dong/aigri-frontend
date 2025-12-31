import { request } from '@/service/request';

export interface FarmingLogData {
  id?: CommonType.IdType;
  farmlandId: CommonType.IdType;
  cropId?: CommonType.IdType | null;
  userId?: CommonType.IdType | null;
  operateType: string;
  content?: string | null;
  cost?: number | null;
  images?: string | null;
  operateTime: string;
}

export function fetchGetFarmingLogList(params: Api.Farming.FarmingLogSearchParams) {
  return request<Api.Farming.FarmingLogList>({
    url: '/farming/log/list',
    method: 'get',
    params
  });
}

export function fetchGetFarmingLogInfo(id: CommonType.IdType) {
  return request<Api.Farming.FarmingLog>({
    url: `/farming/log/${id}`,
    method: 'get'
  });
}

export function fetchCreateFarmingLog(data: Api.Farming.FarmingLogOperateParams) {
  return request<Api.Farming.FarmingLog>({
    url: '/farming/log',
    method: 'post',
    data
  });
}

export function fetchUpdateFarmingLog(data: Api.Farming.FarmingLogOperateParams) {
  return request<Api.Farming.FarmingLog>({
    url: '/farming/log',
    method: 'put',
    data
  });
}

export function fetchBatchDeleteFarmingLog(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: '/farming/log',
    method: 'delete',
    data: ids
  });
}
