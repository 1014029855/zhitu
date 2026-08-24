const { spawn } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const DOCKER_COMMAND = process.env.DOCKER_COMMAND || 'docker'
const STATUS_CACHE_MS = 5000

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

const LIMITS = Object.freeze({
  timeoutMs: boundedInteger(process.env.SANDBOX_TIMEOUT_MS, 5000, 1000, 15000),
  compileTimeoutMs: boundedInteger(process.env.SANDBOX_COMPILE_TIMEOUT_MS, 15000, 5000, 30000),
  memoryMb: boundedInteger(process.env.SANDBOX_MEMORY_MB, 256, 64, 512),
  maxOutputBytes: boundedInteger(process.env.SANDBOX_MAX_OUTPUT_BYTES, 64 * 1024, 4096, 256 * 1024),
  pids: boundedInteger(process.env.SANDBOX_PIDS_LIMIT, 32, 8, 64),
  cpus: '0.50'
})

const LANGUAGE_CONFIG = Object.freeze({
  python: Object.freeze({
    image: process.env.SANDBOX_PYTHON_IMAGE || 'python:3.13-alpine',
    sourceFile: 'solution.py',
    setup: 'pull',
    runtimeCommand: () => ['python', '-I', '-B', '/workspace/solution.py']
  }),
  'c++': Object.freeze({
    image: process.env.SANDBOX_CPP_IMAGE || 'zhitu-sandbox-cpp:1',
    sourceFile: 'solution.cpp',
    setup: 'build-cpp',
    compileCommand: ['g++', '/workspace/solution.cpp', '-O2', '-std=c++17', '-o', '/build/solution'],
    runtimeCommand: () => ['/build/solution']
  }),
  java: Object.freeze({
    image: process.env.SANDBOX_JAVA_IMAGE || 'eclipse-temurin:21-jdk-alpine',
    sourceFile: 'Main.java',
    setup: 'pull',
    compileCommand: ['javac', '-encoding', 'UTF-8', '-d', '/build', '/workspace/Main.java'],
    runtimeCommand: (memoryMb) => ['java', '-Xms16m', `-Xmx${Math.max(32, memoryMb - 64)}m`, '-cp', '/build', 'Main']
  })
})

class SandboxUnavailableError extends Error {
  constructor(message, code = 'CODE_EXECUTION_UNAVAILABLE') {
    super(message)
    this.name = 'SandboxUnavailableError'
    this.code = code
  }
}

function getProvider() {
  if (process.env.CODE_EXECUTION_PROVIDER) return process.env.CODE_EXECUTION_PROVIDER.toLowerCase()
  return process.env.NODE_ENV === 'test' ? 'disabled' : 'docker'
}

function containerName() {
  return `zhitu-sandbox-${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}`
}

function removeContainerOnce(name) {
  return new Promise((resolve) => {
    const cleanup = spawn(DOCKER_COMMAND, ['rm', '--force', name], {
      stdio: 'ignore',
      windowsHide: true
    })
    const timer = setTimeout(() => {
      cleanup.kill()
      resolve(false)
    }, 3000)
    cleanup.on('error', () => {
      clearTimeout(timer)
      resolve(false)
    })
    cleanup.on('close', code => {
      clearTimeout(timer)
      resolve(code === 0)
    })
  })
}

async function forceRemoveContainer(name) {
  if (!name) return true
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await removeContainerOnce(name)) return true
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  return false
}

