<template>
  <div v-if="studio" class="studio">
    <header class="studio-topbar">
      <router-link to="/admin/courses" class="icon-btn" title="返回课程列表"><ArrowLeft :size="19" /></router-link>
      <div class="studio-topbar__title"><strong>{{ studio.course.title }}</strong><span :class="{ published: studio.course.course_status === 'published' }">{{ studio.course.course_status === 'published' ? '已发布' : '草稿' }}</span></div>
      <button type="button" class="studio-button studio-button--secondary" @click="preview"><Eye :size="16" />预览</button>
      <button type="button" class="studio-button studio-button--icon" title="立即保存" :disabled="!lessonForm || saveState === 'saving'" @click="saveLesson"><Save :size="16" /></button>
      <button type="button" class="studio-button studio-button--primary" @click="togglePublish"><Upload :size="16" />{{ studio.course.course_status === 'published' ? '转为草稿' : '发布' }}</button>
    </header>

    <div class="studio-statusbar">
      <div class="studio-topbar__save-state" :class="saveState"><CloudCheck v-if="saveState === 'saved'" :size="15" /><LoaderCircle v-else :size="15" :class="{ spin: saveState === 'saving' }" />{{ saveLabel }}</div>
      <button type="button" @click="activeInspectorTab = 'advanced'"><History :size="15" />版本历史</button>
    </div>

    <div class="studio-shell">
      <aside class="studio-outline">
        <div class="studio-outline__head"><strong>课程大纲</strong><button type="button" class="icon-btn" title="新增单元" @click="addingModule = true"><Plus :size="16" /></button></div>
        <section v-for="(module, moduleIndex) in studio.modules" :key="module.id" class="studio-module">
          <header><span>单元 {{ moduleIndex + 1 }}</span><strong>{{ module.title }}</strong><button type="button" title="新增课时" @click="newLessonModuleId = module.id"><Plus :size="14" /></button></header>
          <button
            v-for="lesson in module.lessons"
            :key="lesson.id"
            type="button"
            class="studio-lesson"
            :class="{ active: selectedLessonId === lesson.id }"
            @click="selectLesson(lesson.id)"
          >
            <GripVertical :size="13" /><span>{{ lesson.title }}</span><i :class="lesson.publishStatus"></i>
          </button>
          <form v-if="newLessonModuleId === module.id" class="studio-inline-form" @submit.prevent="createLesson(module.id)">
            <input v-model.trim="newLessonTitle" ref="lessonTitleInput" placeholder="课时名称" required />
            <button type="submit">添加</button><button type="button" @click="newLessonModuleId = null">取消</button>
          </form>
        </section>
        <form v-if="addingModule" class="studio-inline-form studio-inline-form--module" @submit.prevent="createModule">
          <input v-model.trim="newModuleTitle" placeholder="单元名称" required />
          <button type="submit">添加</button><button type="button" @click="addingModule = false">取消</button>
        </form>
        <button v-else type="button" class="studio-outline__add" @click="addingModule = true"><Plus :size="15" />添加单元</button>
      </aside>

      <main v-if="lessonForm" class="studio-editor">
        <header class="editor-heading">
          <span>{{ lessonForm.moduleTitle }} / {{ typeLabel(lessonForm.type) }}</span>
          <input v-model="lessonForm.title" class="editor-heading__title" aria-label="课时标题" />
          <textarea v-model="lessonForm.summary" rows="2" placeholder="用一句话说明这节课学什么"></textarea>
        </header>

        <section class="builder-section">
          <header>
            <div><span>学习内容 / 互动题</span><h2>课时内容流</h2></div>
            <div class="builder-section__actions">
              <button type="button" @click="addBlock('text')"><Plus :size="15" />添加内容</button>
              <button type="button" @click="addActivity"><MousePointer2 :size="15" />添加互动题</button>
            </div>
          </header>
          <template v-for="entry in orderedLessonItems" :key="`${entry.kind}-${entry.item.localId || entry.item.id}`">
            <article v-if="entry.kind === 'block'" class="content-block" :class="`content-block--${entry.item.type}`">
              <div class="content-block__toolbar">
                <GripVertical :size="15" />
                <select v-model="entry.item.type"><option v-for="option in blockTypes" :key="option.value" :value="option.value">{{ option.label }}</option></select>
                <div class="content-block__actions">
                  <button type="button" title="上移" :disabled="entry.index === 0" @click="moveItem(lessonForm.blocks, entry.index, -1)"><ArrowUp :size="15" /></button>
                  <button type="button" title="下移" :disabled="entry.index === lessonForm.blocks.length - 1" @click="moveItem(lessonForm.blocks, entry.index, 1)"><ArrowDown :size="15" /></button>
                  <button type="button" title="删除内容块" @click="lessonForm.blocks.splice(entry.index, 1)"><Trash2 :size="15" /></button>
                </div>
              </div>
              <div class="content-block__body">
                <input v-if="entry.item.type === 'scenario'" v-model="entry.item.content.eyebrow" placeholder="情境标签，例如：先做判断" />
                <input v-if="entry.item.type !== 'divider'" v-model="entry.item.content.title" placeholder="内容块标题（可选）" />
                <textarea v-if="!['key_points', 'divider'].includes(entry.item.type)" v-model="entry.item.content.body" :rows="entry.item.type === 'scenario' ? 3 : 4" placeholder="输入正文"></textarea>
                <textarea v-if="entry.item.type === 'key_points'" v-model="entry.item.content.itemsText" rows="4" placeholder="每行一个要点"></textarea>
              </div>
            </article>

            <article v-else class="activity-editor activity-editor--stream">
              <div class="activity-editor__toolbar">
                <MousePointer2 :size="15" />
                <select v-model="entry.item.type" @change="resetActivityConfig(entry.item)"><option v-for="option in activityTypes" :key="option.value" :value="option.value">{{ option.label }}</option></select>
                <select v-if="entry.item.type === 'single_choice'" v-model="entry.item.config.variant" @change="resetVariantConfig(entry.item)">
                  <option value="">标准判断</option><option value="simulation">可操控实验</option><option value="short_answer">开放迁移题</option>
                </select>
                <div class="content-block__actions">
                  <button type="button" title="上移" :disabled="entry.index === 0" @click="moveItem(lessonForm.activities, entry.index, -1)"><ArrowUp :size="15" /></button>
                  <button type="button" title="删除互动题" @click="lessonForm.activities.splice(entry.index, 1)"><Trash2 :size="15" /></button>
                </div>
              </div>
              <div class="activity-editor__body">
                <label>题目<textarea v-model="entry.item.prompt" rows="2" placeholder="让学生做出一个具体判断"></textarea></label>

                <div v-if="entry.item.config.variant === 'simulation'" class="variant-editor">
                  <label>操控变量名称<input v-model="entry.item.config.controlLabel" placeholder="例如：访谈中的动词" /></label>
                  <div><span>可切换条件与观察值</span><div v-for="control in entry.item.config.controls" :key="control.id" class="simulation-edit-row"><input v-model="control.label" /><input v-model.number="control.value" type="number" /><button type="button" title="删除条件" @click="removeById(entry.item.config.controls, control.id)"><X :size="14" /></button></div><button type="button" class="text-action" @click="addSimulationControl(entry.item)"><Plus :size="14" />添加条件</button></div>
                  <label>输出名称<input v-model="entry.item.config.outputLabel" placeholder="例如：平均估计车速" /></label>
                  <label>输出单位<input v-model="entry.item.config.outputUnit" placeholder="例如：km/h" /></label>
                  <div class="option-editor"><span>实验结论</span><div v-for="(choice, choiceIndex) in entry.item.config.choices" :key="choice.id" class="option-row"><input type="radio" :name="`conclusion-${entry.item.localId || entry.item.id}`" :checked="entry.item.config.correctConclusion === choice.id" @change="entry.item.config.correctConclusion = choice.id" /><b>{{ String.fromCharCode(65 + choiceIndex) }}</b><input v-model="choice.label" /><button type="button" title="删除结论" @click="removeChoice(entry.item, choiceIndex)"><X :size="14" /></button></div><button type="button" class="text-action" @click="addChoice(entry.item)"><Plus :size="14" />添加结论</button></div>
                </div>

                <div v-else-if="entry.item.config.variant === 'short_answer'" class="variant-editor short-answer-editor">
                  <label>输入提示<textarea v-model="entry.item.config.placeholder" rows="2" placeholder="给学生一个作答起点"></textarea></label>
                  <label>最低字数<input v-model.number="entry.item.config.minLength" type="number" min="12" max="500" /></label>
                  <label>判断关键词<textarea v-model="entry.item.config.expectedKeywordsText" rows="3" placeholder="用逗号分隔，例如：开放，中性，独立"></textarea></label>
                  <label>至少命中<input v-model.number="entry.item.config.minimumMatches" type="number" min="0" max="10" /></label>
                </div>

                <div v-else-if="['single_choice', 'multiple_choice'].includes(entry.item.type)" class="option-editor">
                  <span>选项与正确答案</span>
                  <div v-for="(choice, choiceIndex) in entry.item.config.choices" :key="choice.id" class="option-row">
                    <input
                      :type="entry.item.type === 'single_choice' ? 'radio' : 'checkbox'"
                      :name="`correct-${entry.item.localId || entry.item.id}`"
                      :checked="choiceCorrect(entry.item, choice.id)"
                      @change="setChoiceCorrect(entry.item, choice.id)"
                    />
                    <b>{{ String.fromCharCode(65 + choiceIndex) }}</b>
                    <input v-model="choice.label" placeholder="选项内容" />
                    <input v-if="entry.item.type === 'single_choice'" v-model="choice.feedback" placeholder="选择该项后的针对性反馈" />
                    <button type="button" title="删除选项" @click="removeChoice(entry.item, choiceIndex)"><X :size="14" /></button>
                  </div>
                  <button type="button" class="text-action" @click="addChoice(entry.item)"><Plus :size="14" />添加选项</button>
                </div>

                <div v-else-if="entry.item.type === 'sequence'" class="option-editor">
                  <span>正确顺序</span>
                  <div v-for="(item, itemIndex) in entry.item.config.items" :key="item.id" class="sequence-edit-row">
                    <b>{{ itemIndex + 1 }}</b><input v-model="item.label" />
                    <button type="button" title="上移" :disabled="itemIndex === 0" @click="moveItem(entry.item.config.items, itemIndex, -1)"><ArrowUp :size="14" /></button>
                    <button type="button" title="下移" :disabled="itemIndex === entry.item.config.items.length - 1" @click="moveItem(entry.item.config.items, itemIndex, 1)"><ArrowDown :size="14" /></button>
                  </div>
                  <button type="button" class="text-action" @click="entry.item.config.items.push({ id: uid('step'), label: '新步骤' })"><Plus :size="14" />添加步骤</button>
                </div>

                <div v-else class="classify-editor">
                  <div><span>分类目标</span><div v-for="category in entry.item.config.categories" :key="category.id" class="compact-row"><input v-model="category.label" /></div><button type="button" class="text-action" @click="addCategory(entry.item)"><Plus :size="14" />添加分类</button></div>
                  <div><span>待分类内容与正确归属</span><div v-for="item in entry.item.config.items" :key="item.id" class="classify-edit-row"><input v-model="item.label" /><select v-model="entry.item.config.correctMatches[item.id]"><option value="">选择分类</option><option v-for="category in entry.item.config.categories" :key="category.id" :value="category.id">{{ category.label }}</option></select></div><button type="button" class="text-action" @click="addClassifyItem(entry.item)"><Plus :size="14" />添加内容</button></div>
                </div>

                <div class="activity-editor__details">
                  <label>关联知识点<input v-model="entry.item.knowledgePoint" placeholder="例如：框架效应" /></label>
                  <label>答错提示<input v-model="entry.item.config.hint" placeholder="引导学生再想一步" /></label>
                </div>
                <label>通过后的解释<textarea v-model="entry.item.explanation" rows="3" placeholder="解释为什么，而不是只重复答案"></textarea></label>
              </div>
            </article>
          </template>
          <p v-if="orderedLessonItems.length === 0" class="builder-empty">当前课时还没有学习内容。</p>
        </section>
      </main>

      <aside v-if="lessonForm" class="studio-inspector">
        <div class="studio-inspector__tabs">
          <button type="button" :class="{ active: activeInspectorTab === 'content' }" @click="activeInspectorTab = 'content'">内容设置</button>
          <button type="button" :class="{ active: activeInspectorTab === 'advanced' }" @click="activeInspectorTab = 'advanced'">高级设置</button>
        </div>
        <section v-show="activeInspectorTab === 'content'"><h2>课时设置</h2>
          <label>课时类型<select v-model="lessonForm.type"><option v-for="option in lessonTypes" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
          <label>预计时长<div class="number-input"><input v-model.number="lessonForm.estimatedMinutes" type="number" min="1" max="240" /><span>分钟</span></div></label>
          <label>发布状态<select v-model="lessonForm.status"><option value="draft">草稿</option><option value="published">已发布</option><option value="archived">已归档</option></select></label>
        </section>
        <section v-show="activeInspectorTab === 'content'"><h2>掌握度关联</h2><label>知识点<textarea v-model="lessonForm.knowledgeText" rows="5" placeholder="用逗号分隔"></textarea></label><p>每次正确或错误作答都会成为对应知识点的掌握证据。</p></section>
        <section v-show="activeInspectorTab === 'advanced'" class="version-list"><div class="version-list__head"><h2>版本记录</h2><History :size="15" /></div><div v-for="version in studio.versions" :key="version.id"><strong>v{{ version.version_number }} · {{ version.event_type === 'publish' ? '发布' : '保存' }}</strong><span>{{ formatTime(version.created_at) }}</span><small>{{ version.note }}</small></div><p v-if="!studio.versions.length">保存后会自动留下版本。</p></section>
      </aside>
    </div>
  </div>
  <LoadingSpinner v-else :show="true" />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, ArrowLeft, ArrowUp, CloudCheck, Eye, GripVertical, History, LoaderCircle, MousePointer2, Plus, Save, Trash2, Upload, X } from 'lucide-vue-next'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useRequest } from '../composables/useRequest'

