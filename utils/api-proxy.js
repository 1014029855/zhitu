/**
 * DeepSeek API 本地代理 — TCP Keepalive 修复
 *
 * 问题：Claude Code (Bun) 直连 api.deepseek.com 时，tool 执行期间 TCP socket 空闲，
 *       被路由器/ISP 静默断开，下次 API 调用报 "socket connection was closed unexpectedly"
 *
 * 修复：本地代理在上下游 socket 都启用 SO_KEEPALIVE（15s 探测），确保路由器不会断开空闲连接
 *
 * 使用：node utils/api-proxy.js
 *       然后修改 settings.json: ANTHROPIC_BASE_URL = "http://localhost:9090/anthropic"
 */

const http = require('http');
const https = require('https');
const tls = require('tls');

const PROXY_PORT = 9090;
const TARGET_HOST = 'api.deepseek.com';
const KEEPALIVE_MS = 15000; // 15 秒发送一次 TCP keepalive 探测
const LOG_PREFIX = '[api-proxy]';

// 为上游连接创建 agent，启用 TCP SO_KEEPALIVE
const upstreamAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 8,
  maxFreeSockets: 4,
  timeout: 300000, // 5 min socket timeout
});

// 在每个新 socket 上设置 TCP keepalive
upstreamAgent.on('key', (_agentId, socket) => {
  socket.setKeepAlive(true, KEEPALIVE_MS);
  socket.on('error', (err) => {
    // 静默处理 socket 错误，agent 会创建新连接
    if (process.env.VERBOSE) {
      console.error(`${LOG_PREFIX} upstream socket error (will retry):`, err.message);
    }
  });
});

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`${LOG_PREFIX} ${ts} ${msg}`);
}

const server = http.createServer((clientReq, clientRes) => {
  const startTime = Date.now();

  const options = {
    hostname: TARGET_HOST,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: TARGET_HOST },
    agent: upstreamAgent,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const elapsed = Date.now() - startTime;
    log(`${clientReq.method} ${clientReq.url} → ${proxyRes.statusCode} (${elapsed}ms)`);
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('timeout', () => {
    log(`TIMEOUT ${clientReq.method} ${clientReq.url}`);
    proxyReq.destroy(new Error('Proxy upstream timeout'));
  });

  proxyReq.on('error', (err) => {
    // ECONNRESET / socket hang up — socket 断连，agent 会自动重试
    log(`UPSTREAM ERROR: ${err.code || err.message} — will be retried by Claude Code`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end('Upstream error — retry');
    }
  });

  // 客户端 socket 也启用 TCP keepalive（虽然是 localhost，但无害）
  clientReq.socket.setKeepAlive(true, KEEPALIVE_MS);

  clientReq.pipe(proxyReq);
});

// 错误处理
server.on('error', (err) => {
  console.error(`${LOG_PREFIX} SERVER ERROR:`, err.message);
  process.exit(1);
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  log(`Proxy started on http://127.0.0.1:${PROXY_PORT}`);
  log(`Target: https://${TARGET_HOST}`);
  log(`TCP keepalive: ${KEEPALIVE_MS}ms`);
  log('Press Ctrl+C to stop');
});
