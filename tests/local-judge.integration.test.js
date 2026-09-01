const test = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const net = require('node:net')
const os = require('node:os')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')

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

test('student can submit trusted code through the local judge API', async t => {
  const port = await getFreePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zhitu-local-api-test-'))
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      API_PORT: String(port),
      DB_PATH: path.join(tempDir, 'platform.db'),
      NODE_ENV: 'test',
      CODE_EXECUTION_PROVIDER: 'local',
      JWT_SECRET: 'local-judge-integration-secret',
      DEEPSEEK_API_KEY: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

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
    throw new Error('Timed out waiting for local judge API')
  }

  try {
    await waitForServer()
    const captcha = await api('/api/auth/captcha?purpose=login')
    assert.equal(captcha.status, 200)

    const login = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'student1',
        password: '123123123',
        captchaId: captcha.json.data.captchaId,
        captcha: captcha.json.data.debugText
      })
    })
    assert.equal(login.status, 200, JSON.stringify(login.json))
    const headers = { Authorization: `Bearer ${login.json.data.token}` }

    const status = await api('/api/ai/judge/status?language=python', { headers })
    assert.equal(status.status, 200)
    if (!status.json.data.available) {
      t.skip(status.json.data.message)
      return
    }
    assert.equal(status.json.data.provider, 'local')
    assert.match(status.json.data.warning, /可信队友/)

    const code = [
      'def reverseString(s):',
      '    chars = list(s)',
      '    left, right = 0, len(chars) - 1',
      '    while left < right:',
      '        chars[left], chars[right] = chars[right], chars[left]',
      '        left += 1',
      '        right -= 1',
      '    return "".join(chars)',
      '',
      'print(reverseString(input()))'
    ].join('\n')
    const submission = await api('/api/ai/judge', {
      method: 'POST',
      headers,
      body: JSON.stringify({ exerciseId: 3, language: 'python', code })
    })
    assert.equal(submission.status, 200, JSON.stringify(submission.json))
    assert.equal(submission.json.data.status, 'passed')
    assert.equal(submission.json.data.testResults.length, 3)
    assert.equal(submission.json.data.testResults.every(result => result.passed), true)

    const rejected = await api('/api/ai/judge', {
      method: 'POST',
      headers,
      body: JSON.stringify({ exerciseId: 3, language: 'python', code: 'import socket\nprint(1)' })
    })
    assert.equal(rejected.status, 400)
    assert.equal(rejected.json.code, 'CODE_POLICY_REJECTED')
  } finally {
    if (child.exitCode === null) {
      child.kill()
      await new Promise(resolve => child.once('exit', resolve))
    }
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})
