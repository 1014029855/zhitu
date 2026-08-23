<template>
  <section class="page">
    <LoadingSpinner :show="loading" />
    <div v-if="comp && !loading" class="detail-layout">
      <main class="detail-main">
        <router-link class="back-link" to="/competition">
          <ArrowRight :size="16" :stroke-width="1.5" class="back-link__icon" />
          竞赛库
        </router-link>
        <h1 class="detail-main__title">{{ comp.title }}</h1>
        <div class="tags">
          <span class="tag">{{ comp.category }}</span>
          <span class="tag">{{ comp.level }}</span>
          <span class="tag">{{ comp.status }}</span>
        </div>

        <article class="detail-block">
          <h2 class="detail-block__heading">竞赛简介</h2>
          <p>{{ comp.description || '暂无简介。' }}</p>
        </article>

        <article class="detail-block">
          <h2 class="detail-block__heading">获奖信息</h2>
          <p>{{ comp.prize_info || '暂无获奖信息。' }}</p>
        </article>

        <article v-if="planPreview" class="detail-block plan-preview">
          <div class="plan-preview__head">
            <div>
              <h2 class="detail-block__heading">备赛计划预览</h2>
              <p>{{ planSource === 'ai' ? 'AI 已生成草案，确认后才会加入工作台。' : '当前使用基础模板，确认后才会加入工作台。' }}</p>
            </div>
            <button class="btn btn--primary" type="button" :disabled="actionLoading" @click="confirmPlan">确认加入</button>
          </div>
          <div v-for="milestone in planPreview.milestones" :key="milestone.title" class="plan-preview__group">
            <strong>{{ milestone.title }}</strong>
            <ul>
              <li v-for="task in milestone.tasks" :key="task.title">{{ task.title }}</li>
            </ul>
          </div>
        </article>
      </main>

      <aside class="detail-side">
        <h2 class="detail-side__heading">基本信息</h2>
        <dl class="detail-side__info">
          <div>
            <dt>主办方</dt>
            <dd>{{ comp.organizer || '待更新' }}</dd>
          </div>
          <div>
            <dt>开始</dt>
            <dd>{{ comp.start_date || '待更新' }}</dd>
          </div>
          <div>
            <dt>截止</dt>
            <dd>{{ comp.deadline || '待更新' }}</dd>
          </div>
          <div>
            <dt>人数</dt>
            <dd>{{ comp.max_team_size || '-' }} 人 / 队</dd>
          </div>
        </dl>
        <div class="detail-side__actions">
          <button class="btn btn--ghost" type="button" :disabled="actionLoading" @click="toggleBookmark">
            <Bookmark :size="16" :fill="bookmarked ? 'currentColor' : 'none'" />
            {{ bookmarked ? '已收藏' : '收藏' }}
          </button>
          <label class="field">
            <span class="field__label">我的进度</span>
            <select v-model="participation.status" class="field__input" @change="saveParticipation">
              <option value="interested">感兴趣</option>
              <option value="preparing">准备中</option>
              <option value="registered">已报名</option>
              <option value="submitted">已提交</option>
              <option value="completed">已完成</option>
              <option value="withdrawn">已退出</option>
            </select>
          </label>
          <button class="btn btn--primary" type="button" :disabled="actionLoading" @click="createCompetitionGoal">加入工作台</button>
          <button class="btn btn--ghost" type="button" :disabled="actionLoading" @click="previewPlan">
            <WandSparkles :size="16" />
            生成备赛计划
          </button>
        </div>
        <a v-if="comp.website" :href="comp.website" target="_blank" rel="noopener" class="btn btn--primary">访问官网</a>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Bookmark, WandSparkles } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const route = useRoute()
const { get, post, put, del } = useRequest()
const comp = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const bookmarked = ref(false)
const participation = ref({ status: 'interested', teamName: '', notes: '' })
const planPreview = ref(null)
const planSource = ref('template')

async function loadGrowthState() {
  const [bookmarks, currentParticipation] = await Promise.all([
    get('/growth/bookmarks', { contentType: 'competition' }),
    get(`/growth/competitions/${route.params.id}/participation`)
  ])
  bookmarked.value = bookmarks.some(item => item.content_id === Number(route.params.id))
  if (currentParticipation) participation.value = {
    status: currentParticipation.status,
    teamName: currentParticipation.team_name || '',
    notes: currentParticipation.notes || ''
  }
}

async function toggleBookmark() {
  actionLoading.value = true
  try {
    if (bookmarked.value) {
      await del(`/growth/bookmarks/competition/${route.params.id}`)
      bookmarked.value = false
    } else {
      await post('/growth/bookmarks', { contentType: 'competition', contentId: Number(route.params.id) })
      bookmarked.value = true
    }
  } finally {
    actionLoading.value = false
  }
}

async function saveParticipation() {
  actionLoading.value = true
  try {
    participation.value = await put(`/growth/competitions/${route.params.id}/participation`, participation.value)
  } finally {
    actionLoading.value = false
  }
}

async function createCompetitionGoal() {
  actionLoading.value = true
  try {
    await post(`/growth/goals/from-competition/${route.params.id}`)
  } finally {
    actionLoading.value = false
  }
}

async function previewPlan() {
  actionLoading.value = true
  try {
    const data = await post(`/growth/ai/competition-plan/${route.params.id}`)
    planPreview.value = data.plan
    planSource.value = data.source
  } finally {
    actionLoading.value = false
  }
}

async function confirmPlan() {
  actionLoading.value = true
  try {
    await post('/growth/ai/confirm-plan', { plan: planPreview.value })
    planPreview.value = null
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  try {
    comp.value = await get(`/competitions/${route.params.id}`)
    await loadGrowthState()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 40px;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 48px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 24px;
}

.back-link:hover {
  color: var(--text-primary);
}

.back-link__icon {
  transform: rotate(180deg);
}

.detail-main__title {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.3px;
  margin-bottom: 16px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
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

.detail-block {
  border-top: 1px solid var(--border-primary);
  padding: 24px 0;
}

.detail-block__heading {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 12px;
}

.detail-block p {
  max-width: 600px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.detail-side {
  position: sticky;
  top: 48px;
  align-self: start;
  display: grid;
  gap: 16px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 24px;
  background: var(--bg-secondary);
}

.detail-side__heading {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: var(--text-primary);
}

.detail-side__actions { display: grid; gap: 10px; padding-block: 4px; }
.detail-side__actions .btn { width: 100%; }
.plan-preview__head { display: flex; align-items: start; justify-content: space-between; gap: 20px; }
.plan-preview__head p { font-size: 12px; }
.plan-preview__group { padding: 14px 0; border-bottom: 1px solid var(--border-light); }
.plan-preview__group ul { margin: 8px 0 0; padding-left: 20px; color: var(--text-secondary); font-size: 13px; line-height: 1.8; }

.detail-side__info {
  display: grid;
  gap: 12px;
}

.detail-side__info dt {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.detail-side__info dd {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

@media (max-width: 860px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-side {
    position: static;
  }
}
</style>
