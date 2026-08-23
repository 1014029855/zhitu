/**
 * Multi-source paper search with fallback chain
 * Semantic Scholar → CORE → OpenAlex
 */
const https = require('https')

const UA = 'Q1.1-Knowledge-Platform/1.0'
const TIMEOUT = 12000

function httpGetJSON(hostname, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET', headers: { 'User-Agent': UA }, timeout: TIMEOUT }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          if (res.statusCode === 429) return reject(new Error('rate_limited'))
          if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`))
          resolve(JSON.parse(data))
        } catch { reject(new Error('parse_error')) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

// Source 1: Semantic Scholar (free, no key, 100req/5min)
async function searchSemanticScholar(q, limit) {
  const path = `/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=${limit}&fields=paperId,title,authors,abstract,year,venue,citationCount,externalIds,url`
  const json = await httpGetJSON('api.semanticscholar.org', path)
  return (json.data || []).map(p => ({
    externalId: p.paperId,
    title: p.title || '',
    authors: (p.authors || []).map(a => a.name).join(', '),
    abstract: p.abstract || '',
    year: p.year,
    venue: p.venue || 'Semantic Scholar',
    citations: p.citationCount || 0,
    url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
    source: 'Semantic Scholar'
  }))
}

// Source 2: CORE API (free, no key)
async function searchCore(q, limit) {
  const path = `/api-v2/articles/search/${encodeURIComponent(q)}?page=1&pageSize=${limit}`
  const json = await httpGetJSON('api.core.ac.uk', path)
  return (json.data || json.results || []).map(r => ({
    externalId: r.id || r.doi,
    title: r.title || '',
    authors: (r.authors || []).map(a => typeof a === 'string' ? a : a.name).join(', '),
    abstract: r.abstract || r.description || '',
    year: r.yearPublished || r.year,
    venue: r.publisher || r.journals?.[0]?.title || 'CORE',
    citations: r.citationCount || 0,
    url: r.downloadUrl || r.links?.[0]?.url || `https://core.ac.uk/works/${r.id}`,
    source: 'CORE'
  }))
}

// Source 3: OpenAlex (free, no key)
async function searchOpenAlex(q, limit) {
  const path = `/works?search=${encodeURIComponent(q)}&per_page=${limit}&sort=cited_by_count:desc`
  const json = await httpGetJSON('api.openalex.org', path)
  return (json.results || []).map(r => ({
    externalId: r.id,
    title: r.title || '',
    authors: (r.authorships || []).map(a => a.author?.display_name || '').filter(Boolean).join(', '),
    abstract: (r.abstract_inverted_index ? rebuildInvertedAbstract(r.abstract_inverted_index) : ''),
    year: r.publication_year,
    venue: r.primary_location?.source?.display_name || 'OpenAlex',
    citations: r.cited_by_count || 0,
    url: r.doi ? (r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`) : (r.primary_location?.landing_page_url || r.id),
    source: 'OpenAlex'
  }))
}

function rebuildInvertedAbstract(inverted) {
  if (!inverted) return ''
  const maxPos = Math.max(...Object.values(inverted).flat())
  const words = new Array(maxPos + 1)
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) words[pos] = word
  }
  return words.join(' ')
}

/**
 * Search with fallback chain.
 * Returns { papers, source: 'local'|'semantic_scholar'|'core'|'openalex' }
 */
async function searchExternal(q, limit = 20) {
  const sources = [
    { name: 'Semantic Scholar', fn: () => searchSemanticScholar(q, limit) },
    { name: 'CORE', fn: () => searchCore(q, limit) },
    { name: 'OpenAlex', fn: () => searchOpenAlex(q, limit) },
  ]

  for (const src of sources) {
    try {
      const papers = await src.fn()
      if (papers.length > 0) {
        return { papers, source: src.name.toLowerCase().replace(/\s/g, '_') }
      }
    } catch (e) {
      console.log(`[paper-search] ${src.name} failed: ${e.message}`)
      continue
    }
  }

  throw new Error('所有外部论文检索源暂时不可用，请稍后重试')
}

module.exports = { searchExternal }
