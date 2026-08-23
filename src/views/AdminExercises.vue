<template>
  <section class="page">
    <header class="page__header">
      <p class="section-label">Exercise Ops</p>
      <h1 class="page__title">题库管理</h1>
      <p class="page__desc">按知识点起草题目，检查难度、语言和题库覆盖。</p>
    </header>

    <div class="generator">
      <input v-model.trim="genTopic" class="field__input" placeholder="知识点，例如：动态规划" />
      <select v-model="genDifficulty" class="field__input">
        <option value="easy">简单</option>
        <option value="medium">中等</option>
        <option value="hard">困难</option>
      </select>
      <select v-model="genLanguage" class="field__input">
        <option value="python">Python</option>
        <option value="c++">C++</option>
        <option value="java">Java</option>
        <option value="all">不限语言</option>
      </select>
      <button class="btn btn--primary" type="button" @click="generateExercise" :disabled="genLoading">
        {{ genLoading ? '生成中' : '生成题目' }}
      </button>
    </div>

    <article v-if="genResult" class="gen-result">
      <span class="gen-result__label">新题草稿</span>
      <h2 class="gen-result__title">{{ genResult.title }}</h2>
      <p class="gen-result__desc">{{ genResult.description }}</p>
    </article>

    <div class="exercise-list">
      <article v-for="item in exercises" :key="item.id" class="exercise-list__item">
        <span class="exercise-list__diff">{{ diffLabel(item.difficulty) }}</span>
        <strong class="exercise-list__title">{{ item.title }}</strong>
        <em class="exercise-list__meta">{{ item.category }} / {{ item.language }}</em>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRequest } from '../composables/useRequest'

const { get, post } = useRequest()
const exercises = ref([])
const genTopic = ref('')
const genDifficulty = ref('medium')
const genLanguage = ref('python')
const genLoading = ref(false)
const genResult = ref(null)

function diffLabel(value) {
  return { easy: '简单', medium: '中等', hard: '困难' }[value] || '训练'
}

async function loadData() {
  try {
    const data = await get('/exercises', { pageSize: 100 })
    exercises.value = data?.list || []
  } catch {
    exercises.value = []
  }
}

async function generateExercise() {
  genLoading.value = true
  genResult.value = null

  try {
    genResult.value = await post('/admin/exercises/generate', {
      topic: genTopic.value,
      difficulty: genDifficulty.value,
      language: genLanguage.value
    })
    await loadData()
  } catch {
    genResult.value = null
  } finally {
    genLoading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 40px;
  min-height: 100vh;
  background: var(--bg-secondary);
}

.page__header {
  margin-bottom: 32px;
}

.page__title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.3px;
  margin-bottom: 8px;
}

.page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 0;
}

.generator {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 130px 130px 120px;
  gap: 12px;
  margin-bottom: 32px;
}

.gen-result {
  display: grid;
  gap: 8px;
  margin-bottom: 32px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 24px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.gen-result__label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.gen-result__title {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0;
}

.gen-result__desc {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.exercise-list {
  border-top: 1px solid var(--border-primary);
}

.exercise-list__item {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) 200px;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-light);
}

.exercise-list__diff {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.exercise-list__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.exercise-list__meta {
  font-size: 13px;
  color: var(--text-tertiary);
  font-style: normal;
}

@media (max-width: 900px) {
  .generator {
    grid-template-columns: 1fr 1fr;
  }

  .exercise-list__item {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