const route = useRoute()
const router = useRouter()
const { get, post, put } = useRequest()
const studio = ref(null)
const lessonForm = ref(null)
const selectedLessonId = ref(null)
const saveState = ref('saved')
const savedAt = ref(null)
const hydrating = ref(false)
const addingModule = ref(false)
const activeInspectorTab = ref('content')
const newModuleTitle = ref('')
const newLessonModuleId = ref(null)
const newLessonTitle = ref('')
let saveTimer = null
let lastSavedSignature = ''

const lessonTypes = [
  { value: 'interactive', label: '互动课时' }, { value: 'reading', label: '概念阅读' },
  { value: 'quiz', label: '单元挑战' }, { value: 'reflection', label: '反思练习' }
]
const blockTypes = [
  { value: 'scenario', label: '情境' }, { value: 'text', label: '正文' },
  { value: 'explanation', label: '解释' }, { value: 'key_points', label: '要点' },
  { value: 'reflection', label: '反思' }, { value: 'divider', label: '分隔' }
]
const activityTypes = [
  { value: 'single_choice', label: '单选判断' }, { value: 'multiple_choice', label: '多选判断' },
  { value: 'sequence', label: '顺序排列' }, { value: 'classify', label: '证据分类' }
]
const saveLabel = computed(() => saveState.value === 'saving' ? '正在保存' : saveState.value === 'dirty' ? '有未保存修改' : savedAt.value ? `已保存 ${savedAt.value}` : '已同步')
const orderedLessonItems = computed(() => {
  if (!lessonForm.value) return []
  const blocks = lessonForm.value.blocks.map((item, index) => ({ kind: 'block', item, index }))
  const activities = lessonForm.value.activities.map((item, index) => ({ kind: 'activity', item, index }))
  const rank = entry => {
    if (entry.kind === 'block' && entry.item.type === 'scenario') return 0
    if (entry.kind === 'activity') return 1
    if (entry.kind === 'block' && entry.item.type === 'key_points') return 3
    return 2
  }
  return [...blocks, ...activities].sort((a, b) => rank(a) - rank(b) || a.index - b.index)
})

