const { spawn, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

const LIMITS = Object.freeze({
  timeoutMs: boundedInteger(process.env.SANDBOX_TIMEOUT_MS, 5000, 1000, 15000),
  compileTimeoutMs: boundedInteger(process.env.SANDBOX_COMPILE_TIMEOUT_MS, 15000, 5000, 30000),
  maxOutputBytes: boundedInteger(process.env.SANDBOX_MAX_OUTPUT_BYTES, 64 * 1024, 4096, 256 * 1024),
  concurrency: boundedInteger(process.env.SANDBOX_CONCURRENCY, 2, 1, 4),
  maxQueue: boundedInteger(process.env.SANDBOX_MAX_QUEUE, 8, 1, 20)
})

const TOOL_CANDIDATES = Object.freeze({
  python: [process.env.SANDBOX_PYTHON_COMMAND, process.platform === 'win32' ? 'python' : 'python3', 'python'],
  cpp: [process.env.SANDBOX_CPP_COMMAND, 'g++'],
  javac: [process.env.SANDBOX_JAVAC_COMMAND, 'javac'],
  java: [process.env.SANDBOX_JAVA_COMMAND, 'java']
})

const LANGUAGE_CONFIG = Object.freeze({
  python: Object.freeze({ sourceFile: 'solution.py', tools: ['python'] }),
  'c++': Object.freeze({ sourceFile: 'solution.cpp', tools: ['cpp'] }),
  java: Object.freeze({ sourceFile: 'Main.java', tools: ['javac', 'java'] })
})

const BLOCKED_SOURCE = Object.freeze({
  python: [
    /\b(?:import|from)\s+(?:os|subprocess|socket|ctypes|multiprocessing|pathlib|shutil|winreg)\b/i,
    /\b(?:open|eval|exec|compile|__import__)\s*\(/i
  ],
  'c++': [
    /#\s*include\s*[<"](?:filesystem|fstream|windows\.h|winsock2?\.h)[>"]/i,
    /\b(?:system|popen|_popen|WinExec|ShellExecute|CreateProcess)\s*\(/i
  ],
  java: [
    /\b(?:ProcessBuilder|Runtime\.getRuntime\s*\(\)\.exec)\b/i,
    /\b(?:FileInputStream|FileOutputStream|FileWriter|RandomAccessFile|java\.net|java\.nio\.file)\b/i
  ]
})

const ABSOLUTE_PATH_PATTERN = /(?:[a-z]:[\\/]|(?:\.\.[\\/]){1,}|\/(?:etc|proc|sys|home|root)\/)/i

class SandboxUnavailableError extends Error {
  constructor(message, code = 'CODE_EXECUTION_UNAVAILABLE') {
    super(message)
    this.name = 'SandboxUnavailableError'
    this.code = code
  }
}

class SandboxPolicyError extends Error {
  constructor(message = '代码包含本地判题器不允许的系统、网络或文件操作') {
    super(message)
    this.name = 'SandboxPolicyError'
    this.code = 'CODE_POLICY_REJECTED'
  }
}

function getProvider() {
  if (process.env.CODE_EXECUTION_PROVIDER) return process.env.CODE_EXECUTION_PROVIDER.toLowerCase()
  return process.env.NODE_ENV === 'test' ? 'disabled' : 'local'
}

function locateExecutable(command) {
  if (!command) return null
  if (path.isAbsolute(command) && fs.existsSync(command)) return command

  const locator = process.platform === 'win32' ? 'where.exe' : 'which'
  const result = spawnSync(locator, [command], {
    encoding: 'utf8',
    timeout: 2000,
    windowsHide: true
  })
  if (result.status !== 0) return null

  return String(result.stdout || '')
    .split(/\r?\n/)
    .map(item => item.trim())
    .find(item => item && fs.existsSync(item)) || null
}

function detectTool(candidates) {
  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    const executable = locateExecutable(candidate)
    if (!executable) continue
    const result = spawnSync(executable, ['--version'], {
      encoding: 'utf8',
      timeout: 3000,
      windowsHide: true
    })
    if (result.status === 0) {
      const version = String(result.stdout || result.stderr || '').split(/\r?\n/)[0].trim()
      return { available: true, executable, version }
    }
  }
  return { available: false, executable: null, version: null }
}

let cachedTools = null

function inspectTools() {
  if (cachedTools && cachedTools.expiresAt > Date.now()) return cachedTools
  cachedTools = {
    python: detectTool(TOOL_CANDIDATES.python),
    cpp: detectTool(TOOL_CANDIDATES.cpp),
    javac: detectTool(TOOL_CANDIDATES.javac),
    java: detectTool(TOOL_CANDIDATES.java),
    expiresAt: Date.now() + 30000
  }
  return cachedTools
}

function languageAvailability(language, tools) {
  const config = LANGUAGE_CONFIG[language]
  if (!config) return false
  return config.tools.every(tool => tools[tool].available)
}

async function getStatus(language = null) {
  const provider = getProvider()
  if (provider === 'disabled') {
    return {
      available: false,
      provider,
      code: 'CODE_EXECUTION_DISABLED',
      message: '代码执行已通过配置关闭',
      limits: LIMITS
    }
  }

  if (provider !== 'local') {
    return {
      available: false,
      provider,
      code: 'CODE_EXECUTION_PROVIDER_INVALID',
      message: `不支持的代码执行方式: ${provider}`,
      limits: LIMITS
    }
  }

  if (language && !LANGUAGE_CONFIG[language]) {
    return {
      available: false,
      provider,
      code: 'LANGUAGE_UNSUPPORTED',
      message: `不支持的语言: ${language}`,
      limits: LIMITS
    }
  }

  const tools = inspectTools()
  const languages = Object.fromEntries(Object.keys(LANGUAGE_CONFIG).map(key => [key, {
    available: languageAvailability(key, tools),
    runtime: LANGUAGE_CONFIG[key].tools.map(tool => tools[tool].version).filter(Boolean).join(' / ') || null
  }]))
  const available = language ? languages[language].available : Object.values(languages).some(item => item.available)

  return {
    available,
    provider,
    code: available ? null : 'LOCAL_RUNTIME_MISSING',
    message: available ? '本地判题器已就绪' : '该语言的编译器或运行时未安装',
    warning: available ? '仅运行你自己或可信队友提交的代码' : null,
    languages,
    limits: LIMITS
  }
}

function validateSource(language, code) {
  const source = String(code || '')
  if (ABSOLUTE_PATH_PATTERN.test(source)) throw new SandboxPolicyError()
  for (const pattern of BLOCKED_SOURCE[language] || []) {
    if (pattern.test(source)) throw new SandboxPolicyError()
  }
}

function createChildEnvironment(tempDir, tools) {
  const toolDirectories = Object.values(tools)
    .filter(tool => tool?.available && tool.executable)
    .map(tool => path.dirname(tool.executable))
  const systemRoot = process.env.SystemRoot || process.env.WINDIR
  const systemDirectories = process.platform === 'win32' && systemRoot
    ? [path.join(systemRoot, 'System32'), systemRoot]
    : ['/usr/bin', '/bin']
  const env = {
    PATH: [...new Set([...toolDirectories, ...systemDirectories])].join(path.delimiter),
    HOME: tempDir,
    USERPROFILE: tempDir,
    TEMP: tempDir,
    TMP: tempDir,
    PYTHONNOUSERSITE: '1',
    PYTHONDONTWRITEBYTECODE: '1'
  }

  for (const key of ['SystemRoot', 'SystemDrive', 'WINDIR', 'ComSpec', 'PATHEXT']) {
    if (process.env[key]) env[key] = process.env[key]
  }
  if (tools.javac?.available) env.JAVA_HOME = path.dirname(path.dirname(tools.javac.executable))
  return env
}

function killProcessTree(pid) {
  if (!pid) return Promise.resolve(true)
  if (process.platform !== 'win32') {
    try {
      process.kill(-pid, 'SIGKILL')
      return Promise.resolve(true)
    } catch {
      return Promise.resolve(false)
    }
  }

  return new Promise(resolve => {
    const taskkill = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe')
    const killer = spawn(taskkill, ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true
    })
    const timer = setTimeout(() => {
      killer.kill()
      resolve(false)
    }, 3000)
    killer.on('error', () => {
      clearTimeout(timer)
      resolve(false)
    })
    killer.on('close', code => {
      clearTimeout(timer)
      if (code === 0) return resolve(true)
      try {
        process.kill(pid, 0)
        resolve(false)
      } catch {
        resolve(true)
      }
    })
  })
}

function runProcess(command, args, { cwd, env, stdin = '', timeoutMs, maxOutputBytes = LIMITS.maxOutputBytes }) {
  return new Promise(resolve => {
    let stdout = Buffer.alloc(0)
    let stderr = Buffer.alloc(0)
    let outputBytes = 0
    let termination = null
    let settled = false
    let cleanupPromise = Promise.resolve(true)

    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      detached: true
    })

    const finish = async (exitCode, spawnError = null) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutTimer)
      const cleanupSucceeded = await cleanupPromise
      resolve({
        exitCode,
        stdout: stdout.toString('utf8'),
        stderr: stderr.toString('utf8'),
        timedOut: termination === 'timeout',
        outputLimitExceeded: termination === 'output',
        cleanupFailed: !cleanupSucceeded,
        spawnError
      })
    }

    const terminate = reason => {
      if (termination) return
      termination = reason
      cleanupPromise = killProcessTree(child.pid).then(cleanupSucceeded => {
        if (!cleanupSucceeded) child.kill('SIGKILL')
        return cleanupSucceeded
      })
    }

    const appendOutput = (target, chunk) => {
      outputBytes += chunk.length
      if (outputBytes > maxOutputBytes) {
        terminate('output')
        return target
      }
      return Buffer.concat([target, chunk])
    }

    child.stdout.on('data', chunk => { stdout = appendOutput(stdout, chunk) })
    child.stderr.on('data', chunk => { stderr = appendOutput(stderr, chunk) })
    child.on('error', error => finish(null, error))
    child.on('close', code => finish(code))
    child.stdin.on('error', () => {})

    const timeoutTimer = setTimeout(() => terminate('timeout'), timeoutMs)
    if (stdin) child.stdin.write(String(stdin))
    child.stdin.end()
  })
}

