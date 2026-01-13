import { request } from '@/service/request';

export function fetchGetEnvDataList(params: Api.Env.EnvDataSearchParams) {
  return request<Api.Env.EnvDataList>({
    url: '/env/envData/list',
    method: 'get',
    params
  });
}

export function fetchGetLatestByFarmland(farmlandId: CommonType.IdType) {
  return request<Api.Env.EnvData>({
    url: `env/envData/latestByFarmland/${farmlandId}`,
    method: 'get'
  });
}

export function fetchGetLatestByDevice(deviceId: CommonType.IdType) {
  return request<Api.Env.EnvData>({
    url: `env/envData/latestByDevice/${deviceId}`,
    method: 'get'
  });
}
