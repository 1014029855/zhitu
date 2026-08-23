<template>
  <div class="code-editor-wrapper">
    <div class="editor-toolbar">
      <select v-model="selectedLang" class="lang-select" @change="onLangChange">
        <option value="python">Python 3</option>
        <option value="c++">C++ (g++ 17)</option>
        <option value="java">Java</option>
      </select>
      <small class="lang-label">{{ selectedLang }}</small>
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'python' }
})
const emit = defineEmits(['update:modelValue', 'update:language'])

const editorContainer = ref(null)
const selectedLang = ref(props.language)
let editor = null
let monacoRef = null
let isMounted = true

function monacoLanguage(lang) {
  if (lang === 'c++') return 'cpp'
  return lang
}

function onLangChange() {
  emit('update:language', selectedLang.value)
  if (editor && monacoRef) {
    monacoRef.editor.setModelLanguage(editor.getModel(), monacoLanguage(selectedLang.value))
  }
}

onMounted(async () => {
  monacoRef = await import('monaco-editor')
  if (!isMounted) return
  editor = monacoRef.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: monacoLanguage(selectedLang.value),
    theme: 'vs',
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 4
  })
  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor.getValue())
  })
})

watch(() => props.language, (lang) => {
  selectedLang.value = lang
  if (editor && monacoRef) {
    monacoRef.editor.setModelLanguage(editor.getModel(), monacoLanguage(lang))
  }
})

watch(() => props.modelValue, (val) => {
  if (editor && val !== editor.getValue()) {
    editor.setValue(val)
  }
})

onBeforeUnmount(() => {
  isMounted = false
  if (editor) editor.dispose()
})
</script>

<style scoped>
.code-editor-wrapper {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
}

.lang-select {
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
}

.lang-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.lang-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.editor-container {
  height: 400px;
}
</style>
