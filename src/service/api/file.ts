import { request } from '@/service/request';

/**
 * 上传农事日志图片
 *
 * @param file 图片文件
 */
export function fetchUploadFarmingLogImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<Api.File.UploadResult>({
    url: '/resource/file/uploadFarmingLogImage',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