function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
function cloneData(value) { return JSON.parse(JSON.stringify(value || {})) }
function typeLabel(type) { return lessonTypes.find(item => item.value === type)?.label || '课时' }
function formatTime(value) { return value ? new Date(`${value}Z`).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '' }
function moveItem(items, index, direction) {
  const target = index + direction
  if (target < 0 || target >= items.length) return
  ;[items[index], items[target]] = [items[target], items[index]]
}

function normalizedActivity(activity) {
  const config = cloneData(activity.config)
  config.variant ||= ''
  if (config.variant === 'simulation') {
    config.controls ||= []
    config.choices ||= []
    config.correctConclusion ||= ''
  } else if (config.variant === 'short_answer') {
    config.expectedKeywords ||= []
    config.expectedKeywordsText = config.expectedKeywords.join('，')
    config.minLength ||= 36
    config.minimumMatches ??= 1
  } else if (['single_choice', 'multiple_choice'].includes(activity.type)) config.choices ||= []
  if (activity.type === 'single_choice' && !config.variant) config.correctAnswer ||= ''
  if (activity.type === 'multiple_choice') config.correctAnswers ||= []
  if (activity.type === 'sequence') config.items ||= []
  if (activity.type === 'classify') {
    config.categories ||= []
    config.items ||= []
    config.correctMatches ||= {}
  }
  return { ...activity, localId: activity.id || uid('activity'), config }
}

