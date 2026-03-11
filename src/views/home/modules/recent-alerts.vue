<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchGetAlertLogList } from '@/service/api/env/alert-log';

defineOptions({
  name: 'RecentAlerts'
});

const router = useRouter();

// Hardcoded Chinese text
const CARD_TITLE = '最近告警';
const MORE_TEXT = '更多';
const NO_ALERTS_TEXT = '暂无告警';
const SEVERITY_LABELS: Record<string, string> = {
  info: '提示',
  warning: '警告',
  danger: '严重'
};

const loading = ref(false);
const alertList = ref<Api.Env.AlertLog[]>([]);

const severityTypeMap: Record<string, 'info' | 'warning' | 'error'> = {
  info: 'info',
  warning: 'warning',
  danger: 'error'
};

function getSeverityLabel(severity: string): string {
  return SEVERITY_LABELS[severity] || severity;
}

function goToAlertLog() {
  router.push('/env/alert-log');
}

async function getAlertList() {
  loading.value = true;
  const { error, data } = await fetchGetAlertLogList({
    current: 1,
    size: 5
  });
  loading.value = false;
  if (error) return;
  alertList.value = data?.records || [];
}

function formatTime(time: string): string {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return time.slice(0, 10);
}

onMounted(() => {
  getAlertList();
});
</script>

<template>
  <NCard :title="CARD_TITLE" :bordered="false" size="small" segmented class="card-wrapper" :loading="loading">
    <template #header-extra>
      <a class="cursor-pointer text-primary transition-all duration-300 hover:underline" @click="goToAlertLog">
        {{ MORE_TEXT }}
      </a>
    </template>
    <NList v-if="alertList.length > 0">
      <NListItem v-for="item in alertList" :key="item.id">
        <NThing>
          <template #header>
            <div class="flex items-center gap-8px">
              <NTag :type="severityTypeMap[item.severity] || 'default'" size="small">
                {{ getSeverityLabel(item.severity) }}
              </NTag>
              <span class="text-14px">{{ item.alertContent }}</span>
            </div>
          </template>
          <template #description>
            <div class="flex items-center gap-12px text-12px text-gray-500">
              <span>{{ item.farmlandName || '--' }}</span>
              <span>{{ item.deviceSerialNo || '--' }}</span>
              <span>{{ formatTime(item.createTime) }}</span>
            </div>
          </template>
        </NThing>
      </NListItem>
    </NList>
    <NEmpty v-else :description="NO_ALERTS_TEXT" />
  </NCard>
</template>

<style scoped></style>
