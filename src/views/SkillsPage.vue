<template>
  <div class="catalog-page">
    <LearningTopNav />
    <header class="catalog-header">
      <div>
        <span class="catalog-header__eyebrow">通识课程</span>
        <h1>把知识学会，不只是看完</h1>
        <p>从真实问题进入概念，用作答证据更新掌握度，再在合适的时候复习。</p>
      </div>
      <div class="catalog-header__stats">
        <div><strong>{{ skills.length }}</strong><span>门课程</span></div>
        <div><strong>{{ totalLessons }}</strong><span>个课时</span></div>
        <div><strong>{{ totalInteractive }}</strong><span>个互动课时</span></div>
      </div>
    </header>

    <main class="catalog-main">
      <section v-if="continueCourse" class="continue-band">
        <div class="continue-band__mark"><Play :size="18" fill="currentColor" /></div>
        <div>
          <span>继续学习</span>
          <h2>{{ continueCourse.title }}</h2>
          <p>{{ continueCourse.active_lesson_title || '返回上次学习的位置' }}</p>
        </div>
        <div class="continue-band__mastery">
          <span>整体掌握</span><strong>{{ continueCourse.mastery_score || 0 }}%</strong>
          <i><b :style="{ width: `${continueCourse.mastery_score || 0}%` }"></b></i>
        </div>
        <router-link :to="`/skills/${continueCourse.id}/lessons/${continueCourse.active_lesson_id}`">
          继续<ArrowRight :size="17" />
        </router-link>
      </section>

      <section class="catalog-tools">
        <div class="catalog-search">
          <Search :size="17" />
          <input v-model.trim="keyword" type="search" placeholder="搜索课程或领域" aria-label="搜索课程" />
        </div>
        <div class="catalog-categories" role="tablist" aria-label="课程分类">
          <button v-for="category in categories" :key="category" type="button" :class="{ active: activeCategory === category }" @click="activeCategory = category">
            {{ category === 'all' ? '全部' : category }}
          </button>
        </div>
        <div v-if="dashboard.reviews?.length" class="review-alert">
          <RotateCcw :size="15" /><span>{{ dashboard.reviews.length }} 个知识点待复习</span>
        </div>
      </section>

      <section class="course-grid">
        <router-link v-for="course in filteredSkills" :key="course.id" :to="`/skills/${course.id}`" class="course-card">
          <header><span>{{ course.category }}</span><b>{{ course.difficulty }}</b></header>
          <div class="course-card__body"><h2>{{ course.title }}</h2><p>{{ course.description }}</p></div>
          <div v-if="course.enrollmentStatus" class="course-card__progress">
            <span>{{ course.completedLessons }}/{{ course.lessonCount }} 课时</span>
            <strong>{{ course.masteryScore }}% 掌握</strong>
            <i><b :style="{ width: `${course.lessonCount ? course.completedLessons / course.lessonCount * 100 : 0}%` }"></b></i>
          </div>
          <footer>
            <span><Layers3 :size="14" />{{ course.moduleCount }} 单元</span>
            <span><BookOpen :size="14" />{{ course.lessonCount }} 课时</span>
            <span v-if="course.interactiveCount"><MousePointer2 :size="14" />{{ course.interactiveCount }} 互动</span>
            <ArrowRight :size="18" class="course-card__arrow" />
          </footer>
        </router-link>
      </section>
      <p v-if="filteredSkills.length === 0" class="catalog-empty">没有找到匹配的课程。</p>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, BookOpen, Layers3, MousePointer2, Play, RotateCcw, Search } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'
import LearningTopNav from '../components/course/LearningTopNav.vue'

const { get } = useRequest()
const route = useRoute()
const skills = ref([])
const dashboard = ref({ activeCourses: [], reviews: [] })
const activeCategory = ref('all')
const keyword = ref('')
const categories = computed(() => ['all', ...new Set(skills.value.map(course => course.category).filter(Boolean))])
const continueCourse = computed(() => dashboard.value.activeCourses?.[0] || null)
const totalLessons = computed(() => skills.value.reduce((sum, course) => sum + (course.lessonCount || 0), 0))
const totalInteractive = computed(() => skills.value.reduce((sum, course) => sum + (course.interactiveCount || 0), 0))
const filteredSkills = computed(() => skills.value.filter(course => {
  const matchesCategory = activeCategory.value === 'all' || course.category === activeCategory.value
  const haystack = `${course.title} ${course.description} ${course.category}`.toLowerCase()
  return matchesCategory && haystack.includes(keyword.value.toLowerCase())
}))

onMounted(async () => {
  keyword.value = String(route.query.q || '')
  const [courseData, dashboardData] = await Promise.all([
    get('/skills', { pageSize: 200 }),
    get('/learning/dashboard').catch(() => ({ activeCourses: [], reviews: [] }))
  ])
  skills.value = (courseData || []).filter(course => course.lessonCount > 0)
  dashboard.value = dashboardData || { activeCourses: [], reviews: [] }
})
watch(() => route.query.q, value => { keyword.value = String(value || '') })
</script>

