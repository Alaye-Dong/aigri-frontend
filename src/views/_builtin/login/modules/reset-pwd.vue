<script setup lang="ts">
import { useRouterPush } from '@/hooks/common/router';

defineOptions({
  name: 'ResetPwd'
});

const { toggleLoginModule } = useRouterPush();
</script>

<template>
  <NCard class="w-full" :bordered="false">
    <NSpace vertical :size="24" class="w-full">
      <div class="text-center">
        <NText depth="1" class="text-16px">
          {{ $t('page.login.resetPwd.contactAdmin') }}
        </NText>
      </div>
      <NButton type="primary" size="large" round block @click="toggleLoginModule('pwd-login')">
        {{ $t('page.login.common.back') }}
      </NButton>
    </NSpace>
  </NCard>
</template>

<style scoped></style>
