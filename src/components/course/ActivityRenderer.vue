<template>
  <section class="activity" :class="[`activity--${renderType}`, { 'activity--solved': solved }]">
    <header class="activity__header">
      <div>
        <span class="activity__eyebrow">{{ activityEyebrow }}</span>
        <h3>{{ activity.prompt }}</h3>
        <p v-if="activity.type === 'classify'" class="activity__instruction">将证据拖到最支持的解释上，每条证据只能使用一次。</p>
      </div>
      <button v-if="activity.config.hint" type="button" class="activity__hint-button" @click="showHint = !showHint">
        <Lightbulb :size="15" />{{ showHint ? '收起提示' : '查看提示' }}
      </button>
      <span v-else-if="activity.knowledgePoint && activity.type !== 'classify'" class="activity__knowledge">{{ activity.knowledgePoint.title }}</span>
    </header>

    <Transition name="feedback">
      <div v-if="showHint" class="activity__inline-hint"><Lightbulb :size="16" /><span>{{ activity.config.hint }}</span></div>
    </Transition>

    <div v-if="isSimulation" class="simulation">
      <section class="simulation__controls">
        <header><span><SlidersHorizontal :size="15" />{{ activity.config.controlLabel || '操控变量' }}</span><small>只改变这一项</small></header>
        <div class="simulation__segments" role="group" :aria-label="activity.config.controlLabel || '操控变量'">
          <button
            v-for="control in activity.config.controls"
            :key="control.id"
            type="button"
            :class="{ active: simulationSelection === control.id }"
            :disabled="solved"
            @click="simulationSelection = control.id"
          >{{ control.label }}</button>
        </div>
        <div class="simulation__readout">
          <div><FlaskConical :size="18" /><span>{{ activity.config.outputLabel || '观察结果' }}</span></div>
          <strong>{{ simulationValue }} <small>{{ activity.config.outputUnit || '' }}</small></strong>
          <i><em :style="{ width: `${simulationBarWidth}%` }"></em></i>
          <p>事故画面保持不变，只有访谈问题中的动词不同。</p>
        </div>
      </section>
      <section class="simulation__conclusion">
        <header><strong>你的结论</strong><span>用结果支持判断</span></header>
        <button
          v-for="choice in activity.config.choices"
          :key="choice.id"
          type="button"
          :class="{ selected: simulationConclusion === choice.id }"
          :disabled="solved"
          @click="simulationConclusion = choice.id"
        ><span>{{ choiceLetter(choice.id) }}</span>{{ choice.label }}<Check v-if="simulationConclusion === choice.id" :size="16" /></button>
      </section>
    </div>

    <div v-else-if="isShortAnswer" class="short-answer">
      <div class="short-answer__scaffold">
        <PenLine :size="17" />
        <div><strong>写成可执行方案</strong><p>包含至少两步操作，并说明其中一步怎样减少记忆污染。</p></div>
      </div>
      <textarea
        v-model="answer"
        :placeholder="activity.config.placeholder || '写下你的解释和理由'"
        :disabled="solved"
        rows="7"
      ></textarea>
      <div class="short-answer__meta"><span>{{ String(answer || '').length }} 字</span><span>先说明怎么做，再说明为什么</span></div>
    </div>

    <div v-else-if="isChoice" class="activity__choices">
      <button
        v-for="choice in activity.config.choices"
        :key="choice.id"
        type="button"
        class="activity__choice"
        :class="{ selected: isSelected(choice.id) }"
        :disabled="submitting || solved"
        @click="selectChoice(choice.id)"
      >
        <span class="activity__choice-mark">{{ choiceLetter(choice.id) }}</span>
        <span>{{ choice.label }}</span>
        <Check v-if="isSelected(choice.id)" :size="17" />
      </button>
    </div>

    <div v-else-if="activity.type === 'sequence'" class="sequence">
      <p class="activity__instruction">用箭头调整顺序。</p>
      <div v-for="(item, index) in sequenceItems" :key="item.id" class="sequence__row">
        <span class="sequence__number">{{ index + 1 }}</span>
        <span>{{ item.label }}</span>
        <div class="sequence__actions">
          <button type="button" title="上移" :disabled="index === 0 || solved" @click="moveSequence(index, -1)"><ArrowUp :size="16" /></button>
          <button type="button" title="下移" :disabled="index === sequenceItems.length - 1 || solved" @click="moveSequence(index, 1)"><ArrowDown :size="16" /></button>
        </div>
      </div>
    </div>

    <div v-else-if="activity.type === 'classify'" class="classify">
      <div class="classify__board">
        <section class="classify__evidence" @dragover.prevent @drop="unassignDragged">
          <header><strong>证据</strong><span>可拖动</span></header>
          <p>选择一条观察，再把它放到最能解释这一现象的位置。</p>
          <div class="classify__pool">
            <button
              v-for="item in unassignedItems"
              :key="item.id"
              type="button"
              draggable="true"
              class="classify__item"
              :class="{ active: activeClassifyItem === item.id }"
              :disabled="solved"
              @dragstart="draggedItem = item.id"
              @click="activeClassifyItem = item.id"
            >
              <GripVertical :size="15" /><span>{{ item.label }}</span>
            </button>
            <span v-if="unassignedItems.length === 0" class="classify__empty">全部证据已放置</span>
          </div>
        </section>
        <section class="classify__hypotheses">
          <header><strong>解释</strong><span>放置区</span></header>
          <p>每个解释可以接收多条证据，提交前仍可拖回左侧。</p>
          <div class="classify__targets">
            <button
              v-for="category in activity.config.categories"
              :key="category.id"
              type="button"
              class="classify__target"
              :disabled="solved"
              @dragover.prevent
              @drop="assignDragged(category.id)"
              @click="assignActive(category.id)"
            >
              <strong>{{ category.label }}</strong>
              <em>{{ categoryDescription(category) }}</em>
              <span
                v-for="item in itemsForCategory(category.id)"
                :key="item.id"
                class="classify__assigned"
                draggable="true"
                @dragstart.stop="draggedItem = item.id"
              ><i></i>{{ item.label }}</span>
              <small v-if="itemsForCategory(category.id).length === 0">把证据放到这里</small>
            </button>
          </div>
        </section>
      </div>
    </div>

    <Transition name="feedback">
      <div v-if="feedback" class="feedback" :class="`feedback--${feedback.tone}`" role="status">
        <div class="feedback__icon">
          <CheckCircle2 v-if="feedback.tone === 'success'" :size="20" />
          <RotateCcw v-else :size="20" />
        </div>
        <div>
          <strong>{{ feedback.title }}</strong>
          <p>{{ feedback.message }}</p>
          <p v-if="feedback.hint" class="feedback__hint">提示：{{ feedback.hint }}</p>
          <p v-if="feedback.explanation" class="feedback__explanation">{{ feedback.explanation }}</p>
        </div>
        <aside v-if="feedback.tone === 'retry'" class="feedback__next">
          <Compass :size="18" />
          <strong>再想一步</strong>
          <p>{{ retryPrompt }}</p>
          <button type="button" @click="resetFeedback">重新调整</button>
        </aside>
      </div>
    </Transition>

    <footer v-if="!externalControls" class="activity__footer">
      <span>{{ solved ? '已形成 1 条掌握证据' : '答案提交后会更新掌握度' }}</span>
      <button v-if="!solved" type="button" class="activity__submit" :disabled="!canSubmit || submitting" @click="submit">
        <LoaderCircle v-if="submitting" :size="17" class="spin" />
        <Check v-else :size="17" />
        {{ submitting ? '正在判断' : feedback ? '再次检查' : '检查答案' }}
      </button>
      <span v-else class="activity__passed"><CheckCircle2 :size="17" /> 已通过</span>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp, Check, CheckCircle2, Compass, FlaskConical, GripVertical, Lightbulb, LoaderCircle, PenLine, RotateCcw, SlidersHorizontal } from 'lucide-vue-next'
