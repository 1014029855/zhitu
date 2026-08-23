<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="分页导航">
    <button class="pagination__btn" :disabled="current <= 1" @click="go(current - 1)">上一页</button>
    <button
      v-for="p in visiblePages"
      :key="p"
      class="pagination__btn"
      :class="{ 'pagination__btn--active': p === current }"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button class="pagination__btn" :disabled="current >= totalPages" @click="go(current + 1)">下一页</button>
    <span class="pagination__info">共 {{ total }} 条，第 {{ current }}/{{ totalPages }} 页</span>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 }
})
const emit = defineEmits(['change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const visiblePages = computed(() => {
  const pages = []
  const max = 5
  let start = Math.max(1, props.current - Math.floor(max / 2))
  let end = start + max - 1
  if (end > totalPages.value) {
    end = totalPages.value
    start = Math.max(1, end - max + 1)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function go(page) {
  if (page >= 1 && page <= totalPages.value) emit('change', page)
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px 0;
}

.pagination__btn {
  height: 32px;
  min-width: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.pagination__btn:hover:not(:disabled) {
  border-color: var(--text-secondary);
}

.pagination__btn--active {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--bg-primary);
}

.pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__info {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
