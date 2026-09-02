const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const ctrl = require('../controllers/learningController')

router.use(authenticateToken)
router.get('/learning/dashboard', ctrl.dashboard)
router.get('/skills/:id/learning', ctrl.courseOverview)
router.post('/skills/:id/enroll', ctrl.enroll)
router.get('/skills/:courseId/lessons/:lessonId', ctrl.lesson)
router.post('/learning/activities/:activityId/attempts', ctrl.submitAttempt)
router.put('/learning/lessons/:lessonId/note', ctrl.saveLessonNote)
router.post('/skills/:courseId/lessons/:lessonId/complete', ctrl.completeLesson)

module.exports = router
