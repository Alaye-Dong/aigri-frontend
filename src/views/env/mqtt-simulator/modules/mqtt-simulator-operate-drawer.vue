<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NButton,
  NDivider,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpin
} from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchCreateSimulator, fetchGetDeviceList } from '@/service/api/env';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

const visible = defineModel<boolean>('visible', { required: true });

interface Props {
  /** 已在模拟器中的设备序列号列表，用于过滤 */
  existingSerialNos?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  existingSerialNos: () => []
});

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = '新增模拟设备';

type Model = Api.Env.SimDeviceConfig;

const model = ref<Model>(createDefaultModel());

const { loading, startLoading, endLoading } = useLoading();

/** 设备选择相关 */
const deviceLoading = ref(false);
const deviceOptions = ref<Array<{ label: string; value: string; device: Api.Env.Device }>>([]);
const selectedDeviceSerialNo = ref<string | null>(null);

/** 设备类型选项 */
const deviceTypeOptions = [
  { label: '环境传感器', value: 'ENV_SENSOR' },
  { label: '土壤传感器', value: 'SOIL_SENSOR' },
  { label: '气象站', value: 'WEATHER_STATION' }
];

/** 设备类型映射 */
const deviceTypeMap: Record<string, string> = {
  ENV_SENSOR: '环境传感器',
  SOIL_SENSOR: '土壤传感器',
  WEATHER_STATION: '气象站'
};

function createDefaultModel(): Model {
  return {
    serialNo: '',
    type: 'ENV_SENSOR',
    dataIntervalMs: 30000,
    heartbeatIntervalMs: 60000,
    minAirTemp: 15,
    maxAirTemp: 35,
    minAirHumidity: 40,
    maxAirHumidity: 80,
    minSoilMoisture: 30,
    maxSoilMoisture: 70,
    minLightLux: 0,
    maxLightLux: 100000,
    minCo2Ppm: 300,
    maxCo2Ppm: 1000
  };
}

type RuleKey = Extract<keyof Model, 'serialNo' | 'type'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  serialNo: [createRequiredRule('请输入设备序列号')],
  type: [createRequiredRule('请选择设备类型')]
};

/** 加载已有设备列表 */
async function loadDevices() {
  deviceLoading.value = true;
  try {
    const { data, error } = await fetchGetDeviceList({ current: 1, size: 1000 });
    if (error || !data?.records) {
      deviceOptions.value = [];
      return;
    }
    // 过滤掉已在模拟器中的设备
    deviceOptions.value = data.records
      .filter(device => !props.existingSerialNos.includes(device.serialNo))
      .map(device => ({
        label: `${device.serialNo} (${deviceTypeMap[device.type] || device.type}${device.farmlandName ? ` - ${device.farmlandName}` : ''})`,
        value: device.serialNo,
        device
      }));
  } finally {
    deviceLoading.value = false;
  }
}

/** 选择设备后自动填充 */
function handleDeviceSelect(serialNo: string | null) {
  if (!serialNo) return;
  const option = deviceOptions.value.find(o => o.value === serialNo);
  if (option) {
    model.value.serialNo = option.device.serialNo;
    model.value.type = option.device.type;
  }
}

async function handleSubmit() {
  await validate();

  startLoading();
  const { error } = await fetchCreateSimulator(model.value);
  endLoading();

  if (error) return;

  window.$message?.success('创建成功');
  closeDrawer();
  emit('submitted');
}

function closeDrawer() {
  visible.value = false;
}

watch(visible, () => {
  if (visible.value) {
    model.value = createDefaultModel();
    selectedDeviceSerialNo.value = null;
    restoreValidation();
    loadDevices();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="450" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="120px">
          <h4 class="mb-2 font-medium">从已有设备选择</h4>
          <NFormItem label="选择设备">
            <NSelect
              v-model:value="selectedDeviceSerialNo"
              :options="deviceOptions"
              :loading="deviceLoading"
              placeholder="可选择已有设备自动填充"
              clearable
              filterable
              @update:value="handleDeviceSelect"
            />
          </NFormItem>

          <NDivider class="my-2!" />

          <h4 class="mb-2 font-medium">或手动输入</h4>
          <NFormItem label="设备序列号" path="serialNo">
            <NInput v-model:value="model.serialNo" placeholder="请输入设备序列号" />
          </NFormItem>
          <NFormItem label="设备类型" path="type">
            <NSelect v-model:value="model.type" :options="deviceTypeOptions" placeholder="请选择设备类型" />
          </NFormItem>
          <NFormItem label="数据间隔(ms)" path="dataIntervalMs">
            <NInputNumber v-model:value="model.dataIntervalMs" :min="1000" :step="1000" class="w-full" />
          </NFormItem>
          <NFormItem label="心跳间隔(ms)" path="heartbeatIntervalMs">
            <NInputNumber v-model:value="model.heartbeatIntervalMs" :min="1000" :step="1000" class="w-full" />
          </NFormItem>

          <h4 class="mb-2 mt-4 font-medium">传感器数据范围</h4>

          <NFormItem label="空气温度(°C)">
            <div class="flex gap-2">
              <NInputNumber v-model:value="model.minAirTemp" class="flex-1" placeholder="最小值" />
              <span class="leading-8">~</span>
              <NInputNumber v-model:value="model.maxAirTemp" class="flex-1" placeholder="最大值" />
            </div>
          </NFormItem>
          <NFormItem label="空气湿度(%)">
            <div class="flex gap-2">
              <NInputNumber
                v-model:value="model.minAirHumidity"
                :min="0"
                :max="100"
                class="flex-1"
                placeholder="最小值"
              />
              <span class="leading-8">~</span>
              <NInputNumber
                v-model:value="model.maxAirHumidity"
                :min="0"
                :max="100"
                class="flex-1"
                placeholder="最大值"
              />
            </div>
          </NFormItem>
          <NFormItem label="土壤湿度(%)">
            <div class="flex gap-2">
              <NInputNumber
                v-model:value="model.minSoilMoisture"
                :min="0"
                :max="100"
                class="flex-1"
                placeholder="最小值"
              />
              <span class="leading-8">~</span>
              <NInputNumber
                v-model:value="model.maxSoilMoisture"
                :min="0"
                :max="100"
                class="flex-1"
                placeholder="最大值"
              />
            </div>
          </NFormItem>
          <NFormItem label="光照强度(lux)">
            <div class="flex gap-2">
              <NInputNumber v-model:value="model.minLightLux" :min="0" class="flex-1" placeholder="最小值" />
              <span class="leading-8">~</span>
              <NInputNumber v-model:value="model.maxLightLux" :min="0" class="flex-1" placeholder="最大值" />
            </div>
          </NFormItem>
          <NFormItem label="CO2浓度(ppm)">
            <div class="flex gap-2">
              <NInputNumber v-model:value="model.minCo2Ppm" :min="0" class="flex-1" placeholder="最小值" />
              <span class="leading-8">~</span>
              <NInputNumber v-model:value="model.maxCo2Ppm" :min="0" class="flex-1" placeholder="最大值" />
            </div>
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NButton type="primary" ghost @click="closeDrawer">取消</NButton>
        <NButton type="primary" @click="handleSubmit">确定</NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
