# api-transfer-ui 全新前端子模块脚手架 — 设计 spec

**日期**：2026-06-09
**状态**：已评审通过，待 TDD/实施
**关联记忆**：`nexus-ui-overhaul-execution`（从零重做整个产品 UI）、`web-frontend-adaptation`

> 备注：本 spec 暂存于后端仓库 `docs/superpowers/specs/`；待 `api-transfer-ui/` 子模块建好后挪入前端仓库（用户定：方案 B）。

---

## 1. 背景与目标

根项目 `api-transfer` 是 Spring Boot 后端。现有 `web/` 子模块（`github.com/chjiae/api-transfer-web.git`）是一套完整但将被弃用的 Vue 3 前端。

依据「从零重做整个产品 UI」的定调，本次**不**在旧 `web` 上改，而是**新增一个干净的前端子模块 `api-transfer-ui`**,只从 `web/bun.lock` / `package.json` 取**基础技术栈**,不全量照搬重型依赖。

**本次范围仅限脚手架**：把新子模块建好、技术栈装好、能起能 build 的纯静态占位骨架。不迁移任何旧页面/组件/接口逻辑。

### 红线
- 后端契约不变（接口/字段不动）。
- 旧 `web/` 子模块本次**保持不动**（参考/兜底，暂不删除）。

---

## 2. 已确认决策（用户拍板）

| # | 决策 |
|---|---|
| 1 | `web` 准备弃用，但本次**暂不删除**；`api-transfer-ui` 为今后真正的前端 |
| 2 | 新子模块**先纯本地**：初始化为独立 git 仓库，`.gitmodules` 登记占位远端 URL，**不建 GitHub 远端、不首次 push**（由用户后续手动完成） |
| 3 | 技术栈**对齐现有 `web` 的基础档**（Rsbuild + Tailwind v4 + shadcn-vue），重型依赖一律不装 |
| 4 | 占位首页**纯静态**,不做后端探活 |
| 5 | 本次**不配** ESLint / Prettier |
| 6 | 不留 axios 骨架（YAGNI），dev 代理配置保留备用 |
| 7 | spec 先写后端仓库，待子模块建好后挪入前端仓库 |

---

## 3. 子模块与仓库

- 在 `api-transfer/` 下新增目录 `api-transfer-ui/`,`git init` 为**独立仓库**（与后端、与旧 `web` 三者提交历史互不影响）。
- 在根 `.gitmodules` 追加：
  ```ini
  [submodule "api-transfer-ui"]
      path = api-transfer-ui
      url = https://github.com/chjiae/api-transfer-ui.git
  ```
  远端先不存在不影响本地开发；用户后续在 GitHub 建同名空仓库后自行 `git remote add origin <url>` + 首次 `push`。
- 后端仓库只记录 gitlink（指向前端某 commit），不含前端源码。

---

## 4. 技术栈（A 方案：对齐 `web` 基础档）

| 类别 | 选型 |
|---|---|
| 框架 | Vue 3.5（`<script setup>` + Composition API） |
| 语言 | TypeScript（strict） |
| 构建 | Rsbuild（`@rsbuild/core` + `@rsbuild/plugin-vue`） |
| 路由 | vue-router 4 |
| 状态 | Pinia |
| HTTP | axios（**装为依赖**,但本次不建客户端实例；首次发请求时再用） |
| 样式 | Tailwind v4（`tailwindcss` + `@tailwindcss/postcss` + `postcss`） |
| UI | shadcn-vue（**不预装组件**,用到再 `add`）+ `lucide-vue-next` 图标 |
| cn 工具 | `clsx` + `tailwind-merge` |

> axios 列为依赖以对齐基础栈并避免之后再改 `package.json`；本次代码不创建实例、不发请求。

**明确不装**：i18n（vue-i18n/i18next）、图表（@visactor/vchart）、Three.js/TresJS、GSAP/motion/motion-v、AI SDK（ai/sse.js/tokenlens）、shiki、vanta、lenis、date-fns/dayjs、zod 等全部重型/可选依赖——需要时再加。

**包管理**：Bun（本机 1.3.14，与 `web` 一致）。

---

## 5. 项目骨架

```
api-transfer-ui/
├── .gitignore
├── .node-version            # 24
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── rsbuild.config.ts        # /api、/v1 → http://localhost:8080 dev 代理（保留备用）
├── postcss.config.mjs
├── components.json          # shadcn-vue 配置（base 风格、neutral 基色、@ 别名）
├── index.html
└── src/
    ├── main.ts              # createApp + router + pinia 装配
    ├── App.vue              # <RouterView />
    ├── router/index.ts      # 一条占位路由 → HomeView
    ├── stores/.gitkeep      # 空目录占位
    ├── lib/utils.ts         # cn() = twMerge(clsx(...))
    ├── styles/index.css     # Tailwind v4 入口 + 基础 CSS 变量
    └── views/
        └── HomeView.vue     # 纯静态占位页（验证 Tailwind 生效）
```

### 关键文件要点

- **`rsbuild.config.ts`**：参照现有 `web`，配 `@` → `src` 别名、`pluginVue()`、dev server 代理 `/api` 与 `/v1` 到 `http://localhost:8080`（`changeOrigin: true`）。不抄 `web` 里的 splitChunks/TresJS 自定义元素等与重型依赖相关的配置。
- **`styles/index.css`**：Tailwind v4 `@import "tailwindcss"`,定义最小 CSS 变量（背景/前景），供占位页与未来 shadcn 组件用。
- **`src/network/`**：本次**不创建**（无 axios 实例）。
- **`components.json`**：使 `shadcn-vue add <component>` 可直接用；别名与 `web` 对齐（`@/components`、`@/lib/utils` 等）。

---

## 6. 验收标准（本次「完成」定义）

1. `bun install` 成功。
2. `bun run dev` 能起，浏览器打开占位首页正常渲染，**Tailwind 样式生效**。
3. `bun run build` 能产出 `dist/`。
4. `api-transfer-ui/` 为干净的独立 git 仓库（已 `git init`、有初始 commit）；根 `.gitmodules` 已登记该子模块。
5. 产物**不含**任何旧 `web` 的业务代码或重型依赖。

---

## 7. 范围外（YAGNI，本次不做）

- 不迁移任何旧页面/组件/接口逻辑（后续按「功能事实」另起 spec）。
- 不配置 ESLint / Prettier / i18n / 测试框架。
- 不创建 axios 客户端、不发任何后端请求。
- 不建 GitHub 远端、不做首次 push（用户后续手动）。
- 不删除旧 `web` 子模块。
