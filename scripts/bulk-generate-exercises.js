/**
 * 批量 AI 出题 — 3 并发，0.3s 间隔
 * 用法：node scripts/bulk-generate-exercises.js
 */
const https = require('https')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const API_KEY = process.env.DEEPSEEK_API_KEY
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
const PARALLEL = 3    // 并发数
const DELAY_MS = 300  // 批次间隔

const LANGUAGES = ['python', 'c++', 'java']
const TOPICS = {
  easy: [
    '数组遍历', '字符串处理', '数学运算', '条件判断', '简单排序',
    '查找算法', '列表操作', '回文判断', '进制转换', '质数判断',
    '最大公约数', '最小公倍数', '水仙花数', '完数判断', '矩阵转置',
    '二分查找', '哈希表', '双指针', '栈操作', '队列操作',
    '前缀和', '滑动窗口', '位运算', '递归基础', '贪心入门'
  ],
  medium: [
    '三数之和', '四数之和', '最长子串', '有效括号生成',
    '组合总和', '全排列', '子集', '岛屿数量', '二叉树遍历',
    '二叉树层序遍历', '二叉搜索树', '图的遍历', '拓扑排序', '单词搜索',
    '最长回文子串', '最长递增子序列', '编辑距离', '背包问题', '零钱兑换',
    '打家劫舍', '跳跃游戏', '合并区间', '螺旋矩阵', '旋转数组',
    'LRU缓存', '并查集', 'Trie树', '堆排序', '快速排序'
  ],
  hard: [
    '正则表达式匹配', 'N皇后', '解数独', '单词接龙',
    '滑动窗口最大值', '接雨水', '柱状图最大矩形', '最小覆盖子串', '滑动谜题',
    '课程表', '网络延迟时间', 'K个一组翻转链表', '合并K个升序链表', '数据流中位数',
    '二叉树的序列化', '单词拆分', '戳气球', '不同子序列',
    '地下城游戏', '最大子矩阵', '最短回文串', '分割回文串', '正则匹配'
  ]
}

function chatCompletion(messages, retries = 2) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, messages, max_tokens: 4096, temperature: 0.8, stream: false })
    const url = new URL(BASE_URL)
    const req = https.request({
      hostname: url.hostname, port: 443, path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`, 'Content-Length': Buffer.byteLength(body) },
      timeout: 90000
    }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) {
            if (retries > 0) return setTimeout(() => chatCompletion(messages, retries - 1).then(resolve).catch(reject), 1000)
            return reject(new Error(json.error.message))
          }
          resolve(json.choices?.[0]?.message?.content || '')
        } catch (e) { reject(e) }
      })
    })
    req.on('error', (e) => {
      if (retries > 0) return setTimeout(() => chatCompletion(messages, retries - 1).then(resolve).catch(reject), 1000)
      reject(e)
    })
    req.write(body)
    req.end()
  })
}

function buildTask(topic, difficulty, language) {
  const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
  return [
    { role: 'system', content: `你是一位编程题库设计师。请生成一道编程练习题。只输出 JSON，不要其他内容。

知识点：${topic}  难度：${diffMap[difficulty]}  语言：${language}

{
  "title": "题目标题（10字以内）",
  "description": "题目描述（含输入输出格式、至少2个示例）",
  "difficulty": "${difficulty}",
  "category": "${topic}",
  "language": "${language}",
  "template_code": "模板代码（含函数签名和main入口）",
  "test_cases": [
    {"input": "输入1", "expected": "期望输出1"},
    {"input": "输入2", "expected": "期望输出2"},
    {"input": "输入3", "expected": "期望输出3"}
  ],
  "solution_code": "参考答案（正确最优解法）",
  "hint": "解题提示（30字以内，引导思考不给答案）"
}` },
    { role: 'user', content: '请生成题目' }
  ]
}

function parseJson(content) {
  try { return JSON.parse(content) } catch {}
  const m = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (m) { try { return JSON.parse(m[1]) } catch {} }
  const m2 = content.match(/\{[\s\S]*\}/)
  if (m2) { try { return JSON.parse(m2[0]) } catch {} }
  return null
}

// 构建所有任务
function buildAllTasks() {
  const tasks = []
  for (const [diff, topics] of Object.entries(TOPICS)) {
    for (const topic of topics) {
      // 每个 topic 分配到 3 种语言中的随机一种，确保语言分布均匀
      const lang = LANGUAGES[tasks.length % LANGUAGES.length]
      tasks.push({ topic, difficulty: diff, language: lang })
    }
  }
  return tasks
}

async function generateAll() {
  const db = require('../server/db/connection').db
  const insert = db.prepare(`
    INSERT INTO exercises (title, description, difficulty, category, language, template_code, test_cases, solution_code, hint, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `)

  const tasks = buildAllTasks()
  console.log(`共 ${tasks.length} 个任务，${PARALLEL} 并发\n`)

  let done = 0
  let fail = 0

  async function worker(task, i) {
    try {
      const msgs = buildTask(task.topic, task.difficulty, task.language)
      const content = await chatCompletion(msgs)
      const parsed = parseJson(content)
      if (!parsed || !parsed.title) {
        fail++
        console.log(`  ✗ [${i + 1}/${tasks.length}] ${task.difficulty}/${task.topic}/${task.language} — 解析失败`)
        return
      }
      insert.run(
        parsed.title, parsed.description || '', parsed.difficulty || task.difficulty,
        parsed.category || task.topic, parsed.language || task.language,
        parsed.template_code || '', JSON.stringify(parsed.test_cases || []),
        parsed.solution_code || '', parsed.hint || ''
      )
      done++
      console.log(`  ✓ [${done + fail}/${tasks.length}] ${parsed.difficulty}/${parsed.category}/${parsed.language} — ${parsed.title}`)
    } catch (e) {
      fail++
      console.log(`  ✗ [${done + fail}/${tasks.length}] ${task.topic} — ${e.message}`)
    }
  }

  // 分批执行
  for (let i = 0; i < tasks.length; i += PARALLEL) {
    const batch = tasks.slice(i, i + PARALLEL)
    await Promise.all(batch.map((t, j) => worker(t, i + j)))
    if (i + PARALLEL < tasks.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  const count = db.prepare('SELECT COUNT(*) as c FROM exercises').get().c
  console.log(`\n===== 完成！成功 ${done}，失败 ${fail}，题库共 ${count} 题 =====`)
}

generateAll()