<style scoped>
.catalog-page { min-height: 100vh; background: #fff; color: #1d211e; }
.catalog-header { display: flex; align-items: end; justify-content: space-between; gap: 50px; padding: 50px 48px 36px; border-bottom: 1px solid #dfe3df; background: #fbfcfb; }
.catalog-header__eyebrow { color: #159447; font-size: 11px; font-weight: 750; }
.catalog-header h1 { max-width: 650px; margin-top: 8px; font-size: 34px; line-height: 1.2; font-weight: 780; letter-spacing: 0; }
.catalog-header p { max-width: 650px; margin-top: 11px; color: #626963; font-size: 13px; line-height: 1.7; }
.catalog-header__stats { display: grid; grid-template-columns: repeat(3, 94px); border-left: 1px solid #dfe3df; }
.catalog-header__stats div { display: grid; gap: 4px; padding-left: 18px; }
.catalog-header__stats strong { font-family: var(--font-mono); font-size: 24px; }
.catalog-header__stats span { color: #7e857f; font-size: 10px; }
.catalog-main { max-width: 1160px; margin: 0 auto; padding: 34px 38px 72px; }
.continue-band { display: grid; grid-template-columns: 38px minmax(0, 1fr) 210px auto; align-items: center; gap: 18px; margin-bottom: 30px; padding: 18px 20px; border: 1px solid #cbd9ce; border-left: 3px solid #159447; background: #f5faf6; }
.continue-band__mark { display: grid; place-items: center; width: 36px; height: 36px; background: #159447; color: #fff; }
.continue-band > div:nth-child(2) { display: grid; gap: 3px; }
.continue-band span { color: #737a74; font-size: 10px; }
.continue-band h2 { font-size: 15px; }
.continue-band p { color: #737a74; font-size: 11px; }
.continue-band__mastery { display: grid; grid-template-columns: 1fr auto; gap: 5px 10px; }
.continue-band__mastery strong { font-family: var(--font-mono); font-size: 11px; }
.continue-band__mastery i { grid-column: 1 / -1; height: 4px; background: #dce3dd; }
.continue-band__mastery b { display: block; height: 100%; background: #159447; }
.continue-band > a { display: inline-flex; align-items: center; gap: 7px; min-height: 38px; padding: 0 14px; background: #159447; color: #fff; font-size: 12px; font-weight: 750; }
.catalog-tools { display: grid; grid-template-columns: 250px minmax(0, 1fr) auto; align-items: center; gap: 18px; margin-bottom: 24px; }
.catalog-search { display: flex; align-items: center; gap: 9px; height: 40px; padding: 0 12px; border: 1px solid #d8dcd8; }
.catalog-search svg { color: #7c837d; }
.catalog-search input { width: 100%; border: 0; outline: 0; background: transparent; color: #222722; font: inherit; font-size: 12px; }
.catalog-categories { display: flex; gap: 3px; overflow-x: auto; }
.catalog-categories button { min-height: 34px; padding: 0 10px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #6f766f; font-size: 11px; cursor: pointer; white-space: nowrap; }
.catalog-categories button:hover { color: #1d211e; }
.catalog-categories button.active { border-bottom-color: #159447; color: #0f6f36; font-weight: 750; }
.review-alert { display: inline-flex; align-items: center; gap: 7px; color: #d05738; font-size: 10px; white-space: nowrap; }
.course-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid #dce0dc; border-left: 1px solid #dce0dc; }
.course-card { display: grid; grid-template-rows: auto 1fr auto auto; gap: 20px; min-height: 270px; padding: 24px; border-right: 1px solid #dce0dc; border-bottom: 1px solid #dce0dc; background: #fff; color: #252a26; transition: background 150ms; }
.course-card:hover { background: #fafbfa; color: #252a26; }
.course-card header { display: flex; justify-content: space-between; }
.course-card header span { color: #1769d1; font-size: 10px; font-weight: 750; }
.course-card header b { color: #737a74; font-size: 10px; font-weight: 650; }
.course-card__body h2 { font-size: 21px; line-height: 1.3; }
.course-card__body p { display: -webkit-box; overflow: hidden; margin-top: 9px; color: #6d746e; font-size: 12px; line-height: 1.65; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.course-card__progress { display: grid; grid-template-columns: 1fr auto; gap: 6px; }
.course-card__progress span, .course-card__progress strong { color: #747b75; font-family: var(--font-mono); font-size: 9px; }
.course-card__progress i { grid-column: 1 / -1; height: 3px; background: #e4e7e4; }
.course-card__progress b { display: block; height: 100%; background: #159447; }
.course-card footer { display: flex; align-items: center; gap: 14px; padding-top: 13px; border-top: 1px solid #e3e6e3; }
.course-card footer span { display: inline-flex; align-items: center; gap: 5px; color: #7c837d; font-size: 10px; }
.course-card__arrow { margin-left: auto; color: #159447; transition: transform 180ms; }
.course-card:hover .course-card__arrow { transform: translateX(4px); }
.catalog-empty { padding: 50px 0; color: #7d847e; text-align: center; }
@media (max-width: 900px) {
  .catalog-header { align-items: start; flex-direction: column; }
  .catalog-tools { grid-template-columns: 1fr; }
  .catalog-search { max-width: none; }
}
@media (max-width: 680px) {
  .catalog-header { padding: 36px 20px 28px; }
  .catalog-header h1 { font-size: 28px; }
  .catalog-header__stats { width: 100%; grid-template-columns: repeat(3, 1fr); }
  .catalog-main { padding: 24px 16px 54px; }
  .continue-band { grid-template-columns: 36px 1fr; }
  .continue-band__mastery { grid-column: 1 / -1; }
  .continue-band > a { grid-column: 1 / -1; justify-content: center; }
  .course-grid { grid-template-columns: 1fr; }
  .course-card { min-height: 250px; }
}
</style>
