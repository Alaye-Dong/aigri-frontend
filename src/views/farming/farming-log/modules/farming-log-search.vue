<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { fetchGetUserList } from '@/service/api/system';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'FarmingLogSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Farming.FarmingLogSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 用户选项 */
const userOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

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

async function getFarmlandOptions() {
  const { error, data } = await fetchGetFarmlandList();
  if (!error && data.records) {
    farmlandOptions.value = data.records.map(farmland => ({
      label: farmland.name,
      value: farmland.id
    }));
  }
}

async function getUserOptions() {
  const { error, data } = await fetchGetUserList({ current: 1, size: 1000 });
  if (!error && data.records) {
    userOptions.value = data.records.map(user => ({
      label: user.realName,
      value: user.userId
    }));
  }
}

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

// 初始化选项
getFarmlandOptions();
getUserOptions();
</script>

<template>
  <NCard :bordered="false" size="small" class="table-search card-wrapper">
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="farming-log-search">
        <NForm :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="所属农田" path="farmlandId" class="pr-24px">
              <NSelect
                v-model:value="model.farmlandId"
                placeholder="请选择所属农田"
                :options="farmlandOptions"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="操作类型" path="operateType" class="pr-24px">
              <NSelect
                v-model:value="model.operateType"
                placeholder="请选择操作类型"
                :options="operateTypeOptions"
                clearable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="操作人" path="userId" class="pr-24px">
              <NSelect v-model:value="model.userId" placeholder="请选择操作人" :options="userOptions" clearable />
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
