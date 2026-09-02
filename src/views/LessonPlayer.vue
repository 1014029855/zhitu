<template>
  <div v-if="data" class="lesson-player">
    <header class="lesson-topbar">
      <button class="icon-button lesson-topbar__menu" type="button" title="打开课程目录" @click="outlineOpen = true">
        <PanelLeft :size="19" />
      </button>
      <router-link :to="`/skills/${courseId}`" class="lesson-topbar__brand">知途</router-link>
      <span class="lesson-topbar__divider"></span>
      <div class="lesson-topbar__crumb">
        <strong>{{ data.course.title }}</strong>
        <span>单元 {{ currentModuleIndex + 1 }}</span>
        <ChevronRight :size="14" />
        <span>{{ data.lesson.moduleTitle }}</span>
        <ChevronRight :size="14" />
        <span>{{ currentLessonNumber }} {{ data.lesson.title }}</span>
      </div>
      <div class="lesson-topbar__progress">
        <span>课程 {{ data.courseSummary.progress || 0 }}%</span>
        <i><b :style="{ width: `${data.courseSummary.progress || 0}%` }"></b></i>
      </div>
      <router-link :to="`/skills/${courseId}`" class="lesson-topbar__exit" title="退出课时"><LogOut :size="18" /><span>退出</span></router-link>
    </header>

    <div class="lesson-shell">
      <div v-if="outlineOpen" class="outline-backdrop" @click="outlineOpen = false"></div>
      <aside class="lesson-outline" :class="{ 'lesson-outline--open': outlineOpen }">
        <div class="lesson-outline__mobile-head">
          <strong>课程目录</strong>
          <button class="icon-button" type="button" title="关闭目录" @click="outlineOpen = false"><X :size="18" /></button>
        </div>
        <section v-for="(module, moduleIndex) in data.outline" :key="module.id" class="outline-module">
          <header>
            <span>单元 {{ moduleIndex + 1 }}</span>
            <strong>{{ module.title }}</strong>
          </header>
          <button
            v-for="(lesson, lessonIndex) in module.lessons"
            :key="lesson.id"
            type="button"
            class="outline-lesson"
            :class="{ active: lesson.id === data.lesson.id, done: lesson.status === 'completed' }"
            @click="openLesson(lesson.id)"
          >
            <CheckCircle2 v-if="lesson.status === 'completed'" :size="15" />
            <PlayCircle v-else-if="lesson.id === data.lesson.id" :size="15" />
            <Circle v-else :size="15" />
            <span>{{ moduleIndex + 1 }}.{{ lessonIndex + 1 }} {{ lesson.title }}</span>
            <small>{{ lesson.estimatedMinutes }} 分</small>
          </button>
        </section>
      </aside>

      <main class="lesson-content" :class="{ 'lesson-content--interactive': data.lesson.type === 'interactive' }">
        <header v-if="data.lesson.type !== 'interactive'" class="lesson-heading">
          <span class="lesson-heading__type">{{ lessonTypeLabel(data.lesson.type) }}</span>
          <h1>{{ data.lesson.title }}</h1>
          <p>{{ data.lesson.summary }}</p>
          <div class="lesson-heading__meta">
            <span><Clock3 :size="15" />{{ data.lesson.estimatedMinutes }} 分钟</span>
            <span><BookOpenCheck :size="15" />{{ activityCount }} 个互动</span>
          </div>
        </header>

        <div class="lesson-stream">
          <template v-for="item in displayContent" :key="`${item.kind}-${item.id}`">
            <section v-if="item.kind === 'block' && item.type === 'scenario'" class="lesson-scenario">
              <span>{{ item.content.eyebrow || '情境' }}</span>
              <h2>{{ item.content.title }}</h2>
              <p>{{ item.content.body }}</p>
            </section>

            <section v-else-if="item.kind === 'block' && ['text', 'explanation', 'reflection'].includes(item.type)" class="lesson-reading">
              <h2 v-if="item.content.title">{{ item.content.title }}</h2>
              <p>{{ item.content.body }}</p>
            </section>

            <section v-else-if="item.kind === 'block' && item.type === 'key_points'" class="lesson-keypoints">
              <span>小结</span>
              <h2>{{ item.content.title || '带走这些要点' }}</h2>
              <ul>
                <li v-for="point in item.content.items" :key="point">{{ point }}</li>
              </ul>
            </section>

            <ActivityRenderer
              v-else-if="item.kind === 'activity'"
              :ref="element => setActivityRef(element, item.id)"
              :activity="item"
              :external-controls="data.lesson.type === 'interactive'"
              @attempted="handleAttempt"
              @state-change="handleActivityState"
            />
          </template>
        </div>

        <section v-if="data.lesson.type !== 'interactive' || allRequiredSolved" class="lesson-notebook" id="lesson-notebook">
          <header>
            <div><span><NotebookPen :size="16" />学习记录</span><h2>把理解变成自己的语言</h2></div>
            <small>{{ noteSavedLabel }}</small>
          </header>
          <div class="lesson-notebook__tabs" role="tablist" aria-label="学习记录类型">
            <button v-for="tab in noteTabs" :key="tab.key" type="button" :class="{ active: noteTab === tab.key }" @click="noteTab = tab.key">{{ tab.label }}</button>
          </div>
          <textarea v-model="noteForm[noteTab]" rows="5" :placeholder="notePlaceholder"></textarea>
          <footer>
            <div class="confidence-control">
              <span>现在能独立解释吗</span>
              <button v-for="level in 4" :key="level" type="button" :class="{ active: noteForm.confidence === level }" @click="noteForm.confidence = level">{{ level }}</button>
            </div>
            <button type="button" class="lesson-notebook__save" :disabled="noteSaving" @click="saveNote">
              <LoaderCircle v-if="noteSaving" :size="15" class="spin" /><Save v-else :size="15" />{{ noteSaving ? '保存中' : '保存学习记录' }}
            </button>
          </footer>
        </section>

        <div v-if="data.lesson.type !== 'interactive'" class="lesson-finish">
          <div>
            <span>{{ allRequiredSolved ? '本课时的必做活动已通过' : `还需通过 ${remainingActivities} 个必做活动` }}</span>
            <strong>{{ allRequiredSolved ? '可以完成课时并继续了' : '完成判断后再进入下一课' }}</strong>
          </div>
          <button type="button" :disabled="!allRequiredSolved || completing" @click="completeCurrentLesson">
            {{ completing ? '正在保存' : isLastLesson ? '完成课程' : '完成并继续' }}
            <ArrowRight :size="18" />
          </button>
        </div>
      </main>

      <aside class="lesson-mastery">
        <section>
          <div class="lesson-mastery__title">
            <h2>掌握程度</h2>
            <span title="掌握度由作答证据计算">i</span>
          </div>
          <div class="mastery-ladder">
            <div v-for="(level, index) in masteryLevels" :key="level.key" :class="{ active: currentMasteryLevel === level.key }">
              <b>{{ index + 1 }}</b>
              <span><strong>{{ level.label }}</strong><small>{{ level.description }}</small></span>
            </div>
          </div>
        </section>
        <section>
          <h2>当前知识点</h2>
          <div v-if="data.mastery.length" class="knowledge-list">
            <div v-for="point in data.mastery" :key="point.id">
              <span>{{ point.title }}</span>
              <b :class="`level-${point.level}`">{{ masteryLabel(point.level) }}</b>
              <i><em :style="{ width: `${point.score}%` }"></em></i>
            </div>
          </div>
          <p v-else class="lesson-mastery__empty">阅读完成后会记录学习进度。</p>
        </section>
        <section>
          <div class="lesson-mastery__title"><h2>本题使用的证据</h2><strong>{{ currentActivityState.answered }}/{{ currentActivityState.total }}</strong></div>
          <p class="lesson-mastery__empty">每次判断都会进入掌握度计算。</p>
        </section>
        <section>
          <h2>下一次复习</h2>
          <div class="review-date"><CalendarDays :size="18" /><div><strong>{{ nextReviewLabel }}</strong><span>基于间隔复习算法</span></div></div>
        </section>
        <section>
          <h2>本次学习进度</h2>
          <div class="session-progress"><i><em :style="{ width: `${sessionProgress}%` }"></em></i><span>已通过 {{ solvedActivities }} / {{ activityCount }} 个活动</span></div>
        </section>
        <section class="lesson-note-summary">
          <div class="lesson-mastery__title"><h2>学习记录</h2><strong>{{ noteCompletion }}/3</strong></div>
          <p class="lesson-mastery__empty">解释、例子和疑问会跟随这个课时保存。</p>
          <button
            type="button"
            :disabled="data.lesson.type === 'interactive' && !allRequiredSolved"
            @click="scrollToNotebook"
          >
            <NotebookPen :size="15" />
            {{ data.lesson.type === 'interactive' && !allRequiredSolved ? '完成互动后记录' : noteCompletion ? '继续整理' : '开始记录' }}
          </button>
        </section>
      </aside>
    </div>

    <nav class="lesson-bottom-nav" :class="{ 'lesson-bottom-nav--interactive': data.lesson.type === 'interactive' }">
      <button type="button" :disabled="!previousLesson" @click="openLesson(previousLesson?.id)"><ArrowLeft :size="18" />上一课</button>
      <template v-if="data.lesson.type === 'interactive' && activeActivity">
        <button type="button" class="lesson-bottom-nav__analysis" :disabled="!currentActivityState.hasFeedback" @click="scrollToFeedback">
          <BookOpenCheck :size="17" />查看解析
        </button>
        <button type="button" class="lesson-bottom-nav__check" :disabled="!primaryActionEnabled" @click="performPrimaryAction">
          <LoaderCircle v-if="currentActivityState.submitting" :size="18" class="spin" />
          <Check v-else :size="18" />{{ primaryActionLabel }}
        </button>
      </template>
      <span v-else>{{ currentLessonIndex + 1 }} / {{ flatLessons.length }}</span>
      <button type="button" :disabled="!nextLesson || (data.lesson.type === 'interactive' && !allRequiredSolved)" @click="openLesson(nextLesson?.id)">下一课<ArrowRight :size="18" /></button>
    </nav>
  </div>

  <div v-else-if="error" class="lesson-error">
    <h1>这个课时暂时打不开</h1>
    <p>{{ error }}</p>
    <router-link :to="`/skills/${courseId}`">返回课程</router-link>
  </div>
  <LoadingSpinner v-else :show="true" />
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, BookOpenCheck, CalendarDays, Check, CheckCircle2, ChevronRight, Circle, Clock3, LoaderCircle, LogOut, NotebookPen, PanelLeft, PlayCircle, Save, X } from 'lucide-vue-next'
import ActivityRenderer from '../components/course/ActivityRenderer.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useRequest } from '../composables/useRequest'

