<script setup lang="ts">
import { ref } from 'vue';
import { NCard } from 'naive-ui';
import { Bubble, BubbleList, EditorSender } from 'vue-element-plus-x';
import type { BubbleProps } from 'vue-element-plus-x/types/Bubble';
import { hookFetchChatStream } from '@/service/api/ai/chat';

type MessageItem = BubbleProps & {
  key: number;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
};

const loading = ref(false);

const senderRef = ref();
const bubbleListRef = ref();
const bubbleItems = ref<MessageItem[]>([]);

async function handleSend() {
  const senderTextValue = senderRef.value.getCurrentValue().text;
  if (!senderTextValue) return;

  senderRef.value.clear();

  addMessage(senderTextValue, true);

  const aiMessage = addMessage('', false);

  loading.value = true;
  bubbleListRef.value.scrollToBottom();

  try {
    for await (const chunk of hookFetchChatStream(senderTextValue).stream()) {
      let result = chunk.result || '';
      // console.log('Parsed SSE data:', result);

      // 确保 result 是字符串
      if (typeof result === 'string' && result.startsWith('data:')) {
        result = result.slice(5);
      }

      if (typeof result === 'string' && result.trim() === '') {
        result = '\n';
      }

      // // Check for done signal
      if (typeof result === 'string' && result.trim() === '[DONE]') {
        break;
      }
      const text = typeof result === 'string' ? result : JSON.stringify(result);

      aiMessage.content += text;
      aiMessage.loading = false;
    }
    bubbleListRef.value.scrollToBottom();
  } catch (error) {
    aiMessage.content += '\n[Network Error]';
  } finally {
    loading.value = false;
  }
}

// 添加消息 - 维护聊天记录
function addMessage(message: string, isUser: boolean) {
  const i = bubbleItems.value.length;
  const obj: MessageItem = {
    key: i,
    role: isUser ? 'user' : 'ai',
    placement: isUser ? 'end' : 'start',
    isMarkdown: !isUser,
    loading: !isUser,
    content: message || '',
    noStyle: !isUser
  };
  bubbleItems.value.push(obj);
  return bubbleItems.value[bubbleItems.value.length - 1];
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <NCard class="chat-card flex flex-col flex-1 overflow-hidden">
      <!-- Chat Area -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <BubbleList ref="bubbleListRef" :list="bubbleItems" class="p-4">
          <template #content="{ item }">
            <!-- ai 内容格式调试 -->
            <pre v-if="item.content && item.role === 'ai'">{{ item.content }}</pre>
            <!-- ai 内容 markdown -->
            <Bubble v-if="item.content && item.role === 'ai'" :content="item.content" is-markdown></Bubble>
            <!-- user 内容 纯文本 -->
            <div v-if="item.content && item.role === 'user'">
              {{ item.content }}
            </div>
          </template>
        </BubbleList>
      </div>

      <!-- Input Area -->
      <div class="flex-shrink-0 border-t border-gray-100 p-4 dark:border-gray-700">
        <EditorSender
          ref="senderRef"
          :loading="loading"
          :disabled="loading"
          placeholder="有什么我能帮您的吗？🍀"
          @submit="handleSend"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.chat-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}
</style>
