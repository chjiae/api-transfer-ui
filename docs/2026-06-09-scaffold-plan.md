# api-transfer-ui 脚手架 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在根项目下新增独立 git 子模块 `api-transfer-ui`,初始化一套对齐现有 `web` 基础栈（Rsbuild + Vue3 + TS + Tailwind v4 + shadcn-vue）的纯静态占位前端骨架，能 `install` / `dev` / `build`。

**Architecture:** 全新独立 git 仓库挂在后端 `api-transfer-ui/` 目录，后端仅记 gitlink。技术栈只取基础档，重型依赖一律不装。本次只产出能跑能 build 的占位骨架，不迁移任何旧业务逻辑。

**Tech Stack:** Vue 3.5、TypeScript、Rsbuild、vue-router 4、Pinia、axios（仅装不用）、Tailwind v4、shadcn-vue、lucide-vue-next、clsx + tailwind-merge。包管理用 Bun。

> **关于本计划的测试策略**：本任务是「脚手架搭建」而非业务逻辑开发，没有可断言的运行时行为，故不套用单元测试 TDD 红-绿循环。每个任务的验证手段是**可执行的命令检查**（文件存在、`bun install` / `bun run build` 成功、`git` 状态正确、dev server 起得来）。这是经过深思的、与任务性质匹配的验证方式。

> **执行环境提醒**：终端为 Windows PowerShell。`git init` 子模块、`bun` 命令均在 `api-transfer-ui/` 目录内执行。后端仓库当前在 `main` 分支且工作区有大量无关改动——本计划**只**操作 `api-transfer-ui/` 和根 `.gitmodules`,不碰其他文件。

---

## 文件结构

**新建独立仓库 `api-transfer-ui/`,包含：**

| 文件 | 职责 |
|---|---|
| `.gitignore` | 忽略 node_modules / dist / .env 等 |
| `.node-version` | 锁定 Node 24 |
| `.npmrc` | npm registry（对齐 web） |
| `package.json` | 依赖与脚本（dev/build/preview） |
| `tsconfig.json` | TS project references 根 |
| `tsconfig.app.json` | 应用源码 TS 配置（含 `@/*` 别名） |
| `tsconfig.node.json` | 构建脚本 TS 配置（含 rsbuild.config.ts） |
| `rsbuild.config.ts` | Rsbuild 配置：Vue 插件、`@`→src 别名、dev 代理 `/api`+`/v1`→:8080 |
| `postcss.config.mjs` | Tailwind v4 postcss 插件 |
| `components.json` | shadcn-vue CLI 配置 |
| `index.html` | HTML 模板 |
| `src/main.ts` | 装配 createApp + router + pinia + 样式入口 |
| `src/App.vue` | 根组件，渲染 `<RouterView />` |
| `src/router/index.ts` | 占位路由 → HomeView |
| `src/lib/utils.ts` | `cn()` 工具 |
| `src/styles/index.css` | Tailwind v4 入口 + 基础 CSS 变量 |
| `src/views/HomeView.vue` | 纯静态占位页 |
| `src/stores/.gitkeep` | 空目录占位 |

**修改后端仓库：**
- `.gitmodules`：追加 `api-transfer-ui` 子模块登记（占位远端 URL）。

---

## Task 1: 初始化 `api-transfer-ui` 独立 git 仓库与目录骨架

**Files:**
- Create: `api-transfer-ui/.gitignore`
- Create: `api-transfer-ui/.node-version`
- Create: `api-transfer-ui/.npmrc`

- [ ] **Step 1: 创建目录并 git init**

在 PowerShell 中执行（工作目录为根项目 `C:\Users\chjiae\IdeaProjects\api-transfer`）：

```powershell
New-Item -ItemType Directory -Force api-transfer-ui | Out-Null
git -C api-transfer-ui init
```

Expected: 输出 `Initialized empty Git repository in .../api-transfer-ui/.git/`。

- [ ] **Step 2: 写 `.node-version`**

`api-transfer-ui/.node-version`:
```
24
```

- [ ] **Step 3: 写 `.npmrc`**

`api-transfer-ui/.npmrc`:
```
registry=https://registry.npmjs.org/
```

