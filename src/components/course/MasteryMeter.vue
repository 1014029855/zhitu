<template>
  <div class="mastery-meter" :class="{ 'mastery-meter--compact': compact }">
    <div class="mastery-meter__header">
      <span>{{ title }}</span>
      <strong>{{ score }}%</strong>
    </div>
    <div class="mastery-meter__track" aria-hidden="true">
      <span class="mastery-meter__fill" :style="{ width: `${score}%` }"></span>
    </div>
    <div v-if="!compact" class="mastery-meter__levels">
      <span v-for="level in levels" :key="level.key" :class="{ active: level.key === currentLevel }">
        <i></i>{{ level.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: { type: Number, default: 0 },
  title: { type: String, default: '掌握度' },
  compact: { type: Boolean, default: false }
})

const levels = [
  { key: 'initial', label: '初识', min: 0 },
  { key: 'familiar', label: '熟悉', min: 30 },
  { key: 'proficient', label: '熟练', min: 60 },
  { key: 'mastered', label: '掌握', min: 85 }
]
const currentLevel = computed(() => [...levels].reverse().find(level => props.score >= level.min)?.key || 'initial')
</script>

<style scoped>
.mastery-meter { display: grid; gap: 10px; }
.mastery-meter__header { display: flex; align-items: baseline; justify-content: space-between; font-size: 12px; color: var(--text-secondary); }
.mastery-meter__header strong { font-family: var(--font-mono); font-size: 15px; color: var(--text-primary); }
.mastery-meter__track { height: 5px; overflow: hidden; background: #e7e9e5; }
.mastery-meter__fill { display: block; height: 100%; background: #159447; transition: width 700ms cubic-bezier(.16,1,.3,1); }
.mastery-meter__levels { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.mastery-meter__levels span { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #959a94; white-space: nowrap; }
.mastery-meter__levels i { width: 6px; height: 6px; border: 1px solid #b7bbb6; border-radius: 50%; }
.mastery-meter__levels .active { color: #126c35; font-weight: 700; }
.mastery-meter__levels .active i { border-color: #159447; background: #159447; }
.mastery-meter--compact { gap: 7px; }
</style>
