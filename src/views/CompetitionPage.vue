<template>
  <div class="page">
    <section class="hero gradient-hero" style="min-height:auto;padding:48px 40px 40px;">
      <div class="blur-orb blur-orb--green" style="width:200px;height:200px;top:-50px;right:-40px;opacity:0.2;"></div>
      <p class="section-label">Competition</p>
      <h1 class="page-heading" style="font-size:32px;">竞赛库</h1>
      <p class="page-subtitle" style="margin-top:6px;">报名时间、竞赛方向、训练重点 — 先看清楚再出发。</p>
    </section>

    <section class="section" style="padding-top:0;">
      <!-- Filters -->
      <div class="toolbar">
        <input v-model.trim="keyword" class="field__input" type="text" placeholder="搜索竞赛名称或关键词" />
        <select v-model="category" class="field__input">
          <option value="all">全部方向</option>
          <option value="数学建模">数学建模</option>
          <option value="创新创业">创新创业</option>
          <option value="程序设计">程序设计</option>
        </select>
      </div>

      <!-- Grid -->
      <div class="comp-grid">
        <router-link v-for="(item, i) in filteredList" :key="item.id"
          class="card comp-card"
          :class="`animate-fade-up animate-fade-up--${Math.min(i + 1, 4)}`"
          :to="`/competition/${item.id}`"
        >
          <div class="comp-card__top">
            <span class="pill">{{ item.category }}</span>
            <span class="pill pill--active" v-if="item.level">{{ item.level }}</span>
          </div>
          <h2 class="comp-card__title">{{ item.title }}</h2>
          <p class="comp-card__desc">{{ item.description?.slice(0, 80) || '查看报名时间、参赛规则与备赛路径。' }}</p>
          <div class="comp-card__meta">
            <span>{{ item.status || '关注中' }}</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRequest } from '../composables/useRequest'

const { get } = useRequest()
const keyword = ref('')
const category = ref('all')
const list = ref([
  { id: 1, title: '全国大学生数学建模竞赛', category: '数学建模', level: '国家级', status: '报名准备', description: '建模、论文表达、数据分析与团队协作。' },
  { id: 2, title: '中国国际大学生创新大赛', category: '创新创业', level: '国家级', status: '项目打磨', description: '创意、产品、商业计划和路演表达。' },
  { id: 3, title: 'ACM-ICPC 程序设计竞赛', category: '程序设计', level: '国际级', status: '训练中', description: '算法、协作、解题速度。' },
  { id: 4, title: '蓝桥杯软件和信息技术大赛', category: '程序设计', level: '国家级', status: '适合入门', description: '程序设计竞赛第一站。' },
])

const filteredList = computed(() => {
  const k = keyword.value.toLowerCase()
  return list.value.filter(item => {
    if (category.value !== 'all' && item.category !== category.value) return false
    if (k && !`${item.title}${item.category}${item.description || ''}`.toLowerCase().includes(k)) return false
    return true
  })
})

onMounted(async () => {
  try {
    const data = await get('/competitions', { pageSize: 100 })
    const remote = data?.list || []
    if (remote.length) list.value = remote.map((item, idx) => ({ id: item.id || idx + 1, title: item.title, category: item.category, level: item.level, status: item.status, description: item.description }))
  } catch {}
})
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg-primary); }
.section { max-width: 1080px; margin: 0 auto; padding: 0 40px 56px; }
.toolbar { display: grid; grid-template-columns: 1fr 180px; gap: 12px; margin-bottom: 28px; }
.comp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.comp-card { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
.comp-card__top { display: flex; gap: 8px; }
.comp-card__title { font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: var(--text-primary); line-height: 1.25; }
.comp-card__desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0; }
.comp-card__meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted); }
@media (max-width: 780px) { .comp-grid { grid-template-columns: 1fr; } .toolbar { grid-template-columns: 1fr; } .section { padding: 0 20px 40px; } }
</style>
