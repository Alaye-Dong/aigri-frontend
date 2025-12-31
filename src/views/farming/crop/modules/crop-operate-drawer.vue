<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchCreateCrop, fetchGetCropInfo, fetchUpdateCrop } from '@/service/api/farming';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'CropOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Farming.Crop | null;
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
    add: '新增作物',
    edit: '编辑作物'
  };
  return titles[props.operateType];
});

type Model = Api.Farming.CropOperateParams;

const model = ref<Model>(createDefaultModel());

// 计算属性用于处理 NDatePicker 的日期值类型转换
const plantDateValue = computed({
  get() {
    // 如果后端返回的是字符串格式日期，转换为时间戳
    if (model.value.plantDate) {
      return new Date(model.value.plantDate).getTime();
    }
    return null;
  },
  set(value: number | null) {
    // 将时间戳转换回字符串格式供后端使用
    if (value) {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      model.value.plantDate = `${year}-${month}-${day}`;
    } else {
      model.value.plantDate = null;
    }
  }
});

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 作物状态选项 */
const cropStatusOptions = [
  { label: '种植中', value: 1 },
  { label: '已收获', value: 2 },
  { label: '已废弃', value: 3 }
];

function createDefaultModel(): Model {
  return {
    id: null,
    farmlandId: null,
    cropName: '',
    variety: null,
    plantDate: null,
    status: undefined,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null
  };
}

type RuleKey = Extract<keyof Model, 'cropName' | 'farmlandId'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  cropName: [createRequiredRule('请输入作物名称')],
  farmlandId: [createRequiredRule('请选择所属农田')]
};

/** 获取农田列表 */
async function getFarmlandOptions() {
  startFarmlandLoading();
  const { error, data } = await fetchGetFarmlandList();
  if (!error && data.records) {
    farmlandOptions.value = data.records.map(farmland => ({
      label: farmland.name,
      value: farmland.id
    }));
  }
  endFarmlandLoading();
}

async function getCropInfo(id: CommonType.IdType = '') {
  if (!id) return;

  startLoading();
  const { error, data } = await fetchGetCropInfo(id);
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
    getCropInfo(props.rowData.id);
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  try {
    await validate();
  } catch {
    return;
  }

  const { id, farmlandId, cropName, variety, plantDate, status } = model.value;

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateCrop({
      farmlandId,
      cropName,
      variety,
      plantDate,
      status
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateCrop({
      id,
      farmlandId,
      cropName,
      variety,
      plantDate,
      status
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
  <NDrawer v-model:show="visible" display-directive="show" :width="400" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
          <NFormItem label="作物名称" path="cropName">
            <NInput v-model:value="model.cropName" placeholder="请输入作物名称" />
          </NFormItem>
          <NFormItem label="所属农田" path="farmlandId">
            <NSelect
              v-model:value="model.farmlandId"
              :options="farmlandOptions"
              :loading="farmlandLoading"
              filterable
              clearable
              placeholder="请选择所属农田"
            />
          </NFormItem>
          <NFormItem label="品种" path="variety">
            <NInput v-model:value="model.variety" placeholder="请输入品种" />
          </NFormItem>
          <NFormItem label="种植日期" path="plantDate">
            <NDatePicker
              v-model:value="plantDateValue"
              type="date"
              placeholder="请选择种植日期"
              class="w-full"
            />
          </NFormItem>
          <NFormItem label="状态" path="status">
            <NSelect
              v-model:value="model.status"
              :options="cropStatusOptions"
              clearable
              placeholder="请选择作物状态"
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
