import { request } from '@/service/request';
import { getToken } from '@/store/modules/auth/shared';
import { getServiceBaseURL } from '@/utils/service';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

function getSSEBaseUrl(): string {
  if (isHttpProxy) {
    return `${window.location.origin}${baseURL}`;
  }
  return baseURL;
}

export function fetchUrgencyLevels() {
  return request<Api.Ai.UrgencyLevelItem[]>({
    url: '/ai/proactive-suggestion/urgency-levels',
    method: 'get'
  });
}

export function fetchGenerateSuggestion(farmlandId: number) {
  return request<Api.Ai.StructuredSuggestion>({
    url: '/ai/proactive-suggestion/generate',
    method: 'post',
    params: { farmlandId }
  });
}

export function fetchGenerateAndPushSuggestion(farmlandId: number) {
  return request<void>({
    url: '/ai/proactive-suggestion/generate-and-push',
    method: 'post',
    params: { farmlandId }
  });
}

export function fetchGetSuggestionPage(params: Api.Ai.SuggestionSearchParams) {
  return request<Api.Ai.SuggestionList>({
    url: '/ai/proactive-suggestion/page',
    method: 'get',
    params
  });
}

export function fetchGetSuggestionInfo(id: CommonType.IdType) {
  return request<Api.Ai.Suggestion>({
    url: `/ai/proactive-suggestion/${id}`,
    method: 'get'
  });
}

export function fetchMySuggestions() {
  return request<Api.Ai.Suggestion[]>({
    url: '/ai/proactive-suggestion/my',
    method: 'get'
  });
}

export function fetchUrgentSuggestions() {
  return request<Api.Ai.Suggestion[]>({
    url: '/ai/proactive-suggestion/urgent',
    method: 'get'
  });
}

export function fetchAdoptSuggestion(id: CommonType.IdType) {
  return request<void>({
    url: `/ai/proactive-suggestion/${id}/adopt`,
    method: 'put'
  });
}

export function fetchCleanupSuggestions(days: number = 30) {
  return request<number>({
    url: '/ai/proactive-suggestion/cleanup',
    method: 'delete',
    params: { days }
  });
}

export interface SSEStreamResult {
  status: 'connecting' | 'aggregating' | 'generating' | 'completed' | 'error';
  messages: string[];
  result: Api.Ai.StructuredSuggestion | null;
}

export type SSEMessageHandler = (data: SSEStreamResult) => void;

export interface SSEStreamOptions {
  onMessage: SSEMessageHandler;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

interface StreamContext {
  result: SSEStreamResult;
  onMessage: SSEMessageHandler;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

function parseSSELine(line: string): string | null {
  if (line.startsWith('data:')) {
    return line.slice(5).trim();
  }
  return null;
}

function handleSuggestionMessage(data: string, ctx: StreamContext): boolean {
  if (data === '[DONE]') {
    ctx.result.status = 'completed';
    ctx.onMessage(ctx.result);
    ctx.onComplete?.();
    return true;
  }

  if (data.startsWith('[RESULT]')) {
    const jsonData = data.replace('[RESULT]', '');
    try {
      ctx.result.result = JSON.parse(jsonData) as Api.Ai.StructuredSuggestion;
    } catch {
      /* empty */
    }
    ctx.onMessage(ctx.result);
    return false;
  }

  try {
    const parsed = JSON.parse(data);
    if (parsed.status) {
      ctx.result.status = parsed.status;
    }
    if (parsed.message) {
      ctx.result.messages.push(parsed.message);
    }
    if (parsed.error) {
      ctx.result.status = 'error';
      ctx.onError?.(parsed.error);
    }
  } catch {
    ctx.result.messages.push(data);
  }

  ctx.onMessage(ctx.result);
  return false;
}

interface ReadStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  ctx: StreamContext;
  handleMessage: (data: string, ctx: StreamContext) => boolean;
  signal: AbortSignal;
}

async function readStream(options: ReadStreamOptions): Promise<void> {
  const { reader, ctx, handleMessage, signal } = options;
  const decoder = new TextDecoder();
  let buffer = '';

  while (!signal.aborted) {
    // eslint-disable-next-line no-await-in-loop -- Streaming requires sequential async reads
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const data = parseSSELine(line);
      if (data === null) continue;
      if (data === '') continue;

      const shouldStop = handleMessage(data, ctx);
      if (shouldStop) return;
    }
  }
}

export function createSuggestionStream(farmlandId: number, options: SSEStreamOptions): () => void {
  const { onMessage, onError, onComplete } = options;
  const sseBaseUrl = getSSEBaseUrl();
  const token = getToken();
  const url = `${sseBaseUrl}/ai/proactive-suggestion/generate-stream?farmlandId=${farmlandId}`;

  const result: SSEStreamResult = {
    status: 'connecting',
    messages: [],
    result: null
  };

  const controller = new AbortController();

  async function processStream() {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        result.status = 'error';
        onError?.(`请求失败: ${response.status}`);
        onMessage(result);
        return;
      }

      result.status = 'aggregating';
      onMessage(result);

      const reader = response.body?.getReader();
      if (!reader) {
        result.status = 'error';
        onError?.('无法读取响应流');
        onMessage(result);
        return;
      }

      const ctx: StreamContext = { result, onMessage, onError, onComplete };
      await readStream({ reader, ctx, handleMessage: handleSuggestionMessage, signal: controller.signal });
    } catch (err) {
      if (controller.signal.aborted) return;
      result.status = 'error';
      onError?.(err instanceof Error ? err.message : '连接失败，请检查网络或重试');
      onMessage(result);
    }
  }

  processStream();

  return () => {
    controller.abort();
  };
}