const route = useRoute()
const router = useRouter()
const { get, post, put } = useRequest()
const data = ref(null)
const error = ref('')
const outlineOpen = ref(false)
const completing = ref(false)
const currentActivityId = ref(null)
const activeActivityRef = ref(null)
const activityStates = ref({})
const noteTab = ref('explanation')
const noteSaving = ref(false)
const noteSavedAt = ref(null)
const noteForm = reactive({ explanation: '', example: '', question: '', confidence: 1 })
const noteTabs = [
  { key: 'explanation', label: '我的解释' },
  { key: 'example', label: '我的例子' },
  { key: 'question', label: '仍然疑惑' }
]

const courseId = computed(() => Number(route.params.courseId))
const flatLessons = computed(() => data.value?.outline.flatMap(module => module.lessons) || [])
const currentLessonIndex = computed(() => flatLessons.value.findIndex(lesson => lesson.id === data.value?.lesson.id))
const currentModuleIndex = computed(() => data.value?.outline.findIndex(module => module.lessons.some(lesson => lesson.id === data.value?.lesson.id)) ?? 0)
const currentLessonNumber = computed(() => {
  const module = data.value?.outline[currentModuleIndex.value]
  const lessonIndex = module?.lessons.findIndex(lesson => lesson.id === data.value?.lesson.id) ?? 0
  return `${currentModuleIndex.value + 1}.${lessonIndex + 1}`
})
const previousLesson = computed(() => flatLessons.value[currentLessonIndex.value - 1] || null)
const nextLesson = computed(() => flatLessons.value[currentLessonIndex.value + 1] || null)
const isLastLesson = computed(() => currentLessonIndex.value === flatLessons.value.length - 1)
const activities = computed(() => data.value?.content.filter(item => item.kind === 'activity') || [])
const activeActivity = computed(() => activities.value.find(item => item.id === currentActivityId.value) || activities.value.find(item => !item.solved) || activities.value[0] || null)
const displayContent = computed(() => {
  const content = data.value?.content || []
  if (data.value?.lesson.type !== 'interactive') return content
  const scenarios = content.filter(item => item.kind === 'block' && item.type === 'scenario')
  const explanation = content.filter(item => item.kind === 'block' && item.type !== 'scenario')
  return [...scenarios, ...(activeActivity.value ? [activeActivity.value] : []), ...(allRequiredSolved.value ? explanation : [])]
})
const activityCount = computed(() => activities.value.length)
const solvedActivities = computed(() => activities.value.filter(item => item.solved).length)
const requiredActivities = computed(() => activities.value.filter(item => item.isRequired))
const remainingActivities = computed(() => requiredActivities.value.filter(item => !item.solved).length)
const allRequiredSolved = computed(() => remainingActivities.value === 0)
const currentActivityState = computed(() => activityStates.value[activeActivity.value?.id] || {
  canSubmit: false,
  submitting: false,
  solved: Boolean(activeActivity.value?.solved),
  hasFeedback: false,
  answered: 0,
  total: activeActivity.value?.type === 'classify' ? activeActivity.value.config.items?.length || 0 : 1
})
const sessionProgress = computed(() => activityCount.value ? Math.round(solvedActivities.value / activityCount.value * 100) : 0)
const noteCompletion = computed(() => ['explanation', 'example', 'question'].filter(key => noteForm[key].trim()).length)
const notePlaceholder = computed(() => ({
  explanation: `不用照抄课文，用自己的话解释“${data.value?.lesson.title || '这个概念'}”。`,
  example: '写一个没在课文中出现的例子，并说明它为什么符合这个概念。',
  question: '哪一步还说不清？把具体卡点写下来，复习时会更有用。'
}[noteTab.value]))
const noteSavedLabel = computed(() => noteSavedAt.value ? `已保存 ${noteSavedAt.value}` : data.value?.note?.updated_at ? '已有学习记录' : '尚未保存')
const nextReviewLabel = computed(() => {
  const dates = data.value?.mastery.map(point => point.next_review_at).filter(Boolean).sort() || []
  if (!dates.length) return '完成本题后安排'
  return new Date(`${dates[0]}Z`).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
})
const nextPendingActivity = computed(() => {
  const index = activities.value.findIndex(item => item.id === activeActivity.value?.id)
  return activities.value.slice(index + 1).find(item => !item.solved) || activities.value.slice(0, Math.max(0, index)).find(item => !item.solved) || null
})
const primaryActionEnabled = computed(() => currentActivityState.value.solved || (currentActivityState.value.canSubmit && !currentActivityState.value.submitting))
const primaryActionLabel = computed(() => {
  if (currentActivityState.value.submitting) return '正在判断'
  if (currentActivityState.value.solved) return nextPendingActivity.value ? '继续下一题' : '完成课时'
  return currentActivityState.value.hasFeedback ? '再次检查' : '检查答案'
})
const averageMastery = computed(() => {
  if (!data.value?.mastery.length) return 0
  return Math.round(data.value.mastery.reduce((sum, item) => sum + item.score, 0) / data.value.mastery.length)
})
const currentMasteryLevel = computed(() => averageMastery.value >= 85 ? 'mastered' : averageMastery.value >= 60 ? 'proficient' : averageMastery.value >= 30 ? 'familiar' : 'initial')
const masteryLevels = [
  { key: 'initial', label: '初识', description: '了解基本概念' },
  { key: 'familiar', label: '熟悉', description: '能识别与描述' },
  { key: 'proficient', label: '熟练', description: '能应用与解释' },
  { key: 'mastered', label: '掌握', description: '能迁移与评估' }
]

