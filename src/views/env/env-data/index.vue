<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchGetFarmlandList } from '@/service/api/farming/farmland';
import { fetchGetDeviceList } from '@/service/api/env/device';
import EnvTrendChart from './modules/env-trend-chart.vue';
import EnvAdvancedChart from './modules/env-advanced-chart.vue';
import EnvDataCard from './modules/env-data-card.vue';

defineOptions({
  name: 'EnvDataList'
});

const farmlandId = ref<string | null>(null);
const deviceId = ref<string | null>(null);

const farmlandOptions = ref<CommonType.Option<string>[]>([]);
const deviceOptions = ref<CommonType.Option<string>[]>([]);

// Store the full farmland objects to look up name by ID if needed (for the API which takes Name)
const farmlandMap = ref<Map<string, string>>(new Map());

// Time range for charts - default to last 24 hours (store as timestamp pair)
const timeRangeTimestamp = ref<[number, number] | null>(null);

// Computed formatted time range for API calls
const formattedTimeRange = computed(() => {
  if (!timeRangeTimestamp.value) return null;
  return [
    formatDateTime(new Date(timeRangeTimestamp.value[0])),
    formatDateTime(new Date(timeRangeTimestamp.value[1]))
  ] as [string, string];
});

const selectedFarmlandName = computed(() => {
  if (!farmlandId.value) return null;
  return farmlandMap.value.get(farmlandId.value) || null;
});

// Format date time to string
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Initialize default time range (last 24 hours)
function initDefaultTimeRange() {
  const now = Date.now();
  const startTime = now - 24 * 60 * 60 * 1000; // 24 hours ago
  timeRangeTimestamp.value = [startTime, now];
}

// Shortcut options for date picker (return timestamps in milliseconds)
const timeRangeShortcuts = {
  最近24小时: () => {
    const end = Date.now();
    const start = end - 24 * 60 * 60 * 1000;
    return [start, end] as [number, number];
  },
  最近7天: () => {
    const end = Date.now();
    const start = end - 7 * 24 * 60 * 60 * 1000;
    return [start, end] as [number, number];
  },
  最近30天: () => {
    const end = Date.now();
    const start = end - 30 * 24 * 60 * 60 * 1000;
    return [start, end] as [number, number];
  }
};

async function getFarmlandList() {
  const { data, error } = await fetchGetFarmlandList({ current: 1, size: 100 });
  if (!error && data) {
    farmlandOptions.value = data.records.map(item => {
      const idStr = String(item.id);
      farmlandMap.value.set(idStr, item.name);
      return {
        label: item.name,
        value: idStr
      };
    });
  }
}

async function getDeviceList(fId?: string) {
  const params: any = { current: 1, size: 100 };
  if (fId) {
    params.farmlandId = fId;
  }

  const { data, error } = await fetchGetDeviceList(params);
  if (!error && data) {
    deviceOptions.value = data.records.map(item => ({
      label: `${item.serialNo} (${item.type})`,
      value: String(item.id)
    }));
  }
}

function handleFarmlandChange(val: string | null) {
  farmlandId.value = val;
  deviceId.value = null; // Reset device when farmland changes
  getDeviceList(val || undefined);
}

onMounted(() => {
  getFarmlandList();
  getDeviceList(); // Initial load of devices (all)
  initDefaultTimeRange(); // Initialize default time range
});
</script>

<template>
  <div class="h-full flex flex-col gap-4 overflow-y-auto p-4">
    <NCard :bordered="false" class="mb-2">
      <NSpace align="center" :size="24">
        <NSpace align="center">
          <span>农田:</span>
          <NSelect
            v-model:value="farmlandId"
            :options="farmlandOptions"
            placeholder="请选择农田"
            clearable
            class="w-200px"
            @update:value="handleFarmlandChange"
          />
        </NSpace>
        <NSpace align="center">
          <span>设备:</span>
          <NSelect
            v-model:value="deviceId"
            :options="deviceOptions"
            placeholder="请选择设备"
            clearable
            filterable
            class="w-240px"
          />
        </NSpace>
        <NSpace align="center">
          <span>时间范围:</span>
          <NDatePicker
            v-model:value="timeRangeTimestamp"
            type="datetimerange"
            :shortcuts="timeRangeShortcuts"
            clearable
            class="w-400px"
          />
        </NSpace>
      </NSpace>
    </NCard>

    <EnvDataCard :farmland-id="farmlandId" :device-id="deviceId" />

    <EnvTrendChart
      :farmland-name="selectedFarmlandName"
      :farmland-id="farmlandId"
      :device-id="deviceId"
      :start-time="formattedTimeRange?.[0]"
      :end-time="formattedTimeRange?.[1]"
    />

    <EnvAdvancedChart
      :farmland-name="selectedFarmlandName"
      :farmland-id="farmlandId"
      :device-id="deviceId"
      :start-time="formattedTimeRange?.[0]"
      :end-time="formattedTimeRange?.[1]"
    />
  </div>
</template>

<style scoped></style>
