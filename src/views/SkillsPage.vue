<template>
  <div class="page">
    <section class="hero gradient-accent">
      <div class="blur-orb blur-orb--purple" style="width:180px;height:180px;top:-40px;right:-30px;opacity:0.15;"></div>
      <p class="section-label">Course Catalog</p>
      <h1 class="page-heading" style="font-size:32px;">通识课程</h1>
      <p class="page-subtitle" style="margin-top:6px;">{{ totalCourses }} 门课程，覆盖六大领域 — 选一门开始学习。</p>
    </section>

    <section class="section">
      <!-- Category tabs -->
      <div class="cats">
        <button v-for="cat in categories" :key="cat" class="cat-btn" :class="{ 'cat-btn--active': activeCat === cat }" @click="activeCat = cat">
          {{ cat === 'all' ? '全部' : cat }}
          <span class="cat-btn__count">{{ cat === 'all' ? totalCourses : courseCounts[cat] || 0 }}</span>
        </button>
      </div>

      <!-- Course grid -->
      <div class="skill-grid">
        <router-link v-for="(s, i) in filteredSkills" :key="s.id" :to="`/skills/${s.id}`"
          class="card skill-card"
          :class="`animate-fade-up animate-fade-up--${Math.min(i + 1, 4)}`"
        >
          <div class="skill-card__top">
            <span class="pill">{{ s.category }}</span>
            <span class="pill pill--active">{{ s.difficulty }}</span>
          </div>
          <h2 class="skill-card__title">{{ s.title }}</h2>
          <p class="skill-card__desc">{{ s.cover_description || s.description?.slice(0, 100) || '' }}</p>
          <div class="skill-card__footer">
            <span>{{ s.chapterCount || 0 }} 章 · {{ s.hours }}h</span>
            <span class="skill-card__arrow">→</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRequest } from '../composables/useRequest'

const { get } = useRequest()
const skills = ref([])
const activeCat = ref('all')

const categories = computed(() => {
  const cats = ['all', ...new Set(skills.value.map(s => s.category))]
  return cats
})

const courseCounts = computed(() => {
  const counts = {}
  for (const s of skills.value) counts[s.category] = (counts[s.category] || 0) + 1
  return counts
})

const totalCourses = computed(() => skills.value.length)

const filteredSkills = computed(() => {
  if (activeCat.value === 'all') return skills.value
  return skills.value.filter(s => s.category === activeCat.value)
})

onMounted(async () => {
  try {
    const data = await get('/skills', { pageSize: 200 })
    skills.value = (data || []).map(s => ({
      ...s,
      hours: s.estimated_hours || s.estimatedHours || 40,
      chapterCount: Array.isArray(s.chapters) ? s.chapters.length : JSON.parse(s.chapters || '[]').length
    }))
  } catch {}
})
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg-primary); }
.hero { position: relative; overflow: hidden; padding: 48px 40px 40px; }
.section { max-width: 1080px; margin: 0 auto; padding: 0 40px 56px; }

/* category tabs */
.cats { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 28px; }
.cat-btn {
  padding: 6px 14px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 500;
  color: var(--text-secondary); background: var(--bg-secondary); border: 0; cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; gap: 6px;
}
.cat-btn:hover { color: var(--brand-green-dark); background: var(--brand-green-light); }
.cat-btn--active { background: var(--brand-green); color: #fff; }
.cat-btn__count { font-size: 10px; opacity: 0.7; }

/* grid */
.skill-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.skill-card { display: flex; flex-direction: column; gap: 14px; padding: 28px; }
.skill-card__top { display: flex; gap: 8px; }
.skill-card__title { font-family: var(--font-heading); font-size: 19px; font-weight: 700; color: var(--text-primary); line-height: 1.25; }
.skill-card__desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0; flex: 1; }
.skill-card__footer { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-muted); }
.skill-card__arrow { font-size: 18px; color: var(--brand-green); transition: transform 0.3s ease; }
.skill-card:hover .skill-card__arrow { transform: translateX(6px); }

@media (max-width: 780px) { .skill-grid { grid-template-columns: 1fr; } .section { padding: 0 20px 40px; } .hero { padding: 32px 20px; } }
</style>
