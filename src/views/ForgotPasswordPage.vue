<template>
  <div class="auth-screen">
    <div class="auth-card">
      <header class="auth-card__header">
        <span>知途</span>
        <h1>重置密码</h1>
        <p>{{ resetToken ? '设置一个新密码。' : '先验证账号。' }}</p>
      </header>

      <form v-if="!resetToken" class="auth-form" @submit.prevent="requestReset">
        <div class="field">
          <label class="field__label" for="identifier">用户名或邮箱</label>
          <input id="identifier" v-model.trim="identifier" class="field__input" required />
        </div>
        <div class="captcha-row">
          <div class="field">
            <label class="field__label" for="reset-captcha">验证码</label>
            <input id="reset-captcha" v-model.trim="captcha" class="field__input" maxlength="4" required />
          </div>
          <button class="captcha-box" type="button" title="刷新验证码" @click="refreshCaptcha">
            <span v-if="captchaSvg" v-html="captchaSvg" class="captcha-box__svg"></span>
            <span v-else>刷新</span>
          </button>
        </div>
        <button class="btn btn--primary" type="submit" :disabled="loading">{{ loading ? '验证中' : '继续' }}</button>
      </form>

      <form v-else class="auth-form" @submit.prevent="confirmReset">
        <div class="field">
          <label class="field__label" for="new-password">新密码</label>
          <input id="new-password" v-model="password" class="field__input" type="password" minlength="6" required />
        </div>
        <button class="btn btn--primary" type="submit" :disabled="loading">{{ loading ? '提交中' : '更新密码' }}</button>
      </form>

      <router-link class="back-link" to="/login">返回登录</router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRequest } from '../composables/useRequest'

const router = useRouter()
const { get, post } = useRequest()
const identifier = ref('')
const captcha = ref('')
const captchaId = ref('')
const captchaSvg = ref('')
const resetToken = ref('')
const password = ref('')
const loading = ref(false)

async function refreshCaptcha() {
  try {
    const data = await get('/auth/captcha', { purpose: 'reset' })
    captchaId.value = data.captchaId
    captchaSvg.value = data.svg
    captcha.value = ''
  } catch {
    captchaSvg.value = ''
  }
}

async function requestReset() {
  loading.value = true
  try {
    const data = await post('/auth/password-reset/request', {
      identifier: identifier.value,
      captchaId: captchaId.value,
      captcha: captcha.value
    })
    resetToken.value = data.resetToken || ''
    if (!resetToken.value) router.push('/login')
  } catch {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

async function confirmReset() {
  loading.value = true
  try {
    await post('/auth/password-reset/confirm', { token: resetToken.value, password: password.value })
    router.push('/login')
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<style scoped>
.auth-screen { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--bg-secondary); }
.auth-card { width: min(420px, 100%); padding: 36px; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); }
.auth-card__header { margin-bottom: 24px; }
.auth-card__header > span { display: block; margin-bottom: 18px; color: var(--brand-green); font: 20px var(--font-brand); }
.auth-card__header h1 { font-family: var(--font-heading); font-size: 22px; margin-bottom: 6px; }
.auth-card__header p, .back-link { font-size: 13px; color: var(--text-secondary); }
.auth-form { display: grid; gap: 16px; }
.captcha-row { display: grid; grid-template-columns: 1fr 128px; gap: 10px; align-items: end; }
.captcha-box { height: 38px; border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-secondary); overflow: hidden; }
.captcha-box__svg :deep(svg) { display: block; width: 100%; height: 36px; }
.back-link { display: inline-block; margin-top: 20px; }
</style>
