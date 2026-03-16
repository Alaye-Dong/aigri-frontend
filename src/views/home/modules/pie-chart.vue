<script setup lang="ts">
import { onMounted } from 'vue';
import { fetchDeviceStatusDistribution } from '@/service/api/dashboard';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'PieChart'
});

const CHART_TITLE = '设备状态分布';
const LABELS = {
  online: '在线',
  offline: '离线',
  fault: '故障',
  maintenance: '维护中'
};

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
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
      color: ['#22c55e', '#9ca3af', '#ef4444', '#f97316'],
      name: CHART_TITLE,
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '14',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [] as { name: string; value: number }[]
    }
  ]
}));

async function loadData() {
  const { error, data } = await fetchDeviceStatusDistribution();
  if (error || !data) return;

  updateOptions(opts => {
    opts.series[0].data = [
      { name: LABELS.online, value: data.online },
      { name: LABELS.offline, value: data.offline },
      { name: LABELS.fault, value: data.fault },
      { name: LABELS.maintenance, value: data.maintenance }
    ];
    opts.series[0].name = CHART_TITLE;
    return opts;
  });
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </NCard>
</template>

<style scoped></style>
