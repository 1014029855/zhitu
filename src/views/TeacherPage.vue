<template>
  <section class="page">
    <header class="page__header">
      <p class="section-label">Teacher Desk</p>
      <h1 class="page__title">教师中心</h1>
      <p class="page__desc">提交竞赛、技能课程或论文资源，等待管理员审核后进入平台。</p>
    </header>

    <div class="teacher-layout">
      <form class="submit-form" @submit.prevent="submitContent">
        <div class="field">
          <label class="field__label">标题</label>
          <input v-model.trim="form.title" class="field__input" required />
        </div>

        <div class="field">
          <label class="field__label">类型</label>
          <select v-model="form.type" class="field__input">
            <option value="competition">竞赛</option>
            <option value="skill">技能课程</option>
            <option value="paper">论文</option>
          </select>
        </div>

        <div class="field">
          <label class="field__label">描述</label>
          <textarea v-model.trim="form.description" class="field__input field__textarea" required></textarea>
        </div>

        <button class="btn btn--primary" type="submit" :disabled="submitting">
          {{ submitting ? '提交中' : '提交审核' }}
        </button>
      </form>

      <div class="submissions">
        <article v-for="item in submissions" :key="item.id" class="submissions__item">
          <span class="submissions__status">{{ statusLabel(item.status) }}</span>
          <strong class="submissions__title">{{ item.title }}</strong>
          <p class="submissions__meta">{{ item.type }} / {{ item.created_at }}</p>
        </article>
        <p v-if="submissions.length === 0" class="empty-state">暂无提交记录。</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRequest } from '../composables/useRequest'

const { get, post } = useRequest()
const submissions = ref([])
const submitting = ref(false)
const form = reactive({ title: '', type: 'competition', description: '' })

function statusLabel(status) {
  return { approved: '已通过', rejected: '已拒绝', pending: '审核中' }[status] || '审核中'
}

async function loadSubmissions() {
  try {
    submissions.value = await get('/teacher/submissions') || []
  } catch {
    submissions.value = []
  }
}

async function submitContent() {
  submitting.value = true
  try {
    await post('/teacher/submissions', { ...form })
    form.title = ''
    form.description = ''
    await loadSubmissions()
  } catch {
  } finally {
    submitting.value = false
  }
}

onMounted(loadSubmissions)
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 40px;
  min-height: 100vh;
  background: var(--bg-primary);
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
  color: var(--text-primary);
}

.page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 0;
}

.teacher-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 40px;
}

.submit-form {
  display: grid;
  gap: 16px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 24px;
  background: var(--bg-secondary);
  align-content: start;
}

.field__textarea {
  min-height: 140px;
  resize: vertical;
  padding-top: 10px;
}

.submissions {
  border-top: 1px solid var(--border-primary);
}

.submissions__item {
  display: grid;
  gap: 6px;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-light);
}

.submissions__status {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.submissions__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

.submissions__meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 820px) {
  .teacher-layout {
    grid-template-columns: 1fr;
  }
}
</style>
