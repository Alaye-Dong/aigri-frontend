declare namespace Api {
  namespace Ai {
    /** 智能建议 */
    type Suggestion = Common.CommonRecord<{
      /** 关联农田ID */
      farmlandId: CommonType.IdType | null;
      /** 农田名称(关联查询) */
      farmlandName: string | null;
      /** 触发原因 */
      triggerReason: string;
      /** 具体建议内容 */
      suggestion: string;
      /** 所用AI模型 */
      aiModel: string;
      /** 是否被采纳 (0-否, 1-是) */
      isAdopted: number;
      /** 创建时间 */
      createTime: string;
    }>;

    /** 智能建议搜索参数 */
    type SuggestionSearchParams = CommonType.RecordNullable<
      Pick<Suggestion, 'farmlandId' | 'isAdopted'> & {
        /** 农田名称(模糊查询) */
        farmlandName?: string | null;
      } & Common.CommonSearchParams
    >;

    /** 智能建议列表 */
    type SuggestionList = Common.PaginatingQueryRecord<Suggestion>;

    /** 智能建议操作参数 */
    type SuggestionOperateParams = CommonType.RecordNullable<Suggestion>;

    /** 采纳状态类型 */
    type AdoptStatusType = 0 | 1;
  }
}