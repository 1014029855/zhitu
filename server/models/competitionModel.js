const { db } = require('../db/connection')

exports.findAll = ({ page, pageSize, category }) => {
  const where = category && category !== 'all' ? 'WHERE category = ?' : ''
  const params = category && category !== 'all' ? [category] : []
  const count = db.prepare(`SELECT COUNT(*) as count FROM competitions ${where}`).get(...params).count
  const list = db.prepare(`SELECT * FROM competitions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize)
  return { list, total: count, page, pageSize }
}

exports.findByCategory = (category) => {
  return db.prepare('SELECT * FROM competitions WHERE category = ? ORDER BY id DESC').all(category)
}

exports.search = (keyword, category) => {
  const k = `%${keyword}%`
  if (category && category !== 'all') {
    return db.prepare('SELECT * FROM competitions WHERE (title LIKE ? OR description LIKE ?) AND category = ? ORDER BY id DESC').all(k, k, category)
  }
  return db.prepare('SELECT * FROM competitions WHERE title LIKE ? OR description LIKE ? ORDER BY id DESC').all(k, k)
}

exports.findById = (id) => {
  return db.prepare('SELECT * FROM competitions WHERE id = ?').get(id)
}

exports.categories = () => {
  return db.prepare('SELECT DISTINCT category FROM competitions').all().map(r => ({ name: r.category, value: r.category }))
}
