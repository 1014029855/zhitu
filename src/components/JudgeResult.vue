<template>
  <div v-if="result" class="judge-result">
    <div :class="`judge-alert ${statusClass}`">
      <i :class="`fas ${statusIcon} judge-alert-icon`"></i>
      <div>
        <h5 class="judge-alert-title">{{ statusText }}</h5>
        <small v-if="result.error" class="judge-error-text">{{ result.error }}</small>
      </div>
    </div>

    <!-- test case details -->
    <div v-if="result.testResults?.length" class="judge-card">
      <div class="judge-card-header">测试用例</div>
      <div class="judge-card-body">
        <div v-for="(t, i) in result.testResults" :key="i" class="judge-test-item" :class="{ 'judge-test-failed': !t.passed }">
          <div class="judge-test-head">
            <span :class="`judge-test-badge ${t.passed ? 'judge-pass' : 'judge-fail'}`">{{ t.passed ? '通过' : '失败' }}</span>
            <strong>测试 {{ i + 1 }}</strong>
          </div>
          <div class="judge-test-detail">
            <div><small>输入：</small><code>{{ t.input }}</code></div>
            <div><small>期望：</small><code>{{ t.expected }}</code></div>
            <div><small>实际：</small><code>{{ t.actual }}</code></div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI feedback -->
    <div v-if="result.aiFeedback" class="judge-card">
      <div class="judge-card-header"><i class="fas fa-robot"></i> AI 评语</div>
      <div class="judge-card-body">
        <div class="ai-feedback" style="white-space: pre-wrap;">{{ cleanMarkdown(result.aiFeedback) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ result: Object })

function cleanMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')      // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')           // *italic* → italic
    .replace(/___(.+?)___/g, '$1')         // ___underline___
    .replace(/__(.+?)__/g, '$1')           // __bold__
    .replace(/_(.+?)_/g, '$1')             // _italic_
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))  // `code` → code
    .replace(/^#{1,6}\s/gm, '')            // # heading
    .replace(/~~(.+?)~~/g, '$1')           // ~~strikethrough~~
    .replace(/^>\s/gm, '')                 // > blockquote
    .replace(/^[-*+]\s/gm, '· ')           // unordered list markers
    .replace(/^\d+\.\s/gm, '')            // ordered list numbers
}

const statusClass = computed(() => {
  if (!props.result) return ''
  if (props.result.status === 'passed') return 'judge-alert-success'
  if (props.result.status === 'error') return 'judge-alert-danger'
  return 'judge-alert-warning'
})

const statusIcon = computed(() => {
  if (!props.result) return ''
  if (props.result.status === 'passed') return 'fa-check-circle'
  if (props.result.status === 'error') return 'fa-exclamation-triangle'
  return 'fa-times-circle'
})

const statusText = computed(() => {
  if (!props.result) return ''
  if (props.result.status === 'passed') return '全部测试通过！'
  if (props.result.status === 'error') return '执行出错'
  return '部分测试未通过'
})
</script>

<style scoped>
.judge-result {
  margin-top: 1rem;
}

/* alert banner */
.judge-alert {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
}

.judge-alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.judge-alert-danger {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.judge-alert-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.judge-alert-icon {
  font-size: 1.5rem;
  margin-right: 12px;
}

.judge-alert-title {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 600;
}

.judge-error-text {
  display: block;
  color: var(--red);
  margin-top: 2px;
}

/* card */
.judge-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  margin-top: 1rem;
  overflow: hidden;
}

.judge-card-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.judge-card-header i {
  margin-right: 8px;
}

.judge-card-body {
  padding: 0;
}

/* test item */
.judge-test-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
}

.judge-test-item:last-child {
  border-bottom: 0;
}

.judge-test-failed {
  background: rgba(229, 72, 77, 0.08);
}

.judge-test-head {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.judge-test-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-md);
  margin-right: 8px;
}

.judge-pass {
  background: #28a745;
  color: #fff;
}

.judge-fail {
  background: var(--red);
  color: #fff;
}

.judge-test-detail {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  font-size: 12px;
}

.judge-test-detail small {
  color: var(--text-secondary);
}

.judge-test-detail code {
  font-size: 11px;
  word-break: break-all;
}

/* AI feedback */
.ai-feedback {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}
</style>
