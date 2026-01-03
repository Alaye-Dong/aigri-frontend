<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'DeviceSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Env.DeviceSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

/** 设备状态选项 */
const deviceStatusOptions = [
  { label: '在线', value: '1' },
  { label: '离线', value: '0' }
];

/** 设备类型选项 */
const deviceTypeOptions = [
  { label: '传感器', value: '传感器' },
  { label: '控制器', value: '控制器' },
  { label: '摄像头', value: '摄像头' },
  { label: '气象站', value: '气象站' }
];

async function getFarmlandOptions() {
  const { error, data } = await fetchGetFarmlandList({ current: 1, size: 1000 });
  if (!error && data.records) {
    farmlandOptions.value = data.records.map(farmland => ({
      label: farmland.name,
      value: farmland.id
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
</script>

<template>
  <NCard :bordered="false" size="small" class="table-search card-wrapper">
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="device-search">
        <NForm :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="序列号" path="serialNo" class="pr-24px">
              <NInput v-model:value="model.serialNo" placeholder="请输入序列号" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="所属农田" path="farmlandId" class="pr-24px">
              <NSelect
                v-model:value="model.farmlandId"
                placeholder="请选择所属农田"
                :options="farmlandOptions"
                clearable
                filterable
              />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="设备类型" path="type" class="pr-24px">
              <NSelect v-model:value="model.type" placeholder="请选择设备类型" :options="deviceTypeOptions" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="设备状态" path="status" class="pr-24px">
              <NSelect
                v-model:value="model.status"
                placeholder="请选择设备状态"
                :options="deviceStatusOptions"
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
