const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const { body, query } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const { aiLimiter, judgeLimiter } = require('../middleware/rateLimits')
const aiCtrl = require('../controllers/aiController')

// Chat conversation CRUD
router.get('/ai/conversations', authenticateToken, aiCtrl.listConversations)
router.get('/ai/conversations/:id', authenticateToken, aiCtrl.getConversation)
router.delete('/ai/conversations/:id', authenticateToken, aiCtrl.deleteConversation)
router.put('/ai/conversations/:id/title', authenticateToken, aiCtrl.updateTitle)

// Chat with streaming
router.post('/ai/chat', authenticateToken, aiLimiter, aiCtrl.chat)

// Code judge
router.get('/ai/judge/status', authenticateToken, [
  query('language').optional().isIn(['c++', 'java', 'python'])
], handleErrors, aiCtrl.judgeStatus)
router.post('/ai/judge', authenticateToken, judgeLimiter, [
  body('code').isLength({ min: 1, max: 50000 }),
  body('language').isIn(['c++', 'java', 'python']),
  body('exerciseId').isInt()
], handleErrors, aiCtrl.judge)

module.exports = router
