<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import { fetchGetFarmlandList } from '@/service/api/farming';

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

/** 采纳状态选项 */
const adoptStatusOptions = [
  { label: '未采纳', value: 0 },
  { label: '已采纳', value: 1 }
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
            <NFormItemGi span="24 s:12 m:6" label="农田名称" path="farmlandId" class="pr-24px">
              <NSelect
                v-model:value="model.farmlandId"
                placeholder="选择农田...默认为全部"
                :options="farmlandOptions"
                clearable
                filterable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="采纳状态" path="isAdopted" class="pr-24px">
              <NSelect
                v-model:value="model.isAdopted"
                placeholder="采纳状态...默认为全部"
                :options="adoptStatusOptions"
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