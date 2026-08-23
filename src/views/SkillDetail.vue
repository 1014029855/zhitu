<template>
  <div class="learn" v-if="skill">
    <!-- Header -->
    <header class="learn__hero gradient-hero">
      <router-link to="/skills" class="back-link">
        <ArrowLeft :size="16" :stroke-width="1.5" /> 返回课程列表
      </router-link>
      <div class="learn__hero-body">
        <div class="learn__hero-left">
          <p class="section-label">{{ skill.category }}</p>
          <h1 class="learn__title">{{ skill.title }}</h1>
          <p class="learn__subtitle">{{ skill.cover_description || skill.description }}</p>
          <div class="learn__meta">
            <span class="pill">{{ skill.difficulty }}</span>
            <span class="pill pill--active">{{ totalChapters }} 章</span>
            <span class="pill">{{ skill.hours || skill.estimated_hours }}h</span>
          </div>
        </div>
        <div class="learn__hero-right">
          <div class="progress-ring">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-primary)" stroke-width="8"/><circle cx="50" cy="50" r="42" fill="none" stroke="var(--brand-green)" stroke-width="8" stroke-linecap="round" :stroke-dasharray="2 * Math.PI * 42" :stroke-dashoffset="2 * Math.PI * 42 - (2 * Math.PI * 42 * progress)" transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 0.8s ease"/></svg>
            <span class="progress-ring__text">{{ Math.round(progress * 100) }}%</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Chapter layout -->
    <div class="learn__layout">
      <!-- Chapter list -->
      <aside class="learn__toc">
        <h3 class="learn__toc-title">章节目录</h3>
        <div
          v-for="(ch, i) in chapters"
          :key="i"
          class="learn__toc-item"
          :class="{ 'learn__toc-item--active': i === activeChapter, 'learn__toc-item--done': progressMap[i] }"
          @click="openChapter(i)"
        >
          <span class="learn__toc-check">{{ progressMap[i] ? '✓' : (i + 1) }}</span>
          <span class="learn__toc-label">{{ ch.title }}</span>
        </div>
      </aside>

      <!-- Content area -->
      <main class="learn__content" v-if="activeChapter !== null">
        <h2 class="learn__chapter-title">{{ chapters[activeChapter]?.title }}</h2>
        <div class="learn__chapter-body" v-html="renderedContent"></div>

        <!-- Key points -->
        <div v-if="chapters[activeChapter]?.key_points?.length" class="learn__keypoints">
          <h4>本章要点</h4>
          <ul>
            <li v-for="(kp, i) in chapters[activeChapter].key_points" :key="i">{{ kp }}</li>
          </ul>
        </div>

        <!-- Nav -->
        <div class="learn__nav">
          <button class="btn btn--ghost" @click="openChapter(activeChapter - 1)" :disabled="activeChapter <= 0">
            ← 上一章
          </button>
          <div class="learn__nav-right">
            <button class="btn btn--primary" @click="askAiAboutChapter">
              <MessageCircle :size="16" :stroke-width="1.5" /> 问 AI
            </button>
            <button v-if="!progressMap[activeChapter]" class="btn btn--primary" @click="markDone(activeChapter)">
              标记已完成
            </button>
            <span v-else class="learn__done-badge">✓ 已完成</span>
          </div>
          <button class="btn btn--ghost" @click="openChapter(activeChapter + 1)" :disabled="activeChapter >= totalChapters - 1">
            下一章 →
          </button>
        </div>

        <!-- Notes -->
        <div class="learn__notes">
          <h4>📝 你的笔记</h4>
          <textarea v-model="notes[activeChapter]" class="field__input" style="min-height:100px;resize:vertical;" placeholder="写下你对本章的想法..."></textarea>
          <button class="btn btn--primary" @click="saveNotes(activeChapter)" style="margin-top:8px;">保存笔记</button>
        </div>
      </main>
    </div>

    <AiDrawer :visible="aiVisible" :context="aiContext" @close="aiVisible = false" />
  </div>

  <LoadingSpinner v-else :show="true" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, MessageCircle } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'
import { useStorage } from '../composables/useStorage'
import AiDrawer from '../components/AiDrawer.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const route = useRoute()
const { get, post } = useRequest()
const { get: lsGet } = useStorage()
const skill = ref(null)
const chapters = ref([])
const activeChapter = ref(0)
const progressMap = ref({})
const notes = ref({})
const aiVisible = ref(false)
const aiContext = ref({})
const loading = ref(true)

const totalChapters = computed(() => chapters.value.length)
const progress = computed(() => {
  if (!totalChapters.value) return 0
  const done = Object.values(progressMap.value).filter(Boolean).length
  return done / totalChapters.value
})

const renderedContent = computed(() => {
  const raw = chapters.value[activeChapter.value]?.content || ''
  return raw.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>').replace(/^/, '<p>').replace(/$/, '</p>')
})

function openChapter(i) {
  if (i < 0 || i >= totalChapters.value) return
  activeChapter.value = i
}

