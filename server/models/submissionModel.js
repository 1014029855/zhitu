const { db } = require('../db/connection')

exports.create = ({ title, description, type, authorId, data }) => {
  const dataJson = data ? JSON.stringify(data) : null
  const result = db.prepare('INSERT INTO submissions (title, description, type, author_id, data) VALUES (?, ?, ?, ?, ?)').run(title, description, type, authorId, dataJson)
  return result.lastInsertRowid
}

exports.findByAuthor = (authorId) => {
  return db.prepare('SELECT * FROM submissions WHERE author_id = ? ORDER BY created_at DESC').all(authorId)
}

exports.findPending = () => {
  return db.prepare(`
    SELECT s.*, u.username, u.real_name
    FROM submissions s JOIN users u ON s.author_id = u.id
    WHERE s.status = 'pending' ORDER BY s.created_at DESC
  `).all()
}

exports.findById = (id) => {
  return db.prepare('SELECT * FROM submissions WHERE id = ?').get(id)
}

exports.updateStatus = (id, status, comment) => {
  return db.prepare("UPDATE submissions SET status = ?, review_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, comment || null, id)
}