async function hydrate(payload) {
  hydrating.value = true
  lessonForm.value = {
    ...payload.lesson,
    blocks: payload.blocks.map(block => ({
      ...block,
      localId: block.id || uid('block'),
      content: { ...block.content, itemsText: (block.content.items || []).join('\n') }
    })),
    activities: payload.activities.map(normalizedActivity),
    knowledgeText: payload.knowledgePoints.map(point => point.title).join('，')
  }
  await nextTick()
  lastSavedSignature = JSON.stringify(serializeForm())
  hydrating.value = false
  saveState.value = 'saved'
}

async function loadStudio(preferredLessonId) {
  studio.value = await get(`/admin/courses/${route.params.id}/studio`)
  const lessons = studio.value.modules.flatMap(module => module.lessons)
  const target = Number(preferredLessonId) || selectedLessonId.value || lessons[0]?.id
  if (target) await selectLesson(target)
}

async function selectLesson(id) {
  if (saveState.value === 'dirty') await saveLesson()
  selectedLessonId.value = id
  const payload = await get(`/admin/course-lessons/${id}`)
  await hydrate(payload)
  router.replace({ query: { lesson: id } })
}

function serializeForm() {
  return {
    title: lessonForm.value.title,
    summary: lessonForm.value.summary,
    type: lessonForm.value.type,
    estimatedMinutes: lessonForm.value.estimatedMinutes,
    status: lessonForm.value.status,
    knowledgePoints: lessonForm.value.knowledgeText.split(/[，,\n]/).map(title => title.trim()).filter(Boolean),
    blocks: lessonForm.value.blocks.map(block => {
      const content = { ...block.content }
      if (block.type === 'key_points') content.items = (content.itemsText || '').split('\n').map(item => item.trim()).filter(Boolean)
      delete content.itemsText
      return { id: block.id, type: block.type, content }
    }),
    activities: lessonForm.value.activities.map(activity => {
      const config = cloneData(activity.config)
      if (activity.type === 'sequence') config.correctOrder = config.items.map(item => item.id)
      if (config.variant === 'short_answer') {
        config.expectedKeywords = (config.expectedKeywordsText || '').split(/[，,\n]/).map(item => item.trim()).filter(Boolean)
        delete config.expectedKeywordsText
      }
      return { id: activity.id, type: activity.type, prompt: activity.prompt, config, explanation: activity.explanation, points: activity.points || 10, isRequired: activity.isRequired !== false, knowledgePoint: activity.knowledgePoint }
    })
  }
}

