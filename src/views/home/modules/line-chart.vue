<script setup lang="ts">
import { watch } from 'vue';
import { fetchGetEnvDataList } from '@/service/api/env/env-data';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'LineChart'
});

const appStore = useAppStore();

// Hardcoded Chinese text for chart labels
const TEMP_LABEL = '温度 (°C)';
const HUMIDITY_LABEL = '湿度 (%)';

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: [TEMP_LABEL, HUMIDITY_LABEL],
    top: '0'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%'
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [] as string[]
  },
  yAxis: [
    {
      type: 'value',
      name: TEMP_LABEL,
      position: 'left',
      axisLabel: {
        formatter: '{value}°C'
      }
    },
    {
      type: 'value',
      name: HUMIDITY_LABEL,
      position: 'right',
      axisLabel: {
        formatter: '{value}%'
      }
    }
  ],
  series: [
    {
      color: '#ff6b6b',
      name: TEMP_LABEL,
      type: 'line',
      smooth: true,
      yAxisIndex: 0,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: 'rgba(255, 107, 107, 0.6)'
            },
            {
              offset: 1,
              color: 'rgba(255, 107, 107, 0.05)'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: [] as number[]
    },
    {
      color: '#4ecdc4',
      name: HUMIDITY_LABEL,
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: 'rgba(78, 205, 196, 0.6)'
            },
            {
              offset: 1,
              color: 'rgba(78, 205, 196, 0.05)'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: [] as number[]
    }
  ]
}));

async function fetchEnvData() {
  const { data, error } = await fetchGetEnvDataList({
    current: 1,
    size: 24
  });

  if (error || !data?.records?.length) {
    return;
  }

  // Sort by collectTime ascending for chronological display
  const sortedRecords = [...data.records].sort(
    (a, b) => new Date(a.collectTime).getTime() - new Date(b.collectTime).getTime()
  );

  const timeLabels: string[] = [];
  const tempData: number[] = [];
  const humidityData: number[] = [];

  sortedRecords.forEach(record => {
    // Format collectTime to HH:mm
    const date = new Date(record.collectTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    timeLabels.push(`${hours}:${minutes}`);
    tempData.push(record.airTemp ?? 0);
    humidityData.push(record.airHumidity ?? 0);
  });

  updateOptions(opts => {
    opts.xAxis.data = timeLabels;
    opts.series[0].data = tempData;
    opts.series[1].data = humidityData;

    return opts;
  });
}

async function init() {
  await fetchEnvData();
}

watch(
  () => appStore.locale,
  () => {
    // Labels are hardcoded, no locale update needed
  }
);

// init
init();
</script>

<template>
  <NCard title="环境趋势" :bordered="false" size="small" class="card-wrapper">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </NCard>
</template>

<style scoped></style>
