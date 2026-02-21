<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NCard, NForm, NFormItem, NInput, NModal, NSelect, NSpace, NTag } from 'naive-ui';
import { fetchSendDeviceCommand } from '@/service/api/env';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

interface Props {
  device: Api.Env.Device | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { required: true });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const model = ref({
  command: ''
});

const loading = ref(false);

const presetCommands = [
  { label: '开启灌溉', value: 'IRRIGATION_ON' },
  { label: '关闭灌溉', value: 'IRRIGATION_OFF' },
  { label: '开启通风', value: 'VENTILATION_ON' },
  { label: '关闭通风', value: 'VENTILATION_OFF' },
  { label: '开启补光', value: 'LIGHT_ON' },
  { label: '关闭补光', value: 'LIGHT_OFF' },
  { label: '获取状态', value: 'GET_STATUS' },
  { label: '重启设备', value: 'REBOOT' }
];

const rules = {
  command: [createRequiredRule('请输入或选择命令')]
};

const deviceInfo = computed(() => {
  if (!props.device) return null;
  return {
    serialNo: props.device.serialNo,
    type: props.device.type,
    status: props.device.status,
    farmlandName: props.device.farmlandName
  };
});

async function handleSubmit() {
  await validate();
  if (!props.device) return;

  loading.value = true;
  const { error } = await fetchSendDeviceCommand(props.device.id, model.value.command);
  loading.value = false;

  if (error) return;

  window.$message?.success('命令发送成功');
  closeModal();
  emit('submitted');
}

function handlePresetSelect(value: string) {
  model.value.command = value;
}

function closeModal() {
  visible.value = false;
}

watch(visible, newVal => {
  if (newVal) {
    model.value.command = '';
    restoreValidation();
  }
});
</script>

<template>
  <NModal v-model:show="visible" preset="card" title="发送设备命令" :style="{ width: '500px' }" :mask-closable="false">
    <div v-if="deviceInfo" class="mb-16px">
      <NCard size="small" :bordered="false" class="bg-gray-50 dark:bg-dark">
        <NSpace vertical>
          <div class="flex items-center gap-8px">
            <span class="text-gray-500">序列号:</span>
            <span>{{ deviceInfo.serialNo }}</span>
          </div>
          <div class="flex items-center gap-8px">
            <span class="text-gray-500">设备类型:</span>
            <span>{{ deviceInfo.type }}</span>
          </div>
          <div class="flex items-center gap-8px">
            <span class="text-gray-500">所属农田:</span>
            <span>{{ deviceInfo.farmlandName || '未绑定' }}</span>
          </div>
          <div class="flex items-center gap-8px">
            <span class="text-gray-500">设备状态:</span>
            <NTag :type="deviceInfo.status === '1' ? 'success' : 'warning'" size="small">
              {{ deviceInfo.status === '1' ? '在线' : '离线' }}
            </NTag>
          </div>
        </NSpace>
      </NCard>
    </div>

    <NForm ref="formRef" :model="model" :rules="rules">
      <NFormItem label="快捷命令" path="command">
        <NSelect
          v-model:value="model.command"
          :options="presetCommands"
          placeholder="选择预设命令"
          clearable
          class="mb-8px"
        />
      </NFormItem>
      <NFormItem label="自定义命令" path="command">
        <NInput v-model:value="model.command" type="textarea" placeholder="输入自定义命令内容" :rows="3" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="closeModal">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">发送</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
