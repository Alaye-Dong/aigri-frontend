<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'AlertRuleSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Env.AlertRuleSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

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
      <NCollapseItem :title="$t('common.search')" name="alert-rule-search">
        <NForm :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="规则名称" path="ruleName" class="pr-24px">
              <NInput v-model:value="model.ruleName" placeholder="请输入规则名称" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="农田名称" path="farmlandId" class="pr-24px">
              <NSelect v-model:value="model.farmlandId" placeholder="请选择关联农田" :options="[]" filterable />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="监测指标" path="metricType" class="pr-24px">
              <NSelect
                v-model:value="model.metricType"
                placeholder="请选择监测指标"
                :options="[
                  { label: '空气温度', value: 'air_temp' },
                  { label: '空气湿度', value: 'air_humidity' },
                  { label: '土壤湿度', value: 'soil_moisture' },
                  { label: '光照强度', value: 'light_lux' },
                  { label: '二氧化碳浓度', value: 'co2_ppm' }
                ]"
                filterable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="告警级别" path="severity" class="pr-24px">
              <NSelect
                v-model:value="model.severity"
                placeholder="请选择告警级别"
                :options="[
                  { label: '信息', value: 'info' },
                  { label: '警告', value: 'warning' },
                  { label: '危险', value: 'danger' }
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
