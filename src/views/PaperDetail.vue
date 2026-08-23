<template>
  <div class="page">
    <LoadingSpinner :show="loading" />

    <div v-if="paper && !loading" class="detail">
      <!-- Back -->
      <router-link to="/papers" class="back-link">
        <ArrowLeft :size="16" :stroke-width="1.5" />
        返回论文列表
      </router-link>

      <!-- Header -->
      <header class="detail__header animate-fade-up">
        <div class="detail__badges">
          <span class="pill" :class="isExternal ? 'pill--active' : ''">
            {{ isExternal ? '外部检索' : '本地收录' }}
          </span>
          <span class="pill">{{ paper.year || '—' }}</span>
          <span v-if="paper.citations" class="pill pill--active">{{ paper.citations }} 引用</span>
          <span class="pill">{{ paper.source || paper.venue || paper.displaySource || '学术资源' }}</span>
        </div>
        <h1 class="detail__title">{{ paper.title }}</h1>
        <p class="detail__authors">{{ paper.authors || '作者信息待更新' }}</p>
      </header>

      <!-- Content grid -->
      <div class="detail__layout animate-fade-up animate-fade-up--2">
        <!-- Main -->
        <article class="detail__main">
          <section class="detail__section">
            <h2 class="detail__heading">摘要</h2>
            <p class="detail__abstract">{{ paper.abstract || '暂无摘要信息。' }}</p>
          </section>

          <section class="detail__section" v-if="paper.keywords">
            <h2 class="detail__heading">关键词</h2>
            <div class="detail__keywords">
              <span v-for="k in parseKeywords(paper.keywords)" :key="k" class="keyword">#{{ k }}</span>
            </div>
          </section>

          <section class="detail__section">
            <h2 class="detail__heading">详细信息</h2>
            <dl class="detail__meta">
              <div>
                <dt>来源</dt>
                <dd>{{ paper.source || paper.venue || '—' }}</dd>
              </div>
              <div>
                <dt>年份</dt>
                <dd>{{ paper.year || '—' }}</dd>
              </div>
              <div>
                <dt>引用次数</dt>
                <dd>{{ paper.citations || 0 }}</dd>
              </div>
              <div v-if="paper.pages">
                <dt>页数</dt>
                <dd>{{ paper.pages }}</dd>
              </div>
              <div v-if="paper.publication_date">
                <dt>发布日期</dt>
                <dd>{{ paper.publication_date }}</dd>
              </div>
              <div v-if="paper.category">
                <dt>分类</dt>
                <dd>{{ paper.category }}</dd>
              </div>
            </dl>
          </section>
        </article>

        <!-- Sidebar actions -->
        <aside class="detail__side">
          <h2 class="detail__side-title">操作</h2>

          <label class="field">
            <span class="field__label">阅读状态</span>
            <select v-model="library.status" class="field__input">
              <option value="to_read">待读</option>
              <option value="reading">阅读中</option>
              <option value="read">已读完</option>
            </select>
          </label>
          <label class="field">
            <span class="field__label">阅读笔记</span>
            <textarea v-model="library.notes" class="field__input detail__notes" rows="4" placeholder="记录结论、疑问或引用"></textarea>
          </label>
          <button class="btn btn--ghost" type="button" :disabled="savingLibrary" @click="saveLibrary">
            <Library :size="16" />
            {{ savingLibrary ? '保存中' : '保存到阅读库' }}
          </button>

          <!-- View original paper (always show if URL exists) -->
          <a
            v-if="paper.url"
            :href="paper.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn--primary btn--lg"
            style="width:100%"
          >
            <ExternalLink :size="16" :stroke-width="1.8" />
            访问原论文
          </a>

          <!-- View on Semantic Scholar -->
          <a
            v-if="paper.paperId || paper.externalId"
            :href="'https://www.semanticscholar.org/paper/' + (paper.paperId || paper.externalId)"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn--ghost btn--lg"
            style="width:100%"
          >
            <BookOpen :size="16" :stroke-width="1.5" />
            在 Semantic Scholar 查看
          </a>

          <!-- Download PDF (local papers only) -->
          <a
            v-if="!isExternal && paper.pdf_url"
            :href="'/api/papers/' + paper.id + '/download'"
            class="btn btn--ghost btn--lg"
            style="width:100%"
          >
            <Download :size="16" :stroke-width="1.5" />
            下载 PDF
          </a>

          <!-- No URL info -->
          <p v-if="!paper.url && !paper.paperId && !paper.externalId && (!isExternal || !paper.pdf_url)" class="detail__no-link">
            暂无在线原文链接。试试复制标题到 <a href="https://scholar.google.com" target="_blank" rel="noopener">Google Scholar</a> 搜索。
          </p>

          <!-- Ask AI -->
          <button class="btn btn--primary btn--lg" style="width:100%;margin-top:8px" @click="openAiDrawer">
            <MessageCircle :size="16" :stroke-width="1.5" />
            问 AI 这篇论文
          </button>
        </aside>
      </div>
    </div>

    <AiDrawer :visible="aiVisible" :context="aiContext" @close="aiVisible = false" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ExternalLink, BookOpen, Download, Library, MessageCircle } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import AiDrawer from '../components/AiDrawer.vue'

