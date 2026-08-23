<template>
  <div class="ai-page">
    <!-- Sidebar -->
    <aside class="ai-sidebar">
      <button class="ai-sidebar__new" @click="chat.newConversation()">
        <Plus :size="16" :stroke-width="1.8" />
        新对话
      </button>
      <div class="ai-sidebar__list">
        <div
          v-for="conv in chat.conversations.value"
          :key="conv.id"
          class="ai-sidebar__item"
          :class="{ 'ai-sidebar__item--active': conv.id === chat.activeConversationId.value }"
          @click="chat.openConversation(conv.id)"
        >
          <div class="ai-sidebar__item-title">{{ conv.title || '新对话' }}</div>
          <div class="ai-sidebar__item-date">{{ timeAgo(conv.updated_at || conv.created_at) }}</div>
          <button class="ai-sidebar__item-del" @click.stop="chat.deleteConversation(conv.id)" title="删除">
            <Trash2 :size="13" :stroke-width="1.5" />
          </button>
        </div>
        <p v-if="!chat.conversations.value.length" class="ai-sidebar__empty">暂无对话</p>
      </div>
    </aside>

    <!-- Main -->
    <main class="ai-chat">
      <!-- Empty -->
      <div v-if="!chat.activeConversationId.value && !chat.activeMessages.value.length" class="ai-chat__empty">
        <span class="ai-chat__logo">知</span>
        <h2>你好，我是小知</h2>
        <p>你的 AI 学习助手。问论文、问题目、问课程，我都会尽力帮你。</p>
        <div class="ai-chat__prompts">
          <button v-for="p in quickPrompts" :key="p" class="ai-chat__prompt" @click="startQuick(p)">{{ p }}</button>
        </div>
      </div>

      <!-- Messages -->
      <div v-else class="ai-chat__messages" ref="msgContainer">
        <div v-for="(msg, i) in chat.activeMessages.value" :key="i" class="ai-msg" :class="msg.role">
          <div class="ai-msg__label">{{ msg.role === 'user' ? '你' : '小知' }}</div>
          <div class="ai-msg__bubble" :class="{ 'ai-msg__bubble--err': msg.error }">{{ msg.content }}</div>
        </div>

        <!-- Streaming bubble -->
        <div v-if="chat.isLoading.value && chat.streamingContent.value" class="ai-msg assistant">
          <div class="ai-msg__label">小知 <span class="ai-msg__cursor">▍</span></div>
          <div class="ai-msg__bubble ai-msg__bubble--streaming">{{ chat.streamingContent.value }}</div>
        </div>

        <!-- Thinking dots -->
        <div v-if="chat.isLoading.value && !chat.streamingContent.value" class="ai-chat__thinking">
          <span class="dot">●</span><span class="dot">●</span><span class="dot">●</span>
        </div>
      </div>

      <!-- Input -->
      <div class="ai-chat__input">
        <textarea
          v-model="input"
          class="ai-chat__textarea"
          placeholder="输入你的问题..."
          rows="2"
          @keydown.enter.exact.prevent="doSend()"
          :disabled="chat.isLoading.value"
        ></textarea>
        <button class="ai-chat__send" @click="doSend()" :disabled="chat.isLoading.value || !input.trim()">
          <Send :size="17" :stroke-width="1.8" />
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { Plus, Send, Trash2 } from 'lucide-vue-next'
import { useAiChat } from '../composables/useAiChat'

const chat = useAiChat()
const input = ref('')
const msgContainer = ref(null)
const quickPrompts = [
  '解释一篇论文的核心思想',
  '刷题遇到 StackOverflow 怎么排查',
  '西方哲学史讲了哪些重要人物',
  'Python 的装饰器是什么'
]

watch(() => chat.activeMessages.value.length, async () => {
  await nextTick()
  if (msgContainer.value) msgContainer.value.scrollTop = msgContainer.value.scrollHeight
})
watch(() => chat.streamingContent.value, async () => {
  await nextTick()
  if (msgContainer.value) msgContainer.value.scrollTop = msgContainer.value.scrollHeight
})

function doSend() {
  if (!input.value.trim() || chat.isLoading.value) return
  chat.sendMessage(input.value.trim())
  input.value = ''
}

function startQuick(p) { chat.sendMessage(p) }

function timeAgo(ts) {
  if (!ts) return ''
  // SQLite stores UTC without timezone marker → force UTC parse, then add 8h for China
  let t = new Date(ts)
  if (typeof ts === 'string' && !ts.includes('T') && !ts.includes('Z') && !ts.includes('+')) {
    t = new Date(ts + 'Z')  // treat SQLite format as UTC
  }
  const diff = Date.now() - t.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  return `${Math.floor(hrs / 24)}天前`
}

onMounted(() => chat.loadConversations())
</script>