import { useRequest } from '../../composables/useRequest'

const props = defineProps({
  activity: { type: Object, required: true },
  externalControls: { type: Boolean, default: false }
})
const emit = defineEmits(['attempted', 'state-change'])
const { post } = useRequest()
const answer = ref(null)
const feedback = ref(null)
const showHint = ref(false)
const submitting = ref(false)
const solved = ref(Boolean(props.activity.solved))
const sequenceItems = ref([])
const assignments = ref({})
const activeClassifyItem = ref(null)
const draggedItem = ref(null)
const simulationSelection = ref(null)
const simulationConclusion = ref(null)

const renderType = computed(() => props.activity.config.variant || props.activity.type)
const isSimulation = computed(() => renderType.value === 'simulation')
const isShortAnswer = computed(() => renderType.value === 'short_answer')
const isChoice = computed(() => !isSimulation.value && !isShortAnswer.value && ['single_choice', 'multiple_choice'].includes(props.activity.type))
const activityEyebrow = computed(() => ({ classify: '问题', simulation: '实验', short_answer: '迁移' }[renderType.value] || '互动练习'))
const retryPrompt = computed(() => ({
  simulation: '哪个变量被操控，哪个结果随它变化？',
  short_answer: '方案是否同时写清了步骤和减少污染的理由？',
  classify: '哪些信息发生在最初观察之后？'
}[renderType.value] || '回到证据，再检查解释是否覆盖了全部信息。'))
const simulationControl = computed(() => (props.activity.config.controls || []).find(item => item.id === simulationSelection.value) || props.activity.config.controls?.[0] || null)
const simulationValue = computed(() => Number(simulationControl.value?.value || 0))
const simulationBarWidth = computed(() => {
  const values = (props.activity.config.controls || []).map(item => Number(item.value || 0))
  const max = Math.max(...values, 1)
  return Math.max(8, Math.round(simulationValue.value / max * 100))
})
const unassignedItems = computed(() => (props.activity.config.items || []).filter(item => !assignments.value[item.id]))
const canSubmit = computed(() => {
  if (isSimulation.value) return Boolean(simulationSelection.value && simulationConclusion.value)
  if (isShortAnswer.value) return String(answer.value || '').trim().length >= 12
  if (props.activity.type === 'single_choice') return Boolean(answer.value)
  if (props.activity.type === 'multiple_choice') return Array.isArray(answer.value) && answer.value.length > 0
  if (props.activity.type === 'sequence') return sequenceItems.value.length > 0
  if (props.activity.type === 'classify') return unassignedItems.value.length === 0
  return false
})
const answerProgress = computed(() => {
  if (isSimulation.value) return { answered: simulationConclusion.value ? 2 : simulationSelection.value ? 1 : 0, total: 2 }
  if (isShortAnswer.value) return { answered: Math.min(String(answer.value || '').trim().length, Number(props.activity.config.minLength || 24)), total: Number(props.activity.config.minLength || 24) }
  if (props.activity.type === 'classify') {
    return { answered: (props.activity.config.items || []).length - unassignedItems.value.length, total: (props.activity.config.items || []).length }
  }
  if (props.activity.type === 'multiple_choice') {
    return { answered: answer.value?.length || 0, total: (props.activity.config.choices || []).length }
  }
  if (props.activity.type === 'single_choice') {
    return { answered: answer.value ? 1 : 0, total: 1 }
  }
  return { answered: sequenceItems.value.length, total: sequenceItems.value.length }
})

