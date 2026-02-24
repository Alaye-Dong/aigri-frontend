<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({ name: 'FarmlandInfo' });

const props = defineProps<{
  farmland: Api.Farming.Farmland | null;
  /** 新建/编辑模式的草稿 */
  draftModel: Api.Farming.FarmlandOperateParams | null;
  coordinates: Array<[number, number]>;
  area: number;
  userOptions: { label: string; value: string }[];
  userLoading: boolean;
  loading: boolean;
  mode: 'view' | 'edit' | 'create';
}>();

const emit = defineEmits<{
  (e: 'update:draftModel', val: Api.Farming.FarmlandOperateParams): void;
  (e: 'submit'): void;
  (e: 'cancel'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const localDraft = computed({
  get: () => props.draftModel ?? ({} as Api.Farming.FarmlandOperateParams),
  set: val => emit('update:draftModel', val)
});

const soilTypeOptions = [
  { label: '黑土', value: '黑土' },
  { label: '红土', value: '红土' },
  { label: '黄土', value: '黄土' },
  { label: '沙土', value: '沙土' },
  { label: '粘土', value: '粘土' },
  { label: '壤土', value: '壤土' }
];

const rules = {
  name: createRequiredRule('请输入田块名称'),
  userId: createRequiredRule('请选择负责人')
};

async function handleSave() {
  await validate();
  emit('submit');
}

function handleCancel() {
  restoreValidation();
  emit('cancel');
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return dateStr.slice(0, 10).replace(/-/g, '/');
}

defineExpose({ restoreValidation });
</script>

<template>
  <div class="info-panel w-320px flex flex-col flex-shrink-0 overflow-hidden rounded-8px bg-white shadow-sm">
    <!-- ===== 空态 ===== -->
    <div
      v-if="mode === 'view' && !farmland"
      class="empty-state p-40px-20px flex flex-col flex-1 items-center justify-center gap-8px text-gray-400"
    >
      <SvgIcon icon="material-symbols:terrain-outline-rounded" class="empty-icon text-56px text-gray-300" />
      <p class="empty-title m-0 text-15px text-gray-500 font-600">选择左侧地块</p>
      <p class="empty-desc m-0 text-center text-12px text-gray-400 leading-1.6">
        点击地块列表或地图多边形，查看详细信息
      </p>
    </div>

    <!-- ===== 查看模式 ===== -->
    <template v-else-if="mode === 'view' && farmland">
      <!-- 标题 -->
      <div class="panel-header flex items-center justify-between gap-8px px-14px py-14px border-b border-gray-100 flex-shrink-0 dark:border-dark-80">
        <div class="header-left min-w-0 flex flex-1 items-center">
          <span class="panel-title overflow-hidden text-ellipsis whitespace-nowrap text-15px text-gray-900 font-600 dark:text-gray-100">{{ farmland.name }}</span>
          <NTag type="success" size="small" round class="ml-8px">
            {{ farmland.areaSize ? `${farmland.areaSize} 亩` : '未知面积' }}
          </NTag>
        </div>
        <NSpace :size="6">
          <NButton size="small" type="primary" @click="emit('edit')">
            <template #icon>
              <SvgIcon icon="material-symbols:drive-file-rename-outline-outline" />
            </template>
            编辑
          </NButton>
          <NButton size="small" type="error" ghost @click="emit('delete')">
            <template #icon>
              <SvgIcon icon="material-symbols:delete-outline" />
            </template>
            删除
          </NButton>
        </NSpace>
      </div>

      <!-- 描述列表 -->
      <div class="desc-wrap flex-1 overflow-y-auto px-14px py-14px">
        <NDescriptions :column="1" label-placement="left" label-style="width:80px;color:#888;">
          <NDescriptionsItem label="负责人">{{ farmland.userRealName || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="位置">{{ farmland.location || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="土壤类型">{{ farmland.soilType || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="描述">{{ farmland.description || '-' }}</NDescriptionsItem>
          <NDescriptionsItem label="创建时间">{{ formatDate(farmland.createTime) }}</NDescriptionsItem>
          <NDescriptionsItem label="坐标点数">
            {{ farmland.polygonPath ? `${JSON.parse(farmland.polygonPath).length} 个顶点` : '无坐标' }}
          </NDescriptionsItem>
        </NDescriptions>
      </div>
    </template>

    <!-- ===== 编辑 / 新建模式 ===== -->
    <template v-else>
      <div class="panel-header flex items-center justify-between gap-8px px-14px py-14px border-b border-gray-100 flex-shrink-0 dark:border-dark-80">
        <span class="panel-title text-15px font-600 text-gray-900 dark:text-gray-100">{{ mode === 'create' ? '新建田块' : '编辑田块' }}</span>
      </div>

      <!-- 绘制提示 -->
      <div class="draw-hint flex items-center gap-6px px-14px py-8px bg-green-50 text-green-600 text-12px flex-shrink-0">
        <SvgIcon icon="material-symbols:draw-outline-rounded" class="hint-icon text-15px flex-shrink-0" />
        <span>{{ mode === 'create' ? '在右侧地图上绘制田块多边形' : '可在地图上重新绘制边界' }}</span>
        <span v-if="coordinates.length > 0" class="hint-count font-600">（已有 {{ coordinates.length }} 个顶点）</span>
      </div>

      <!-- 表单 -->
      <div class="form-wrap flex-1 overflow-y-auto px-14px pt-12px">
        <NForm ref="formRef" :model="localDraft" :rules="rules" label-placement="left" label-width="80" size="small">
          <NFormItem label="田块名称" path="name">
            <NInput v-model:value="localDraft.name" placeholder="请输入田块名称" :disabled="loading" />
          </NFormItem>

          <NFormItem label="负责人" path="userId">
            <NSelect
              v-model:value="localDraft.userId"
              :options="userOptions"
              :loading="userLoading"
              filterable
              clearable
              placeholder="请选择负责人"
              :disabled="loading"
            />
          </NFormItem>

          <NFormItem label="位置" path="location">
            <NInput v-model:value="localDraft.location" placeholder="位置（可自动获取）" :disabled="loading" />
          </NFormItem>

          <NFormItem label="土壤类型" path="soilType">
            <NSelect
              v-model:value="localDraft.soilType"
              :options="soilTypeOptions"
              placeholder="请选择土壤类型"
              clearable
              :disabled="loading"
            />
          </NFormItem>

          <NFormItem label="面积(亩)" path="areaSize">
            <div class="area-block flex flex-col gap-4px w-full">
              <NInputNumber
                v-model:value="localDraft.areaSize"
                placeholder="面积"
                :precision="2"
                :min="0"
                :disabled="loading"
                class="w-full"
              />
              <div v-if="area > 0" class="area-sub flex justify-between text-11px text-gray-400">
                <span>{{ area.toFixed(2) }} m²</span>
                <span>{{ (area / 10000).toFixed(4) }} 公顷</span>
              </div>
            </div>
          </NFormItem>

          <NFormItem label="描述" path="description">
            <NInput
              v-model:value="localDraft.description"
              type="textarea"
              placeholder="田块描述（可选）"
              :autosize="{ minRows: 2, maxRows: 4 }"
              :disabled="loading"
            />
          </NFormItem>
        </NForm>
      </div>

      <!-- 按钮 -->
      <div class="action-bar px-14px py-12px flex gap-8px border-t border-gray-100 flex-shrink-0 dark:border-dark-80">
        <NButton
          type="primary"
          :loading="loading"
          :disabled="coordinates.length < 3 && mode === 'create'"
          @click="handleSave"
        >
          {{ loading ? '保存中...' : '保存田块' }}
        </NButton>
        <NButton :disabled="loading" @click="handleCancel">取消</NButton>
      </div>
    </template>
  </div>
</template>
