<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';
import { fetchGetEnvDataList } from '@/service/api/env/env-data';

defineOptions({
  name: 'EnvAdvancedChart'
});

const appStore = useAppStore();

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    bottom: '1%',
    left: 'center',
    itemStyle: {
      borderWidth: 0
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [] as string[]
  },
  yAxis: [
    {
      type: 'value',
      name: 'CO2 (ppm)',
      position: 'left'
    },
    {
      type: 'value',
      name: '光照 (Lux)',
      position: 'right',
      splitLine: { show: false } // Avoid too many grid lines
    }
  ],
  series: [] as any[]
}));

async function getData() {
  const { data, error } = await fetchGetEnvDataList({
    current: 1,
    size: 50
  });

  if (!error && data) {
    const records = data.records.reverse();
    const timeData = records.map(item => item.collectTime);
    const co2Series = records.map(item => item.co2Ppm || 0);
    const lightSeries = records.map(item => item.lightLux || 0);

    updateOptions(opts => {
      opts.xAxis.data = timeData;
      opts.series = [
        {
          name: 'CO2浓度',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          data: co2Series,
          itemStyle: { color: '#8A2BE2' },
          areaStyle: {
             color: {
               type: 'linear',
               x: 0, y: 0, x2: 0, y2: 1,
               colorStops: [{ offset: 0, color: 'rgba(138, 43, 226, 0.3)' }, { offset: 1, color: 'rgba(138, 43, 226, 0.01)' }]
             }
          }
        },
        {
          name: '光照强度',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: lightSeries,
          itemStyle: { color: '#FFD700' },
          areaStyle: {
             color: {
               type: 'linear',
               x: 0, y: 0, x2: 0, y2: 1,
               colorStops: [{ offset: 0, color: 'rgba(255, 215, 0, 0.3)' }, { offset: 1, color: 'rgba(255, 215, 0, 0.01)' }]
             }
          }
        }
      ];
      return opts;
    });
  }
}

function init() {
  getData();
}

watch(
  () => appStore.locale, // Refresh if needed for translations later
  () => {}
);

onMounted(() => {
  init();
});
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </NCard>
</template>

<style scoped></style>