async function saveLesson() {
  if (!lessonForm.value || saveState.value === 'saving') return
  clearTimeout(saveTimer)
  const currentSignature = JSON.stringify(serializeForm())
  if (currentSignature === lastSavedSignature) {
    saveState.value = 'saved'
    return
  }
  saveState.value = 'saving'
  try {
    const payload = await put(`/admin/course-lessons/${selectedLessonId.value}`, serializeForm())
    await hydrate(payload)
    savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    studio.value.versions = (await get(`/admin/courses/${route.params.id}/studio`)).versions
  } catch {
    saveState.value = 'dirty'
  }
}

function scheduleSave() {
  if (hydrating.value || !lessonForm.value) return
  if (JSON.stringify(serializeForm()) === lastSavedSignature) {
    saveState.value = 'saved'
    return
  }
  saveState.value = 'dirty'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveLesson, 1600)
}

function addBlock(type) {
  const content = type === 'scenario' ? { eyebrow: '情境', title: '', body: '' } : type === 'key_points' ? { title: '带走这三点', itemsText: '' } : { title: '', body: '' }
  lessonForm.value.blocks.push({ localId: uid('block'), type, content })
}
function defaultActivityConfig(type, variant = '') {
  if (variant === 'simulation') return { variant, controlLabel: '操控变量', controls: [{ id: uid('condition'), label: '条件一', value: 30 }, { id: uid('condition'), label: '条件二', value: 45 }], outputLabel: '观察结果', outputUnit: '', choices: [{ id: uid('choice'), label: '结论一' }, { id: uid('choice'), label: '结论二' }], correctConclusion: '', hint: '' }
  if (variant === 'short_answer') return { variant, placeholder: '写下可执行步骤和理由', minLength: 36, expectedKeywordsText: '', expectedKeywords: [], minimumMatches: 1, hint: '' }
  if (type === 'single_choice') return { choices: [{ id: uid('choice'), label: '', feedback: '' }, { id: uid('choice'), label: '', feedback: '' }], correctAnswer: '', hint: '' }
  if (type === 'multiple_choice') return { choices: [{ id: uid('choice'), label: '' }, { id: uid('choice'), label: '' }], correctAnswers: [], hint: '' }
  if (type === 'sequence') return { items: [{ id: uid('step'), label: '第一步' }, { id: uid('step'), label: '第二步' }], correctOrder: [], hint: '' }
  const categoryA = uid('category'); const categoryB = uid('category')
  return { categories: [{ id: categoryA, label: '分类一' }, { id: categoryB, label: '分类二' }], items: [], correctMatches: {}, hint: '' }
}
function addActivity() {
  lessonForm.value.activities.push({ localId: uid('activity'), type: 'single_choice', prompt: '', config: defaultActivityConfig('single_choice'), explanation: '', points: 10, isRequired: true, knowledgePoint: '' })
}
function resetActivityConfig(activity) { activity.config = defaultActivityConfig(activity.type) }
function resetVariantConfig(activity) { activity.config = defaultActivityConfig(activity.type, activity.config.variant || '') }
function choiceCorrect(activity, choiceId) { return activity.type === 'single_choice' ? activity.config.correctAnswer === choiceId : activity.config.correctAnswers.includes(choiceId) }
function setChoiceCorrect(activity, choiceId) {
  if (activity.type === 'single_choice') activity.config.correctAnswer = choiceId
  else activity.config.correctAnswers = activity.config.correctAnswers.includes(choiceId) ? activity.config.correctAnswers.filter(id => id !== choiceId) : [...activity.config.correctAnswers, choiceId]
}
function addChoice(activity) { activity.config.choices.push({ id: uid('choice'), label: '', feedback: '' }) }
function addSimulationControl(activity) { activity.config.controls.push({ id: uid('condition'), label: '新条件', value: 0 }) }
function removeById(items, id) { const index = items.findIndex(item => item.id === id); if (index >= 0) items.splice(index, 1) }
function removeChoice(activity, index) {
  const [removed] = activity.config.choices.splice(index, 1)
  if (activity.config.correctAnswer === removed.id) activity.config.correctAnswer = ''
  if (activity.config.correctConclusion === removed.id) activity.config.correctConclusion = ''
  if (activity.config.correctAnswers) activity.config.correctAnswers = activity.config.correctAnswers.filter(id => id !== removed.id)
}
function addCategory(activity) { activity.config.categories.push({ id: uid('category'), label: '新分类' }) }
function addClassifyItem(activity) {
  const id = uid('item')
  activity.config.items.push({ id, label: '新内容' })
  activity.config.correctMatches[id] = ''
}

