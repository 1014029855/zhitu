const { db } = require('../db/connection')

exports.findAll = ({ page, pageSize, category }) => {
  const where = category && category !== 'all' ? 'WHERE category = ?' : ''
  const params = category && category !== 'all' ? [category] : []
  const count = db.prepare(`SELECT COUNT(*) as count FROM papers ${where}`).get(...params).count
  const list = db.prepare(`SELECT * FROM papers ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize)
  return { list, total: count, page, pageSize }
}

exports.search = (keyword, category) => {
  const k = `%${keyword}%`
  if (category && category !== 'all') {
    return db.prepare('SELECT * FROM papers WHERE (title LIKE ? OR abstract LIKE ? OR authors LIKE ?) AND category = ? ORDER BY id DESC').all(k, k, k, category)
  }
  return db.prepare('SELECT * FROM papers WHERE title LIKE ? OR abstract LIKE ? OR authors LIKE ? ORDER BY id DESC').all(k, k, k)
}

exports.findById = (id) => {
  return db.prepare('SELECT * FROM papers WHERE id = ?').get(id)
}

exports.categories = () => {
  return db.prepare('SELECT DISTINCT category FROM papers').all().map(r => ({ name: r.category, value: r.category }))
}
