<script setup lang="ts">
import { ref } from 'vue';
import { EditorSender } from 'vue-element-plus-x';

const senderValue = ref('');
function handleSubmit() {}
</script>

<template>
  <div>
    <EditorSender v-model="senderValue" @submit="handleSubmit" />
  </div>
</template>

<style scoped></style>
