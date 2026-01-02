<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'AlertLogSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { validate, restoreValidation } = useNaiveForm();

const dateRangeCreateTime = ref<[string, string] | null>(null);

const model = defineModel<Api.Env.AlertLogSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

function resetModel() {
  dateRangeCreateTime.value = null;
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
      <NCollapseItem :title="$t('common.search')" name="alert-log-search">
        <NForm :model="model" label-placement="left" :label-width="100">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="规则名称" path="ruleId" class="pr-24px">
              <NInput v-model:value="model.ruleName" placeholder="规则名称...默认为全部" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="农田名称" path="farmlandId" class="pr-24px">
              <NInput v-model:value="model.farmlandName" placeholder="农田名称...默认为全部" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="设备序列号" path="deviceId" class="pr-24px">
              <NInput v-model:value="model.deviceSerialNo" placeholder="设备序列号...默认为全部" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="处理状态" path="processStatus" class="pr-24px">
              <NSelect
                v-model:value="model.processStatus"
                placeholder="处理状态...默认为全部"
                :options="[
                  {
                    label: '未读',
                    value: 0
                  },
                  {
                    label: '已处理',
                    value: 1
                  }
                ]"
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
