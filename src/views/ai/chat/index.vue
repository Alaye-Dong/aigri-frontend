<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue';
import { NCard, NScrollbar, NSpin } from 'naive-ui';
import { EditorSender, XMarkdown } from 'vue-element-plus-x';
import { streamAIChat } from '@/service/api/ai/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

const messageList = ref<Message[]>([]);
const senderValue = ref('');
const loading = ref(false);
const scrollbarRef = ref<InstanceType<typeof NScrollbar> | null>(null);
let abortController: AbortController | null = null;

const senderRef = ref();

const scrollToBottom = async () => {
  await nextTick();
  if (scrollbarRef.value) {
    scrollbarRef.value.scrollTo({ top: 100000, behavior: 'smooth' });
  }
};

const handleSend = async (payload?: { text?: string; value?: string }) => {
  const text = payload?.text || payload?.value || senderValue.value;

  if (!text || !text.trim()) return;
  if (loading.value) return;

  const userQuery = text.trim();

  senderRef.value.clear();

  messageList.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: userQuery
  });

  await scrollToBottom();

  const aiMessageId = (Date.now() + 1).toString();
  messageList.value.push({
    id: aiMessageId,
    role: 'assistant',
    content: '',
    loading: true
  });

  loading.value = true;
  await scrollToBottom();

  abortController = streamAIChat(
    userQuery,
    (chunk, isDone) => {
      const msgIndex = messageList.value.findIndex(m => m.id === aiMessageId);
      if (msgIndex !== -1) {
        if (chunk) {
          messageList.value[msgIndex].content += chunk;
        }
        if (isDone) {
          messageList.value[msgIndex].loading = false;
          loading.value = false;
          abortController = null;
        }
        scrollToBottom();
      }
    },
    error => {
      window.$message?.error(`Failed to get response: ${error.message}`);
      const msgIndex = messageList.value.findIndex(m => m.id === aiMessageId);
      if (msgIndex !== -1) {
        messageList.value[msgIndex].loading = false;
        messageList.value[msgIndex].content += '\n\n*(Error: Connection terminated)*';
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
</script>

<template>
  <div class="h-full flex flex-col gap-4 overflow-hidden p-4">
    <NCard class="chat-card flex flex-col flex-1 overflow-hidden">
      <!-- Chat Area -->
      <div class="relative flex-1 overflow-hidden">
        <NScrollbar ref="scrollbarRef" class="p-4">
          <div class="flex flex-col gap-6">
            <div
              v-for="msg in messageList"
              :key="msg.id"
              class="w-full flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-lg p-3 text-sm leading-relaxed"
                :class="[
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                ]"
              >
                <XMarkdown v-if="msg.content" :markdown="msg.content" />
                <div v-if="msg.loading && !msg.content" class="h-6 flex items-center gap-1">
                  <NSpin size="small" />
                  <span class="text-xs opacity-60">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        </NScrollbar>
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

:deep(.x-markdown) {
  background: transparent;
  font-size: inherit;
  color: inherit;
}
.bg-primary :deep(.x-markdown) {
  color: white;
}
.bg-primary :deep(.x-markdown code) {
  color: #333;
}
</style>
