<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="drawer-overlay" @click.self="close">
        <div class="drawer">
          <div class="drawer__header">
            <h3 class="drawer__title">小知助手</h3>
            <button class="drawer__close" @click="close">&times;</button>
          </div>

          <div class="drawer__messages" ref="msgEl">
            <div v-for="(msg, i) in chat.activeMessages.value" :key="i" class="ai-msg" :class="msg.role">
              <div class="ai-msg__label">{{ msg.role === 'user' ? '你' : '小知' }}</div>
              <div class="ai-msg__bubble">{{ msg.content }}</div>
            </div>

            <div v-if="chat.isLoading.value && chat.streamingContent.value" class="ai-msg assistant">
              <div class="ai-msg__label">小知 <span class="ai-msg__cursor">▍</span></div>
              <div class="ai-msg__bubble">{{ chat.streamingContent.value }}</div>
            </div>

            <div v-if="chat.isLoading.value && !chat.streamingContent.value" class="dots-row">
              <span class="dot">●</span><span class="dot">●</span><span class="dot">●</span>
            </div>
          </div>

          <div class="drawer__input">
            <input
              v-model="input"
              class="drawer__input-field"
              placeholder="输入问题..."
              @keydown.enter="doSend()"
              :disabled="chat.isLoading.value"
            />
            <button class="drawer__send" @click="doSend()" :disabled="chat.isLoading.value || !input.trim()">
              <Send :size="15" :stroke-width="1.8" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { Send } from 'lucide-vue-next'
import { useAiChat } from '../composables/useAiChat'

const props = defineProps({
  visible: Boolean,
  context: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['close'])

const chat = useAiChat()
const input = ref('')
const msgEl = ref(null)
let sent = false

watch(() => props.visible, async (v) => {
  if (v) {
    chat.newConversation()
    sent = false
    if (props.context.content) {
      await nextTick()
      sent = true
      const ctxMsg = `[上下文] ${props.context.content}\n\n${props.context.question || '请帮我理解以上内容。'}`
      chat.sendMessage(ctxMsg, props.context)
    }
  }
})

watch([() => chat.activeMessages.value.length, () => chat.streamingContent.value], async () => {
  await nextTick()
  if (msgEl.value) msgEl.value.scrollTop = msgEl.value.scrollHeight
})

function doSend() {
  if (!input.value.trim() || chat.isLoading.value) return
  if (!sent) { sent = true }
  chat.sendMessage(input.value.trim(), props.context)
  input.value = ''
}

function close() { emit('close') }

onMounted(() => chat.loadConversations())
</script>

<style scoped>
.drawer-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.15); display: flex; justify-content: flex-end; }
.drawer {
  width: 420px; max-width: 92vw; height: 100vh; background: var(--bg-primary);
  display: flex; flex-direction: column; box-shadow: -2px 0 24px rgba(0,0,0,0.06);
}
.drawer__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 15px 18px; border-bottom: 1px solid var(--border-primary); flex-shrink: 0;
}
.drawer__title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.drawer__close { font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 0 4px; }
.drawer__close:hover { color: var(--text-primary); }

.drawer__messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 18px; }

.ai-msg { max-width: 100%; display: flex; flex-direction: column; gap: 2px; }
.ai-msg.user { align-items: flex-end; }
.ai-msg.assistant { align-items: flex-start; }

.ai-msg__label { font-size: 11px; font-weight: 500; color: var(--text-muted); padding: 0 2px; }
.ai-msg.user .ai-msg__label { color: var(--accent-hover); }

.ai-msg__bubble {
  padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.7;
  color: var(--text-primary); white-space: pre-wrap; word-break: break-word;
}
.ai-msg.user .ai-msg__bubble { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-bottom-right-radius: 3px; }
.ai-msg.assistant .ai-msg__bubble { background: transparent; padding: 0 2px; border-bottom-left-radius: 3px; }

.ai-msg__cursor { display: inline-block; animation: blink 0.8s step-end infinite; color: var(--accent); }

.dots-row { display: flex; gap: 4px; padding: 4px 2px; }
.dots-row .dot { font-size: 5px; color: var(--text-muted); animation: dotBounce 1.2s ease-in-out infinite; }
.dots-row .dot:nth-child(2) { animation-delay: 0.2s; }
.dots-row .dot:nth-child(3) { animation-delay: 0.4s; }

.drawer__input { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--border-primary); flex-shrink: 0; }
.drawer__input-field {
  flex: 1; height: 38px; border: 1px solid var(--border-primary); border-radius: 10px;
  padding: 0 12px; font-size: 13px; outline: none; transition: border-color 0.2s; background: var(--bg-secondary);
}
.drawer__input-field:focus { border-color: var(--accent); }
.drawer__send {
  width: 36px; height: 36px; border-radius: 8px; background: var(--text-primary);
  color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.drawer__send:hover { background: #333; }
.drawer__send:disabled { opacity: 0.3; cursor: not-allowed; }

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(100%); }

@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes dotBounce { 0%, 80%, 100% { opacity: 0.2; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
</style>
