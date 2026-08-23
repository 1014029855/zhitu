require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const compression = require('compression')
const path = require('path')
const { db, isNew } = require('./db/connection')
const createTables = require('./db/schema')
const seedData = require('./db/seed')
const { getJwtSecret } = require('./config/auth')

const app = express()
const PORT = process.env.API_PORT || 1234

getJwtSecret()

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: true, credentials: true }))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
})
app.use('/api/', limiter)

createTables(db)
seedData(db)
try { require('./db/seed-courses') } catch (e) { console.error('Seed courses error:', e.message) }
console.log(isNew ? 'Database initialized with seed data.' : 'Database checked and default accounts are ready.')

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常' })
})

const routeModules = [
  { path: '/api/auth', file: './routes/auth' },
  { path: '/api/home', file: './routes/home' },
  { path: '/api', file: './routes/competition' },
  { path: '/api', file: './routes/skill' },
  { path: '/api', file: './routes/paper' },
  { path: '/api/user', file: './routes/user' },
  { path: '/api/teacher', file: './routes/teacher' },
  { path: '/api/admin', file: './routes/admin' },
  { path: '/api', file: './routes/ai' },
  { path: '/api', file: './routes/exercise' },
  { path: '/api/leaderboard', file: './routes/leaderboard' },
  { path: '/api/growth', file: './routes/growth' }
]

for (const route of routeModules) {
  app.use(route.path, require(route.file))
  console.log(`  Route mounted: ${route.path} -> ${route.file}`)
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

module.exports = app
