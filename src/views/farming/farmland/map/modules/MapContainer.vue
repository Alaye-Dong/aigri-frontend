<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

defineOptions({
  name: 'MapContainer'
});

const emit = defineEmits<{
  (e: 'update:data', val: { coordinates: Array<[number, number]>; area: number; areaSize: number; location: string }): void;
  (e: 'update:drawing', val: boolean): void;
}>();

const message = useMessage();
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let drawControl: L.Control.Draw | null = null;
let drawnItems: L.FeatureGroup | null = null;

const isDrawing = ref(false);
const vertexCount = ref(0);

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return;

  // 创建地图实例
  map = L.map(mapContainer.value, {
    maxZoom: 22,
    minZoom: 3,
    attributionControl: false
  }).setView([28.415, 116.043], 13);

  // 添加高德卫星影像图层
  L.tileLayer('http://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
    maxNativeZoom: 16,
    maxZoom: 22,
    minZoom: 3,
    attribution: '© 高德地图',
    errorTileUrl: ''
  }).addTo(map);

  // 叠加路网标注图层
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
        showArea: false,
        metric: true,
        repeatMode: false,
        drawError: {
          color: '#e74c3c',
          message: '<strong>错误!</strong> 不能自相交!'
        },
        shapeOptions: {
          color: '#3388ff',
          weight: 3,
          fillOpacity: 0.3
        },
        icon: new L.DivIcon({
          iconSize: new L.Point(8, 8),
          className: 'leaflet-div-icon leaflet-editing-icon'
        }),
        touchIcon: new L.DivIcon({
          iconSize: new L.Point(20, 20),
          className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
        })
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

  map.addControl(drawControl);

  // 监听绘制完成事件
  map.on(L.Draw.Event.CREATED, async (event: any) => {
    const layer = event.layer;
    drawnItems?.addLayer(layer);

    // 获取坐标点
    const latlngs = layer.getLatLngs()[0];
    const coordinates: Array<[number, number]> = latlngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);

    // 计算中心点用于逆地理编码
    const center = layer.getBounds().getCenter();
    const location = await fetchAddress(center.lat, center.lng);

    // 计算面积
    const area = calculateArea(latlngs);
    const areaSize = Number((area / 666.67).toFixed(2));

    emit('update:data', { coordinates, area, areaSize, location });

    isDrawing.value = false;
    emit('update:drawing', false);
    message.success(`已绘制田块，面积约为 ${areaSize} 亩 (${(area / 10000).toFixed(2)} 公顷)`);
  });

  // 监听绘制开始
  map.on(L.Draw.Event.DRAWSTART, () => {
    isDrawing.value = true;
    emit('update:drawing', true);
    vertexCount.value = 0;
  });

  // 监听绘制停止
  map.on(L.Draw.Event.DRAWSTOP, () => {
    isDrawing.value = false;
    emit('update:drawing', false);
    vertexCount.value = 0;
  });

  // 监听绘制顶点事件
  map.on(L.Draw.Event.DRAWVERTEX, () => {
    vertexCount.value++;
  });

  // 监听删除事件
  map.on(L.Draw.Event.DELETED, () => {
    emit('update:data', { coordinates: [], area: 0, areaSize: 0, location: '' });
    message.info('已删除绘制的田块');
  });
};

// 逆地理编码获取地址
const fetchAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    // 优先使用 Nominatim (OSM) 进行免费逆地理编码，设置语言为中文
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'zh-CN,zh;q=0.9'
        }
      }
    );
    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;
      // 按照中国地址习惯拼接: 省 + 市 + 区/县 + 镇/街道 + 村/路/地名
      const parts = [
        addr.state || addr.province || '',
        addr.city || addr.town || addr.municipality || '',
        addr.county || addr.district || '',
        addr.suburb || addr.township || addr.village || '',
        addr.road || addr.neighbourhood || addr.pedestrian || ''
      ].filter(Boolean);

      return parts.join('');
    }
  } catch (error) {
    console.error('获取地址失败:', error);
  }
  return '';
};

// 计算面积
const calculateArea = (latlngs: L.LatLng[]): number => {
  const earthRadius = 6371000;
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

// 清空地图
const clearMap = () => {
  drawnItems?.clearLayers();
};

defineExpose({
  clearMap
});

onMounted(() => {
  setTimeout(() => {
    initMap();
  }, 100);
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <div v-if="isDrawing" class="drawing-tip">
      <div class="tip-text">点击地图添加顶点，双击完成绘制</div>
      <div class="tip-count">已添加 {{ vertexCount }} 个顶点</div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* 确保在父容器中占满 */
  height: 100%;
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
  background: rgba(51, 136, 255, 0.95);
  color: white;
  padding: 14px 28px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: pulse 2s ease-in-out infinite;
  text-align: center;
  min-width: 280px;
}

.tip-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.tip-count {
  font-size: 16px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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

/* Leaflet Draw Custom Styles */
:deep(.leaflet-draw-tooltip) {
  background: rgba(51, 136, 255, 0.9);
  border: none;
  color: white;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
}

:deep(.leaflet-draw-tooltip-single) {
  background: rgba(51, 136, 255, 0.9);
}

:deep(.leaflet-draw-tooltip-subtext) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.leaflet-editing-icon) {
  border-radius: 50%;
  border: 2px solid #3388ff;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:deep(.leaflet-marker-icon) {
  border: 2px solid #3388ff !important;
  background: white !important;
}

:deep(.leaflet-draw-guide-dash) {
  stroke-dasharray: 5, 10;
  stroke: #3388ff;
  stroke-width: 2;
}
</style>
