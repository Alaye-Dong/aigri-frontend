<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';
import { fetchCostTrend } from '@/service/api/dashboard';

defineOptions({
  name: 'CostChart'
});

const CHART_TITLE = '成本趋势';

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const item = params[0];
      return `${item.axisValue}<br/>成本: ¥${item.value.toFixed(2)}`;
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
    boundaryGap: false,
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
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: [] as number[],
      lineStyle: {
        width: 3,
        color: '#3b82f6'
      },
      itemStyle: {
        color: '#3b82f6',
        borderColor: '#fff',
        borderWidth: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ]
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

  const { error, data } = await fetchCostTrend();
  loading.value = false;

  if (error || !data?.length) {
    noData.value = true;
    return;
  }

  updateOptions(opts => {
    opts.xAxis.data = data.map(item => item.month);
    opts.series[0].data = data.map(item => item.totalCost);
    return opts;
  });
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <NCard :title="CHART_TITLE" :bordered="false" size="small" class="card-wrapper">
    <NSpin :show="loading">
      <div v-if="noData" class="h-360px flex-center">
        <NEmpty description="暂无成本趋势数据" />
      </div>
      <div v-else ref="domRef" class="h-360px overflow-hidden"></div>
    </NSpin>
  </NCard>
</template>

<style scoped></style>
