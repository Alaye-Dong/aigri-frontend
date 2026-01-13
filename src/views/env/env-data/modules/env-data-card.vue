<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { createReusableTemplate } from '@vueuse/core';
import { fetchGetLatestByDevice, fetchGetLatestByFarmland } from '@/service/api/env/env-data';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'EnvDataCard'
});

interface Props {
  farmlandId?: string | null;
  deviceId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  farmlandId: null,
  deviceId: null
});

interface CardData {
  key: string;
  title: string;
  value: number;
  unit: string;
  color: {
    start: string;
    end: string;
  };
  icon: string;
}

const loading = ref(false);
const latestEnvData = ref<Api.Env.EnvData | null>(null);
const updateTrigger = ref(0); // 使用 ref 来触发更新

async function getLatestEnvData() {
  if (!props.farmlandId && !props.deviceId) {
    latestEnvData.value = null;
    updateTrigger.value++;
    return;
  }

  loading.value = true;

  try {
    let response;

    if (props.deviceId) {
      response = await fetchGetLatestByDevice(props.deviceId);
    } else if (props.farmlandId) {
      response = await fetchGetLatestByFarmland(props.farmlandId);
    }

    if (response && !response.error && response.data) {
      latestEnvData.value = response.data;
      updateTrigger.value++; // 增加触发器值以强制重新计算
    } else {
      latestEnvData.value = null;
      updateTrigger.value++;
    }
  } catch (error) {
    console.error('Failed to fetch latest environment data:', error);
    latestEnvData.value = null;
    updateTrigger.value++;
  } finally {
    loading.value = false;
  }
}

// 确保计算属性依赖于 latestEnvData 和 updateTrigger
const cardData = computed<CardData[]>(() => {
  // 显式引用这两个响应式变量以建立依赖关系
  const _envData = latestEnvData.value;
  const _trigger = updateTrigger.value;

  if (!_envData) {
    // Return default values when no data is available
    return [
      {
        key: 'airTemp',
        title: '空气温度',
        value: 0,
        unit: '°C',
        color: {
          start: '#ec4786',
          end: '#b955a4'
        },
        icon: 'ant-design:bar-chart-outlined'
      },
      {
        key: 'airHumidity',
        title: '空气湿度',
        value: 0,
        unit: '%',
        color: {
          start: '#865ec0',
          end: '#5144b4'
        },
        icon: 'ant-design:money-collect-outlined'
      },
      {
        key: 'soilMoisture',
        title: '土壤湿度',
        value: 0,
        unit: '%',
        color: {
          start: '#56cdf3',
          end: '#719de3'
        },
        icon: 'carbon:document-download'
      },
      {
        key: 'co2Ppm',
        title: 'CO2浓度',
        value: 0,
        unit: 'ppm',
        color: {
          start: '#fcbc25',
          end: '#f68057'
        },
        icon: 'ant-design:trademark-circle-outlined'
      },
      {
        key: 'lightLux',
        title: '光照强度',
        value: 0,
        unit: 'lux',
        color: {
          start: '#f68057',
          end: '#fcbc25'
        },
        icon: 'ant-design:bulb-outlined'
      }
    ];
  }

  // 转换字符串为数字，处理可能的类型问题
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Return actual data from API
  return [
    {
      key: 'airTemp',
      title: '空气温度',
      value: parseNumber(_envData.airTemp),
      unit: '°C',
      color: {
        start: '#ec4786',
        end: '#b955a4'
      },
      icon: 'ant-design:bar-chart-outlined'
    },
    {
      key: 'airHumidity',
      title: '空气湿度',
      value: parseNumber(_envData.airHumidity),
      unit: '%',
      color: {
        start: '#865ec0',
        end: '#5144b4'
      },
      icon: 'ant-design:money-collect-outlined'
    },
    {
      key: 'soilMoisture',
      title: '土壤湿度',
      value: parseNumber(_envData.soilMoisture),
      unit: '%',
      color: {
        start: '#56cdf3',
        end: '#719de3'
      },
      icon: 'carbon:document-download'
    },
    {
      key: 'co2Ppm',
      title: 'CO2浓度',
      value: parseNumber(_envData.co2Ppm),
      unit: 'ppm',
      color: {
        start: '#fcbc25',
        end: '#f68057'
      },
      icon: 'ant-design:trademark-circle-outlined'
    },
    {
      key: 'lightLux',
      title: '光照强度',
      value: parseNumber(_envData.lightLux),
      unit: 'lux',
      color: {
        start: '#f68057',
        end: '#fcbc25'
      },
      icon: 'ant-design:bulb-outlined'
    }
  ];
});

interface GradientBgProps {
  gradientColor: string;
}

const [DefineGradientBg, GradientBg] = createReusableTemplate<GradientBgProps>();

const themeStore = useThemeStore();

function getGradientColor(color: CardData['color']) {
  return `linear-gradient(to bottom right, ${color.start}, ${color.end})`;
}

// Fetch data when component mounts or when props change
onMounted(() => {
  getLatestEnvData();
});

watch(
  () => [props.farmlandId, props.deviceId],
  ([newFarmlandId, newDeviceId], [oldFarmlandId, oldDeviceId]) => {
    console.log('Props changed:', { oldFarmlandId, oldDeviceId }, '->', { newFarmlandId, newDeviceId });
    if (newFarmlandId !== oldFarmlandId || newDeviceId !== oldDeviceId) {
      getLatestEnvData();
    }
  },
  { deep: true }
);
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <!-- define component start: GradientBg -->
    <DefineGradientBg v-slot="{ $slots, gradientColor }">
      <div
        class="px-16px pb-4px pt-8px text-white"
        :style="{ backgroundImage: gradientColor, borderRadius: themeStore.themeRadius + 'px' }"
      >
        <component :is="$slots.default" />
      </div>
    </DefineGradientBg>
    <!-- define component end: GradientBg -->

    <NGrid cols="s:1 m:2 l:5" responsive="screen" :x-gap="16" :y-gap="16">
      <NGi v-for="item in cardData" :key="`${item.key}-${updateTrigger}`">
        <GradientBg :gradient-color="getGradientColor(item.color)" class="flex-1">
          <h3 class="text-16px">{{ item.title }}</h3>
          <div class="flex justify-between pt-12px">
            <SvgIcon :icon="item.icon" class="text-32px" />
            <CountTo
              :suffix="item.unit"
              :start-value="1"
              :end-value="item.value"
              class="text-30px text-white dark:text-dark"
            />
          </div>
        </GradientBg>
      </NGi>
    </NGrid>
  </NCard>
</template>

<style scoped></style>