<style scoped>
.ai-page { display: flex; height: 100vh; background: var(--bg-primary); }

/* sidebar */
.ai-sidebar { width: 260px; border-right: 1px solid var(--border-primary); display: flex; flex-direction: column; background: var(--bg-white); flex-shrink: 0; }
.ai-sidebar__new {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin: 14px 12px; padding: 9px; border-radius: var(--radius-md);
  background: var(--text-primary); color: #fff; font-size: 13px; font-weight: 500;
  transition: background 0.15s;
}
.ai-sidebar__new:hover { background: #333; }
.ai-sidebar__list { flex: 1; overflow-y: auto; padding: 0 6px; }
.ai-sidebar__item {
  position: relative; padding: 10px 30px 10px 12px; border-radius: var(--radius-md);
  cursor: pointer; margin-bottom: 1px; transition: background 0.1s;
}
.ai-sidebar__item:hover { background: var(--bg-secondary); }
.ai-sidebar__item--active { background: var(--bg-secondary); }
.ai-sidebar__item-title { font-size: 13px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ai-sidebar__item-date { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.ai-sidebar__item-del { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); opacity: 0; color: var(--text-muted); padding: 4px; }
.ai-sidebar__item:hover .ai-sidebar__item-del { opacity: 0.5; }
.ai-sidebar__item-del:hover { color: #e5484d; opacity: 1; }
.ai-sidebar__empty { text-align: center; padding: 32px 16px; font-size: 12px; color: var(--text-muted); }

/* main */
.ai-chat { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg-primary); }

/* empty */
.ai-chat__empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px;
}
.ai-chat__logo {
  font-family: 'Ma Shan Zheng', cursive; font-size: 56px; color: var(--text-primary);
  line-height: 1; margin-bottom: 16px; opacity: 0.8;
}
.ai-chat__empty h2 { font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.ai-chat__empty p { font-size: 14px; color: var(--text-secondary); margin-bottom: 28px; text-align: center; max-width: 400px; }
.ai-chat__prompts { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 480px; }
.ai-chat__prompt {
  padding: 8px 16px; border: 1px solid var(--border-primary); border-radius: var(--radius-md);
  font-size: 13px; color: var(--text-secondary); transition: all 0.15s; background: var(--bg-white);
}
.ai-chat__prompt:hover { border-color: var(--accent); color: var(--accent-hover); }

/* messages */
.ai-chat__messages { flex: 1; overflow-y: auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 24px; }
.ai-msg { max-width: 720px; display: flex; flex-direction: column; gap: 4px; }
.ai-msg.user { align-self: flex-end; align-items: flex-end; }
.ai-msg.assistant { align-self: flex-start; }

.ai-msg__label { font-size: 11px; font-weight: 500; color: var(--text-muted); padding: 0 4px; }
.ai-msg.user .ai-msg__label { color: var(--accent-hover); }

.ai-msg__bubble {
  padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.75;
  color: var(--text-primary); word-break: break-word; white-space: pre-wrap;
}
.ai-msg.user .ai-msg__bubble { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-bottom-right-radius: 4px; }
.ai-msg.assistant .ai-msg__bubble { background: transparent; border: 0; padding: 0 4px; border-bottom-left-radius: 4px; }
.ai-msg__bubble--err { color: #e5484d; }
.ai-msg__bubble--streaming { opacity: 0.9; }

.ai-msg__cursor {
  display: inline-block; animation: blink 0.8s step-end infinite;
  color: var(--accent); font-weight: 400;
}

/* thinking dots */
.ai-chat__thinking { display: flex; gap: 4px; padding: 4px 8px; }
.ai-chat__thinking .dot { font-size: 6px; color: var(--text-muted); animation: dotBounce 1.2s ease-in-out infinite; }
.ai-chat__thinking .dot:nth-child(2) { animation-delay: 0.2s; }
.ai-chat__thinking .dot:nth-child(3) { animation-delay: 0.4s; }

/* input */
.ai-chat__input {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid var(--border-primary); background: var(--bg-white);
}
.ai-chat__textarea {
  flex: 1; border: 1px solid var(--border-primary); border-radius: 12px;
  padding: 10px 14px; font-size: 14px; resize: none; outline: none; font-family: inherit;
  max-height: 120px; transition: border-color 0.2s; background: var(--bg-primary);
}
.ai-chat__textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(136,190,92,0.12); }
.ai-chat__send {
  width: 38px; height: 38px; border-radius: 10px; background: var(--text-primary);
  color: #fff; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.ai-chat__send:hover { background: #333; }
.ai-chat__send:disabled { opacity: 0.3; cursor: not-allowed; }

@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes dotBounce { 0%, 80%, 100% { opacity: 0.2; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-4px); } }

@media (max-width: 700px) { .ai-sidebar { display: none; } .ai-chat__messages { padding: 20px 16px; } }
</style>
