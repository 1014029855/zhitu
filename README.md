# 知途 — AI 通识智研与算法赋能空间

大学生知识通识平台：竞赛发现 × 技能建构 × 学术产出，AI算法驱动的全链路成长空间。

**技术栈**: Vue 3 + Vite + Express + better-sqlite3

---

## 队友快速上手（新电脑第一次）

### 1. 环境要求

- **Node.js** >= 18.x
- **npm** >= 9.x（随 Node.js 自带）

### 2. 克隆项目

```bash
git clone <仓库地址>
cd Q1.1
```

### 3. 安装依赖

```bash
npm install
```

### 4. 配置环境变量

```bash
cp .env.example .env
```

然后编辑 `.env`，填入真实的 API key：

```
DEEPSEEK_API_KEY=你的真实key
```

### 5. 启动后端

```bash
npm start
```

看到 `API server running on http://localhost:1234` 表示后端 OK。

### 6. 新开一个终端，启动前端

```bash
npx vite --config vite.config.js
```

看到 `Local: http://localhost:4321/` 表示前端 OK。

### 7. 打开浏览器访问

```
http://localhost:4321
```

---

## 项目结构

```
Q1.1/
├── server/                     # 后端
│   ├── index.js                # Express 主入口
│   ├── db/                     # 数据库层
│   │   ├── connection.js       # SQLite 连接
│   │   ├── schema.js           # 建表
│   │   └── seed.js             # 初始数据
│   ├── middleware/              # 中间件（auth、validate）
│   └── routes/                 # 各模块路由
│
├── src/                        # 前端 Vue 3
│   ├── App.vue                 # 根组件
│   ├── main.js                 # 入口
│   ├── router/index.js         # 路由配置
│   ├── views/                  # 页面组件
│   ├── components/             # 通用组件
│   └── composables/            # 组合式函数
│
├── assets/                     # 静态资源
├── docs/                       # 文档（PPT规划等）
├── scripts/                    # 工具脚本（PPT生成等）
├── .env.example                # 环境变量模板（可提交git）
├── .env                        # 真实环境变量（不提交git！）
├── vite.config.js              # Vite 配置
└── package.json
```

---

## 启动命令速查

| 命令 | 干什么 |
|------|--------|
| `npm start` | 启动后端 API（端口 1234） |
| `npx vite --config vite.config.js` | 启动前端开发服务器（端口 4321） |
| `npm run build` | 构建前端生产版本到 dist/ |
| `node dev-check.js` | 检查开发环境状态 |

---

## 默认测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

首次启动自动创建数据库 `data/platform.db` 并写入初始数据。

---

## 功能模块

### 用户
- 注册（学生/教师/管理员三种角色）
- 登录（JWT 认证）
- 个人信息管理

### 竞赛
- 竞赛列表、搜索、筛选
- 竞赛详情 + 报名

### 技能
- 技能分类、列表
- 学习资源 + 进度跟踪

### 论文
- 论文检索、详情、收藏

### AI 智研
- DeepSeek 大模型对话
- 学习路径规划

### 代码实训
- Monaco Editor 在线编程
- 自动判题 + 排行榜

---

## API 概览

| 模块 | 路径前缀 | 说明 |
|------|---------|------|
| 认证 | `/api/auth/*` | 登录、注册 |
| 首页 | `/api/home/*` | 轮播图、推荐、统计 |
| 竞赛 | `/api/competition/*` | 列表、搜索、详情 |
| 技能 | `/api/skill/*` | 列表、分类、详情 |
| 论文 | `/api/paper/*` | 列表、搜索、详情 |
| 用户 | `/api/user/*` | 个人信息 |
| 教师 | `/api/teacher/*` | 内容提交 |
| 管理员 | `/api/admin/*` | 审核、用户管理 |
| AI | `/api/ai/*` | DeepSeek 对话 |
| 实训 | `/api/exercise/*` | 编程题、评测 |
| 排行榜 | `/api/leaderboard/*` | 排名数据 |

详细 API 文档：`API文档.md`

---

## 开发注意事项

1. **不要提交 `.env`** — API key 在里面，已加入 `.gitignore`
2. **数据库文件** `data/platform.db` 不提交 — 每个队友首次启动会自动创建
3. **前后端分离** — 后端 :1234，前端 :4321，Vite proxy 自动转发 `/api` 请求
4. **JWT 密钥**生产环境必须更换

---

## License

MIT
