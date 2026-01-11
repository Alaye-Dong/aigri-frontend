<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'FarmlandSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Farming.FarmlandSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

/** 土壤类型选项 */
const soilTypeOptions = [
  { label: '黑土', value: '黑土' },
  { label: '红土', value: '红土' },
  { label: '黄土', value: '黄土' },
  { label: '沙土', value: '沙土' },
  { label: '粘土', value: '粘土' },
  { label: '壤土', value: '壤土' }
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
</script>

<template>
  <NCard :bordered="false" size="small" class="table-search card-wrapper">
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="farmland-search">
        <NForm :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="地块名称" path="name" class="pr-24px">
              <NInput v-model:value="model.name" placeholder="请输入地块名称" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="位置" path="location" class="pr-24px">
              <NInput v-model:value="model.location" placeholder="请输入位置" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="土壤类型" path="soilType" class="pr-24px">
              <NSelect
                v-model:value="model.soilType"
                placeholder="请选择土壤类型"
                :options="soilTypeOptions"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" class="pr-24px">
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
