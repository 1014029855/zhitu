const test = require('node:test')
const assert = require('node:assert/strict')
const sandboxService = require('../server/services/sandboxService')

test('container arguments enforce the sandbox boundaries', () => {
  const args = sandboxService._test.buildContainerArgs({
    name: 'zhitu-sandbox-test',
    image: 'python:3.13-alpine',
    sourceDir: 'C:\\Temp\\source',
    command: ['python', '-I', '-B', '/workspace/solution.py']
  })

  const joined = args.join(' ')
  assert.match(joined, /--network none/)
  assert.match(joined, /--read-only/)
  assert.match(joined, /--cap-drop ALL/)
  assert.match(joined, /no-new-privileges=true/)
  assert.match(joined, /--memory 256m/)
  assert.match(joined, /--memory-swap 256m/)
  assert.match(joined, /--cpus 0\.50/)
  assert.match(joined, /--pids-limit 32/)
  assert.match(joined, /--user 65534:65534/)
  assert.match(joined, /target=\/workspace,readonly/)
  assert.match(joined, /--pull never/)
  assert.match(joined, /--interactive/)
})

test('disabled provider fails closed without invoking user code', async () => {
  const previous = process.env.CODE_EXECUTION_PROVIDER
  process.env.CODE_EXECUTION_PROVIDER = 'disabled'

  try {
    const status = await sandboxService.getStatus('python')
    assert.equal(status.available, false)
    assert.equal(status.code, 'CODE_EXECUTION_DISABLED')
    await assert.rejects(
      sandboxService.execute({ code: 'print(1)', language: 'python', testCases: [] }),
      error => error instanceof sandboxService.SandboxUnavailableError && error.code === 'CODE_EXECUTION_DISABLED'
    )
  } finally {
    if (previous === undefined) delete process.env.CODE_EXECUTION_PROVIDER
    else process.env.CODE_EXECUTION_PROVIDER = previous
  }
})
