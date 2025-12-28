import { request } from '@/service/request';

/** 获取用户信息列表 */
export function fetchGetUserList(params?: Api.System.UserSearchParams) {
  return request<Api.System.UserList>({
    url: '/system/user/list',
    method: 'get',
    params
  });
}
