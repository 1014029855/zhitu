const rateLimit = require('express-rate-limit')

function createLimiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit: process.env.NODE_ENV === 'test' ? Math.max(limit, 1000) : limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMITED',
        message
      })
    }
  })
}

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: '登录尝试过于频繁，请 15 分钟后再试',
  skipSuccessfulRequests: true
})

const accountLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: '账号操作过于频繁，请稍后再试'
})

const captchaLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: '验证码获取过于频繁，请稍后再试'
})

const aiLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message: 'AI 请求过于频繁，请稍后再试'
})

const judgeLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: '代码提交过于频繁，请稍后再试'
})

const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: '文件上传过于频繁，请稍后再试'
})

module.exports = {
  loginLimiter,
  accountLimiter,
  captchaLimiter,
  aiLimiter,
  judgeLimiter,
  uploadLimiter
}
