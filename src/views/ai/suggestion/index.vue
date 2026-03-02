<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NEmpty,
  NPagination,
  NProgress,
  NSelect,
  NSpace,
  NSpin,
  NTag
} from 'naive-ui';
import {
  fetchAdoptSuggestion,
  fetchGenerateSuggestion,
  fetchGenerateUrgentSuggestions,
  fetchGetSuggestionPage
} from '@/service/api/ai';
import { fetchGetFarmlandList } from '@/service/api/farming';
import SuggestionDetailDrawer from './modules/suggestion-detail-drawer.vue';
import SuggestionSearch from './modules/suggestion-search.vue';
import SuggestionCard from './modules/suggestion-card.vue';

// ========== 常量定义 ==========
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

const suggestionTypeNames: Record<string, string> = {
  IRRIGATION: '灌溉建议',
  FERTILIZATION: '施肥建议',
  DISASTER_PREVENTION: '防灾建议',
  GENERAL: '通用建议'
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
  page: searchParams.value.current,
  pageSize: searchParams.value.size,
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
function getFarmlandName(farmlandId: number | null): string | undefined {
  if (!farmlandId) return undefined;
  return farmlandMap.value.get(farmlandId);
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
const urgentSuggestions = ref<Api.Ai.StructuredSuggestion[]>([]);

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

  const { error, data: suggestionData } = await fetchGenerateSuggestion(selectedFarmland.value);

  generating.value = false;

  if (!error && suggestionData) {
    suggestionResult.value = suggestionData;
    window.$message?.success('建议生成成功');
    getData();
  }
}

async function handleGenerateUrgent() {
  if (!selectedFarmland.value) return;

  generating.value = true;
  urgentSuggestions.value = [];

  const { error, data: urgentData } = await fetchGenerateUrgentSuggestions(selectedFarmland.value);

  generating.value = false;

  if (!error && urgentData) {
    urgentSuggestions.value = urgentData;
    if (urgentData.length > 0) {
      window.$message?.success(`生成了 ${urgentData.length} 条紧急建议`);
      getData();
    } else {
      window.$message?.info('当前没有需要紧急处理的情况');
    }
  }
}

function handleClearResult() {
  suggestionResult.value = null;
  urgentSuggestions.value = [];
}

// ========== 初始化 ==========
onMounted(() => {
  generateLoading.value = true;
  loadFarmlands().finally(() => {
    generateLoading.value = false;
    getData();
  });
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

              <NButton type="warning" :disabled="!canGenerate" :loading="generating" @click="handleGenerateUrgent">
                <template #icon>
                  <icon-mdi-alert-outline />
                </template>
                生成紧急建议
              </NButton>

              <NButton v-if="suggestionResult || urgentSuggestions.length > 0" @click="handleClearResult">
                清空结果
              </NButton>
            </NSpace>
          </NSpace>
        </NSpace>
      </NSpin>
    </NCard>

    <!-- 生成的建议结果 -->
    <NCard v-if="suggestionResult" title="AI智能建议" :bordered="false" size="small" class="flex-shrink-0">
      <template #header-extra>
        <NSpace align="center">
          <NTag :type="urgencyColors[suggestionResult.urgencyLevel] || 'info'" size="small">
            {{ urgencyNames[suggestionResult.urgencyLevel] || suggestionResult.urgencyLevel }}
          </NTag>
          <NTag v-if="suggestionResult.suggestionType" type="primary" size="small">
            {{ suggestionTypeNames[suggestionResult.suggestionType] || suggestionResult.suggestionType }}
          </NTag>
        </NSpace>
      </template>

      <NSpace vertical size="large">
        <div class="flex items-center justify-between">
          <h3 class="m-0 text-lg font-medium">{{ suggestionResult.title }}</h3>
          <div class="flex items-center gap-8px">
            <span class="text-sm text-gray-500">AI置信度:</span>
            <NProgress
              type="circle"
              :percentage="suggestionResult.confidence || 0"
              :stroke-width="16"
              :show-indicator="true"
              :color="suggestionResult.confidence && suggestionResult.confidence >= 80 ? '#18a058' : '#2080f0'"
              :width="48"
            />
          </div>
        </div>

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

    <!-- 紧急建议列表 -->
    <NCard
      v-if="urgentSuggestions.length > 0"
      title="紧急建议"
      :bordered="false"
      size="small"
      class="max-h-300px flex-shrink-0 overflow-y-auto"
    >
      <NSpace vertical size="large">
        <NAlert type="warning" title="紧急提醒">以下建议需要您尽快处理，以避免可能的损失。</NAlert>

        <div
          v-for="(suggestion, index) in urgentSuggestions"
          :key="index"
          class="border border-gray-200 rounded-8px p-16px transition-colors hover:border-primary"
        >
          <NSpace vertical size="small">
            <div class="flex items-center justify-between">
              <NSpace align="center">
                <NTag :type="urgencyColors[suggestion.urgencyLevel] || 'warning'" size="small">
                  {{ urgencyNames[suggestion.urgencyLevel] || suggestion.urgencyLevel }}
                </NTag>
                <NTag v-if="suggestion.suggestionType" type="primary" size="small">
                  {{ suggestionTypeNames[suggestion.suggestionType] || suggestion.suggestionType }}
                </NTag>
                <span class="font-medium">{{ suggestion.title }}</span>
              </NSpace>
              <NProgress type="circle" :percentage="suggestion.confidence || 0" :stroke-width="12" :width="36" />
            </div>

            <div class="text-sm text-gray-600">
              <strong>触发原因:</strong>
              {{ suggestion.triggerReason }}
            </div>

            <div class="whitespace-pre-wrap text-gray-700">
              {{ suggestion.suggestion }}
            </div>

            <div class="flex gap-16px text-sm text-gray-500">
              <span>
                <strong>执行窗口:</strong>
                {{ suggestion.actionWindow }}
              </span>
              <span>
                <strong>预期效果:</strong>
                {{ suggestion.expectedEffect }}
              </span>
            </div>
          </NSpace>
        </div>
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

<style scoped></style>
