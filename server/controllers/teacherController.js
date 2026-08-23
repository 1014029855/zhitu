const submissionModel = require('../models/submissionModel')

exports.createSubmission = (req, res) => {
  const { title, description, type, authors, keywords, category, year } = req.body
  if (!['competition', 'skill', 'paper'].includes(type)) {
    return res.status(400).json({ success: false, message: '内容类型无效' })
  }

  let meta = {}
  let pdfPath = null

  if (type === 'paper') {
    meta = { authors: authors || '', keywords: keywords || '', category: category || '', year: year ? +year : null, source: '' }
    // PDF 上传处理
    if (req.file) {
      pdfPath = '/uploads/papers/' + req.file.filename
    }
  }

  const id = submissionModel.create({
    title,
    description,
    type,
    authorId: req.user.userId,
    data: type === 'paper' ? { ...meta, pdfPath } : null
  })

  res.json({ success: true, message: '提交成功，等待审核', data: { id } })
}

exports.mySubmissions = (req, res) => {
  const list = submissionModel.findByAuthor(req.user.userId)
  res.json({ success: true, data: list })
}
