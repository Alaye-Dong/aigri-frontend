<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NEllipsis, NSpace, NTag } from 'naive-ui';

defineOptions({
  name: 'SuggestionCard'
});

interface Props {
  /** 建议数据 */
  suggestion: Api.Ai.Suggestion;
  /** 农田名称（可选，由父组件传入） */
  farmlandName?: string;
}

interface Emits {
  (e: 'view', id: CommonType.IdType): void;
  (e: 'adopt', id: CommonType.IdType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 紧急程度配置
const urgencyColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  URGENT: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'success'
};

const urgencyNames: Record<string, string> = {
  URGENT: '紧急',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低'
};

// 计算属性
const urgencyColor = computed(() => urgencyColors[props.suggestion.urgencyLevel] || 'info');
const urgencyName = computed(() => urgencyNames[props.suggestion.urgencyLevel] || props.suggestion.urgencyLevel);
const isAdopted = computed(() => props.suggestion.isAdopted === 1);
const isPushed = computed(() => props.suggestion.isPushed === 1);

// 内容展开状态
const expanded = ref(false);

// 格式化时间（只显示日期时间，不含秒）
const formattedTime = computed(() => {
  const time = props.suggestion.createTime;
  if (!time) return '';
  // 如果已经是格式化过的，直接返回
  if (time.includes('-') && time.includes(':')) {
    return time.slice(0, 16); // 截取到分钟
  }
  return time;
});

function handleView() {
  emit('view', props.suggestion.id);
}

function handleAdopt() {
  emit('adopt', props.suggestion.id);
}

function toggleExpand() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div
    class="suggestion-card group relative border border-gray-200 rounded-12px bg-white p-16px transition-all duration-300 dark:border-gray-700 hover:border-primary dark:bg-dark hover:shadow-md"
  >
    <!-- 顶部：标签和时间 -->
    <div class="mb-12px flex items-center justify-between">
      <NSpace :size="8" :wrap="false">
        <!-- 紧急程度标签 -->
        <NTag :type="urgencyColor" size="small" :bordered="false">
          {{ urgencyName }}
        </NTag>
        <!-- 采纳状态 -->
        <NTag :type="isAdopted ? 'success' : 'default'" size="small" :bordered="false">
          {{ isAdopted ? '已采纳' : '未采纳' }}
        </NTag>
        <!-- 推送状态 -->
        <NTag v-if="isPushed" type="info" size="small" :bordered="false">已推送</NTag>
      </NSpace>
      <!-- 创建时间 -->
      <span class="text-12px text-gray-400">{{ formattedTime }}</span>
    </div>

    <!-- 农田信息 -->
    <div v-if="farmlandName || suggestion.farmlandId" class="mb-8px flex items-center gap-4px text-13px text-gray-500">
      <icon-mdi-map-marker class="text-14px" />
      <span>{{ farmlandName || `农田 #${suggestion.farmlandId}` }}</span>
    </div>

    <!-- 建议内容 -->
    <div class="suggestion-content mb-12px">
      <div v-if="expanded" class="whitespace-pre-wrap text-14px text-gray-700 leading-relaxed dark:text-gray-300">
        {{ suggestion.suggestion }}
      </div>
      <NEllipsis
        v-else
        :line-clamp="3"
        :tooltip="false"
        class="text-14px text-gray-700 leading-relaxed dark:text-gray-300"
      >
        {{ suggestion.suggestion }}
      </NEllipsis>
    </div>

    <!-- 展开/收起按钮 -->
    <div v-if="suggestion.suggestion && suggestion.suggestion.length > 100" class="mb-8px">
      <NButton text size="tiny" type="primary" @click="toggleExpand">
        {{ expanded ? '收起' : '展开全文' }}
      </NButton>
    </div>

    <!-- 底部：操作按钮 -->
    <div class="flex items-center justify-end border-t border-gray-100 pt-12px dark:border-gray-700">
      <NSpace :size="8">
        <NButton size="small" quaternary type="primary" @click="handleView">
          <template #icon>
            <icon-mdi-eye-outline class="text-16px" />
          </template>
          查看详情
        </NButton>
        <NButton v-if="!isAdopted" size="small" quaternary type="success" @click="handleAdopt">
          <template #icon>
            <icon-mdi-check-circle-outline class="text-16px" />
          </template>
          采纳建议
        </NButton>
      </NSpace>
    </div>
  </div>
</template>

<style scoped>
.suggestion-card {
  min-height: 120px;
}

.suggestion-content :deep(.n-ellipsis__main) {
  line-height: 1.6;
}
</style>
