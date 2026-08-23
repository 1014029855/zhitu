<template>
  <div class="skill-card-wrap">
    <a :href="skillUrl" target="_blank" class="skill-card-link" :title="skill.title">
      <div class="skill-card">
        <img :src="skill.image_url || '/assets/photo/home/home_1.jpg'" class="skill-card-image" :alt="skill.title" />
        <div class="skill-card-body">
          <div class="skill-card-tags">
            <span class="skill-badge skill-badge-info">{{ skill.category }}</span>
            <span class="skill-badge" :class="diffClass(skill.difficulty)">{{ skill.difficulty }}</span>
          </div>
          <h5 class="skill-card-title">{{ skill.title }}</h5>
          <p class="skill-card-desc">{{ skill.description?.substring(0, 80) }}...</p>
          <small class="skill-card-hours"><i class="fas fa-clock"></i>预计 {{ skill.estimated_hours }} 小时</small>
        </div>
      </div>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const { skill } = defineProps({ skill: Object })

const urlMap = {
  1: 'https://www.runoob.com/python/python-tutorial.html',
  2: 'https://www.runoob.com/js/js-tutorial.html',
  3: 'https://www.runoob.com/data-structures/data-structures-tutorial.html',
  4: 'https://www.runoob.com/ml/ml-intro.html',
  5: 'https://www.runoob.com/java/java-tutorial.html',
  6: 'https://www.runoob.com/sql/sql-tutorial.html'
}

const skillUrl = computed(() => urlMap[skill.id] || 'https://www.runoob.com')

function diffClass(d) {
  const map = { '入门': 'bg-success', '中级': 'bg-warning text-dark', '进阶': 'bg-danger' }
  return map[d] || 'bg-secondary'
}
</script>

<style scoped>
.skill-card-wrap {
  padding: 0;
}

.skill-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.skill-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease;
}

.skill-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skill-card-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.skill-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.skill-card-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.skill-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-md);
}

.skill-badge-info {
  background: #17a2b8;
  color: #fff;
}

/* difficulty classes from script */
.bg-success { background: #28a745; color: #fff; }
.bg-warning { background: #ffc107; }
.text-dark { color: var(--text-primary); }
.bg-danger { background: var(--red); color: #fff; }
.bg-secondary { background: #6c757d; color: #fff; }

.skill-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 8px 0 4px;
  line-height: 1.4;
}

.skill-card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  flex: 1;
}

.skill-card-hours {
  font-size: 12px;
  color: var(--text-secondary);
}

.skill-card-hours i {
  margin-right: 4px;
}
</style>