- [ ] **Step 4: 写 `.gitignore`**

`api-transfer-ui/.gitignore`:
```gitignore
# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

node_modules
dist
dist-ssr
*.local

.env

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

- [ ] **Step 5: 验证文件就位**

Run:
```powershell
git -C api-transfer-ui rev-parse --is-inside-work-tree; Test-Path api-transfer-ui/.gitignore, api-transfer-ui/.node-version, api-transfer-ui/.npmrc
```
Expected: 第一行 `true`;随后三个 `True`。

- [ ] **Step 6: Commit（在子模块仓库内）**

```powershell
git -C api-transfer-ui add .
git -C api-transfer-ui commit -m "chore: 初始化仓库与忽略规则"
```
Expected: 产生第一个 commit。

---

## Task 2: 写 `package.json`

**Files:**
- Create: `api-transfer-ui/package.json`

> 版本号以现有 `web/package.json` 实际验证过的版本为基准，仅保留基础栈。

- [ ] **Step 1: 写 `package.json`**

`api-transfer-ui/package.json`:
```json
{
  "name": "api-transfer-ui",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "rsbuild dev",
    "build": "vue-tsc -b && rsbuild build",
    "preview": "rsbuild preview",
    "typecheck": "vue-tsc -b"
  },
  "dependencies": {
    "axios": "^1.16.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-vue-next": "^1.0.0",
    "pinia": "^3.0.4",
    "tailwind-merge": "^3.6.0",
    "vue": "^3.5.35",
    "vue-router": "^5.1.0"
  },
  "devDependencies": {
    "@rsbuild/core": "^2.0.7",
    "@rsbuild/plugin-vue": "^1.2.9",
    "@tailwindcss/postcss": "^4.3.0",
    "@types/node": "^25.9.1",
    "postcss": "8.5.15",
    "tailwindcss": "^4.3.0",
    "typescript": "~6.0.3",
    "vue-tsc": "^3.3.3"
  }
}
```

> 说明：`class-variance-authority` 随 shadcn-vue 组件常用，与 clsx/tailwind-merge 一同纳入基础工具档。`shadcn-vue` 的 CLI 用 `bunx --bun shadcn-vue@latest` 临时拉起，不作为 devDependency 常驻。

- [ ] **Step 2: 验证 JSON 合法**

Run:
```powershell
node -e "JSON.parse(require('fs').readFileSync('api-transfer-ui/package.json','utf8')); console.log('ok')"
```
Expected: 输出 `ok`。

- [ ] **Step 3: Commit**

```powershell
git -C api-transfer-ui add package.json
git -C api-transfer-ui commit -m "chore: 基础技术栈依赖与脚本"
```

---

## Task 3: 写 TypeScript 配置三件套

**Files:**
- Create: `api-transfer-ui/tsconfig.json`
- Create: `api-transfer-ui/tsconfig.app.json`
- Create: `api-transfer-ui/tsconfig.node.json`

- [ ] **Step 1: 写 `tsconfig.json`（references 根）**

`api-transfer-ui/tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 2: 写 `tsconfig.app.json`**

