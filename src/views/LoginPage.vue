<template>
  <div class="auth-scene">
    <!-- Blur orbs -->
    <div class="blur-orb blur-orb--green" style="width:320px;height:320px;top:-80px;left:-80px;opacity:0.25;"></div>
    <div class="blur-orb blur-orb--purple" style="width:240px;height:240px;bottom:-60px;right:-60px;opacity:0.15;"></div>

    <div class="auth-card animate-scale-in">
      <!-- Logo -->
      <div class="auth-card__logo">
        <span class="auth-card__brand">知</span>
      </div>
      <h1 class="auth-card__title">大学生知识通识平台</h1>
      <p class="auth-card__subtitle">竞赛、刷题、课程、论文，一个入口就够了。</p>

      <!-- Form -->
      <form class="auth-card__form" @submit.prevent="handleLogin">
        <div class="field">
          <label class="field__label" for="login-user">用户名</label>
          <input id="login-user" v-model.trim="form.username" class="field__input" type="text" autocomplete="username" placeholder="输入用户名" required />
        </div>
        <div class="field">
          <label class="field__label" for="login-pass">密码</label>
          <input id="login-pass" v-model="form.password" class="field__input" type="password" autocomplete="current-password" placeholder="输入密码" required />
        </div>

        <div class="captcha-row">
          <div class="field">
            <label class="field__label" for="login-captcha">验证码</label>
            <input id="login-captcha" v-model.trim="form.captcha" class="field__input" type="text" maxlength="4" placeholder="输入右侧字符" required />
          </div>
          <button class="captcha-box" type="button" title="刷新验证码" @click="refreshCaptcha">
            <span v-if="captchaSvg" v-html="captchaSvg" class="captcha-box__svg"></span>
            <span v-else>刷新</span>
          </button>
        </div>

        <div class="auth-card__row">
          <label class="auth-card__check">
            <input type="checkbox" v-model="remember" />
            <span>记住我</span>
          </label>
          <router-link to="/forgot-password" class="auth-card__link">忘记密码？</router-link>
        </div>

        <button class="btn btn--primary btn--lg" type="submit" :disabled="loading" style="width:100%;">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- Quick login -->
      <div class="auth-card__quick">
        <button type="button" class="auth-card__quick-btn" @click="fillAccount('student1', '123123123')">学生账号</button>
        <button type="button" class="auth-card__quick-btn" @click="fillAccount('lufuping', 'lu1203')">管理员</button>
      </div>

      <p class="auth-card__footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useRequest } from '../composables/useRequest'

const router = useRouter()
const auth = useAuth()
const { get } = useRequest()
const loading = ref(false)
const remember = ref(false)
const captchaSvg = ref('')
const form = reactive({ username: '', password: '', captchaId: '', captcha: '' })

async function refreshCaptcha() {
  try {
    const data = await get('/auth/captcha', { purpose: 'login' })
    captchaSvg.value = data.svg
    form.captchaId = data.captchaId
    form.captcha = ''
  } catch {
    captchaSvg.value = ''
  }
}

async function handleLogin() {
  if (!form.username || !form.password || !form.captcha || !form.captchaId) return
  loading.value = true
  try {
    await auth.login(form)
    router.push('/')
  } catch {
    refreshCaptcha()
  } finally { loading.value = false }
}

function fillAccount(u, p) { form.username = u; form.password = p }

onMounted(refreshCaptcha)
</script>

<style scoped>
.auth-scene {
  position: relative; display: flex; align-items: center; justify-content: center;
  min-height: 100vh; padding: 24px; background: var(--bg-secondary);
  overflow: hidden;
}

.auth-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  background: var(--bg-white); border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl); padding: 44px 36px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.04);
}

.auth-card__logo {
  display: flex; justify-content: center; margin-bottom: 16px;
}
.auth-card__brand {
  font-family: var(--font-display); font-size: 44px; color: var(--text-primary); line-height: 1;
}

.auth-card__title {
  text-align: center;
  font-family: var(--font-heading); font-size: 22px; font-weight: 700;
  color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.3px;
}
.auth-card__subtitle {
  text-align: center; font-size: 13px; color: var(--text-secondary);
  margin-bottom: 32px;
}

.auth-card__form { display: flex; flex-direction: column; gap: 16px; }

.captcha-row { display: grid; grid-template-columns: 1fr 128px; gap: 10px; align-items: end; }
.captcha-box {
  height: 38px; border: 1px solid var(--border-primary); border-radius: var(--radius-md);
  background: var(--bg-secondary); overflow: hidden; color: var(--text-secondary);
}
.captcha-box__svg :deep(svg) { display: block; width: 100%; height: 36px; }

.auth-card__row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px;
}
.auth-card__check { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; }
.auth-card__link { color: var(--brand-green-dark); font-weight: 500; }
.auth-card__link:hover { color: var(--accent-hover); }

.auth-card__quick { display: flex; gap: 8px; margin-top: 16px; }
.auth-card__quick-btn {
  flex: 1; height: 34px; border: 1px solid var(--border-primary);
  border-radius: var(--radius-pill); background: var(--bg-white);
  color: var(--text-secondary); font-size: 12px; font-weight: 500;
  transition: all 0.18s ease;
}
.auth-card__quick-btn:hover { border-color: var(--brand-green); color: var(--brand-green-dark); background: var(--brand-green-light); }

.auth-card__footer {
  text-align: center; margin-top: 22px; font-size: 13px; color: var(--text-muted);
}
.auth-card__footer a { color: var(--brand-green-dark); font-weight: 600; }
.auth-card__footer a:hover { color: var(--accent-hover); }

@media (max-width: 440px) {
  .captcha-row { grid-template-columns: 1fr; }
}
</style>
