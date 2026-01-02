import { request } from '@/service/request';

export interface DeviceData {
  id?: CommonType.IdType;
  serialNo: string;
  farmlandId: CommonType.IdType;
  type: string;
  status: Api.Common.EnableStatus;
  lastHeartbeat?: string | null;
}

export function fetchGetDeviceList(params: Api.Env.DeviceSearchParams) {
  return request<Api.Env.DeviceList>({
    url: '/env/device/list',
    method: 'get',
    params
  });
}

export function fetchGetDeviceInfo(id: CommonType.IdType) {
  return request<Api.Env.Device>({
    url: `/env/device/${id}`,
    method: 'get'
  });
}

export function fetchCreateDevice(data: Api.Env.DeviceOperateParams) {
  return request<Api.Env.Device>({
    url: '/env/device',
    method: 'post',
    data
  });
}

export function fetchUpdateDevice(data: Api.Env.DeviceOperateParams) {
  return request<Api.Env.Device>({
    url: '/env/device',
    method: 'put',
    data
  });
}

export function fetchBatchDeleteDevice(ids: CommonType.IdType[]) {
  return request<boolean>({
    url: '/env/device',
    method: 'delete',
    data: ids
  });
}