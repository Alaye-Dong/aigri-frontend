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

    /** 设备绑定参数 */
    type DeviceBindParams = {
      deviceId: CommonType.IdType;
      farmlandId: CommonType.IdType;
    };

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

    /** 告警日志信息 */
    type AlertLog = Common.CommonRecord<{
      /** 日志ID */
      id: CommonType.IdType;
      /** 关联规则ID */
      ruleId: CommonType.IdType;
      /** 规则名称 - 用于前端展示 */
      ruleName: string;
      /** 农田ID */
      farmlandId: CommonType.IdType;
      /** 农田名称 - 用于前端展示 */
      farmlandName: string;
      /** 设备ID */
      deviceId: CommonType.IdType;
      /** 设备序列号 - 用于前端展示 */
      deviceSerialNo: string;
      /** 告警内容 */
      alertContent: string;
      /** 指标值 */
      metricValue: number;
      /** 告警级别(info, warning, danger) */
      severity: string;
      /** 处理状态: 0-未读, 1-已处理 */
      status: ProcessStatusType;
      /** 创建时间 */
      createTime: string;
    }>;

    type ProcessStatusType = '0' | '1';

    /** 告警日志搜索参数 */
    type AlertLogSearchParams = CommonType.RecordNullable<
      Pick<AlertLog, 'ruleName' | 'farmlandName' | 'deviceSerialNo' | 'status'> & Common.CommonSearchParams
    >;

    /** 告警日志列表 */
    type AlertLogList = Common.PaginatingQueryRecord<AlertLog>;

    /** 告警日志操作参数 */
    type AlertLogOperateParams = CommonType.RecordNullable<AlertLog>;

    type EnvData = Common.CommonRecord<{
      /** 数据ID */
      id: CommonType.IdType;

      /** 设备ID */
      deviceId: CommonType.IdType;

      /** 设备序列号 - 用于前端展示 */
      deviceSerialNo: string;

      /** 农田ID */
      farmlandId: CommonType.IdType;

      /** 农田名称 - 用于前端展示 */
      farmlandName: string;

      /** 空气温度 */
      airTemp?: number;

      /** 空气湿度 */
      airHumidity?: number;

      /** 土壤湿度 */
      soilMoisture?: number;

      /** 光照强度(lux) */
      lightLux?: number;

      /** CO2浓度(ppm) */
      co2Ppm?: number;

      /** 采集时间 */
      collectTime: string;
    }>;

    type EnvDataSearchParams = CommonType.RecordNullable<
      Pick<EnvData, 'deviceSerialNo' | 'farmlandName' | 'deviceId' | 'farmlandId'> & {
        /** 开始时间 */
        startTime?: string;
        /** 结束时间 */
        endTime?: string;
      } & Common.CommonSearchParams
    >;

    type EnvDataList = Common.PaginatingQueryRecord<EnvData>;

    /** MQTT模拟器设备配置 */
    type SimDeviceConfig = {
      /** 设备序列号 */
      serialNo: string;
      /** 设备类型 */
      type: string;
      /** 数据发布间隔(毫秒) */
      dataIntervalMs?: number;
      /** 心跳间隔(毫秒) */
      heartbeatIntervalMs?: number;
      /** 空气温度范围 */
      minAirTemp?: number;
      maxAirTemp?: number;
      /** 空气湿度范围 */
      minAirHumidity?: number;
      maxAirHumidity?: number;
      /** 土壤湿度范围 */
      minSoilMoisture?: number;
      maxSoilMoisture?: number;
      /** 光照强度范围 */
      minLightLux?: number;
      maxLightLux?: number;
      /** CO2浓度范围 */
      minCo2Ppm?: number;
      maxCo2Ppm?: number;
    };

    /** MQTT模拟器设备状态 */
    type SimDeviceStatus = {
      /** 设备序列号 */
      serialNo: string;
      /** 设备类型 */
      type: string;
      /** 运行状态 */
      running: boolean;
      /** 最后数据发布时间 */
      lastDataTime: string | null;
      /** 最后心跳时间 */
      lastHeartbeatTime: string | null;
      /** 消息计数 */
      messageCount: number;
      /** 错误信息 */
      /** MQTT连接状态 */
      mqttConnected: boolean;
    };
  }
}
