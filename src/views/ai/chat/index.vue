<script setup lang="ts">
import { send } from 'vite';
import { nextTick, onUnmounted, ref } from 'vue';
import type { NScrollbar } from 'naive-ui';
import { NCard, NSpin } from 'naive-ui';
import { Bubble, BubbleList, EditorSender, Typewriter, XMarkdown } from 'vue-element-plus-x';
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList';
import type { BubbleProps } from 'vue-element-plus-x/types/Bubble';
import { hookFetchChatStream } from '@/service/api/ai/chat';

type MessageItem = BubbleProps & {
  id: number;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
};

const loading = ref(false);

const senderRef = ref();
const bubbleListRef = ref();
const bubbleItems = ref<MessageItem[]>([]);

async function handleSend() {
  // senderValue.value = '';
  // senderRef.value.clear();
  // Add user message
  const senderTextValue = senderRef.value.getCurrentValue().text;
  if (!senderTextValue) return;

  addMessage(senderTextValue, true);

  // Add AI message placeholder and get reference
  const aiMessage = addMessage('', false);

  loading.value = true;
  bubbleListRef.value.scrollToBottom();

  try {
    for await (const chunk of hookFetchChatStream(senderTextValue).stream()) {
      let result = chunk.result || '';
      console.log('Parsed SSE data:', result);

      // 类型守卫，确保 result 是字符串
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

      aiMessage.content += typeof result === 'string' ? result : JSON.stringify(result);
      bubbleListRef.value.scrollToBottom();
    }
  } catch (error) {
    console.error('Chat stream error:', error);
    aiMessage.content += '\n[Network Error]';
  } finally {
    loading.value = false;
    aiMessage.loading = false;
  }
}

// 添加消息 - 维护聊天记录
function addMessage(message: string, isUser: boolean) {
  const i = bubbleItems.value.length;
  const obj: MessageItem = {
    id: i,
    role: isUser ? 'user' : 'ai',
    placement: isUser ? 'end' : 'start',
    isMarkdown: !isUser,
    loading: !isUser,
    content: message || '',
    noStyle: !isUser
  };
  bubbleItems.value.push(obj);
  return obj;
}
</script>

<template>
  <div class="h-full flex flex-col gap-4 overflow-hidden p-4">
    <NCard class="chat-card flex flex-col flex-1 overflow-hidden">
      <!-- Chat Area -->
      <BubbleList ref="bubbleListRef" :list="bubbleItems" class="p-4">
        <template #content="{ item }">
          <!-- ai 内容走 markdown -->
          <Typewriter
            v-if="item.content && item.role === 'ai'"
            :content="item.content"
            typing
            :is-markdown="true"
            class="markdown-body"
            :themes="{ light: 'github-light', dark: 'github-dark' }"
            default-theme-mode="light"
          />
          <pre v-if="item.content && item.role === 'ai'">{{ item.content }}</pre>
          <XMarkdown v-if="item.content && item.role === 'ai'" :markdown="item.content" />
          <!-- user 内容 纯文本 -->
          <div v-if="item.content && item.role === 'user'">
            {{ item.content }}
          </div>
        </template>
      </BubbleList>

      <!-- Input Area -->
      <div class="border-t border-gray-100 p-4 dark:border-gray-700">
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
