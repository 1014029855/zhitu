const skillModel = require('../models/skillModel')
const growthModel = require('../models/growthModel')

exports.list = (req, res) => {
  const { category = 'all' } = req.query
  const data = skillModel.findAll(category)
  res.json({ success: true, data })
}

exports.search = (req, res) => {
  const { keyword, category = 'all' } = req.body
  const list = skillModel.search(keyword, category)
  res.json({ success: true, data: { list, total: list.length } })
}

exports.detail = (req, res) => {
  const skill = skillModel.findById(+req.params.id)
  if (!skill) return res.status(404).json({ success: false, message: '技能不存在' })
  res.json({ success: true, data: skill })
}

exports.categories = (req, res) => {
  const data = skillModel.categories()
  res.json({ success: true, data })
}

// Skill progress
exports.getProgress = (req, res) => {
  const { db } = require('../db/connection')
  const progress = db.prepare('SELECT * FROM skill_progress WHERE user_id = ? AND skill_id = ?').all(req.user.userId, +req.params.id)
  res.json({ success: true, data: { progress } })
}

exports.saveProgress = (req, res) => {
  const { db } = require('../db/connection')
  const { skillId, chapterOrder, completed, notes } = req.body
  db.prepare(`INSERT OR REPLACE INTO skill_progress (user_id, skill_id, chapter_order, completed, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .run(req.user.userId, skillId, chapterOrder, completed || 0, notes || '')

  let completedTasks = 0
  if (completed) {
    completedTasks += growthModel.completeMatchingTasks(req.user.userId, 'skill', skillId, `chapter:${chapterOrder}`)
    const skill = skillModel.findById(skillId)
    const completedChapters = db.prepare(`
      SELECT COUNT(*) AS count FROM skill_progress
      WHERE user_id = ? AND skill_id = ? AND completed = 1
    `).get(req.user.userId, skillId).count
    if (skill?.chapters?.length && completedChapters >= skill.chapters.length) {
      completedTasks += growthModel.completeMatchingTasks(req.user.userId, 'skill', skillId)
    }
  }

  res.json({ success: true, message: '已保存', data: { completedTasks } })
}
