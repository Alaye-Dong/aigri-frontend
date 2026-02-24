<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import {
  fetchBatchDeleteFarmland,
  fetchCreateFarmland,
  fetchGetFarmlandList,
  fetchUpdateFarmland
} from '@/service/api/farming/farmland';
import { fetchGetUserList } from '@/service/api/system';
import MapContainer from './modules/MapContainer.vue';
import FarmlandInfo from './modules/FarmlandInfo.vue';
import FarmlandList from './modules/FarmlandList.vue';

const message = useMessage();

// ---- 子组件引用 ----
const mapRef = ref<InstanceType<typeof MapContainer> | null>(null);

// ---- 地块列表 ----
const farmlands = ref<Api.Farming.Farmland[]>([]);
const listLoading = ref(false);

async function loadFarmlands() {
  listLoading.value = true;
  try {
    const { data, error } = await fetchGetFarmlandList({ current: 1, size: 1000 });
    if (!error && data?.records) {
      farmlands.value = data.records;
    }
  } finally {
    listLoading.value = false;
  }
}

// ---- 选中地块 ----
const selectedFarmland = ref<Api.Farming.Farmland | null>(null);

function handleSelect(farmland: Api.Farming.Farmland) {
  if (mode.value !== 'view') return; // 编辑中不切换
  selectedFarmland.value = farmland;
}

// ---- 面板模式 ----
type PanelMode = 'view' | 'edit' | 'create';
const mode = ref<PanelMode>('view');

// ---- 绘制数据 ----
const coordinates = ref<Array<[number, number]>>([]);
const area = ref(0);

// ---- 编辑/新建草稿 ----
function emptyDraft(): Api.Farming.FarmlandOperateParams {
  return {
    id: null,
    userId: null,
    name: '',
    areaSize: null,
    location: '',
    soilType: null,
    description: '',
    polygonPath: null
  };
}
const draftModel = ref<Api.Farming.FarmlandOperateParams>(emptyDraft());

// ---- 用户选项 ----
const userOptions = ref<{ label: string; value: string }[]>([]);
const userLoading = ref(false);

async function loadUserOptions() {
  userLoading.value = true;
  try {
    const { data, error } = await fetchGetUserList({ current: 1, size: 1000 });
    if (!error && data?.records) {
      userOptions.value = data.records.map((u: any) => ({
        label: u.realName,
        value: u.userId
      }));
    }
  } finally {
    userLoading.value = false;
  }
}

// ---- 操作 ----
const isSaving = ref(false);

/** 点击"新建" */
function handleAdd() {
  selectedFarmland.value = null;
  draftModel.value = emptyDraft();
  coordinates.value = [];
  area.value = 0;
  mode.value = 'create';
  mapRef.value?.clearDrawn();
}

/** 点击右侧"编辑" */
function handleEdit() {
  if (!selectedFarmland.value) return;
  draftModel.value = { ...(selectedFarmland.value as any) };
  // 回显已有坐标
  if (selectedFarmland.value.polygonPath) {
    try {
      const coords = JSON.parse(selectedFarmland.value.polygonPath);
      coordinates.value = coords;
      setTimeout(() => {
        mapRef.value?.setPolygon(coords);
      }, 100);
    } catch (_) {}
  } else {
    coordinates.value = [];
    mapRef.value?.clearDrawn();
  }
  mode.value = 'edit';
}

/** 取消编辑/新建 */
function handleCancel() {
  mode.value = 'view';
  mapRef.value?.clearDrawn();
  coordinates.value = [];
  area.value = 0;
}

/** 保存 */
async function handleSave() {
  if (mode.value === 'create' && coordinates.value.length < 3) {
    message.warning('请先在地图上绘制至少3个顶点的田块边界');
    return;
  }
  isSaving.value = true;
  try {
    draftModel.value.polygonPath = JSON.stringify(coordinates.value);
    const isEdit = mode.value === 'edit';
    const apiFn = isEdit ? fetchUpdateFarmland : fetchCreateFarmland;
    const { error } = await apiFn(draftModel.value);
    if (!error) {
      message.success(isEdit ? '田块更新成功！' : '田块创建成功！');
      await loadFarmlands();
      mode.value = 'view';
      mapRef.value?.clearDrawn();
      coordinates.value = [];
      area.value = 0;
      // 重新选中刚保存的地块
      if (draftModel.value.name) {
        const found = farmlands.value.find(f => f.name === draftModel.value.name);
        if (found) selectedFarmland.value = found;
      }
    }
  } finally {
    isSaving.value = false;
  }
}

/** 删除 */
async function handleDelete() {
  if (!selectedFarmland.value?.id) return;
  const { error } = await fetchBatchDeleteFarmland([selectedFarmland.value.id]);
  if (!error) {
    message.success('删除成功');
    selectedFarmland.value = null;
    await loadFarmlands();
  }
}

/** 地图绘制数据更新 */
function handleMapDataUpdate(data: {
  coordinates: Array<[number, number]>;
  area: number;
  areaSize: number;
  location: string;
}) {
  coordinates.value = data.coordinates;
  area.value = data.area;
  draftModel.value.areaSize = data.areaSize;
  draftModel.value.polygonPath = JSON.stringify(data.coordinates);
  if (data.location) {
    draftModel.value.location = data.location;
  }
}

onMounted(() => {
  loadFarmlands();
  loadUserOptions();
});
</script>

<template>
  <div class="farmland-map-page box-border h-[calc(100vh-120px)] min-h-500px flex gap-12px p-16px">
    <!-- 左侧：地块列表 -->
    <FarmlandList
      :farmlands="farmlands"
      :loading="listLoading"
      :selected-id="selectedFarmland?.id ?? null"
      @select="handleSelect"
      @add="handleAdd"
    />

    <!-- 中间：地图 -->
    <MapContainer
      ref="mapRef"
      :farmlands="farmlands"
      :selected-id="selectedFarmland?.id ?? null"
      :draw-mode="mode === 'edit' || mode === 'create'"
      @select="handleSelect"
      @update:data="handleMapDataUpdate"
    />

    <!-- 右侧：详情 / 编辑 -->
    <FarmlandInfo
      :farmland="selectedFarmland"
      :draft-model="draftModel"
      :coordinates="coordinates"
      :area="area"
      :user-options="userOptions"
      :user-loading="userLoading"
      :loading="isSaving"
      :mode="mode"
      @update:draft-model="val => (draftModel = val)"
      @edit="handleEdit"
      @delete="handleDelete"
      @submit="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>
