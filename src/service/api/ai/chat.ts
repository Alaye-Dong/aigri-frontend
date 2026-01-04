import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';

/**
 * Initiates a streaming chat request to the AI backend.
 *
 * @param query The user's message/query.
 * @param onChunk Callback function to handle incoming text chunks.
 *                Receives the text chunk and a boolean indicating if the stream is complete.
 * @param onError Callback function to handle errors.
 * @returns AbortController to cancel the request if needed.
 */
async function processChatStream(
  query: string,
  signal: AbortSignal,
  onChunk: (text: string, isDone?: boolean) => void
) {
  const token = localStg.get('token');
  const isHttpProxy = import.meta.env.DEV;
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  const url = new URL(`${baseURL}/ai/chat`, window.location.origin);
  url.searchParams.append('query', query);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream'
    },
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to read response body');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let emptyLineCount = 0;

  while (true) {
    const { done, value } = await reader.read();

    console.log('Reader done:', done, 'value length:', value?.length); // Debug

    if (done) {
      console.log('Stream ended by reader.done');
      onChunk('', true);
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '') {
        emptyLineCount++;
        console.log('Empty line count:', emptyLineCount); // Debug
        // SSE standard: single empty line = message separator, two empty lines = stream end
        if (emptyLineCount >= 2) {
          console.log('Stream ended by double empty lines');
          onChunk('', true);
          return;
        }
      } else {
        emptyLineCount = 0;
        if (line.startsWith('data:')) {
          const content = line.substring(5);

          // Check for explicit stream end marker
          if (content === '[DONE]') {
            console.log('Stream ended by [DONE] marker');
            onChunk('', true);
            return;
          }

          onChunk(content, false);
        }
      }
    }
  }
}

/**
 * Initiates a streaming chat request to the AI backend.
 *
 * @param query The user's message/query.
 * @param onChunk Callback function to handle incoming text chunks.
 *                Receives the text chunk and a boolean indicating if the stream is complete.
 * @param onError Callback function to handle errors.
 * @returns AbortController to cancel the request if needed.
 */
export function streamAIChat(
  query: string,
  onChunk: (text: string, isDone?: boolean) => void,
  onError: (error: any) => void
) {
  const controller = new AbortController();

  processChatStream(query, controller.signal, onChunk).catch((error: any) => {
    if (error.name === 'AbortError') {
      return;
    }
    console.error('API Error:', error);
    onError(error);
  });

  return controller;
}
