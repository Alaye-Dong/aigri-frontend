<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NEmpty, NInput, NSpin } from 'naive-ui';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({ name: 'FarmlandList' });

const props = defineProps<{
  farmlands: Api.Farming.Farmland[];
  loading: boolean;
  selectedId: CommonType.IdType | null;
}>();

const emit = defineEmits<{
  (e: 'select', farmland: Api.Farming.Farmland): void;
  (e: 'add'): void;
}>();

const searchText = ref('');

const filteredList = computed(() => {
  const kw = searchText.value.trim().toLowerCase();
  if (!kw) return props.farmlands;
  return props.farmlands.filter(
    f => f.name.toLowerCase().includes(kw) || (f.location || '').toLowerCase().includes(kw)
  );
});

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dateStr.slice(0, 10).replace(/-/g, '/');
}
</script>

<template>
  <div class="farmland-list-panel">
    <!-- 顶部标题栏 -->
    <div class="panel-header">
      <span class="panel-title">地块列表</span>
      <NButton size="small" ghost type="primary" @click="emit('add')">
        <template #icon>
          <icon-ic-round-plus class="text-icon" />
        </template>
        {{ $t('common.add') }}
      </NButton>
    </div>

    <!-- 搜索框 -->
    <div class="search-wrap">
      <NInput v-model:value="searchText" placeholder="搜索地块名称/位置" clearable size="small">
        <template #prefix>
          <SvgIcon icon="material-symbols:search" />
        </template>
      </NInput>
    </div>

    <!-- 列表区域 -->
    <div class="list-body">
      <NSpin :show="loading">
        <div v-if="filteredList.length === 0 && !loading" class="empty-wrap">
          <NEmpty description="暂无地块数据" size="small" />
        </div>

        <div
          v-for="item in filteredList"
          :key="item.id"
          class="farmland-card"
          :class="{ active: item.id === selectedId }"
          @click="emit('select', item)"
        >
          <!-- 标题行 -->
          <div class="card-top">
            <span class="card-name">{{ item.name }}</span>
            <NTag type="success" size="small" round class="ml-8px">
              {{ item.areaSize ? `${item.areaSize} 亩` : '未知' }}
            </NTag>
          </div>

          <!-- 地址 -->
          <div class="card-addr">
            <SvgIcon icon="material-symbols:location-on-outline-rounded" class="addr-icon" />
            <span class="addr-text">{{ item.location || '未填写位置' }}</span>
          </div>

          <!-- 日期 -->
          <div class="card-date">
            <SvgIcon icon="material-symbols:calendar-today-outline-rounded" class="date-icon" />
            <span>{{ formatDate(item.createTime) }}</span>
          </div>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.farmland-list-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
}

:root.dark .panel-header {
  border-bottom-color: #2d2d42;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

:root.dark .panel-title {
  color: #e0e0f0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #18a058, #36d674);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.add-btn:hover {
  opacity: 0.85;
}

.add-icon {
  font-size: 14px;
}

.search-wrap {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

:root.dark .search-wrap {
  border-bottom-color: #2d2d42;
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px;
}

.list-body::-webkit-scrollbar {
  width: 4px;
}

.list-body::-webkit-scrollbar-thumb {
  background: #d0d0d8;
  border-radius: 2px;
}

.empty-wrap {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

/* 地块卡片 */
.farmland-card {
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  background: #fafafa;
}

:root.dark .farmland-card {
  background: #252535;
}

.farmland-card:hover {
  background: #f0f8f4;
  border-left-color: #52c41a;
}

:root.dark .farmland-card:hover {
  background: #1a2e22;
}

.farmland-card.active {
  background: #e8f5e9;
  border-left-color: #18a058;
  box-shadow: 0 1px 6px rgba(24, 160, 88, 0.15);
}

:root.dark .farmland-card.active {
  background: #1a2e22;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}

.card-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:root.dark .card-name {
  color: #e0e0f0;
}

.area-badge {
  flex-shrink: 0;
  margin-left: 6px;
  padding: 1px 7px;
  background: rgba(24, 160, 88, 0.12);
  color: #18a058;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.card-addr,
.card-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #888;
  margin-top: 3px;
}

.addr-icon,
.date-icon {
  font-size: 12px;
  flex-shrink: 0;
  color: #aaa;
}

.addr-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
