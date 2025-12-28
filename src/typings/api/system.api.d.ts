declare namespace Api {
  namespace System {
    type User = Common.CommonRecord<{
      userId: CommonType.IdType;
      userName: string;
      password: string;
      realName: string;
      phone: string;
      role: string;
      /** 帐号状态（0正常 1停用） */
      status: Common.EnableStatus;
    }>;

    type UserSearchParams = CommonType.RecordNullable<
      Pick<User, 'userName' | 'realName' | 'phone' | 'status'> & Common.CommonSearchParams
    >;

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>;
  }
}
