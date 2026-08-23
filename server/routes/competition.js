const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const ctrl = require('../controllers/competitionController')
router.use(authenticateToken)
router.get('/competitions', ctrl.list)
router.get('/competitions/categories', ctrl.categories)
router.post('/competitions/search', ctrl.search)
router.get('/competitions/:id', ctrl.detail)
module.exports = router
