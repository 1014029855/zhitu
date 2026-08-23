const { db } = require('../db/connection')

exports.findByUsername = (username) => {
  return db.prepare('SELECT * FROM users WHERE username = ? AND is_active = TRUE').get(username)
}

exports.findByEmail = (email) => {
  return db.prepare('SELECT id FROM users WHERE email = ?').get(email)
}

exports.findByIdentifier = (identifier) => {
  return db.prepare(`
    SELECT * FROM users
    WHERE (username = ? OR email = ?) AND is_active = TRUE
  `).get(identifier, identifier)
}

exports.create = ({ username, email, passwordHash, realName, studentId, accountType }) => {
  const result = db.prepare(`
    INSERT INTO users (username, email, password_hash, real_name, student_id, account_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(username, email, passwordHash, realName, studentId || null, accountType)
  return result.lastInsertRowid
}

exports.findById = (id) => {
  return db.prepare(`SELECT id, username, email, real_name, student_id, account_type, avatar_url, phone, bio, is_active, created_at FROM users WHERE id = ?`).get(id)
}

exports.updateProfile = (id, { realName, email, phone, bio }) => {
  return db.prepare(`
    UPDATE users SET real_name = COALESCE(?, real_name), email = COALESCE(?, email),
    phone = COALESCE(?, phone), bio = COALESCE(?, bio), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(realName || null, email || null, phone || null, bio || null, id)
}

exports.updatePassword = (id, passwordHash) => {
  return db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_active = TRUE
  `).run(passwordHash, id)
}
