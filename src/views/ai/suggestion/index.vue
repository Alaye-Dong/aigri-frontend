<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NEmpty,
  NPagination,
  NSelect,
  NSpace,
  NSpin,
  NTag
} from 'naive-ui';
import {
  type SSEStreamResult,
  createSuggestionStream,
  fetchAdoptSuggestion,
  fetchGetSuggestionPage
} from '@/service/api/ai';
import { fetchGetFarmlandList } from '@/service/api/farming';
import SuggestionDetailDrawer from './modules/suggestion-detail-drawer.vue';
import SuggestionSearch from './modules/suggestion-search.vue';
import SuggestionCard from './modules/suggestion-card.vue';

// ========== 常量定义 ==========
const urgencyColors: Record<string, 'error' | 'warning' | 'info'> = {
  CAUTION: 'error',
  WARNING: 'warning',
  TIP: 'info'
};

const urgencyNames: Record<string, string> = {
  CAUTION: '注意',
  WARNING: '警告',
  TIP: '提示'
};

// ========== 建议记录相关 ==========
const searchParams = ref<Api.Ai.SuggestionSearchParams>({
  current: 1,
  size: 10,
  farmlandId: null,
  urgencyLevel: null
});

// 数据状态
const data = ref<Api.Ai.Suggestion[]>([]);
const loading = ref(false);
const total = ref(0);

// 分页配置
const pagination = computed(() => ({
  page: searchParams.value.current ?? 1,
  pageSize: searchParams.value.size ?? 10,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: () => `共 ${total.value} 条`
}));

// 农田名称映射
const farmlandMap = ref<Map<number, string>>(new Map());

// 详情抽屉状态
const drawerVisible = ref(false);
const operateType = ref<NaiveUI.TableOperateType>('edit');
const editingData = ref<Api.Ai.Suggestion | null>(null);

// 获取数据
async function getData() {
  loading.value = true;
  const { error, data: result } = await fetchGetSuggestionPage(searchParams.value);
  loading.value = false;

  if (!error && result) {
    data.value = result.records || [];
    total.value = result.total || 0;
  }
}

function getDataByPage() {
  searchParams.value.current = 1;
  getData();
}

function handleResetSearch() {
  getDataByPage();
}

// 分页变化
function handlePageChange(page: number) {
  searchParams.value.current = page;
  getData();
}

function handlePageSizeChange(pageSize: number) {
  searchParams.value.size = pageSize;
  searchParams.value.current = 1;
  getData();
}

// 获取农田名称
function getFarmlandName(farmlandId: CommonType.IdType | null): string | undefined {
  if (!farmlandId) return undefined;
  // farmlandId 可能是 string 或 number，Map 的 key 是 number
  const id = typeof farmlandId === 'string' ? Number.parseInt(farmlandId, 10) : farmlandId;
  if (Number.isNaN(id)) return undefined;
  return farmlandMap.value.get(id);
}

// 查看详情
function viewDetail(id: CommonType.IdType) {
  const item = data.value.find(d => d.id === id);
  if (item) {
    editingData.value = item;
    operateType.value = 'edit';
    drawerVisible.value = true;
  }
}

// 采纳建议
async function handleAdopt(id: CommonType.IdType) {
  const { error } = await fetchAdoptSuggestion(id);
  if (error) return;
  window.$message?.success('采纳成功');
  getData();
}

// ========== 建议生成相关 ==========
const generateLoading = ref(false);
const generating = ref(false);
const farmlandOptions = ref<{ label: string; value: number }[]>([]);

const selectedFarmland = ref<number | null>(null);

const suggestionResult = ref<Api.Ai.StructuredSuggestion | null>(null);

const streamingMessages = ref<string[]>([]);
const streamStatus = ref<string>('');

let cancelStream: (() => void) | null = null;

const canGenerate = computed(() => selectedFarmland.value !== null && !generating.value);

async function loadFarmlands() {
  const { data: farmlandData, error } = await fetchGetFarmlandList({ current: 1, size: 100 });
  if (!error && farmlandData) {
    farmlandOptions.value = farmlandData.records.map(item => ({
      label: item.name,
      value: item.id
    }));
    // 构建农田名称映射
    farmlandMap.value = new Map(farmlandData.records.map(item => [item.id, item.name]));
  }
}

async function handleGenerate() {
  if (!selectedFarmland.value) return;

  generating.value = true;
  suggestionResult.value = null;
  streamingMessages.value = [];
  streamStatus.value = 'connecting';

  cancelStream = createSuggestionStream(selectedFarmland.value, {
    onMessage: (result: SSEStreamResult) => {
      streamStatus.value = result.status;
      streamingMessages.value = result.messages;
      if (result.result) {
        suggestionResult.value = result.result;
      }
    },
    onError: (error: string) => {
      window.$message?.error(error);
      generating.value = false;
    },
    onComplete: () => {
      generating.value = false;
      if (suggestionResult.value) {
        window.$message?.success('建议生成成功');
        getData();
      }
    }
  });
}

function handleClearResult() {
  suggestionResult.value = null;
  streamingMessages.value = [];
  streamStatus.value = '';
}

function handleCancelGenerate() {
  if (cancelStream) {
    cancelStream();
    cancelStream = null;
  }
  generating.value = false;
  streamStatus.value = '';
}

