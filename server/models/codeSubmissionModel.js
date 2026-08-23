const { db } = require('../db/connection')

exports.create = ({ exerciseId, userId, code, language, status, executionResult, aiFeedback }) => {
  const result = db.prepare(`
    INSERT INTO code_submissions (exercise_id, user_id, code, language, status, execution_result, ai_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(exerciseId, userId, code, language, status, JSON.stringify(executionResult), aiFeedback)
  return result.lastInsertRowid
}

exports.findByUser = (userId, page = 1, pageSize = 20) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM code_submissions WHERE user_id = ?').get(userId).count
  const list = db.prepare(`
    SELECT s.*, e.title as exercise_title
    FROM code_submissions s LEFT JOIN exercises e ON s.exercise_id = e.id
    WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT ? OFFSET ?
  `).all(userId, pageSize, (page - 1) * pageSize)
  return { list, total: count, page, pageSize }
}

exports.findByExercise = (exerciseId, userId) => {
  return db.prepare(`
    SELECT * FROM code_submissions WHERE exercise_id = ? AND user_id = ? ORDER BY created_at DESC
  `).all(exerciseId, userId)
}
