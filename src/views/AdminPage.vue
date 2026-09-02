<template>
  <section class="product-page admin-page">
    <header class="product-header">
      <div class="product-header__copy">
        <p class="product-header__eyebrow">平台管理</p>
        <h1>管理后台</h1>
        <p>维护课程、题库和投稿审核。</p>
      </div>
    </header>

    <nav class="admin-links product-list" aria-label="管理工具">
      <router-link class="admin-link product-row" to="/admin/courses">
        <span class="product-row__index">01</span>
        <div class="product-row__main"><strong>课程工作台</strong><p>编辑课程结构、互动活动和发布版本。</p></div>
        <span class="status-tag status-tag--green">课程</span>
        <ArrowRight :size="16" class="product-row__action" />
      </router-link>
      <router-link class="admin-link product-row" to="/admin/exercises">
        <span class="product-row__index">02</span>
        <div class="product-row__main"><strong>题库管理</strong><p>生成、查看和维护在线刷题题目。</p></div>
        <span class="status-tag status-tag--blue">练习</span>
        <ArrowRight :size="16" class="product-row__action" />
      </router-link>
      <div class="admin-link product-row">
        <span class="product-row__index">03</span>
        <div class="product-row__main"><strong>内容审核</strong><p>处理教师提交的竞赛、课程和论文资源。</p></div>
        <span class="status-tag status-tag--coral">{{ pending.length }} 条</span>
        <span></span>
      </div>
    </nav>

    <section class="review-panel">
      <header><div><span>内容审核</span><h2>待处理投稿</h2></div><strong>{{ pending.length }}</strong></header>
      <div class="review-list">
      <article v-for="item in pending" :key="item.id" class="review-list__item">
        <div class="review-list__body">
          <span class="review-list__type">{{ item.type }}</span>
          <strong class="review-list__title">{{ item.title }}</strong>
          <p class="review-list__desc">{{ item.description }}</p>
        </div>
        <div class="review-list__actions">
          <button class="btn btn--primary" type="button" @click="review(item.id, 'approve')">通过</button>
          <button class="btn btn--danger" type="button" @click="review(item.id, 'reject')">拒绝</button>
        </div>
      </article>
      <p v-if="pending.length === 0" class="empty-state">暂无待审核内容。</p>
      </div>
    </section>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { useRequest } from '../composables/useRequest'

const { get, put } = useRequest()
const pending = ref([])

async function loadPending() {
  try {
    pending.value = await get('/admin/submissions') || []
  } catch {
    pending.value = []
  }
}

async function review(id, action) {
  try {
    await put(`/admin/submissions/${id}`, { action })
    loadPending()
  } catch {}
}

onMounted(loadPending)
</script>

<style scoped>
.admin-page { max-width: 1080px; }
.admin-links { margin-top: 28px; }
.admin-link { grid-template-columns: 34px minmax(0, 1fr) 72px 20px; }
.review-panel { margin-top: 42px; }
.review-panel > header { display: flex; align-items: end; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--border-primary); }
.review-panel > header span { color: var(--brand-green); font-size: 10px; font-weight: 700; }
.review-panel > header h2 { margin-top: 5px; font-size: 18px; }
.review-panel > header > strong { color: var(--text-muted); font: 12px var(--font-mono); }

.review-list {
  border-top: 1px solid var(--border-primary);
}

.review-list__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-light);
}

.review-list__body {
  display: grid;
  gap: 4px;
}

.review-list__type {
  font-size: 12px;
  font-weight: 600;
  color: var(--red);
}

.review-list__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.review-list__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.review-list__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 760px) {
  .admin-link { grid-template-columns: 26px minmax(0, 1fr) auto; }
  .admin-link .product-row__action, .admin-link > span:last-child { display: none; }
  .review-list__item {
    grid-template-columns: 1fr;
  }
}
</style>
