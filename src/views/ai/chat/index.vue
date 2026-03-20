<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { NCard, NButton, NSpin } from 'naive-ui';
import { Bubble, BubbleList, Conversations, EditorSender, Prompts, Welcome } from 'vue-element-plus-x';
import type { BubbleProps } from 'vue-element-plus-x/types/Bubble';
import type { PromptsItemsProps } from 'vue-element-plus-x/types/Prompts';
import type { ConversationItem } from 'vue-element-plus-x/types/Conversations';
import { fetchGetChatHistory, fetchClearChatHistory, hookFetchChatStream } from '@/service/api/ai/chat';

type MessageItem = BubbleProps & {
  key: number;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
};

const promptItems: PromptsItemsProps[] = [
  { key: '1', label: '如何提高水稻产量？', description: '种植技巧' },
  { key: '2', label: '现在的天气适合种植什么？', description: '气象建议' },
  { key: '3', label: '土壤酸碱度如何调节？', description: '土壤管理' },
  { key: '4', label: '常见的病虫害防治方法', description: '病虫害防治' }
];

const loading = ref(false);
const historyLoading = ref(false);
const showSidebar = ref(true);

const senderRef = ref();
const bubbleListRef = ref();
const bubbleItems = ref<MessageItem[]>([]);

const conversationItems = ref<ConversationItem[]>([]);
const activeKey = ref('default');

async function loadHistory() {
  historyLoading.value = true;
  try {
    const { data, error } = await fetchGetChatHistory({ current: 1, size: 100 });
    if (error || !data) return;

    const records = data.records || [];
    if (records.length > 0) {
      conversationItems.value = [{
        key: 'default',
        label: '对话历史',
        description: `${records.length} 条消息`
      }];

      const messages: MessageItem[] = [];
      let keyCounter = 0;
      records.reverse().forEach(record => {
        messages.push({
          key: keyCounter++,
          role: 'user',
          placement: 'end',
          isMarkdown: false,
          content: record.question,
          noStyle: false
        });
        messages.push({
          key: keyCounter++,
          role: 'ai',
          placement: 'start',
          isMarkdown: true,
          content: record.answer,
          noStyle: true
        });
      });
      bubbleItems.value = messages;

      await nextTick();
      bubbleListRef.value?.scrollToBottom();
    }
  } finally {
    historyLoading.value = false;
  }
}

async function handleClearHistory() {
  const { error } = await fetchClearChatHistory();
  if (!error) {
    conversationItems.value = [];
    bubbleItems.value = [];
    window.$message?.success('历史记录已清空');
  }
}

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

  await nextTick();
  bubbleListRef.value?.scrollToBottom();

  try {
    for await (const chunk of hookFetchChatStream(senderTextValue).stream()) {
      let result = chunk.result || '';

      if (typeof result === 'string' && result.startsWith('data:')) {
        result = result.slice(5);
      }

      if (typeof result === 'string' && result.trim() === '') {
        result = '\n';
      }

      if (typeof result === 'string' && result.trim() === '[DONE]') {
        break;
      }
      const text = typeof result === 'string' ? result : JSON.stringify(result);

      aiMessage.content += text;
      aiMessage.loading = false;
    }
    bubbleListRef.value?.scrollToBottom();

    if (conversationItems.value.length === 0) {
      conversationItems.value = [{
        key: 'default',
        label: '对话历史',
        description: '1 条消息'
      }];
    } else {
      const count = Math.floor(bubbleItems.value.length / 2);
      conversationItems.value[0].description = `${count} 条消息`;
    }
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

onMounted(() => {
  loadHistory();
});
</script>

<template>
  <div class="h-full flex overflow-hidden">
    <!-- Sidebar: Chat History -->
    <div v-if="showSidebar"
      class="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700">
          <span class="text-sm font-medium">历史记录</span>
          <NButton v-if="conversationItems.length > 0" text type="error" size="small" @click="handleClearHistory">
            清空
          </NButton>
        </div>
        <NSpin :show="historyLoading" class="flex-1 overflow-hidden">
          <Conversations v-model:active="activeKey" :items="conversationItems" row-key="key" class="h-full" />
        </NSpin>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <div class="flex h-full flex-col overflow-hidden">
        <NCard class="chat-card flex flex-1 flex-col overflow-hidden">
          <!-- Empty State: Welcome & Prompts -->
          <div v-if="bubbleItems.length === 0" class="flex flex-1 flex-col items-center justify-center px-4 py-8">
            <Welcome title="你好，我是农业AI助手 🌱" description="我可以帮助您解答种植、病虫害防治、气象等问题" class="mb-8" />
            <Prompts title="您可以尝试问我：" :items="promptItems" wrap @item-click="handlePromptClick" />
          </div>

          <!-- Chat Area -->
          <div v-else class="min-h-0 flex-1 overflow-y-auto">
            <BubbleList ref="bubbleListRef" :list="bubbleItems" class="p-4">
              <template #content="{ item }">
                <Bubble v-if="item.content && item.role === 'ai'" :content="item.content"></Bubble>
                <div v-if="item.content && item.role === 'user'">
                  {{ item.content }}
                </div>
              </template>
            </BubbleList>
          </div>

          <!-- Input Area -->
          <div class="flex-shrink-0 border-t border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <EditorSender ref="senderRef" :loading="loading" :disabled="loading" placeholder="有什么我能帮您的吗？🍀"
              @submit="handleSend" />
          </div>
        </NCard>
      </div>
    </div>
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
