const { spawn } = require('node:child_process')
const path = require('node:path')
const { getLanguageDefinitions } = require('../server/services/sandboxService')

const projectRoot = path.resolve(__dirname, '..')
const definitions = getLanguageDefinitions()

function normalizeLanguage(value) {
  if (value === 'cpp') return 'c++'
  return value
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || projectRoot,
      stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
      windowsHide: true
    })
    let stdout = ''
    if (options.capture) child.stdout.on('data', chunk => { stdout += chunk.toString() })
    child.on('error', reject)
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(`${command} exited with code ${code}`)))
  })
}

async function prepare(language) {
  const config = definitions[language]
  process.stdout.write(`\nPreparing ${language} sandbox (${config.image})...\n`)

  if (config.setup === 'build-cpp') {
    const context = path.join(projectRoot, 'docker', 'sandbox')
    await run('docker', [
      'build', '--pull',
      '--tag', config.image,
      '--file', path.join(context, 'cpp.Dockerfile'),
      context
    ])
  } else {
    await run('docker', ['pull', config.image])
  }

  const bytes = await run('docker', ['image', 'inspect', config.image, '--format', '{{.Size}}'], { capture: true })
  const megabytes = Math.round(Number(bytes) / 1024 / 1024)
  process.stdout.write(`${language} sandbox ready (${megabytes} MB).\n`)
}

async function main() {
  const requested = process.argv.slice(2).map(normalizeLanguage)
  const languages = requested.includes('--all') ? Object.keys(definitions) : (requested.length ? requested : ['python'])

  for (const language of languages) {
    if (!definitions[language]) {
      throw new Error(`Unsupported language: ${language}. Choose python, c++, or java.`)
    }
  }

  await run('docker', ['info', '--format', '{{.ServerVersion}}'], { capture: true })
  for (const language of [...new Set(languages)]) await prepare(language)
}

main().catch(error => {
  console.error(`Sandbox setup failed: ${error.message}`)
  process.exitCode = 1
})
