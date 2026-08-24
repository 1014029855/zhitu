const DEFAULT_MESSAGE = '本地代码执行已关闭，请配置独立的隔离判题服务后再试'

class SandboxUnavailableError extends Error {
  constructor(message = DEFAULT_MESSAGE) {
    super(message)
    this.name = 'SandboxUnavailableError'
    this.code = 'CODE_EXECUTION_UNAVAILABLE'
  }
}

function getStatus() {
  return {
    available: false,
    provider: 'disabled',
    message: DEFAULT_MESSAGE
  }
}

async function execute() {
  throw new SandboxUnavailableError()
}

module.exports = {
  execute,
  getStatus,
  SandboxUnavailableError
}
