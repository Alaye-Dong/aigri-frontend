<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchGetDeviceList, fetchGetOnlineDevices } from '@/service/api/env/device';
import { fetchGetAlertLogList } from '@/service/api/env/alert-log';
import { fetchGetFarmlandList } from '@/service/api/farming/farmland';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'HeaderBanner'
});

const appStore = useAppStore();
const authStore = useAuthStore();

const gap = computed(() => (appStore.isMobile ? 0 : 16));

// Stats data
const deviceCount = ref(0);
const onlineDeviceCount = ref(0);
const pendingAlertCount = ref(0);
const farmlandCount = ref(0);
const loading = ref(true);

// Calculate online rate
const onlineRate = computed(() => {
  if (deviceCount.value === 0) return '0%';
  return `${Math.round((onlineDeviceCount.value / deviceCount.value) * 100)}%`;
});

interface StatisticData {
  id: number;
  label: string;
  value: string;
  icon: string;
}

// Hardcoded Chinese text for agriculture-specific labels
const statisticData = computed<StatisticData[]>(() => [
  {
    id: 0,
    label: '设备在线率',
    value: onlineRate.value,
    icon: 'ant-design:wifi-outlined'
  },
  {
    id: 1,
    label: '未处理告警',
    value: String(pendingAlertCount.value),
    icon: 'ant-design:alert-outlined'
  },
  {
    id: 2,
    label: '监控农田',
    value: String(farmlandCount.value),
    icon: 'ant-design:area-chart-outlined'
  }
]);

// Fetch all stats
async function fetchStats() {
  loading.value = true;
  try {
    // Fetch device count
    const deviceRes = await fetchGetDeviceList({ current: 1, size: 1 });
    if (!deviceRes.error && deviceRes.data) {
      deviceCount.value = deviceRes.data.total || 0;
    }

    // Fetch online devices
    const onlineRes = await fetchGetOnlineDevices();
    if (!onlineRes.error && onlineRes.data) {
      onlineDeviceCount.value = onlineRes.data.length || 0;
    }

    // Fetch pending alerts (status = '0' means pending)
    const alertRes = await fetchGetAlertLogList({ current: 1, size: 1, status: '0' });
    if (!alertRes.error && alertRes.data) {
      pendingAlertCount.value = alertRes.data.total || 0;
    }

    // Fetch farmland count
    const farmlandRes = await fetchGetFarmlandList({ current: 1, size: 1 });
    if (!farmlandRes.error && farmlandRes.data) {
      farmlandCount.value = farmlandRes.data.total || 0;
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:18">
        <div class="flex-y-center">
          <div class="size-72px shrink-0 overflow-hidden rd-1/2">
            <SvgIcon icon="ph:user-circle" class="size-full" />
          </div>
          <div class="pl-12px">
            <h3 class="text-18px font-semibold">
              {{ $t('page.home.greeting', { userName: authStore.userInfo.userName }) }}
            </h3>
            <p class="text-#999 leading-30px">{{ $t('page.home.weatherDesc') }}</p>
          </div>
        </div>
      </NGi>
      <NGi span="24 s:24 m:6">
        <NSpace :size="24" justify="end">
          <div v-for="item in statisticData" :key="item.id" class="flex-y-center gap-8px whitespace-nowrap">
            <SvgIcon :icon="item.icon" class="text-20px text-primary" />
            <NStatistic v-bind="item" />
          </div>
        </NSpace>
      </NGi>
    </NGrid>
  </NCard>
</template>

<style scoped></style>
