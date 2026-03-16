<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';
import { fetchCostDistribution } from '@/service/api/dashboard';

defineOptions({
  name: 'CostChart'
});

const CHART_TITLE = '成本分析';

// Colors from farming-activities.vue
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
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: (params: any) => {
      const item = params[0];
      return `${item.name}<br/>成本: ¥${item.value.toFixed(2)}`;
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: [] as string[],
    axisLabel: {
      interval: 0,
      rotate: 30
    }
  },
  yAxis: {
    type: 'value',
    name: '成本 (元)',
    axisLabel: {
      formatter: '¥{value}'
    }
  },
  series: [
    {
      name: CHART_TITLE,
      type: 'bar',
      data: [] as { value: number; itemStyle: { color: string } }[],
      barWidth: '50%',
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
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
    opts.xAxis.data = data.map(item => item.operateType);
    opts.series[0].data = data.map(item => ({
      value: item.totalCost,
      itemStyle: { color: operateTypeColorMap[item.operateType] || '#6b7280' }
    }));
    return opts;
  });
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <NCard :title="CHART_TITLE" :bordered="false" class="card-wrapper">
    <NSpin :show="loading">
      <div v-if="noData" class="h-320px flex-center">
        <NEmpty description="暂无成本数据" />
      </div>
      <div v-else ref="domRef" class="h-320px overflow-hidden"></div>
    </NSpin>
  </NCard>
</template>

<style scoped></style>