<template>
  <div v-if="data" class="course-page">
    <LearningTopNav />
    <header class="course-header">
      <div class="course-header__main">
        <div>
          <h1>{{ data.course.title }}</h1>
          <p class="course-header__instructor">授课教师 <strong>{{ data.course.instructor_name }}</strong></p>
          <p>{{ data.course.description }}</p>
          <div class="course-header__facts">
            <span><CheckCircle2 :size="14" />已加入学习</span>
            <span>{{ data.summary.moduleCount }} 个单元 · {{ data.summary.lessonCount }} 个课时</span>
            <span>约 {{ data.course.estimated_hours }} 小时</span>
          </div>
        </div>
        <div class="course-header__action">
          <div class="course-progress">
            <svg viewBox="0 0 84 84" aria-hidden="true">
              <circle cx="42" cy="42" r="35"></circle>
              <circle class="course-progress__value" cx="42" cy="42" r="35" :style="{ '--progress-offset': 220 - (220 * data.summary.masteryScore / 100) }"></circle>
            </svg>
            <div><strong>{{ data.summary.masteryScore }}%</strong><span>整体掌握</span></div>
          </div>
          <button type="button" @click="continueLearning">
            {{ data.summary.completedLessons ? '继续学习' : '开始课程' }}<ArrowRight :size="18" />
          </button>
          <router-link v-if="isAdmin" :to="`/admin/courses/${courseId}`" class="course-header__studio">
            <Settings2 :size="15" />编辑课程
          </router-link>
        </div>
      </div>
    </header>

    <div class="course-layout">
      <main class="course-path">
        <div class="course-path__heading">
          <div><h2>学习路径</h2><p>{{ data.summary.completedLessons }}/{{ data.summary.lessonCount }} 课时完成</p></div>
          <button type="button" @click="toggleAllModules">{{ allModulesExpanded ? '收起' : '展开' }}<ChevronDown :size="15" :class="{ expanded: allModulesExpanded }" /></button>
        </div>

        <section v-for="(module, moduleIndex) in data.modules" :key="module.id" class="course-unit" :class="{ 'course-unit--expanded': isModuleExpanded(module.id) }" :style="{ '--unit-index': moduleIndex }">
          <header class="course-unit__header">
            <div class="course-unit__number">{{ String(moduleIndex + 1).padStart(2, '0') }}</div>
            <div><h3>{{ module.title }}</h3><p>{{ module.description }}</p></div>
            <button type="button" class="course-unit__toggle" :title="isModuleExpanded(module.id) ? '收起单元' : '展开单元'" @click="toggleModule(module.id)">
              {{ module.lessons.filter(lesson => lesson.status === 'completed').length }}/{{ module.lessons.length }}
              <ChevronDown :size="15" :class="{ expanded: isModuleExpanded(module.id) }" />
            </button>
          </header>
          <div v-show="isModuleExpanded(module.id)" class="course-unit__lessons">
            <button
              v-for="(lesson, lessonIndex) in module.lessons"
              :key="lesson.id"
              type="button"
              class="course-lesson"
              :class="{ current: lesson.id === data.summary.continueLessonId, done: lesson.status === 'completed' }"
              @click="openLesson(lesson.id)"
            >
              <span class="course-lesson__state">
                <Check v-if="lesson.status === 'completed'" :size="15" />
                <Play v-else-if="lesson.id === data.summary.continueLessonId" :size="14" fill="currentColor" />
                <span v-else>{{ moduleIndex + 1 }}.{{ lessonIndex + 1 }}</span>
              </span>
              <span class="course-lesson__body"><strong>{{ lesson.title }}</strong><small>{{ lesson.summary }}</small></span>
              <span class="course-lesson__type">
                <MousePointer2 v-if="lesson.type === 'interactive'" :size="14" />
                <BookOpen v-else-if="lesson.type === 'reading'" :size="14" />
                <ClipboardCheck v-else :size="14" />
                {{ lessonTypeLabel(lesson.type) }}
              </span>
              <span class="course-lesson__time">{{ lesson.estimatedMinutes }} 分</span>
              <ArrowRight :size="16" class="course-lesson__arrow" />
            </button>
          </div>
        </section>
      </main>

      <aside class="course-aside">
        <section class="today-review">
          <header><span>今日复习</span><RotateCcw :size="17" /></header>
          <strong>{{ data.summary.dueReviewCount }}</strong>
          <p>{{ data.summary.dueReviewCount ? '知识点已到复习时间' : '今天没有到期的复习' }}</p>
          <router-link v-if="data.summary.dueReviewCount" to="/skills">开始复习<ArrowRight :size="14" /></router-link>
        </section>

        <section class="mastery-panel">
          <header><h2>知识掌握分布</h2><span>{{ data.mastery.length }} 个知识点</span></header>
          <div v-for="level in masteryLevels" :key="level.key" class="mastery-row">
            <span>{{ level.label }}</span>
            <i><b :style="{ width: masteryWidth(level.key) }" :class="`bar-${level.key}`"></b></i>
            <strong>{{ data.summary.masteryDistribution[level.key] || 0 }}</strong>
          </div>
        </section>

        <section class="evidence-panel">
          <header><h2>最近的掌握证据</h2></header>
          <div v-for="point in recentEvidence" :key="point.id" class="evidence-row">
            <span :class="`evidence-row__dot level-${point.level}`"></span>
            <div><strong>{{ point.title }}</strong><small>{{ point.evidence_count }} 条证据 · {{ masteryLabel(point.level) }}</small></div>
            <b>{{ point.score }}</b>
          </div>
          <p v-if="recentEvidence.length === 0" class="evidence-panel__empty">完成互动题后，这里会显示你的掌握变化。</p>
        </section>
      </aside>
    </div>
  </div>
  <LoadingSpinner v-else :show="true" />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ClipboardCheck, MousePointer2, Play, RotateCcw, Settings2 } from 'lucide-vue-next'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import LearningTopNav from '../components/course/LearningTopNav.vue'