`api-transfer-ui/tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "types": ["node"],

    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    "paths": {
      "@/*": ["./src/*"]
    },

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "src/**/*.json"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: 写 `tsconfig.node.json`**

`api-transfer-ui/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["rsbuild.config.ts"]
}
```

- [ ] **Step 4: 验证三个 JSON 合法**

Run:
```powershell
node -e "['tsconfig.json','tsconfig.app.json','tsconfig.node.json'].forEach(f=>JSON.parse(require('fs').readFileSync('api-transfer-ui/'+f,'utf8'))); console.log('ok')"
```
Expected: 输出 `ok`。

- [ ] **Step 5: Commit**

```powershell
git -C api-transfer-ui add tsconfig.json tsconfig.app.json tsconfig.node.json
git -C api-transfer-ui commit -m "chore: TypeScript 配置（project references + @ 别名）"
```

---

## Task 4: 写构建与样式配置（rsbuild / postcss / components.json）

**Files:**
- Create: `api-transfer-ui/rsbuild.config.ts`
- Create: `api-transfer-ui/postcss.config.mjs`
- Create: `api-transfer-ui/components.json`

- [ ] **Step 1: 写 `rsbuild.config.ts`**

> 精简版：去掉 web 里与重型依赖相关的 splitChunks、TresJS 自定义元素、buildCache 等；保留 Vue 插件、`@`→src 别名、dev 代理 `/api`+`/v1`→:8080。

`api-transfer-ui/rsbuild.config.ts`:
```ts
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ envMode }) => {
  const env = loadEnv({ mode: envMode, prefixes: ['VITE_'] })
  const serverUrl =
    process.env.VITE_REACT_APP_SERVER_URL ||
    env.rawPublicVars.VITE_REACT_APP_SERVER_URL ||
    'http://localhost:8080'

  const isProd = envMode === 'production'

  // 后端控制面 /api 假定同源、数据面 /v1；独立 dev server 经此代理到后端以规避跨域。
  const devProxy = Object.fromEntries(
    (['/api', '/v1'] as const).map((key) => [
      key,
      { target: serverUrl, changeOrigin: true },
    ]),
  ) as Record<string, { target: string; changeOrigin: boolean }>

  return {
    plugins: [pluginVue()],
    source: {
      entry: {
        index: './src/main.ts',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    html: {
      template: './index.html',
    },
    server: {
      host: '0.0.0.0',
      proxy: devProxy,
    },
    output: {
      minify: isProd,
      target: 'web',
      distPath: {
        root: 'dist',
      },
    },
    performance: {
      removeConsole: isProd ? ['log'] : false,
    },
  }
})
```

- [ ] **Step 2: 写 `postcss.config.mjs`**

`api-transfer-ui/postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

- [ ] **Step 3: 写 `components.json`**

> 对齐 web 的别名约定；图标库改用 lucide（基础栈不引 hugeicons）。

`api-transfer-ui/components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "",
    "css": "src/styles/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 4: 验证 components.json 合法 + rsbuild 配置可被解析**

Run:
```powershell
node -e "JSON.parse(require('fs').readFileSync('api-transfer-ui/components.json','utf8')); console.log('json ok')"
```
Expected: 输出 `json ok`。（rsbuild.config.ts 的真正验证留到 Task 7 的 `bun run build`。）

- [ ] **Step 5: Commit**

```powershell
git -C api-transfer-ui add rsbuild.config.ts postcss.config.mjs components.json
git -C api-transfer-ui commit -m "chore: Rsbuild + Tailwind v4 + shadcn-vue 配置"
```

---

## Task 5: 写应用源码骨架（index.html + src/*）

**Files:**
- Create: `api-transfer-ui/index.html`
- Create: `api-transfer-ui/src/main.ts`
- Create: `api-transfer-ui/src/App.vue`
- Create: `api-transfer-ui/src/router/index.ts`
- Create: `api-transfer-ui/src/lib/utils.ts`
- Create: `api-transfer-ui/src/styles/index.css`
- Create: `api-transfer-ui/src/views/HomeView.vue`
- Create: `api-transfer-ui/src/stores/.gitkeep`

- [ ] **Step 1: 写 `index.html`**

`api-transfer-ui/index.html`:
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>api-transfer-ui</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

- [ ] **Step 2: 写 `src/styles/index.css`**

> Tailwind v4 入口 + 一组最小 CSS 变量（供占位页和未来 shadcn 组件用）。

`api-transfer-ui/src/styles/index.css`:
```css
@import 'tailwindcss';

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
}

body {
  margin: 0;
  background-color: var(--background);
  color: var(--foreground);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
}
```

- [ ] **Step 3: 写 `src/lib/utils.ts`**

`api-transfer-ui/src/lib/utils.ts`:
```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: 写 `src/views/HomeView.vue`（纯静态占位）**

`api-transfer-ui/src/views/HomeView.vue`:
```vue
<script setup lang="ts">
import { Rocket } from 'lucide-vue-next'
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
    <Rocket class="size-12 text-neutral-800" />
    <h1 class="text-3xl font-semibold tracking-tight">api-transfer-ui</h1>
    <p class="text-neutral-500">全新前端骨架已就绪。</p>
  </main>
</template>
```

- [ ] **Step 5: 写 `src/router/index.ts`**