function masteryLabel(level) {
  return masteryLevels.find(item => item.key === level)?.label || '初识'
}
function lessonTypeLabel(type) {
  return { interactive: '互动课时', reading: '概念课时', quiz: '单元挑战', reflection: '反思练习' }[type] || '课时'
}
function openLesson(id) {
  if (!id) return
  outlineOpen.value = false
  router.push(`/skills/${courseId.value}/lessons/${id}`)
}

async function loadLesson() {
  data.value = null
  error.value = ''
  try {
    data.value = await get(`/skills/${courseId.value}/lessons/${route.params.lessonId}`)
    const firstPending = data.value.content.find(item => item.kind === 'activity' && !item.solved)
    const firstActivity = data.value.content.find(item => item.kind === 'activity')
    currentActivityId.value = firstPending?.id || firstActivity?.id || null
    activityStates.value = {}
    Object.assign(noteForm, {
      explanation: data.value.note?.explanation || '',
      example: data.value.note?.example || '',
      question: data.value.note?.question || '',
      confidence: data.value.note?.confidence || 1
    })
    noteSavedAt.value = null
    window.scrollTo({ top: 0, behavior: 'instant' })
    await nextTick()
    const outline = document.querySelector('.lesson-outline')
    const activeLesson = outline?.querySelector('.outline-lesson.active')
    if (outline && activeLesson) {
      outline.scrollTop = Math.max(0, activeLesson.offsetTop - outline.clientHeight / 2 + activeLesson.offsetHeight / 2)
    }
  } catch (requestError) {
    error.value = requestError.response?.data?.message || '请从课程主页重新进入。'
  }
}

