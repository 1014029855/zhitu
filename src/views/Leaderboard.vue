<template>
  <section class="product-page leaderboard-page">
    <header class="product-header page__header">
      <div class="product-header__copy">
        <p class="product-header__eyebrow">训练证据</p>
        <h1 class="page__title">排行榜</h1>
        <p class="page__desc">通过题数、提交量和正确率只反映训练表现，不替代课程掌握度。</p>
        <div class="product-header__meta"><span>每次提交更新</span><span>{{ users.length }} 名学习者</span></div>
      </div>
    </header>

    <div class="podium">
      <article v-for="(user, index) in topUsers" :key="user.username" class="podium__card" :class="{ 'podium__card--first': index === 0 }">
        <span class="podium__rank">#{{ index + 1 }}</span>
        <h2 class="podium__name">{{ user.realName || user.username }}</h2>
        <strong class="podium__stat">{{ user.solved }} 题通过</strong>
        <p class="podium__rate">正确率 {{ user.passRate }}%</p>
      </article>
    </div>

    <div class="rank-list">
      <div v-for="(user, index) in users" :key="user.username" class="rank-list__row">
        <span class="rank-list__pos">{{ index + 1 }}</span>
        <strong class="rank-list__name">{{ user.realName || user.username }}</strong>
        <em class="rank-list__solved">{{ user.solved }} solved</em>
        <small class="rank-list__rate">{{ user.passRate }}%</small>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRequest } from '../composables/useRequest'

const { get } = useRequest()
const users = ref([
  { username: 'student1', realName: '默认学生', solved: 18, total: 26, passRate: 69 },
  { username: 'lufuping', realName: '管理员', solved: 12, total: 15, passRate: 80 },
  { username: 'teacher', realName: '示例教师', solved: 9, total: 10, passRate: 90 }
])

const topUsers = computed(() => users.value.slice(0, 3))

onMounted(async () => {
  try {
    const data = await get('/leaderboard')
    if (data?.length) {
      users.value = data.map((item) => ({
        username: item.username,
        realName: item.real_name || item.realName,
        solved: item.solved || 0,
        total: item.total_submitted || 0,
        passRate: item.pass_rate || 0
      }))
    }
  } catch {}
})
</script>

<style scoped>
.page__header {
  margin-bottom: 34px;
}

.page__title {
  font-family: var(--font-heading);
  font-size: 29px;
  font-weight: 760;
  letter-spacing: 0;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.page__desc {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 0;
}

.podium {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-bottom: 40px;
  border-top: 1px solid var(--border-primary);
  border-left: 1px solid var(--border-primary);
}

.podium__card {
  display: grid;
  gap: 12px;
  align-content: space-between;
  min-height: 200px;
  padding: 24px;
  border-right: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
}

.podium__card--first {
  background: var(--brand-green-light);
}

.podium__rank {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.podium__name {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  margin: 0;
  color: var(--text-primary);
}

.podium__stat {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.podium__rate {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.rank-list {
  border-top: 1px solid var(--border-primary);
}

.rank-list__row {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) 120px 80px;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-light);
}

.rank-list__pos {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.rank-list__name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

.rank-list__solved,
.rank-list__rate {
  font-size: 13px;
  color: var(--text-secondary);
  font-style: normal;
}

@media (max-width: 700px) {
  .podium {
    grid-template-columns: 1fr;
  }

  .rank-list__row {
    grid-template-columns: 40px 1fr;
  }

  .rank-list__solved,
  .rank-list__rate {
    display: none;
  }
}
</style>
