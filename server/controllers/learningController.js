const learningModel = require('../models/learningModel')
const growthModel = require('../models/growthModel')

function positiveId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

exports.dashboard = (req, res) => {
  res.json({ success: true, data: learningModel.getLearningDashboard(req.user.userId) })
}

exports.courseOverview = (req, res) => {
  const skillId = positiveId(req.params.id)
  if (!skillId) return res.status(400).json({ success: false, message: '课程编号无效' })
  const course = learningModel.getCourseOverview(skillId, req.user.userId)
  if (!course) return res.status(404).json({ success: false, message: '课程不存在或尚未发布' })
  res.json({ success: true, data: course })
}

exports.enroll = (req, res) => {
  const skillId = positiveId(req.params.id)
  if (!skillId) return res.status(400).json({ success: false, message: '课程编号无效' })
  const enrollment = learningModel.enroll(req.user.userId, skillId)
  if (!enrollment) return res.status(404).json({ success: false, message: '课程不存在' })
  res.status(201).json({ success: true, data: enrollment, message: '已加入课程' })
}

exports.lesson = (req, res) => {
  const skillId = positiveId(req.params.courseId)
  const lessonId = positiveId(req.params.lessonId)
  if (!skillId || !lessonId) return res.status(400).json({ success: false, message: '课时编号无效' })
  const lesson = learningModel.getLesson(req.user.userId, skillId, lessonId)
  if (!lesson) return res.status(404).json({ success: false, message: '课时不存在或尚未发布' })
  res.json({ success: true, data: lesson })
}

exports.submitAttempt = (req, res) => {
  const activityId = positiveId(req.params.activityId)
  if (!activityId) return res.status(400).json({ success: false, message: '活动编号无效' })
  if (!Object.prototype.hasOwnProperty.call(req.body, 'answer')) {
    return res.status(400).json({ success: false, message: '请先完成作答' })
  }
  if (JSON.stringify(req.body.answer).length > 64000) {
    return res.status(413).json({ success: false, message: '作答内容过长' })
  }
  const result = learningModel.submitAttempt(req.user.userId, activityId, req.body.answer)
  if (!result) return res.status(404).json({ success: false, message: '学习活动不存在' })
  res.status(201).json({ success: true, data: result })
}

exports.saveLessonNote = (req, res) => {
  const lessonId = positiveId(req.params.lessonId)
  if (!lessonId) return res.status(400).json({ success: false, message: '课时编号无效' })
  const note = learningModel.saveLessonNote(req.user.userId, lessonId, req.body || {})
  if (!note) return res.status(404).json({ success: false, message: '课时不存在' })
  res.json({ success: true, data: note, message: '学习记录已保存' })
}

exports.completeLesson = (req, res) => {
  const skillId = positiveId(req.params.courseId)
  const lessonId = positiveId(req.params.lessonId)
  if (!skillId || !lessonId) return res.status(400).json({ success: false, message: '课时编号无效' })
  const result = learningModel.completeLesson(req.user.userId, skillId, lessonId)
  if (!result) return res.status(404).json({ success: false, message: '课时不存在' })
  if (result.blocked) {
    return res.status(409).json({
      success: false,
      message: `还有 ${result.missingActivities} 个必做活动未通过`,
      data: result
    })
  }
  const lesson = learningModel.getCourseOverview(skillId, req.user.userId)
  const completedTasks = growthModel.completeMatchingTasks(
    req.user.userId,
    'skill',
    skillId,
    `lesson:${lessonId}`
  )
  res.json({ success: true, data: { ...result, completedTasks }, message: '课时已完成' })
}

exports.adminStudio = (req, res) => {
  const skillId = positiveId(req.params.id)
  if (!skillId) return res.status(400).json({ success: false, message: '课程编号无效' })
  const studio = learningModel.getAdminStudio(skillId, req.user.userId)
  if (!studio) return res.status(404).json({ success: false, message: '课程不存在' })
  res.json({ success: true, data: studio })
}

exports.adminLesson = (req, res) => {
  const lessonId = positiveId(req.params.lessonId)
  if (!lessonId) return res.status(400).json({ success: false, message: '课时编号无效' })
  const lesson = learningModel.getAdminLesson(lessonId)
  if (!lesson) return res.status(404).json({ success: false, message: '课时不存在' })
  res.json({ success: true, data: lesson })
}

exports.saveAdminLesson = (req, res) => {
  const lessonId = positiveId(req.params.lessonId)
  if (!lessonId) return res.status(400).json({ success: false, message: '课时编号无效' })
  const lesson = learningModel.saveAdminLesson(lessonId, req.body || {}, req.user.userId)
  if (!lesson) return res.status(404).json({ success: false, message: '课时不存在' })
  res.json({ success: true, data: lesson, message: '课时已保存并生成版本记录' })
}

exports.createModule = (req, res) => {
  const skillId = positiveId(req.params.id)
  if (!skillId) return res.status(400).json({ success: false, message: '课程编号无效' })
  const module = learningModel.createModule(skillId, req.body.title)
  if (!module) return res.status(404).json({ success: false, message: '课程不存在' })
  res.status(201).json({ success: true, data: module, message: '单元已创建' })
}

exports.createLesson = (req, res) => {
  const moduleId = positiveId(req.params.moduleId)
  if (!moduleId) return res.status(400).json({ success: false, message: '单元编号无效' })
  const lesson = learningModel.createLesson(moduleId, req.body.title)
  if (!lesson) return res.status(404).json({ success: false, message: '单元不存在' })
  res.status(201).json({ success: true, data: lesson, message: '课时已创建' })
}

exports.publishCourse = (req, res) => {
  const skillId = positiveId(req.params.id)
  const status = req.body.status
  if (!skillId || !['draft', 'published'].includes(status)) {
    return res.status(400).json({ success: false, message: '发布参数无效' })
  }
  const course = learningModel.publishCourse(skillId, status, req.user.userId, req.body.note)
  if (!course) return res.status(404).json({ success: false, message: '课程不存在' })
  res.json({
    success: true,
    data: course,
    message: status === 'published' ? '课程已发布' : '课程已转为草稿'
  })
}