function runDocker(args, { stdin = '', timeoutMs = 3000, maxOutputBytes = 16 * 1024, name = null } = {}) {
  return new Promise((resolve) => {
    let stdout = Buffer.alloc(0)
    let stderr = Buffer.alloc(0)
    let outputBytes = 0
    let termination = null
    let settled = false
    let settling = false
    let fallbackTimer = null
    let cleanupPromise = Promise.resolve(true)

    const proc = spawn(DOCKER_COMMAND, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })

    const finish = async (exitCode, spawnError = null) => {
      if (settled || settling) return
      settling = true
      settled = true
      clearTimeout(timeoutTimer)
      clearTimeout(fallbackTimer)
      const cleanupSucceeded = await cleanupPromise
      resolve({
        exitCode,
        stdout: stdout.toString('utf8'),
        stderr: stderr.toString('utf8'),
        timedOut: termination === 'timeout',
        outputLimitExceeded: termination === 'output',
        spawnError,
        cleanupFailed: !cleanupSucceeded
      })
    }

    const terminate = (reason) => {
      if (termination) return
      termination = reason
      cleanupPromise = forceRemoveContainer(name)
      proc.kill()
      fallbackTimer = setTimeout(() => finish(null), 3500)
    }

    const appendOutput = (target, chunk) => {
      outputBytes += chunk.length
      if (outputBytes > maxOutputBytes) {
        terminate('output')
        return target
      }
      return Buffer.concat([target, chunk])
    }

    proc.stdout.on('data', (chunk) => { stdout = appendOutput(stdout, chunk) })
    proc.stderr.on('data', (chunk) => { stderr = appendOutput(stderr, chunk) })
    proc.on('error', (error) => finish(null, error))
    proc.on('close', (code) => finish(code))
    proc.stdin.on('error', () => {})

    const timeoutTimer = setTimeout(() => terminate('timeout'), timeoutMs)
    if (stdin) proc.stdin.write(String(stdin))
    proc.stdin.end()
  })
}

function bindMount(source, target, readonly = false) {
  return `type=bind,source=${source},target=${target}${readonly ? ',readonly' : ''}`
}

function buildContainerArgs({ name, image, sourceDir, buildDir = null, buildReadonly = true, command, memoryMb = LIMITS.memoryMb }) {
  const memory = `${memoryMb}m`
  const args = [
    'run', '--rm', '--interactive', '--name', name,
    '--pull', 'never',
    '--network', 'none',
    '--read-only',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges=true',
    '--memory', memory,
    '--memory-swap', memory,
    '--cpus', LIMITS.cpus,
    '--pids-limit', String(LIMITS.pids),
    '--ulimit', 'nofile=64:64',
    '--ulimit', `nproc=${LIMITS.pids}:${LIMITS.pids}`,
    '--ipc', 'none',
    '--user', '65534:65534',
    '--hostname', 'sandbox',
    '--workdir', '/workspace',
    '--env', 'HOME=/tmp',
    '--env', 'TMPDIR=/tmp',
    '--tmpfs', '/tmp:rw,exec,nosuid,nodev,size=64m,mode=1777',
    '--mount', bindMount(sourceDir, '/workspace', true)
  ]

  if (buildDir) args.push('--mount', bindMount(buildDir, '/build', buildReadonly))
  args.push(image, ...command)
  return args
}

async function runContainer(options) {
  const name = containerName()
  const args = buildContainerArgs({ ...options, name })
  return runDocker(args, {
    stdin: options.stdin,
    timeoutMs: options.timeoutMs,
    maxOutputBytes: LIMITS.maxOutputBytes,
    name
  })
}

let cachedStatus = null

async function inspectEnvironment() {
  if (cachedStatus && cachedStatus.expiresAt > Date.now()) return cachedStatus

  const docker = await runDocker(['version', '--format', '{{.Server.Version}}'], { timeoutMs: 3000 })
  const dockerAvailable = docker.exitCode === 0
  const images = {}

  if (dockerAvailable) {
    await Promise.all(Object.entries(LANGUAGE_CONFIG).map(async ([language, config]) => {
      const result = await runDocker(['image', 'inspect', config.image, '--format', '{{.Id}}'], { timeoutMs: 3000 })
      images[language] = result.exitCode === 0
    }))
  }

  cachedStatus = {
    dockerAvailable,
    dockerError: docker.spawnError?.message || docker.stderr.trim(),
    images,
    expiresAt: Date.now() + STATUS_CACHE_MS
  }
  return cachedStatus
}

