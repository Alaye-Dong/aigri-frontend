<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchAdoptSuggestion, fetchGetSuggestionInfo } from '@/service/api/ai';

defineOptions({
  name: 'SuggestionDetailDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.Ai.Suggestion | null;
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

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增智能建议',
    edit: '智能建议详情'
  };
  return titles[props.operateType];
});

type Model = Api.Ai.Suggestion;

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    id: 0,
    farmlandId: null,
    urgencyLevel: '',
    suggestion: '',
    isAdopted: 0,
    isPushed: 0,
    createTime: '',
    createBy: '',
    updateBy: '',
    updateTime: '',
    status: null
  };
}

const urgencyNames: Record<string, string> = {
  CAUTION: '注意',
  WARNING: '警告',
  TIP: '提示'
};

async function getSuggestionInfo(id?: CommonType.IdType) {
  if (!id) return;

  startLoading();
  const { error, data } = await fetchGetSuggestionInfo(id);
  if (!error && data) {
    Object.assign(model.value, data as Api.Ai.Suggestion);
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
      Object.assign(model.value, jsonClone(props.rowData));
    } else {
      await getSuggestionInfo(props.rowId);
    }
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleAdopt() {
  if (!model.value.id) return;

  const { error } = await fetchAdoptSuggestion(model.value.id);
  if (error) return;

  // 乐观更新本地模型，确保抽屉界面立即反映采纳状态
  model.value.isAdopted = 1;
  window.$message?.success('采纳成功');
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="560" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm :model="model" label-placement="left" :label-width="100">
          <NFormItem label="农田ID" path="farmlandId">
            <NInput :value="model.farmlandId?.toString() || '-'" placeholder="农田ID" readonly />
          </NFormItem>
          <NFormItem label="紧急程度" path="urgencyLevel">
            <NTag
              :type="model.urgencyLevel === 'CAUTION' ? 'error' : model.urgencyLevel === 'WARNING' ? 'warning' : 'info'"
              size="small"
            >
              {{ urgencyNames[model.urgencyLevel] || model.urgencyLevel }}
            </NTag>
          </NFormItem>
          <NFormItem label="建议内容" path="suggestion">
            <NInput
              v-model:value="model.suggestion"
              type="textarea"
              placeholder="建议内容"
              :autosize="{ minRows: 6, maxRows: 12 }"
              readonly
            />
          </NFormItem>
          <NFormItem label="采纳状态" path="isAdopted">
            <NTag :type="Number(model.isAdopted) === 1 ? 'success' : 'default'" size="small">
              {{ Number(model.isAdopted) === 1 ? '已采纳' : '未采纳' }}
            </NTag>
          </NFormItem>
          <NFormItem label="推送状态" path="isPushed">
            <NTag :type="Number(model.isPushed) === 1 ? 'info' : 'default'" size="small">
              {{ Number(model.isPushed) === 1 ? '已推送' : '未推送' }}
            </NTag>
          </NFormItem>
          <NFormItem label="创建时间" path="createTime">
            <NInput v-model:value="model.createTime" placeholder="创建时间" readonly />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">关闭</NButton>
          <NButton v-if="Number(model.isAdopted) !== 1" type="primary" @click="handleAdopt">采纳建议</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
