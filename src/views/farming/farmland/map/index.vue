<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { NCard, useMessage } from 'naive-ui';
import { fetchCreateFarmland, fetchUpdateFarmland } from '@/service/api/farming/farmland';
import { fetchGetUserList } from '@/service/api/system';
import MapContainer from './modules/MapContainer.vue';
import FarmlandInfo from './modules/FarmlandInfo.vue';

const message = useMessage();
const route = useRoute();

// 子组件引用
const mapContainerRef = ref<InstanceType<typeof MapContainer> | null>(null);
const infoRef = ref<InstanceType<typeof FarmlandInfo> | null>(null);

// 用户相关
const userOptions = ref<{ label: string; value: string }[]>([]);
const userLoading = ref(false);

// 地图状态
const coordinates = ref<Array<[number, number]>>([]);
const area = ref(0); // 平方米

// 表单数据
const farmlandForm = ref<Api.Farming.FarmlandOperateParams>(createDefaultModel());

const isSaving = ref(false);

function createDefaultModel(): Api.Farming.FarmlandOperateParams {
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

// 获取用户列表
async function getUserOptions() {
  userLoading.value = true;
  try {
    const { error, data } = await fetchGetUserList({ current: 1, size: 1000 });
    if (!error && data.records) {
      userOptions.value = data.records.map((user: any) => ({
        label: user.realName,
        value: user.userId
      }));
    }
  } finally {
    userLoading.value = false;
  }
}

// 处理来自地图的数据更新
const handleMapDataUpdate = (data: {
  coordinates: Array<[number, number]>;
  area: number;
  areaSize: number;
  location: string;
}) => {
  coordinates.value = data.coordinates;
  area.value = data.area;
  farmlandForm.value.areaSize = data.areaSize;
  farmlandForm.value.polygonPath = JSON.stringify(data.coordinates);
  if (data.location) {
    farmlandForm.value.location = data.location;
  }
};

// 保存田块数据
const handleSave = async () => {
  try {
    // 地图数据校验
    if (coordinates.value.length < 3) {
      message.warning('至少需要3个顶点才能形成有效的田块');
      return;
    }

    isSaving.value = true;

    // 准备提交的数据 (可以直接使用 farmlandForm.value，因为它已经是正确的类型)
    // 确保 polygonPath 是最新的 (虽然 handleMapDataUpdate 已经更新了，但再次确认也无妨，或者就在这里设置)
    farmlandForm.value.polygonPath = JSON.stringify(coordinates.value);

    console.log('即将提交的数据:', farmlandForm.value);

    // 调用 API 保存数据
    let result;
    if (farmlandForm.value.id) {
      result = await fetchUpdateFarmland(farmlandForm.value);
    } else {
      result = await fetchCreateFarmland(farmlandForm.value);
    }

    const { data, error } = result;

    if (!error && data) {
      message.success('田块保存成功！');
      // 如果是编辑模式，不重置，或者根据需求决定。这里假设保存后为了便利可以保留或重置。
      // 如果是从列表跳转过来的，可能希望保留状态？但通常保存意味着完成。
      handleReset();
    }
  } catch (err: any) {
    console.error('保存失败:', err);
  } finally {
    isSaving.value = false;
  }
};

// 重置表单和地图
const handleReset = () => {
  farmlandForm.value = createDefaultModel();
  coordinates.value = [];
  area.value = 0;

  // 清除地图上的绘制
  mapContainerRef.value?.clearMap();

  message.info('已重置表单');
};

onMounted(() => {
  getUserOptions();

  // 检查路由参数，如果有数据则回显
  const queryData = route.query.data;
  if (queryData && typeof queryData === 'string') {
    try {
      const parsedData = JSON.parse(queryData);
      Object.assign(farmlandForm.value, parsedData);

      // 回显多边形
      if (parsedData.polygonPath) {
        const coords = JSON.parse(parsedData.polygonPath);
        coordinates.value = coords;
        // 设置面积显示
        if (parsedData.areaSize) {
          // 这里的 area 是用于显示的 m2，近似倒推一下或者直接为 0 (因为 FarmlandInfo 主要显示 areaSize 亩)
          area.value = parsedData.areaSize * 666.67;
        }

        // 延迟执行以确保地图初始化完成
        setTimeout(() => {
          mapContainerRef.value?.setPolygon(coords);
        }, 500);
      }
    } catch (e) {
      console.error('解析路由数据失败:', e);
    }
  }
});
</script>

<template>
  <div class="farmland-map-container">
    <NCard title="田块地图管理" :bordered="false" class="h-full">
      <div class="map-layout">
        <!-- 地图容器 -->
        <MapContainer ref="mapContainerRef" @update:data="handleMapDataUpdate" />

        <!-- 右侧信息面板 -->
        <FarmlandInfo
          ref="infoRef"
          v-model="farmlandForm"
          :coordinates="coordinates"
          :area="area"
          :user-options="userOptions"
          :user-loading="userLoading"
          :loading="isSaving"
          @submit="handleSave"
          @reset="handleReset"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.farmland-map-container {
  height: 100%;
  padding: 16px;
}

.map-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 180px);
}
</style>
