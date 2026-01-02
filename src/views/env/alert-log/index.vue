<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDivider, NTag } from 'naive-ui';
import { fetchBatchDeleteAlertLog, fetchGetAlertLogList, fetchUpdateAlertLogStatus } from '@/service/api/env';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import StatusSwitch from '@/components/custom/status-switch.vue';
import ButtonIcon from '@/components/custom/button-icon.vue';
import AlertLogOperateDrawer from './modules/alert-log-operate-drawer.vue';
import AlertLogSearch from './modules/alert-log-search.vue';

const searchParams = ref<Api.Env.AlertLogSearchParams>({
  current: 1,
  size: 10,
  ruleName: null,
  farmlandName: null,
  deviceSerialNo: null,
  status: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetAlertLogList(searchParams.value),
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
      key: 'ruleName',
      title: '规则名称',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'farmlandName',
      title: '农田名称',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'deviceSerialNo',
      title: '设备序列号',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'alertContent',
      title: '告警内容',
      align: 'center',
      minWidth: 150
    },
    {
      key: 'metricValue',
      title: '指标值',
      align: 'center',
      minWidth: 100
    },
    {
      key: 'status',
      title: '处理状态',
      align: 'center',
      minWidth: 100,
      render(row) {
        const statusText = row.status === '0' ? '未读' : '已处理';
        const statusType = row.status === '0' ? 'error' : 'success';
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
      width: 180,
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
  // request
  const { error } = await fetchBatchDeleteAlertLog(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  // request
  const { error } = await fetchBatchDeleteAlertLog([id]);
  if (error) return;
  onDeleted();
}

async function edit(id: CommonType.IdType) {
  handleEdit(id);
}

/** 处理状态切换 */
async function handleStatusChange(
  row: Api.Env.AlertLog,
  value: Api.Env.ProcessStatusType,
  callback: (flag: boolean) => void
) {
  const { error } = await fetchUpdateAlertLogStatus([row.id], value);

  callback(!error);

  if (!error) {
    window.$message?.success('状态切换成功');
    getData();
  }
}

function handleResetSearch() {
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <AlertLogSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard :title="$t('route.env_alert-log')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :add-button="false"
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
      <AlertLogOperateDrawer
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
