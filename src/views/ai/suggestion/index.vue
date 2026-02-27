<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
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
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import SuggestionDetailDrawer from './modules/suggestion-detail-drawer.vue';
import SuggestionSearch from './modules/suggestion-search.vue';

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

// ========== 建议记录相关 (先定义，因为后面的函数会用到) ==========
const searchParams = ref<Api.Ai.SuggestionSearchParams>({
  current: 1,
  size: 10,
  farmlandId: null,
  urgencyLevel: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetSuggestionPage(searchParams.value),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.value.current = params.page;
    searchParams.value.size = params.pageSize;
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64,
      render: (_, index) => index + 1
    },
    {
      key: 'farmlandId',
      title: '农田ID',
      align: 'center',
      minWidth: 100
    },
    {
      key: 'urgencyLevel',
      title: '紧急程度',
      align: 'center',
      minWidth: 100,
      render(row) {
        const level = row.urgencyLevel;
        const colorType = urgencyColors[level] || 'info';
        const name = urgencyNames[level] || level;
        return (
          <NTag type={colorType} size="small">
            {name}
          </NTag>
        );
      }
    },
    {
      key: 'suggestion',
      title: '建议内容',
      align: 'left',
      minWidth: 300,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'isAdopted',
      title: '采纳状态',
      align: 'center',
      minWidth: 100,
      render(row) {
        const isAdopted = row.isAdopted === 1;
        const statusType = isAdopted ? 'success' : 'default';
        const statusText = isAdopted ? '已采纳' : '未采纳';
        return (
          <NTag type={statusType} size="small">
            {statusText}
          </NTag>
        );
      }
    },
    {
      key: 'isPushed',
      title: '推送状态',
      align: 'center',
      minWidth: 100,
      render(row) {
        const isPushed = row.isPushed === 1;
        const statusType = isPushed ? 'info' : 'default';
        const statusText = isPushed ? '已推送' : '未推送';
        return (
          <NTag type={statusType} size="small">
            {statusText}
          </NTag>
        );
      }
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 150
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 160,
      render: row => {
        const viewBtn = () => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:visibility-outline"
              tooltipContent="查看详情"
              onClick={() => viewDetail(row.id)}
            />
          );
        };

        const adoptBtn = () => {
          if (row.isAdopted === 1) return null;
          return (
            <ButtonIcon
              text
              type="success"
              icon="material-symbols:check-circle-outline"
              tooltipContent="采纳建议"
              onClick={() => handleAdopt(row.id)}
            />
          );
        };

        const buttons = [];
        buttons.push(viewBtn());
        if (row.isAdopted !== 1) {
          buttons.push(adoptBtn());
        }

        return (
          <div class="flex-center gap-8px">
            {buttons.map((btn, index) => (
              <>
                {index !== 0 && <NDivider vertical />}
                {btn}
              </>
            ))}
          </div>
        );
      }
    }
  ]
});

const { drawerVisible, operateType, editingData, handleEdit, checkedRowKeys } = useTableOperate(data, 'id', getData);

async function handleAdopt(id: CommonType.IdType) {
  const { error } = await fetchAdoptSuggestion(id);
  if (error) return;
  window.$message?.success('采纳成功');
  getData();
}

function viewDetail(id: CommonType.IdType) {
  handleEdit(id);
}

function handleResetSearch() {
  getDataByPage();
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
  });
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 建议生成区域 -->
    <NCard title="生成智能建议" :bordered="false" size="small" class="card-wrapper">
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
    <NCard v-if="suggestionResult" title="AI智能建议" :bordered="false" size="small" class="card-wrapper">
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
    <NCard v-if="urgentSuggestions.length > 0" title="紧急建议" :bordered="false" size="small" class="card-wrapper">
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

    <!-- 建议记录列表 -->
    <SuggestionSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="建议记录" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :disabled-add="true"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :scroll-x="1100"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <SuggestionDetailDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :row-id="editingData?.id"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped>
.card-wrapper {
  transition: all 0.3s ease;
}
</style>
