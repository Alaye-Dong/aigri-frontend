<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDivider, NTag } from 'naive-ui';
import { fetchBatchDeleteSuggestion, fetchGetSuggestionList, fetchAdoptSuggestion } from '@/service/api/ai';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import SuggestionDetailDrawer from './modules/suggestion-detail-drawer.vue';
import SuggestionSearch from './modules/suggestion-search.vue';

const searchParams = ref<Api.Ai.SuggestionSearchParams>({
  current: 1,
  size: 10,
  farmlandId: null,
  farmlandName: null,
  isAdopted: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetSuggestionList(searchParams.value),
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
      key: 'farmlandName',
      title: '农田名称',
      align: 'center',
      minWidth: 120,
      render: row => row.farmlandName || '-'
    },
    {
      key: 'triggerReason',
      title: '触发原因',
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'suggestion',
      title: '建议内容',
      align: 'left',
      minWidth: 200,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'aiModel',
      title: 'AI模型',
      align: 'center',
      minWidth: 100
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
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 150
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 200,
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

        const deleteBtn = () => {
          return (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDelete(row.id)}
            />
          );
        };

        const buttons = [];
        buttons.push(viewBtn());
        if (row.isAdopted !== 1) {
          buttons.push(adoptBtn());
        }
        buttons.push(deleteBtn());

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

const { drawerVisible, operateType, editingData, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteSuggestion(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteSuggestion([id]);
  if (error) return;
  onDeleted();
}

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
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <SuggestionSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="智能建议记录" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :disabled-add="true"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :scroll-x="1200"
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

<style scoped></style>