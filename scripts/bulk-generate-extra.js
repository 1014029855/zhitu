/**
 * 补充出题 — 补齐到 100+
 */
const https = require('https')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const API_KEY = process.env.DEEPSEEK_API_KEY
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
const PARALLEL = 3

const EXTRA_TOPICS = {
  easy: [
    '斐波那契数列', '阶乘计算', '判断闰年', '九九乘法表', '三角形判断',
    '数组去重', '字符串反转', '合并有序数组', '缺失数字', '两数之和',
    '买卖股票', '爬楼梯', '移动零', '有效的括号'
  ],
  medium: [
    '搜索旋转排序数组', '在排序数组中查找元素', '组合', '子集II',
    '复原IP地址', '括号生成', '电话号码的字母组合', '单词拆分II',
    '分割回文串II', '最长有效括号', '不同路径', '最小路径和',
    '最大正方形', '完全平方数', '最长上升子序列', '乘积最大子数组'
  ],
  hard: [
    '最大矩形', '最短回文串II', '分割回文串III',
    '通配符匹配', '计算右侧小于当前元素的个数', '区间和的个数',
    '天际线问题', '基本计算器', '基本计算器II', '滑动窗口中位数'
  ]
}

const LANGUAGES = ['python', 'c++', 'java']

function chatCompletion(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, messages, max_tokens: 4096, temperature: 0.8 })
    const url = new URL(BASE_URL)
    const req = https.request({
      hostname: url.hostname, port: 443, path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`, 'Content-Length': Buffer.byteLength(body) },
      timeout: 90000
    }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data).choices?.[0]?.message?.content || '') } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body); req.end()
  })
}

function parseJson(content) {
  try { return JSON.parse(content) } catch {}
  const m = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (m) { try { return JSON.parse(m[1]) } catch {} }
  const m2 = content.match(/\{[\s\S]*\}/)
  if (m2) { try { return JSON.parse(m2[0]) } catch {} }
  return null
}

function buildTasks() {
  const tasks = []
  for (const [diff, topics] of Object.entries(EXTRA_TOPICS)) {
    for (const topic of topics) {
      tasks.push({ topic, difficulty: diff, language: LANGUAGES[tasks.length % 3] })
    }
  }
  return tasks
}

async function main() {
  const db = require('../server/db/connection').db
  const currentCount = db.prepare('SELECT COUNT(*) as c FROM exercises').get().c
  const needed = Math.max(0, 105 - currentCount)
  if (needed <= 0) {
    console.log(`已有 ${currentCount} 题，无需补充`)
    return
  }

  const allTasks = buildTasks().slice(0, needed + 10) // +10 buffer for failures
  console.log(`当前 ${currentCount} 题，需补 ${needed} 题，共 ${allTasks.length} 个任务\n`)

  const insert = db.prepare(`
    INSERT INTO exercises (title, description, difficulty, category, language, template_code, test_cases, solution_code, hint, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `)

  let done = 0, fail = 0

  for (let i = 0; i < allTasks.length; i += PARALLEL) {
    const batch = allTasks.slice(i, i + PARALLEL)
    const results = await Promise.all(batch.map(async (t) => {
      try {
        const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
        const msgs = [
          { role: 'system', content: `生成一道编程题。只输出JSON。\n知识点：${t.topic} 难度：${diffMap[t.difficulty]} 语言：${t.language}\n\n{"title":"标题","description":"描述含示例","difficulty":"${t.difficulty}","category":"${t.topic}","language":"${t.language}","template_code":"框架","test_cases":[{"input":"","expected":""}],"solution_code":"答案","hint":"提示"}` },
          { role: 'user', content: '生成' }
        ]
        const content = await chatCompletion(msgs)
        const p = parseJson(content)
        if (!p || !p.title) return null
        insert.run(p.title, p.description || '', p.difficulty || t.difficulty, p.category || t.topic, p.language || t.language, p.template_code || '', JSON.stringify(p.test_cases || []), p.solution_code || '', p.hint || '')
        return p.title
      } catch { return null }
    }))

    for (const r of results) {
      if (r) { done++; console.log(`  ✓ ${r}`) }
      else { fail++; console.log(`  ✗ 失败`) }
    }
    if (i + PARALLEL < allTasks.length) await new Promise(r => setTimeout(r, 300))
  }

  const final = db.prepare('SELECT COUNT(*) as c FROM exercises').get().c
  console.log(`\n完成！题库共 ${final} 题`)
}

main()
