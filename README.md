# 塔罗静室 MVP

一个中文塔罗自我探索应用，包含问题分类、三张牌阵、解读、反思记录和历史旅程。

## 技术栈

- Vinext / Next.js App Router
- React 19 + TypeScript
- Cloudflare Workers
- Cloudflare D1 + Drizzle ORM

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

默认本地地址为 `http://localhost:3000`；如果端口已被占用，以终端显示的实际地址为准。

## 上传前验证

```bash
npm run lint
npm run build
```

## Kimi Claw 交接

Kimi Claw 可以在云端 OpenClaw 工作区中克隆、检查、构建并继续部署本仓库。本项目的服务端依赖 Cloudflare D1，所以对外发布时需要将名为 `DB` 的 D1 数据库绑定到 Worker；Kimi Claw 是执行和运维入口，网站运行时仍使用 Cloudflare Workers/D1 或兼容的 Sites 托管。

可在 Kimi Claw 终端中先执行：

```bash
git clone <GitHub 仓库地址>
cd tarot-sanctuary-mvp
npm ci
npm run lint
npm run build
```

建议交给 Kimi Claw 的指令：

> 请先检查 README、`.openai/hosting.json`、`vite.config.ts` 和 D1 数据库绑定，再执行 `npm ci`、`npm run lint` 和 `npm run build`。部署时保留 `DB` 绑定和 `drizzle/` 迁移文件。不要将 Cloudflare Token、GitHub Token 或任何 `.env` 内容写入仓库；变更前先给出待执行清单，部署后验证首页和全部 `/api/readings` 路由。

## 数据与安全

- 本地环境变量文件 `.env*` 已被 Git 忽略。
- 请不要在仓库内提交 API Token、GitHub Token 或 Cloudflare Token。
- 用户反思内容在浏览器端加密后再传输；安全与隐私提示应在正式发布前继续保留。

## 目录说明

- `app/`：页面、交互和 API 路由
- `lib/`：牌组与解读逻辑
- `db/`：D1/Drizzle 数据访问与表定义
- `drizzle/`：数据库迁移
- `public/`：静态资源