async function createModule() {
  await post(`/admin/courses/${route.params.id}/modules`, { title: newModuleTitle.value })
  newModuleTitle.value = ''; addingModule.value = false
  await loadStudio()
}
async function createLesson(moduleId) {
  const payload = await post(`/admin/course-modules/${moduleId}/lessons`, { title: newLessonTitle.value })
  newLessonTitle.value = ''; newLessonModuleId.value = null
  await loadStudio(payload.lesson.id)
}
async function togglePublish() {
  if (saveState.value === 'dirty') await saveLesson()
  const status = studio.value.course.course_status === 'published' ? 'draft' : 'published'
  studio.value.course = await put(`/admin/courses/${route.params.id}/status`, { status })
  await loadStudio(selectedLessonId.value)
}
function preview() { router.push(`/skills/${route.params.id}`) }

watch(lessonForm, scheduleSave, { deep: true, flush: 'sync' })
onMounted(() => loadStudio(route.query.lesson))
onBeforeUnmount(() => clearTimeout(saveTimer))
</script>

<style scoped>
.studio { min-height: 100vh; background: #f7f8f7; color: #1d211e; }
.studio-topbar { position: sticky; top: 0; z-index: 40; display: grid; grid-template-columns: 38px minmax(0, 1fr) auto auto auto; align-items: center; gap: 10px; height: 60px; padding: 0 18px; border-bottom: 1px solid #dce0dc; background: #fff; }
.icon-btn { display: grid; place-items: center; width: 34px; height: 34px; border: 0; background: transparent; color: #343a35; cursor: pointer; }
.icon-btn:hover { background: #f0f2f0; }
.studio-topbar__title { display: flex; align-items: center; gap: 10px; }
.studio-topbar__title strong { font-size: 15px; }
.studio-topbar__title span { padding: 3px 6px; border: 1px solid #e4bfad; color: #b1583d; font-size: 9px; }
.studio-topbar__title span.published { border-color: #b8d7c1; color: #14743a; }
.studio-topbar__save-state { display: inline-flex; align-items: center; gap: 6px; color: #717872; font-size: 10px; }
.studio-topbar__save-state.saved { color: #14743a; }
.studio-topbar__save-state.dirty { color: #b1583d; }
.studio-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 0 13px; border: 1px solid #d6dad6; background: #fff; color: #343a35; font-size: 11px; font-weight: 700; cursor: pointer; }
.studio-button--primary { border-color: #159447; background: #159447; color: #fff; }
.studio-button--icon { width: 36px; padding: 0; }
.studio-button:disabled { opacity: .45; }
.studio-statusbar { position: sticky; top: 60px; z-index: 35; display: flex; align-items: center; justify-content: flex-end; gap: 18px; height: 42px; padding: 0 18px; border-bottom: 1px solid #e4e7e4; background: #fbfcfb; }
.studio-statusbar button { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; color: #636a64; font-size: 10px; cursor: pointer; }
.studio-statusbar button:hover { color: #1769d1; }
.studio-shell { display: grid; grid-template-columns: clamp(190px, 15.6vw, 250px) minmax(380px, 1fr) clamp(220px, 16.9vw, 270px); min-height: calc(100vh - 102px); }
.studio-outline { position: sticky; top: 102px; align-self: start; height: calc(100vh - 102px); overflow-y: auto; border-right: 1px solid #dce0dc; background: #fbfcfb; }
.studio-outline__head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 14px; border-bottom: 1px solid #e0e3e0; background: #fff; }
.studio-outline__head strong { font-size: 11px; }
.studio-module { padding: 13px 0; border-bottom: 1px solid #e1e4e1; }
.studio-module header { display: grid; grid-template-columns: 1fr auto; gap: 3px 8px; padding: 0 12px 8px 15px; }
.studio-module header span { grid-column: 1; color: #858b86; font-size: 8px; }
.studio-module header strong { grid-column: 1; font-size: 11px; line-height: 1.4; }
.studio-module header button { grid-column: 2; grid-row: 1 / 3; align-self: center; display: grid; place-items: center; width: 27px; height: 27px; border: 0; background: transparent; cursor: pointer; }
.studio-lesson { display: grid; grid-template-columns: 13px 1fr 6px; align-items: center; gap: 7px; width: 100%; min-height: 36px; padding: 7px 14px; border: 0; border-left: 2px solid transparent; background: transparent; color: #626963; text-align: left; cursor: pointer; }
.studio-lesson span { overflow: hidden; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.studio-lesson i { width: 6px; height: 6px; border: 1px solid #aab0aa; border-radius: 50%; }
.studio-lesson i.published { border-color: #159447; background: #159447; }
.studio-lesson.active { border-left-color: #159447; background: #edf6ef; color: #0e6d35; font-weight: 700; }
.studio-inline-form { display: grid; grid-template-columns: 1fr auto auto; gap: 4px; padding: 7px 12px; }
.studio-inline-form input { min-width: 0; height: 30px; padding: 0 7px; border: 1px solid #cfd4cf; font: inherit; font-size: 10px; }
.studio-inline-form button { border: 0; background: transparent; color: #14743a; font-size: 9px; cursor: pointer; }
.studio-inline-form--module { border-bottom: 1px solid #e1e4e1; }
.studio-outline__add { display: flex; align-items: center; gap: 6px; width: 100%; padding: 13px 15px; border: 0; background: transparent; color: #14743a; font-size: 10px; cursor: pointer; }
.studio-editor { min-width: 0; padding: 20px 26px 90px; background: #fff; }
.editor-heading, .builder-section { max-width: 760px; margin: 0 auto; }
.editor-heading > span { color: #7b827c; font-size: 9px; }
.editor-heading__title { display: block; width: 100%; margin-top: 7px; border: 0; outline: 0; background: transparent; color: #1d211e; font: 730 21px/1.3 var(--font-heading); }
.editor-heading textarea { width: 100%; margin-top: 7px; padding: 0; border: 0; outline: 0; resize: vertical; background: transparent; color: #69706a; font: 12px/1.6 var(--font-body); }
.builder-section { margin-top: 22px; }
.builder-section > header { display: flex; align-items: end; justify-content: space-between; margin-bottom: 13px; padding-bottom: 10px; border-bottom: 1px solid #dce0dc; }
.builder-section > header span { color: #159447; font-size: 8px; font-weight: 750; }
.builder-section > header h2 { margin-top: 3px; font-size: 15px; }
.builder-section > header button, .text-action { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; padding: 0 8px; border: 0; background: transparent; color: #1769d1; font-size: 10px; cursor: pointer; }
.builder-section__actions { display: flex; gap: 4px; }
.content-block, .activity-editor { margin-bottom: 10px; border: 1px solid #daddda; background: #fff; }
.activity-editor--stream { border-color: #a9c6ee; }
.content-block__toolbar, .activity-editor__toolbar { display: flex; align-items: center; gap: 8px; min-height: 38px; padding: 0 9px; border-bottom: 1px solid #e3e6e3; color: #8a908b; }
.content-block__toolbar select, .activity-editor__toolbar select { border: 0; outline: 0; background: transparent; color: #3c433d; font: 700 10px var(--font-body); }
.content-block__actions { display: flex; margin-left: auto; }
.content-block__actions button { display: grid; place-items: center; width: 28px; height: 28px; border: 0; background: transparent; color: #69706a; cursor: pointer; }
.content-block__actions button:hover:not(:disabled) { background: #f0f2f0; }
.content-block__actions button:disabled { opacity: .25; }
.content-block__body, .activity-editor__body { display: grid; gap: 9px; padding: 14px; }
.content-block--scenario .content-block__body { grid-template-columns: 140px minmax(0, 1fr); }
.content-block--scenario .content-block__body textarea { grid-column: 1 / -1; }
.content-block input, .content-block textarea, .activity-editor input, .activity-editor textarea, .activity-editor select, .studio-inspector input, .studio-inspector textarea, .studio-inspector select { width: 100%; border: 1px solid #d5d9d5; outline: 0; background: #fff; color: #2c322d; font: 11px/1.55 var(--font-body); }
.content-block input, .activity-editor input, .activity-editor select, .studio-inspector input, .studio-inspector select { height: 34px; padding: 0 9px; }
.content-block textarea, .activity-editor textarea, .studio-inspector textarea { padding: 8px 9px; resize: vertical; }
.content-block input:focus, .content-block textarea:focus, .activity-editor input:focus, .activity-editor textarea:focus, .activity-editor select:focus, .studio-inspector input:focus, .studio-inspector textarea:focus, .studio-inspector select:focus { border-color: #1769d1; }
.activity-editor__body > label, .activity-editor__details label, .studio-inspector label { display: grid; gap: 5px; color: #636a64; font-size: 9px; }
.option-editor, .classify-editor { display: grid; gap: 7px; padding: 10px; background: #f7f9f7; }
.option-editor > span, .classify-editor span { color: #717872; font-size: 9px; font-weight: 700; }
.option-row { display: grid; grid-template-columns: 16px 22px minmax(110px, .8fr) minmax(160px, 1fr) 24px; align-items: center; gap: 6px; }
.option-row > input:first-child { width: 14px; height: 14px; }
.option-row b, .sequence-edit-row b { font-family: var(--font-mono); font-size: 9px; }
.option-row button, .sequence-edit-row button { display: grid; place-items: center; width: 24px; height: 28px; border: 0; background: transparent; cursor: pointer; }
.sequence-edit-row { display: grid; grid-template-columns: 22px 1fr 24px 24px; align-items: center; gap: 5px; }
.classify-editor { grid-template-columns: 1fr 1.6fr; gap: 14px; }
.classify-editor > div { display: grid; align-content: start; gap: 6px; }
.classify-edit-row { display: grid; grid-template-columns: 1fr 110px; gap: 5px; }
.compact-row { display: grid; }
.activity-editor__details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.variant-editor { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; border: 1px solid #dbe3db; background: #f8faf8; }
.variant-editor > div, .variant-editor > .option-editor { grid-column: 1 / -1; }
.simulation-edit-row { display: grid; grid-template-columns: minmax(0, 1fr) 90px 28px; gap: 6px; margin-top: 6px; }
.simulation-edit-row button { display: grid; place-items: center; background: transparent; color: #7b827c; }
.short-answer-editor { grid-template-columns: 1.4fr .6fr; }
.builder-empty { padding: 24px; border: 1px dashed #cfd4cf; color: #858b86; font-size: 10px; text-align: center; }
.studio-inspector { position: sticky; top: 102px; align-self: start; height: calc(100vh - 102px); overflow-y: auto; border-left: 1px solid #dce0dc; background: #fff; }
.studio-inspector__tabs { position: sticky; top: 0; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; height: 42px; border-bottom: 1px solid #e1e4e1; background: #fff; }
.studio-inspector__tabs button { position: relative; border: 0; background: transparent; color: #6c736d; font-size: 10px; cursor: pointer; }
.studio-inspector__tabs button::after { position: absolute; right: 15px; bottom: -1px; left: 15px; height: 2px; transform: scaleX(0); background: #159447; content: ''; transition: transform 160ms; }
.studio-inspector__tabs button.active { color: #13743a; font-weight: 700; }
.studio-inspector__tabs button.active::after { transform: scaleX(1); }
.studio-inspector section { display: grid; gap: 13px; padding: 18px; border-bottom: 1px solid #e1e4e1; }
.studio-inspector h2 { font-size: 11px; }
.studio-inspector section > p { color: #858b86; font-size: 9px; line-height: 1.55; }
.number-input { position: relative; }
.number-input span { position: absolute; right: 9px; top: 9px; color: #888e89; font-size: 9px; }
.version-list__head { display: flex; align-items: center; justify-content: space-between; }
.version-list > div:not(.version-list__head) { display: grid; grid-template-columns: 1fr auto; gap: 3px 8px; padding-top: 9px; border-top: 1px solid #eceeec; }
.version-list strong { font-size: 9px; }
.version-list span, .version-list small { color: #858b86; font-size: 8px; }
.version-list small { grid-column: 1 / -1; }
.spin { animation: spin 800ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1100px) {
  .studio-shell { grid-template-columns: 190px minmax(380px, 1fr) 220px; }
  .studio-editor { padding-right: 14px; padding-left: 14px; }
  .classify-editor, .activity-editor__details { grid-template-columns: 1fr; }
  .studio-inspector section { padding: 14px; }
}
@media (max-width: 790px) {
  .studio-topbar { grid-template-columns: 34px 1fr auto; padding: 0 9px; }
  .studio-topbar__save-state, .studio-button--secondary { display: none; }
  .studio-shell { display: block; }
  .studio-outline { position: static; width: 100%; height: auto; max-height: 290px; border-bottom: 1px solid #dce0dc; border-right: 0; }
  .studio-editor { padding: 28px 14px 70px; }
  .studio-inspector { grid-column: auto; grid-template-columns: 1fr; }
  .option-row { grid-template-columns: 16px 22px 1fr 24px; }
  .option-row > input:nth-of-type(3) { grid-column: 3 / -1; }
  .classify-editor, .activity-editor__details { grid-template-columns: 1fr; }
}
</style>
