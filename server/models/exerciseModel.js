const { db } = require('../db/connection')

exports.findAll = ({ difficulty, category, language, page = 1, pageSize = 20 }) => {
  const conditions = ["status = 'approved'"]
  const params = []
  if (difficulty && difficulty !== 'all') { conditions.push('difficulty = ?'); params.push(difficulty) }
  if (category && category !== 'all') { conditions.push('category = ?'); params.push(category) }
  if (language && language !== 'all') { conditions.push("(language = ? OR language = 'all')"); params.push(language) }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const count = db.prepare(`SELECT COUNT(*) as count FROM exercises ${where}`).get(...params).count
  const list = db.prepare(`SELECT id, title, difficulty, category, language, created_at FROM exercises ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize)
  return { list, total: count, page, pageSize }
}

exports.findById = (id) => {
  return db.prepare('SELECT * FROM exercises WHERE id = ?').get(id)
}

exports.create = ({ title, description, difficulty, category, language, templateCode, testCases, solutionCode, hint, createdBy }) => {
  const result = db.prepare(`
    INSERT INTO exercises (title, description, difficulty, category, language, template_code, test_cases, solution_code, hint, created_by_user_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `).run(title, description, difficulty, category, language, templateCode || '', JSON.stringify(testCases), solutionCode || '', hint || '', createdBy)
  return result.lastInsertRowid
}

exports.createPending = ({ title, description, difficulty, category, language, templateCode, testCases, solutionCode, hint, createdBy }) => {
  const result = db.prepare(`
    INSERT INTO exercises (title, description, difficulty, category, language, template_code, test_cases, solution_code, hint, created_by_user_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(title, description, difficulty, category, language, templateCode || '', JSON.stringify(testCases), solutionCode || '', hint || '', createdBy)
  return result.lastInsertRowid
}

exports.updateStatus = (id, status) => {
  return db.prepare('UPDATE exercises SET status = ? WHERE id = ?').run(status, id)
}

exports.categories = () => {
  return db.prepare("SELECT DISTINCT category FROM exercises WHERE status = 'approved'").all().map(r => r.category)
}
