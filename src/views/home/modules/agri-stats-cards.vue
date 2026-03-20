<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchDashboardStats } from '@/service/api/dashboard';

defineOptions({
  name: 'AgriStatsCards'
});

interface StatsCard {
  key: string;
  title: string;
  value: number;
  unit: string;
  color: string;
  icon: string;
  suffix?: string;
}

// Stats data
const deviceCount = ref(0);
const onlineDeviceCount = ref(0);
const onlineRate = ref('0%');
const farmlandArea = ref(0);
const activeCropsCount = ref(0);
const pendingAlertCount = ref(0);
const loading = ref(true);

// Flat style stats cards with agriculture-themed colors
const statsCards = computed<StatsCard[]>(() => [
  {
    key: 'deviceCount',
    title: '设备总数',
    value: deviceCount.value,
    unit: '台',
    color: '#22c55e',
    icon: 'ant-design:api-outlined'
  },
  {
    key: 'onlineDevices',
    title: '在线设备',
    value: onlineDeviceCount.value,
    unit: '台',
    color: '#3b82f6',
    icon: 'ant-design:wifi-outlined',
    suffix: onlineRate.value
  },
  {
    key: 'farmlandArea',
    title: '农田面积',
    value: farmlandArea.value,
    unit: '亩',
    color: '#f59e0b',
    icon: 'ant-design:area-chart-outlined'
  },
  {
    key: 'activeCrops',
    title: '种植作物',
    value: activeCropsCount.value,
    unit: '种',
    color: '#8b5cf6',
    icon: 'ant-design:experiment-outlined'
  },
  {
    key: 'pendingAlerts',
    title: '未处理告警',
    value: pendingAlertCount.value,
    unit: '条',
    color: '#ef4444',
    icon: 'ant-design:alert-outlined'
  }
]);

// Helper to safely parse number (handles string/number from backend)
function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value) || 0;
  return 0;
}

// Fetch all stats data from dashboard API
async function fetchStats() {
  loading.value = true;
  try {
    const { error, data } = await fetchDashboardStats();
    if (error) {
      console.error('Dashboard API error:', error);
      return;
    }
    if (data) {
      deviceCount.value = parseNumber(data.device?.total);
      onlineDeviceCount.value = parseNumber(data.device?.online);
      onlineRate.value = data.device?.onlineRate ? `${Math.round(data.device.onlineRate)}%` : '0%';
      farmlandArea.value = parseNumber(data.farmland?.totalArea);
      activeCropsCount.value = parseNumber(data.cropCount);
      pendingAlertCount.value = parseNumber(data.alert?.pending);
    }
  } catch (error) {
    console.error('Failed to fetch agriculture stats:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <NCard :bordered="false" size="small" class="min-h-24 card-wrapper">
    <NSpin :show="loading" class="w-full">
      <div class="flex items-center">
        <NGrid cols="s:1 m:2 l:5" responsive="screen" :x-gap="16" :y-gap="16" class="w-full">
          <NGi v-for="item in statsCards" :key="item.key">
            <div
              class="flex items-center gap-4 rounded-lg px-4 py-4 transition-all duration-300 hover:shadow-md"
              :style="{ backgroundColor: `${item.color}10` }"
            >
              <!-- Icon -->
              <div
                class="flex-center h-12 w-12 flex-shrink-0 rounded-lg"
                :style="{ backgroundColor: `${item.color}20` }"
              >
                <SvgIcon :icon="item.icon" class="text-xl" :style="{ color: item.color }" />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <h3 class="mb-1 text-sm text-gray-500 dark:text-gray-400">{{ item.title }}</h3>
                <div class="flex items-baseline gap-1">
                  <CountTo
                    :start-value="0"
                    :end-value="item.value"
                    :duration="1500"
                    class="text-2xl font-bold"
                    :style="{ color: item.color }"
                  />
                  <span class="text-xs text-gray-400">{{ item.unit }}</span>
                  <span v-if="item.suffix" class="text-xs text-gray-400">· {{ item.suffix }}</span>
                </div>
              </div>
            </div>
          </NGi>
        </NGrid>
      </div>
    </NSpin>
  </NCard>
</template>

<style scoped>
.card-wrapper :deep(.n-card__content) {
  display: flex;
  align-items: center;
}
</style>
