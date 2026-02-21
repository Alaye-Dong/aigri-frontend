<script setup lang="tsx">
import { ref } from 'vue';
import { NAvatar, NButton, NDivider, NEllipsis, NTag } from 'naive-ui';
import {
  fetchBatchDeleteDevice,
  fetchBindDevice,
  fetchGetDeviceList,
  fetchSendDeviceCommand,
  fetchUnbindDevice
} from '@/service/api/env';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import DeviceSearch from './modules/device-search.vue';
import DeviceOperateDrawer from './modules/device-operate-drawer.vue';
import DeviceCommandModal from './modules/device-command-modal.vue';
import DeviceBindModal from './modules/device-bind-modal.vue';

const searchParams = ref<Api.Env.DeviceSearchParams>({
  current: 1,
  size: 10,
  serialNo: null,
  farmlandId: null,
  type: null,
  status: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetDeviceList(searchParams.value),
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
      key: 'serialNo',
      title: '序列号',
      align: 'center',
      minWidth: 120
    },
    {
      key: 'farmlandId',
      title: '所属农田',
      align: 'center',
      minWidth: 100,
      render: row => {
        return row.farmlandName || '-';
      }
    },
    {
      key: 'type',
      title: '设备类型',
      align: 'center',
      minWidth: 100
    },
    {
      key: 'status',
      title: '设备状态',
      align: 'center',
      minWidth: 100,
      render: row => {
        const statusMap: Record<string, { text: string; type: 'success' | 'warning' | 'error' | 'default' }> = {
          '1': { text: '在线', type: 'success' },
          '0': { text: '离线', type: 'warning' }
        };
        const status = statusMap[row.status] || { text: '未知', type: 'default' };
        return (
          <NTag type={status.type} size="small">
            {status.text}
          </NTag>
        );
      }
    },
    {
      key: 'lastHeartbeat',
      title: '最后心跳时间',
      align: 'center',
      minWidth: 150,
      render: row => {
        return row.lastHeartbeat ? row.lastHeartbeat : '-';
      }
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 150,
      render: row => {
        return row.createTime ? row.createTime : '-';
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 200,
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

        const bindBtn = () => {
          return (
            <ButtonIcon
              text
              type="info"
              icon="material-symbols:link"
              tooltipContent={row.farmlandId ? '更换绑定' : '绑定农田'}
              onClick={() => handleOpenBindModal(row)}
            />
          );
        };

        const unbindBtn = () => {
          if (!row.farmlandId) return null;
          return (
            <ButtonIcon
              text
              type="warning"
              icon="material-symbols:link-off"
              tooltipContent="解绑设备"
              popconfirmContent="确定要解绑该设备吗？"
              onPositiveClick={() => handleUnbind(row.id)}
            />
          );
        };

        const commandBtn = () => {
          if (row.status !== '1') return null;
          return (
            <ButtonIcon
              text
              type="success"
              icon="material-symbols:terminal"
              tooltipContent="发送命令"
              onClick={() => handleOpenCommandModal(row)}
            />
          );
        };

        const buttons = [];
        buttons.push(editBtn());
        buttons.push(<NDivider vertical />);
        buttons.push(bindBtn());
        if (row.farmlandId) {
          buttons.push(<NDivider vertical />);
          buttons.push(unbindBtn());
        }
        if (row.status === '1') {
          buttons.push(<NDivider vertical />);
          buttons.push(commandBtn());
        }
        buttons.push(<NDivider vertical />);
        buttons.push(deleteBtn());

        return (
          <div class="flex-center gap-8px">
            {buttons.map((btn, index) => (
              <>{btn}</>
            ))}
          </div>
        );
      }
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

const commandModalVisible = ref(false);
const commandDevice = ref<Api.Env.Device | null>(null);

const bindModalVisible = ref(false);
const bindDevice = ref<Api.Env.Device | null>(null);

function handleOpenCommandModal(device: Api.Env.Device) {
  commandDevice.value = device;
  commandModalVisible.value = true;
}

function handleOpenBindModal(device: Api.Env.Device) {
  bindDevice.value = device;
  bindModalVisible.value = true;
}

async function handleBatchDelete() {
  const { error } = await fetchBatchDeleteDevice(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  const { error } = await fetchBatchDeleteDevice([id]);
  if (error) return;
  onDeleted();
}

async function handleUnbind(id: CommonType.IdType) {
  const { error } = await fetchUnbindDevice(id);
  if (error) return;
  window.$message?.success('解绑成功');
  getData();
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
    <DeviceSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="设备列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
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
        :scroll-x="1100"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <DeviceOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
      <DeviceCommandModal v-model:visible="commandModalVisible" :device="commandDevice" @submitted="getData" />
      <DeviceBindModal v-model:visible="bindModalVisible" :device="bindDevice" @submitted="getData" />
    </NCard>
  </div>
</template>

<style scoped></style>
