<template>
  <div class="comp-card-wrap">
    <div class="comp-card">
      <img :src="comp.image_url || '/assets/photo/home/home_1.jpg'" class="comp-card-image" :alt="comp.title" />
      <div class="comp-card-body">
        <span class="comp-badge comp-badge-primary">{{ comp.category }}</span>
        <span class="comp-badge" :class="statusClass(comp.status)">{{ comp.status }}</span>
        <h5 class="comp-card-title">{{ comp.title }}</h5>
        <p class="comp-card-desc">{{ comp.description?.substring(0, 80) }}...</p>
        <div class="comp-card-meta">
          <small><i class="fas fa-users"></i>{{ comp.max_team_size }}人/队</small>
          <small><i class="fas fa-calendar"></i>{{ comp.deadline }}</small>
        </div>
      </div>
      <div class="comp-card-footer">
        <router-link :to="'/competition/' + comp.id" class="comp-btn">查看详情</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
const { comp } = defineProps({ comp: Object })
function statusClass(status) {
  const map = { '报名中': 'bg-success', '进行中': 'bg-warning text-dark', '即将开始': 'bg-info text-dark' }
  return map[status] || 'bg-secondary'
}
</script>

<style scoped>
.comp-card-wrap {
  padding: 0;
}

.comp-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease;
}

.comp-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comp-card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.comp-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.comp-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  margin-right: 4px;
}

.comp-badge-primary {
  background: var(--accent);
  color: #fff;
}

/* status classes from script */
.bg-success { background: #28a745; color: #fff; }
.bg-warning { background: #ffc107; }
.text-dark { color: var(--text-primary); }
.bg-info { background: #17a2b8; color: #fff; }
.bg-secondary { background: #6c757d; color: #fff; }

.comp-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 8px 0 4px;
  line-height: 1.4;
}

.comp-card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  flex: 1;
}

.comp-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.comp-card-meta i {
  margin-right: 4px;
}

.comp-card-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
}

.comp-btn {
  display: block;
  width: 100%;
  text-align: center;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: transparent;
  transition: background 0.15s ease, color 0.15s ease;
}

.comp-btn:hover {
  background: var(--accent);
  color: #fff;
}
</style>
