<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchGetFarmingLogList } from '@/service/api/farming/farming-log';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({
  name: 'FarmingActivities'
});

const router = useRouter();

// Hardcoded Chinese text
const CARD_TITLE = '农事活动';
const MORE_TEXT = '更多';
const NO_ACTIVITY_TEXT = '暂无农事记录';

interface ActivityItem {
  id: CommonType.IdType;
  operateType: string;
  content: string | null;
  farmlandName: string | null;
  operateTime: string;
  userRealName: string | null;
}

const loading = ref(false);
const activities = ref<ActivityItem[]>([]);

/** 操作类型图标映射 */
const operateTypeIconMap: Record<string, string> = {
  播种: 'fluent:plant-grass-24-filled',
  施肥: 'mdi:fertilizer',
  灌溉: 'mdi:water-pump',
  除草: 'mdi:grass',
  病虫害防治: 'mdi:bug-outline',
  收获: 'fluent:food-apple-24-filled',
  其他: 'mdi:dots-horizontal'
};

/** 操作类型颜色映射 */
const operateTypeColorMap: Record<string, string> = {
  播种: '#22c55e',
  施肥: '#84cc16',
  灌溉: '#3b82f6',
  除草: '#eab308',
  病虫害防治: '#ef4444',
  收获: '#f97316',
  其他: '#6b7280'
};

function getOperateIcon(type: string): string {
  return operateTypeIconMap[type] || 'mdi:dots-horizontal';
}

function getOperateColor(type: string): string {
  return operateTypeColorMap[type] || '#6b7280';
}

function goToFarmingLog() {
  router.push('/farming/farming-log');
}

async function fetchActivities() {
  loading.value = true;
  const { error, data } = await fetchGetFarmingLogList({
    current: 1,
    size: 5
  });
  loading.value = false;
  if (!error && data?.records) {
    activities.value = data.records.map(item => ({
      id: item.id,
      operateType: item.operateType,
      content: item.content,
      farmlandName: item.farmlandName,
      operateTime: item.operateTime,
      userRealName: item.userRealName
    }));
  }
}

onMounted(() => {
  fetchActivities();
});
</script>

<template>
  <NCard :title="CARD_TITLE" :bordered="false" size="small" segmented class="h-full overflow-hidden card-wrapper">
    <template #header-extra>
      <a
        class="cursor-pointer text-13px text-primary transition-all duration-300 hover:underline"
        @click="goToFarmingLog"
      >
        {{ MORE_TEXT }}
      </a>
    </template>

    <NSpin :show="loading">
      <div v-if="activities.length === 0 && !loading" class="flex-center py-32px">
        <div class="flex-col-center gap-12px">
          <SvgIcon icon="mdi:sprout-outline" class="text-48px text-gray-300 dark:text-gray-600" />
          <span class="text-14px text-gray-400">{{ NO_ACTIVITY_TEXT }}</span>
        </div>
      </div>

      <NList v-else class="activity-list">
        <NListItem v-for="item in activities" :key="item.id" class="activity-item group">
          <div class="w-full flex items-start gap-12px py-4px">
            <!-- 图标区域 -->
            <div
              class="h-36px w-36px flex-center flex-shrink-0 rounded-lg transition-all duration-300 group-hover:scale-110"
              :style="{
                background: `linear-gradient(135deg, ${getOperateColor(item.operateType)}15, ${getOperateColor(item.operateType)}25)`,
                boxShadow: `0 2px 8px ${getOperateColor(item.operateType)}20`
              }"
            >
              <SvgIcon
                :icon="getOperateIcon(item.operateType)"
                class="text-18px"
                :style="{ color: getOperateColor(item.operateType) }"
              />
            </div>

            <!-- 内容区域 -->
            <div class="min-w-0 flex-1">
              <div class="mb-4px flex items-center gap-8px">
                <NTag
                  :bordered="false"
                  size="small"
                  round
                  :style="{
                    background: `${getOperateColor(item.operateType)}18`,
                    color: getOperateColor(item.operateType)
                  }"
                >
                  {{ item.operateType }}
                </NTag>
                <span v-if="item.farmlandName" class="max-w-120px truncate text-12px text-gray-500 dark:text-gray-400">
                  {{ item.farmlandName }}
                </span>
              </div>
              <p class="line-clamp-1 mb-4px text-13px text-gray-700 leading-relaxed dark:text-gray-300">
                {{ item.content || '-' }}
              </p>
              <div class="flex items-center gap-12px text-12px text-gray-400">
                <span class="flex items-center gap-4px">
                  <SvgIcon icon="mdi:account-outline" class="text-14px" />
                  {{ item.userRealName || '-' }}
                </span>
                <span class="flex items-center gap-4px">
                  <SvgIcon icon="mdi:clock-outline" class="text-14px" />
                  {{ item.operateTime }}
                </span>
              </div>
            </div>
          </div>
        </NListItem>
      </NList>
    </NSpin>
  </NCard>
</template>

<style scoped>
.activity-list {
  --n-list-item-padding: 8px 0;
}

.activity-item {
  transition: all 0.3s ease;
  cursor: pointer;
}

.activity-item:hover {
  background: linear-gradient(90deg, transparent, var(--n-color-hover, rgba(0, 0, 0, 0.02)), transparent);
}

.activity-item:not(:last-child) {
  border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
}

:deep(.n-list-item) {
  padding: 8px 4px;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
