<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="toast" :class="`toast--${type}`">
        <span class="toast__msg">{{ message }}</span>
        <button class="toast__close" @click="visible = false">&times;</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRequest } from '../composables/useRequest'

const { toastMessage, toastType } = useRequest()
const visible = ref(false)
const message = ref('')
const type = ref('info')

watch(toastMessage, (val) => {
  if (val) {
    message.value = val
    type.value = toastType.value
    visible.value = true
    setTimeout(() => { visible.value = false }, 4000)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.toast--info { background: var(--accent); color: #fff; }
.toast--success { background: #22c55e; color: #fff; }
.toast--error { background: var(--red); color: #fff; }

.toast__msg { flex: 1; }
.toast__close { color: inherit; opacity: 0.7; font-size: 18px; cursor: pointer; border: 0; background: none; }
.toast__close:hover { opacity: 1; }
</style>
