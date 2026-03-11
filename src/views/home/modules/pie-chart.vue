<script setup lang="ts">
import { onMounted } from 'vue';
import { fetchGetAlertLogList } from '@/service/api/env/alert-log';
import { useEcharts } from '@/hooks/common/echarts';

defineOptions({
  name: 'PieChart'
});

// Hardcoded Chinese text for chart labels
const CHART_TITLE = '告警分布';
const LABELS = {
  info: '提示',
  warning: '警告',
  danger: '严重'
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
      color: ['#3b82f6', '#f59e0b', '#ef4444'],
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

interface AlertLogItem {
  severity: string;
  [key: string]: unknown;
}

async function fetchAlertData() {
  const { error, data } = await fetchGetAlertLogList({
    current: 1,
    size: 1000
  });

  if (error || !data?.records) return { info: 0, warning: 0, danger: 0 };

  const records = data.records as AlertLogItem[];

  const severityCount: Record<string, number> = {
    info: 0,
    warning: 0,
    danger: 0
  };

  records.forEach(record => {
    const severity = record.severity?.toLowerCase() || 'info';
    if (severityCount[severity] !== undefined) {
      severityCount[severity] += 1;
    }
  });

  return severityCount;
}

function getChartData(severityCount: Record<string, number>) {
  return [
    { name: LABELS.info, value: severityCount.info },
    { name: LABELS.warning, value: severityCount.warning },
    { name: LABELS.danger, value: severityCount.danger }
  ];
}

async function loadData() {
  const severityCount = await fetchAlertData();

  updateOptions(opts => {
    opts.series[0].data = getChartData(severityCount);
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
