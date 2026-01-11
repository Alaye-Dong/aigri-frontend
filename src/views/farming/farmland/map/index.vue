<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { NButton, NCard, NForm, NFormItem, NInput, NSpace, useMessage } from 'naive-ui';

// 定义田块数据类型
interface FarmlandData {
  name: string;
  coordinates: Array<[number, number]>;
  area: number; // 平方米
}

const message = useMessage();
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let drawControl: L.Control.Draw | null = null;
let drawnItems: L.FeatureGroup | null = null;

// 表单数据
const farmlandForm = ref<FarmlandData>({
  name: '',
  coordinates: [],
  area: 0
});

const isDrawing = ref(false);

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return;

  // 创建地图实例，中心点设置为中国某个位置（可根据实际需求调整）
  map = L.map(mapContainer.value, {
    maxZoom: 22, // 允许用户放大到的最大级别
    minZoom: 3 // 最小缩放级别
  }).setView([39.9042, 116.4074], 13);

  // 添加高德卫星影像图层
  L.tileLayer('http://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
    maxNativeZoom: 18, // 高德卫星图实际的最大缩放级别
    maxZoom: 22, // 允许放大到 22 级，超过 18 级后会放大已有图像
    minZoom: 3,
    attribution: '© 高德地图',
    errorTileUrl: '' // 加载失败时不显示错误图片
  }).addTo(map);

  // 叠加路网标注图层（可选）
  L.tileLayer('http://webst02.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
    maxNativeZoom: 18,
    maxZoom: 22,
    minZoom: 3,
    errorTileUrl: ''
  }).addTo(map);

  // 创建绘制图层组
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // 配置绘制控件
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
        drawError: {
          color: '#e74c3c',
          message: '<strong>错误!</strong> 不能自相交!'
        },
        shapeOptions: {
          color: '#3388ff',
          weight: 3,
          fillOpacity: 0.3
        }
      },
      polyline: false,
      circle: false,
      rectangle: false,
      marker: false,
      circlemarker: false
    },
    edit: {
      featureGroup: drawnItems,
      remove: true
    }
  });

  map.addLayer(drawnItems);
  map.addControl(drawControl);

  // 监听绘制完成事件
  map.on(L.Draw.Event.CREATED, (event: any) => {
    const layer = event.layer;
    drawnItems?.addLayer(layer);

    // 获取坐标点
    const latlngs = layer.getLatLngs()[0]; // 多边形的坐标数组
    const coordinates: Array<[number, number]> = latlngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);

    // 计算面积（平方米）
    const area = calculateArea(latlngs);

    farmlandForm.value.coordinates = coordinates;
    farmlandForm.value.area = area;

    isDrawing.value = false;
    message.success(`已绘制田块，面积约为 ${(area / 10000).toFixed(2)} 公顷`);
  });

  // 监听绘制开始
  map.on(L.Draw.Event.DRAWSTART, () => {
    isDrawing.value = true;
  });

  // 监听绘制取消
  map.on(L.Draw.Event.DRAWSTOP, () => {
    isDrawing.value = false;
  });

  // 监听删除事件
  map.on(L.Draw.Event.DELETED, () => {
    farmlandForm.value.coordinates = [];
    farmlandForm.value.area = 0;
    message.info('已删除绘制的田块');
  });
};

// 使用 Leaflet 的面积计算（基于球面几何）
const calculateArea = (latlngs: L.LatLng[]): number => {
  const earthRadius = 6371000; // 地球半径（米）
  let area = 0;
  const points = latlngs.length;

  if (points < 3) return 0;

  for (let i = 0; i < points; i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[(i + 1) % points];

    area += deg2rad(p2.lng - p1.lng) * (2 + Math.sin(deg2rad(p1.lat)) + Math.sin(deg2rad(p2.lat)));
  }

  area = (area * earthRadius * earthRadius) / 2;
  return Math.abs(area);
};

const deg2rad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

// 保存田块数据
const handleSave = () => {
  if (!farmlandForm.value.name) {
    message.warning('请输入田块名称');
    return;
  }

  if (farmlandForm.value.coordinates.length === 0) {
    message.warning('请先在地图上绘制田块');
    return;
  }

  // 这里可以调用 API 保存数据
  console.log('保存田块数据:', farmlandForm.value);
  message.success('田块数据已保存');

  // 打印坐标供查看
  console.log('坐标点:', JSON.stringify(farmlandForm.value.coordinates));
  console.log('面积（平方米）:', farmlandForm.value.area);
  console.log('面积（公顷）:', (farmlandForm.value.area / 10000).toFixed(2));
};