function reset() {
  answer.value = props.activity.type === 'multiple_choice' ? [] : null
  const items = [...(props.activity.config.items || [])]
  sequenceItems.value = items.length > 1 ? [...items.slice(1), items[0]] : items
  assignments.value = {}
  feedback.value = null
  showHint.value = false
  solved.value = Boolean(props.activity.solved)
  activeClassifyItem.value = null
  draggedItem.value = null
  simulationSelection.value = props.activity.config.controls?.[0]?.id || null
  simulationConclusion.value = null
}

function choiceLetter(id) {
  const index = (props.activity.config.choices || []).findIndex(choice => choice.id === id)
  return String.fromCharCode(65 + Math.max(0, index))
}

function isSelected(id) {
  return Array.isArray(answer.value) ? answer.value.includes(id) : answer.value === id
}

function selectChoice(id) {
  if (props.activity.type === 'multiple_choice') {
    answer.value = answer.value.includes(id) ? answer.value.filter(item => item !== id) : [...answer.value, id]
  } else {
    answer.value = id
  }
}

function moveSequence(index, direction) {
  const target = index + direction
  if (target < 0 || target >= sequenceItems.value.length) return
  const next = [...sequenceItems.value]
  ;[next[index], next[target]] = [next[target], next[index]]
  sequenceItems.value = next
}

