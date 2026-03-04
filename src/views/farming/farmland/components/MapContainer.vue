<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

defineOptions({ name: 'MapContainer' });

const props = defineProps<{
  farmlands: Api.Farming.Farmland[];
  selectedId: CommonType.IdType | null;
  /** 是否处于新建/编辑绘制模式 */
  drawMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', farmland: Api.Farming.Farmland): void;
  (
    e: 'update:data',
    val: { coordinates: Array<[number, number]>; area: number; areaSize: number; location: string }
  ): void;
  (e: 'update:drawing', val: boolean): void;
}>();

const message = useMessage();
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let drawControl: L.Control.Draw | null = null;
let drawnItems: L.FeatureGroup | null = null;

/** 所有地块渲染层：id -> { polygon, label } */
const farmlandLayers = new Map<CommonType.IdType, { polygon: L.Polygon; label: L.Marker }>();

const isDrawing = ref(false);
const vertexCount = ref(0);

// ---------- 工具函数 ----------

/** 天地图 API Key (从环境变量读取) */
const TIANDITU_TK = import.meta.env.VITE_TIANDITU_TK || '';

const deg2rad = (deg: number) => (deg * Math.PI) / 180;

const calculateArea = (latlngs: L.LatLng[]): number => {
  const earthRadius = 6371000;
  let area = 0;
  const n = latlngs.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[(i + 1) % n];
    area += deg2rad(p2.lng - p1.lng) * (2 + Math.sin(deg2rad(p1.lat)) + Math.sin(deg2rad(p2.lat)));
  }
  return Math.abs((area * earthRadius * earthRadius) / 2);
};

const fetchAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } }
    );
    const data = await res.json();
    if (data?.address) {
      const a = data.address;
      return [
        a.state || a.province || '',
        a.city || a.town || a.municipality || '',
        a.county || a.district || '',
        a.suburb || a.township || a.village || '',
        a.road || a.neighbourhood || ''
      ]
        .filter(Boolean)
        .join('');
    }
  } catch (_) {
    // ignore
  }
  return '';
};

// ---------- 地块多边形渲染 ----------

function getPolygonStyle(id: CommonType.IdType, selected: boolean) {
  return selected
    ? { color: '#18a058', weight: 3, fillOpacity: 0.35, fillColor: '#52c41a' }
    : { color: '#3388ff', weight: 2, fillOpacity: 0.2, fillColor: '#3388ff' };
}

function createLabel(name: string, latlng: L.LatLng): L.Marker {
  const icon = L.divIcon({
    className: '',
    html: `<div class="farmland-map-label">${name}</div>`,
    iconAnchor: [0, 0]
  });
  return L.marker(latlng, { icon, interactive: false, zIndexOffset: 0 });
}

function renderFarmlands() {
  if (!map) return;

  // 移除旧层
  farmlandLayers.forEach(({ polygon, label }) => {
    polygon.remove();
    label.remove();
  });
  farmlandLayers.clear();

  props.farmlands.forEach(farmland => {
    if (!farmland.polygonPath) return;

    let coords: Array<[number, number]>;
    try {
      coords = JSON.parse(farmland.polygonPath);
    } catch (_) {
      return;
    }
    if (!coords || coords.length < 3) return;

    const latlngs = coords.map(c => L.latLng(c[0], c[1]));
    const selected = farmland.id === props.selectedId;
    const style = getPolygonStyle(farmland.id, selected);

    const polygon = L.polygon(latlngs, style).addTo(map!);
    const center = polygon.getBounds().getCenter();
    const label = createLabel(farmland.name, center).addTo(map!);

    polygon.on('click', () => {
      emit('select', farmland);
    });

    farmlandLayers.set(farmland.id, { polygon, label });
  });
}

function updateSelection() {
  farmlandLayers.forEach(({ polygon }, id) => {
    const selected = id === props.selectedId;
    polygon.setStyle(getPolygonStyle(id, selected));
    if (selected) {
      const bounds = polygon.getBounds();
      map?.fitBounds(bounds, { padding: [40, 40] });
    }
  });
}

// ---------- 绘制区域 ----------

const handlePolygonUpdate = async (layer: any) => {
  let latlngs = layer.getLatLngs();
  if (Array.isArray(latlngs) && Array.isArray(latlngs[0]) && !('lat' in latlngs[0])) {
    latlngs = latlngs[0];
  }
  const coordinates: Array<[number, number]> = latlngs.map((ll: L.LatLng) => [ll.lat, ll.lng]);
  const center = layer.getBounds().getCenter();
  const location = await fetchAddress(center.lat, center.lng);
  const area = calculateArea(latlngs);
  const areaSize = Number((area / 666.67).toFixed(2));
  emit('update:data', { coordinates, area, areaSize, location });
  isDrawing.value = false;
  emit('update:drawing', false);
  message.success(`已更新田块，面积约 ${areaSize} 亩`);
};

// ---------- 初始化 ----------

