<template>
  <div class="auth-screen">
    <div class="auth-card auth-card--wide">
      <div class="auth-card__header">
        <span class="auth-card__logo">知</span>
        <h1 class="auth-card__title">创建学习身份</h1>
        <p class="auth-card__desc">学生刷题，教师提交 — 账号只做必要信息。</p>
      </div>

      <form class="auth-card__form" @submit.prevent="handleRegister">
        <div class="form-grid">
          <div class="field">
            <label class="field__label" for="username">用户名</label>
            <input
              id="username"
              v-model.trim="form.username"
              class="field__input"
              :class="{ 'input-ok': usernameState.state === 'ok', 'input-err': usernameState.state === 'taken' }"
              type="text"
              placeholder="3-20 位字母、数字或下划线"
              required
              @input="checkUsernameDebounced"
            />
            <small v-if="usernameState.message" :class="usernameState.state === 'ok' ? 'hint-ok' : 'hint-err'">
              {{ usernameState.message }}
            </small>
          </div>

          <div class="field">
            <label class="field__label" for="realName">真实姓名</label>
            <input id="realName" v-model.trim="form.realName" class="field__input" type="text" placeholder="请输入真实姓名" required />
          </div>

          <div class="field">
            <label class="field__label" for="studentId">学号</label>
            <input id="studentId" v-model.trim="form.studentId" class="field__input" type="text" placeholder="学生可填写学号" />
          </div>

          <div class="field">
            <label class="field__label" for="email">邮箱</label>
            <input id="email" v-model.trim="form.email" class="field__input" type="email" placeholder="name@example.com" required />
          </div>

          <div class="field">
            <label class="field__label" for="password">密码</label>
            <input id="password" v-model="form.password" class="field__input" type="password" placeholder="至少 6 位" required />
          </div>

          <div class="field">
            <label class="field__label" for="accountType">身份</label>
            <select id="accountType" v-model="form.accountType" class="field__input">
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>
        </div>

        <div class="captcha-row">
          <div class="field">
            <label class="field__label" for="captcha">验证码</label>
            <input id="captcha" v-model.trim="form.captcha" class="field__input" type="text" placeholder="输入右侧字符" required maxlength="4" />
          </div>
          <button class="captcha-box" type="button" title="点击刷新验证码" @click="refreshCaptcha">
            <span v-if="!captchaSvg" class="captcha-box__text">刷新</span>
            <span v-else v-html="captchaSvg" class="captcha-box__svg"></span>
          </button>
        </div>

        <div class="auth-actions">
          <router-link to="/login" class="auth-actions__back">← 返回登录</router-link>
          <button class="auth-card__submit" type="submit" :disabled="loading">
            {{ loading ? '正在注册' : '完成注册' }}
          </button>
        </div>
      </form>
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
const captchaSvg = ref('')
const captchaId = ref('')
const form = reactive({
  username: '',
  realName: '',
  studentId: '',
  email: '',
  password: '',
  accountType: 'student',
  captcha: ''
})

const usernameState = reactive({ state: '', message: '' })
let checkTimer = null

async function refreshCaptcha() {
  try {
    const data = await get('/auth/captcha', { purpose: 'register' })
    captchaSvg.value = data.svg
    captchaId.value = data.captchaId
    form.captcha = ''
  } catch (e) {
    captchaSvg.value = ''
  }
}

function checkUsernameDebounced() {
  clearTimeout(checkTimer)
  usernameState.state = ''
  usernameState.message = ''
  if (form.username.length < 3) return

  checkTimer = setTimeout(async () => {
    try {
      const data = await get(`/auth/check-username/${form.username}`)
      usernameState.state = data.available ? 'ok' : 'taken'
      usernameState.message = data.available ? '用户名可用' : data.message
    } catch {
      usernameState.state = 'taken'
      usernameState.message = '用户名检查失败'
    }
  }, 300)
}

async function handleRegister() {
  loading.value = true
  try {
    await auth.register({
      username: form.username,
      password: form.password,
      realName: form.realName,
      email: form.email,
      studentId: form.studentId,
      accountType: form.accountType,
      captchaId: captchaId.value,
      captcha: form.captcha
    })
    router.push('/login')
  } catch (e) {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<style scoped>
.auth-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-secondary);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
}

.auth-card--wide {
  max-width: 560px;
}

.auth-card__header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-card__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 36px;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 12px;
}

.auth-card__title {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.auth-card__desc {
  font-size: 13px;
  color: var(--text-tertiary);
}

.auth-card__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 12px;
  align-items: end;
}

.captcha-box {
  height: 38px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
}

.captcha-box:hover {
  border-color: var(--text-secondary);
}

.captcha-box__text {
  font-size: 12px;
  color: var(--text-secondary);
}

.captcha-box__svg :deep(svg) {
  width: 100%;
  height: 34px;
  display: block;
}

.input-ok {
  border-color: #22c55e !important;
}

.input-err {
  border-color: var(--red) !important;
}

.hint-ok {
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  color: #22c55e;
}

.hint-err {
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--red);
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.auth-actions__back {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.auth-actions__back:hover {
  color: var(--text-primary);
}

.auth-card__submit {
  flex: 1;
  height: 40px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--text-primary);
  color: var(--bg-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.auth-card__submit:hover {
  background: #2a2a2a;
}

.auth-card__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .captcha-row {
    grid-template-columns: 1fr;
  }
  .auth-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
