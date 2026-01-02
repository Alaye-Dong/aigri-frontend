<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchCreateAlertRule, fetchGetAlertRuleInfo, fetchUpdateAlertRule } from '@/service/api/env';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'AlertRuleOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Env.AlertRule | null;
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
const { loading: farmlandLoading, startLoading: startFarmlandLoading, endLoading: endFarmlandLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增告警规则',
    edit: '编辑告警规则'
  };
  return titles[props.operateType];
});

type Model = Api.Env.AlertRuleOperateParams;

const model = ref<Model>(createDefaultModel());

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 监测指标选项 */
const metricTypeOptions = [
  { label: '空气温度', value: 'air_temp' },
  { label: '空气湿度', value: 'air_humidity' },
  { label: '土壤湿度', value: 'soil_moisture' },
  { label: '光照强度', value: 'light_lux' },
  { label: '二氧化碳浓度', value: 'co2_ppm' }
];

/** 条件操作符选项 */
const conditionOperatorOptions = [
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '=', value: '=' },
  { label: '>=', value: '>=' },
  { label: '<=', value: '<=' }
];

/** 告警级别选项 */
const severityOptions = [
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' }
];

function createDefaultModel(): Model {
  return {
    id: null,
    ruleName: '',
    farmlandId: null,
    metricType: '',
    conditionOperator: '',
    thresholdValue: null,
    severity: '',
    isEnabled: true,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null
  };
}

type RuleKey = Extract<keyof Model, 'ruleName' | 'metricType' | 'conditionOperator' | 'thresholdValue' | 'severity'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  ruleName: [createRequiredRule('请输入规则名称')],
  metricType: [createRequiredRule('请选择监测指标')],
  conditionOperator: [createRequiredRule('请选择条件操作符')],
  thresholdValue: [createRequiredRule('请输入阈值')],
  severity: [createRequiredRule('请选择告警级别')]
};

/** 获取农田列表 */
async function getFarmlandOptions() {
  startFarmlandLoading();
  const { error, data } = await fetchGetFarmlandList({ current: 1, size: 1000 });
  if (!error && data.records) {
    farmlandOptions.value = data.records.map(farmland => ({
      label: farmland.name,
      value: farmland.id
    }));
  }
  endFarmlandLoading();
}

async function getAlertRuleInfo(id: CommonType.IdType = '') {
  if (!id) return;

  startLoading();
  const { error, data } = await fetchGetAlertRuleInfo(id);
  if (!error) {
    Object.assign(model.value, data);
  }
  endLoading();
}

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();

  if (props.operateType === 'add') {
    getFarmlandOptions();
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    startFarmlandLoading();
    Object.assign(model.value, jsonClone(props.rowData));
    getFarmlandOptions();
    endFarmlandLoading();
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { id, ruleName, farmlandId, metricType, conditionOperator, thresholdValue, severity, isEnabled } = model.value;

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateAlertRule({
      ruleName,
      farmlandId,
      metricType,
      conditionOperator,
      thresholdValue,
      severity,
      isEnabled
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateAlertRule({
      id,
      ruleName,
      farmlandId,
      metricType,
      conditionOperator,
      thresholdValue,
      severity,
      isEnabled
    });
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

onMounted(() => {
  getFarmlandOptions();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="480" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
          <NFormItem label="规则名称" path="ruleName">
            <NInput v-model:value="model.ruleName" placeholder="请输入规则名称" />
          </NFormItem>
          <NFormItem label="农田名称" path="farmlandId">
            <NSelect
              v-model:value="model.farmlandId"
              :loading="farmlandLoading"
              :options="farmlandOptions"
              placeholder="请选择关联农田(空则为全局)"
              clearable
            />
          </NFormItem>
          <NFormItem label="监测指标" path="metricType">
            <NSelect
              v-model:value="model.metricType"
              :options="metricTypeOptions"
              placeholder="请选择监测指标"
            />
          </NFormItem>
          <NFormItem label="条件操作符" path="conditionOperator">
            <NSelect
              v-model:value="model.conditionOperator"
              :options="conditionOperatorOptions"
              placeholder="请选择条件操作符"
            />
          </NFormItem>
          <NFormItem label="阈值" path="thresholdValue">
            <NInputNumber v-model:value="model.thresholdValue" :min="0" :step="0.01" placeholder="请输入阈值" />
          </NFormItem>
          <NFormItem label="告警级别" path="severity">
            <NSelect
              v-model:value="model.severity"
              :options="severityOptions"
              placeholder="请选择告警级别"
            />
          </NFormItem>
          <NFormItem label="是否启用" path="isEnabled">
            <NSwitch
              :value="model.isEnabled ?? false"
              @update:value="(value) => model.isEnabled = value"
              :checked-value="true"
              :unchecked-value="false"
              size="large"
            >
              <template #checked>启用</template>
              <template #unchecked>停用</template>
            </NSwitch>
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
