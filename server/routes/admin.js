const router = require('express').Router()
const { authenticateToken, requireRole } = require('../middleware/auth')
const { body } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const ctrl = require('../controllers/adminController')

router.use(authenticateToken)
router.use(requireRole('admin'))

router.get('/submissions', ctrl.pendingSubmissions)
router.put('/submissions/:id', [
  body('action').isIn(['approve', 'reject'])
], handleErrors, ctrl.reviewSubmission)

module.exports = router
