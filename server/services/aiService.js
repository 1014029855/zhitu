const https = require('https')

const config = {
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  chatModel: process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat'
}

function assertApiKey() {
  if (!config.apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }
}

function chatCompletion({ systemPrompt, userMessage, history = [], maxTokens = 2048, temperature = 0.7, model = config.model }) {
  return new Promise((resolve, reject) => {
    try {
      assertApiKey()
    } catch (error) {
      reject(error)
      return
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ]
    const body = JSON.stringify({ model: model, messages, max_tokens: maxTokens, temperature, stream: false })
    const url = new URL(config.baseUrl)
    const req = https.request({
      hostname: url.hostname, port: 443, path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}`, 'Content-Length': Buffer.byteLength(body) },
      timeout: 60000
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) return reject(new Error(json.error.message || 'API error'))
          const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.message?.reasoning_content || ''
          resolve({ content, usage: json.usage || {} })
        } catch (e) { reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('API timeout')) })
    req.write(body)
    req.end()
  })
}

function chatStream({ systemPrompt, history = [], maxTokens = 2048, temperature = 0.7 }) {
  return new Promise((resolve, reject) => {
    try {
      assertApiKey()
    } catch (error) {
      reject(error)
      return
    }

    const messages = [{ role: 'system', content: systemPrompt }, ...history]
    const body = JSON.stringify({ model: config.model, messages, max_tokens: maxTokens, temperature, stream: true })
    const url = new URL(config.baseUrl)
    const req = https.request({
      hostname: url.hostname, port: 443, path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}`, 'Content-Length': Buffer.byteLength(body) },
      timeout: 90000
    }, (res) => {
      if (res.statusCode >= 400) {
        let d = ''; res.on('data', c => d += c); res.on('end', () => { try { reject(new Error(JSON.parse(d).error?.message || `HTTP ${res.statusCode}`)) } catch { reject(new Error(`HTTP ${res.statusCode}`)) } })
        return
      }
      resolve(res)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('API timeout')) })
    req.write(body)
    req.end()
  })
}

function isConfigured() {
  return Boolean(config.apiKey)
}

module.exports = { chatCompletion, chatStream, chatModel: config.chatModel, isConfigured }
