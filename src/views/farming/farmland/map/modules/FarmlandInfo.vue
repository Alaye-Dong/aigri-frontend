<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpace } from 'naive-ui';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

const props = defineProps<{
  modelValue: Api.Farming.FarmlandOperateParams;
  coordinates: Array<[number, number]>;
  area: number;
  userOptions: { label: string; value: string }[];
  userLoading: boolean;
  loading: boolean; // 保存按钮loading
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: Api.Farming.FarmlandOperateParams): void;
  (e: 'submit'): void;
  (e: 'reset'): void;
}>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const formData = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
});

// 土壤类型选项
const soilTypeOptions = [
  { label: '黑土', value: '黑土' },
  { label: '红土', value: '红土' },
  { label: '黄土', value: '黄土' },
  { label: '沙土', value: '沙土' },
  { label: '粘土', value: '粘土' },
  { label: '壤土', value: '壤土' }
];

const rules = {
  name: createRequiredRule('请输入田块名称'),
  userId: createRequiredRule('请选择负责人')
};

async function handleSave() {
  await validate();
  emit('submit');
}

function handleReset() {
  restoreValidation();
  emit('reset');
}

defineExpose({
  restoreValidation
});
</script>

<template>
  <div class="info-panel">
    <NCard title="田块信息" size="small">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80">
        <NFormItem label="田块名称" path="name">
          <NInput v-model:value="formData.name" placeholder="请输入田块名称" :disabled="loading" />
        </NFormItem>

        <NFormItem label="负责人" path="userId">
          <NSelect
            v-model:value="formData.userId"
            :options="userOptions"
            :loading="userLoading"
            filterable
            clearable
            placeholder="请选择负责人"
            :disabled="loading"
          />
        </NFormItem>

        <NFormItem label="位置" path="location">
          <NInput v-model:value="formData.location" placeholder="请输入位置信息（可选）" :disabled="loading" />
        </NFormItem>

        <NFormItem label="土壤类型" path="soilType">
          <NSelect
            v-model:value="formData.soilType"
            :options="soilTypeOptions"
            placeholder="请选择土壤类型（可选）"
            clearable
            :disabled="loading"
          />
        </NFormItem>

        <NFormItem label="描述" path="description">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入田块描述（可选）"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :disabled="loading"
          />
        </NFormItem>

        <NFormItem label="坐标数量">
          <span>{{ coordinates.length }} 个点</span>
        </NFormItem>

        <NFormItem label="面积(亩)" path="areaSize">
          <div class="area-info w-full">
            <NInputNumber
              v-model:value="formData.areaSize"
              placeholder="请输入面积"
              :precision="2"
              :min="0"
              :disabled="loading"
              class="w-full"
            />
            <div class="mt-1 flex justify-between text-xs text-gray-400">
              <span>{{ area.toFixed(2) }} m²</span>
              <span>{{ (area / 10000).toFixed(4) }} 公顷</span>
            </div>
          </div>
        </NFormItem>

        <NFormItem label="坐标数据">
          <div class="coordinates-display">
            <div v-if="coordinates.length > 0" class="coordinate-list">
              <div v-for="(coord, index) in coordinates" :key="index" class="coordinate-item">
                {{ index + 1 }}: [{{ coord[0].toFixed(6) }}, {{ coord[1].toFixed(6) }}]
              </div>
            </div>
            <div v-else class="empty-hint">暂无坐标数据</div>
          </div>
        </NFormItem>

        <NFormItem>
          <NSpace>
            <NButton type="primary" :loading="loading" :disabled="coordinates.length === 0" @click="handleSave">
              {{ loading ? '保存中...' : '保存田块' }}
            </NButton>
            <NButton :disabled="loading" @click="handleReset">重置</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.info-panel {
  width: 360px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.area-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coordinates-display {
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e6;
  border-radius: 4px;
  padding: 8px;
  background: #fafafa;
}

.coordinate-list {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.coordinate-item {
  padding: 2px 0;
  color: #333;
}

.empty-hint {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 12px;
}

.instruction {
  font-size: 13px;
  line-height: 1.8;
  color: #666;
}

.instruction p {
  margin: 8px 0;
}

.instruction strong {
  color: #3388ff;
  font-weight: 600;
}

/* 自定义滚动条 */
.coordinates-display::-webkit-scrollbar,
.info-panel::-webkit-scrollbar {
  width: 6px;
}

.coordinates-display::-webkit-scrollbar-track,
.info-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.coordinates-display::-webkit-scrollbar-thumb,
.info-panel::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.coordinates-display::-webkit-scrollbar-thumb:hover,
.info-panel::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
