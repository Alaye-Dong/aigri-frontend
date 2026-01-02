<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDatePicker, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSelect, NSpin } from 'naive-ui';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { fetchCreateDevice, fetchGetDeviceInfo, fetchUpdateDevice } from '@/service/api/env';
import { useLoading } from '@sa/hooks';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

type OperateType = 'add' | 'edit';

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Api.Env.Device | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { required: true });

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<OperateType, string> = {
    add: '新增设备',
    edit: '编辑设备'
  };
  return (titles[props.operateType]);
});

type Model = Api.Env.DeviceOperateParams;

const model = ref<Model>(createDefaultModel());

const { loading, startLoading, endLoading } = useLoading();

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 设备状态选项 */
const deviceStatusOptions = [
  { label: '在线', value: '1' },
  { label: '离线', value: '0' }
];

/** 设备类型选项 */
const deviceTypeOptions = [
  { label: '传感器', value: '传感器' },
  { label: '控制器', value: '控制器' },
  { label: '摄像头', value: '摄像头' },
  { label: '气象站', value: '气象站' }
];

function createDefaultModel(): Model {
  return {
    id: null,
    serialNo: '',
    farmlandId: null,
    farmlandName: null,
    type: null,
    status: '0', // 默认为'0'（离线状态），与用户模块保持一致
    lastHeartbeat: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null
  };
}

type RuleKey = Extract<keyof Model, 'serialNo' | 'farmlandId' | 'type'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  serialNo: [createRequiredRule('请输入序列号')],
  farmlandId: [{ ...createRequiredRule('请选择所属农田'), type: 'string' }],
  type: [createRequiredRule('请选择设备类型')]
};

async function getFarmlandOptions() {
  startLoading();
  const { error, data } = await fetchGetFarmlandList({ current: 1, size: 1000 });
  if (!error && data.records) {
    farmlandOptions.value = data.records.map(farmland => ({
      label: farmland.name,
      value: farmland.id
    }));
  }
  endLoading();
}

async function getDeviceInfo(id: CommonType.IdType = '') {
  startLoading();
  const { error, data } = await fetchGetDeviceInfo(id);
  if (!error) {
    model.value = {
      ...data
    };
  }
  endLoading();
}

async function handleSubmit() {
  await validate();

  const { id, serialNo, farmlandId, type, status, lastHeartbeat } = model.value;

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateDevice({
      serialNo,
      farmlandId,
      type,
      status,
      lastHeartbeat
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateDevice({
      id,
      serialNo,
      farmlandId,
      type,
      status,
      lastHeartbeat
    });
    if (error) return;
  }

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

function closeDrawer() {
  visible.value = false;
}

async function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();

  if (props.operateType === 'add') {
    await getFarmlandOptions();
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    await getFarmlandOptions();
    Object.assign(model.value, props.rowData);
  }
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="400" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
          <NFormItem label="序列号" path="serialNo">
            <NInput v-model:value="model.serialNo" placeholder="请输入序列号" />
          </NFormItem>
          <NFormItem label="所属农田" path="farmlandId">
            <NSelect
              v-model:value="model.farmlandId"
              :options="farmlandOptions"
              filterable
              clearable
              placeholder="请选择所属农田"
            />
          </NFormItem>
          <NFormItem label="设备类型" path="type">
            <NSelect v-model:value="model.type" :options="deviceTypeOptions" placeholder="请选择设备类型" />
          </NFormItem>
          <NFormItem label="设备状态" path="status">
            <NSelect v-model:value="model.status" :options="deviceStatusOptions" placeholder="请选择设备状态" />
          </NFormItem>
          <NFormItem label="最后心跳时间" path="lastHeartbeat">
            <NDatePicker
              v-model:formatted-value="model.lastHeartbeat"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="请选择最后心跳时间"
              class="w-full"
            />
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
