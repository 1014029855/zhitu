<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero gradient-accent">
      <div class="blur-orb blur-orb--green" style="width:200px;height:200px;top:-50px;right:-40px;opacity:0.2;"></div>
      <p class="section-label">Research Shelf</p>
      <h1 class="page-heading" style="font-size:32px;">论文资源</h1>
      <p class="page-subtitle" style="margin-top:6px;">本地 6 篇 + 外部检索 — 输入关键词自动搜索，新标签页打开原文。</p>
    </section>

    <section class="section">
      <!-- Search bar -->
      <div class="toolbar">
        <div class="search-box">
          <Search :size="18" :stroke-width="1.5" class="search-box__icon" />
          <input
            v-model.trim="keyword"
            class="search-box__input"
            type="text"
            placeholder="输入论文标题或关键词，自动搜索..."
            @input="onKeywordChange"
          />
          <button v-if="keyword" class="search-box__clear" @click="clearSearch">&times;</button>
        </div>
        <button class="btn btn--primary" @click="doExternalSearch" :disabled="loading">
          <Globe :size="16" :stroke-width="1.5" />
          {{ loading ? '检索中...' : '外部检索' }}
        </button>
      </div>

      <!-- Source hint -->
      <div class="meta-bar" v-if="sourceHint">
        <span class="meta-bar__badge" :class="sourceBadgeClass">{{ sourceLabel }}</span>
        <span class="meta-bar__hint" v-if="sourceHint !== 'local'">{{ sourceHint }}</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="empty-state">
        <div class="spinner" style="margin:0 auto 16px;"></div>
        <p class="empty-state__desc">正在检索论文...</p>
      </div>

      <!-- Paper cards -->
      <div v-else class="paper-grid">
        <div
          v-for="(paper, i) in papers"
          :key="paper.id"
          class="card paper-card"
          :class="`animate-fade-up animate-fade-up--${Math.min(i + 1, 4)}`"
        >
          <div class="paper-card__top">
            <span class="paper-card__source" :class="`paper-card__source--${paper.sourceType}`">
              {{ paper.displaySource }}
            </span>
            <span class="paper-card__year">{{ paper.year || '—' }}</span>
            <span v-if="paper.citations" class="paper-card__cites">{{ paper.citations }} 引用</span>
          </div>

          <h2 class="paper-card__title">
            <router-link :to="`/papers/${paper.id}`">
              {{ paper.title }}
            </router-link>
          </h2>

          <p class="paper-card__abstract">{{ paper.shortAbstract || paper.abstract?.slice(0, 200) || '暂无摘要' }}</p>

          <div class="paper-card__footer">
            <span class="paper-card__authors">{{ paper.authors || '未知作者' }}</span>
            <router-link :to="`/papers/${paper.id}`" class="paper-card__link">
              <ArrowRight :size="14" :stroke-width="1.5" />
              详情
            </router-link>
            <a
              v-if="paper.isExternal && paper.url"
              :href="paper.url"
              target="_blank"
              rel="noopener noreferrer"
              class="paper-card__link"
            >
              <ExternalLink :size="14" :stroke-width="1.5" />
              原文
            </a>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!loading && !papers.length && keyword" class="empty-state">
        <p class="empty-state__desc">没有找到"{{ keyword }}"相关的论文。试试其他关键词，或点击"外部检索"。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Globe, ArrowRight, ExternalLink } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'

const { get } = useRequest()
const keyword = ref('')
const loading = ref(false)
const sourceHint = ref('')
const sourceLabel = ref('本地')
const papers = ref([])
let debounceTimer = null

const sourceBadgeClass = computed(() => {
  if (sourceHint.value === 'local') return 'meta-bar__badge--local'
  return 'meta-bar__badge--external'
})

function onKeywordChange() {
  clearTimeout(debounceTimer)
  if (!keyword.value) {
    papers.value = []
    sourceHint.value = ''
    loadLocal()
    return
  }
  debounceTimer = setTimeout(() => doSearch(), 400)
}

function clearSearch() {
  keyword.value = ''
  papers.value = []
  sourceHint.value = ''
  loadLocal()
}

async function loadLocal() {
  try {
    const data = await get('/papers', { pageSize: 12 })
    papers.value = (data?.list || []).map(enrich)
    sourceHint.value = papers.value.length ? 'local' : ''
  } catch {}
}

