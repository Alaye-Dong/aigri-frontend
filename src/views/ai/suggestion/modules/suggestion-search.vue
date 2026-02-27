<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'SuggestionSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Ai.SuggestionSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: number }[]>([]);

/** 加载农田列表 */
async function loadFarmlands() {
  const { data, error } = await fetchGetFarmlandList({ current: 1, size: 100 });
  if (!error && data) {
    farmlandOptions.value = data.records.map(item => ({
      label: item.name,
      value: item.id
    }));
  }
}

/** 紧急程度选项 */
const urgencyLevelOptions = [
  { label: '紧急', value: 'URGENT' },
  { label: '高', value: 'HIGH' },
  { label: '中', value: 'MEDIUM' },
  { label: '低', value: 'LOW' }
];

function resetModel() {
  Object.assign(model.value, defaultModel);
}

async function reset() {
  await restoreValidation();
  resetModel();
  emit('reset');
}

async function search() {
  await validate();
  emit('search');
}

// 初始化加载农田列表
loadFarmlands();
</script>

<template>
  <NCard :bordered="false" size="small" class="table-search card-wrapper">
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="suggestion-search">
        <NForm :model="model" label-placement="left" :label-width="100">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="农田" path="farmlandId" class="pr-24px">
              <NSelect
                v-model:value="model.farmlandId"
                placeholder="选择农田...默认为全部"
                :options="farmlandOptions"
                clearable
                filterable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="紧急程度" path="urgencyLevel" class="pr-24px">
              <NSelect
                v-model:value="model.urgencyLevel"
                placeholder="紧急程度...默认为全部"
                :options="urgencyLevelOptions"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:12" class="pr-24px">
              <NSpace class="w-full" justify="end">
                <NButton @click="reset">
                  <template #icon>
                    <icon-ic-round-refresh class="text-icon" />
                  </template>
                  {{ $t('common.reset') }}
                </NButton>
                <NButton type="primary" ghost @click="search">
                  <template #icon>
                    <icon-ic-round-search class="text-icon" />
                  </template>
                  {{ $t('common.search') }}
                </NButton>
              </NSpace>
            </NFormItemGi>
          </NGrid>
        </NForm>
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>

<style scoped></style>
