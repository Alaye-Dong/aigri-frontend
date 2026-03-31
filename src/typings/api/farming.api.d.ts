declare namespace Api {
  namespace Farming {
    /** 作物状态 (1:种植中, 2:已收获, 3:已废弃) */
    type CropStatus = 1 | 2 | 3;
    /** 农田地块 */
    type Farmland = Common.CommonRecord<{
      /** 地块ID */
      id: CommonType.IdType;
      /** 所属用户ID */
      userId: CommonType.IdType;
      /** 所属用户姓名(关联查询) */
      userRealName: string | null;
      /** 地块名称 */
      name: string;
      /** 面积(亩) */
      areaSize: number | null;
      /** 位置 */
      location: string | null;
      /** 土壤类型 */
      soilType: string | null;
      /** 描述 */
      description: string | null;
      /** 地块多边形路径点坐标 */
      polygonPath: string | null;
    }>;

    /** 农田地块搜索参数 */
    type FarmlandSearchParams = CommonType.RecordNullable<
      Pick<Farmland, 'name' | 'location' | 'soilType'> & Common.CommonSearchParams
    >;

    /** 农田地块列表 */
    type FarmlandList = Common.PaginatingQueryRecord<Farmland>;

    /** 农田地块操作参数 */
    type FarmlandOperateParams = CommonType.RecordNullable<Farmland>;

    /** 土壤类型选项 */
    type SoilTypeOption = {
      label: string;
      value: string;
    };

    /** 作物 */
    type Crop = Common.CommonRecord<{
      /** 作物ID */
      id: CommonType.IdType;
      /** 所属农田ID */
      farmlandId: CommonType.IdType;
      /** 所属农田名称(关联查询) */
      farmlandName: string;
      /** 作物名称 */
      cropName: string;
      /** 品种 */
      variety: string | null;
      /** 种植日期 */
      plantDate: string | null;
      /** 状态 */
      status: number | null;
    }>;

    /** 作物搜索参数 */
    type CropSearchParams = CommonType.RecordNullable<
      Pick<Crop, 'cropName' | 'variety' | 'farmlandId' | 'status'> & Common.CommonSearchParams
    >;

    /** 作物列表 */
    type CropList = Common.PaginatingQueryRecord<Crop>;

    /** 作物操作参数 */
    type CropOperateParams = CommonType.RecordNullable<Crop>;

    /** 农事日志 */
    type FarmingLog = Common.CommonRecord<{
      /** 日志ID */
      id: CommonType.IdType;
      /** 农田ID */
      farmlandId: CommonType.IdType;
      /** 作物ID */
      cropId: CommonType.IdType | null;
      /** 操作人ID */
      userId: CommonType.IdType | null;
      /** 操作类型 */
      operateType: string;
      /** 操作内容 */
      content: string | null;
      /** 成本 */
      cost: number | null;
      /** 图片 */
      images: string | null;
      /** 操作时间 */
      operateTime: string;
      /** 农田名称(关联查询) */
      farmlandName: string | null;
      /** 作物名称(关联查询) */
      cropName: string | null;
      /** 操作人姓名(关联查询) */
      userRealName: string | null;
    }>;

    /** 农事日志搜索参数 */
    type FarmingLogSearchParams = CommonType.RecordNullable<
      Pick<FarmingLog, 'farmlandId' | 'operateType' | 'userId'> & Common.CommonSearchParams
    >;

    /** 农事日志列表 */
    type FarmingLogList = Common.PaginatingQueryRecord<FarmingLog>;

    /** 农事日志操作参数 */
    type FarmingLogOperateParams = CommonType.RecordNullable<FarmingLog>;
  }
}