// ========== 初始化 ==========
onMounted(() => {
  generateLoading.value = true;
  loadFarmlands().finally(() => {
    generateLoading.value = false;
    getData();
  });
});

onUnmounted(() => {
  handleCancelGenerate();
});
</script>

<template>
  <div class="min-h-500px flex flex-col gap-16px">
    <!-- 上方生成区域 -->
    <NCard title="生成智能建议" :bordered="false" size="small" class="flex-shrink-0">
      <NSpin :show="generateLoading">
        <NSpace vertical size="large">
          <NAlert type="info" title="功能说明">
            选择农田后，AI将综合分析该农田的环境数据、作物信息和天气预报，为您生成专业的农业管理建议。
          </NAlert>

          <NSpace align="center" :size="24" :wrap="false">
            <div class="min-w-200px flex items-center gap-12px">
              <span class="whitespace-nowrap text-gray-600">选择农田:</span>
              <NSelect
                v-model:value="selectedFarmland"
                :options="farmlandOptions"
                placeholder="请选择农田"
                clearable
                filterable
                class="flex-1"
              />
            </div>

            <NSpace>
              <NButton type="primary" :disabled="!canGenerate" :loading="generating" @click="handleGenerate">
                <template #icon>
                  <icon-mdi-robot-outline />
                </template>
                生成建议
              </NButton>

              <NButton v-if="generating" type="error" @click="handleCancelGenerate">取消</NButton>

              <NButton v-if="suggestionResult" @click="handleClearResult">清空结果</NButton>
            </NSpace>
          </NSpace>
        </NSpace>
      </NSpin>
    </NCard>

    <!-- SSE流式进度显示 -->
    <NCard
      v-if="generating || streamingMessages.length > 0"
      title="AI处理中"
      :bordered="false"
      size="small"
      class="flex-shrink-0"
    >
      <NSpace vertical>
        <NAlert v-if="streamStatus === 'connecting'" type="info">正在连接AI服务...</NAlert>
        <NAlert v-else-if="streamStatus === 'aggregating'" type="info">正在聚合农田数据...</NAlert>
        <NAlert v-else-if="streamStatus === 'generating'" type="info">AI正在生成建议，请耐心等待...</NAlert>
        <NAlert v-else-if="streamStatus === 'checking'" type="info">正在检查紧急情况...</NAlert>

        <div v-if="streamingMessages.length > 0" class="max-h-200px overflow-y-auto rounded-8px bg-gray-50 p-12px">
          <div v-for="(msg, index) in streamingMessages" :key="index" class="text-sm text-gray-600">
            {{ msg }}
          </div>
        </div>
      </NSpace>
    </NCard>

    <!-- 生成的建议结果 -->
    <NCard v-if="suggestionResult" title="AI智能建议" :bordered="false" size="small" class="flex-shrink-0">
      <template #header-extra>
        <NSpace align="center">
          <NTag :type="urgencyColors[suggestionResult.urgencyLevel] || 'info'" size="small">
            {{ urgencyNames[suggestionResult.urgencyLevel] || suggestionResult.urgencyLevel }}
          </NTag>
        </NSpace>
      </template>

      <NSpace vertical size="large">
        <h3 class="m-0 text-lg font-medium">{{ suggestionResult.title }}</h3>

        <NDivider class="m-0" />

        <NDescriptions label-placement="left" :column="2" bordered size="small">
          <NDescriptionsItem label="触发原因" :span="2">
            {{ suggestionResult.triggerReason }}
          </NDescriptionsItem>
          <NDescriptionsItem label="执行时间窗口">
            {{ suggestionResult.actionWindow }}
          </NDescriptionsItem>
          <NDescriptionsItem label="预期效果">
            {{ suggestionResult.expectedEffect }}
          </NDescriptionsItem>
        </NDescriptions>

        <NCard title="详细建议" size="small" :bordered="true">
          <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {{ suggestionResult.suggestion }}
          </div>
        </NCard>
      </NSpace>
    </NCard>

    <!-- 下方卡片列表区域 -->
    <SuggestionSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="建议记录" :bordered="false" size="small" class="flex-1 card-wrapper">
      <template #header-extra>
        <NButton quaternary size="small" :loading="loading" @click="getData">
          <template #icon>
            <icon-mdi-refresh class="text-16px" />
          </template>
          刷新
        </NButton>
      </template>

      <NSpin :show="loading">
        <!-- 卡片列表 -->
        <div v-if="data.length > 0" class="flex flex-col gap-16px">
          <div class="grid grid-cols-1 gap-16px lg:grid-cols-3 md:grid-cols-2">
            <SuggestionCard
              v-for="item in data"
              :key="item.id"
              :suggestion="item"
              :farmland-name="getFarmlandName(item.farmlandId)"
              @view="viewDetail"
              @adopt="handleAdopt"
            />
          </div>

          <!-- 分页 -->
          <div class="mt-16px flex justify-center">
            <NPagination v-bind="pagination" @update:page="handlePageChange" @update:page-size="handlePageSizeChange" />
          </div>
        </div>

        <!-- 空状态 -->
        <NEmpty v-else description="暂无建议记录" class="py-48px">
          <template #extra>
            <NButton size="small" @click="getData">刷新数据</NButton>
          </template>
        </NEmpty>
      </NSpin>

      <!-- 详情抽屉 -->
      <SuggestionDetailDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :row-id="editingData?.id"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>
