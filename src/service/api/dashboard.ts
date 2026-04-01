import { request } from '@/service/request';

/** 仪表盘统计数据 */
export interface DashboardStats {
  device: {
    total: number;
    online: number;
    onlineRate: number;
  };
  alert: {
    total: number;
    pending: number;
  };
  farmland: {
    total: number;
    totalArea: number;
  };
  cropCount: number;
}

/** 设备状态分布 */
export interface DeviceStatusDistribution {
  online: number;
  offline: number;
  fault: number;
  maintenance: number;
}

/** 获取仪表盘统计数据 */
export function fetchDashboardStats() {
  return request<DashboardStats>({
    url: '/dashboard/stats',
    method: 'get'
  });
}

/** 获取设备状态分布统计 */
export function fetchDeviceStatusDistribution() {
  return request<DeviceStatusDistribution>({
    url: '/dashboard/deviceStatusDistribution',
    method: 'get'
  });
}

/** 获取告警分布统计 */
export function fetchAlertDistribution() {
  return request<Record<string, number>>({
    url: '/dashboard/alertDistribution',
    method: 'get'
  });
}

/** 获取最近告警列表 */
export function fetchRecentAlerts(limit: number = 5) {
  return request<Api.Env.AlertLog[]>({
    url: '/dashboard/recentAlerts',
    method: 'get',
    params: { limit }
  });
}

/** 成本分布项 */
export interface CostDistributionItem {
  operateType: string;
  totalCost: number;
}

/** 获取成本分布统计 */
export function fetchCostDistribution() {
  return request<CostDistributionItem[]>({
    url: '/dashboard/costDistribution',
    method: 'get'
  });
}

/** 成本趋势项 */
export interface CostTrendItem {
  month: string;
  totalCost: number;
}

/** 获取成本趋势统计 */
export function fetchCostTrend() {
  return request<CostTrendItem[]>({
    url: '/dashboard/costTrend',
    method: 'get'
  });
}
