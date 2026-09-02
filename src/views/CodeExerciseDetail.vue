<template>
  <section class="exercise-detail">
    <LoadingSpinner :show="loading" />

    <div v-if="exercise && !loading" class="exercise-detail__layout">
      <aside class="problem-panel">
        <router-link class="back-link" to="/exercises">
          <ArrowRight :size="16" :stroke-width="1.5" class="back-link__icon" />
          刷题中心
        </router-link>
        <div class="tags">
          <span class="tag">{{ diffLabel(exercise.difficulty) }}</span>
          <span class="tag">{{ exercise.category }}</span>
        </div>
        <h1 class="problem-panel__title">{{ exercise.title }}</h1>
        <p class="problem-panel__desc">{{ exercise.description }}</p>
        <div v-if="exercise.hint" class="hint-box">
          <strong>提示</strong>
          <p>{{ exercise.hint }}</p>
        </div>
        <JudgeResult :result="judgeResult" />
      </aside>

      <main class="editor-panel">
        <CodeEditor v-model="code" :language="language" @update:language="setLanguage" />
        <div class="run-actions">
          <button class="btn btn--primary" type="button" @click="submitCode" :disabled="submitting || !code.trim() || !judgeAvailable">
            {{ submitLabel }}
          </button>
          <button class="btn" type="button" @click="code = exercise.template_code || ''">重置代码</button>
          <button class="btn btn--primary" type="button" @click="openAiDrawer" v-if="judgeResult">
            <MessageCircle :size="16" :stroke-width="1.5" />
            问 AI
          </button>
        </div>
        <p v-if="judgeMessage" class="execution-notice" role="status">{{ judgeMessage }}</p>
      </main>
    </div>

    <AiDrawer :visible="aiVisible" :context="aiContext" @close="aiVisible = false" />
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { MessageCircle } from 'lucide-vue-next'
import AiDrawer from '../components/AiDrawer.vue'
import { useRoute } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'
import CodeEditor from '../components/CodeEditor.vue'
import JudgeResult from '../components/JudgeResult.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const route = useRoute()
const { get, post } = useRequest()

const exercise = ref(null)
const code = ref('')
const language = ref('python')
const loading = ref(true)
const submitting = ref(false)
const judgeResult = ref(null)
const judgeAvailable = ref(false)
const judgeMessage = ref('正在检查判题服务')
const aiVisible = ref(false)
const aiContext = ref({})

const submitLabel = computed(() => {
  if (submitting.value) return '判题中'
  return judgeAvailable.value ? '提交运行' : '判题暂不可用'
})

async function refreshJudgeStatus() {
  judgeAvailable.value = false
  judgeMessage.value = '正在检查判题服务'
  try {
    const status = await get('/ai/judge/status', { language: language.value })
    judgeAvailable.value = Boolean(status?.available)
    judgeMessage.value = status?.available
      ? (status?.warning || '')
      : (status?.message || '判题服务当前不可用')
  } catch (e) {
    judgeMessage.value = e.response?.data?.message || '无法确认判题服务状态'
  }
}

function setLanguage(value) {
  language.value = value
  refreshJudgeStatus()
}

function openAiDrawer() {
  aiContext.value = {
    type: 'exercise',
    id: route.params.id,
    question: '我的代码哪里有问题？该怎么改？',
    content: `题目: ${exercise.value?.title}\n描述: ${exercise.value?.description}\n代码: ${code.value}\n判题结果: ${JSON.stringify(judgeResult.value)}`
  }
  aiVisible.value = true
}

function diffLabel(d) {
  return d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'
}

onMounted(async () => {
  try {
    exercise.value = await get(`/exercises/${route.params.id}`)
    if (exercise.value) {
      code.value = exercise.value.template_code || ''
      if (exercise.value.language && exercise.value.language !== 'all') {
        language.value = exercise.value.language
      }
    }
    await refreshJudgeStatus()
  } catch (e) {
    console.error(e)
    judgeMessage.value = e.response?.data?.message || '无法确认判题服务状态'
  } finally {
    loading.value = false
  }
})

async function submitCode() {
  submitting.value = true
  try {
    const result = await post('/ai/judge', {
      code: code.value,
      language: language.value,
      exerciseId: exercise.value.id
    }, { timeout: 45000 })
    judgeResult.value = result
  } catch (e) {
    console.error(e)
    judgeMessage.value = e.response?.data?.message || '代码提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.exercise-detail {
  min-height: calc(100vh - 60px);
  background: var(--bg-primary);
}

.exercise-detail__layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.42fr) minmax(0, 0.58fr);
  min-height: calc(100vh - 60px);
}

.problem-panel {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 48px 32px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
}

.back-link:hover {
  color: var(--text-primary);
}

.back-link__icon {
  transform: rotate(180deg);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  background: var(--text-primary);
  color: var(--bg-primary);
}

.problem-panel__title {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0;
  margin: 0;
  color: var(--text-primary);
}

.problem-panel__desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-wrap;
}

.hint-box {
  display: grid;
  gap: 8px;
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
}

.hint-box strong {
  font-size: 13px;
  color: var(--text-primary);
}

.hint-box p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.editor-panel {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 48px 32px;
  background: var(--bg-primary);
}

.run-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.execution-notice {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

@media (max-width: 980px) {
  .exercise-detail__layout {
    grid-template-columns: 1fr;
  }
}
</style>
