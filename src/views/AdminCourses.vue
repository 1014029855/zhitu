<template>
  <section class="admin-courses">
    <header>
      <div><span>课程管理</span><h1>课程工作台</h1><p>维护课程结构、互动活动和发布状态。</p></div>
      <div class="admin-courses__search"><Search :size="16" /><input v-model.trim="keyword" placeholder="搜索课程" /></div>
    </header>
    <div class="course-table">
      <div class="course-table__head"><span>课程</span><span>结构</span><span>互动</span><span>状态</span><span></span></div>
      <router-link v-for="course in filtered" :key="course.id" :to="`/admin/courses/${course.id}`" class="course-table__row">
        <div><strong>{{ course.title }}</strong><small>{{ course.category }} · {{ course.difficulty }}</small></div>
        <span>{{ course.moduleCount }} 单元 / {{ course.lessonCount }} 课时</span>
        <span>{{ course.interactiveCount }} 个</span>
        <b :class="{ draft: !course.lessonCount }">{{ course.lessonCount ? '已发布' : '待建设' }}</b>
        <ArrowRight :size="17" />
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, Search } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'

const { get } = useRequest()
const courses = ref([])
const keyword = ref('')
const filtered = computed(() => courses.value.filter(course => `${course.title} ${course.category}`.toLowerCase().includes(keyword.value.toLowerCase())))
onMounted(async () => { courses.value = await get('/skills', { pageSize: 200 }) || [] })
</script>

<style scoped>
.admin-courses { max-width: 1080px; min-height: 100vh; margin: 0 auto; padding: 48px 40px 80px; background: #fff; }
.admin-courses > header { display: flex; align-items: end; justify-content: space-between; gap: 30px; margin-bottom: 34px; }
.admin-courses > header span { color: #159447; font-size: 10px; font-weight: 750; }
.admin-courses h1 { margin-top: 5px; font-size: 29px; }
.admin-courses p { margin-top: 7px; color: #737a74; font-size: 12px; }
.admin-courses__search { display: flex; align-items: center; gap: 8px; width: 250px; height: 40px; padding: 0 12px; border: 1px solid #d8dcd8; }
.admin-courses__search input { width: 100%; border: 0; outline: 0; font: inherit; font-size: 12px; }
.course-table { border-top: 1px solid #dce0dc; }
.course-table__head, .course-table__row { display: grid; grid-template-columns: minmax(220px, 1fr) 170px 80px 80px 20px; gap: 18px; align-items: center; padding: 0 14px; }
.course-table__head { height: 42px; color: #858c86; font-size: 10px; }
.course-table__row { min-height: 72px; border-top: 1px solid #e3e6e3; color: #343a35; }
.course-table__row:hover { background: #f8faf8; color: #1d211e; }
.course-table__row div { display: grid; gap: 4px; }
.course-table__row strong { font-size: 13px; }
.course-table__row small, .course-table__row > span { color: #7b827c; font-size: 10px; }
.course-table__row b { color: #14743a; font-size: 10px; }
.course-table__row b.draft { color: #b75a3e; }
@media (max-width: 720px) {
  .admin-courses { padding: 32px 18px; }
  .admin-courses > header { align-items: stretch; flex-direction: column; }
  .admin-courses__search { width: 100%; }
  .course-table__head { display: none; }
  .course-table__row { grid-template-columns: 1fr auto; padding: 14px 5px; }
  .course-table__row > span, .course-table__row > b { display: none; }
}
</style>
