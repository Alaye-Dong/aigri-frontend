<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpin } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchCreateSimulator } from '@/service/api/env';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

const visible = defineModel<boolean>('visible', { required: true });

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

/** 设备类型选项 */
const deviceTypeOptions = [
  { label: '环境传感器', value: 'ENV_SENSOR' },
  { label: '土壤传感器', value: 'SOIL_SENSOR' },
  { label: '气象站', value: 'WEATHER_STATION' }
];

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
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="450" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="120px">
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
