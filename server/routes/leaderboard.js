const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const ctrl = require('../controllers/leaderboardController')

router.use(authenticateToken)
router.get('/', ctrl.list)

module.exports = router