function assign(itemId, categoryId) {
  if (!itemId) return
  assignments.value = { ...assignments.value, [itemId]: categoryId }
  activeClassifyItem.value = null
  draggedItem.value = null
}

function assignDragged(categoryId) { assign(draggedItem.value, categoryId) }
function assignActive(categoryId) { assign(activeClassifyItem.value, categoryId) }
function unassignDragged() {
  if (!draggedItem.value) return
  const next = { ...assignments.value }
  delete next[draggedItem.value]
  assignments.value = next
  draggedItem.value = null
}
function itemsForCategory(categoryId) {
  return (props.activity.config.items || []).filter(item => assignments.value[item.id] === categoryId)
}
function resetFeedback() {
  feedback.value = null
  showHint.value = false
}
function categoryDescription(category) {
  const descriptions = {
    encoding: '最初接收到的信息本身不同',
    retrieval: '信息已存入，但暂时无法取出',
    reconstruction: '事后信息改变了回忆内容'
  }
  return descriptions[category.id] || '把最支持它的证据放在这里'
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    const value = isSimulation.value
      ? { control: simulationSelection.value, conclusion: simulationConclusion.value }
      : props.activity.type === 'sequence'
        ? sequenceItems.value.map(item => item.id)
        : props.activity.type === 'classify' ? assignments.value : answer.value
    const result = await post(`/learning/activities/${props.activity.id}/attempts`, { answer: value })
    feedback.value = result.attempt.feedback
    solved.value = result.attempt.correct
    emit('attempted', { activityId: props.activity.id, ...result })
  } finally {
    submitting.value = false
  }
}

watch(() => props.activity.id, reset, { immediate: true })
watch([canSubmit, submitting, solved, () => Boolean(feedback.value), answerProgress], () => {
  emit('state-change', {
    activityId: props.activity.id,
    canSubmit: canSubmit.value,
    submitting: submitting.value,
    solved: solved.value,
    hasFeedback: Boolean(feedback.value),
    answered: answerProgress.value.answered,
    total: answerProgress.value.total
  })
}, { immediate: true })

defineExpose({ submit })
</script>

