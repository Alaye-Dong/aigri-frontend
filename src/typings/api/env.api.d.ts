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

    /** 告警规则信息 */
    type AlertRule = Common.CommonRecord<{
      /** 规则ID */
      id: CommonType.IdType;
      /** 规则名称 */
      ruleName: string;
      /** 关联农田ID */
      farmlandId: CommonType.IdType | null;
      /** 农田名称 - 用于前端展示 */
      farmlandName: string | null;
      /** 监测指标(如: air_temp, soil_moisture) */
      metricType: string;
      /** 条件操作符(>, <, =, >=, <=) */
      conditionOperator: string;
      /** 阈值 */
      thresholdValue: number;
      /** 告警级别(info, warning, danger) */
      severity: string;
      /** 是否启用 */
      isEnabled: boolean;
      /** 创建时间 */
      createTime: string;
    }>;

    /** 告警规则搜索参数 */
    type AlertRuleSearchParams = CommonType.RecordNullable<
      Pick<AlertRule, 'ruleName' | 'farmlandId' | 'metricType' | 'severity' | 'isEnabled'> & Common.CommonSearchParams
    >;

    /** 告警规则列表 */
    type AlertRuleList = Common.PaginatingQueryRecord<AlertRule>;

    /** 告警规则操作参数 */
    type AlertRuleOperateParams = CommonType.RecordNullable<AlertRule>;
  }
}
