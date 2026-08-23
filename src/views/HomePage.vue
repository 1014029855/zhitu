<template>
  <div class="workspace">
    <header class="workspace__header">
      <div>
        <p class="section-label">工作台</p>
        <h1>你好，{{ displayName }}</h1>
        <p>先看下一步，再决定今天做什么。</p>
      </div>
      <button class="btn btn--primary" type="button" @click="showCreate = !showCreate">
        <Plus :size="16" />
        新建目标
      </button>
    </header>

    <form v-if="showCreate" class="create-form" @submit.prevent="createGoal">
      <div class="field">
        <label class="field__label">目标名称</label>
        <input v-model.trim="goalForm.title" class="field__input" placeholder="例如：完成数学建模竞赛准备" required />
      </div>
      <div class="field">
        <label class="field__label">截止日期</label>
        <input v-model="goalForm.targetDate" class="field__input" type="date" />
      </div>
      <div class="field create-form__wide">
        <label class="field__label">第一步</label>
        <input v-model.trim="goalForm.firstTask" class="field__input" placeholder="写下一个可以立即开始的动作" required />
      </div>
      <div class="create-form__actions">
        <button class="btn btn--ghost" type="button" @click="showCreate = false">取消</button>
        <button class="btn btn--primary" type="submit" :disabled="saving">{{ saving ? '创建中' : '创建' }}</button>
      </div>
    </form>

    <section class="metric-grid" aria-label="学习进展">
      <div v-for="item in metrics" :key="item.label" class="metric">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <LoadingSpinner :show="loading" />

    <div v-if="!loading" class="workspace-grid">
      <section class="panel panel--wide">
        <header class="panel__header">
          <div>
            <p class="section-label">目标</p>
            <h2>正在推进</h2>
          </div>
          <router-link to="/competition" class="text-link">从竞赛建立目标</router-link>
        </header>

        <div v-if="dashboard.activeGoals.length" class="goal-list">
          <article v-for="goal in dashboard.activeGoals" :key="goal.id" class="goal-row">
            <div class="goal-row__main">
              <strong>{{ goal.title }}</strong>
              <span v-if="goal.target_date">{{ formatDate(goal.target_date) }} 截止</span>
            </div>
            <div class="progress" :aria-label="`完成 ${goal.progress}%`">
              <span :style="{ width: `${goal.progress}%` }"></span>
            </div>
            <b>{{ goal.completed_task_count }}/{{ goal.task_count }}</b>
          </article>
        </div>
        <div v-else class="empty-state">
          <Target :size="24" />
          <p>还没有目标。先建一个，再把课程、刷题或竞赛放进去。</p>
        </div>
      </section>

      <section class="panel">
        <header class="panel__header">
          <div>
            <p class="section-label">下一步</p>
            <h2>待办任务</h2>
          </div>
        </header>
        <div v-if="dashboard.nextTasks.length" class="task-list">
          <label v-for="task in dashboard.nextTasks" :key="task.id" class="task-row">
            <input type="checkbox" :disabled="updatingTask === task.id" @change="completeTask(task)" />
            <span>
              <strong>{{ task.title }}</strong>
              <small>{{ task.goal_title }}<template v-if="task.due_date"> · {{ formatDate(task.due_date) }}</template></small>
            </span>
          </label>
        </div>
        <p v-else class="panel__empty">当前没有待办任务。</p>
      </section>

      <section class="panel">
        <header class="panel__header">
          <div>
            <p class="section-label">时间</p>
            <h2>临近截止</h2>
          </div>
        </header>
        <div v-if="dashboard.deadlines.length" class="plain-list">
          <div v-for="item in dashboard.deadlines" :key="item.id">
            <CalendarClock :size="16" />
            <span>{{ item.title }}</span>
            <time>{{ formatDate(item.due_date) }}</time>
          </div>
        </div>
        <p v-else class="panel__empty">近期没有明确截止时间。</p>
      </section>

      <section class="panel panel--wide">
        <header class="panel__header">
          <div>
            <p class="section-label">成果</p>
            <h2>最近完成</h2>
          </div>
          <router-link to="/user" class="text-link">查看全部</router-link>
        </header>
        <div v-if="dashboard.recentAchievements.length" class="achievement-list">
          <div v-for="item in dashboard.recentAchievements" :key="item.id">
            <CheckCircle2 :size="18" />
            <span><strong>{{ item.title }}</strong><small>{{ formatDate(item.created_at) }}</small></span>
          </div>
        </div>
        <p v-else class="panel__empty">完成目标后，成果会出现在这里。</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { CalendarClock, CheckCircle2, Plus, Target } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { useRequest } from '../composables/useRequest'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const auth = useAuth()
