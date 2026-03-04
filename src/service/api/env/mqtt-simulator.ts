import { request } from '@/service/request';

/**
 * 获取模拟器设备列表
 */
export function fetchGetSimulatorList() {
  return request<Api.Env.SimDeviceStatus[]>({
    url: '/simulator/devices',
    method: 'get'
  });
}

/**
 * 获取模拟器设备状态
 */
export function fetchGetSimulatorStatus(serialNo: string) {
  return request<Api.Env.SimDeviceStatus>({
    url: `/simulator/devices/${serialNo}`,
    method: 'get'
  });
}

/**
 * 创建模拟器设备
 */
export function fetchCreateSimulator(data: Api.Env.SimDeviceConfig) {
  return request<Api.Env.SimDeviceStatus>({
    url: '/simulator/devices',
    method: 'post',
    data
  });
}

/**
 * 启动模拟器设备
 */
export function fetchStartSimulator(serialNo: string) {
  return request<void>({
    url: `/simulator/devices/${serialNo}/start`,
    method: 'post'
  });
}

/**
 * 停止模拟器设备
 */
export function fetchStopSimulator(serialNo: string) {
  return request<void>({
    url: `/simulator/devices/${serialNo}/stop`,
    method: 'post'
  });
}

/**
 * 移除模拟器设备
 */
export function fetchRemoveSimulator(serialNo: string) {
  return request<void>({
    url: `/simulator/devices/${serialNo}`,
    method: 'delete'
  });
}

/**
 * 启动所有模拟器设备
 */
export function fetchStartAllSimulators() {
  return request<void>({
    url: '/simulator/start-all',
    method: 'post'
  });
}

/**
 * 停止所有模拟器设备
 */
export function fetchStopAllSimulators() {
  return request<void>({
    url: '/simulator/stop-all',
    method: 'post'
  });
}
