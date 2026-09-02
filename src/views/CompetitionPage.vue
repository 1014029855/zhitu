<template>
  <div class="product-page competition-page">
    <header class="product-header">
      <div class="product-header__copy">
        <p class="product-header__eyebrow">竞赛训练</p>
        <h1>竞赛库</h1>
        <p>先看能力要求和备赛阶段，再决定是否投入。每项竞赛都可以转成可执行的训练目标。</p>
        <div class="product-header__meta"><span>数学建模</span><span>创新创业</span><span>程序设计</span></div>
      </div>
      <router-link to="/" class="btn btn--outline"><Target :size="16" />查看学习目标</router-link>
    </header>

    <section>
      <div class="product-toolbar">
        <input v-model.trim="keyword" class="field__input product-toolbar__search" type="search" placeholder="搜索竞赛名称或关键词" />
        <select v-model="category" class="field__input">
          <option value="all">全部方向</option>
          <option value="数学建模">数学建模</option>
          <option value="创新创业">创新创业</option>
          <option value="程序设计">程序设计</option>
        </select>
        <span class="product-toolbar__count">{{ filteredList.length }} 项竞赛</span>
      </div>

      <div class="product-list competition-list">
        <router-link v-for="(item, i) in filteredList" :key="item.id"
          class="product-row competition-row"
          :to="`/competition/${item.id}`"
        >
          <span class="product-row__index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="product-row__main"><strong>{{ item.title }}</strong><p>{{ item.description?.slice(0, 96) || '查看报名时间、参赛规则与备赛路径。' }}</p></span>
          <span class="status-tag">{{ item.category }}</span>
          <span v-if="item.level" class="product-row__meta">{{ item.level }}</span>
          <span class="status-tag status-tag--green">{{ item.status || '关注中' }}</span>
          <span class="product-row__action"><ArrowRight :size="17" /></span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ArrowRight, Target } from 'lucide-vue-next'
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
.product-toolbar select { flex: 0 0 170px; width: 170px; }
.competition-row { grid-template-columns: 34px minmax(280px, 1fr) 90px 70px 86px 20px; }
@media (max-width: 820px) {
  .competition-row { grid-template-columns: 28px minmax(0, 1fr) 78px 18px; }
  .competition-row > :nth-child(4), .competition-row > :nth-child(5) { display: none; }
  .product-toolbar select { width: 100%; flex-basis: auto; }
}
</style>
