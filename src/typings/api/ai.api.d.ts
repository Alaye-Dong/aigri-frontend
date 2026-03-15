declare namespace Api {
  namespace Ai {
    /** AI建议记录 (对应后端AiSuggestion Entity) */
    type Suggestion = Common.CommonRecord<{
      /** 关联农田ID */
      farmlandId: CommonType.IdType | null;
      /** 紧急程度 (CAUTION/WARNING/TIP) */
      urgencyLevel: 'CAUTION' | 'WARNING' | 'TIP';
      /** 具体建议内容 (包含类型、触发原因、标题、执行窗口、预期效果等) */
      suggestion: string;
      /** 是否被采纳 (0-否, 1-是) */
      isAdopted: number;
      /** 是否已推送 (0-否, 1-是) */
      isPushed: number;
      /** 创建时间 */
      createTime: string;
    }>;

    /** 智能建议搜索参数 */
    type SuggestionSearchParams = CommonType.RecordNullable<
      {
        /** 农田ID */
        farmlandId?: CommonType.IdType | null;
        /** 紧急程度 (CAUTION/WARNING/TIP) */
        urgencyLevel?: 'CAUTION' | 'WARNING' | 'TIP' | null;
      } & Common.CommonSearchParams
    >;

    /** 智能建议列表 */
    type SuggestionList = Common.PaginatingQueryRecord<Suggestion>;

    /** AI生成的结构化建议 (对应后端StructuredSuggestionResponse) */
    type StructuredSuggestion = {
      /** 建议类型 */
      suggestionType: string;
      /** 建议标题 */
      title: string;
      /** 紧急程度: CAUTION-注意, WARNING-警告, TIP-提示 */
      urgencyLevel: 'CAUTION' | 'WARNING' | 'TIP';
      /** AI置信度(0-100) */
      confidence: number;
      /** 建议执行时间窗口 */
      actionWindow: string;
      /** 预期效果描述 */
      expectedEffect: string;
      /** 触发原因 */
      triggerReason: string;
      /** 详细建议内容 */
      suggestion: string;
    };

    /** 建议类型枚举项 */
    type SuggestionTypeItem = {
      code: string;
      desc: string;
      description: string;
    };

    /** 紧急程度枚举项: CAUTION-注意, WARNING-警告, TIP-提示 */
    type UrgencyLevelItem = {
      code: string;
      desc: string;
      priority: number;
      description: string;
    };
  }
}
