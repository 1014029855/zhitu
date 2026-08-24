const router = require('express').Router()
const { authenticateToken, requireRole } = require('../middleware/auth')
const { body } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const { uploadLimiter } = require('../middleware/rateLimits')
const multer = require('multer')
const path = require('path')
const ctrl = require('../controllers/teacherController')

// Multer for paper PDF
const pdfStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/papers'),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.pdf'
    cb(null, safeName)
  }
})
const upload = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 20 },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf'
    cb(null, isPdf)
  }
})

router.use(authenticateToken)
router.use(requireRole('teacher', 'admin'))

router.post('/submissions', uploadLimiter, upload.single('pdf'), [
  body('title').isLength({ min: 2, max: 200 }),
  body('description').isLength({ min: 10 }),
  body('type').isIn(['competition', 'skill', 'paper'])
], handleErrors, ctrl.createSubmission)

router.get('/submissions', ctrl.mySubmissions)

module.exports = router
