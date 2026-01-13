<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';
import { fetchGetEnvDataList } from '@/service/api/env/env-data';
import { $t } from '@/locales';

defineOptions({
  name: 'EnvTrendChart'
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
  yAxis: {
    type: 'value'
  },
  series: [] as any[]
}));

const props = defineProps<{
  farmlandName?: string | null;
  deviceSerialNo?: string | null;
}>();

async function getData() {
  const { data, error } = await fetchGetEnvDataList({
    current: 1,
    size: 50,
    farmlandName: props.farmlandName,
    deviceSerialNo: props.deviceSerialNo
  });

  if (!error && data) {
    const records = data.records.reverse(); // Show oldest to newest
    const timeData = records.map(item => item.collectTime);
    const tempSeries = records.map(item => item.airTemp || 0);
    const humiditySeries = records.map(item => item.airHumidity || 0);
    const soilSeries = records.map(item => item.soilMoisture || 0);

    updateOptions(opts => {
      opts.xAxis.data = timeData;
      opts.series = [
        {
          name: '空气温度', // Should use translation keys ideally, but generic for now
          type: 'line',
          smooth: true,
          data: tempSeries,
          itemStyle: { color: '#FF7F50' }
        },
        {
          name: '空气湿度',
          type: 'line',
          smooth: true,
          data: humiditySeries,
          itemStyle: { color: '#87CEFA' }
        },
        {
          name: '土壤湿度',
          type: 'line',
          smooth: true,
          data: soilSeries,
          itemStyle: { color: '#32CD32' }
        }
      ];
      return opts;
    });
  }
}

function updateLocale() {
  updateOptions((opts, factory) => {
    // Refresh logic if needed for translations
    const originOpts = factory();
    // Re-apply names if we were using $t
    return opts;
  });
}

function init() {
  getData();
}

watch(
  () => appStore.locale,
  () => {
    updateLocale();
  }
);

watch(
  () => [props.farmlandName, props.deviceSerialNo],
  () => {
    getData();
  }
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