function setupCommand(language) {
  return `npm run sandbox:setup -- ${language}`
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

  if (provider !== 'docker') {
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

  const environment = await inspectEnvironment()
  if (!environment.dockerAvailable) {
    return {
      available: false,
      provider,
      code: 'DOCKER_UNAVAILABLE',
      message: 'Docker 未启动，启动 Docker Desktop 后即可使用判题',
      limits: LIMITS
    }
  }

  const languages = Object.fromEntries(Object.entries(LANGUAGE_CONFIG).map(([key, config]) => [key, {
    available: Boolean(environment.images[key]),
    image: config.image,
    setupCommand: setupCommand(key)
  }]))
  const available = language ? languages[language].available : Object.values(languages).some(item => item.available)

  return {
    available,
    provider,
    code: available ? null : 'SANDBOX_IMAGE_MISSING',
    message: available ? '隔离判题服务已就绪' : '该语言的运行环境尚未准备，请联系管理员',
    languages,
    limits: LIMITS
  }
}

function processError(result, phase) {
  if (result.cleanupFailed) return '隔离容器清理失败，请重启 Docker 后再试'
  if (result.timedOut) return `${phase}超时`
  if (result.outputLimitExceeded) return `输出超过 ${Math.round(LIMITS.maxOutputBytes / 1024)} KB 限制`
  if (result.spawnError) return `无法启动隔离容器: ${result.spawnError.message}`
  if (result.exitCode === 137) return '程序超过内存限制或被强制终止'
  if (result.exitCode !== 0) return result.stderr.trim() || `${phase}失败，退出码 ${result.exitCode}`
  return null
}

async function execute({ code, language, testCases }) {
  const config = LANGUAGE_CONFIG[language]
  if (!config) throw new SandboxUnavailableError(`不支持的语言: ${language}`, 'LANGUAGE_UNSUPPORTED')

  const status = await getStatus(language)
  if (!status.available) throw new SandboxUnavailableError(status.message, status.code)

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zhitu-sandbox-'))
  const sourceDir = path.join(tempDir, 'source')
  const buildDir = path.join(tempDir, 'build')
  fs.mkdirSync(sourceDir, { mode: 0o755 })
  fs.mkdirSync(buildDir, { mode: 0o777 })
  fs.chmodSync(sourceDir, 0o755)
  fs.chmodSync(buildDir, 0o777)
  fs.writeFileSync(path.join(sourceDir, config.sourceFile), String(code), { encoding: 'utf8', mode: 0o444 })

  try {
    if (config.compileCommand) {
      const compilation = await runContainer({
        image: config.image,
        sourceDir,
        buildDir,
        buildReadonly: false,
        command: config.compileCommand,
        timeoutMs: LIMITS.compileTimeoutMs
      })
      const compileError = processError(compilation, '编译')
      if (compileError) {
        return { passed: false, testResults: [], error: `编译错误:\n${compileError}` }
      }
    }

    const testResults = []
    let allPassed = true
    let errorMessage = null

    for (const testCase of testCases) {
      const execution = await runContainer({
        image: config.image,
        sourceDir,
        buildDir: config.compileCommand ? buildDir : null,
        buildReadonly: true,
        command: config.runtimeCommand(LIMITS.memoryMb),
        stdin: testCase.input || '',
        timeoutMs: LIMITS.timeoutMs
      })
      const runtimeError = processError(execution, '执行')
      const actual = execution.stdout.trim()
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

    return {
      passed: allPassed,
      testResults,
      error: errorMessage
    }
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
}

function getLanguageDefinitions() {
  return LANGUAGE_CONFIG
}

module.exports = {
  execute,
  getStatus,
  getLanguageDefinitions,
  SandboxUnavailableError,
  _test: { buildContainerArgs, LIMITS }
}
