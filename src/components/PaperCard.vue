<template>
  <router-link v-if="!source || source === 'local'" :to="'/papers/' + paper.id" class="paper-card-link">
    <div class="paper-card">
      <img :src="paper.image_url || '/assets/photo/home/home_3.jpg'" class="paper-card-image" :alt="paper.title" @error="$event.target.style.display='none'" />
      <div class="paper-card-body">
        <div class="paper-card-tags">
          <span class="paper-badge paper-badge-primary">{{ paper.category }}</span>
          <span class="paper-badge paper-badge-secondary">{{ paper.year }}</span>
          <span v-if="paper.paper_source === 'local' || (!paper.paper_source && !paper.paperId)" class="paper-badge paper-badge-local">本地</span>
        </div>
        <h5 class="paper-card-title">{{ paper.title?.substring(0, 60) }}{{ paper.title?.length > 60 ? '...' : '' }}</h5>
        <p class="paper-card-authors">{{ paper.authors?.substring(0, 80) }}</p>
        <small class="paper-card-citations"><i class="fas fa-quote-right"></i>被引 {{ paper.citations || 0 }} 次</small>
      </div>
    </div>
  </router-link>

  <!-- external paper card -->
  <a v-else :href="paper.url || '#'" target="_blank" rel="noopener" class="paper-card-link">
    <div class="paper-card paper-card-external">
      <div class="paper-card-body">
        <div class="paper-card-meta-row">
          <span class="paper-badge paper-badge-venue">{{ paper.venue || '学术期刊' }}</span>
          <span class="paper-badge paper-badge-secondary">{{ paper.year }}</span>
        </div>
        <h5 class="paper-card-title">{{ paper.title?.substring(0, 70) }}{{ paper.title?.length > 70 ? '...' : '' }}</h5>
        <p class="paper-card-abstract">{{ paper.abstract?.substring(0, 120) || '暂无摘要' }}...</p>
        <p class="paper-card-authors-external">{{ paper.authors?.substring(0, 60) }}</p>
        <div class="paper-card-source-row">
          <small><i class="fas fa-quote-right"></i>{{ paper.citations || 0 }} 次引用</small>
          <small class="paper-source-link"><i class="fas fa-external-link-alt"></i>Semantic Scholar</small>
        </div>
      </div>
    </div>
  </a>
</template>

<script setup>
defineProps({ paper: Object, source: String })
</script>

<style scoped>
.paper-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.paper-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease;
}

.paper-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.paper-card-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.paper-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.paper-card-tags {
  margin-bottom: 8px;
}

.paper-card-meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.paper-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-md);
  margin-right: 4px;
}

.paper-badge-primary {
  background: var(--accent);
  color: #fff;
}

.paper-badge-secondary {
  background: #6c757d;
  color: #fff;
}

.paper-badge-local {
  background: #28a745;
  color: #fff;
}

.paper-badge-venue {
  background: #17a2b8;
  color: #fff;
}

.paper-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 8px 0 4px;
  line-height: 1.4;
}

.paper-card-authors {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  flex: 1;
}

.paper-card-abstract {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  flex: 1;
}

.paper-card-authors-external {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 0;
}

.paper-card-citations {
  font-size: 12px;
  color: var(--text-secondary);
}

.paper-card-citations i {
  margin-right: 4px;
}

.paper-card-source-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.paper-card-source-row i {
  margin-right: 4px;
}

.paper-source-link {
  color: #17a2b8;
}
</style>
