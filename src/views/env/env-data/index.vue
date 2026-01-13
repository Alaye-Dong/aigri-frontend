<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { fetchGetFarmlandList } from '@/service/api/farming/farmland';
import { fetchGetDeviceList } from '@/service/api/env/device';
import EnvTrendChart from './modules/env-trend-chart.vue';
import EnvAdvancedChart from './modules/env-advanced-chart.vue';

defineOptions({
  name: 'EnvDataList'
});

const farmlandId = ref<string | null>(null);
const deviceId = ref<string | null>(null);

const farmlandOptions = ref<CommonType.Option<string>[]>([]);
const deviceOptions = ref<CommonType.Option<string>[]>([]);

// Store the full farmland objects to look up name by ID if needed (for the API which takes Name)
const farmlandMap = ref<Map<string, string>>(new Map());

const selectedFarmlandName = computed(() => {
  if (!farmlandId.value) return null;
  return farmlandMap.value.get(farmlandId.value) || null;
});

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
      </NSpace>
    </NCard>

    <NGrid :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <NGridItem span="24 l:12">
        <EnvTrendChart
          :farmland-name="selectedFarmlandName"
          :farmland-id="farmlandId"
          :device-id="deviceId"
        />
      </NGridItem>
      <NGridItem span="24 l:12">
        <EnvAdvancedChart
          :farmland-name="selectedFarmlandName"
          :farmland-id="farmlandId"
          :device-id="deviceId"
        />
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped></style>
