const router = require('express').Router()
const { authenticateToken, requireRole } = require('../middleware/auth')
const { body } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const ctrl = require('../controllers/adminController')
const learningCtrl = require('../controllers/learningController')

router.use(authenticateToken)
router.use(requireRole('admin'))

router.get('/submissions', ctrl.pendingSubmissions)
router.put('/submissions/:id', [
  body('action').isIn(['approve', 'reject'])
], handleErrors, ctrl.reviewSubmission)
router.get('/courses/:id/studio', learningCtrl.adminStudio)
router.get('/course-lessons/:lessonId', learningCtrl.adminLesson)
router.put('/course-lessons/:lessonId', learningCtrl.saveAdminLesson)
router.post('/courses/:id/modules', learningCtrl.createModule)
router.post('/course-modules/:moduleId/lessons', learningCtrl.createLesson)
router.put('/courses/:id/status', learningCtrl.publishCourse)

module.exports = router