const { get, post, put } = useRequest()
const loading = ref(true)
const saving = ref(false)
const showCreate = ref(false)
const updatingTask = ref(null)
const dashboard = reactive({
  activeGoals: [],
  nextTasks: [],
  deadlines: [],
  recentAchievements: [],
  stats: {}
})
const goalForm = reactive({ title: '', targetDate: '', firstTask: '' })

const displayName = computed(() => auth.user.value?.realName || auth.user.value?.real_name || auth.user.value?.username || '同学')
const metrics = computed(() => [
  { label: '活跃目标', value: dashboard.stats.active_goals || 0 },
  { label: '完成任务', value: dashboard.stats.completed_tasks || 0 },
  { label: '读完论文', value: dashboard.stats.papers_read || 0 },
  { label: '掌握题目', value: dashboard.stats.exercises_mastered || 0 }
])

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

async function loadDashboard() {
  const data = await get('/growth/dashboard')
  Object.assign(dashboard, data)
}

async function createGoal() {
  saving.value = true
  try {
    await post('/growth/goals', {
      title: goalForm.title,
      targetDate: goalForm.targetDate || null,
      tasks: [{ title: goalForm.firstTask, dueDate: goalForm.targetDate || null, priority: 1 }]
    })
    Object.assign(goalForm, { title: '', targetDate: '', firstTask: '' })
    showCreate.value = false
    await loadDashboard()
  } finally {
    saving.value = false
  }
}

async function completeTask(task) {
  updatingTask.value = task.id
  try {
    await put(`/growth/goals/${task.goal_id}/tasks/${task.id}`, { status: 'done' })
    await loadDashboard()
  } finally {
    updatingTask.value = null
  }
}

onMounted(async () => {
  try {
    await loadDashboard()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.workspace { max-width: 1120px; margin: 0 auto; padding: 44px 40px 64px; }
.workspace__header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.workspace__header h1 { font-family: var(--font-heading); font-size: 28px; margin: 5px 0 8px; }
.workspace__header p:last-child { color: var(--text-secondary); font-size: 14px; }
.create-form { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; padding: 20px 0 28px; border-top: 1px solid var(--border-primary); }
.create-form__wide, .create-form__actions { grid-column: 1 / -1; }
.create-form__actions { display: flex; justify-content: flex-end; gap: 8px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-block: 1px solid var(--border-primary); margin-bottom: 34px; }
.metric { padding: 20px 18px; border-right: 1px solid var(--border-primary); }
.metric:last-child { border-right: 0; }
.metric span { display: block; color: var(--text-secondary); font-size: 12px; margin-bottom: 7px; }
.metric strong { font-size: 26px; }
.workspace-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 36px 44px; }
.panel { min-width: 0; }
.panel--wide { grid-column: 1 / -1; }
.panel__header { display: flex; justify-content: space-between; align-items: end; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border-primary); }
.panel__header h2 { font-family: var(--font-heading); font-size: 18px; margin-top: 4px; }
.text-link { color: var(--text-secondary); font-size: 12px; }
.goal-list, .task-list, .plain-list, .achievement-list { display: grid; }
.goal-row { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(140px, 240px) 48px; align-items: center; gap: 18px; padding: 16px 0; border-bottom: 1px solid var(--border-light); }
.goal-row__main strong, .goal-row__main span { display: block; }
.goal-row__main span, .task-row small, .achievement-list small { color: var(--text-muted); font-size: 11px; margin-top: 4px; }
.progress { height: 6px; background: var(--bg-secondary); overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--brand-green); }
.task-row { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border-light); cursor: pointer; }
.task-row input { width: 16px; height: 16px; margin-top: 2px; }
.task-row span, .task-row strong, .task-row small, .achievement-list span, .achievement-list strong, .achievement-list small { display: block; }
.plain-list > div, .achievement-list > div { display: grid; grid-template-columns: 20px 1fr auto; gap: 10px; align-items: center; padding: 13px 0; border-bottom: 1px solid var(--border-light); }
.plain-list time { color: var(--text-muted); font-size: 12px; }
.achievement-list > div { grid-template-columns: 22px 1fr; }
.panel__empty, .empty-state { padding: 26px 0; color: var(--text-muted); font-size: 13px; }
.empty-state { display: flex; align-items: center; gap: 10px; }
@media (max-width: 760px) {
  .workspace { padding: 30px 20px 50px; }
  .workspace__header { align-items: start; }
  .metric-grid { grid-template-columns: repeat(2, 1fr); }
  .metric:nth-child(2) { border-right: 0; }
  .workspace-grid { grid-template-columns: 1fr; }
  .panel--wide { grid-column: auto; }
  .goal-row { grid-template-columns: 1fr 44px; }
  .progress { grid-row: 2; grid-column: 1 / -1; }
  .create-form { grid-template-columns: 1fr; }
}
</style>
