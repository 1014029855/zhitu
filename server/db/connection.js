const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

const defaultDbPath = path.join(__dirname, '..', '..', 'data', 'platform.db')
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath
const dbDir = path.dirname(DB_PATH)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const isNew = !fs.existsSync(DB_PATH)

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

module.exports = { db, isNew }