import { useRequest } from '../composables/useRequest'
import { useStorage } from '../composables/useStorage'

const route = useRoute()
const router = useRouter()
const { get, post } = useRequest()
const { get: storageGet } = useStorage()
const data = ref(null)
const expandedModules = ref(new Set())
const courseId = computed(() => Number(route.params.id))
const isAdmin = computed(() => storageGet('userInfo')?.accountType === 'admin')
const masteryLevels = [
  { key: 'initial', label: '初识' },
  { key: 'familiar', label: '熟悉' },
  { key: 'proficient', label: '熟练' },
  { key: 'mastered', label: '掌握' }
]
const recentEvidence = computed(() => data.value?.mastery.filter(point => point.evidence_count > 0).sort((a, b) => b.evidence_count - a.evidence_count).slice(0, 5) || [])
const allModulesExpanded = computed(() => data.value?.modules.length > 0 && data.value.modules.every(module => expandedModules.value.has(module.id)))

function lessonTypeLabel(type) {
  return { interactive: '互动', reading: '阅读', quiz: '小测', reflection: '反思' }[type] || '课时'
}
function masteryLabel(level) {
  return masteryLevels.find(item => item.key === level)?.label || '初识'
}
function masteryWidth(level) {
  const total = Math.max(1, data.value.mastery.length)
  return `${(data.value.summary.masteryDistribution[level] || 0) / total * 100}%`
}
function openLesson(id) { router.push(`/skills/${courseId.value}/lessons/${id}`) }
function isModuleExpanded(id) { return expandedModules.value.has(id) }
function toggleModule(id) {
  const next = new Set(expandedModules.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedModules.value = next
}
function toggleAllModules() {
  expandedModules.value = allModulesExpanded.value ? new Set() : new Set(data.value.modules.map(module => module.id))
}
function continueLearning() {
  if (data.value.summary.continueLessonId) openLesson(data.value.summary.continueLessonId)
}

onMounted(async () => {
  try { await post(`/skills/${courseId.value}/enroll`, {}) } catch {}
  data.value = await get(`/skills/${courseId.value}/learning`)
  const activeModule = data.value.modules.find(module => module.lessons.some(lesson => lesson.id === data.value.summary.continueLessonId))
  expandedModules.value = new Set([activeModule?.id || data.value.modules[0]?.id].filter(Boolean))
})
</script>

<style scoped>
.course-page { min-height: 100vh; background: #fff; color: #1d211e; }
.course-header { padding: 24px 36px 27px; border-bottom: 1px solid #dfe3df; background: #fff; }
.course-header__main { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 54px; max-width: 1160px; margin: 0 auto; }
.course-header h1 { font-size: 32px; line-height: 1.18; font-weight: 760; letter-spacing: 0; }
.course-header__main > div > p:not(.course-header__instructor) { max-width: 720px; margin-top: 12px; color: #3f4741; font-size: 13px; line-height: 1.7; }
.course-header__instructor { margin-top: 13px; color: #505851; font-size: 12px; }
.course-header__instructor strong { margin-left: 8px; color: #1769d1; }
.course-header__facts { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 17px; color: #656d66; font-size: 10px; }
.course-header__facts span { display: inline-flex; align-items: center; gap: 6px; }
.course-header__action { display: grid; grid-template-columns: 86px 1fr; align-content: center; gap: 10px 14px; }
.course-progress { position: relative; display: grid; place-items: center; width: 86px; height: 86px; }
.course-progress svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.course-progress circle { fill: none; stroke: #e5e8e4; stroke-width: 8; }
.course-progress .course-progress__value { stroke: #159447; stroke-linecap: round; stroke-dasharray: 220; stroke-dashoffset: var(--progress-offset); transition: stroke-dashoffset 600ms cubic-bezier(.16,1,.3,1); }
.course-progress div { z-index: 1; display: grid; text-align: center; }
.course-progress strong { font-size: 17px; }
.course-progress span { color: #7a817b; font-size: 9px; }
.course-header__action > button { align-self: end; display: flex; align-items: center; justify-content: space-between; min-height: 46px; padding: 0 16px; border: 0; background: #159447; color: #fff; font-weight: 750; cursor: pointer; }
.course-header__action > button:hover { background: #0f7b39; }
.course-header__studio { grid-column: 2; display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 30px; border: 1px solid #d5d9d5; color: #4d544e; font-size: 11px; }
.course-layout { display: grid; grid-template-columns: minmax(0, 780px) 280px; gap: 38px; max-width: 1160px; margin: 0 auto; padding: 24px 28px 80px; }
.course-path__heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; }
.course-path__heading > div { display: flex; align-items: baseline; gap: 12px; }
.course-path__heading h2 { font-size: 17px; }
.course-path__heading p { color: #747b75; font-size: 9px; }
.course-path__heading > button { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: #747b75; font-size: 10px; cursor: pointer; }
.course-path__heading > button svg { transition: transform 180ms; }
.course-path__heading > button svg.expanded { transform: rotate(180deg); }
.course-unit { position: relative; margin-bottom: 12px; border: 1px solid #dce0dc; border-radius: 6px; background: #fff; overflow: hidden; animation: course-unit-in 440ms cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--unit-index) * 45ms); }
.course-unit--expanded::after { position: absolute; z-index: 1; left: 26px; top: 43px; bottom: 14px; width: 1px; background: #159447; content: ''; }
.course-unit__header { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 3px 20px; min-height: 58px; padding: 11px 14px 10px 50px; background: #fbfcfb; }
.course-unit__number { position: absolute; z-index: 2; left: 12px; top: 13px; display: grid; place-items: center; width: 29px; height: 29px; border-radius: 50%; background: #159447; color: #fff; font-size: 10px; }
.course-unit__header h3 { font-size: 13px; }
.course-unit__header p { margin-top: 3px; color: #777e78; font-size: 9px; }
.course-unit__toggle { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: #777e78; font-size: 9px; cursor: pointer; }
.course-unit__toggle svg { transition: transform 180ms; }
.course-unit__toggle svg.expanded { transform: rotate(180deg); }
.course-unit__lessons { border-top: 1px solid #e3e6e3; padding-left: 35px; }
.course-lesson { display: grid; grid-template-columns: 30px minmax(0, 1fr) 68px 43px 18px; align-items: center; gap: 10px; width: 100%; min-height: 58px; padding: 8px 13px 8px 0; border: 0; border-bottom: 1px solid #e7e9e7; background: #fff; color: #2d332e; text-align: left; cursor: pointer; transition: background 140ms, transform 140ms; }
.course-lesson:last-child { border-bottom: 0; }
.course-lesson:hover { z-index: 1; background: #f7f9f7; transform: translateX(2px); }
.course-lesson.current { background: #edf7f0; }
.course-lesson__state { display: grid; place-items: center; width: 29px; height: 29px; border: 1px solid #cfd4cf; color: #7e857f; font-family: var(--font-mono); font-size: 9px; }
.course-lesson.current .course-lesson__state, .course-lesson.done .course-lesson__state { border-color: #159447; background: #159447; color: #fff; }
.course-lesson__body { display: grid; gap: 4px; min-width: 0; }
.course-lesson__body strong { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.course-lesson__body small { overflow: hidden; color: #858b86; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.course-lesson__type { display: inline-flex; align-items: center; gap: 5px; color: #656c66; font-size: 10px; }
.course-lesson__time { color: #939994; font-family: var(--font-mono); font-size: 9px; }
.course-lesson__arrow { color: #a1a6a1; }
.course-aside { align-self: start; display: grid; gap: 11px; }
.course-aside section { padding: 17px; border: 1px solid #dce0dc; border-radius: 6px; background: #fff; }
.today-review header, .mastery-panel header, .evidence-panel header { display: flex; align-items: center; justify-content: space-between; }
.today-review header span, .mastery-panel h2, .evidence-panel h2 { font-size: 12px; font-weight: 750; }
.today-review header svg { color: #1769d1; }
.today-review > strong { display: block; margin-top: 15px; font-family: var(--font-mono); font-size: 38px; line-height: 1; }
.today-review p { margin-top: 6px; color: #777e78; font-size: 11px; }
.today-review a { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; color: #1769d1; font-size: 11px; font-weight: 700; }
.mastery-panel header span { color: #858b86; font-family: var(--font-mono); font-size: 9px; }
.mastery-row { display: grid; grid-template-columns: 34px 1fr 22px; align-items: center; gap: 9px; margin-top: 14px; }
.mastery-row > span { font-size: 10px; }
.mastery-row i { height: 5px; background: #e7e9e6; }
.mastery-row b { display: block; height: 100%; min-width: 2px; }
.mastery-row .bar-initial { background: #83a8d9; }
.mastery-row .bar-familiar { background: #1769d1; }
.mastery-row .bar-proficient { background: #ef6a4b; }
.mastery-row .bar-mastered { background: #159447; }
.mastery-row strong { color: #727973; font-family: var(--font-mono); font-size: 9px; text-align: right; }
.evidence-row { display: grid; grid-template-columns: 7px 1fr auto; gap: 9px; align-items: center; margin-top: 15px; }
.evidence-row__dot { width: 7px; height: 7px; border-radius: 50%; }
.evidence-row__dot.level-initial { background: #83a8d9; }
.evidence-row__dot.level-familiar { background: #1769d1; }
.evidence-row__dot.level-proficient { background: #ef6a4b; }
.evidence-row__dot.level-mastered { background: #159447; }
.evidence-row div { display: grid; gap: 2px; }
.evidence-row strong { font-size: 10px; }
.evidence-row small { color: #858b86; font-size: 9px; }
.evidence-row > b { font-family: var(--font-mono); font-size: 10px; }
.evidence-panel__empty { margin-top: 14px; color: #858b86; font-size: 10px; line-height: 1.6; }
@keyframes course-unit-in { from { opacity: 0; transform: translateY(9px); } }
@media (prefers-reduced-motion: reduce) {
  .course-unit { animation: none; }
}
@media (max-width: 980px) {
  .course-header { padding-right: 22px; padding-left: 22px; }
  .course-header__main { grid-template-columns: minmax(0, 1fr) 210px; gap: 24px; }
  .course-layout { grid-template-columns: minmax(0, 1fr) 180px; gap: 16px; padding: 20px 16px 60px; }
  .course-header__action { grid-template-columns: 76px 1fr; gap: 9px; }
  .course-progress { width: 76px; height: 76px; }
  .course-header__action > button { padding: 0 11px; font-size: 11px; }
  .course-aside { gap: 9px; }
  .course-aside section { padding: 13px; }
}
@media (max-width: 720px) {
  .course-header { padding: 22px 20px 28px; }
  .course-header__main { grid-template-columns: 1fr; gap: 24px; }
  .course-header h1 { font-size: 32px; }
  .course-header__action { grid-template-columns: 76px 1fr; }
  .course-progress { width: 76px; height: 76px; }
  .course-progress::before { width: 62px; height: 62px; }
  .course-layout { grid-template-columns: 1fr; padding: 34px 16px 60px; }
  .course-unit__header { padding-left: 48px; }
  .course-unit__number { left: 11px; }
  .course-lesson { grid-template-columns: 32px 1fr 18px; }
  .course-lesson__type, .course-lesson__time { display: none; }
  .course-aside { grid-template-columns: 1fr; gap: 0; }
}
</style>
