<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { jsonClone } from '@sa/utils';
import { fetchGetFarmlandList } from '@/service/api/farming';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import { cropStatusOptions } from '@/constants/business';

defineOptions({
  name: 'CropSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const { validate, restoreValidation } = useNaiveForm();

const model = defineModel<Api.Farming.CropSearchParams>('model', { required: true });

const defaultModel = jsonClone(toRaw(model.value));

/** 农田选项 */
const farmlandOptions = ref<{ label: string; value: CommonType.IdType }[]>([]);

async function getFarmlandOptions() {
  const { error, data } = await fetchGetFarmlandList();
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

// 初始化农田选项
getFarmlandOptions();
</script>

<template>
  <NCard :bordered="false" size="small" class="table-search card-wrapper">
    <NCollapse>
      <NCollapseItem :title="$t('common.search')" name="crop-search">
        <NForm :model="model" label-placement="left" :label-width="80">
          <NGrid responsive="screen" item-responsive>
            <NFormItemGi span="24 s:12 m:6" label="作物名称" path="cropName" class="pr-24px">
              <NInput v-model:value="model.cropName" placeholder="请输入作物名称" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="品种" path="variety" class="pr-24px">
              <NInput v-model:value="model.variety" placeholder="请输入品种" />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="所属农田" path="farmlandId" class="pr-24px">
              <NSelect v-model:value="model.farmlandId" placeholder="请选择所属农田" :options="farmlandOptions" clearable />
            </NFormItemGi>
            <NFormItemGi span="24 s:12 m:6" label="状态" path="status" class="pr-24px">
              <NSelect v-model:value="model.status" placeholder="请选择作物状态" :options="cropStatusOptions" clearable />
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
