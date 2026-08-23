<template>
  <div class="page">
    <section class="ex-hero">
      <div class="blur-orb blur-orb--green" style="width:220px;height:220px;top:-60px;left:10%;opacity:0.3;"></div>
      <p class="section-label" style="color:rgba(255,255,255,0.55);">Code Practice</p>
      <h1 class="page-heading" style="font-size:32px;color:#fff;">在线刷题</h1>
      <p class="page-subtitle" style="color:rgba(255,255,255,0.6);margin-top:6px;">115 道题目，按难度和语言筛选，直接进入代码训练。</p>
    </section>

    <section class="section" style="padding-top:0;">
      <div class="toolbar">
        <input v-model.trim="keyword" class="field__input" type="text" placeholder="搜索题目名称…" />
        <select v-model="difficulty" class="field__input">
          <option value="all">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>
      </div>

      <!-- Grid -->
      <div class="ex-grid">
        <router-link v-for="(ex, i) in pagedList" :key="ex.id"
          class="card ex-card"
          :class="`animate-fade-up animate-fade-up--${Math.min(i + 1, 4)}`"
          :to="`/exercises/${ex.id}`"
        >
          <div class="ex-card__header">
            <span class="pill pill--active">{{ diffLabel(ex.difficulty) }}</span>
            <span class="ex-card__cat">{{ ex.category }}</span>
          </div>
          <h2 class="ex-card__title">{{ ex.title }}</h2>
          <div class="ex-card__arrow">→</div>
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
.page { min-height: 100vh; background: var(--bg-primary); }
.ex-hero {
  position: relative; overflow: hidden;
  padding: 48px 40px 40px;
  background: linear-gradient(180deg, #1a1a1a 0%, #273020 50%, #1a1a1a 100%);
  color: #fff;
}
.section { max-width: 1080px; margin: 0 auto; padding: 0 40px 56px; }
.toolbar { display: grid; grid-template-columns: 1fr 140px; gap: 12px; margin-bottom: 28px; margin-top: -20px; position: relative; z-index: 2; }
.ex-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.ex-card { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; gap: 16px; }
.ex-card__header { display: flex; align-items: center; gap: 10px; }
.ex-card__cat { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.ex-card__title { font-family: var(--font-heading); font-size: 17px; font-weight: 700; color: var(--text-primary); flex: 1; }
.ex-card__arrow { font-size: 20px; color: var(--brand-green); transition: transform 0.3s ease; }
.ex-card:hover .ex-card__arrow { transform: translateX(6px); }
@media (max-width: 780px) { .ex-grid { grid-template-columns: 1fr; } .section { padding: 0 20px 40px; } .toolbar { grid-template-columns: 1fr; } .ex-hero { padding: 40px 20px 36px; } }
</style>