function processError(result, phase) {
  if (result.cleanupFailed) return '子进程清理失败，请重启后端后再试'
  if (result.timedOut) return `${phase}超时`
  if (result.outputLimitExceeded) return `输出超过 ${Math.round(LIMITS.maxOutputBytes / 1024)} KB 限制`
  if (result.spawnError) return `无法启动本地运行时: ${result.spawnError.message}`
  if (result.exitCode !== 0) return result.stderr.trim() || `${phase}失败，退出码 ${result.exitCode}`
  return null
}

let activeExecutions = 0
const executionQueue = []

async function withExecutionSlot(task) {
  if (activeExecutions >= LIMITS.concurrency) {
    if (executionQueue.length >= LIMITS.maxQueue) {
      throw new SandboxUnavailableError('本地判题任务较多，请稍后再试', 'SANDBOX_BUSY')
    }
    await new Promise(resolve => executionQueue.push(resolve))
  }

  activeExecutions += 1
  try {
    return await task()
  } finally {
    activeExecutions -= 1
    executionQueue.shift()?.()
  }
}

function executionPlan(language, tempDir, tools) {
  if (language === 'python') {
    return {
      runCommand: tools.python.executable,
      runArgs: ['-I', '-S', '-B', path.join(tempDir, 'solution.py')]
    }
  }

  if (language === 'c++') {
    const outputFile = path.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution')
    return {
      compileCommand: tools.cpp.executable,
      compileArgs: [path.join(tempDir, 'solution.cpp'), '-O2', '-std=c++17', '-o', outputFile],
      runCommand: outputFile,
      runArgs: []
    }
  }

  return {
    compileCommand: tools.javac.executable,
    compileArgs: ['-encoding', 'UTF-8', '-d', tempDir, path.join(tempDir, 'Main.java')],
    runCommand: tools.java.executable,
    runArgs: ['-Xms16m', '-Xmx192m', '-cp', tempDir, 'Main']
  }
}

