<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { NCard } from 'naive-ui';
import { Bubble, BubbleList, EditorSender, Prompts, Welcome } from 'vue-element-plus-x';
import type { BubbleProps } from 'vue-element-plus-x/types/Bubble';
import type { PromptsItemsProps } from 'vue-element-plus-x/types/Prompts';
import { hookFetchChatStream } from '@/service/api/ai/chat';

type MessageItem = BubbleProps & {
  key: number;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
};

// Prompt suggestions for agriculture
const promptItems: PromptsItemsProps[] = [
  { key: '1', label: '如何提高水稻产量？', description: '种植技巧' },
  { key: '2', label: '现在的天气适合种植什么？', description: '气象建议' },
  { key: '3', label: '土壤酸碱度如何调节？', description: '土壤管理' },
  { key: '4', label: '常见的病虫害防治方法', description: '病虫害防治' }
];

const loading = ref(false);

const senderRef = ref();
const bubbleListRef = ref();
const bubbleItems = ref<MessageItem[]>([]);

// Add message to chat - maintains conversation history
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

async function handleSend() {
  const senderTextValue = senderRef.value?.getCurrentValue?.()?.text;
  if (!senderTextValue) return;

  senderRef.value.clear();

  addMessage(senderTextValue, true);

  const aiMessage = addMessage('', false);

  loading.value = true;

  // Wait for DOM to update (BubbleList needs to render first)
  await nextTick();
  bubbleListRef.value?.scrollToBottom();

  try {
    for await (const chunk of hookFetchChatStream(senderTextValue).stream()) {
      let result = chunk.result || '';

      // Ensure result is string
      if (typeof result === 'string' && result.startsWith('data:')) {
        result = result.slice(5);
      }

      if (typeof result === 'string' && result.trim() === '') {
        result = '\n';
      }

      // Check for done signal
      if (typeof result === 'string' && result.trim() === '[DONE]') {
        break;
      }
      const text = typeof result === 'string' ? result : JSON.stringify(result);

      aiMessage.content += text;
      aiMessage.loading = false;
    }
    bubbleListRef.value?.scrollToBottom();
  } catch (error) {
    aiMessage.content += '\n[Network Error]';
  } finally {
    loading.value = false;
  }
}

function handlePromptClick(item: PromptsItemsProps) {
  if (item.label) {
    senderRef.value.setText(item.label);
    senderRef.value.submit();
  }
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <NCard class="chat-card flex flex-col flex-1 overflow-hidden">
      <!-- Empty State: Welcome & Prompts -->
      <div v-if="bubbleItems.length === 0" class="flex flex-col flex-1 items-center justify-center px-4 py-8">
        <Welcome
          title="你好，我是农业AI助手 🌱"
          description="我可以帮助您解答种植、病虫害防治、气象等问题"
          class="mb-8"
        />
        <Prompts title="您可以尝试问我：" :items="promptItems" wrap @item-click="handlePromptClick" />
      </div>

      <!-- Chat Area -->
      <div v-else class="min-h-0 flex-1 overflow-y-auto">
        <BubbleList ref="bubbleListRef" :list="bubbleItems" class="p-4">
          <template #content="{ item }">
            <!-- AI content markdown -->
            <Bubble v-if="item.content && item.role === 'ai'" :content="item.content"></Bubble>
            <!-- User content plain text -->
            <div v-if="item.content && item.role === 'user'">
              {{ item.content }}
            </div>
          </template>
        </BubbleList>
      </div>

      <!-- Input Area -->
      <div class="flex-shrink-0 border-t border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
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
