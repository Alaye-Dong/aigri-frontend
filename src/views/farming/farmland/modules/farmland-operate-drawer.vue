<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchCreateFarmland, fetchGetFarmlandInfo, fetchUpdateFarmland } from '@/service/api/farming';
import { fetchGetUserList } from '@/service/api/system';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'FarmlandOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Farming.Farmland | null;
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
const { loading: userLoading, startLoading: startUserLoading, endLoading: endUserLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增地块',
    edit: '编辑地块'
  };
  return titles[props.operateType];
});

type Model = Api.Farming.FarmlandOperateParams;

const model = ref<Model>(createDefaultModel());

/** 用户选项 */
const userOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 土壤类型选项 */
const soilTypeOptions = [
  { label: '黑土', value: '黑土' },
  { label: '红土', value: '红土' },
  { label: '黄土', value: '黄土' },
  { label: '沙土', value: '沙土' },
  { label: '粘土', value: '粘土' },
  { label: '壤土', value: '壤土' }
];

function createDefaultModel(): Model {
  return {
    id: null,
    userId: null,
    userRealName: null,
    name: '',
    areaSize: null,
    location: '',
    soilType: null,
    description: '',
    polygonPath: null,
    status: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null
  };
}

type RuleKey = Extract<keyof Model, 'name' | 'userId'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  name: [createRequiredRule('请输入地块名称')],
  userId: [{ ...createRequiredRule('请选择负责人'), type: 'string' }]
};

/** 获取用户列表 */
async function getUserOptions() {
  startUserLoading();
  const { error, data } = await fetchGetUserList({ current: 1, size: 1000 });
  if (!error && data.records) {
    userOptions.value = data.records.map(user => ({
      label: user.realName,
      value: user.userId
    }));
  }
  endUserLoading();
}

async function getFarmlandInfo(id: CommonType.IdType = '') {
  if (!id) return;

  startLoading();
  const { error, data } = await fetchGetFarmlandInfo(id);
  if (!error) {
    Object.assign(model.value, data);
  }
  endLoading();
}

function handleUpdateModelWhenEdit() {
  model.value = createDefaultModel();

  if (props.operateType === 'add') {
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, jsonClone(props.rowData));
    getFarmlandInfo(props.rowData.id);
  }
}

function closeDrawer() {
  visible.value = false;
}

// 创建一个计算属性来处理 areaSize 的类型转换
const areaSizeNumber = computed<number | null>({
  get() {
    const value = model.value.areaSize;
    if (value === null || value === undefined) {
      return null;
    }
    // 将字符串转换为数字
    const num = Number(value);
    return isNaN(num) ? null : num;
  },
  set(value) {
    // 设置值时，直接使用数字或 null
    model.value.areaSize = value;
  }
});

async function handleSubmit() {
  try {
    await validate();
  } catch {
    return;
  }

  const { id, userId, name, location, soilType, description, polygonPath } = model.value;
  const areaSize = areaSizeNumber.value; // 使用转换后的数字值

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateFarmland({
      userId,
      name,
      areaSize,
      location,
      soilType,
      description,
      polygonPath
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateFarmland({
      id,
      userId,
      name,
      areaSize,
      location,
      soilType,
      description,
      polygonPath
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
  getUserOptions();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="400" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
          <NFormItem label="地块名称" path="name">
            <NInput v-model:value="model.name" placeholder="请输入地块名称" />
          </NFormItem>
          <NFormItem label="负责人" path="userId">
            <NSelect
              v-model:value="model.userId"
              :options="userOptions"
              :loading="userLoading"
              filterable
              clearable
              placeholder="请选择负责人"
            />
          </NFormItem>
          <NFormItem label="面积(亩)" path="areaSize">
            <NInputNumber
              v-model:value="areaSizeNumber"
              placeholder="请输入面积"
              :precision="2"
              :min="0"
              class="w-full"
            />
          </NFormItem>
          <NFormItem label="位置" path="location">
            <NInput v-model:value="model.location" placeholder="请输入位置信息" />
          </NFormItem>
          <NFormItem label="土壤类型" path="soilType">
            <NSelect v-model:value="model.soilType" :options="soilTypeOptions" clearable placeholder="请选择土壤类型" />
          </NFormItem>
          <NFormItem label="描述" path="description">
            <NInput
              v-model:value="model.description"
              type="textarea"
              placeholder="请输入地块描述"
              :autosize="{ minRows: 3, maxRows: 5 }"
            />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
