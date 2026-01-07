import type { HookFetchPlugin } from 'hook-fetch';
import hookFetch from 'hook-fetch';
import { sseTextDecoderPlugin } from 'hook-fetch/plugins';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';

interface BaseResponse {
  code: number;
  data: never;
  msg: string;
  rows: never;
}

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export const request = hookFetch.create<BaseResponse, 'data' | 'rows'>({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  plugins: [
    sseTextDecoderPlugin({
      prefix: 'data:', // 移除 "data: " 前缀
      splitSeparator: '\n\n', // 事件分隔符
      lineSeparator: '\n', // 行分隔符
      trim: true, // 去除首尾空白
      doneSymbol: '[DONE]' // 结束标记
    })
  ]
});

function jwtPlugin(): HookFetchPlugin<BaseResponse> {
  // set token
  const token = localStg.get('token');
  return {
    name: 'jwt',
    beforeRequest: async config => {
      config.headers = new Headers(config.headers);
      config.headers.set('authorization', `Bearer ${token}`);
      return config;
    },
    afterResponse: async response => {
      // console.log(response);
      if (response.result?.code === 200) {
        return response;
      }

      console.log(response.result?.msg);

      return Promise.reject(response);
    }
  };
}

request.use(jwtPlugin());

export const post = request.post;

export const get = request.get;

export const put = request.put;

export const del = request.delete;

export default request;
