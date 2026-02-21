import { request } from '@/service/request';

export interface DeviceData {
  id?: CommonType.IdType;
  serialNo: string;
  farmlandId: CommonType.IdType;
  type: string;
  status: Api.Common.EnableStatus;
  lastHeartbeat?: string | null;
}

export interface DeviceBindParams {
  deviceId: CommonType.IdType;
  farmlandId: CommonType.IdType;
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
    url: `/env/device/${ids.join(',')}`,
    method: 'delete'
  });
}

export function fetchBindDevice(data: Api.Env.DeviceBindParams) {
  return request<void>({
    url: '/env/device/bind',
    method: 'post',
    data
  });
}

export function fetchUnbindDevice(id: CommonType.IdType) {
  return request<void>({
    url: `/env/device/${id}/unbind`,
    method: 'post'
  });
}

export function fetchGetOnlineDevices() {
  return request<Api.Env.Device[]>({
    url: '/env/device/online',
    method: 'get'
  });
}

export function fetchSendDeviceCommand(id: CommonType.IdType, command: string) {
  return request<void>({
    url: `/env/device/${id}/command`,
    method: 'post',
    params: { command }
  });
}

export function fetchGetDeviceStatus(id: CommonType.IdType) {
  return request<Api.Env.Device>({
    url: `/env/device/${id}/status`,
    method: 'get'
  });
}
