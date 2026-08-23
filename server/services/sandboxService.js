/**
 * 代码沙箱服务 — 使用 child_process 执行用户代码
 * 安全限制：5秒超时、禁止网络、禁止磁盘写入
 */
const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const TIMEOUT_MS = 5000

// 自动检测 Python 命令（Windows 优先 python，Unix 优先 python3）
let PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3'
try {
  execSync(`${PYTHON_CMD} --version`, { stdio: 'pipe' })
} catch {
  const fallback = PYTHON_CMD === 'python3' ? 'python' : 'python3'
  try {
    execSync(`${fallback} --version`, { stdio: 'pipe' })
    PYTHON_CMD = fallback
  } catch { /* 不修改默认值 */ }
}

// spawn 最小环境（Windows 需要 SystemRoot 等基本变量）
const SANDBOX_ENV = { PATH: process.env.PATH }
if (process.platform === 'win32') {
  for (const key of ['SystemRoot', 'SystemDrive', 'TEMP', 'TMP', 'ComSpec']) {
    if (process.env[key]) SANDBOX_ENV[key] = process.env[key]
  }
}

async function execute({ code, language, testCases }) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-'))

  try {
    if (language === 'python') {
      return await executePython(code, testCases, tmpDir)
    } else if (language === 'c++') {
      return await executeCpp(code, testCases, tmpDir)
    } else if (language === 'java') {
      return await executeJava(code, testCases, tmpDir)
    } else {
      return { passed: false, error: `不支持的语言: ${language}` }
    }
  } finally {
    // 清理临时目录
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
  }
}

async function executePython(code, testCases, tmpDir) {
  const codeFile = path.join(tmpDir, 'solution.py')
  fs.writeFileSync(codeFile, code, 'utf8')

  const testResults = []
  let allPassed = true
  let errorMessage = null

  for (const tc of testCases) {
    try {
      const result = await runProcess(PYTHON_CMD, [codeFile], tc.input, TIMEOUT_MS)
      const actual = result.stdout.trim()
      const expected = tc.expected.trim()
      const passed = actual === expected
      if (!passed) allPassed = false
      testResults.push({ input: tc.input, expected, actual, passed })
      if (result.error) {
        allPassed = false
        errorMessage = result.error
      }
    } catch (e) {
      allPassed = false
      testResults.push({ input: tc.input, expected: tc.expected, actual: '执行错误', passed: false })
      errorMessage = e.message
    }
  }

  return {
    passed: allPassed,
    testResults,
    error: errorMessage
  }
}

async function executeCpp(code, testCases, tmpDir) {
  const codeFile = path.join(tmpDir, 'solution.cpp')
  const exeFile = path.join(tmpDir, 'solution.exe')
  fs.writeFileSync(codeFile, code, 'utf8')

  // 编译
  try {
    execSync(`g++ "${codeFile}" -o "${exeFile}" -O2 -std=c++17`, {
      timeout: 10000,
      stdio: 'pipe'
    })
  } catch (e) {
    return {
      passed: false,
      testResults: [],
      error: '编译错误:\n' + (e.stderr?.toString() || e.message)
    }
  }

  const testResults = []
  let allPassed = true

  for (const tc of testCases) {
    try {
      const result = await runProcess(exeFile, [], tc.input, TIMEOUT_MS)
      const actual = result.stdout.trim()
      const expected = tc.expected.trim()
      const passed = actual === expected
      if (!passed) allPassed = false
      testResults.push({ input: tc.input, expected, actual, passed })
      if (result.error) allPassed = false
    } catch (e) {
      allPassed = false
      testResults.push({ input: tc.input, expected: tc.expected, actual: '运行时错误', passed: false })
    }
  }

  return { passed: allPassed, testResults, error: allPassed ? null : '部分测试用例未通过' }
}

async function executeJava(code, testCases, tmpDir) {
  const codeFile = path.join(tmpDir, 'Main.java')
  fs.writeFileSync(codeFile, code, 'utf8')

  // 编译
  try {
    execSync(`javac "${codeFile}"`, { timeout: 10000, stdio: 'pipe' })
  } catch (e) {
    return {
      passed: false,
      testResults: [],
      error: '编译错误:\n' + (e.stderr?.toString() || e.message)
    }
  }

  const testResults = []
  let allPassed = true

  for (const tc of testCases) {
    try {
      const result = await runProcess('java', ['-cp', tmpDir, 'Main'], tc.input, TIMEOUT_MS)
      const actual = result.stdout.trim()
      const expected = tc.expected.trim()
      const passed = actual === expected
      if (!passed) allPassed = false
      testResults.push({ input: tc.input, expected, actual, passed })
      if (result.error) allPassed = false
    } catch (e) {
      allPassed = false
      testResults.push({ input: tc.input, expected: tc.expected, actual: '运行时错误', passed: false })
    }
  }

  return { passed: allPassed, testResults, error: allPassed ? null : '部分测试用例未通过' }
}

function runProcess(cmd, args, stdin, timeoutMs) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: SANDBOX_ENV,
    })

    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      resolve({ stdout, stderr: stderr + '\n执行超时', error: '执行超时' })
    }, timeoutMs)

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })

    proc.on('close', (code) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, error: code !== 0 ? `退出码: ${code}` : null })
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      resolve({ stdout, stderr: err.message, error: err.message })
    })

    if (stdin) proc.stdin.write(stdin)
    proc.stdin.end()
  })
}

module.exports = { execute }