// 清空表单
const handleReset = () => {
  farmlandForm.value = {
    name: '',
    coordinates: [],
    area: 0
  };

  // 清除地图上的绘制
  drawnItems?.clearLayers();
  message.info('已重置表单');
};

onMounted(() => {
  // 延迟初始化地图，确保 DOM 已渲染
  setTimeout(() => {
    initMap();
  }, 100);
});

onUnmounted(() => {
  // 清理地图实例
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="farmland-map-container">
    <NCard title="田块地图管理" :bordered="false" class="h-full">
      <div class="map-layout">
        <!-- 地图容器 -->
        <div class="map-wrapper">
          <div ref="mapContainer" class="map-container"></div>
          <div v-if="isDrawing" class="drawing-tip">点击地图添加顶点，双击完成绘制</div>
        </div>

        <!-- 右侧信息面板 -->
        <div class="info-panel">
          <NCard title="田块信息" size="small">
            <NForm :model="farmlandForm" label-placement="left" label-width="80">
              <NFormItem label="田块名称">
                <NInput v-model:value="farmlandForm.name" placeholder="请输入田块名称" />
              </NFormItem>

              <NFormItem label="坐标数量">
                <span>{{ farmlandForm.coordinates.length }} 个点</span>
              </NFormItem>

              <NFormItem label="面积">
                <div class="area-info">
                  <div>{{ farmlandForm.area.toFixed(2) }} m²</div>
                  <div class="area-secondary">{{ (farmlandForm.area / 10000).toFixed(4) }} 公顷</div>
                  <div class="area-secondary">{{ (farmlandForm.area / 666.67).toFixed(2) }} 亩</div>
                </div>
              </NFormItem>

              <NFormItem label="坐标数据">
                <div class="coordinates-display">
                  <div v-if="farmlandForm.coordinates.length > 0" class="coordinate-list">
                    <div v-for="(coord, index) in farmlandForm.coordinates" :key="index" class="coordinate-item">
                      {{ index + 1 }}: [{{ coord[0].toFixed(6) }}, {{ coord[1].toFixed(6) }}]
                    </div>
                  </div>
                  <div v-else class="empty-hint">暂无坐标数据</div>
                </div>
              </NFormItem>

              <NFormItem>
                <NSpace>
                  <NButton type="primary" @click="handleSave">保存田块</NButton>
                  <NButton @click="handleReset">重置</NButton>
                </NSpace>
              </NFormItem>
            </NForm>
          </NCard>

          <NCard title="使用说明" size="small" class="mt-4">
            <div class="instruction">
              <p>
                1. 点击地图右上角的
                <strong>多边形工具</strong>
                开始绘制
              </p>
              <p>2. 在地图上点击添加顶点，围成封闭图形</p>
              <p>3. 双击完成绘制</p>
              <p>4. 系统会自动计算面积和坐标</p>
              <p>5. 输入田块名称后点击保存</p>
              <p>6. 可以使用编辑和删除工具调整图形</p>
            </div>
          </NCard>
        </div>
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

.map-wrapper {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 100%;
  z-index: 0;
}

.drawing-tip {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(51, 136, 255, 0.9);
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.info-panel {
  width: 360px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.area-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.area-secondary {
  font-size: 12px;
  color: #999;
}

.coordinates-display {
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e6;
  border-radius: 4px;
  padding: 8px;
  background: #fafafa;
}

.coordinate-list {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.coordinate-item {
  padding: 2px 0;
  color: #333;
}

.empty-hint {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 12px;
}

.instruction {
  font-size: 13px;
  line-height: 1.8;
  color: #666;
}

.instruction p {
  margin: 8px 0;
}

.instruction strong {
  color: #3388ff;
  font-weight: 600;
}

/* 自定义滚动条 */
.coordinates-display::-webkit-scrollbar,
.info-panel::-webkit-scrollbar {
  width: 6px;
}

.coordinates-display::-webkit-scrollbar-track,
.info-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.coordinates-display::-webkit-scrollbar-thumb,
.info-panel::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.coordinates-display::-webkit-scrollbar-thumb:hover,
.info-panel::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
