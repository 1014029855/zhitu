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
  return { status: response.status, json: await response.json() }
}

async function login(username, password) {
  const captcha = await api('/api/auth/captcha?purpose=login')
  const result = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      captchaId: captcha.json.data.captchaId,
      captcha: captcha.json.data.debugText
    })
  })
  assert.equal(result.status, 200, JSON.stringify(result.json))
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

test.before(async () => {
  const port = await getFreePort()
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zhitu-learning-test-'))
  baseUrl = `http://127.0.0.1:${port}`
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      API_PORT: String(port),
      DB_PATH: path.join(tempDir, 'platform.db'),
      NODE_ENV: 'test',
      JWT_SECRET: 'learning-integration-secret',
      DEEPSEEK_API_KEY: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  await waitForServer()
})

test.after(async () => {
  if (child && child.exitCode === null) {
    child.kill()
    await new Promise(resolve => child.once('exit', resolve))
  }
  if (tempDir && path.basename(tempDir).startsWith('zhitu-learning-test-')) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('interactive course, mastery and lightweight authoring work end to end', async () => {
  const student = await login('student1', '123123123')
  const studentHeaders = { Authorization: `Bearer ${student.token}` }

  const catalog = await api('/api/skills', { headers: studentHeaders })
  assert.equal(catalog.status, 200)
  const psychology = catalog.json.data.find(course => course.title === '心理学导论')
  assert.ok(psychology)
  assert.equal(psychology.lessonCount, 50)
  assert.equal(psychology.interactiveCount, 6)

  const enrollment = await api(`/api/skills/${psychology.id}/enroll`, {
    method: 'POST', headers: studentHeaders, body: '{}'
  })
  assert.equal(enrollment.status, 201)

  const overview = await api(`/api/skills/${psychology.id}/learning`, { headers: studentHeaders })
  assert.equal(overview.status, 200)
  assert.equal(overview.json.data.modules.length, 7)
  assert.equal(overview.json.data.summary.completedLessons, 0)
  const firstLessonId = overview.json.data.summary.continueLessonId
  assert.ok(firstLessonId)

  const lesson = await api(`/api/skills/${psychology.id}/lessons/${firstLessonId}`, { headers: studentHeaders })
  assert.equal(lesson.status, 200)
  assert.deepEqual(lesson.json.data.note, {
    explanation: '',
    example: '',
    question: '',
    confidence: 1,
    updated_at: null
  })
  const activity = lesson.json.data.content.find(item => item.kind === 'activity')
  assert.ok(activity)
  assert.equal(activity.type, 'single_choice')
  assert.equal(Object.hasOwn(activity.config, 'correctAnswer'), false)
  assert.equal(activity.config.choices.some(choice => Object.hasOwn(choice, 'feedback')), false)

  const wrong = await api(`/api/learning/activities/${activity.id}/attempts`, {
    method: 'POST', headers: studentHeaders, body: JSON.stringify({ answer: 'a' })
  })
  assert.equal(wrong.status, 201)
  assert.equal(wrong.json.data.attempt.correct, false)
  assert.equal(wrong.json.data.attempt.feedback.tone, 'retry')
  assert.equal(wrong.json.data.lessonProgress.completionReady, false)

  const correct = await api(`/api/learning/activities/${activity.id}/attempts`, {
    method: 'POST', headers: studentHeaders, body: JSON.stringify({ answer: 'b' })
  })
  assert.equal(correct.status, 201)
  assert.equal(correct.json.data.attempt.correct, true)
  assert.equal(correct.json.data.mastery.evidence_count, 2)
  assert.ok(correct.json.data.mastery.next_review_at)
  assert.equal(correct.json.data.lessonProgress.completionReady, true)

  const notePayload = {
    explanation: '心理学用可检验的证据排除只凭直觉的解释。',
    example: '先提出睡眠会影响记忆的假设，再控制变量并比较两组成绩。',
    question: '观察研究如何进一步排除第三变量？',
    confidence: 3
  }
  const savedNote = await api(`/api/learning/lessons/${firstLessonId}/note`, {
    method: 'PUT', headers: studentHeaders, body: JSON.stringify(notePayload)
  })
  assert.equal(savedNote.status, 200, JSON.stringify(savedNote.json))
  assert.equal(savedNote.json.data.confidence, 3)

  const lessonWithNote = await api(`/api/skills/${psychology.id}/lessons/${firstLessonId}`, { headers: studentHeaders })
  assert.equal(lessonWithNote.status, 200)
  assert.equal(lessonWithNote.json.data.note.explanation, notePayload.explanation)
  assert.equal(lessonWithNote.json.data.note.example, notePayload.example)
  assert.equal(lessonWithNote.json.data.note.question, notePayload.question)

  const completed = await api(`/api/skills/${psychology.id}/lessons/${firstLessonId}/complete`, {
    method: 'POST', headers: studentHeaders, body: '{}'
  })
  assert.equal(completed.status, 200, JSON.stringify(completed.json))
  assert.ok(completed.json.data.nextLesson)

  const updatedOverview = await api(`/api/skills/${psychology.id}/learning`, { headers: studentHeaders })
  assert.equal(updatedOverview.json.data.summary.completedLessons, 1)
  assert.equal(updatedOverview.json.data.summary.continueLessonId, completed.json.data.nextLesson.id)
  assert.ok(updatedOverview.json.data.summary.masteryScore > 0)

  const memoryLessonSummary = updatedOverview.json.data.modules
    .flatMap(module => module.lessons)
    .find(item => item.title === '记忆为什么会失真')
  assert.ok(memoryLessonSummary)
  const memoryLesson = await api(`/api/skills/${psychology.id}/lessons/${memoryLessonSummary.id}`, { headers: studentHeaders })
  assert.equal(memoryLesson.status, 200)
  const memoryActivities = memoryLesson.json.data.content.filter(item => item.kind === 'activity')
  assert.equal(memoryActivities.length, 4)
  const simulation = memoryActivities.find(item => item.config.variant === 'simulation')
  const transfer = memoryActivities.find(item => item.config.variant === 'short_answer')
  assert.ok(simulation)
  assert.ok(transfer)
  assert.equal(Object.hasOwn(simulation.config, 'correctConclusion'), false)
  assert.equal(Object.hasOwn(transfer.config, 'expectedKeywords'), false)

  const simulationAttempt = await api(`/api/learning/activities/${simulation.id}/attempts`, {
    method: 'POST', headers: studentHeaders, body: JSON.stringify({ answer: { control: 'smashed', conclusion: 'wording' } })
  })
  assert.equal(simulationAttempt.status, 201)
  assert.equal(simulationAttempt.json.data.attempt.correct, true)

  const transferAttempt = await api(`/api/learning/activities/${transfer.id}/attempts`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ answer: '先分别进行独立访谈，让两个人自由叙述；随后只用开放和中性的问题追问，避免把调查者的判断带入回忆。' })
  })
  assert.equal(transferAttempt.status, 201)
  assert.equal(transferAttempt.json.data.attempt.correct, true)

  const admin = await login('lufuping', 'lu1203')
  const adminHeaders = { Authorization: `Bearer ${admin.token}` }
  const studio = await api(`/api/admin/courses/${psychology.id}/studio`, { headers: adminHeaders })
  assert.equal(studio.status, 200)
  assert.equal(studio.json.data.modules.length, 7)

  const adminLesson = await api(`/api/admin/course-lessons/${firstLessonId}`, { headers: adminHeaders })
  assert.equal(adminLesson.status, 200)
  assert.ok(adminLesson.json.data.activities[0].config.correctAnswer)
  const saved = await api(`/api/admin/course-lessons/${firstLessonId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      ...adminLesson.json.data.lesson,
      title: '什么让心理学成为科学（修订）',
      blocks: adminLesson.json.data.blocks,
      activities: adminLesson.json.data.activities,
      knowledgePoints: adminLesson.json.data.knowledgePoints
    })
  })
  assert.equal(saved.status, 200, JSON.stringify(saved.json))
  assert.equal(saved.json.data.lesson.title, '什么让心理学成为科学（修订）')

  const versionedStudio = await api(`/api/admin/courses/${psychology.id}/studio`, { headers: adminHeaders })
  assert.ok(versionedStudio.json.data.versions.some(version => version.event_type === 'save'))

  const draft = await api(`/api/admin/courses/${psychology.id}/status`, {
    method: 'PUT', headers: adminHeaders, body: JSON.stringify({ status: 'draft' })
  })
  assert.equal(draft.status, 200)
  assert.equal(draft.json.data.course_status, 'draft')
  const republished = await api(`/api/admin/courses/${psychology.id}/status`, {
    method: 'PUT', headers: adminHeaders, body: JSON.stringify({ status: 'published' })
  })
  assert.equal(republished.status, 200)
  assert.equal(republished.json.data.course_status, 'published')
})
