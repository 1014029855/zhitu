<template>
  <LearningTopNav v-if="!route.meta.hideShell && route.meta.requiresAuth" />
  <main :class="['app-main', { 'app-main--full': route.meta.hideShell }]">
    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
  </main>
  <ToastMessage />
</template>

<script setup>
import { useRoute } from 'vue-router'
import LearningTopNav from './components/course/LearningTopNav.vue'
import ToastMessage from './components/ToastMessage.vue'

const route = useRoute()
</script>

<style>
/* Global page transition */
.page-enter-active { transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1); }
.page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.page-enter-from { opacity: 0; transform: translateY(12px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }
</style>

<style scoped>
.app-main {
  min-height: 100vh;
  margin-left: 0;
  background: var(--bg-primary);
}
.app-main--full {
  margin-left: 0;
  background: var(--bg-secondary);
}
</style>
