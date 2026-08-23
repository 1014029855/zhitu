const router = require('express').Router()
const { body } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const ctrl = require('../controllers/authController')

router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('realName').isLength({ min: 2, max: 50 }),
  body('accountType').optional().isIn(['student', 'teacher']),
  body('captchaId').notEmpty(),
  body('captcha').isLength({ min: 4, max: 4 })
], handleErrors, ctrl.register)

router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty(),
  body('captchaId').notEmpty(),
  body('captcha').isLength({ min: 4, max: 4 })
], handleErrors, ctrl.login)

router.post('/password-reset/request', [
  body('identifier').trim().notEmpty(),
  body('captchaId').notEmpty(),
  body('captcha').isLength({ min: 4, max: 4 })
], handleErrors, ctrl.requestPasswordReset)

router.post('/password-reset/confirm', [
  body('token').isLength({ min: 32, max: 128 }),
  body('password').isLength({ min: 6, max: 128 })
], handleErrors, ctrl.resetPassword)

router.get('/captcha', ctrl.captcha)
router.get('/check-username/:username', ctrl.checkUsername)

module.exports = router
