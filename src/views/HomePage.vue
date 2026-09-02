<template>
  <div class="product-page dashboard">
    <header class="product-header dashboard__header">
      <div class="product-header__copy">
        <p class="product-header__eyebrow">今日学习</p>
        <h1>你好，{{ displayName }}</h1>
        <p>从一项需要思考的任务开始，不用先把所有内容都看完。</p>
        <div class="product-header__meta"><span>{{ todayLabel }}</span><span>{{ learningDashboard.reviews.length }} 项待复习</span></div>
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

    <div v-if="!loading" class="dashboard__content">
      <section class="learning-focus">
        <header class="panel__header">
          <div><p class="section-label">继续学习</p><h2>从上次停下的位置开始</h2></div>
          <router-link to="/skills" class="text-link">查看课程</router-link>
        </header>
        <div v-if="learningDashboard.activeCourses.length" class="learning-list">
          <router-link
            v-for="course in learningDashboard.activeCourses"
            :key="course.id"
            :to="course.active_lesson_id ? `/skills/${course.id}/lessons/${course.active_lesson_id}` : `/skills/${course.id}`"
            class="learning-row"
          >
            <span class="learning-row__icon"><BookOpenCheck :size="17" /></span>
            <span><strong>{{ course.title }}</strong><small>{{ course.active_lesson_title || '选择一个课时开始' }}</small></span>
            <span class="learning-row__progress"><i><em :style="{ width: `${courseProgress(course)}%` }"></em></i><small>{{ course.completed_lessons }}/{{ course.lesson_count }} 课时</small></span>
            <ArrowRight :size="17" />
          </router-link>
        </div>
        <div v-else class="panel__empty">进入课程后，这里会保留你的下一步。</div>
      </section>

      <aside class="review-queue">
        <header class="panel__header"><div><p class="section-label">掌握度</p><h2>今天需要复习</h2></div></header>
        <router-link
          v-for="review in learningDashboard.reviews.slice(0, 4)"
          :key="review.knowledge_point_id"
          :to="review.lesson_id ? `/skills/${review.skill_id}/lessons/${review.lesson_id}` : `/skills/${review.skill_id}`"
          class="review-row"
        >
          <span><strong>{{ review.knowledge_point }}</strong><small>{{ review.course_title }}</small></span>
          <b>{{ masteryLabel(review.level) }}</b>
        </router-link>
        <p v-if="!learningDashboard.reviews.length" class="panel__empty">当前没有到期复习。</p>
      </aside>

      <div class="workspace-grid">
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowRight, BookOpenCheck, CalendarClock, CheckCircle2, Plus, Target } from 'lucide-vue-next'
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
const learningDashboard = reactive({ activeCourses: [], reviews: [] })
const goalForm = reactive({ title: '', targetDate: '', firstTask: '' })

const displayName = computed(() => auth.user.value?.realName || auth.user.value?.real_name || auth.user.value?.username || '同学')
const todayLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()))
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
  const [growth, learning] = await Promise.all([
    get('/growth/dashboard'),
    get('/learning/dashboard').catch(() => ({ activeCourses: [], reviews: [] }))
  ])
  Object.assign(dashboard, growth)
  Object.assign(learningDashboard, learning)
}

function courseProgress(course) {
  return course.lesson_count ? Math.round((course.completed_lessons || 0) / course.lesson_count * 100) : 0
}

function masteryLabel(level) {
  return { initial: '初识', familiar: '熟悉', proficient: '熟练', mastered: '掌握' }[level] || '初识'
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
.dashboard__header { margin-bottom: 0; }
.create-form { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; padding: 20px 0 28px; border-top: 1px solid var(--border-primary); }
.create-form__wide, .create-form__actions { grid-column: 1 / -1; }
.create-form__actions { display: flex; justify-content: flex-end; gap: 8px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--border-primary); margin-bottom: 34px; }
.metric { padding: 20px 18px; border-right: 1px solid var(--border-primary); }
.metric:last-child { border-right: 0; }
.metric span { display: block; color: var(--text-secondary); font-size: 12px; margin-bottom: 7px; }
.metric strong { font-size: 26px; }
.dashboard__content { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(260px, .65fr); gap: 38px; }
.learning-focus, .review-queue { min-width: 0; }
.learning-list { border-top: 1px solid var(--border-primary); }
.learning-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) 150px 18px; align-items: center; gap: 13px; min-height: 72px; padding: 11px 8px; border-bottom: 1px solid var(--border-light); color: var(--text-primary); }
.learning-row:hover { background: #f7faf7; color: var(--text-primary); }
.learning-row__icon { display: grid; place-items: center; width: 30px; height: 30px; background: #edf7f0; color: #159447; }
.learning-row span, .learning-row strong, .learning-row small { display: block; }
.learning-row strong { font-size: 13px; }
.learning-row small { margin-top: 4px; color: var(--text-muted); font-size: 10px; }
.learning-row__progress i { display: block; height: 4px; background: #e5e8e5; }
.learning-row__progress em { display: block; height: 100%; background: #159447; }
.review-queue { border-left: 1px solid var(--border-primary); padding-left: 24px; }
.review-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; min-height: 61px; border-bottom: 1px solid var(--border-light); color: var(--text-primary); }
.review-row span, .review-row strong, .review-row small { display: block; }
.review-row strong { font-size: 12px; }
.review-row small { margin-top: 4px; color: var(--text-muted); font-size: 10px; }
.review-row b { color: #1769d1; font-size: 10px; }
.workspace-grid { grid-column: 1 / -1; display: grid; grid-template-columns: 1.35fr 1fr; gap: 36px 44px; padding-top: 4px; }
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
  .metric-grid { grid-template-columns: repeat(2, 1fr); }
  .metric:nth-child(2) { border-right: 0; }
  .dashboard__content { grid-template-columns: 1fr; }
  .review-queue { border-left: 0; padding-left: 0; }
  .learning-row { grid-template-columns: 34px minmax(0, 1fr) 18px; }
  .learning-row__progress { display: none; }
  .workspace-grid { grid-template-columns: 1fr; }
  .panel--wide { grid-column: auto; }
  .goal-row { grid-template-columns: 1fr 44px; }
  .progress { grid-row: 2; grid-column: 1 / -1; }
  .create-form { grid-template-columns: 1fr; }
}
</style>
