const { validationResult } = require('express-validator')

function handleErrors(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入格式不正确',
      errors: errors.array()
    })
  }
  next()
}

module.exports = { handleErrors }
