const competitionModel = require('../models/competitionModel')
const exerciseModel = require('../models/exerciseModel')
const paperModel = require('../models/paperModel')
const skillModel = require('../models/skillModel')
const growthModel = require('../models/growthModel')
const aiService = require('../services/aiService')

function sendError(res, error) {
  console.error(error)
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : '操作失败，请稍后重试'
  })
}

function parseAiJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  return JSON.parse(cleaned)
}

function templatePlan(competition) {
  return {
    title: `备赛：${competition.title}`,
    description: '围绕报名、准备、提交和复盘安排推进。',
    sourceType: 'competition',
    sourceId: competition.id,
    targetDate: competition.deadline || competition.end_date || null,
    milestones: [
      {
        title: '确定方向',
        tasks: [
          { title: '确认参赛与组队安排', contentType: 'competition', contentId: competition.id, contentKey: 'preparing', priority: 1 },
          { title: '完成报名', contentType: 'competition', contentId: competition.id, contentKey: 'registered', priority: 1 }
        ]
      },
      {
        title: '集中准备',
        tasks: [
          { title: '拆解赛题要求并确定分工', contentType: 'custom', priority: 1 },
          { title: '完成一次阶段检查', contentType: 'custom', priority: 2 },
          { title: '整理并提交材料', contentType: 'competition', contentId: competition.id, contentKey: 'submitted', priority: 1 }
        ]
      },
      {
        title: '结果复盘',
        tasks: [
          { title: '记录结果、问题与改进项', contentType: 'competition', contentId: competition.id, contentKey: 'completed', priority: 2 }
        ]
      }
    ]
  }
}

function contentExists(contentType, contentId) {
  const models = {
    competition: competitionModel,
    skill: skillModel,
    exercise: exerciseModel,
    paper: paperModel
  }
  return Boolean(models[contentType]?.findById(contentId))
}

exports.dashboard = (req, res) => {
  res.json({ success: true, data: growthModel.dashboard(req.user.userId) })
}

exports.listGoals = (req, res) => {
  res.json({ success: true, data: growthModel.listGoals(req.user.userId, req.query.status) })
}

exports.getGoal = (req, res) => {
  const goal = growthModel.getGoal(req.user.userId, +req.params.id)
  if (!goal) return res.status(404).json({ success: false, message: '目标不存在' })
  return res.json({ success: true, data: goal })
}

exports.createGoal = (req, res) => {
  try {
    return res.status(201).json({ success: true, data: growthModel.createGoal(req.user.userId, req.body) })
  } catch (error) {
    return sendError(res, error)
  }
}

exports.createFromCompetition = (req, res) => {
  const competition = competitionModel.findById(+req.params.competitionId)
  if (!competition) return res.status(404).json({ success: false, message: '竞赛不存在' })
  try {
    return res.status(201).json({ success: true, data: growthModel.createFromCompetition(req.user.userId, competition) })
  } catch (error) {
    return sendError(res, error)
  }
}

exports.updateGoal = (req, res) => {
  try {
    return res.json({ success: true, data: growthModel.updateGoal(req.user.userId, +req.params.id, req.body) })
  } catch (error) {
    return sendError(res, error)
  }
}

exports.addTask = (req, res) => {
  try {
    return res.status(201).json({ success: true, data: growthModel.addTask(req.user.userId, +req.params.id, req.body) })
  } catch (error) {
    return sendError(res, error)
  }
}

exports.updateTask = (req, res) => {
  try {
    return res.json({
      success: true,
      data: growthModel.updateTask(req.user.userId, +req.params.goalId, +req.params.taskId, req.body)
    })
  } catch (error) {
    return sendError(res, error)
  }
}

exports.listBookmarks = (req, res) => {
  res.json({ success: true, data: growthModel.listBookmarks(req.user.userId, req.query.contentType) })
}

exports.addBookmark = (req, res) => {
  if (!contentExists(req.body.contentType, req.body.contentId)) {
    return res.status(404).json({ success: false, message: '收藏内容不存在' })
  }
  res.status(201).json({
    success: true,
    data: growthModel.addBookmark(req.user.userId, req.body.contentType, req.body.contentId)
  })
}

exports.removeBookmark = (req, res) => {
  res.json({
    success: true,
    data: { removed: growthModel.removeBookmark(req.user.userId, req.params.contentType, +req.params.contentId) }
  })
}

exports.getParticipation = (req, res) => {
  res.json({ success: true, data: growthModel.getParticipation(req.user.userId, +req.params.competitionId) })
}

exports.upsertParticipation = (req, res) => {
  const competition = competitionModel.findById(+req.params.competitionId)
  if (!competition) return res.status(404).json({ success: false, message: '竞赛不存在' })
  res.json({
    success: true,
    data: growthModel.upsertParticipation(req.user.userId, competition.id, req.body)
  })
}

exports.listPaperLibrary = (req, res) => {
  res.json({ success: true, data: growthModel.listPaperLibrary(req.user.userId, req.query.status) })
}

exports.upsertPaperLibrary = (req, res) => {
  const paper = paperModel.findById(+req.params.paperId)
  if (!paper) return res.status(404).json({ success: false, message: '论文不存在' })
  res.json({ success: true, data: growthModel.upsertPaperLibrary(req.user.userId, paper.id, req.body) })
}

exports.listExerciseReviews = (req, res) => {
  res.json({ success: true, data: growthModel.listExerciseReviews(req.user.userId, req.query.status) })
}

exports.listAchievements = (req, res) => {
  res.json({ success: true, data: growthModel.listAchievements(req.user.userId) })
}

exports.createAchievement = (req, res) => {
  try {
    return res.status(201).json({ success: true, data: growthModel.createAchievement(req.user.userId, req.body) })
  } catch (error) {
    return sendError(res, error)
  }
}

exports.previewCompetitionPlan = async (req, res) => {
  const competition = competitionModel.findById(+req.params.competitionId)
  if (!competition) return res.status(404).json({ success: false, message: '竞赛不存在' })

  let plan = templatePlan(competition)
  let source = 'template'
  if (aiService.isConfigured()) {
    try {
      const result = await aiService.chatCompletion({
        systemPrompt: '你是大学生竞赛项目教练。只返回合法 JSON，不要 Markdown。计划要具体、简短、可执行。',
        userMessage: `根据以下竞赛生成计划：${JSON.stringify(competition)}。JSON 结构必须为 {title,description,targetDate,milestones:[{title,description,dueDate,tasks:[{title,description,dueDate,priority}]}]}。priority 只能是 1、2、3。`,
        maxTokens: 3000,
        temperature: 0.3
      })
      const aiPlan = parseAiJson(result.content)
      plan = {
        ...aiPlan,
        sourceType: 'competition',
        sourceId: competition.id,
        milestones: (aiPlan.milestones || []).map(milestone => ({
          ...milestone,
          tasks: (milestone.tasks || []).map(task => ({ ...task, contentType: 'custom' }))
        }))
      }
      source = 'ai'
    } catch (error) {
      console.error('AI plan fallback:', error.message)
    }
  }

  return res.json({ success: true, data: { source, plan, persisted: false } })
}

exports.confirmPlan = (req, res) => {
  try {
    return res.status(201).json({
      success: true,
      data: growthModel.createFromConfirmedPlan(req.user.userId, req.body.plan)
    })
  } catch (error) {
    return sendError(res, error)
  }
}
