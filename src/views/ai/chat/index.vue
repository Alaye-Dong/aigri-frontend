<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { NCard, NButton, NCollapse, NCollapseItem, NEmpty, NSpin } from 'naive-ui';
import { Bubble, BubbleList, EditorSender, Prompts, Welcome } from 'vue-element-plus-x';
import type { BubbleProps } from 'vue-element-plus-x/types/Bubble';
import type { PromptsItemsProps } from 'vue-element-plus-x/types/Prompts';
import { fetchGetChatHistory, fetchClearChatHistory, hookFetchChatStream } from '@/service/api/ai/chat';

type MessageItem = BubbleProps & {
  key: number;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
};

type HistoryGroup = {
  label: string;
  items: { id: number; question: string; answer: string; createTime: string }[];
};

const promptItems: PromptsItemsProps[] = [
  { key: '1', label: '如何提高水稻产量？', description: '种植技巧' },
  { key: '2', label: '现在的天气适合种植什么？', description: '气象建议' },
  { key: '3', label: '土壤酸碱度如何调节？', description: '土壤管理' },
  { key: '4', label: '常见的病虫害防治方法', description: '病虫害防治' }
];

const loading = ref(false);
const historyLoading = ref(false);
const showHistoryPanel = ref(false);

const senderRef = ref();
const bubbleListRef = ref();
const bubbleItems = ref<MessageItem[]>([]);
const historyRecords = ref<Api.Ai.ChatHistory[]>([]);

const historyGroups = computed<HistoryGroup[]>(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { [key: string]: HistoryGroup['items'] } = {
    今天: [],
    昨天: [],
    更早: []
  };

  historyRecords.value.forEach(record => {
    const recordDate = new Date(record.createTime);
    recordDate.setHours(0, 0, 0, 0);

    if (recordDate.getTime() === today.getTime()) {
      groups['今天'].push(record);
    } else if (recordDate.getTime() === yesterday.getTime()) {
      groups['昨天'].push(record);
    } else {
      groups['更早'].push(record);
    }
  });

  const result: HistoryGroup[] = [];
  if (groups['今天'].length > 0) result.push({ label: '今天', items: groups['今天'] });
  if (groups['昨天'].length > 0) result.push({ label: '昨天', items: groups['昨天'] });
  if (groups['更早'].length > 0) result.push({ label: '更早', items: groups['更早'] });

  return result;
});

const historyCount = computed(() => historyRecords.value.length);

async function loadHistory() {
  historyLoading.value = true;
  try {
    const { data } = await fetchGetChatHistory({ current: 1, size: 100 });
    if (!data) return;

    historyRecords.value = data.records || [];

    if (historyRecords.value.length > 0) {
      const messages: MessageItem[] = [];
      let keyCounter = 0;

      [...historyRecords.value].reverse().forEach(record => {
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
    historyRecords.value = [];
    bubbleItems.value = [];
    window.$message?.success('历史记录已清空');
  }
}

function handleLoadHistoryItem(record: Api.Ai.ChatHistory) {
  bubbleItems.value = [
    {
      key: 0,
      role: 'user',
      placement: 'end',
      isMarkdown: false,
      content: record.question,
      noStyle: false
    },
    {
      key: 1,
      role: 'ai',
      placement: 'start',
      isMarkdown: true,
      content: record.answer,
      noStyle: true
    }
  ];
  showHistoryPanel.value = false;
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
  } catch {
    aiMessage.content += '\n[网络错误]';
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

function truncate(text: string, length: number) {
  return text.length > length ? text.slice(0, length) + '...' : text;
}

onMounted(() => {
  loadHistory();
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <NCard class="chat-card flex flex-1 flex-col overflow-hidden">
      <!-- History Panel (Collapsible) -->
      <div v-if="historyCount > 0 || historyLoading" class="border-b border-gray-100 dark:border-gray-700">
        <button
          class="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
          @click="showHistoryPanel = !showHistoryPanel"
        >
          <span class="flex items-center gap-2">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            历史记录 ({{ historyCount }})
          </span>
          <svg
            class="h-4 w-4 transition-transform"
            :class="{ 'rotate-180': showHistoryPanel }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div v-if="showHistoryPanel" class="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <NSpin :show="historyLoading" size="small">
            <div v-if="historyGroups.length === 0" class="p-4 text-center text-gray-400">暂无历史记录</div>

            <NCollapse v-else>
              <NCollapseItem v-for="group in historyGroups" :key="group.label" :name="group.label">
                <template #header>
                  <span class="text-xs font-medium text-gray-500">{{ group.label }}</span>
                </template>
                <div class="space-y-1">
                  <button
                    v-for="item in group.items"
                    :key="item.id"
                    class="w-full rounded px-3 py-2 text-left text-sm hover:bg-white dark:hover:bg-gray-700"
                    @click="handleLoadHistoryItem(item)"
                  >
                    <div class="truncate text-gray-700 dark:text-gray-200">{{ truncate(item.question, 40) }}</div>
                    <div class="mt-0.5 truncate text-xs text-gray-400">{{ truncate(item.answer, 60) }}</div>
                  </button>
                </div>
              </NCollapseItem>
            </NCollapse>
          </NSpin>

          <div v-if="historyCount > 0" class="border-t border-gray-100 p-2 dark:border-gray-700">
            <NButton text type="error" size="small" @click="handleClearHistory">清空全部历史</NButton>
          </div>
        </div>
      </div>

      <!-- Empty State: Welcome & Prompts -->
      <div v-if="bubbleItems.length === 0" class="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <NEmpty v-if="historyCount > 0" description="点击上方历史记录查看，或开始新对话" class="mb-4" />

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
            <Bubble v-if="item.content && item.role === 'ai'" :content="item.content"></Bubble>
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
