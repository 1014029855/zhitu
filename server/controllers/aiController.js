const aiService = require('../services/aiService')
const sandboxService = require('../services/sandboxService')
const aiPrompts = require('../utils/aiPrompts')
const exerciseModel = require('../models/exerciseModel')
const codeSubmissionModel = require('../models/codeSubmissionModel')
const growthModel = require('../models/growthModel')
const { db } = require('../db/connection')

// ===== Conversation CRUD =====

exports.listConversations = (req, res) => {
  const rows = db.prepare(`
    SELECT id, title, context_type, context_id, created_at, updated_at,
           json_extract(messages, '$[0].content') as first_message
    FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC
  `).all(req.user.userId)
  const list = rows.map(r => ({ ...r, preview: (r.first_message || '').slice(0, 60) }))
  res.json({ success: true, data: list })
}

exports.getConversation = (req, res) => {
  const row = db.prepare('SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?').get(+req.params.id, req.user.userId)
  if (!row) return res.status(404).json({ success: false, message: '对话不存在' })
  row.messages = JSON.parse(row.messages || '[]')
  res.json({ success: true, data: row })
}

exports.deleteConversation = (req, res) => {
  db.prepare('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?').run(+req.params.id, req.user.userId)
  res.json({ success: true, message: '已删除' })
}

exports.updateTitle = (req, res) => {
  db.prepare('UPDATE ai_conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
    .run(req.body.title || '未命名对话', +req.params.id, req.user.userId)
  res.json({ success: true })
}

// ===== Chat with SSE streaming =====
exports.chat = async (req, res) => {
  const { message, conversationId, contextType, contextId, contextContent } = req.body
  if (!message?.trim()) return res.status(400).json({ success: false, message: '请输入消息' })

  const userId = req.user.userId
  const now = new Date().toISOString()

  // Load or create conversation
  let conv = null
  if (conversationId) {
    conv = db.prepare('SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?').get(conversationId, userId)
  }
  if (!conv) {
    const title = message.slice(0, 40) + (message.length > 40 ? '...' : '')
    const result = db.prepare(
      'INSERT INTO ai_conversations (user_id, title, context_type, context_id, messages) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, title, contextType || '', contextId || 0, '[]')
    conv = { id: result.lastInsertRowid, messages: '[]', title }
  }

  const history = JSON.parse(conv.messages || '[]')

  // Build system prompt with context
  let systemPrompt = '你是小知，大学生的AI学习助手。请给出详细、深入的回答，至少400字，包含具体示例和解释。'
  if (contextContent) {
    systemPrompt += `\n\n【当前上下文】\n${contextContent}`
  }

  // Add user message to history
  history.push({ role: 'user', content: message, time: now })

  // Save user message immediately
  db.prepare('UPDATE ai_conversations SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(JSON.stringify(history), conv.id)

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  try {
    // Non-streaming call — deepseek-v4-flash separates reasoning from answer properly
    const result = await aiService.chatCompletion({
      systemPrompt,
      userMessage: message,
      history: history.slice(0, -1),
      maxTokens: 16384,
      temperature: 0.7,
      model: 'deepseek-chat'
    })

    const answer = result.content

    // Simulate streaming chunks for frontend compatibility
    const size = 20
    for (let i = 0; i < answer.length; i += size) {
      res.write(`data: ${JSON.stringify({ content: answer.slice(i, i + size), conversationId: conv.id })}\n\n`)
    }

    history.push({ role: 'assistant', content: answer, time: new Date().toISOString() })
    db.prepare('UPDATE ai_conversations SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(history), conv.id)
    res.write(`data: ${JSON.stringify({ done: true, conversationId: conv.id })}\n\n`)
    res.end()
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用: ' + e.message })}\n\n`)
    res.end()
  }
}

// ===== Judge (existing, kept) =====
function cleanAiOutput(text) {
  if (!text) return ''
  return text.replace(/```[\s\S]*?```/g, m => m.replace(/```\w*\n?/g, '').replace(/```/g, '').trim())
    .replace(/`([^`]+)`/g, '$1').replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '')
    .replace(/^---+$/gm, '').replace(/^#{1,6} /gm, '').replace(/\n{3,}/g, '\n\n').trim()
}

exports.judge = async (req, res) => {
  const sandboxStatus = sandboxService.getStatus()
  if (!sandboxStatus.available) {
    return res.status(503).json({
      success: false,
      code: 'CODE_EXECUTION_UNAVAILABLE',
      message: sandboxStatus.message
    })
  }

  const { code, language, exerciseId } = req.body
  const question = exerciseModel.findById(exerciseId)
  if (!question) return res.status(404).json({ success: false, message: '题目不存在' })
  const testCases = JSON.parse(question.test_cases || '[]')
  if (testCases.length === 0) return res.status(400).json({ success: false, message: '题目缺少测试用例' })
  try {
    const execResult = await sandboxService.execute({ code, language, testCases })
    let aiFeedback = null
    try {
      const judgePrompt = aiPrompts.buildJudgePrompt(code, language, question, execResult.testResults)
      const aiResult = await aiService.chatCompletion({ systemPrompt: judgePrompt, userMessage: '请评审以上代码', maxTokens: 2048, temperature: 0.3 })
      aiFeedback = cleanAiOutput(aiResult.content)
    } catch { aiFeedback = 'AI 评审暂时不可用' }
    const status = execResult.passed ? 'passed' : (execResult.error ? 'error' : 'failed')
    const subId = codeSubmissionModel.create({ exerciseId: question.id, userId: req.user.userId, code, language, status, executionResult: execResult, aiFeedback })
    const review = growthModel.recordExerciseResult(req.user.userId, question.id, execResult.passed)
    res.json({ success: true, data: { id: subId, status, testResults: execResult.testResults, error: execResult.error, aiFeedback, review } })
  } catch (e) {
    if (e instanceof sandboxService.SandboxUnavailableError) {
      return res.status(503).json({ success: false, code: e.code, message: e.message })
    }
    res.status(500).json({ success: false, message: '判题服务出错：' + e.message })
  }
}

exports.judgeStatus = (req, res) => {
  res.json({ success: true, data: sandboxService.getStatus() })
}
