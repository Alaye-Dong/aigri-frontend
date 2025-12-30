import { request } from '@/service/request';

/** 获取用户信息列表 */
export function fetchGetUserList(params?: Api.System.UserSearchParams) {
  return request<Api.System.UserList>({
    url: '/system/user/list',
    method: 'get',
    params
  });
}

/** 新增用户信息 */
export function fetchCreateUser(data: Api.System.UserOperateParams) {
  return request<boolean>({
    url: '/system/user',
    method: 'post',
    data
  });
}

/** 批量删除用户信息 */
export function fetchBatchDeleteUser(userIds: CommonType.IdType[]) {
  return request<boolean>({
    url: `/system/user/${userIds.join(',')}`,
    method: 'delete'
  });
}

/** 修改用户信息 */
export function fetchUpdateUser(data: Api.System.UserOperateParams) {
  return request<boolean>({
    url: '/system/user',
    method: 'put',
    data
  });
}

/** 修改用户状态 */
export function fetchUpdateUserStatus(data: Api.System.UserOperateParams) {
  return request<boolean>({
    url: '/system/user/changeStatus',
    method: 'put',
    data
  });
}

/** 根据用户编号获取详细信息 */
export function fetchGetUserInfo(userId?: CommonType.IdType) {
  return request<Api.System.User>({
    url: `/system/user/${userId}`,
    method: 'get'
  });
}
