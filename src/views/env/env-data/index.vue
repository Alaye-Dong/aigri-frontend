<script setup lang="ts">
import EnvTrendChart from './modules/env-trend-chart.vue';
import EnvAdvancedChart from './modules/env-advanced-chart.vue';

defineOptions({
  name: 'EnvDataList'
});
</script>

<template>
  <div class="h-full overflow-y-auto p-4">
    <NGrid :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <NGridItem span="24 l:12">
        <EnvTrendChart />
      </NGridItem>
      <NGridItem span="24 l:12">
        <EnvAdvancedChart />
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped></style>
