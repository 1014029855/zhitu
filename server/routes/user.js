const router = require('express').Router()
const { authenticateToken } = require('../middleware/auth')
const { body } = require('express-validator')
const { handleErrors } = require('../middleware/validate')
const multer = require('multer')
const path = require('path')
const ctrl = require('../controllers/userController')

// Multer config for avatar
const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${req.user.userId}-${Date.now()}${ext}`)
  }
})
const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i
    cb(null, allowed.test(path.extname(file.originalname)))
  }
})

router.get('/profile', authenticateToken, ctrl.profile)
router.put('/profile', authenticateToken, [
  body('realName').optional().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail(),
  body('phone').optional().isMobilePhone('zh-CN'),
  body('bio').optional().isLength({ max: 500 })
], handleErrors, ctrl.updateProfile)

router.get('/submissions', authenticateToken, ctrl.submissions)

router.put('/password', authenticateToken, [
  body('oldPassword').notEmpty().withMessage('请输入原密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
], handleErrors, ctrl.changePassword)

router.post('/avatar', authenticateToken, upload.single('avatar'), ctrl.uploadAvatar)

module.exports = router
