<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { createReusableTemplate } from '@vueuse/core';
import { fetchDashboardStats } from '@/service/api/dashboard';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'AgriStatsCards'
});

interface StatsCard {
  key: string;
  title: string;
  value: number;
  unit: string;
  color: {
    start: string;
    end: string;
  };
  icon: string;
}

// Stats data
const deviceCount = ref(0);
const onlineDeviceCount = ref(0);
const farmlandArea = ref(0);
const activeCropsCount = ref(0);
const loading = ref(true);

const themeStore = useThemeStore();

// Stats cards configuration with agriculture-themed gradients (hardcoded Chinese text)
const statsCards = computed<StatsCard[]>(() => [
  {
    key: 'deviceCount',
    title: '设备总数',
    value: deviceCount.value,
    unit: '',
    color: {
      start: '#22c55e',
      end: '#16a34a'
    },
    icon: 'ant-design:api-outlined'
  },
  {
    key: 'onlineDevices',
    title: '在线设备',
    value: onlineDeviceCount.value,
    unit: '',
    color: {
      start: '#3b82f6',
      end: '#1d4ed8'
    },
    icon: 'ant-design:wifi-outlined'
  },
  {
    key: 'farmlandArea',
    title: '农田面积',
    value: farmlandArea.value,
    unit: '亩',
    color: {
      start: '#f59e0b',
      end: '#d97706'
    },
    icon: 'ant-design:area-chart-outlined'
  },
  {
    key: 'activeCrops',
    title: '种植作物',
    value: activeCropsCount.value,
    unit: '种',
    color: {
      start: '#8b5cf6',
      end: '#7c3aed'
    },
    icon: 'ant-design:experiment-outlined'
  }
]);

// Gradient background component
interface GradientBgProps {
  gradientColor: string;
}

const [DefineGradientBg, GradientBg] = createReusableTemplate<GradientBgProps>();

function getGradientColor(color: StatsCard['color']) {
  return `linear-gradient(to bottom right, ${color.start}, ${color.end})`;
}

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
      farmlandArea.value = parseNumber(data.farmland?.totalArea);
      activeCropsCount.value = parseNumber(data.cropCount);
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
  <NCard :bordered="false" size="small" class="card-wrapper">
    <!-- define component start: GradientBg -->
    <DefineGradientBg v-slot="{ $slots, gradientColor }">
      <div
        class="relative overflow-hidden px-16px pb-4px pt-8px text-white"
        :style="{ backgroundImage: gradientColor, borderRadius: themeStore.themeRadius + 'px' }"
      >
        <component :is="$slots.default" />
      </div>
    </DefineGradientBg>
    <!-- define component end: GradientBg -->

    <NSpin :show="loading">
      <NGrid cols="s:1 m:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
        <NGi v-for="item in statsCards" :key="item.key">
          <GradientBg :gradient-color="getGradientColor(item.color)" class="flex-1">
            <h3 class="text-16px font-medium opacity-90">{{ item.title }}</h3>
            <div class="flex justify-between pt-12px">
              <SvgIcon :icon="item.icon" class="text-32px opacity-80" />
              <div class="flex items-baseline gap-4px">
                <CountTo
                  :start-value="0"
                  :end-value="item.value"
                  :duration="1500"
                  class="text-30px text-white font-bold"
                />
                <span v-if="item.unit" class="text-14px opacity-80">{{ item.unit }}</span>
              </div>
            </div>
          </GradientBg>
        </NGi>
      </NGrid>
    </NSpin>
  </NCard>
</template>

<style scoped>
.card-wrapper :deep(.n-card__content) {
  padding-bottom: 0;
}
</style>
