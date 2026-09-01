const test = require('node:test')
const assert = require('node:assert/strict')
const sandboxService = require('../server/services/sandboxService')

async function withProvider(provider, task) {
  const previous = process.env.CODE_EXECUTION_PROVIDER
  process.env.CODE_EXECUTION_PROVIDER = provider
  try {
    return await task()
  } finally {
    if (previous === undefined) delete process.env.CODE_EXECUTION_PROVIDER
    else process.env.CODE_EXECUTION_PROVIDER = previous
  }
}

test('ordinary solutions pass the source policy', () => {
  assert.doesNotThrow(() => sandboxService._test.validateSource('python', 'print(input()[::-1])'))
  assert.doesNotThrow(() => sandboxService._test.validateSource('c++', '#include <iostream>\nint main() { std::cout << 1; }'))
  assert.doesNotThrow(() => sandboxService._test.validateSource('java', 'public class Main { public static void main(String[] args) {} }'))
})

test('common file, network and process access is rejected', () => {
  const rejected = error => error instanceof sandboxService.SandboxPolicyError && error.code === 'CODE_POLICY_REJECTED'
  assert.throws(() => sandboxService._test.validateSource('python', 'import socket'), rejected)
  assert.throws(() => sandboxService._test.validateSource('python', 'open("notes.txt")'), rejected)
  assert.throws(() => sandboxService._test.validateSource('c++', 'int main() { system("dir"); }'), rejected)
  assert.throws(() => sandboxService._test.validateSource('java', 'new ProcessBuilder("cmd").start();'), rejected)
})

test('child processes receive no application secrets', () => {
  const tools = sandboxService._test.inspectTools()
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'must-not-leak'
  try {
    const env = sandboxService._test.createChildEnvironment('C:\\Temp\\judge-test', tools)
    assert.equal(env.JWT_SECRET, undefined)
    assert.equal(env.DEEPSEEK_API_KEY, undefined)
    assert.equal(env.HOME, 'C:\\Temp\\judge-test')
    assert.equal(env.TEMP, 'C:\\Temp\\judge-test')
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
  }
})

test('disabled provider fails closed without invoking user code', async () => {
  await withProvider('disabled', async () => {
    const status = await sandboxService.getStatus('python')
    assert.equal(status.available, false)
    assert.equal(status.code, 'CODE_EXECUTION_DISABLED')
    await assert.rejects(
      sandboxService.execute({ code: 'print(1)', language: 'python', testCases: [] }),
      error => error instanceof sandboxService.SandboxUnavailableError && error.code === 'CODE_EXECUTION_DISABLED'
    )
  })
})

const runtimeCases = [
  {
    language: 'python',
    code: 'print(input()[::-1])'
  },
  {
    language: 'c++',
    code: '#include <algorithm>\n#include <iostream>\n#include <string>\nint main() { std::string value; std::cin >> value; std::reverse(value.begin(), value.end()); std::cout << value; }'
  },
  {
    language: 'java',
    code: 'import java.io.BufferedReader;\nimport java.io.InputStreamReader;\npublic class Main { public static void main(String[] args) throws Exception { String value = new BufferedReader(new InputStreamReader(System.in)).readLine(); System.out.print(new StringBuilder(value).reverse()); } }'
  }
]

for (const runtimeCase of runtimeCases) {
  test(`local ${runtimeCase.language} judge executes a normal solution`, async t => {
    await withProvider('local', async () => {
      const status = await sandboxService.getStatus(runtimeCase.language)
      if (!status.available) {
        t.skip(status.message)
        return
      }

      const result = await sandboxService.execute({
        code: runtimeCase.code,
        language: runtimeCase.language,
        testCases: [{ input: 'abc\n', expected: 'cba' }]
      })
      assert.equal(result.passed, true)
      assert.equal(result.error, null)
      assert.equal(result.testResults[0].actual, 'cba')
    })
  })
}

test('local runner terminates code that exceeds the time limit', async t => {
  await withProvider('local', async () => {
    const status = await sandboxService.getStatus('python')
    if (!status.available) {
      t.skip(status.message)
      return
    }

    const startedAt = Date.now()
    const result = await sandboxService.execute({
      code: 'while True:\n    pass',
      language: 'python',
      testCases: [{ input: '', expected: '' }]
    })
    assert.equal(result.passed, false)
    assert.match(result.error, /执行超时/)
    assert.ok(Date.now() - startedAt < 10000)
  })
})

test('local runner stops code that exceeds the output limit', async t => {
  await withProvider('local', async () => {
    const status = await sandboxService.getStatus('python')
    if (!status.available) {
      t.skip(status.message)
      return
    }

    const result = await sandboxService.execute({
      code: 'print("x" * 70000)',
      language: 'python',
      testCases: [{ input: '', expected: '' }]
    })
    assert.equal(result.passed, false)
    assert.match(result.error, /输出超过 64 KB 限制/)
  })
})
