<template>
  <div v-if="show" class="loading-spinner">
    <div class="spinner" role="status">
      <span class="sr-only">加载中...</span>
    </div>
    <p class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  text: { type: String, default: '加载中...' }
})
</script>

<style scoped>
.loading-spinner {
  text-align: center;
  padding: 3rem 0;
}

.loading-spinner .spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--border-primary);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin: 0 auto;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.loading-text {
  margin-top: 0.5rem;
  color: var(--text-secondary);
  font-size: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
