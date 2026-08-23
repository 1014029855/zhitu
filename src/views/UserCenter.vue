<template>
  <section class="page">
    <header class="page__header">
      <p class="section-label">User Center</p>
      <h1 class="page__title">个人中心</h1>
      <p class="page__desc">资料、身份、邮箱，保持简洁。</p>
    </header>

    <div class="user-layout">
      <aside class="profile-side">
        <div class="profile-side__avatar">{{ initials }}</div>
        <h2 class="profile-side__name">{{ user?.realName || user?.real_name || user?.username }}</h2>
        <p class="profile-side__handle">@{{ user?.username }}</p>
        <span class="profile-side__role">{{ roleLabel(user?.accountType || user?.account_type) }}</span>
      </aside>

      <form class="settings" @submit.prevent="saveProfile">
        <div class="settings__grid">
          <div class="field">
            <label class="field__label">真实姓名</label>
            <input v-model="form.realName" class="field__input" />
          </div>
          <div class="field">
            <label class="field__label">邮箱</label>
            <input v-model="form.email" class="field__input" type="email" />
          </div>
          <div class="field">
            <label class="field__label">电话</label>
            <input v-model="form.phone" class="field__input" />
          </div>
          <div class="field">
            <label class="field__label">个人简介</label>
            <input v-model="form.bio" class="field__input" />
          </div>
        </div>
        <button class="btn btn--primary" type="submit">保存资料</button>
      </form>
    </div>

    <div class="account-grid">
      <section class="account-section">
        <header class="account-section__header">
          <div>
            <p class="section-label">成果</p>
            <h2>成果记录</h2>
          </div>
        </header>
        <form class="achievement-form" @submit.prevent="addAchievement">
          <input v-model.trim="achievementForm.title" class="field__input" placeholder="成果名称" required />
          <select v-model="achievementForm.type" class="field__input">
            <option value="reflection">复盘</option>
            <option value="competition">竞赛</option>
            <option value="paper">论文</option>
            <option value="code">编程</option>
            <option value="certificate">证书</option>
          </select>
          <button class="btn btn--primary" type="submit">添加</button>
        </form>
        <div v-if="achievements.length" class="achievement-list">
          <div v-for="item in achievements" :key="item.id">
            <strong>{{ item.title }}</strong>
            <span>{{ achievementType(item.type) }} · {{ formatDate(item.created_at) }}</span>
          </div>
        </div>
        <p v-else class="empty-text">还没有成果记录。</p>
      </section>

      <section class="account-section">
        <header class="account-section__header">
          <div>
            <p class="section-label">安全</p>
            <h2>修改密码</h2>
          </div>
        </header>
        <form class="password-form" @submit.prevent="changePassword">
          <div class="field">
            <label class="field__label">原密码</label>
            <input v-model="passwordForm.oldPassword" class="field__input" type="password" required />
          </div>
          <div class="field">
            <label class="field__label">新密码</label>
            <input v-model="passwordForm.newPassword" class="field__input" type="password" minlength="6" required />
          </div>
          <button class="btn btn--primary" type="submit">更新密码</button>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRequest } from '../composables/useRequest'

const auth = useAuth()
const { get, post, put } = useRequest()
const user = auth.user
const form = reactive({ realName: '', email: '', phone: '', bio: '' })
const achievements = ref([])
const achievementForm = reactive({ title: '', type: 'reflection' })
const passwordForm = reactive({ oldPassword: '', newPassword: '' })

const initials = computed(() => {
  const name = user.value?.realName || user.value?.real_name || user.value?.username || 'U'
  return String(name).slice(0, 2).toUpperCase()
})

function roleLabel(type) {
  return { student: '学生', teacher: '教师', admin: '管理员' }[type] || '用户'
}

async function saveProfile() {
  try {
    await put('/user/profile', form)
    await auth.fetchProfile()
  } catch {}
}

function achievementType(type) {
  return { project: '目标', competition: '竞赛', paper: '论文', code: '编程', certificate: '证书', reflection: '复盘' }[type] || '成果'
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN').format(new Date(value))
}

async function loadAchievements() {
  achievements.value = await get('/growth/achievements')
}

async function addAchievement() {
  await post('/growth/achievements', achievementForm)
  achievementForm.title = ''
  await loadAchievements()
}

async function changePassword() {
  await put('/user/password', passwordForm)
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
}

onMounted(async () => {
  form.realName = user.value?.realName || user.value?.real_name || ''
  form.email = user.value?.email || ''
  form.phone = user.value?.phone || ''
  form.bio = user.value?.bio || ''
  try { await loadAchievements() } catch {}
})
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 40px;
  min-height: 100vh;
  background: var(--bg-secondary);
}

.page__header {
  margin-bottom: 40px;
}

.page__title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.3px;
  margin-bottom: 8px;
}

.page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 0;
}

.user-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 40px;
}

.profile-side {
  display: grid;
  gap: 12px;
  align-content: start;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 28px;
  background: var(--bg-secondary);
}

.profile-side__avatar {
  display: grid;
  width: 80px;
  height: 80px;
  place-items: center;
  border-radius: 50%;
  background: var(--text-primary);
  color: var(--bg-primary);
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.profile-side__name {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0;
  color: var(--text-primary);
}

.profile-side__handle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.profile-side__role {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  background: var(--text-primary);
  color: var(--bg-primary);
  width: max-content;
}

.settings {
  display: grid;
  gap: 20px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 28px;
  background: var(--bg-primary);
}

.settings__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.account-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; margin-top: 40px; }
.account-section { border-top: 1px solid var(--border-primary); padding-top: 20px; }
.account-section__header h2 { font-family: var(--font-heading); font-size: 18px; margin-top: 4px; }
.achievement-form { display: grid; grid-template-columns: 1fr 130px auto; gap: 10px; margin: 18px 0; }
.achievement-list { display: grid; }
.achievement-list > div { display: flex; justify-content: space-between; gap: 20px; padding: 12px 0; border-bottom: 1px solid var(--border-light); }
.achievement-list span, .empty-text { color: var(--text-muted); font-size: 12px; }
.password-form { display: grid; gap: 14px; margin-top: 18px; }

@media (max-width: 860px) {
  .user-layout {
    grid-template-columns: 1fr;
  }

  .settings__grid {
    grid-template-columns: 1fr;
  }

  .account-grid { grid-template-columns: 1fr; }
  .achievement-form { grid-template-columns: 1fr; }
}
</style>
