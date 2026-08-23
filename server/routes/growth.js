const router = require('express').Router()
const { body, param, query } = require('express-validator')
const { authenticateToken } = require('../middleware/auth')
const { handleErrors } = require('../middleware/validate')
const ctrl = require('../controllers/growthController')

const contentTypes = ['competition', 'skill', 'exercise', 'paper']
const taskStatuses = ['todo', 'in_progress', 'done']
const goalStatuses = ['active', 'paused', 'completed', 'archived']

router.use(authenticateToken)

router.get('/dashboard', ctrl.dashboard)
router.get('/goals', query('status').optional().isIn(goalStatuses), handleErrors, ctrl.listGoals)
router.get('/goals/:id', param('id').isInt({ min: 1 }), handleErrors, ctrl.getGoal)
router.post('/goals', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 5000 }),
  body('targetDate').optional({ nullable: true }).isISO8601(),
  body('sourceType').optional().isIn(['competition', 'skill', 'paper', 'custom']),
  body('milestones').optional().isArray({ max: 20 }),
  body('tasks').optional().isArray({ max: 100 })
], handleErrors, ctrl.createGoal)
router.post('/goals/from-competition/:competitionId', param('competitionId').isInt({ min: 1 }), handleErrors, ctrl.createFromCompetition)
router.put('/goals/:id', [
  param('id').isInt({ min: 1 }),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 5000 }),
  body('targetDate').optional({ nullable: true }).isISO8601(),
  body('status').optional().isIn(goalStatuses)
], handleErrors, ctrl.updateGoal)
router.post('/goals/:id/tasks', [
  param('id').isInt({ min: 1 }),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('contentType').optional().isIn([...contentTypes, 'custom']),
  body('contentId').optional({ nullable: true }).isInt({ min: 1 }),
  body('priority').optional().isInt({ min: 1, max: 3 }),
  body('dueDate').optional({ nullable: true }).isISO8601()
], handleErrors, ctrl.addTask)
router.put('/goals/:goalId/tasks/:taskId', [
  param('goalId').isInt({ min: 1 }),
  param('taskId').isInt({ min: 1 }),
  body('status').optional().isIn(taskStatuses),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('priority').optional().isInt({ min: 1, max: 3 }),
  body('dueDate').optional({ nullable: true }).isISO8601()
], handleErrors, ctrl.updateTask)

router.get('/bookmarks', query('contentType').optional().isIn(contentTypes), handleErrors, ctrl.listBookmarks)
router.post('/bookmarks', [
  body('contentType').isIn(contentTypes),
  body('contentId').isInt({ min: 1 })
], handleErrors, ctrl.addBookmark)
router.delete('/bookmarks/:contentType/:contentId', [
  param('contentType').isIn(contentTypes),
  param('contentId').isInt({ min: 1 })
], handleErrors, ctrl.removeBookmark)

router.get('/competitions/:competitionId/participation', param('competitionId').isInt({ min: 1 }), handleErrors, ctrl.getParticipation)
router.put('/competitions/:competitionId/participation', [
  param('competitionId').isInt({ min: 1 }),
  body('status').isIn(['interested', 'preparing', 'registered', 'submitted', 'completed', 'withdrawn']),
  body('teamName').optional().isLength({ max: 120 }),
  body('notes').optional().isLength({ max: 5000 })
], handleErrors, ctrl.upsertParticipation)

router.get('/paper-library', query('status').optional().isIn(['to_read', 'reading', 'read']), handleErrors, ctrl.listPaperLibrary)
router.put('/papers/:paperId/library', [
  param('paperId').isInt({ min: 1 }),
  body('status').isIn(['to_read', 'reading', 'read']),
  body('notes').optional().isLength({ max: 10000 }),
  body('tags').optional().isArray({ max: 20 })
], handleErrors, ctrl.upsertPaperLibrary)

router.get('/exercise-reviews', query('status').optional().isIn(['review', 'mastered']), handleErrors, ctrl.listExerciseReviews)
router.get('/achievements', ctrl.listAchievements)
router.post('/achievements', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('type').optional().isIn(['project', 'competition', 'paper', 'code', 'certificate', 'reflection']),
  body('description').optional().isLength({ max: 5000 }),
  body('evidenceUrl').optional().isURL({ require_protocol: true }),
  body('goalId').optional({ nullable: true }).isInt({ min: 1 }),
  body('isPublic').optional().isBoolean()
], handleErrors, ctrl.createAchievement)

router.post('/ai/competition-plan/:competitionId', param('competitionId').isInt({ min: 1 }), handleErrors, ctrl.previewCompetitionPlan)
router.post('/ai/confirm-plan', [
  body('plan').isObject(),
  body('plan.title').trim().isLength({ min: 1, max: 200 }),
  body('plan.description').optional().isLength({ max: 5000 }),
  body('plan.targetDate').optional({ nullable: true }).isISO8601(),
  body('plan.sourceType').optional().isIn(['competition', 'skill', 'paper', 'custom']),
  body('plan.milestones').isArray({ min: 1, max: 20 }),
  body('plan.milestones.*.title').trim().isLength({ min: 1, max: 200 }),
  body('plan.milestones.*.tasks').isArray({ max: 50 }),
  body('plan.milestones.*.tasks.*.title').trim().isLength({ min: 1, max: 200 })
], handleErrors, ctrl.confirmPlan)

module.exports = router
