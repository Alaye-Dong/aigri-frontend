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

/** 获取仪表盘统计数据 */
export function fetchDashboardStats() {
  return request<DashboardStats>({
    url: '/dashboard/stats',
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
