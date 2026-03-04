<script setup lang="tsx">
import { onUnmounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NDivider, NPopconfirm, NTag } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import {
  fetchGetSimulatorList,
  fetchRemoveSimulator,
  fetchStartAllSimulators,
  fetchStartSimulator,
  fetchStopAllSimulators,
  fetchStopSimulator
} from '@/service/api/env';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import MqttSimulatorOperateDrawer from './modules/mqtt-simulator-operate-drawer.vue';

const { loading, startLoading, endLoading } = useLoading();

const data = ref<Api.Env.SimDeviceStatus[]>([]);
const drawerVisible = ref(false);

// Auto refresh timer
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const columns = [
  {
    key: 'index',
    title: $t('common.index'),
    align: 'center',
    width: 64,
    render: (_: unknown, index: number) => index + 1
  },
  {
    key: 'serialNo',
    title: '序列号',
    align: 'center',
    minWidth: 140
  },
  {
    key: 'type',
    title: '设备类型',
    align: 'center',
    minWidth: 100,
    render: (row: Api.Env.SimDeviceStatus) => {
      const typeMap: Record<string, string> = {
        ENV_SENSOR: '环境传感器',
        SOIL_SENSOR: '土壤传感器',
        WEATHER_STATION: '气象站'
      };
      return typeMap[row.type] || row.type;
    }
  },
  {
    key: 'running',
    title: '运行状态',
    align: 'center',
    minWidth: 100,
    render: (row: Api.Env.SimDeviceStatus) => {
      return (
        <NTag type={row.running ? 'success' : 'default'} size="small">
          {row.running ? '运行中' : '已停止'}
        </NTag>
      );
    }
  },
  {
    key: 'messageCount',
    title: '消息计数',
    align: 'center',
    minWidth: 100,
    render: (row: Api.Env.SimDeviceStatus) => row.messageCount.toLocaleString()
  },
  {
    key: 'lastDataTime',
    title: '最后数据时间',
    align: 'center',
    minWidth: 150,
    render: (row: Api.Env.SimDeviceStatus) => row.lastDataTime || '-'
  },
  {
    key: 'lastHeartbeatTime',
    title: '最后心跳时间',
    align: 'center',
    minWidth: 150,
    render: (row: Api.Env.SimDeviceStatus) => row.lastHeartbeatTime || '-'
  },
  {
    key: 'errorMessage',
    title: '错误信息',
    align: 'center',
    minWidth: 150,
    render: (row: Api.Env.SimDeviceStatus) => {
      if (!row.errorMessage) return '-';
      return (
        <NTag type="error" size="small">
          {row.errorMessage}
        </NTag>
      );
    }
  },
  {
    key: 'operate',
    title: $t('common.operate'),
    align: 'center',
    width: 220,
    render: (row: Api.Env.SimDeviceStatus) => {
      const startBtn = () => (
        <ButtonIcon
          text
          type="success"
          icon="material-symbols:play-arrow"
          tooltipContent="启动"
          popconfirmContent="确定要启动该模拟设备吗？"
          onPositiveClick={() => handleStart(row.serialNo)}
        />
      );

      const stopBtn = () => (
        <ButtonIcon
          text
          type="warning"
          icon="material-symbols:stop"
          tooltipContent="停止"
          popconfirmContent="确定要停止该模拟设备吗？"
          onPositiveClick={() => handleStop(row.serialNo)}
        />
      );

      const deleteBtn = () => (
        <ButtonIcon
          text
          type="error"
          icon="material-symbols:delete-outline"
          tooltipContent={$t('common.delete')}
          popconfirmContent="确定要删除该模拟设备吗？"
          onPositiveClick={() => handleRemove(row.serialNo)}
        />
      );

      return (
        <div class="flex-center gap-8px">
          {row.running ? stopBtn() : startBtn()}
          <NDivider vertical />
          {deleteBtn()}
        </div>
      );
    }
  }
];

async function getData() {
  startLoading();
  const { error, data: result } = await fetchGetSimulatorList();
  endLoading();
  if (!error) {
    data.value = result || [];
  }
}

async function handleStart(serialNo: string) {
  const { error } = await fetchStartSimulator(serialNo);
  if (error) return;
  window.$message?.success('启动成功');
  getData();
}

async function handleStop(serialNo: string) {
  const { error } = await fetchStopSimulator(serialNo);
  if (error) return;
  window.$message?.success('停止成功');
  getData();
}

async function handleRemove(serialNo: string) {
  const { error } = await fetchRemoveSimulator(serialNo);
  if (error) return;
  window.$message?.success('删除成功');
  getData();
}

async function handleStartAll() {
  const { error } = await fetchStartAllSimulators();
  if (error) return;
  window.$message?.success('已启动所有设备');
  getData();
}

async function handleStopAll() {
  const { error } = await fetchStopAllSimulators();
  if (error) return;
  window.$message?.success('已停止所有设备');
  getData();
}

function handleAdd() {
  drawerVisible.value = true;
}

// Start auto refresh (every 10 seconds)
function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    getData();
  }, 10000);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// Initial load and start auto refresh
getData();
startAutoRefresh();

// Cleanup on unmount
onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="MQTT模拟设备" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <div class="flex items-center gap-12px">
          <NPopconfirm @positive-click="handleStartAll">
            <template #trigger>
              <NButton type="success" size="small">全部启动</NButton>
            </template>
            确定要启动所有模拟设备吗？
          </NPopconfirm>
          <NPopconfirm @positive-click="handleStopAll">
            <template #trigger>
              <NButton type="warning" size="small">全部停止</NButton>
            </template>
            确定要停止所有模拟设备吗？
          </NPopconfirm>
          <NButton type="primary" size="small" @click="handleAdd">
            <template #icon>
              <icon-ic-round-plus class="text-icon" />
            </template>
            新增设备
          </NButton>
          <NButton size="small" @click="getData">
            <template #icon>
              <icon-mdi-refresh class="text-icon" :class="{ 'animate-spin': loading }" />
            </template>
            刷新
          </NButton>
        </div>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        size="small"
        :scroll-x="1200"
        :loading="loading"
        :row-key="(row: Api.Env.SimDeviceStatus) => row.serialNo"
        class="sm:h-full"
      />
      <MqttSimulatorOperateDrawer v-model:visible="drawerVisible" @submitted="getData" />
    </NCard>
  </div>
</template>

<style scoped></style>
