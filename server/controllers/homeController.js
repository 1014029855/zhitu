const { db } = require('../db/connection')
const competitionModel = require('../models/competitionModel')
const skillModel = require('../models/skillModel')
const paperModel = require('../models/paperModel')
const carouselModel = require('../models/carouselModel')

exports.carousel = (req, res) => {
  const data = carouselModel.findAllActive()
  res.json({ success: true, data })
}

exports.recommendations = (req, res) => {
  const { type, limit = 6 } = req.query
  const n = parseInt(limit)
  let data = []
  if (type === 'competition') {
    data = competitionModel.findAll({ page: 1, pageSize: n, category: 'all' }).list
  } else if (type === 'skill') {
    data = skillModel.findAll('all').slice(0, n)
  } else if (type === 'paper') {
    data = paperModel.findAll({ page: 1, pageSize: n, category: 'all' }).list
  } else {
    const comps = competitionModel.findAll({ page: 1, pageSize: 2, category: 'all' }).list
    const skills = skillModel.findAll('all').slice(0, 2)
    const papers = paperModel.findAll({ page: 1, pageSize: 2, category: 'all' }).list
    data = [...comps, ...skills, ...papers].slice(0, n)
  }
  res.json({ success: true, data })
}

exports.statistics = (req, res) => {
  const totalCompetitions = db.prepare('SELECT COUNT(*) as count FROM competitions').get().count
  const totalSkills = db.prepare('SELECT COUNT(*) as count FROM skills').get().count
  const totalPapers = db.prepare('SELECT COUNT(*) as count FROM papers').get().count
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE').get().count

  res.json({ success: true, data: { totalUsers, totalContent: totalCompetitions + totalSkills + totalPapers, totalCompetitions, totalSkills, totalPapers } })
}
