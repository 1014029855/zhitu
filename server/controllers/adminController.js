const submissionModel = require('../models/submissionModel')
const { db } = require('../db/connection')

exports.pendingSubmissions = (req, res) => {
  const list = submissionModel.findPending()
  res.json({ success: true, data: list })
}

exports.reviewSubmission = (req, res) => {
  const { id } = req.params
  const { action, comment } = req.body
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: '审核操作无效' })
  }
  const status = action === 'approve' ? 'approved' : 'rejected'
  const result = submissionModel.updateStatus(id, status, comment)
  if (result.changes === 0) return res.status(404).json({ success: false, message: '提交不存在' })

  // 如果是论文且审核通过，写入 papers 表
  if (status === 'approved') {
    const sub = submissionModel.findById(id)
    if (sub && sub.type === 'paper') {
      let meta = {}
      try { meta = JSON.parse(sub.data || '{}') } catch {}

      const existing = db.prepare('SELECT id FROM papers WHERE title = ?').get(sub.title)
      if (!existing) {
        db.prepare(`
          INSERT INTO papers (title, authors, abstract, keywords, category, year, source, pdf_url, paper_source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local')
        `).run(
          sub.title,
          meta.authors || '',
          sub.description || '',
          meta.keywords || '',
          meta.category || '',
          meta.year || new Date().getFullYear(),
          meta.source || '',
          meta.pdfPath || null
        )
      }
    }
  }

  res.json({ success: true, message: status === 'approved' ? '内容已通过审核' : '内容已拒绝' })
}
