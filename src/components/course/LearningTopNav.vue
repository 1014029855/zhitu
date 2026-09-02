<template>
  <header class="learning-nav">
    <router-link to="/" class="learning-nav__brand">知途</router-link>
    <nav class="learning-nav__links" aria-label="主导航">
      <router-link v-for="item in navItems" :key="item.to" :to="item.to">{{ item.label }}</router-link>
    </nav>
    <form class="learning-nav__search" role="search" @submit.prevent="submitSearch">
      <input v-model.trim="search" type="search" placeholder="搜索课程、知识点、论文" aria-label="搜索课程、知识点、论文" />
      <button type="submit" title="搜索"><Search :size="16" /></button>
    </form>
    <router-link to="/ai" class="learning-nav__icon" title="AI 学习助手"><Bot :size="18" /></router-link>
    <button class="learning-nav__icon" type="button" title="暂无新通知" disabled><Bell :size="18" /></button>
    <div class="learning-nav__account">
      <button
        type="button"
        class="learning-nav__user"
        :aria-expanded="accountOpen"
        :title="user?.realName || user?.username || '个人中心'"
        @click="accountOpen = !accountOpen"
      >{{ userInitial }}</button>
      <Transition name="nav-menu">
        <div v-if="accountOpen" class="learning-nav__account-menu">
          <div><strong>{{ user?.realName || user?.username || '学习者' }}</strong><span>{{ roleLabel }}</span></div>
          <router-link to="/user"><UserRound :size="15" />个人中心</router-link>
          <router-link v-if="isStaff" to="/admin/courses"><Settings2 :size="15" />课程工作台</router-link>
          <button type="button" @click="logout"><LogOut :size="15" />退出登录</button>
        </div>
      </Transition>
    </div>
    <button class="learning-nav__mobile-toggle" type="button" :title="mobileOpen ? '关闭导航' : '打开导航'" @click="mobileOpen = !mobileOpen">
      <X v-if="mobileOpen" :size="20" /><Menu v-else :size="20" />
    </button>
    <Transition name="nav-menu">
      <div v-if="mobileOpen" class="learning-nav__mobile-panel">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to">{{ item.label }}</router-link>
        <router-link to="/ai">AI 学习助手</router-link>
        <router-link to="/user">个人中心</router-link>
        <router-link v-if="isStaff" to="/admin/courses">课程工作台</router-link>
        <button type="button" @click="logout">退出登录</button>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Bot, LogOut, Menu, Search, Settings2, UserRound, X } from 'lucide-vue-next'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const { user } = auth
const search = ref('')
const accountOpen = ref(false)
const mobileOpen = ref(false)
const userInitial = computed(() => (user.value?.realName || user.value?.username || '我').slice(0, 1))
const accountType = computed(() => user.value?.accountType || user.value?.account_type || 'student')
const isStaff = computed(() => ['admin', 'teacher'].includes(accountType.value))
const roleLabel = computed(() => ({ student: '学生', teacher: '教师', admin: '管理员' }[accountType.value] || '学习者'))
const navItems = [
  { label: '学习', to: '/' },
  { label: '课程', to: '/skills' },
  { label: '练习', to: '/exercises' },
  { label: '竞赛', to: '/competition' },
  { label: '论文', to: '/papers' },
  { label: '排行', to: '/leaderboard' }
]

function submitSearch() {
  router.push({ path: '/skills', query: search.value ? { q: search.value } : {} })
}

function logout() {
  accountOpen.value = false
  mobileOpen.value = false
  auth.logout()
}

watch(() => route.fullPath, () => {
  accountOpen.value = false
  mobileOpen.value = false
})
</script>

