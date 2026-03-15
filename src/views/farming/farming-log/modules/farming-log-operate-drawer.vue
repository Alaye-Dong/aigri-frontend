<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import {
  fetchCreateFarmingLog,
  fetchGetCropList,
  fetchGetFarmingLogInfo,
  fetchGetFarmlandList,
  fetchUpdateFarmingLog
} from '@/service/api/farming';
import { fetchGetUserList } from '@/service/api/system';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import ImageUpload from '@/components/custom/image-upload.vue';

defineOptions({
  name: 'FarmingLogOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Farming.FarmingLog | null;
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
const { loading: userLoading, startLoading: startUserLoading, endLoading: endUserLoading } = useLoading();
const { loading: cropLoading, startLoading: startCropLoading, endLoading: endCropLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增农事日志',
    edit: '编辑农事日志'
  };
  return titles[props.operateType];
});

type Model = Api.Farming.FarmingLogOperateParams;

const model = ref<Model>(createDefaultModel());

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 用户选项 */
const userOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 作物选项 */
const cropOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 操作类型选项 */
const operateTypeOptions = [
  { label: '播种', value: '播种' },
  { label: '施肥', value: '施肥' },
  { label: '灌溉', value: '灌溉' },
  { label: '除草', value: '除草' },
  { label: '病虫害防治', value: '病虫害防治' },
  { label: '收获', value: '收获' },
  { label: '其他', value: '其他' }
];

function createDefaultModel(): Model {
  return {
    id: null,
    farmlandId: null,
    cropId: null,
    userId: null,
    operateType: null,
    content: null,
    cost: null,
    images: null,
    operateTime: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null
  };
}

type RuleKey = Extract<keyof Model, 'farmlandId' | 'operateType'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  farmlandId: [createRequiredRule('请选择所属农田')],
  operateType: [createRequiredRule('请选择操作类型')]
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

/** 获取作物列表 */
async function getCropOptions() {
  startCropLoading();
  const { error, data } = await fetchGetCropList({ current: 1, size: 1000 });
  if (!error && data.records) {
    cropOptions.value = data.records.map(crop => ({
      label: crop.cropName,
      value: crop.id
    }));
  }
  endCropLoading();
}

async function getFarmingLogInfo(id: CommonType.IdType = '') {
  if (!id) return;

  startLoading();
  const { error, data } = await fetchGetFarmingLogInfo(id);
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
    getFarmingLogInfo(props.rowData.id);
  }
}

function closeDrawer() {
  visible.value = false;
}

// 创建一个计算属性来处理 cost 的类型转换
const costNumber = computed<number | null>({
  get() {
    const value = model.value.cost;
    if (value === null || value === undefined) {
      return null;
    }
    // 将字符串转换为数字
    const num = Number(value);
    return isNaN(num) ? null : num;
  },
  set(value) {
    // 设置值时，直接使用数字或 null
    model.value.cost = value;
  }
});

async function handleSubmit() {
  try {
    await validate();
  } catch {
    return;
  }

  const { id, farmlandId, cropId, userId, operateType, content, images, operateTime } = model.value;
  const cost = costNumber.value; // 使用转换后的数字值

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateFarmingLog({
      farmlandId,
      cropId,
      userId,
      operateType,
      content,
      cost,
      images,
      operateTime
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateFarmingLog({
      id,
      farmlandId,
      cropId,
      userId,
      operateType,
      content,
      cost,
      images,
      operateTime
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
  getUserOptions();
  getCropOptions();
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="400" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
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
          <NFormItem label="关联作物" path="cropId">
            <NSelect
              v-model:value="model.cropId"
              :options="cropOptions"
              :loading="cropLoading"
              filterable
              clearable
              placeholder="请选择关联作物"
            />
          </NFormItem>
          <NFormItem label="操作人" path="userId">
            <NSelect
              v-model:value="model.userId"
              :options="userOptions"
              :loading="userLoading"
              filterable
              clearable
              placeholder="请选择操作人"
            />
          </NFormItem>
          <NFormItem label="操作类型" path="operateType">
            <NSelect
              v-model:value="model.operateType"
              :options="operateTypeOptions"
              clearable
              placeholder="请选择操作类型"
            />
          </NFormItem>
          <NFormItem label="操作内容" path="content">
            <NInput
              v-model:value="model.content"
              type="textarea"
              placeholder="请输入操作内容"
              :autosize="{ minRows: 3, maxRows: 5 }"
            />
          </NFormItem>
          <NFormItem label="成本(元)" path="cost">
            <NInputNumber v-model:value="costNumber" placeholder="请输入成本" :precision="2" :min="0" class="w-full" />
          </NFormItem>
          <NFormItem label="操作时间" path="operateTime">
            <NDatePicker
              v-model:formatted-value="model.operateTime"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="请选择操作时间"
              class="w-full"
            />
          </NFormItem>
          <NFormItem label="相关图片" path="images">
            <ImageUpload v-model:value="model.images" :max-count="9" />
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
