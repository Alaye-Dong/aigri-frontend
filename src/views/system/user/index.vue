<script setup lang="tsx">
import { ref } from 'vue';
import { NAvatar, NButton, NDivider, NEllipsis, NTag } from 'naive-ui';
import { fetchGetUserList } from '@/service/api/system';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';

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
          <StatusSwitch v-model:value={row.status} disabled={row.userId === 1} info={row.userName} />
          // TODO onSubmitted={(value, callback) => handleStatusChange(row, value, callback)}
        );
      }
    }
  ]
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="用户管理" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
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
    </NCard>
  </div>
</template>

<style scoped></style>
