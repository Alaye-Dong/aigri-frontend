import { request } from '@/service/request';

/** 获取作物列表 */
export function fetchGetCropList(params?: Api.Farming.CropSearchParams) {
  return request<Api.Farming.CropList>({
    url: '/farming/crop/list',
    method: 'get',
    params
  });
}

/** 新增作物 */
export function fetchCreateCrop(data: Api.Farming.CropOperateParams) {
  return request<boolean>({
    url: '/farming/crop',
    method: 'post',
    data
  });
}

/** 批量删除作物 */
export function fetchBatchDeleteCrop(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: `/farming/crop/${ids.join(',')}`,
    method: 'delete'
  });
}

/** 修改作物 */
export function fetchUpdateCrop(data: Api.Farming.CropOperateParams) {
  return request<boolean>({
    url: '/farming/crop',
    method: 'put',
    data
  });
}

/** 根据作物ID获取详细信息 */
export function fetchGetCropInfo(id?: CommonType.IdType) {
  return request<Api.Farming.Crop>({
    url: `/farming/crop/${id}`,
    method: 'get'
  });
}
