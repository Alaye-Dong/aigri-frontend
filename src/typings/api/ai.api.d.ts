declare namespace Api {
  namespace Ai {
    type Suggestion = Common.CommonRecord<{
      farmlandId: CommonType.IdType | null;
      urgencyLevel: 'CAUTION' | 'WARNING' | 'TIP';
      suggestion: string;
      /** 后端返回字符串类型（如 "0"、"1"），前端使用 Number() 转换后比较 */
      isAdopted: number | string;
      /** 后端返回字符串类型（如 "0"、"1"），前端使用 Number() 转换后比较 */
      isPushed: number | string;
      createTime: string;
    }>;

    type SuggestionSearchParams = CommonType.RecordNullable<
      {
        farmlandId?: CommonType.IdType | null;
        urgencyLevel?: 'CAUTION' | 'WARNING' | 'TIP' | null;
      } & Common.CommonSearchParams
    >;

    type SuggestionList = Common.PaginatingQueryRecord<Suggestion>;

    type StructuredSuggestion = {
      title: string;
      urgencyLevel: 'CAUTION' | 'WARNING' | 'TIP';
      actionWindow: string;
      expectedEffect: string;
      triggerReason: string;
      suggestion: string;
    };

    type UrgencyLevelItem = {
      code: string;
      desc: string;
      priority: number;
      description: string;
    };

    type ChatHistory = {
      id: number;
      userId?: number;
      sessionId?: string | null;
      question: string;
      answer: string;
      contextData?: string | null;
      createTime: string;
    };

    type ChatHistorySearchParams = CommonType.RecordNullable<
      {
        current?: number;
        size?: number;
      } & Common.CommonSearchParams
    >;

    type ChatHistoryList = Common.PaginatingQueryRecord<ChatHistory>;
  }
}
