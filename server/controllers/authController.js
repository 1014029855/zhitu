const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const svgCaptcha = require('svg-captcha')
const { db } = require('../db/connection')
const { getJwtSecret } = require('../config/auth')
const userModel = require('../models/userModel')

const CAPTCHA_TTL = 5 * 60 * 1000
const RESET_TOKEN_TTL = 15 * 60 * 1000
const CAPTCHA_PURPOSES = new Set(['login', 'register', 'reset'])

function getCaptchaStore() {
  if (!global.captchaStore) global.captchaStore = {}
  return global.captchaStore
}

function cleanExpiredCaptchas() {
  const store = getCaptchaStore()
  for (const [key, value] of Object.entries(store)) {
    if (!value || value.expires < Date.now()) {
      delete store[key]
    }
  }
}

function validateCaptcha(captchaId, captcha, purpose) {
  cleanExpiredCaptchas()
  const store = getCaptchaStore()
  const record = store[captchaId]

  if (!captchaId || !captcha || !record) {
    return '请先获取验证码'
  }

  if (record.expires < Date.now()) {
    delete store[captchaId]
    return '验证码已过期，请刷新后重试'
  }

  if (record.purpose !== purpose) {
    delete store[captchaId]
    return '验证码用途不匹配，请刷新后重试'
  }

  if (record.text !== String(captcha).trim().toLowerCase()) {
    delete store[captchaId]
    return '验证码错误，请重新输入'
  }

  delete store[captchaId]
  return null
}

exports.register = (req, res) => {
  const {
    username,
    password,
    realName,
    email,
    studentId,
    accountType = 'student',
    captchaId,
    captcha
  } = req.body

  const captchaError = validateCaptcha(captchaId, captcha, 'register')
  if (captchaError) {
    return res.status(400).json({ success: false, message: captchaError })
  }

  if (userModel.findByUsername(username)) {
    return res.status(400).json({ success: false, message: '用户名已存在' })
  }

  if (userModel.findByEmail(email)) {
    return res.status(400).json({ success: false, message: '邮箱已存在' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const userId = userModel.create({
    username,
    email,
    passwordHash,
    realName,
    studentId,
    accountType
  })

  res.json({ success: true, message: '注册成功', data: { userId } })
}

exports.login = (req, res) => {
  const { username, password, captchaId, captcha } = req.body
  const captchaError = validateCaptcha(captchaId, captcha, 'login')
  if (captchaError) {
    return res.status(400).json({ success: false, message: captchaError })
  }

  const user = userModel.findByUsername(username)

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' })
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, accountType: user.account_type },
    getJwtSecret(),
    { expiresIn: '7d' }
  )

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        realName: user.real_name,
        studentId: user.student_id,
        accountType: user.account_type,
        avatarUrl: user.avatar_url,
        phone: user.phone,
        bio: user.bio,
        createdAt: user.created_at
      }
    }
  })
}

exports.checkUsername = (req, res) => {
  const { username } = req.params
  const exists = !!userModel.findByUsername(username)

  res.json({
    success: true,
    data: {
      available: !exists,
      message: exists ? '用户名已存在' : '用户名可用'
    }
  })
}

exports.captcha = (req, res) => {
  cleanExpiredCaptchas()

  const purpose = CAPTCHA_PURPOSES.has(req.query.purpose) ? req.query.purpose : 'login'

  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1il',
    noise: 3,
    color: true,
    background: '#f5f5f5',
    width: 128,
    height: 44
  })

  const captchaId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  getCaptchaStore()[captchaId] = {
    text: captcha.text.toLowerCase(),
    purpose,
    expires: Date.now() + CAPTCHA_TTL
  }

  const data = {
    captchaId,
    svg: captcha.data
  }

  if (process.env.NODE_ENV === 'test') {
    data.debugText = captcha.text.toLowerCase()
  }

  res.json({
    success: true,
    data
  })
}

exports.requestPasswordReset = (req, res) => {
  const { identifier, captchaId, captcha } = req.body
  const captchaError = validateCaptcha(captchaId, captcha, 'reset')
  if (captchaError) {
    return res.status(400).json({ success: false, message: captchaError })
  }

  const user = userModel.findByIdentifier(identifier)
  const response = {
    success: true,
    message: '如果账号存在，重置凭证已经生成',
    data: { expiresInMinutes: 15 }
  }

  if (!user) return res.json(response)

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL).toISOString().slice(0, 19).replace('T', ' ')

  const saveToken = db.transaction(() => {
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= CURRENT_TIMESTAMP').run(user.id)
    db.prepare(`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(user.id, tokenHash, expiresAt)
  })
  saveToken()

  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_PASSWORD_RESET === 'true') {
    response.data.resetToken = token
  }

  return res.json(response)
}

exports.resetPassword = (req, res) => {
  const { token, password } = req.body
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const record = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
  `).get(tokenHash)

  if (!record) {
    return res.status(400).json({ success: false, message: '重置凭证无效或已过期' })
  }

  const reset = db.transaction(() => {
    userModel.updatePassword(record.user_id, bcrypt.hashSync(password, 10))
    db.prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(record.id)
  })
  reset()

  return res.json({ success: true, message: '密码已更新，请重新登录', data: null })
}
