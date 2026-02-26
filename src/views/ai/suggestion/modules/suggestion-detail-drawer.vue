<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { jsonClone } from '@sa/utils';
import { useLoading } from '@sa/hooks';
import { fetchGetSuggestionInfo, fetchAdoptSuggestion } from '@/service/api/ai';
import { $t } from '@/locales';

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
    farmlandName: null,
    triggerReason: '',
    suggestion: '',
    aiModel: '',
    isAdopted: 0,
    createTime: '',
    createBy: '',
    updateBy: '',
    updateTime: '',
    status: null
  };
}

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
          <NFormItem label="农田名称" path="farmlandName">
            <NInput v-model:value="model.farmlandName" placeholder="农田名称" readonly />
          </NFormItem>
          <NFormItem label="触发原因" path="triggerReason">
            <NInput
              v-model:value="model.triggerReason"
              type="textarea"
              placeholder="触发原因"
              :autosize="{ minRows: 2, maxRows: 4 }"
              readonly
            />
          </NFormItem>
          <NFormItem label="建议内容" path="suggestion">
            <NInput
              v-model:value="model.suggestion"
              type="textarea"
              placeholder="建议内容"
              :autosize="{ minRows: 4, maxRows: 8 }"
              readonly
            />
          </NFormItem>
          <NFormItem label="AI模型" path="aiModel">
            <NInput v-model:value="model.aiModel" placeholder="AI模型" readonly />
          </NFormItem>
          <NFormItem label="采纳状态" path="isAdopted">
            <NTag :type="model.isAdopted === 1 ? 'success' : 'default'" size="small">
              {{ model.isAdopted === 1 ? '已采纳' : '未采纳' }}
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
          <NButton v-if="model.isAdopted !== 1" type="primary" @click="handleAdopt">采纳建议</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>