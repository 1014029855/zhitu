<template>
  <section class="page">
    <header class="page__header">
      <p class="section-label">Admin Studio</p>
      <h1 class="page__title">管理后台</h1>
      <p class="page__desc">审核提交内容、维护题库，让平台保持清晰可用。</p>
    </header>

    <div class="admin-cards">
      <router-link class="admin-cards__item admin-cards__item--hot" to="/admin/exercises">
        <span class="admin-cards__num">01</span>
        <h2 class="admin-cards__title">题库管理</h2>
        <p class="admin-cards__desc">生成、查看和维护在线刷题题目。</p>
        <ArrowRight :size="16" :stroke-width="1.5" class="admin-cards__arrow" />
      </router-link>
      <div class="admin-cards__item">
        <span class="admin-cards__num">02</span>
        <h2 class="admin-cards__title">待审核内容</h2>
        <p class="admin-cards__desc">当前待处理：{{ pending.length }} 条</p>
      </div>
    </div>

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
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 40px;
  min-height: 100vh;
  background: var(--bg-secondary);
}

.page__header {
  margin-bottom: 40px;
}

.page__title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.3px;
  margin-bottom: 8px;
}

.page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 0;
}

.admin-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin-bottom: 40px;
  border-top: 1px solid var(--border-primary);
  border-left: 1px solid var(--border-primary);
}

.admin-cards__item {
  position: relative;
  display: grid;
  min-height: 220px;
  align-content: space-between;
  gap: 12px;
  padding: 28px;
  border-right: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
  text-decoration: none;
  color: var(--text-primary);
}

.admin-cards__item--hot {
  background: var(--red);
  color: #fff;
}

.admin-cards__num {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.admin-cards__item--hot .admin-cards__num {
  color: rgba(255, 255, 255, 0.6);
}

.admin-cards__title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.15;
  margin: 0;
}

.admin-cards__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  max-width: 300px;
}

.admin-cards__item--hot .admin-cards__desc {
  color: rgba(255, 255, 255, 0.7);
}

.admin-cards__arrow {
  position: absolute;
  right: 28px;
  bottom: 28px;
  color: rgba(255, 255, 255, 0.7);
}

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
  .admin-cards {
    grid-template-columns: 1fr;
  }

  .review-list__item {
    grid-template-columns: 1fr;
  }
}
</style>
