const jwt = require('jsonwebtoken')
const { getJwtSecret } = require('../config/auth')

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: '访问令牌缺失' })
  }

  try {
    const user = jwt.verify(token, getJwtSecret())
    req.user = user
    next()
  } catch (err) {
    return res.status(403).json({ success: false, message: '访问令牌无效或已过期' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.accountType)) {
      return res.status(403).json({ success: false, message: '权限不足' })
    }
    next()
  }
}

module.exports = { authenticateToken, requireRole }
