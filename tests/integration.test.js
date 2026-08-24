const test = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const net = require('node:net')
const os = require('node:os')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
let child
let baseUrl
let tempDir
let port

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(error => error ? reject(error) : resolve(port))
    })
  })
}

async function api(url, options = {}) {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  })
  const json = await response.json()
  return { status: response.status, json }
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

async function getCaptcha(purpose) {
  const result = await api(`/api/auth/captcha?purpose=${purpose}`)
  assert.equal(result.status, 200)
  assert.ok(result.json.data.captchaId)
  assert.equal(result.json.data.debugText.length, 4)
  return result.json.data
}

async function login(username, password) {
  const captcha = await getCaptcha('login')
  const result = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      captchaId: captcha.captchaId,
      captcha: captcha.debugText
    })
  })
  assert.equal(result.status, 200, JSON.stringify(result.json))
  assert.equal(result.json.success, true)
  return result.json.data
}

async function waitForServer() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30000) {
    if (child.exitCode !== null) throw new Error(`Server exited early with code ${child.exitCode}`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  throw new Error('Timed out waiting for API server')
}

async function startServer() {
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      API_PORT: String(port),
      DB_PATH: path.join(tempDir, 'platform.db'),
      NODE_ENV: 'test',
      JWT_SECRET: 'integration-test-secret',
      DEEPSEEK_API_KEY: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  await waitForServer()
}

async function stopServer() {
  if (!child || child.exitCode !== null) return
  child.kill()
  await new Promise(resolve => child.once('exit', resolve))
}

test.before(async () => {
  port = await getFreePort()
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-platform-test-'))
  baseUrl = `http://127.0.0.1:${port}`
  await startServer()
})

test.after(async () => {
  await stopServer()
  if (tempDir && path.basename(tempDir).startsWith('knowledge-platform-test-')) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('authentication and growth loop work end to end', async () => {
  const anonymous = await api('/api/competitions')
  assert.equal(anonymous.status, 401)

  const student = await login('student1', '123123123')
  assert.equal(student.user.accountType, 'student')
  const token = student.token
  const headers = authHeaders(token)

  const judgeStatus = await api('/api/ai/judge/status', { headers })
  assert.equal(judgeStatus.status, 200)
  assert.equal(judgeStatus.json.data.available, false)

  const markerPath = path.join(tempDir, 'unsafe-code-ran.txt')
  const unsafeSubmission = await api('/api/ai/judge', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      exerciseId: 1,
      language: 'python',
      code: `from pathlib import Path\nPath(r'${markerPath.replace(/\\/g, '\\\\')}').write_text('executed')`
    })
  })
  assert.equal(unsafeSubmission.status, 503)
  assert.equal(unsafeSubmission.json.code, 'CODE_EXECUTION_UNAVAILABLE')
  assert.equal(fs.existsSync(markerPath), false)

  const admin = await login('lufuping', 'lu1203')
  assert.equal(admin.user.accountType, 'admin')

  const registerCaptcha = await getCaptcha('register')
  const registration = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: 'newstudent',
      email: 'newstudent@example.com',
      password: 'register-test-password',
      realName: '测试学生',
      studentId: 'T2026001',
      accountType: 'student',
      captchaId: registerCaptcha.captchaId,
      captcha: registerCaptcha.debugText
    })
  })
  assert.equal(registration.status, 200, JSON.stringify(registration.json))
  const registeredUser = await login('newstudent', 'register-test-password')
  assert.equal(registeredUser.user.realName, '测试学生')

  const createdGoal = await api('/api/growth/goals/from-competition/1', {
    method: 'POST', headers
  })
  assert.equal(createdGoal.status, 201, JSON.stringify(createdGoal.json))
  assert.equal(createdGoal.json.data.source_type, 'competition')
  assert.equal(createdGoal.json.data.tasks.length, 5)

  const preparing = await api('/api/growth/competitions/1/participation', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'preparing', teamName: '测试队', notes: '明确分工' })
  })
  assert.equal(preparing.status, 200)
  assert.equal(preparing.json.data.status, 'preparing')

  const registered = await api('/api/growth/competitions/1/participation', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'registered', teamName: '测试队', notes: '报名完成' })
  })
  assert.equal(registered.status, 200)

  const goalAfterParticipation = await api(`/api/growth/goals/${createdGoal.json.data.id}`, { headers })
  assert.equal(goalAfterParticipation.status, 200)
  assert.equal(goalAfterParticipation.json.data.completed_task_count, 2)

  const bookmark = await api('/api/growth/bookmarks', {
    method: 'POST',
    headers,
    body: JSON.stringify({ contentType: 'competition', contentId: 1 })
  })
  assert.equal(bookmark.status, 201)
  const bookmarks = await api('/api/growth/bookmarks?contentType=competition', { headers })
  assert.equal(bookmarks.json.data.length, 1)

  const paper = await api('/api/growth/papers/1/library', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'read', notes: '核心结论已整理', tags: ['代码生成'] })
  })
  assert.equal(paper.status, 200)
  assert.equal(paper.json.data.status, 'read')

  const customGoal = await api('/api/growth/goals', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: '完成一次小练习',
      targetDate: '2026-09-01',
      tasks: [{ title: '提交练习结果', contentType: 'exercise', contentId: 1, priority: 1 }]
    })
  })
  assert.equal(customGoal.status, 201, JSON.stringify(customGoal.json))
  const task = customGoal.json.data.tasks[0]
  const completedTask = await api(`/api/growth/goals/${customGoal.json.data.id}/tasks/${task.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'done' })
  })
  assert.equal(completedTask.status, 200)
  const completedGoal = await api(`/api/growth/goals/${customGoal.json.data.id}`, { headers })
  assert.equal(completedGoal.json.data.status, 'completed')

  const achievements = await api('/api/growth/achievements', { headers })
  assert.ok(achievements.json.data.some(item => item.goal_id === customGoal.json.data.id))

  const preview = await api('/api/growth/ai/competition-plan/2', { method: 'POST', headers })
  assert.equal(preview.status, 200)
  assert.equal(preview.json.data.persisted, false)
  assert.equal(preview.json.data.source, 'template')
  const confirmed = await api('/api/growth/ai/confirm-plan', {
    method: 'POST',
    headers,
    body: JSON.stringify({ plan: preview.json.data.plan })
  })
  assert.equal(confirmed.status, 201, JSON.stringify(confirmed.json))

  const dashboard = await api('/api/growth/dashboard', { headers })
  assert.equal(dashboard.status, 200)
  assert.ok(dashboard.json.data.stats.completed_tasks >= 3)
  assert.equal(dashboard.json.data.stats.papers_read, 1)

  const resetCaptcha = await getCaptcha('reset')
  const resetRequest = await api('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'student1',
      captchaId: resetCaptcha.captchaId,
      captcha: resetCaptcha.debugText
    })
  })
  assert.equal(resetRequest.status, 200)
  assert.ok(resetRequest.json.data.resetToken)
  const resetConfirm = await api('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: resetRequest.json.data.resetToken, password: 'new-test-password' })
  })
  assert.equal(resetConfirm.status, 200)
  const relogin = await login('student1', 'new-test-password')
  assert.equal(relogin.user.username, 'student1')

  await stopServer()
  await startServer()
  const persistedLogin = await login('student1', 'new-test-password')
  assert.equal(persistedLogin.user.username, 'student1')
})
