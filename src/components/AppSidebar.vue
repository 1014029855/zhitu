<template>
  <aside class="sidebar">
    <!-- Logo -->
    <router-link to="/" class="sidebar__brand">
      <span class="sidebar__logo">知</span>
    </router-link>

    <!-- Nav -->
    <nav class="sidebar__nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': isActive(item.path) }"
      >
        <component :is="item.icon" :size="22" :stroke-width="1.8" />
        <span class="sidebar__label">{{ item.label }}</span>
        <span v-if="item.badge" class="sidebar__badge">{{ item.badge }}</span>
      </router-link>
    </nav>

    <!-- Footer -->
    <div class="sidebar__bottom">
      <template v-if="auth.isLoggedIn.value">
        <router-link to="/user" class="sidebar__item" :class="{ 'sidebar__item--active': isActive('/user') }">
          <User :size="22" :stroke-width="1.8" />
          <span class="sidebar__label">{{ auth.user.value?.realName || auth.user.value?.username }}</span>
        </router-link>
        <button class="sidebar__item" @click="auth.logout()">
          <LogOut :size="22" :stroke-width="1.8" />
          <span class="sidebar__label">退出</span>
        </button>
      </template>
      <template v-else>
        <router-link to="/login" class="sidebar__item" :class="{ 'sidebar__item--active': isActive('/login') }">
          <LogIn :size="22" :stroke-width="1.8" />
          <span class="sidebar__label">登录</span>
        </router-link>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { BookOpen, Trophy, GraduationCap, FileText, User, LogIn, LogOut, Code2, BarChart3, MessageCircle } from 'lucide-vue-next'

const route = useRoute()
const auth = useAuth()

const navItems = [
  { label: '工作台', path: '/', icon: BookOpen },
  { label: '竞赛', path: '/competition', icon: Trophy },
  { label: '课程', path: '/skills', icon: GraduationCap },
  { label: '刷题', path: '/exercises', icon: Code2 },
  { label: '排行', path: '/leaderboard', icon: BarChart3 },
  { label: '论文', path: '/papers', icon: FileText },
  { label: 'AI 助手', path: '/ai', icon: MessageCircle },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar {
  position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;
  display: flex; flex-direction: column;
  width: var(--sidebar-width);
  background: var(--bg-white);
  border-right: 1px solid var(--border-light);
  overflow: hidden;
}

.sidebar__brand {
  display: flex; align-items: center; justify-content: center;
  height: 68px; flex-shrink: 0;
  transition: transform 0.2s ease;
}
.sidebar__brand:hover { transform: scale(1.08); }

.sidebar__logo {
  font-family: var(--font-display);
  font-size: 32px; color: var(--text-primary); line-height: 1;
}

.sidebar__nav {
  flex: 1; display: flex; flex-direction: column;
  padding: 8px; gap: 2px; overflow-y: auto; scrollbar-width: none;
}

.sidebar__bottom {
  padding: 8px; border-top: 1px solid var(--border-light);
  display: flex; flex-direction: column; gap: 2px;
}

.sidebar__item {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; height: 64px; padding: 8px;
  border-radius: var(--radius-xl);
  color: var(--text-secondary);
  transition: all 0.18s ease;
}

.sidebar__item:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.sidebar__item--active {
  color: #5a8a32;
  background: var(--brand-green-light);
}

.sidebar__label {
  font-size: 11px; font-weight: 500; line-height: 1;
  text-align: center; white-space: nowrap;
}

.sidebar__badge {
  position: absolute; top: 6px; right: 10px;
  font-size: 10px; font-weight: 700; color: #5a8a32;
}
</style>
