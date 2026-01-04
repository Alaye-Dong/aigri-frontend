<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue';
import type { NScrollbar } from 'naive-ui';
import { NCard, NSpin } from 'naive-ui';
import { Bubble, BubbleList, EditorSender, XMarkdown } from 'vue-element-plus-x';
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList';
import type { BubbleProps } from 'vue-element-plus-x/types/Bubble';
import { streamAIChat } from '@/service/api/ai/chat';

type MessageItem = BubbleProps & {
  id: number;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
};

const senderValue = ref('');
const loading = ref(false);

let abortController: AbortController | null = null;

const senderRef = ref();
const bubbleListRef = ref();
const bubbleItems = ref<MessageItem[]>([]);

const handleSend = async (payload?: { text?: string; value?: string }) => {
  const text = payload?.text || payload?.value || senderValue.value;

  if (!text || !text.trim()) return;
  if (loading.value) return;

  // Add user message
  addMessage(text, true);

  const userQuery = text.trim();

  senderRef.value.clear();
  bubbleListRef.value.scrollToBottom();

  // Create AI message with proper properties
  const aiMessageId = Date.now() + 1;
  const aiMessage: MessageItem = {
    id: aiMessageId,
    role: 'ai',
    placement: 'start',
    isMarkdown: true,
    loading: true,
    content: '',
    noStyle: true
  };
  bubbleItems.value.push(aiMessage);

  loading.value = true;
  bubbleListRef.value.scrollToBottom();

  abortController = streamAIChat(
    userQuery,
    (chunk, isDone) => {
      console.log('Received chunk:', chunk, 'isDone:', isDone); // Debug log
      const msgIndex = bubbleItems.value.findIndex(m => m.id === aiMessageId);
      if (msgIndex !== -1) {
        if (chunk) {
          // Force reactivity by replacing the entire object
          const currentMsg = bubbleItems.value[msgIndex];
          bubbleItems.value.splice(msgIndex, 1, {
            ...currentMsg,
            content: currentMsg.content + chunk
          });
        }
        if (isDone) {
          const currentMsg = bubbleItems.value[msgIndex];
          bubbleItems.value.splice(msgIndex, 1, {
            ...currentMsg,
            loading: false
          });
          loading.value = false;
          abortController = null;
        }
        bubbleListRef.value.scrollToBottom();
      }
    },
    error => {
      window.$message?.error(`Failed to get response: ${error.message}`);
      const msgIndex = bubbleItems.value.findIndex(m => m.id === aiMessageId);
      if (msgIndex !== -1) {
        const currentMsg = bubbleItems.value[msgIndex];
        bubbleItems.value.splice(msgIndex, 1, {
          ...currentMsg,
          loading: false,
          content: currentMsg.content + '\n\n*(Error: Connection terminated)*'
        });
      }
      loading.value = false;
      abortController = null;
    }
  );
};

onUnmounted(() => {
  if (abortController) {
    abortController.abort();
  }
});

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
}
</script>

<template>
  <div class="h-full flex flex-col gap-4 overflow-hidden p-4">
    <NCard class="chat-card flex flex-col flex-1 overflow-hidden">
      <!-- Chat Area -->
      <div class="relative flex-1 overflow-hidden">
        <BubbleList ref="bubbleListRef" :list="bubbleItems" class="p-4">
          <template #content="{ item }">
            <!-- ai 内容走 markdown -->
            <XMarkdown v-if="item.content && item.role === 'ai'" :markdown="item.content" />
            <!-- user 内容 纯文本 -->
            <div v-if="item.content && item.role === 'user'">
              {{ item.content }}
            </div>
          </template>
        </BubbleList>
      </div>

      <!-- Input Area -->
      <div class="border-t border-gray-100 p-4 dark:border-gray-700">
        <EditorSender
          ref="senderRef"
          v-model="senderValue"
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