function setActivityRef(element, activityId) {
  if (activityId === activeActivity.value?.id) activeActivityRef.value = element
}

function handleActivityState(state) {
  activityStates.value = { ...activityStates.value, [state.activityId]: state }
}

function scrollToFeedback() {
  document.querySelector('.feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function scrollToNotebook() {
  document.querySelector('#lesson-notebook')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function saveNote() {
  if (noteSaving.value) return
  noteSaving.value = true
  try {
    const note = await put(`/learning/lessons/${data.value.lesson.id}/note`, noteForm)
    data.value.note = note
    noteSavedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } finally {
    noteSaving.value = false
  }
}

async function performPrimaryAction() {
  if (currentActivityState.value.solved) {
    if (nextPendingActivity.value) {
      currentActivityId.value = nextPendingActivity.value.id
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      await completeCurrentLesson()
    }
    return
  }
  activeActivityRef.value?.submit()
}

function handleAttempt(result) {
  const activity = activities.value.find(item => item.id === result.activityId)
  if (activity && result.attempt.correct) activity.solved = true
  if (result.mastery) {
    const point = data.value.mastery.find(item => item.id === result.mastery.knowledge_point_id)
    if (point) Object.assign(point, {
      score: result.mastery.score,
      level: result.mastery.level,
      evidence_count: result.mastery.evidence_count,
      next_review_at: result.mastery.next_review_at
    })
  }
}

async function completeCurrentLesson() {
  if (!allRequiredSolved.value || completing.value) return
  completing.value = true
  try {
    const result = await post(`/skills/${courseId.value}/lessons/${data.value.lesson.id}/complete`, {})
    if (result.nextLesson) openLesson(result.nextLesson.id)
    else router.push(`/skills/${courseId.value}`)
  } finally {
    completing.value = false
  }
}

watch(() => route.params.lessonId, (next, previous) => { if (next && next !== previous) loadLesson() })
onMounted(loadLesson)
</script>

<style scoped>
.lesson-player { --outline-width: clamp(270px, 19.7vw, 304px); --mastery-width: clamp(270px, 19vw, 292px); min-height: 100vh; background: #fff; color: #1d211e; }
.lesson-topbar { position: sticky; top: 0; z-index: 40; display: grid; grid-template-columns: auto 1px minmax(0, 1fr) auto auto; align-items: center; gap: 16px; height: 60px; padding: 0 24px; border-bottom: 1px solid #dfe2de; background: rgba(255,255,255,.98); backdrop-filter: blur(8px); }
.lesson-topbar__brand { color: #171b18; font-family: var(--font-brand); font-size: 26px; font-weight: 800; }
.lesson-topbar__divider { height: 22px; background: #dfe2de; }
.lesson-topbar__crumb { display: flex; align-items: center; gap: 11px; min-width: 0; }
.lesson-topbar__crumb strong { font-size: 13px; }
.lesson-topbar__crumb span { overflow: hidden; color: #6b716c; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.lesson-topbar__crumb span:last-child { color: #159447; }
.lesson-topbar__progress { display: flex; align-items: center; gap: 10px; color: #606761; font-family: var(--font-mono); font-size: 11px; }
.lesson-topbar__progress i { width: 120px; height: 4px; background: #e7e9e6; }
.lesson-topbar__progress b { display: block; height: 100%; background: #159447; transition: width 500ms; }
.icon-button { display: grid; place-items: center; width: 36px; height: 36px; border: 0; background: transparent; color: #2b302c; cursor: pointer; }
.icon-button:hover { background: #f0f2ef; color: #151916; }
.lesson-topbar__exit { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 5px; color: #2b302c; font-size: 11px; }
.lesson-topbar__menu { display: none; }
.lesson-shell { display: grid; grid-template-columns: var(--outline-width) minmax(620px, 1fr) var(--mastery-width); min-height: calc(100vh - 60px); }
.lesson-outline { position: sticky; top: 60px; align-self: start; height: calc(100vh - 60px); overflow-y: auto; border-right: 1px solid #e0e3df; background: #fbfcfb; }
.lesson-outline__mobile-head { display: none; }
.outline-module { border-bottom: 1px solid #e3e6e2; padding: 15px 0; }
.outline-module header { display: grid; gap: 4px; padding: 0 18px 10px; }
.outline-module header span { color: #7d837e; font-family: var(--font-mono); font-size: 9px; text-transform: none; }
.outline-module header strong { font-size: 14px; line-height: 1.4; }
.outline-lesson { display: grid; grid-template-columns: 15px 1fr auto; align-items: start; gap: 9px; width: 100%; min-height: 49px; padding: 11px 15px 10px 19px; border: 0; border-left: 3px solid transparent; background: transparent; color: #555d56; text-align: left; cursor: pointer; }
.outline-lesson span { font-size: 12px; line-height: 1.45; }
.outline-lesson small { color: #a0a5a0; font-family: var(--font-mono); font-size: 9px; white-space: nowrap; }
.outline-lesson:hover { background: #f0f3ef; color: #202521; }
.outline-lesson.active { border-left-color: #159447; background: #edf7f0; color: #0f6c34; font-weight: 700; }
.outline-lesson.done svg { color: #159447; }
.lesson-content { min-width: 0; padding: 34px 36px 112px; }
.lesson-content--interactive { padding-top: 30px; }
.lesson-heading { max-width: 740px; margin: 0 auto 26px; }
.lesson-heading__type { display: inline-block; margin-bottom: 9px; color: #1769d1; font-size: 10px; font-weight: 750; }
.lesson-heading h1 { max-width: 680px; font-size: 28px; line-height: 1.22; font-weight: 760; letter-spacing: 0; }
.lesson-heading > p { max-width: 650px; margin-top: 9px; color: #626963; font-size: 13px; line-height: 1.65; }
.lesson-heading__meta { display: flex; gap: 20px; margin-top: 13px; color: #727873; font-size: 10px; }
.lesson-heading__meta span { display: inline-flex; align-items: center; gap: 6px; }
.lesson-stream { display: grid; gap: 20px; max-width: 870px; margin: 0 auto; }
.lesson-content--interactive .lesson-heading { padding-bottom: 19px; border-bottom: 1px solid #e2e5e1; }
.lesson-scenario { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 18px; padding: 2px 0 15px; }
.lesson-scenario > span, .lesson-keypoints > span { display: inline-block; padding: 3px 7px; border-radius: 3px; background: #2f72e6; color: #fff; font-size: 10px; font-weight: 700; }
.lesson-scenario h2 { grid-column: 2; grid-row: 1; margin: 0; font-size: 14px; line-height: 1.55; }
.lesson-scenario p { grid-column: 2; margin: -2px 0 0; color: #3c443e; font-size: 13px; line-height: 1.75; white-space: pre-line; }
.lesson-content--interactive .lesson-scenario h2 { display: none; }
.lesson-content--interactive .lesson-scenario p { grid-row: 1; max-width: 560px; margin-top: 0; }
.lesson-keypoints h2, .lesson-reading h2 { margin-top: 8px; font-size: 19px; line-height: 1.4; }
.lesson-reading p { margin-top: 9px; color: #414842; font-size: 14px; line-height: 1.9; white-space: pre-line; }
.lesson-reading { padding: 4px 0; }
.lesson-keypoints { padding: 22px 24px; border: 1px solid #dce2dc; background: #fbfcfb; }
.lesson-keypoints > span { color: #13723a; }
.lesson-keypoints ul { display: grid; gap: 9px; margin-top: 15px; padding: 0; list-style: none; }
.lesson-keypoints li { position: relative; padding-left: 18px; color: #424943; font-size: 13px; line-height: 1.6; }
.lesson-keypoints li::before { position: absolute; left: 0; top: 8px; width: 6px; height: 6px; background: #159447; content: ''; }
.lesson-notebook { display: grid; gap: 14px; max-width: 740px; margin: 32px auto 0; padding: 22px 0 0; border-top: 1px solid #dfe3df; }
.lesson-notebook > header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.lesson-notebook > header span { display: inline-flex; align-items: center; gap: 7px; color: #1769d1; font-size: 10px; font-weight: 750; }
.lesson-notebook > header h2 { margin-top: 5px; font-size: 17px; }
.lesson-notebook > header small { color: #838a84; font: 9px var(--font-mono); }
.lesson-notebook__tabs { display: flex; border-bottom: 1px solid #dfe3df; }
.lesson-notebook__tabs button { min-height: 36px; padding: 0 13px; border-bottom: 2px solid transparent; background: transparent; color: #697069; font-size: 10px; cursor: pointer; }
.lesson-notebook__tabs button.active { border-bottom-color: #159447; color: #0f7137; font-weight: 750; }
.lesson-notebook > textarea { width: 100%; min-height: 126px; padding: 13px 14px; border: 1px solid #d5dad5; outline: 0; resize: vertical; color: #303631; font: 13px/1.75 var(--font-body); }
.lesson-notebook > textarea:focus { border-color: #1769d1; }
.lesson-notebook > footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.confidence-control { display: flex; align-items: center; gap: 6px; }
.confidence-control > span { margin-right: 3px; color: #6f766f; font-size: 10px; }
.confidence-control button { display: grid; place-items: center; width: 29px; height: 29px; border: 1px solid #d1d6d1; background: #fff; color: #717971; font: 10px var(--font-mono); cursor: pointer; }
.confidence-control button.active { border-color: #159447; background: #edf7f0; color: #0f7137; font-weight: 750; }
.lesson-notebook__save { display: inline-flex; align-items: center; gap: 7px; min-height: 36px; padding: 0 13px; background: #159447; color: #fff; font-size: 10px; font-weight: 750; cursor: pointer; }
.lesson-finish { display: flex; align-items: center; justify-content: space-between; gap: 24px; max-width: 740px; margin: 34px auto 0; padding: 22px 0; border-top: 1px solid #dfe2de; border-bottom: 1px solid #dfe2de; }
.lesson-finish div { display: grid; gap: 5px; }
.lesson-finish span { color: #717772; font-size: 11px; }
.lesson-finish strong { font-size: 15px; }
.lesson-finish button { display: inline-flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 20px; border: 0; background: #159447; color: #fff; font-weight: 700; cursor: pointer; }
.lesson-finish button:disabled { background: #c8ccc8; cursor: not-allowed; }
.lesson-mastery { position: sticky; top: 60px; align-self: start; height: calc(100vh - 60px); overflow-y: auto; border-left: 1px solid #e0e3df; background: #fcfdfc; }
.lesson-mastery section { padding: 22px; border-bottom: 1px solid #e2e5e1; }
.lesson-mastery h2 { font-size: 12px; font-weight: 750; }
.lesson-mastery__title { display: flex; align-items: center; justify-content: space-between; }
.lesson-mastery__title span { display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid #bfc4bf; border-radius: 50%; color: #7c827d; font-family: serif; font-size: 10px; }
.lesson-note-summary button { display: inline-flex; align-items: center; gap: 7px; min-height: 33px; margin-top: 12px; padding: 0 10px; border: 1px solid #cfd5cf; border-radius: 4px; background: #fff; color: #3d453e; font-size: 10px; cursor: pointer; }
.lesson-note-summary button:hover { border-color: #159447; color: #0f7137; }
.lesson-note-summary button:disabled { border-color: #dfe3df; background: #f6f7f6; color: #9ba09b; cursor: not-allowed; }
.mastery-ladder { display: grid; margin-top: 18px; }
.mastery-ladder > div { position: relative; display: grid; grid-template-columns: 26px 1fr; gap: 10px; min-height: 54px; }
.mastery-ladder > div:not(:last-child)::after { position: absolute; left: 12px; top: 25px; width: 1px; height: 28px; background: #d7dbd7; content: ''; }
.mastery-ladder b { z-index: 1; display: grid; place-items: center; width: 25px; height: 25px; border: 1px solid #c7ccc7; border-radius: 50%; background: #fff; color: #8a908b; font-family: var(--font-mono); font-size: 10px; }
.mastery-ladder span { display: grid; gap: 2px; }
.mastery-ladder strong { font-size: 12px; }
.mastery-ladder small { color: #8a908b; font-size: 10px; }
.mastery-ladder .active b { border-color: #159447; background: #159447; color: #fff; box-shadow: 0 0 0 4px #e3f4e8; }
.mastery-ladder .active strong { color: #0f6c34; }
.knowledge-list { display: grid; gap: 14px; margin-top: 17px; }
.knowledge-list > div { display: grid; grid-template-columns: 1fr auto; gap: 6px; }
.knowledge-list span { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.knowledge-list b { font-size: 10px; font-weight: 700; }
.knowledge-list .level-initial { color: #7e8580; }
.knowledge-list .level-familiar { color: #1769d1; }
.knowledge-list .level-proficient { color: #dc6945; }
.knowledge-list .level-mastered { color: #159447; }
.knowledge-list i { grid-column: 1 / -1; height: 3px; background: #e5e8e4; }
.knowledge-list em { display: block; height: 100%; background: #159447; transition: width 600ms cubic-bezier(.16,1,.3,1); }
.lesson-mastery__empty { margin-top: 12px; color: #8a908b; font-size: 11px; line-height: 1.5; }
.lesson-mastery__title > strong { color: #2c332d; font-size: 12px; }
.review-date { display: flex; align-items: flex-start; gap: 10px; margin-top: 15px; }
.review-date svg { color: #283029; }
.review-date div { display: grid; gap: 3px; }
.review-date strong { font-size: 12px; }
.review-date span { color: #858b86; font-size: 9px; }
.session-progress { display: grid; gap: 9px; margin-top: 15px; }
.session-progress i { height: 4px; background: #e3e7e3; }
.session-progress em { display: block; height: 100%; background: #159447; transition: width 400ms; }
.session-progress span { color: #747b75; font-size: 9px; }
.lesson-bottom-nav { position: fixed; z-index: 35; left: var(--outline-width); right: var(--mastery-width); bottom: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 64px; padding: 0 28px; border-top: 1px solid #dfe2de; background: rgba(255,255,255,.97); backdrop-filter: blur(10px); }
.lesson-bottom-nav button { display: inline-flex; align-items: center; gap: 7px; min-height: 36px; padding: 0 10px; border: 0; background: transparent; color: #3a413b; font-weight: 650; cursor: pointer; }
.lesson-bottom-nav button:disabled { opacity: .3; cursor: default; }
.lesson-bottom-nav span { color: #878d88; font-family: var(--font-mono); font-size: 10px; }
.lesson-bottom-nav--interactive { display: grid; grid-template-columns: 1fr auto auto 1fr; }
.lesson-bottom-nav--interactive > button:last-child { justify-self: end; }
.lesson-bottom-nav--interactive > button:first-child, .lesson-bottom-nav--interactive > button:last-child { min-width: 142px; min-height: 40px; justify-content: center; border: 1px solid #cfd5d0; border-radius: 5px; }
.lesson-bottom-nav .lesson-bottom-nav__analysis { min-height: 38px; padding: 0 17px; border: 1px solid #cfd5d0; border-radius: 5px; }
.lesson-bottom-nav .lesson-bottom-nav__check { min-width: 205px; min-height: 42px; justify-content: center; border-radius: 4px; background: #159447; color: #fff; }
.lesson-bottom-nav .lesson-bottom-nav__check:disabled { background: #b8c7bc; opacity: 1; }
.spin { animation: spin 800ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.outline-backdrop { display: none; }
.lesson-error { display: grid; place-items: start; gap: 12px; min-height: 100vh; padding: 15vh 10vw; background: #fff; }
.lesson-error h1 { font-size: 28px; }
.lesson-error p { color: #6e746f; }
.lesson-error a { padding: 10px 15px; background: #159447; color: #fff; }
@media (max-width: 1180px) {
  .lesson-shell { grid-template-columns: 250px minmax(0, 1fr); }
  .lesson-mastery { display: none; }
  .lesson-bottom-nav { right: 0; }
}
@media (max-width: 800px) {
  .lesson-topbar { grid-template-columns: auto auto minmax(0, 1fr) auto; gap: 10px; padding: 0 12px; }
  .lesson-topbar__menu { display: grid; }
  .lesson-topbar__divider, .lesson-topbar__progress, .lesson-topbar__crumb strong { display: none; }
  .lesson-topbar__crumb svg, .lesson-topbar__crumb span:not(:last-child) { display: none; }
  .lesson-topbar__crumb { display: block; }
  .lesson-topbar__exit span { display: none; }
  .lesson-shell { display: block; }
  .outline-backdrop { position: fixed; z-index: 49; inset: 0; display: block; background: rgba(13,18,14,.28); }
  .lesson-outline { position: fixed; z-index: 50; top: 0; left: 0; width: min(88vw, 330px); height: 100vh; transform: translateX(-105%); transition: transform 250ms cubic-bezier(.16,1,.3,1); box-shadow: 12px 0 30px rgba(20,28,21,.12); }
  .lesson-outline--open { transform: translateX(0); }
  .lesson-outline__mobile-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; height: 58px; padding: 0 16px; border-bottom: 1px solid #dfe2de; background: #fff; }
  .lesson-content { padding: 25px 18px 112px; }
  .lesson-heading h1 { font-size: 25px; }
  .lesson-notebook > footer { align-items: stretch; flex-direction: column; }
  .lesson-notebook__save { justify-content: center; }
  .lesson-finish { align-items: stretch; flex-direction: column; }
  .lesson-finish button { justify-content: center; }
  .lesson-bottom-nav { left: 0; height: 58px; padding: 0 12px; }
  .lesson-bottom-nav--interactive { grid-template-columns: 1fr auto 1fr; }
  .lesson-bottom-nav__analysis { display: none !important; }
  .lesson-bottom-nav .lesson-bottom-nav__check { min-width: 142px; }
  .lesson-bottom-nav--interactive > button:first-child, .lesson-bottom-nav--interactive > button:last-child { min-width: 0; width: 100%; padding: 0 6px; }
}
</style>
