const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const ctrl = require('../controllers/paperController')

router.use(authenticateToken)

router.get('/papers/search/external', ctrl.searchExternal)
router.get('/papers/search/all', ctrl.searchAll)
router.get('/papers/categories', ctrl.categories)
router.get('/papers/:id/download', ctrl.download)
router.get('/papers/:id', ctrl.detail)
router.post('/papers/search', ctrl.search)
router.get('/papers', ctrl.list)

module.exports = router
