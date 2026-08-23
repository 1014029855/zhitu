/**
 * Semantic Scholar API Service — 学术论文检索
 * 免费，无需 API Key，速率限制 100 req/5min
 */
const https = require('https')

const BASE = 'api.semanticscholar.org'

function searchPapers(q, page = 1, pageSize = 10) {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * pageSize
    const path = `/graph/v1/paper/search?query=${encodeURIComponent(q)}&offset=${offset}&limit=${pageSize}&fields=paperId,title,authors,abstract,year,venue,citationCount,url,externalIds`

    const opts = {
      hostname: BASE,
      path,
      method: 'GET',
      headers: { 'User-Agent': 'Q1.1-Knowledge-Platform/1.0' },
      timeout: 15000
    }

    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          if (res.statusCode === 429) {
            return reject(new Error('请求过于频繁，请稍后再试（免费 API 限制 100次/5分钟）'))
          }
          const json = JSON.parse(data)
          if (json.error) return reject(new Error(json.error))

          const papers = (json.data || []).map(p => ({
            paperId: p.paperId,
            title: p.title || '',
            authors: (p.authors || []).map(a => a.name).join(', '),
            abstract: p.abstract || '',
            year: p.year,
            venue: p.venue || '',
            citations: p.citationCount || 0,
            url: p.url || (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : ''),
            source: 'external'
          }))

          resolve({
            total: json.total || 0,
            page,
            pageSize,
            papers
          })
        } catch (e) {
          reject(new Error('Failed to parse Semantic Scholar response'))
        }
      })
    })

    req.on('error', (e) => reject(new Error('网络连接失败，请检查网络后重试')))
    req.on('timeout', () => { req.destroy(); reject(new Error('Semantic Scholar 响应超时')) })
    req.end()
  })
}

module.exports = { searchPapers }
