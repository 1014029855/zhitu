import { ref, computed } from 'vue'
import { useRequest } from './useRequest'

const conversations = ref([])
const activeConversationId = ref(null)
const activeMessages = ref([])
const isLoading = ref(false)
const streamingContent = ref('')
const rawStreamingContent = ref('')

const { get, post, del } = useRequest()

function cleanMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').replace(/```/g, '').trim())
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_{1,2}(.+?)_{1,2}/g, '$1')
    .replace(/^#{1,6} /gm, '')
    .replace(/^\s*[-*+]\s/gm, '· ')
    .replace(/^---+$/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function useAiChat() {
  const activeConversation = computed(() => conversations.value.find(c => c.id === activeConversationId.value))

  async function loadConversations() {
    try {
      const data = await get('/ai/conversations')
      conversations.value = (data || []).map(c => ({
        ...c,
        preview: cleanMarkdown((c.preview || c.first_message || c.title || '')).slice(0, 50)
      }))
    } catch { conversations.value = [] }
  }

  async function openConversation(id) {
    if (!id) return
    activeConversationId.value = id
    try {
      const data = await get(`/ai/conversations/${id}`)
      const msgs = data?.messages ? (typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages) : []
      activeMessages.value = msgs.map(m => ({ ...m, content: cleanMarkdown(m.content || '') }))
    } catch { activeMessages.value = [] }
  }

  function newConversation() {
    activeConversationId.value = null
    activeMessages.value = []
    streamingContent.value = ''
    rawStreamingContent.value = ''
  }

  async function sendMessage(message, context = {}) {
    if (!message.trim() || isLoading.value) return

    rawStreamingContent.value = ''
    streamingContent.value = ''
    activeMessages.value.push({ role: 'user', content: message, time: new Date().toISOString() })

    isLoading.value = true
    const body = {
      message,
      conversationId: activeConversationId.value,
      contextType: context.type || '',
      contextId: context.id || 0,
      contextContent: context.content || ''
    }

    try {
      const token = JSON.parse(localStorage.getItem('userToken') || 'null')
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      })

      if (!resp.ok) throw new Error('Request failed')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.error) {
              activeMessages.value.push({ role: 'assistant', content: data.error, time: new Date().toISOString(), error: true })
            } else if (data.done) {
              activeConversationId.value = data.conversationId
              await loadConversations()
            } else if (data.content) {
              rawStreamingContent.value += data.content
              streamingContent.value = cleanMarkdown(rawStreamingContent.value)
            }
          } catch {}
        }
      }

      const clean = cleanMarkdown(rawStreamingContent.value)
      activeMessages.value.push({ role: 'assistant', content: clean, time: new Date().toISOString() })
      streamingContent.value = ''
      rawStreamingContent.value = ''
    } catch (e) {
      activeMessages.value.push({ role: 'assistant', content: 'AI 响应失败：' + e.message, time: new Date().toISOString(), error: true })
    } finally {
      isLoading.value = false
    }
  }

  async function deleteConversation(id) {
    await del(`/ai/conversations/${id}`)
    if (activeConversationId.value === id) newConversation()
    await loadConversations()
  }

  return {
    conversations, activeConversationId, activeMessages, isLoading, streamingContent, activeConversation,
    loadConversations, openConversation, newConversation, sendMessage, deleteConversation, cleanMarkdown
  }
}
