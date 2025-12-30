import { request } from '@/service/request';

/** 获取农田地块列表 */
export function fetchGetFarmlandList(params?: Api.Farming.FarmlandSearchParams) {
  return request<Api.Farming.FarmlandList>({
    url: '/farming/farmland/list',
    method: 'get',
    params
  });
}

/** 新增农田地块 */
export function fetchCreateFarmland(data: Api.Farming.FarmlandOperateParams) {
  return request<boolean>({
    url: '/farming/farmland',
    method: 'post',
    data
  });
}

/** 批量删除农田地块 */
export function fetchBatchDeleteFarmland(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/farming/farmland/${ids.join(',')}`,
    method: 'delete'
  });
}

/** 修改农田地块 */
export function fetchUpdateFarmland(data: Api.Farming.FarmlandOperateParams) {
  return request<boolean>({
    url: '/farming/farmland',
    method: 'put',
    data
  });
}

/** 根据地块ID获取详细信息 */
export function fetchGetFarmlandInfo(id?: CommonType.IdType) {
  return request<Api.Farming.Farmland>({
    url: `/farming/farmland/${id}`,
    method: 'get'
  });
}
