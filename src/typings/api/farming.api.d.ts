declare namespace Api {
  namespace Farming {
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
  }
}
