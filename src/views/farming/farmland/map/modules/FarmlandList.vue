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
  <div class="farmland-list-panel w-260px flex flex-col flex-shrink-0 overflow-hidden rounded-8px bg-white shadow-sm">
    <!-- 顶部标题栏 -->
    <div
      class="panel-header dark:border-dark-80 flex items-center justify-between border-b border-gray-100 px-16px py-10px"
    >
      <span class="panel-title text-15px text-gray-900 font-600 dark:text-gray-100">地块列表</span>
      <NButton size="small" ghost type="primary" @click="emit('add')">
        <template #icon>
          <icon-ic-round-plus class="text-icon" />
        </template>
        {{ $t('common.add') }}
      </NButton>
    </div>

    <!-- 搜索框 -->
    <div class="search-wrap dark:border-dark-80 border-b border-gray-100 px-12px py-8px">
      <NInput v-model:value="searchText" placeholder="搜索地块名称/位置" clearable size="small">
        <template #prefix>
          <SvgIcon icon="material-symbols:search" />
        </template>
      </NInput>
    </div>

    <!-- 列表区域 -->
    <div class="list-body flex-1 overflow-y-auto px-8px py-8px">
      <NSpin :show="loading">
        <div v-if="filteredList.length === 0 && !loading" class="empty-wrap flex justify-center py-40px">
          <NEmpty description="暂无地块数据" size="small" />
        </div>

        <div
          v-for="item in filteredList"
          :key="item.id"
          class="farmland-card transition-all-200px mb-6px cursor-pointer border-l-3px border-transparent rounded-8px bg-gray-50 px-12px py-10px hover:border-l-green-500 dark:bg-dark-300 hover:bg-green-50 dark:hover:bg-dark-200"
          :class="{ 'active border-primary shadow-sm dark:bg-dark-200': item.id === selectedId }"
          @click="emit('select', item)"
        >
          <!-- 标题行 -->
          <div class="card-top mb-5px flex items-center justify-between">
            <span
              class="card-name flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-13px text-gray-900 font-600 dark:text-gray-100"
            >
              {{ item.name }}
            </span>
            <NTag type="success" size="small" round class="ml-8px">
              {{ item.areaSize ? `${item.areaSize} 亩` : '未知' }}
            </NTag>
          </div>

          <!-- 地址 -->
          <div class="card-addr mt-3px flex items-center gap-4px text-11px text-gray-500">
            <SvgIcon
              icon="material-symbols:location-on-outline-rounded"
              class="addr-icon flex-shrink-0 text-12px text-gray-400"
            />
            <span class="addr-text overflow-hidden text-ellipsis whitespace-nowrap">
              {{ item.location || '未填写位置' }}
            </span>
          </div>

          <!-- 日期 -->
          <div class="card-date mt-3px flex items-center gap-4px text-11px text-gray-500">
            <SvgIcon
              icon="material-symbols:calendar-today-outline-rounded"
              class="date-icon flex-shrink-0 text-12px text-gray-400"
            />
            <span>{{ formatDate(item.createTime) }}</span>
          </div>
        </div>
      </NSpin>
    </div>
  </div>
</template>
