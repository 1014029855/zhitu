# P0 安全基线

更新日期：2026-08-24

## 代码判题

项目不再在宿主机直接运行学生代码。判题使用一次性 Docker 容器，并限制网络、文件系统、权限、CPU、内存、进程数、输出和运行时间。

Docker 未启动或对应语言镜像未准备时，`/api/ai/judge` 会安全地返回 `503`。启动 Docker Desktop 后运行 `npm run sandbox:setup` 可准备 Python；C++ 和 Java 分别使用 `npm run sandbox:setup -- c++`、`npm run sandbox:setup -- java` 按需准备，也可以运行 `npm run sandbox:setup:all` 一次准备全部语言。

每次提交只挂载一个临时源码目录；源码只读，编译产物目录在执行阶段也只读。容器不挂载项目目录、数据库、环境变量或 Docker socket，执行结束后自动删除。

## 默认账号

默认管理员、学生和教师账号只在非生产环境首次创建，不再覆盖已经存在的密码或资料。生产环境默认不创建这些账号；只有显式设置 `SEED_DEFAULT_USERS=true` 才会创建缺失账号。

## 接口限流

- 登录：每个 IP 每 15 分钟最多 10 次失败尝试。
- 注册与密码重置：每个 IP 每小时最多 5 次操作。
- 验证码：每个 IP 每 15 分钟最多 60 次。
- AI：每个 IP 每 10 分钟最多 30 次。
- 判题：每个 IP 每分钟最多 10 次。
- 上传：每个 IP 每小时最多 20 次。

限流配置位于 `server/middleware/rateLimits.js`。上传同时限制文件数量、字段数量、文件大小、扩展名与 MIME 类型。

## 依赖

安全依赖升级后，`npm audit` 为 0 个已知漏洞。安装依赖时必须保留 `package-lock.json` 与 `package.json` 中的安全版本覆盖配置。
