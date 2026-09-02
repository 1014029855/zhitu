<template>
  <div class="product-page papers-page">
    <header class="product-header">
      <div class="product-header__copy">
        <p class="product-header__eyebrow">研究资料</p>
        <h1>论文资源</h1>
        <p>从研究问题进入摘要、证据与原文。外部检索只在你主动发起时运行。</p>
        <div class="product-header__meta"><span>本地精选</span><span>Semantic Scholar</span><span>引用追踪</span></div>
      </div>
    </header>

    <section>
      <div class="product-toolbar papers-toolbar">
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
        <span class="product-toolbar__count">{{ papers.length }} 篇结果</span>
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

      <div v-else class="product-list paper-list">
        <article
          v-for="(paper, i) in papers"
          :key="paper.id"
          class="product-row paper-row"
        >
          <span class="product-row__index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="paper-row__source" :class="`paper-row__source--${paper.sourceType}`">{{ paper.displaySource }}</span>
          <span class="product-row__main"><strong>{{ paper.title }}</strong><p>{{ paper.shortAbstract || paper.abstract?.slice(0, 200) || '暂无摘要' }}</p><small>{{ paper.authors || '未知作者' }}</small></span>
          <span class="product-row__meta">{{ paper.year || '—' }}</span>
          <span class="product-row__meta">{{ paper.citations || 0 }} 引用</span>
          <span class="paper-row__actions">
            <router-link :to="`/papers/${paper.id}`" title="查看详情"><ArrowRight :size="16" /></router-link>
            <a
              v-if="paper.isExternal && paper.url"
              :href="paper.url"
              target="_blank"
              rel="noopener noreferrer"
              title="打开原文"
            ><ExternalLink :size="15" /></a>
          </span>
        </article>
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
  const abstract = plainText(p.abstract)
  return {
    ...p,
    title: plainText(p.title),
    authors: plainText(p.authors),
    abstract,
    shortAbstract: abstract.slice(0, 200),
    displaySource: p.source || (p.paper_source === 'external' ? '外部检索' : '本地'),
    sourceType: (p.paper_source === 'external' || p.source === 'Semantic Scholar' || p.source === 'CORE' || p.source === 'OpenAlex') ? 'external' : 'local',
    isExternal: (p.paper_source === 'external' || ['Semantic Scholar','CORE','OpenAlex'].includes(p.source)),
    url: p.url || '',
  }
}

function plainText(value) {
  if (!value) return ''
  return new DOMParser().parseFromString(String(value), 'text/html').body.textContent || ''
}

onMounted(loadLocal)
</script>

<style scoped>
.papers-toolbar { align-items: center; }
.search-box { flex: 1; position: relative; display: flex; align-items: center; }
.search-box__icon { position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; }
.search-box__input {
  width: 100%; height: 34px; padding: 0 40px 0 38px;
  border: 1px solid var(--border-primary); border-radius: 4px;
  background: var(--bg-white); font-size: 14px; color: var(--text-primary);
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
}
.search-box__input:focus { border-color: var(--brand-blue); }
.search-box__clear { position: absolute; right: 6px; width: 24px; height: 24px; border-radius: 3px; background: var(--bg-secondary); color: var(--text-muted); font-size: 16px; display: flex; align-items: center; justify-content: center; }
.search-box__clear:hover { background: var(--border-primary); color: var(--text-primary); }

/* meta bar */
.meta-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-size: 12px; }
.meta-bar__badge { padding: 4px 12px; border-radius: var(--radius-pill); font-weight: 600; font-size: 11px; }
.meta-bar__badge--local { background: var(--bg-secondary); color: var(--text-secondary); }
.meta-bar__badge--external { background: var(--brand-green-light); color: var(--brand-green-dark); }
.meta-bar__hint { color: var(--text-muted); }

.paper-row { grid-template-columns: 34px 92px minmax(0, 1fr) 54px 70px 52px; min-height: 105px; }
.paper-row__source { display: inline-flex; justify-content: center; padding: 4px 6px; border: 1px solid #d9ded9; border-radius: 3px; color: #5d655e; font-size: 9px; font-weight: 700; }
.paper-row__source--external { border-color: #c7d8ef; background: #f1f6fc; color: #1769d1; }
.paper-row .product-row__main small { display: block; overflow: hidden; margin-top: 5px; color: #8a918b; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.paper-row__actions { display: flex; justify-content: flex-end; gap: 8px; }
.paper-row__actions a { display: grid; place-items: center; width: 22px; height: 28px; color: #7e877f; }
.paper-row__actions a:hover { color: #159447; }

@media (max-width: 780px) {
  .paper-row { grid-template-columns: 26px minmax(0, 1fr) 44px; }
  .paper-row > :nth-child(2), .paper-row > :nth-child(4), .paper-row > :nth-child(5) { display: none; }
}
</style>
