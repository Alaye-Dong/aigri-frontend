declare namespace Api {
  namespace Env {
    /** 设备信息 */
    type Device = Common.CommonRecord<{
      /** 设备ID */
      id: CommonType.IdType;
      /** 序列号 */
      serialNo: string;
      /** 关联农田ID */
      farmlandId: CommonType.IdType;
      /** 农田名称 - 用于前端展示 */
      farmlandName: string | null;
      /** 设备类型 */
      type: string;
      /** 设备状态 */
      status: Common.EnableStatus;
      /** 最后心跳时间 */
      lastHeartbeat: string | null;
    }>;

    /** 设备搜索参数 */
    type DeviceSearchParams = CommonType.RecordNullable<
      Pick<Device, 'serialNo' | 'farmlandId' | 'type' | 'status'> & Common.CommonSearchParams
    >;

    /** 设备列表 */
    type DeviceList = Common.PaginatingQueryRecord<Device>;

    /** 设备操作参数 */
    type DeviceOperateParams = CommonType.RecordNullable<Device>;
  }
}