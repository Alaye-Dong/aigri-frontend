<script setup lang="tsx">
import { ref } from 'vue';
import { NAvatar, NButton, NDivider, NEllipsis, NTag } from 'naive-ui';
import { fetchGetUserList, fetchUpdateUserStatus } from '@/service/api/system';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import StatusSwitch from '@/components/custom/status-switch.vue';
import UserOperateDrawer from './modules/user-operate-drawer.vue';
import UserSearch from './modules/user-seach.vue';

const searchParams = ref<Api.System.UserSearchParams>({
  current: 1,
  size: 10,
  userName: null,
  realName: null,
  phone: null,
  status: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetUserList(searchParams.value),
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
      key: 'userName',
      title: $t('page.system.user.userName'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'realName',
      title: $t('page.system.user.realName'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'phone',
      title: $t('page.system.user.phone'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'role',
      title: $t('page.system.user.role'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'status',
      title: $t('page.system.user.status'),
      align: 'center',
      minWidth: 100,
      render(row) {
        return (
          <StatusSwitch
            v-model:value={row.status}
            disabled={row.userId === 1}
            info={row.userName}
            onSubmitted={(value, callback) => handleStatusChange(row, value, callback)}
          />
        );
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => edit(row.userId)}>
            {$t('common.edit')}
          </NButton>
        </div>
      )
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'userId', getData);

async function edit(userId: CommonType.IdType) {
  handleEdit(userId);
}

const selectedKeys = ref<string[]>([]);

/** 处理状态切换 */
async function handleStatusChange(
  row: Api.System.User,
  value: Api.Common.EnableStatus,
  callback: (flag: boolean) => void
) {
  const { error } = await fetchUpdateUserStatus({
    userId: row.userId,
    status: value
  });

  callback(!error);

  if (!error) {
    window.$message?.success('状态切换成功');
    getData();
  }
}

function handleResetSearch() {
  selectedKeys.value = [];
  getDataByPage();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <UserSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="用户列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <NDataTable
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
      <UserOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