const initMap = () => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, {
    maxZoom: 22,
    minZoom: 3,
    attributionControl: false
  }).setView([28.415, 116.043], 13);

  // 天地图影像底图 (WMTS 球面墨卡托投影)
  L.tileLayer(
    `http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_TK}`,
    {
      maxNativeZoom: 18,
      maxZoom: 22,
      minZoom: 3,
      attribution: '© 天地图',
      errorTileUrl: ''
    }
  ).addTo(map);

  // 天地图影像注记 (中文地名标注)
  L.tileLayer(
    `http://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TIANDITU_TK}`,
    {
      maxNativeZoom: 18,
      maxZoom: 22,
      minZoom: 3,
      errorTileUrl: ''
    }
  ).addTo(map);

  // 绘制图层组
  drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // 绘制控件
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: false,
        metric: true,
        repeatMode: false,
        drawError: { color: '#e74c3c', message: '<strong>错误!</strong> 不能自相交!' },
        shapeOptions: { color: '#18a058', weight: 3, fillOpacity: 0.3 },
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
    edit: { featureGroup: drawnItems, remove: true }
  });

  // 默认不添加控件，由 drawMode 控制
  if (props.drawMode) {
    map.addControl(drawControl);
  }

  map.on(L.Draw.Event.CREATED, async (event: any) => {
    drawnItems?.clearLayers();
    drawnItems?.addLayer(event.layer);
    await handlePolygonUpdate(event.layer);
  });

  map.on(L.Draw.Event.EDITED, async (event: any) => {
    const layer = event.layers.getLayers()[0];
    if (layer) await handlePolygonUpdate(layer);
  });

  map.on(L.Draw.Event.DRAWSTART, () => {
    isDrawing.value = true;
    emit('update:drawing', true);
    vertexCount.value = 0;
  });

  map.on(L.Draw.Event.DRAWSTOP, () => {
    isDrawing.value = false;
    emit('update:drawing', false);
    vertexCount.value = 0;
  });

  map.on(L.Draw.Event.DRAWVERTEX, () => {
    vertexCount.value += 1;
  });

  map.on(L.Draw.Event.DELETED, () => {
    emit('update:data', { coordinates: [], area: 0, areaSize: 0, location: '' });
  });

  // 初次渲染地块
  renderFarmlands();
};

// ---------- 对外方法 ----------

function clearDrawn() {
  drawnItems?.clearLayers();
}

function setPolygon(coordinates: Array<[number, number]>) {
  if (!map || !drawnItems || coordinates.length < 3) return;
  drawnItems.clearLayers();
  const latlngs = coordinates.map(c => L.latLng(c[0], c[1]));
  const polygon = L.polygon(latlngs, { color: '#18a058', weight: 3, fillOpacity: 0.3 });
  drawnItems.addLayer(polygon);
  map.fitBounds(polygon.getBounds());
  handlePolygonUpdate(polygon);
}

function flyToSelected() {
  if (!props.selectedId) return;
  const entry = farmlandLayers.get(props.selectedId);
  if (entry) {
    map?.fitBounds(entry.polygon.getBounds(), { padding: [40, 40] });
  }
}

/** 刷新地图尺寸（用于容器尺寸变化时） */
function invalidateSize() {
  map?.invalidateSize();
}

defineExpose({ clearDrawn, setPolygon, invalidateSize });

// ---------- 监听 ----------

watch(() => props.farmlands, renderFarmlands, { deep: true });

watch(
  () => props.selectedId,
  () => updateSelection()
);

watch(
  () => props.drawMode,
  val => {
    if (!map || !drawControl) return;
    if (val) {
      map.addControl(drawControl);
    } else {
      map.removeControl(drawControl);
      drawnItems?.clearLayers();
    }
  }
);

onMounted(() => {
  setTimeout(() => {
    initMap();
  }, 100);
});

onUnmounted(() => {
  map?.remove();
  map = null;
});
</script>

<template>
  <div class="map-wrapper relative h-full min-w-0 flex-1 overflow-hidden rounded-8px shadow-md">
    <div ref="mapContainer" class="map-container z-0 h-full w-full" />
    <div
      v-if="isDrawing"
      class="drawing-tip absolute left-1/2 top-16px z-1000 min-w-260px animate-pulse rounded-8px bg-green-600/95 px-24px py-12px text-center text-white shadow-lg -translate-x-1/2"
    >
      <div class="tip-text mb-4px text-13px font-500">点击地图添加顶点，双击完成绘制</div>
      <div class="tip-count text-15px text-yellow-300 font-700">已添加 {{ vertexCount }} 个顶点</div>
    </div>
  </div>
</template>

<style>
/* 地图地块标签（全局，因为 Leaflet 在 DOM 根处渲染） */
.farmland-map-label {
  background: rgba(24, 160, 88, 0.88);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transform: translateX(-50%);
  display: inline-block;
  pointer-events: none;
}

/* Leaflet Draw 工具提示 */
.leaflet-draw-tooltip {
  background: rgba(24, 160, 88, 0.9) !important;
  border: none !important;
  color: #fff !important;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
}

.leaflet-editing-icon {
  border-radius: 50% !important;
  border: 2px solid #18a058 !important;
  background: #fff !important;
}
</style>