<style scoped>
.learning-nav { position: sticky; top: 0; z-index: 45; display: grid; grid-template-columns: auto minmax(470px, auto) minmax(190px, 1fr) 36px 36px 36px; align-items: center; gap: 20px; height: 60px; padding: 0 28px; border-bottom: 1px solid #dfe3df; background: rgba(255,255,255,.98); backdrop-filter: blur(8px); }
.learning-nav__brand { color: #151a16; font-family: var(--font-brand); font-size: 24px; font-weight: 800; line-height: 1; }
.learning-nav__links { display: flex; align-self: stretch; gap: 24px; }
.learning-nav__links a { position: relative; display: grid; place-items: center; color: #343a35; font-size: 12px; font-weight: 650; }
.learning-nav__links a::after { position: absolute; right: 0; bottom: 0; left: 0; height: 2px; transform: scaleX(0); background: #159447; content: ''; transition: transform 180ms; }
.learning-nav__links a.router-link-active { color: #0f7137; }
.learning-nav__links a.router-link-active::after { transform: scaleX(1); }
.learning-nav__search { justify-self: end; display: grid; grid-template-columns: minmax(0, 1fr) 34px; width: min(100%, 310px); height: 34px; border: 1px solid #d8dcd8; border-radius: 5px; background: #fbfcfb; }
.learning-nav__search input { min-width: 0; padding: 0 11px; border: 0; outline: 0; background: transparent; color: #2b302c; font: 11px var(--font-body); }
.learning-nav__search button, .learning-nav__icon { display: grid; place-items: center; border: 0; background: transparent; color: #687069; }
.learning-nav__search button { cursor: pointer; }
.learning-nav__search button:hover { color: #159447; }
.learning-nav__icon { width: 36px; height: 36px; }
.learning-nav__icon:hover { background: #f1f4f1; color: #159447; }
.learning-nav__account { position: relative; }
.learning-nav__user { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #cfd4cf; border-radius: 50%; background: #eff3ef; color: #2e3530; font-size: 11px; font-weight: 750; cursor: pointer; }
.learning-nav__account-menu { position: absolute; top: 43px; right: 0; display: grid; width: 210px; padding: 8px; border: 1px solid #d7dcd7; border-radius: 6px; background: #fff; box-shadow: 0 12px 30px rgba(20,27,21,.12); }
.learning-nav__account-menu > div { display: grid; gap: 3px; padding: 8px 10px 11px; border-bottom: 1px solid #e6e9e6; }
.learning-nav__account-menu strong { font-size: 12px; }
.learning-nav__account-menu span { color: #828983; font-size: 10px; }
.learning-nav__account-menu a, .learning-nav__account-menu button { display: flex; align-items: center; gap: 9px; min-height: 36px; padding: 0 10px; border: 0; border-radius: 4px; background: transparent; color: #39403a; font-size: 11px; text-align: left; cursor: pointer; }
.learning-nav__account-menu a:hover, .learning-nav__account-menu button:hover { background: #f1f5f1; color: #0f7137; }
.learning-nav__mobile-toggle, .learning-nav__mobile-panel { display: none; }
.nav-menu-enter-active, .nav-menu-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.nav-menu-enter-from, .nav-menu-leave-to { opacity: 0; transform: translateY(-5px); }
@media (max-width: 1120px) {
  .learning-nav { grid-template-columns: auto minmax(280px, auto) minmax(120px, 1fr) 30px 30px 30px; gap: 8px; padding: 0 16px; }
  .learning-nav__links { gap: 12px; }
  .learning-nav__links a { font-size: 11px; }
  .learning-nav__search { max-width: 190px; }
  .learning-nav__icon { width: 30px; height: 34px; }
}
@media (max-width: 680px) {
  .learning-nav { grid-template-columns: auto 1fr 36px; gap: 16px; height: 56px; padding: 0 16px; }
  .learning-nav__links, .learning-nav__search, .learning-nav__icon, .learning-nav__account { display: none; }
  .learning-nav__brand { font-size: 21px; }
  .learning-nav__mobile-toggle { grid-column: 3; display: grid; place-items: center; width: 36px; height: 36px; border: 0; background: transparent; color: #2b312c; cursor: pointer; }
  .learning-nav__mobile-panel { position: absolute; top: 56px; right: 0; left: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 12px 16px 18px; border-bottom: 1px solid #d9ddd9; background: #fff; box-shadow: 0 16px 24px rgba(20,27,21,.08); }
  .learning-nav__mobile-panel a, .learning-nav__mobile-panel button { min-height: 44px; padding: 0 10px; border: 0; border-bottom: 1px solid #edf0ed; background: transparent; color: #303731; font-size: 12px; font-weight: 650; text-align: left; }
}
</style>