async function execute({ code, language, testCases }) {
  validateSource(language, code)
  const status = await getStatus(language)
  if (!status.available) throw new SandboxUnavailableError(status.message, status.code)

  return withExecutionSlot(async () => {
    const tools = inspectTools()
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zhitu-local-judge-'))
    const config = LANGUAGE_CONFIG[language]
    const env = createChildEnvironment(tempDir, tools)
    fs.writeFileSync(path.join(tempDir, config.sourceFile), String(code), 'utf8')

    try {
      const plan = executionPlan(language, tempDir, tools)
      if (plan.compileCommand) {
        const compilation = await runProcess(plan.compileCommand, plan.compileArgs, {
          cwd: tempDir,
          env,
          timeoutMs: LIMITS.compileTimeoutMs
        })
        const compileError = processError(compilation, '编译')
        if (compileError) return { passed: false, testResults: [], error: `编译错误:\n${compileError}` }
      }

      const testResults = []
      let allPassed = true
      let errorMessage = null

      for (const testCase of testCases) {
        const result = await runProcess(plan.runCommand, plan.runArgs, {
          cwd: tempDir,
          env,
          stdin: testCase.input || '',
          timeoutMs: LIMITS.timeoutMs
        })
        const runtimeError = processError(result, '执行')
        const actual = result.stdout.trim()
        const expected = String(testCase.expected || '').trim()
        const passed = !runtimeError && actual === expected
        if (!passed) allPassed = false
        if (runtimeError && !errorMessage) errorMessage = runtimeError
        testResults.push({
          input: testCase.input || '',
          expected,
          actual: actual || (runtimeError ? '执行错误' : ''),
          passed
        })
      }

      return { passed: allPassed, testResults, error: errorMessage }
    } finally {
      try { fs.rmSync(tempDir, { recursive: true, force: true }) } catch {}
    }
  })
}

module.exports = {
  execute,
  getStatus,
  SandboxUnavailableError,
  SandboxPolicyError,
  _test: { LIMITS, validateSource, createChildEnvironment, inspectTools }
}