async function markDone(i) {
  progressMap.value = { ...progressMap.value, [i]: true }
  try {
    await post('/skill/progress', { skillId: skill.value.id, chapterOrder: i, completed: 1 })
  } catch {}
}

async function saveNotes(i) {
  try {
    await post('/skill/progress', { skillId: skill.value.id, chapterOrder: i, notes: notes.value[i] || '', completed: progressMap.value[i] ? 1 : 0 })
  } catch {}
}

async function loadProgress() {
  const userId = lsGet('userInfo')?.id
  if (!skill.value?.id || !userId) return
  try {
    const data = await get(`/skill/progress/${skill.value.id}`)
    const pm = {}; const nt = {}
    for (const p of (data?.progress || [])) {
      pm[p.chapter_order] = !!p.completed
      nt[p.chapter_order] = p.notes || ''
    }
    progressMap.value = pm; notes.value = nt
  } catch {}
}

function askAiAboutChapter() {
  const ch = chapters.value[activeChapter.value]
  aiContext.value = {
    type: 'course', id: skill.value.id,
    question: `请帮我深入理解这一章的内容：${ch?.title}`,
    content: `课程: ${skill.value.title}\n章节: ${ch?.title}\n内容: ${ch?.content?.slice(0, 2000)}`
  }
  aiVisible.value = true
}

onMounted(async () => {
  try {
    skill.value = await get(`/skills/${route.params.id}`)
    chapters.value = Array.isArray(skill.value.chapters) ? skill.value.chapters : JSON.parse(skill.value.chapters || '[]')
    await loadProgress()
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.learn { min-height: 100vh; background: var(--bg-primary); }
.learn__hero { padding: 48px 40px 40px; position: relative; overflow: hidden; }
.learn__hero-body { display: flex; gap: 40px; align-items: flex-start; max-width: 1080px; margin: 24px auto 0; }
.learn__hero-left { flex: 1; }
.learn__title { font-family: var(--font-heading); font-size: 32px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.4px; margin: 8px 0; }
.learn__subtitle { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px; }
.learn__meta { display: flex; gap: 8px; }
.back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); }
.back-link:hover { color: var(--text-primary); }

.learn__hero-right { flex-shrink: 0; }
.progress-ring { width: 100px; height: 100px; position: relative; }
.progress-ring__text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: var(--brand-green-dark); }

.learn__layout { display: grid; grid-template-columns: 260px 1fr; max-width: 1080px; margin: 0 auto; padding: 0 40px 56px; gap: 36px; }
.learn__toc { position: sticky; top: 24px; align-self: start; background: var(--bg-white); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: 0; overflow: hidden; }
.learn__toc-title { font-family: var(--font-heading); font-size: 14px; font-weight: 600; padding: 16px 18px; border-bottom: 1px solid var(--border-primary); }
.learn__toc-item { display: flex; align-items: center; gap: 10px; padding: 10px 18px; cursor: pointer; font-size: 13px; transition: background 0.12s; }
.learn__toc-item:hover { background: var(--bg-secondary); }
.learn__toc-item--active { background: var(--brand-green-light); font-weight: 600; }
.learn__toc-item--done { color: var(--text-secondary); }
.learn__toc-check { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; border: 1px solid var(--border-primary); }
.learn__toc-item--done .learn__toc-check { background: var(--brand-green); color: #fff; border-color: var(--brand-green); }
.learn__toc-item--active .learn__toc-check { border-color: var(--brand-green); color: var(--brand-green-dark); }

.learn__content { min-width: 0; }
.learn__chapter-title { font-family: var(--font-heading); font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; }
.learn__chapter-body { font-size: 15px; line-height: 1.9; color: var(--text-primary); }
.learn__chapter-body :deep(p) { margin-bottom: 16px; }
.learn__chapter-body :deep(h2), .learn__chapter-body :deep(h3) { font-family: var(--font-heading); margin: 24px 0 12px; }

.learn__keypoints { margin: 28px 0; padding: 20px; background: var(--brand-green-light); border-radius: var(--radius-lg); }
.learn__keypoints h4 { font-size: 14px; font-weight: 700; color: var(--brand-green-dark); margin-bottom: 10px; }
.learn__keypoints ul { padding-left: 18px; font-size: 13px; line-height: 1.8; color: var(--text-primary); }

.learn__nav { display: flex; align-items: center; justify-content: space-between; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border-primary); }
.learn__nav-right { display: flex; align-items: center; gap: 8px; }
.learn__done-badge { font-size: 13px; font-weight: 600; color: var(--brand-green-dark); background: var(--brand-green-light); padding: 6px 14px; border-radius: var(--radius-pill); }

.learn__notes { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-primary); }
.learn__notes h4 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }

@media (max-width: 800px) {
  .learn__layout { grid-template-columns: 1fr; padding: 0 20px 40px; }
  .learn__toc { position: static; }
  .learn__hero { padding: 32px 20px; }
  .learn__hero-body { flex-direction: column; }
}
</style>