async function doSearch() {
  if (!keyword.value) return
  loading.value = true
  try {
    const data = await get('/papers/search/all', { q: keyword.value, pageSize: 20 })
    papers.value = (data?.list || []).map(enrich)
    sourceHint.value = data?.source || 'local'
    sourceLabel.value = data?.source === 'hybrid' ? '本地+外部' : (data?.source === 'local' ? '本地' : '外部')
  } catch {
    sourceHint.value = ''
  } finally {
    loading.value = false
  }
}

async function doExternalSearch() {
  if (!keyword.value || loading.value) return
  loading.value = true
  try {
    const data = await get('/papers/search/external', { q: keyword.value, pageSize: 20 })
    if (data?.list?.length) {
      papers.value = data.list.map(enrich)
      sourceHint.value = 'external'
      sourceLabel.value = '外部检索'
    }
  } finally {
    loading.value = false
  }
}

function enrich(p) {
  return {
    ...p,
    shortAbstract: (p.abstract || '').slice(0, 200),
    displaySource: p.source || (p.paper_source === 'external' ? '外部检索' : '本地'),
    sourceType: (p.paper_source === 'external' || p.source === 'Semantic Scholar' || p.source === 'CORE' || p.source === 'OpenAlex') ? 'external' : 'local',
    isExternal: (p.paper_source === 'external' || ['Semantic Scholar','CORE','OpenAlex'].includes(p.source)),
    url: p.url || '',
  }
}

onMounted(loadLocal)
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg-primary); }
.hero { position: relative; overflow: hidden; padding: 48px 40px 40px; }
.section { max-width: 1080px; margin: 0 auto; padding: 0 40px 56px; }

/* toolbar */
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; margin-top: -20px; position: relative; z-index: 2; }
.search-box { flex: 1; position: relative; display: flex; align-items: center; }
.search-box__icon { position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; }
.search-box__input {
  width: 100%; height: 44px; padding: 0 40px 0 42px;
  border: 1px solid var(--border-primary); border-radius: var(--radius-pill);
  background: var(--bg-white); font-size: 14px; color: var(--text-primary);
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
}
.search-box__input:focus { border-color: var(--brand-green); box-shadow: 0 0 0 3px rgba(136,190,92,0.15); }
.search-box__clear { position: absolute; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: var(--bg-secondary); color: var(--text-muted); font-size: 18px; display: flex; align-items: center; justify-content: center; }
.search-box__clear:hover { background: var(--border-primary); color: var(--text-primary); }

/* meta bar */
.meta-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-size: 12px; }
.meta-bar__badge { padding: 4px 12px; border-radius: var(--radius-pill); font-weight: 600; font-size: 11px; }
.meta-bar__badge--local { background: var(--bg-secondary); color: var(--text-secondary); }
.meta-bar__badge--external { background: var(--brand-green-light); color: var(--brand-green-dark); }
.meta-bar__hint { color: var(--text-muted); }

/* paper cards */
.paper-grid { display: flex; flex-direction: column; gap: 14px; }
.paper-card { padding: 24px; display: flex; flex-direction: column; gap: 10px; }
.paper-card__top { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.paper-card__source { padding: 3px 10px; border-radius: var(--radius-pill); font-weight: 600; font-size: 11px; }
.paper-card__source--local { background: var(--bg-secondary); color: var(--text-secondary); }
.paper-card__source--external { background: var(--brand-green-light); color: var(--brand-green-dark); }
.paper-card__year { color: var(--text-muted); }
.paper-card__cites { color: var(--brand-green-dark); font-weight: 600; }

.paper-card__title {
  font-family: var(--font-heading); font-size: 18px; font-weight: 700;
  color: var(--text-primary); line-height: 1.3; margin: 0;
}
.paper-card__title a { color: inherit; }
.paper-card__title a:hover { color: var(--brand-green-dark); }

.paper-card__abstract {
  font-size: 13px; color: var(--text-secondary); line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; margin: 0;
}

.paper-card__footer { display: flex; align-items: center; gap: 16px; }
.paper-card__authors { font-size: 12px; color: var(--text-muted); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.paper-card__link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: var(--brand-green-dark);
  white-space: nowrap; transition: color 0.15s;
}
.paper-card__link:hover { color: var(--accent-hover); }

@media (max-width: 780px) {
  .section { padding: 0 20px 40px; }
  .hero { padding: 40px 20px 36px; }
  .toolbar { flex-direction: column; }
}
</style>
