const exerciseModel = require('../models/exerciseModel')
const aiService = require('../services/aiService')
const aiPrompts = require('../utils/aiPrompts')

exports.list = (req, res) => {
  const { difficulty, category, language, page, pageSize } = req.query
  const result = exerciseModel.findAll({ difficulty, category, language, page: +page || 1, pageSize: +pageSize || 20 })
  res.json({ success: true, data: result })
}

exports.detail = (req, res) => {
  const ex = exerciseModel.findById(+req.params.id)
  if (!ex) return res.status(404).json({ success: false, message: '题目不存在' })
  // 不返回 solution_code 给普通用户
  delete ex.solution_code
  res.json({ success: true, data: ex })
}

exports.categories = (req, res) => {
  const data = exerciseModel.categories()
  res.json({ success: true, data })
}

// POST /api/exercises — 创建题目（管理员）
exports.create = (req, res) => {
  const { title, description, difficulty, category, language, templateCode, testCases, solutionCode, hint } = req.body
  const id = exerciseModel.create({
    title, description, difficulty, category, language,
    templateCode, testCases, solutionCode, hint,
    createdBy: req.user.userId
  })
  res.json({ success: true, message: '题目创建成功', data: { id } })
}

// POST /api/exercises/generate — AI 出题（管理员）
exports.generate = async (req, res) => {
  const { topic, difficulty, language } = req.body
  try {
    const prompt = aiPrompts.buildGeneratePrompt(topic, difficulty, language)
    const aiResult = await aiService.chatCompletion({
      systemPrompt: prompt,
      userMessage: '请生成题目',
      maxTokens: 4096,
      temperature: 0.8
    })

    // 解析 AI 返回的 JSON
    let parsed
    const content = aiResult.content
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    } else {
      return res.status(500).json({ success: false, message: 'AI 生成的题目格式异常，请重试' })
    }

    const id = exerciseModel.createPending({
      title: parsed.title,
      description: parsed.description,
      difficulty: parsed.difficulty || difficulty,
      category: parsed.category || topic,
      language: parsed.language || language,
      templateCode: parsed.template_code,
      testCases: parsed.test_cases,
      solutionCode: parsed.solution_code,
      hint: parsed.hint,
      createdBy: req.user.userId
    })

    res.json({ success: true, message: 'AI 题目已生成，等待审核', data: { id, ...parsed } })
  } catch (e) {
    res.status(500).json({ success: false, message: 'AI 出题失败：' + e.message })
  }
}

// PUT /api/exercises/:id/approve — 审核题目（管理员）
exports.approve = (req, res) => {
  const { id } = req.params
  const { action } = req.body
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: '操作无效' })
  }
  const status = action === 'approve' ? 'approved' : 'rejected'
  exerciseModel.updateStatus(id, status)
  res.json({ success: true, message: action === 'approve' ? '题目已通过审核' : '题目已拒绝' })
}
