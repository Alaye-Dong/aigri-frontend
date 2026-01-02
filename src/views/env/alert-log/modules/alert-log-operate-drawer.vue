<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchGetAlertLogInfo, fetchUpdateAlertLogStatus } from '@/service/api/env';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'AlertLogOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Env.AlertLog | null;
  /** the edit row id, used when rowData is not available */
  rowId?: CommonType.IdType;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增告警日志',
    edit: '编辑告警日志'
  };
  return titles[props.operateType];
});

type Model = Api.Env.AlertLogOperateParams;

const model = ref<Model>(createDefaultModel());

/** 告警状态选项 */
const statusOptions = [
  { label: '未读', value: '0' },
  { label: '已处理', value: '1' }
];

function createDefaultModel(): Model {
  return {
    id: null,
    ruleId: null,
    ruleName: '',
    farmlandId: null,
    farmlandName: '',
    deviceId: null,
    deviceSerialNo: '',
    alertContent: '',
    metricValue: null,
    status: '0',
    createTime: null
  };
}

type RuleKey = Extract<keyof Model, 'status'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  status: [createRequiredRule('请选择处理状态')]
};

async function getAlertLogInfo(id?: CommonType.IdType) {
  if (!id) return;

  startLoading();
  const { error, data } = await fetchGetAlertLogInfo(id);
  if (!error && data) {
    Object.assign(model.value, data as Api.Env.AlertLog);
  }
  endLoading();
}

async function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();

  if (props.operateType === 'add') {
    return;
  }

  if (props.operateType === 'edit') {
    if (props.rowData) {
      // 如果提供了行数据，直接使用
      Object.assign(model.value, jsonClone(props.rowData));
    } else {
      // 如果没有提供行数据但需要编辑，则通过API获取
      // 这种情况发生在列表数据翻页后，原始数据可能不在当前数据列表中
      // 使用传入的rowId参数获取信息
      await getAlertLogInfo(props.rowId);
    }
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { id, status } = model.value;

  // 确保 processStatus 是有效的类型，避免类型错误
  const validProcessStatus: Api.Env.ProcessStatusType = status ?? '0';

  // request
  if (props.operateType === 'edit' && id) {
    const { error } = await fetchUpdateAlertLogStatus([id], validProcessStatus);
    if (error) return;
  }

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="480" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
          <NFormItem label="规则名称" path="ruleName">
            <NInput v-model:value="model.ruleName" placeholder="规则名称" readonly />
          </NFormItem>
          <NFormItem label="农田名称" path="farmlandName">
            <NInput v-model:value="model.farmlandName" placeholder="农田名称" readonly />
          </NFormItem>
          <NFormItem label="设备序列号" path="deviceSerialNo">
            <NInput v-model:value="model.deviceSerialNo" placeholder="设备序列号" readonly />
          </NFormItem>
          <NFormItem label="告警内容" path="alertContent">
            <NInput
              v-model:value="model.alertContent"
              type="textarea"
              placeholder="告警内容"
              :autosize="{ minRows: 3, maxRows: 6 }"
              readonly
            />
          </NFormItem>
          <NFormItem label="指标值" path="metricValue">
            <NInputNumber v-model:value="model.metricValue" placeholder="指标值" readonly />
          </NFormItem>
          <NFormItem label="处理状态" path="status">
            <NSelect
              v-model:value="model.status"
              :options="statusOptions"
              placeholder="处理状态"
            />
          </NFormItem>
          <NFormItem label="创建时间" path="createTime">
            <NInput v-model:value="model.createTime" placeholder="创建时间" readonly />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">取消</NButton>
          <NButton type="primary" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
