<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDivider, NTag } from 'naive-ui';
import { fetchBatchDeleteFarmingLog, fetchGetFarmingLogList } from '@/service/api/farming';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import FarmingLogSearch from './modules/farming-log-search.vue';
import FarmingLogOperateDrawer from './modules/farming-log-operate-drawer.vue';

const searchParams = ref<Api.Farming.FarmingLogSearchParams>({
  current: 1,
  size: 10,
  farmlandId: null,
  operateType: null,
  userId: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetFarmingLogList(searchParams.value),
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
      title: '所属农田',
      align: 'center',
      minWidth: 100,
      render: row => row.farmlandName || '-'
    },
    {
      key: 'cropId',
      title: '关联作物',
      align: 'center',
      minWidth: 100,
      render: row => row.cropName || '-'
    },
    {
      key: 'operateType',
      title: '操作类型',
      align: 'center',
      minWidth: 100,
      render: row => {
        const operateTypeMap: Record<
          string,
          { text: string; type: 'success' | 'warning' | 'error' | 'default' | 'primary' | 'info' }
        > = {
          播种: { text: '播种', type: 'primary' },
          施肥: { text: '施肥', type: 'success' },
          灌溉: { text: '灌溉', type: 'info' },
          除草: { text: '除草', type: 'warning' },
          病虫害防治: { text: '病虫害防治', type: 'error' },
          收获: { text: '收获', type: 'success' },
          其他: { text: '其他', type: 'default' }
        };

        const typeValue = row.operateType;
        const typeInfo = operateTypeMap[typeValue] || { text: typeValue, type: 'default' };

        return (
          <NTag
            type={typeInfo.type satisfies 'success' | 'warning' | 'error' | 'default' | 'primary' | 'info' | undefined}
            size="small"
          >
            {typeInfo.text}
          </NTag>
        );
      }
    },
    {
      key: 'content',
      title: '操作内容',
      align: 'center',
      minWidth: 150,
      render: row => row.content || '-'
    },
    {
      key: 'cost',
      title: '成本(元)',
      align: 'center',
      minWidth: 100,
      render: row => (row.cost !== null ? `¥${row.cost}` : '-')
    },
    {
      key: 'operateTime',
      title: '操作时间',
      align: 'center',
      minWidth: 160
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 160
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: row => {
        const editBtn = () => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent={$t('common.edit')}
              onClick={() => edit(row.id)}
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

        const buttons = [editBtn(), deleteBtn()];

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

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  // request
  const { error } = await fetchBatchDeleteFarmingLog(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  // request
  const { error } = await fetchBatchDeleteFarmingLog([id]);
  if (error) return;
  onDeleted();
}

async function edit(id: CommonType.IdType) {
  handleEdit(id);
}

function handleResetSearch() {
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <FarmingLogSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="农事日志列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
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
      <FarmingLogOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
