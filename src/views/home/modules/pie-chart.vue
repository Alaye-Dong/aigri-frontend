<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchCostDistribution } from '@/service/api/dashboard';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'PieChart'
});

const CHART_TITLE = '成本分布';

const operateTypeColorMap: Record<string, string> = {
  播种: '#22c55e',
  施肥: '#84cc16',
  灌溉: '#3b82f6',
  除草: '#eab308',
  病虫害防治: '#ef4444',
  收获: '#f97316',
  其他: '#6b7280'
};

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: ¥{c} ({d}%)'
  },
  legend: {
    bottom: '1%',
    left: 'center',
    itemStyle: {
      borderWidth: 0
    }
  },
  series: [
    {
      name: CHART_TITLE,
      type: 'pie',
      radius: ['20%', '70%'],
      center: ['50%', '45%'],
      roseType: 'area',
      itemStyle: {
        borderRadius: 6
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%'
      },
      labelLine: {
        length: 2,
        length2: 8
      },
      data: [] as { name: string; value: number; itemStyle: { color: string } }[]
    }
  ]
}));

const loading = ref(true);
const noData = ref(false);

async function loadData() {
  loading.value = true;
  noData.value = false;

  const { error, data } = await fetchCostDistribution();
  loading.value = false;

  if (error || !data?.length) {
    noData.value = true;
    return;
  }

  updateOptions(opts => {
    opts.series[0].data = data.map(item => ({
      name: item.operateType,
      value: item.totalCost,
      itemStyle: { color: operateTypeColorMap[item.operateType] || '#6b7280' }
    }));
    opts.series[0].name = CHART_TITLE;
    return opts;
  });
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <NCard title="成本分布" :bordered="false" size="small" class="card-wrapper">
    <NSpin :show="loading">
      <div v-if="noData" class="h-360px flex-center">
        <NEmpty description="暂无成本数据" />
      </div>
      <div v-else ref="domRef" class="h-360px overflow-hidden"></div>
    </NSpin>
  </NCard>
</template>

<style scoped></style>
