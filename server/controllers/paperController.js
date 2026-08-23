const paperModel = require('../models/paperModel')
const paperSearch = require('../services/paperSearchService')
const { db } = require('../db/connection')
const path = require('path')
const fs = require('fs')

exports.list = (req, res) => {
  const { page = 1, pageSize = 10, category = 'all' } = req.query
  const result = paperModel.findAll({ page: +page, pageSize: +pageSize, category })
  res.json({ success: true, data: result })
}

exports.search = (req, res) => {
  const { keyword, category = 'all' } = req.body
  const list = paperModel.search(keyword, category)
  res.json({ success: true, data: { list, total: list.length } })
}

exports.detail = (req, res) => {
  const paper = paperModel.findById(+req.params.id)
  if (!paper) return res.status(404).json({ success: false, message: '论文不存在' })
  res.json({ success: true, data: paper })
}

exports.categories = (req, res) => {
  const data = paperModel.categories()
  res.json({ success: true, data })
}

// GET /api/papers/search/all — 混合检索：本地 + 外部
exports.searchAll = async (req, res) => {
  const { q, page = 1, pageSize = 20 } = req.query
  const keyword = (q || '').trim()
  if (!keyword) return res.status(400).json({ success: false, message: '请输入搜索关键词' })

  const localResults = paperModel.search(keyword)

  // 本地 >= pageSize 条就直接返回
  if (localResults.length >= pageSize) {
    const enriched = localResults.map(enrich)
    return res.json({ success: true, data: { list: enriched, total: enriched.length, source: 'local', hint: null } })
  }

  // 本地不够，走外部
  try {
    const ext = await paperSearch.searchExternal(keyword, pageSize)
    const saved = saveExternalPapers(ext.papers)
    const merged = [...localResults, ...saved].slice(0, pageSize * 2)
    res.json({
      success: true,
      data: {
        list: merged.map(enrich),
        total: merged.length,
        source: 'hybrid',
        hint: `外部检索成功 (${ext.source})，新论文已保存到本地`
      }
    })
  } catch (e) {
    // 外部失败，只返回本地
    res.json({
      success: true,
      data: {
        list: localResults.map(enrich),
        total: localResults.length,
        source: 'local',
        hint: '外部检索暂时不可用，仅显示本地结果 (' + e.message + ')'
      }
    })
  }
}

// GET /api/papers/search/external — 仅外部检索（保留兼容）
exports.searchExternal = async (req, res) => {
  const { q, page = 1, pageSize = 20 } = req.query
  if (!q || !q.trim()) return res.status(400).json({ success: false, message: '请输入搜索关键词' })
  try {
    const ext = await paperSearch.searchExternal(q.trim(), +pageSize)
    const saved = saveExternalPapers(ext.papers)
    res.json({ success: true, data: { list: saved.map(enrich), total: saved.length, source: ext.source } })
  } catch (e) {
    res.status(500).json({ success: false, message: '外部检索失败：' + e.message })
  }
}

// Save external papers to DB, dedup by title. Updates url on existing rows.
function saveExternalPapers(papers) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO papers (title, authors, abstract, keywords, category, year, source, citations, url, pdf_url, paper_source, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'external', '')
  `)
  const update = db.prepare('UPDATE papers SET url = ?, citations = ?, abstract = ? WHERE title = ? AND paper_source = ? AND (url IS NULL OR url = ?)')
  const select = db.prepare('SELECT * FROM papers WHERE title = ? AND paper_source = ?')

  const saved = []
  const runTx = db.transaction(() => {
    for (const p of papers) {
      if (!p.title) continue
      insert.run(p.title, p.authors || '', p.abstract || '', '', p.venue || '学术资源', p.year || null, p.source || '外部', p.citations || 0, p.url || '')
      update.run(p.url || '', p.citations || 0, p.abstract || '', p.title, 'external', '')
      const row = select.get(p.title, 'external')
      if (row) saved.push({ ...row, externalId: p.externalId, url: p.url || row.url, isExternal: true })
    }
  })

  try { runTx() } catch (e) { console.log('[paper] save external error:', e.message) }
  return saved
}

function enrich(p) {
  return {
    ...p,
    sourceLabel: p.paper_source || p.source || '本地',
    isExternal: (p.paper_source || p.source) === 'external' || p.source === 'Semantic Scholar' || p.source === 'CORE' || p.source === 'OpenAlex',
    shortAbstract: (p.abstract || '').slice(0, 200),
    displaySource: p.source || (p.paper_source === 'external' ? '外部检索' : '本地数据库'),
    url: p.url || '',
  }
}

// GET /api/papers/:id/download
exports.download = (req, res) => {
  const paper = paperModel.findById(+req.params.id)
  if (!paper || !paper.pdf_url) return res.status(404).json({ success: false, message: '论文或PDF不存在' })
  const filePath = path.join(__dirname, '..', paper.pdf_url)
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'PDF文件不存在' })
  res.download(filePath, `${paper.title || 'paper'}.pdf`)
}