<style scoped>
.activity { border: 1px solid #d9ddd8; background: #fff; }
.activity--solved { border-color: #90c8a4; }
.activity__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 24px 26px 20px; border-bottom: 1px solid #e7e9e6; }
.activity__eyebrow { display: block; margin-bottom: 7px; color: #1769d1; font-size: 11px; font-weight: 750; }
.activity h3 { max-width: 680px; font-size: 18px; line-height: 1.45; font-weight: 680; }
.activity__knowledge { flex: 0 0 auto; padding: 4px 7px; border: 1px solid #d6dde8; color: #496278; font-size: 11px; }
.activity__hint-button { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 11px; border: 1px solid #cfd5d0; border-radius: 5px; background: #fff; color: #3d453e; font-size: 11px; cursor: pointer; }
.activity__hint-button:hover { border-color: #1769d1; color: #1769d1; }
.activity__inline-hint { display: flex; align-items: flex-start; gap: 9px; margin: 0 0 15px 58px; color: #59615a; font-size: 11px; line-height: 1.6; }
.activity__inline-hint svg { flex: 0 0 auto; margin-top: 1px; color: #1769d1; }
.activity__choices { display: grid; gap: 8px; padding: 22px 26px; }
.activity__choice { display: grid; grid-template-columns: 30px 1fr 18px; gap: 12px; align-items: center; min-height: 52px; padding: 10px 14px; border: 1px solid #dce0dc; background: #fff; color: #252925; text-align: left; cursor: pointer; transition: border-color 150ms, background 150ms, transform 150ms; }
.activity__choice:hover:not(:disabled) { border-color: #8d9790; transform: translateX(2px); }
.activity__choice.selected { border-color: #1769d1; background: #f3f7fd; }
.activity__choice-mark { display: grid; place-items: center; width: 26px; height: 26px; border: 1px solid #c9ceca; font-family: var(--font-mono); font-size: 11px; }
.activity__choice.selected .activity__choice-mark { border-color: #1769d1; color: #1769d1; }
.activity__instruction { margin-top: 8px; color: #737a74; font-size: 11px; font-weight: 400; }
.sequence { display: grid; gap: 7px; padding: 22px 26px; }
.sequence > .activity__instruction { margin: 0 0 5px; }
.sequence__row { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 12px; min-height: 50px; padding: 8px 10px; border: 1px solid #dce0dc; }
.sequence__number { display: grid; place-items: center; width: 25px; height: 25px; background: #eef2ed; font-family: var(--font-mono); font-size: 11px; }
.sequence__actions { display: flex; }
.sequence__actions button { display: grid; place-items: center; width: 32px; height: 32px; border: 0; background: transparent; cursor: pointer; }
.sequence__actions button:hover:not(:disabled) { background: #eef2ed; }
.simulation { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); min-height: 360px; }
.simulation__controls, .simulation__conclusion { min-width: 0; padding: 22px 24px; }
.simulation__controls { border-right: 1px solid #e0e4e0; background: #fafbfa; }
.simulation__controls > header, .simulation__conclusion > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.simulation__controls > header span { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 750; }
.simulation__controls > header small, .simulation__conclusion > header span { color: #858c86; font: 9px var(--font-mono); }
.simulation__segments { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid #d5dad5; }
.simulation__segments button { min-height: 42px; padding: 6px; border-right: 1px solid #d5dad5; background: #fff; color: #535b54; font-size: 11px; cursor: pointer; }
.simulation__segments button:last-child { border-right: 0; }
.simulation__segments button.active { background: #1769d1; color: #fff; }
.simulation__readout { display: grid; gap: 12px; margin-top: 26px; padding-top: 20px; border-top: 1px solid #e0e4e0; }
.simulation__readout > div { display: flex; align-items: center; gap: 8px; color: #586059; font-size: 11px; }
.simulation__readout strong { font: 700 34px var(--font-mono); }
.simulation__readout strong small { color: #717972; font-size: 11px; font-weight: 500; }
.simulation__readout i { display: block; height: 7px; background: #e4e8e4; }
.simulation__readout em { display: block; height: 100%; background: #159447; transition: width 300ms cubic-bezier(.16,1,.3,1); }
.simulation__readout p { color: #747b75; font-size: 10px; line-height: 1.55; }
.simulation__conclusion { display: grid; align-content: start; gap: 8px; }
.simulation__conclusion > header strong { font-size: 12px; }
.simulation__conclusion > button { display: grid; grid-template-columns: 26px 1fr 17px; align-items: center; gap: 10px; min-height: 58px; padding: 10px; border: 1px solid #d9ded9; background: #fff; color: #333934; font-size: 11px; line-height: 1.5; text-align: left; cursor: pointer; }
.simulation__conclusion > button > span { display: grid; place-items: center; width: 24px; height: 24px; border: 1px solid #cfd4cf; font: 10px var(--font-mono); }
.simulation__conclusion > button.selected { border-color: #1769d1; background: #f3f7fd; color: #15539f; }
.short-answer { display: grid; gap: 12px; padding: 22px 26px; }
.short-answer__scaffold { display: flex; align-items: flex-start; gap: 10px; padding: 13px 14px; border-left: 3px solid #1769d1; background: #f4f7fb; }
.short-answer__scaffold svg { flex: 0 0 auto; color: #1769d1; }
.short-answer__scaffold strong { display: block; font-size: 12px; }
.short-answer__scaffold p { margin-top: 3px; color: #68716a; font-size: 10px; line-height: 1.55; }
.short-answer textarea { width: 100%; min-height: 150px; padding: 13px 14px; border: 1px solid #d7dcd7; outline: 0; resize: vertical; color: #2f3530; font: 13px/1.75 var(--font-body); }
.short-answer textarea:focus { border-color: #1769d1; }
.short-answer__meta { display: flex; justify-content: space-between; color: #858c86; font-size: 9px; }
.classify { padding: 0; }
.activity--classify { border: 0; }
.activity--classify .activity__header { padding: 0 0 25px; border-bottom: 0; }
.activity--classify .activity__eyebrow { display: inline-block; margin-right: 12px; margin-bottom: 7px; padding: 3px 7px; border-radius: 3px; background: #2f72e6; color: #fff; }
.activity--classify h3 { display: inline; font-size: 15px; }
.classify__board { display: grid; grid-template-columns: minmax(0, .88fr) minmax(0, 1.12fr); min-height: 330px; border: 1px dashed #cfd5d0; border-radius: 6px; overflow: hidden; }
.classify__evidence, .classify__hypotheses { min-width: 0; padding: 15px; }
.classify__evidence { border-right: 1px solid #dfe3df; background: #fafbfa; }
.classify__evidence > header, .classify__hypotheses > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 7px; }
.classify__evidence > header strong, .classify__hypotheses > header strong { font-size: 13px; }
.classify__evidence > header span, .classify__hypotheses > header span { color: #7b827c; font-family: var(--font-mono); font-size: 9px; }
.classify__evidence > p, .classify__hypotheses > p { min-height: 29px; color: #7a817b; font-size: 10px; line-height: 1.55; }
.classify__pool { display: grid; align-content: start; gap: 8px; min-height: 210px; margin-top: 10px; }
.classify__item { display: grid; grid-template-columns: 16px 1fr; align-items: start; gap: 8px; padding: 11px 12px; border: 1px solid #d5dad5; background: #fff; color: #303631; font-size: 13px; text-align: left; cursor: grab; box-shadow: 0 2px 5px rgba(24,32,25,.04); transition: border-color 160ms, box-shadow 160ms, transform 160ms; }
.classify__item:hover:not(:disabled) { border-color: #8f9991; transform: translateY(-1px); box-shadow: 0 5px 12px rgba(24,32,25,.07); }
.classify__item svg { margin-top: 2px; color: #858c86; }
.classify__item.active { border-color: #1769d1; box-shadow: 0 0 0 2px #dfeafa; }
.classify__empty { align-self: center; justify-self: center; color: #727872; font-size: 11px; }
.classify__targets { display: grid; gap: 8px; margin-top: 10px; }
.classify__target { display: flex; flex-direction: column; align-items: stretch; gap: 4px; min-height: 66px; padding: 8px; border: 1px dashed #c8cec9; background: #fff; text-align: left; cursor: pointer; transition: border-color 160ms, background 160ms; }
.classify__target:hover:not(:disabled) { border-color: #1769d1; background: #f8fafd; }
.classify__target > strong { padding-bottom: 4px; border-bottom: 1px solid #e7e9e6; font-size: 13px; }
.classify__target > em { color: #7b827c; font-size: 10px; font-style: normal; line-height: 1.4; }
.classify__target small { margin: auto; color: #9aa09b; font-size: 10px; text-align: center; }
.classify__assigned { display: grid; grid-template-columns: 7px 1fr; align-items: start; gap: 6px; padding: 4px 6px; background: #edf6ef; color: #344438; font-size: 11px; line-height: 1.3; cursor: grab; }
.classify__assigned i { width: 6px; height: 6px; margin-top: 5px; border-radius: 50%; background: #159447; }
.feedback { display: grid; grid-template-columns: 24px 1fr; gap: 12px; margin: 20px 0 0; padding: 18px 20px; border: 1px solid; border-left-width: 3px; border-radius: 6px; }
.feedback--success { border-color: #159447; background: #f2f9f4; color: #105e30; }
.feedback--retry { border-color: #ef6a4b; background: #fff6f3; color: #8c321f; }
.feedback--retry { grid-template-columns: 24px minmax(0, 1fr) 150px; }
.activity--classify .feedback--retry { min-height: 205px; }
.activity--classify .feedback { margin-top: 36px; }
.feedback strong { display: block; margin-bottom: 5px; font-size: 14px; }
.feedback p { color: #4e554f; font-size: 13px; line-height: 1.65; }
.feedback__hint { margin-top: 7px; }
.feedback__explanation { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(21,148,71,.18); }
.feedback__next { display: grid; align-content: start; gap: 7px; padding-left: 18px; border-left: 1px solid #e7c7bd; }
.feedback__next svg { color: #6d3a2e; }
.feedback__next strong { margin: 0; font-size: 12px; }
.feedback__next p { font-size: 10px; }
.feedback__next button { justify-self: start; min-height: 32px; margin-top: 5px; padding: 0 11px; border: 1px solid #c9b9b3; border-radius: 4px; background: #fff; color: #4c3a35; font-size: 10px; cursor: pointer; }
.activity__footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 62px; padding: 10px 26px; border-top: 1px solid #e7e9e6; color: #777d78; font-size: 11px; }
.activity__submit { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 18px; border: 0; background: #159447; color: #fff; font-weight: 700; cursor: pointer; }
.activity__submit:hover:not(:disabled) { background: #0f7c3a; }
.activity__submit:disabled { opacity: .45; cursor: not-allowed; }
.activity__passed { display: inline-flex; align-items: center; gap: 7px; color: #126c35; font-weight: 700; }
.feedback-enter-active { transition: opacity 250ms, transform 250ms cubic-bezier(.16,1,.3,1); }
.feedback-enter-from { opacity: 0; transform: translateY(8px); }
.spin { animation: spin 800ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 720px) {
  .activity__header, .activity__choices, .sequence, .classify { padding-left: 16px; padding-right: 16px; }
  .activity__header { flex-direction: column; gap: 10px; }
  .activity--classify .activity__header { padding-left: 0; padding-right: 0; }
  .activity__inline-hint { margin-left: 0; }
  .classify { padding-left: 0; padding-right: 0; }
  .classify__board { grid-template-columns: 1fr; }
  .simulation { grid-template-columns: 1fr; }
  .simulation__controls { border-right: 0; border-bottom: 1px solid #e0e4e0; }
  .classify__evidence { border-right: 0; border-bottom: 1px solid #dfe3df; }
  .classify__evidence, .classify__hypotheses { padding: 17px 16px; }
  .classify__pool { min-height: 100px; }
  .feedback { margin-left: 16px; margin-right: 16px; }
  .feedback--retry { grid-template-columns: 24px 1fr; }
  .feedback__next { grid-column: 1 / -1; padding: 14px 0 0; border-top: 1px solid #e7c7bd; border-left: 0; }
  .activity__footer { align-items: stretch; flex-direction: column; padding: 13px 16px; }
  .activity__submit { justify-content: center; }
}
</style>
