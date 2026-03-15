<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { fetchUploadFarmingLogImage } from '@/service/api';
import { localStg } from '@/utils/storage';

/** 获取静态资源代理路径 */
function getStaticProxyPath(): string {
  return '/proxy-static';
}

/** 获取静态资源基础URL（生产环境使用） */
function getStaticBaseUrl(): string {
  return import.meta.env.VITE_STATIC_BASE_URL || '';
}

/** 判断是否为生产模式 */
function isProduction(): boolean {
  return import.meta.env.PROD;
}

/** 获取完整的图片URL */
function getFullUrl(relativeUrl: string): string {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;

  // 生产环境使用配置的静态资源URL
  if (isProduction()) {
    const baseUrl = getStaticBaseUrl();
    return baseUrl ? `${baseUrl}${path}` : path;
  }

  // 开发环境使用代理路径
  return `${getStaticProxyPath()}${path}`;
}

interface Props {
  /** 图片URL列表，逗号分隔（存储的是相对路径） */
  value?: string | null;
  /** 最大图片数量 */
  maxCount?: number;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  maxCount: 9,
  disabled: false
});

interface Emits {
  (e: 'update:value', value: string | null): void;
}

const emit = defineEmits<Emits>();

/** 图片URL列表（存储的是相对路径） */
const imageUrls = ref<string[]>([]);

/** Blob URL映射（原始URL -> Blob URL） */
const blobUrlMap = ref<Map<string, string>>(new Map());

/** 上传文件列表 */
const fileList = ref<UploadFileInfo[]>([]);

/** 上传中的数量 */
const uploadingCount = ref(0);

/** 是否可以继续添加 */
const canAdd = computed(() => imageUrls.value.length < props.maxCount && !props.disabled);

/** 是否有正在上传的文件 */
const isUploading = computed(() => uploadingCount.value > 0);

// 支持的图片类型
const acceptTypes = '.jpg,.jpeg,.png,.gif,.webp';
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/** 通过认证获取图片Blob URL */
async function fetchImageWithAuth(url: string): Promise<string> {
  const fullUrl = getFullUrl(url);
  const token = localStg.get('token');

  const response = await fetch(fullUrl, {
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/** 加载图片并缓存Blob URL */
async function loadImage(url: string) {
  if (blobUrlMap.value.has(url)) return;

  try {
    const blobUrl = await fetchImageWithAuth(url);
    blobUrlMap.value.set(url, blobUrl);
  } catch (e) {
    console.error('Failed to load image:', url, e);
  }
}

/** 获取用于显示的URL（优先使用Blob URL） */
function getDisplayUrl(url: string): string {
  if (blobUrlMap.value.has(url)) {
    return blobUrlMap.value.get(url)!;
  }
  return getFullUrl(url);
}

/** 释放Blob URL */
function revokeBlobUrls() {
  blobUrlMap.value.forEach(blobUrl => {
    URL.revokeObjectURL(blobUrl);
  });
  blobUrlMap.value.clear();
}

// 监听 value 变化，同步图片列表并加载图片
watch(
  () => props.value,
  async newVal => {
    if (newVal) {
      imageUrls.value = newVal.split(',').filter(url => url.trim());
      // 加载所有图片
      for (const url of imageUrls.value) {
        await loadImage(url);
      }
    } else {
      imageUrls.value = [];
      revokeBlobUrls();
    }
  },
  { immediate: true }
);

// 监听图片列表变化，更新 value
watch(
  imageUrls,
  newVal => {
    const value = newVal.length > 0 ? newVal.join(',') : null;
    emit('update:value', value);
  },
  { deep: true }
);

/** 上传前校验 */
function beforeUpload({ file }: { file: UploadFileInfo }) {
  if (file.file && !allowedTypes.includes(file.file.type)) {
    window.$message?.error('仅支持 JPG、PNG、GIF、WEBP 格式的图片');
    return false;
  }

  if (file.file && file.file.size > 10 * 1024 * 1024) {
    window.$message?.error('图片大小不能超过 10MB');
    return false;
  }

  if (imageUrls.value.length >= props.maxCount) {
    window.$message?.error(`最多上传 ${props.maxCount} 张图片`);
    return false;
  }

  uploadingCount.value++;
  return true;
}

/** 自定义上传 */
async function customRequest({
  file,
  onFinish,
  onError
}: {
  file: UploadFileInfo;
  onFinish: () => void;
  onError: () => void;
}) {
  if (!file.file) {
    onError();
    uploadingCount.value--;
    return;
  }

  const { error, data } = await fetchUploadFarmingLogImage(file.file);

  uploadingCount.value--;

  if (error) {
    window.$message?.error('上传失败');
    onError();
    return;
  }

  // 添加到图片列表并加载图片
  imageUrls.value = [...imageUrls.value, data.url];
  await loadImage(data.url);
  onFinish();
}

/** 删除图片 */
function handleRemove(index: number) {
  const url = imageUrls.value[index];
  // 释放对应的Blob URL
  if (blobUrlMap.value.has(url)) {
    URL.revokeObjectURL(blobUrlMap.value.get(url)!);
    blobUrlMap.value.delete(url);
  }
  imageUrls.value = imageUrls.value.filter((_, i) => i !== index);
}

/** 预览图片 */
async function handlePreview(url: string) {
  try {
    let blobUrl = blobUrlMap.value.get(url);
    if (!blobUrl) {
      blobUrl = await fetchImageWithAuth(url);
    }
    window.open(blobUrl, '_blank');
  } catch {
    window.$message?.error('无法预览图片');
  }
}

// 组件销毁时释放Blob URL
onUnmounted(() => {
  revokeBlobUrls();
});
</script>

<template>
  <div class="image-upload">
    <!-- 已上传图片列表 -->
    <div v-if="imageUrls.length > 0" class="image-list">
      <div v-for="url in imageUrls" :key="url" class="image-item">
        <NImage
          :src="getDisplayUrl(url)"
          object-fit="cover"
          width="80"
          height="80"
          preview-disabled
          class="image-preview"
        />
        <div class="image-actions">
          <NButton size="tiny" quaternary @click="handlePreview(url)">
            <template #icon>
              <icon-mdi-eye />
            </template>
          </NButton>
          <NButton v-if="!disabled" size="tiny" quaternary type="error" @click="handleRemove(imageUrls.indexOf(url))">
            <template #icon>
              <icon-mdi-delete />
            </template>
          </NButton>
        </div>
      </div>
    </div>

    <!-- 上传按钮 -->
    <NUpload
      v-if="canAdd"
      v-model:file-list="fileList"
      :accept="acceptTypes"
      :show-file-list="false"
      :custom-request="customRequest"
      :disabled="disabled || isUploading"
      @before-upload="beforeUpload"
    >
      <NButton :disabled="disabled || isUploading" :loading="isUploading">
        <template #icon>
          <icon-mdi-cloud-upload />
        </template>
        {{ isUploading ? '上传中...' : '选择图片' }}
      </NButton>
    </NUpload>

    <!-- 提示信息 -->
    <div class="upload-tip">
      <NText depth="3">支持 JPG、PNG、GIF、WEBP 格式，单张最大 10MB，最多 {{ maxCount }} 张</NText>
    </div>
  </div>
</template>

<style scoped>
.image-upload {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.image-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.image-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0 0 0 4px;
}

.upload-tip {
  margin-top: 8px;
}
</style>
