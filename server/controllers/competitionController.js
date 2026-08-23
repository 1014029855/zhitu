const competitionModel = require('../models/competitionModel')

exports.list = (req, res) => {
  const { page = 1, pageSize = 10, category = 'all' } = req.query
  const result = competitionModel.findAll({ page: +page, pageSize: +pageSize, category })
  res.json({ success: true, data: result })
}

exports.search = (req, res) => {
  const { keyword, category = 'all' } = req.body
  const list = competitionModel.search(keyword, category)
  res.json({ success: true, data: { list, total: list.length } })
}

exports.detail = (req, res) => {
  const comp = competitionModel.findById(+req.params.id)
  if (!comp) return res.status(404).json({ success: false, message: '竞赛不存在' })
  res.json({ success: true, data: comp })
}

exports.categories = (req, res) => {
  const data = competitionModel.categories()
  res.json({ success: true, data })
}
