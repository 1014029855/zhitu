const { db } = require('../db/connection')

exports.findAll = (category) => {
  if (category && category !== 'all') {
    return db.prepare('SELECT * FROM skills WHERE category = ? ORDER BY id DESC').all(category)
  }
  return db.prepare('SELECT * FROM skills ORDER BY id DESC').all()
}

exports.findById = (id) => {
  const row = db.prepare('SELECT * FROM skills WHERE id = ?').get(id)
  if (row) {
    try { row.chapters = JSON.parse(row.chapters || '[]') } catch { row.chapters = [] }
  }
  return row
}

exports.search = (keyword, category) => {
  const k = `%${keyword}%`
  if (category && category !== 'all') {
    return db.prepare('SELECT * FROM skills WHERE (title LIKE ? OR description LIKE ? OR tags LIKE ?) AND category = ? ORDER BY id DESC').all(k, k, k, category)
  }
  return db.prepare('SELECT * FROM skills WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? ORDER BY id DESC').all(k, k, k)
}

exports.categories = () => {
  return db.prepare('SELECT DISTINCT category FROM skills').all().map(r => ({ name: r.category, value: r.category }))
}
