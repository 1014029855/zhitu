const userModel = require('../models/userModel')
const bcrypt = require('bcryptjs')
const { db } = require('../db/connection')

exports.profile = (req, res) => {
  const user = userModel.findById(req.user.userId)
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' })
  res.json({ success: true, data: user })
}

exports.updateProfile = (req, res) => {
  const result = userModel.updateProfile(req.user.userId, req.body)
  if (result.changes === 0) return res.status(404).json({ success: false, message: '用户不存在' })
  res.json({ success: true, message: '个人信息更新成功' })
}

// 获取当前用户的刷题提交记录
exports.submissions = (req, res) => {
  const p = Math.max(1, (+req.query.page || 1))
  const ps = Math.min(100, Math.max(1, (+req.query.pageSize || 20)))
  const offset = (p - 1) * ps

  const count = db.prepare(
    'SELECT COUNT(*) as count FROM code_submissions WHERE user_id = ?'
  ).get(req.user.userId).count

  const list = db.prepare(`
    SELECT s.*, e.title as exercise_title
    FROM code_submissions s
    LEFT JOIN exercises e ON s.exercise_id = e.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.userId, ps, offset)

  res.json({
    success: true,
    data: { list, total: count, page: p, pageSize: ps }
  })
}

// PUT /api/user/password — 修改密码
exports.changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId)
  if (!user) return res.status(404).json({ success: false, message: '用户不存在' })

  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(400).json({ success: false, message: '原密码错误' })
  }

  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.user.userId)

  res.json({ success: true, message: '密码修改成功' })
}

// POST /api/user/avatar — 上传头像
exports.uploadAvatar = (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请选择头像文件' })

  const avatarPath = `/uploads/${req.file.filename}`
  db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarPath, req.user.userId)

  res.json({ success: true, message: '头像上传成功', data: { avatarUrl: avatarPath } })
}