const route = useRoute()
const { get, put } = useRequest()
const paper = ref(null)
const loading = ref(true)
const savingLibrary = ref(false)
const library = ref({ status: 'to_read', notes: '', tags: [] })

const aiVisible = ref(false)
const aiContext = ref({})

function openAiDrawer() {
  const p = paper.value
  aiContext.value = {
    type: 'paper', id: p?.id,
    question: '这篇论文讲了什么？请帮我用通俗的语言解释一下。',
    content: `论文标题: ${p?.title}\n作者: ${p?.authors}\n年份: ${p?.year}\n来源: ${p?.source || p?.venue}\n摘要: ${p?.abstract}`
  }
  aiVisible.value = true
}

const isExternal = computed(() => {
  const p = paper.value
  if (!p) return false
  return p.paper_source === 'external' ||
    ['Semantic Scholar', 'CORE', 'OpenAlex'].includes(p.source) ||
    !!p.isExternal
})

function parseKeywords(kw) {
  try {
    return JSON.parse(kw)
  } catch {
    return kw ? kw.split(/[,，、]/) : []
  }
}

async function loadLibrary() {
  const entries = await get('/growth/paper-library')
  const entry = entries.find(item => item.paper_id === Number(route.params.id))
  if (entry) library.value = { status: entry.status, notes: entry.notes || '', tags: entry.tags || [] }
}

async function saveLibrary() {
  savingLibrary.value = true
  try {
    library.value = await put(`/growth/papers/${route.params.id}/library`, library.value)
  } finally {
    savingLibrary.value = false
  }
}

onMounted(async () => {
  try {
    paper.value = await get(`/papers/${route.params.id}`)
    await loadLibrary()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page { min-height: 100vh; background: var(--bg-primary); }
.detail { max-width: 960px; margin: 0 auto; padding: 48px 40px; }

/* back */
.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
  margin-bottom: 28px; transition: color 0.15s;
}
.back-link:hover { color: var(--text-primary); }

/* header */
.detail__header { margin-bottom: 36px; }
.detail__badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.detail__title {
  font-family: var(--font-heading);
  font-size: 28px; font-weight: 700; letter-spacing: -0.4px;
  color: var(--text-primary); line-height: 1.25; margin-bottom: 8px;
}
.detail__authors { font-size: 14px; color: var(--text-secondary); }

/* layout */
.detail__layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 48px; }

/* main content */
.detail__main { min-width: 0; }
.detail__section { border-top: 1px solid var(--border-primary); padding: 24px 0; }
.detail__heading {
  font-family: var(--font-heading); font-size: 17px; font-weight: 600;
  color: var(--text-primary); margin: 0 0 14px;
}
.detail__abstract { font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin: 0; white-space: pre-wrap; }

/* keywords */
.detail__keywords { display: flex; flex-wrap: wrap; gap: 8px; }
.keyword {
  display: inline-flex; align-items: center; height: 28px;
  padding: 0 12px; font-size: 12px; font-weight: 500;
  border-radius: var(--radius-pill);
  background: var(--brand-green-light); color: var(--brand-green-dark);
}

/* meta dl */
.detail__meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 0; }
.detail__meta dt { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.detail__meta dd { font-size: 15px; font-weight: 600; color: var(--text-primary); }

/* sidebar */
.detail__side {
  position: sticky; top: 48px; align-self: start;
  display: flex; flex-direction: column; gap: 10px;
  border: 1px solid var(--border-primary); border-radius: var(--radius-lg);
  padding: 24px; background: var(--bg-white);
}
.detail__side-title {
  font-family: var(--font-heading); font-size: 16px; font-weight: 600;
  color: var(--text-primary); margin: 0 0 4px;
}
.detail__notes { height: auto; resize: vertical; padding-block: 8px; line-height: 1.5; }
.detail__no-link { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
.detail__no-link a { color: var(--accent); text-decoration: underline; }

@media (max-width: 800px) {
  .detail__layout { grid-template-columns: 1fr; }
  .detail__side { position: static; }
  .detail__meta { grid-template-columns: 1fr; }
  .detail { padding: 32px 20px; }
}
</style>
