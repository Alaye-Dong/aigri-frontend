<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDivider, NTag } from 'naive-ui';
import { fetchBatchDeleteCrop, fetchGetCropList } from '@/service/api/farming';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import { cropStatusMap } from '@/constants/business';
import ButtonIcon from '@/components/custom/button-icon.vue';
import CropOperateDrawer from './modules/crop-operate-drawer.vue';
import CropSearch from './modules/crop-search.vue';

const searchParams = ref<Api.Farming.CropSearchParams>({
  current: 1,
  size: 10,
  cropName: null,
  variety: null,
  farmlandId: null,
  status: undefined
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetCropList(searchParams.value),
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
      key: 'cropName',
      title: '作物名称',
      align: 'center',
      minWidth: 100
    },
    {
      key: 'variety',
      title: '品种',
      align: 'center',
      minWidth: 100
    },
    {
      key: 'farmlandId',
      title: '所属农田',
      align: 'center',
      minWidth: 100,
      render: row => {
        return row.farmlandName;
      }
    },
    {
      key: 'plantDate',
      title: '种植日期',
      align: 'center',
      minWidth: 120,
      render: row => {
        return row.plantDate ? row.plantDate : '-';
      }
    },
    {
      key: 'status',
      title: '状态',
      align: 'center',
      minWidth: 100,
      render: row => {
        const statusValue = row.status as Api.Farming.CropStatus | null;
        if (statusValue === null) {
          return <NTag type="default" size="small">未知</NTag>;
        }
        const statusInfo = cropStatusMap[statusValue];
        return (
          <NTag type={statusInfo.type} size="small">
            {statusInfo.text}
          </NTag>
        );
      }
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
  const { error } = await fetchBatchDeleteCrop(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  // request
  const { error } = await fetchBatchDeleteCrop([id]);
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
    <CropSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="作物列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
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
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <CropOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
