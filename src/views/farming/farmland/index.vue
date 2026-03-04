<script setup lang="tsx">
import { nextTick, ref, watch } from 'vue';
import { NCard, NTabPane, NTabs } from 'naive-ui';
import { $t } from '@/locales';
import FarmlandListTab from './components/FarmlandListTab.vue';
import FarmlandMapTab from './components/FarmlandMapTab.vue';

defineOptions({
  name: 'FarmingFarmland'
});

const activeTab = ref<'list' | 'map'>('list');
const mapTabRef = ref<InstanceType<typeof FarmlandMapTab> | null>(null);

// 切换到地图标签时刷新地图尺寸
watch(activeTab, async newTab => {
  if (newTab === 'map') {
    await nextTick();
    mapTabRef.value?.invalidateSize();
  }
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard title="" :bordered="false" class="flex-1-hidden card-wrapper">
      <template #header>
        <div class="flex items-center justify-between">
          <NTabs v-model:value="activeTab" type="segment" size="small">
            <NTabPane name="list" tab="列表视图" />
            <NTabPane name="map" tab="地图视图" />
          </NTabs>
        </div>
      </template>
      <div class="h-full">
        <FarmlandListTab v-show="activeTab === 'list'" />
        <FarmlandMapTab v-show="activeTab === 'map'" ref="mapTabRef" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
:deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

:deep(.n-card-header) {
  padding: 12px 16px;
}
</style>
