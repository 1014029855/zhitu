<template>
  <div class="product-page exercise-page">
    <header class="product-header">
      <div class="product-header__copy">
        <p class="product-header__eyebrow">刻意练习</p>
        <h1>在线刷题</h1>
        <p>按知识类型和难度训练。代码在本地轻量沙箱中运行，提交记录会进入你的掌握证据。</p>
        <div class="product-header__meta"><span>{{ exercises.length }} 道题目</span><span>本地判题</span><span>即时反馈</span></div>
      </div>
      <router-link to="/leaderboard" class="btn btn--outline"><BarChart3 :size="16" />训练排行</router-link>
    </header>

    <section>
      <div class="product-toolbar">
        <input v-model.trim="keyword" class="field__input product-toolbar__search" type="search" placeholder="搜索题目名称或知识类型" />
        <select v-model="difficulty" class="field__input">
          <option value="all">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>
        <span class="product-toolbar__count">{{ filteredList.length }} 道可练习</span>
      </div>

      <div class="product-list exercise-list">
        <router-link v-for="(ex, i) in pagedList" :key="ex.id"
          class="product-row exercise-row"
          :to="`/exercises/${ex.id}`"
        >
          <span class="product-row__index">{{ String((page - 1) * pageSize + i + 1).padStart(3, '0') }}</span>
          <span class="status-tag" :class="difficultyClass(ex.difficulty)">{{ diffLabel(ex.difficulty) }}</span>
          <span class="product-row__main"><strong>{{ ex.title }}</strong><p>用代码验证思路，运行后查看逐测试点结果。</p></span>
          <span class="product-row__meta">{{ ex.category }}</span>
          <span class="product-row__action"><ArrowRight :size="17" /></span>
        </router-link>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="totalPages > 1"
        :current="page"
        :total="filteredList.length"
        :page-size="pageSize"
        @change="goPage"
      />
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ArrowRight, BarChart3 } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'
import Pagination from '../components/Pagination.vue'

const { get } = useRequest()
const keyword = ref('')
const difficulty = ref('all')
const exercises = ref([])
const page = ref(1)
const pageSize = 30

const filteredList = computed(() => {
  const k = keyword.value.toLowerCase()
  let list = exercises.value
  if (difficulty.value !== 'all') list = list.filter(e => e.difficulty === difficulty.value)
  if (k) list = list.filter(e => e.title.toLowerCase().includes(k) || e.category.toLowerCase().includes(k))
  return list
})

const totalPages = computed(() => Math.ceil(filteredList.value.length / pageSize))

const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

function diffLabel(v) { return { easy: '简单', medium: '中等', hard: '困难' }[v] || v }
function difficultyClass(v) { return { easy: 'status-tag--green', medium: 'status-tag--blue', hard: 'status-tag--coral' }[v] || '' }

function goPage(p) { page.value = p }

onMounted(async () => {
  try {
    const data = await get('/exercises', { pageSize: 200 })
    exercises.value = (data?.list || []).map(item => ({
      id: item.id, title: item.title, difficulty: item.difficulty, category: item.category || '综合题'
    }))
  } catch {}
})
</script>

<style scoped>
.product-toolbar select { flex: 0 0 140px; width: 140px; }
.exercise-row { grid-template-columns: 44px 62px minmax(0, 1fr) 120px 20px; }
@media (max-width: 720px) {
  .product-toolbar select { width: 100%; flex-basis: auto; }
  .exercise-row { grid-template-columns: 38px 58px minmax(0, 1fr) 18px; }
  .exercise-row > :nth-child(4) { display: none; }
}
</style>
