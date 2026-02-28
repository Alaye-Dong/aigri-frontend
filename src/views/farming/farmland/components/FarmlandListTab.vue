<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDivider } from 'naive-ui';
import { fetchBatchDeleteFarmland, fetchGetFarmlandList } from '@/service/api/farming';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import FarmlandOperateDrawer from './FarmlandOperateDrawer.vue';
import FarmlandSearch from './FarmlandSearch.vue';

defineOptions({
  name: 'FarmlandListTab'
});

const searchParams = ref<Api.Farming.FarmlandSearchParams>({
  current: 1,
  size: 10,
  name: null,
  location: null,
  soilType: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetFarmlandList(searchParams.value),
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
      key: 'name',
      title: '地块名称',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'userRealName',
      title: '负责人姓名',
      align: 'center',
      minWidth: 100,
      render: row => row.userRealName
    },
    {
      key: 'areaSize',
      title: '面积(亩)',
      align: 'center',
      minWidth: 100,
      render: row => (row.areaSize ? `${row.areaSize}` : '-')
    },
    {
      key: 'location',
      title: '位置',
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'soilType',
      title: '土壤类型',
      align: 'center',
      minWidth: 100,
      render: row => row.soilType || '-'
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

        const buttons = [];
        buttons.push(editBtn());
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

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteFarmland(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteFarmland([id]);
  if (error) return;
  onDeleted();
}

async function edit(id: CommonType.IdType) {
  handleEdit(id);
}

const selectedKeys = ref<string[]>([]);

function handleResetSearch() {
  selectedKeys.value = [];
  getDataByPage();
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-12px">
    <FarmlandSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <div class="mb-8px flex justify-end">
      <TableHeaderOperation
        v-model:columns="columnChecks"
        :disabled-delete="checkedRowKeys.length === 0"
        :loading="loading"
        @add="handleAdd"
        @delete="handleBatchDelete"
        @refresh="getData"
      />
    </div>
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
      class="flex-1-hidden"
    />
    <FarmlandOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      @submitted="getDataByPage"
    />
  </div>
</template>

<style scoped></style>
