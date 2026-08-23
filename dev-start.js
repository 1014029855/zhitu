#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 一键启动前后端开发环境
 */

const { spawn } = require('child_process');
const path = require('path');

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`命令执行失败，退出码: ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function main() {
    log('\n🚀 开发环境启动工具', 'cyan');
    log('=' .repeat(50), 'cyan');
    
    log('\n📋 可用命令:', 'blue');
    log('  npm run dev:check     - 检查开发环境状态');
    log('  npm run dev:frontend  - 启动前端开发服务器');
    log('  npm run dev:backend   - 启动后端服务（需要在IDEA中手动启动）');
    log('  npm run dev:all       - 启动所有服务（前端 + 后端检查）');
    
    log('\n🎯 快速开始:', 'green');
    log('  1. 确保Node.js环境已配置');
    log('  2. 安装项目依赖: npm install');
    log('  3. 启动后端服务: npm start');
    log('  4. 启动前端服务: npm run dev:frontend');
    log('  5. 访问: http://localhost:8000/page/login/login.html');
    
    log('\n🔗 服务地址:', 'yellow');
    log('  前端开发服务器: http://localhost:8000');
    log('  后端API服务:    http://localhost:3000/api');
    log('  登录页面:       http://localhost:8000/page/login/login.html');
    
    log('\n👤 测试账号:', 'blue');
    log('  管理员:  admin / admin123');
    
    log('\n📖 开发文档:', 'cyan');
    log('  启动项目指南: 启动项目.md');
    
    log('\n' + '=' .repeat(50), 'cyan');
    log('🎉 开发环境配置完成！开始编码吧！', 'green');
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runCommand };