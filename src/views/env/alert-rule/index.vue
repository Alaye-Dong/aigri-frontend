<script setup lang="tsx">
import { ref } from 'vue';
import { NAvatar, NButton, NDivider, NEllipsis, NTag } from 'naive-ui';
import { fetchBatchDeleteAlertRule, fetchGetAlertRuleList, fetchUpdateAlertRuleStatus } from '@/service/api/env';
import { defaultTransform, useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import StatusSwitch from '@/components/custom/status-switch.vue';
import ButtonIcon from '@/components/custom/button-icon.vue';
import AlertRuleOperateDrawer from './modules/alert-rule-operate-drawer.vue';
import AlertRuleSearch from './modules/alert-rule-search.vue';

const searchParams = ref<Api.Env.AlertRuleSearchParams>({
  current: 1,
  size: 10,
  ruleName: null,
  farmlandId: null,
  metricType: null,
  severity: null,
  isEnabled: null
});

const { columns, columnChecks, data, getData, getDataByPage, loading, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchGetAlertRuleList(searchParams.value),
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
      title: '序号',
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
      minWidth: 100,
      render: row => {
        return row.farmlandName || <NTag type="info">全局规则</NTag>;
      }
    },
    {
      key: 'metricType',
      title: '监测指标',
      align: 'center',
      minWidth: 100,
      render: row => {
        const metricLabels: Record<string, string> = {
          'air_temp': '空气温度',
          'air_humidity': '空气湿度',
          'soil_moisture': '土壤湿度',
          'light_lux': '光照强度',
          'co2_ppm': '二氧化碳浓度'
        };
        return metricLabels[row.metricType] || row.metricType;
      }
    },
    {
      key: 'conditionOperator',
      title: '条件操作符',
      align: 'center',
      minWidth: 80,
      render: row => row.conditionOperator
    },
    {
      key: 'thresholdValue',
      title: '阈值',
      align: 'center',
      minWidth: 100,
      render: row => row.thresholdValue
    },
    {
      key: 'severity',
      title: '告警级别',
      align: 'center',
      minWidth: 80,
      render: row => {
        const severityLabels: Record<string, string> = {
          'info': '信息',
          'warning': '警告',
          'danger': '危险'
        };
        const severityType: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
          'info': 'info',
          'warning': 'warning',
          'danger': 'error'
        };
        return (
          <NTag type={severityType[row.severity] || 'default'} size="small">
            {severityLabels[row.severity] || row.severity}
          </NTag>
        );
      }
    },
    {
      key: 'isEnabled',
      title: '是否启用',
      align: 'center',
      minWidth: 80,
      render: row => {
        return (
          <NTag type={row.isEnabled ? 'success' : 'error'} size="small">
            {row.isEnabled ? '启用' : '停用'}
          </NTag>
        );
      }
    },
    {
      key: 'createTime',
      title: '创建时间',
      align: 'center',
      minWidth: 150,
      render: row => row.createTime
    },
    {
      key: 'operate',
      title: '操作',
      align: 'center',
      width: 130,
      render: row => {
        const editBtn = () => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent="编辑"
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
              tooltipContent="删除"
              popconfirmContent="确认删除吗？"
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
  const { error } = await fetchBatchDeleteAlertRule(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(id: CommonType.IdType) {
  // request
  const { error } = await fetchBatchDeleteAlertRule([id]);
  if (error) return;
  onDeleted();
}

async function edit(id: CommonType.IdType) {
  handleEdit(id);
}

/** 处理状态切换 */
async function handleStatusChange(
  row: Api.Env.AlertRule,
  value: Api.Common.EnableStatus,
  callback: (flag: boolean) => void
) {
  const { error } = await fetchUpdateAlertRuleStatus({
    id: row.id,
    status: value
  });

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
    <AlertRuleSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <NCard title="告警规则列表" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
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
      <AlertRuleOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
