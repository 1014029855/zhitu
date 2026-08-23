#!/usr/bin/env node

/**
 * 开发环境检查脚本
 * 用于验证前后端分离开发环境配置是否正确
 */

const http = require('http');
const { exec } = require('child_process');

// 配置
const CONFIG = {
    FRONTEND_URL: 'http://localhost:8000',
    BACKEND_URL: 'http://localhost:3000/api',
    TIMEOUT: 5000
};

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPort(url, name) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            log(`✅ ${name} 服务正常运行 (${url})`, 'green');
            resolve(true);
        });
        
        req.on('error', (err) => {
            log(`❌ ${name} 服务未启动 (${url})`, 'red');
            log(`   错误信息: ${err.message}`, 'yellow');
            resolve(false);
        });
        
        req.setTimeout(CONFIG.TIMEOUT, () => {
            log(`⏰ ${name} 服务超时 (${url})`, 'yellow');
            resolve(false);
        });
    });
}

function checkBackendAPI() {
    return new Promise((resolve) => {
        const req = http.get(`${CONFIG.BACKEND_URL}/home/carousel`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.success && Array.isArray(json.data)) {
                        log(`✅ 后端API响应正常，数据格式正确`, 'green');
                        resolve(true);
                    } else {
                        log(`⚠️  后端API响应异常，数据格式错误`, 'yellow');
                        resolve(false);
                    }
                } catch (e) {
                    log(`⚠️  后端API响应异常，JSON解析失败`, 'yellow');
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            log(`❌ 后端API连接失败: ${err.message}`, 'red');
            resolve(false);
        });
        
        req.setTimeout(CONFIG.TIMEOUT, () => {
            log(`⏰ 后端API请求超时`, 'yellow');
            resolve(false);
        });
    });
}

function checkSQLite() {
    return new Promise((resolve) => {
        const path = require('path');
        const fs = require('fs');
        const dbPath = path.join(__dirname, 'data', 'platform.db');
        
        if (fs.existsSync(dbPath)) {
            log(`✅ SQLite数据库已创建 (${dbPath})`, 'green');
            resolve(true);
        } else {
            log(`⚠️  SQLite数据库尚未创建`, 'yellow');
            log(`   首次启动时会自动创建数据库`, 'yellow');
            resolve(true);
        }
    });
}

async function main() {
    log('\n🔍 开发环境检查工具', 'blue');
    log('=' .repeat(50), 'blue');
    
    log('\n📋 检查项目:');
    
    // 检查各个服务
    const results = await Promise.all([
        checkPort(CONFIG.FRONTEND_URL, '前端开发服务器'),
        checkPort(CONFIG.BACKEND_URL, '后端API服务'),
        checkBackendAPI(),
        checkSQLite()
    ]);
    
    log('\n📊 检查结果汇总:', 'blue');
    
    const [frontend, backend, api, mysql] = results;
    const total = results.length;
    const passed = results.filter(Boolean).length;
    
    if (passed === total) {
        log(`🎉 所有服务运行正常！可以开始开发工作了`, 'green');
        log(`\n🚀 快速开始:`, 'blue');
        log(`   前端访问: ${CONFIG.FRONTEND_URL}/page/login/login.html`);
        log(`   后端API: ${CONFIG.BACKEND_URL}`);
        log(`   测试账号: admin/admin123`);
    } else {
        log(`⚠️  发现 ${total - passed} 个问题需要解决`, 'yellow');
        log(`\n🔧 解决建议:`, 'blue');
        
        if (!backend || !api) {
            log(`   1. 启动后端服务`);
            log(`      - 在项目根目录运行: npm start`);
            log(`      - 后端服务地址: http://localhost:3000`);
        }
        
        if (!frontend) {
            log(`   2. 启动前端服务`);
            log(`      - 在项目根目录运行: npm run dev:frontend`);
            log(`      - 或运行: npx vite --config vite.config.js`);
            log(`      - 前端服务地址: http://localhost:8000`);
        }
    }
    
    log('\n' + '=' .repeat(50), 'blue');
}

// 运行检查
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkPort, checkBackendAPI, checkSQLite };