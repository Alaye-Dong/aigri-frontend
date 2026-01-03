import { localStg } from '@/utils/storage';

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

  (async () => {
    try {
      const token = localStg.get('token');
      // Construct URL with query parameter
      const baseUrl = import.meta.env.VITE_SERVICE_BASE_URL || '';
      const url = new URL(`${baseUrl}/ai/chat`);
      url.searchParams.append('query', query);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream' // Important for SSE
        },
        signal: controller.signal
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

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream complete
          onChunk('', true);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Split buffer into lines
        const lines = buffer.split('\n');
        // The last line might be incomplete, so we save it back to buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Check for data line
          if (line.startsWith('data:')) {
            // Extract content after "data:"
            // We use substring(5) to remove "data:"
            // We don't trim() immediately to preserve potential starting spaces in content
            // but typical SSE sends "data: content", so a space might be there.
            // valid formats: "data:content", "data: content"
            // If the content is "你好", line is "data:你好". substring is "你好".
            const content = line.substring(5);
            onChunk(content, false);
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request aborted, ignore
        return;
      }
      console.error('API Error:', error);
      onError(error);
    }
  })();

  return controller;
}
