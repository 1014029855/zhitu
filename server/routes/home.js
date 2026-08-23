const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const ctrl = require('../controllers/homeController')
router.use(authenticateToken)
router.get('/carousel', ctrl.carousel)
router.get('/recommendations', ctrl.recommendations)
router.get('/statistics', ctrl.statistics)
module.exports = router
