const router = require('express').Router()
const { authenticateToken, requireRole } = require('../middleware/auth')
const { body } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const { aiLimiter } = require('../middleware/rateLimits')
const exerciseCtrl = require('../controllers/exerciseController')

router.use(authenticateToken)

router.get('/exercises', exerciseCtrl.list)
router.get('/exercises/categories', exerciseCtrl.categories)
router.get('/exercises/:id', exerciseCtrl.detail)

// 管理员接口
router.post('/admin/exercises', requireRole('admin'), [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('language').isIn(['c++', 'java', 'python', 'all']),
  body('testCases').isArray({ min: 1 })
], handleErrors, exerciseCtrl.create)

router.post('/admin/exercises/generate', requireRole('admin'), aiLimiter, [
  body('topic').notEmpty(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('language').isIn(['c++', 'java', 'python', 'all'])
], handleErrors, exerciseCtrl.generate)

router.put('/admin/exercises/:id/approve', requireRole('admin'), [
  body('action').isIn(['approve', 'reject'])
], handleErrors, exerciseCtrl.approve)

module.exports = router