`api-transfer-ui/src/router/index.ts`:
```ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
  ],
})

export default router
```

- [ ] **Step 6: 写 `src/App.vue`**

`api-transfer-ui/src/App.vue`:
```vue
<script setup lang="ts"></script>

<template>
  <RouterView />
</template>
```

- [ ] **Step 7: 写 `src/main.ts`**

`api-transfer-ui/src/main.ts`:
```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

- [ ] **Step 8: 写 `src/stores/.gitkeep`**

`api-transfer-ui/src/stores/.gitkeep`:
```
```
（空文件，占位空目录。）

- [ ] **Step 9: 验证文件树完整**

Run:
```powershell
Get-ChildItem -Recurse api-transfer-ui/src -File | Select-Object -ExpandProperty FullName
```
Expected: 列出 `main.ts`、`App.vue`、`router/index.ts`、`lib/utils.ts`、`styles/index.css`、`views/HomeView.vue`、`stores/.gitkeep` 七个文件。

- [ ] **Step 10: Commit**

```powershell
git -C api-transfer-ui add index.html src
git -C api-transfer-ui commit -m "feat: 应用骨架（router + pinia + 纯静态占位首页）"
```

---

## Task 6: 安装依赖（Bun）

**Files:**
- 生成: `api-transfer-ui/bun.lock`、`api-transfer-ui/node_modules/`(后者被 .gitignore 忽略)

- [ ] **Step 1: 安装**

```powershell
bun install --cwd api-transfer-ui
```
Expected: 安装成功，生成 `api-transfer-ui/bun.lock`,无报错（warning 可接受）。

> 若某包版本在当前 registry 解析失败，回退策略：放宽该包版本到 `latest` 重试，并在最终汇报里说明实际锁定版本。

- [ ] **Step 2: 验证关键依赖落地**

Run:
```powershell
Test-Path api-transfer-ui/node_modules/vue, api-transfer-ui/node_modules/@rsbuild/core, api-transfer-ui/node_modules/tailwindcss, api-transfer-ui/bun.lock
```
Expected: 四个 `True`。

- [ ] **Step 3: Commit lock 文件**

```powershell
git -C api-transfer-ui add bun.lock
git -C api-transfer-ui commit -m "chore: 锁定依赖（bun.lock）"
```

---

## Task 7: 验证 build 与 dev，并登记子模块

**Files:**
- Modify: `.gitmodules`(后端仓库根)

- [ ] **Step 1: 生产构建**

```powershell
bun run --cwd api-transfer-ui build
```
Expected: `vue-tsc -b` 类型检查通过 + Rsbuild 构建成功，生成 `api-transfer-ui/dist/`。

> 若 `vue-tsc` 报类型错误：依据报错修对应源文件（多半是 tsconfig 或导入路径问题），修完重跑直至通过。

- [ ] **Step 2: 验证产物**

Run:
```powershell
Test-Path api-transfer-ui/dist/index.html
```
Expected: `True`。

- [ ] **Step 3: 起 dev server 冒烟（后台启动→探测→停）**

```powershell
$p = Start-Process -FilePath "bun" -ArgumentList "run","--cwd","api-transfer-ui","dev" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 8
try {
  $r = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/" -TimeoutSec 5
  "STATUS=$($r.StatusCode)"
} catch {
  "DEV-PROBE-ERR: $($_.Exception.Message)"
} finally {
  Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
```
Expected: 输出 `STATUS=200`。

> 端口说明：Rsbuild 默认 dev 端口为 3000；若被占用它会自动顺延（3001…）。若探测到非 200，先看 Rsbuild 实际监听端口再调整探测 URL。这一步是冒烟验证，不阻塞——dev 能力的最终证据以 build 成功为准。

- [ ] **Step 4: 在根 `.gitmodules` 登记子模块**

读取根 `.gitmodules`,在文件末尾**追加**(不改动已有 `web` 条目)：

`.gitmodules`(追加内容):
```ini
[submodule "api-transfer-ui"]
	path = api-transfer-ui
	url = https://github.com/chjiae/api-transfer-ui.git
```
> 注意缩进用 **Tab**（git 配置惯例，与现有 `web` 条目一致）。

- [ ] **Step 5: 验证 .gitmodules 内容**

Run:
```powershell
git config -f .gitmodules --get submodule.api-transfer-ui.url
```
Expected: 输出 `https://github.com/chjiae/api-transfer-ui.git`。

- [ ] **Step 6: 最终状态自检**

Run:
```powershell
"=== 子模块仓库 log ==="; git -C api-transfer-ui log --oneline
"=== 子模块工作区状态 ==="; git -C api-transfer-ui status --short
"=== 后端 .gitmodules 改动 ==="; git -C . status --short .gitmodules
```
Expected:
- 子模块有 6~7 个 commit。
- 子模块 `status --short` 为空（dist/node_modules 已被忽略，干净）。
- 后端 `.gitmodules` 显示为已修改（`M`）。

---

## Task 8: 把 spec 挪入前端仓库 + 后端登记子模块指针

> 对应 spec 决策 #7：spec 先写后端，子模块建好后挪入前端仓库。

**Files:**
- Move: 后端 `docs/superpowers/specs/2026-06-09-api-transfer-ui-scaffold-design.md` → `api-transfer-ui/docs/2026-06-09-scaffold-design.md`
- Modify: 后端 git index（删除旧 spec 位置 + 暂存子模块 gitlink + .gitmodules）

- [ ] **Step 1: 复制 spec 到前端仓库并提交**

```powershell
New-Item -ItemType Directory -Force api-transfer-ui/docs | Out-Null
Copy-Item docs/superpowers/specs/2026-06-09-api-transfer-ui-scaffold-design.md api-transfer-ui/docs/2026-06-09-scaffold-design.md
git -C api-transfer-ui add docs/2026-06-09-scaffold-design.md
git -C api-transfer-ui commit -m "docs: 脚手架设计 spec（自后端仓库迁入）"
```

- [ ] **Step 2: 从后端仓库删除旧 spec 位置**

> spec 已迁入前端仓库；后端不再保留副本（避免双份漂移）。

```powershell
git -C . rm docs/superpowers/specs/2026-06-09-api-transfer-ui-scaffold-design.md
```
Expected: 文件从后端 index 移除。

- [ ] **Step 3: 暂存后端的子模块指针与 .gitmodules**

```powershell
git -C . add .gitmodules api-transfer-ui
```
Expected: `.gitmodules`(M) 与 `api-transfer-ui`(新 gitlink）进入暂存区。

- [ ] **Step 4: 验证后端暂存内容**

Run:
```powershell
git -C . status --short .gitmodules api-transfer-ui docs/superpowers/specs/2026-06-09-api-transfer-ui-scaffold-design.md
```
Expected:
- `.gitmodules` → `M`
- `api-transfer-ui` → `A`(新子模块 gitlink）
- 旧 spec 路径 → `D`(已删除)

- [ ] **Step 5: 提交后端的子模块登记**

```powershell
git -C . commit -m "feat: 新增 api-transfer-ui 前端子模块并迁出 spec"
```
Expected: 后端 `main` 产生一个 commit，仅含 `.gitmodules`、`api-transfer-ui` gitlink、旧 spec 删除三项。

> **不做**：不在子模块内 `git remote add`,不 `push`(远端待用户手动建仓后自行执行)。

---

## 完成确认（DoD）

全部任务后应满足：
1. ✅ `bun install --cwd api-transfer-ui` 成功。
2. ✅ `bun run --cwd api-transfer-ui build` 成功产出 `dist/`。
3. ✅ dev server 能起（冒烟 200，或以 build 成功为准）。
4. ✅ `api-transfer-ui/` 是干净的独立 git 仓库（含多个 commit）；根 `.gitmodules` 已登记。
5. ✅ 后端 `main` 已提交子模块 gitlink；spec 已迁入前端仓库。
6. ✅ 产物不含任何旧 `web` 业务代码或重型依赖。
7. ✅ 未建远端、未 push（留给用户）。

---

## 范围外（不做）

- 不迁移旧页面/组件/接口逻辑。
- 不配 ESLint / Prettier / i18n / 测试框架。
- 不创建 axios 客户端、不发请求。
- 不删除旧 `web` 子模块。
- 不建 GitHub 远端、不 push。
