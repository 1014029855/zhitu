const router = require('express').Router()
const { authenticateToken, requireRole } = require('../middleware/auth')
const { body } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const aiCtrl = require('../controllers/aiController')
const exerciseCtrl = require('../controllers/exerciseController')

router.use(authenticateToken)

router.get('/exercises', exerciseCtrl.list)
router.get('/exercises/categories', exerciseCtrl.categories)
router.get('/exercises/:id', exerciseCtrl.detail)

// 需要登录的接口
router.post('/ai/judge', [
  body('code').isLength({ min: 1, max: 50000 }),
  body('language').isIn(['c++', 'java', 'python']),
  body('exerciseId').isInt()
], handleErrors, aiCtrl.judge)

// 管理员接口
router.post('/admin/exercises', requireRole('admin'), [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('language').isIn(['c++', 'java', 'python', 'all']),
  body('testCases').isArray({ min: 1 })
], handleErrors, exerciseCtrl.create)

router.post('/admin/exercises/generate', requireRole('admin'), [
  body('topic').notEmpty(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('language').isIn(['c++', 'java', 'python', 'all'])
], handleErrors, exerciseCtrl.generate)

router.put('/admin/exercises/:id/approve', requireRole('admin'), [
  body('action').isIn(['approve', 'reject'])
], handleErrors, exerciseCtrl.approve)

module.exports = router
