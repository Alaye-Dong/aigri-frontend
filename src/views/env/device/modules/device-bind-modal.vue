<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NCard, NForm, NFormItem, NModal, NSelect, NSpace, NTag } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchBindDevice } from '@/service/api/env';
import { fetchGetFarmlandList } from '@/service/api/farming';
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
const { loading: pageLoading, startLoading, endLoading } = useLoading();

const model = ref({
  farmlandId: null as CommonType.IdType | null
});

const loading = ref(false);

const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

const rules = {
  farmlandId: [createRequiredRule('请选择要绑定的农田')]
};

const deviceInfo = computed(() => {
  if (!props.device) return null;
  return {
    id: props.device.id,
    serialNo: props.device.serialNo,
    type: props.device.type,
    status: props.device.status,
    farmlandName: props.device.farmlandName,
    farmlandId: props.device.farmlandId
  };
});

async function getFarmlandOptions() {
  startLoading();
  const { error, data } = await fetchGetFarmlandList({ current: 1, size: 1000 });
  endLoading();
  if (!error && data.records) {
    farmlandOptions.value = data.records.map(farmland => ({
      label: farmland.name,
      value: farmland.id
    }));
  }
}

async function handleSubmit() {
  await validate();
  if (!props.device || !model.value.farmlandId) return;

  loading.value = true;
  const { error } = await fetchBindDevice({
    deviceId: props.device.id,
    farmlandId: model.value.farmlandId
  });
  loading.value = false;

  if (error) return;

  window.$message?.success('设备绑定成功');
  closeModal();
  emit('submitted');
}

function closeModal() {
  visible.value = false;
}

watch(visible, newVal => {
  if (newVal) {
    model.value.farmlandId = props.device?.farmlandId || null;
    restoreValidation();
    getFarmlandOptions();
  }
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="绑定设备到农田"
    :style="{ width: '500px' }"
    :mask-closable="false"
  >
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
            <span class="text-gray-500">当前绑定:</span>
            <NTag v-if="deviceInfo.farmlandName" type="info" size="small">
              {{ deviceInfo.farmlandName }}
            </NTag>
            <span v-else class="text-gray-400">未绑定</span>
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
      <NFormItem label="选择农田" path="farmlandId">
        <NSelect
          v-model:value="model.farmlandId"
          :options="farmlandOptions"
          :loading="pageLoading"
          filterable
          clearable
          placeholder="请选择要绑定的农田"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="closeModal">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">确定</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
