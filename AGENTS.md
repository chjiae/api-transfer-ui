# AGENTS.md — api-transfer-ui（Relay 前端）

> 给接手本前端仓库的 AI agent（Codex / Claude / 其它）看。**先读这份，再动手。**
> 本目录是主仓库 `api-transfer` 的 git 子模块，独立仓库 `github.com/chjiae/api-transfer-ui`。
> 本文仅收录用户明确授权写入的约定。

## 技术栈

Vue 3 + Rsbuild + Tailwind 4 + Pinia + vue-router，产品名 **Relay**。
开发：`npm run dev`（:3000，把 `/api`、`/v1` 代理到后端 :8080）。

## 前端开发工具纪律（必读）

**任何改动——组件、页面、布局、样式、文案、视觉——动手前先读
`../.claude/skills/frontend-tooling/SKILL.md`（在主仓库根），按其中的
「场景 → 工具对照表」选对工具。**

红线（最低要求）：

1. **改完必用 Playwright 看真实页面**：navigate + screenshot，截图存 `../tmp/`（主仓库根的 tmp，不许放任何仓库根目录），实际看图确认渲染正常——空白页 = 没完成。
2. **做视觉 / 设计 / 新页面，必先调一个 taste 系列 skill**（如 `design-taste-frontend`、`high-end-visual-design`、`minimalist-ui`、`redesign-existing-projects`、`image-to-code`、`gpt-taste`），不要用框架默认样式硬凑。
3. **打磨文案 / 视觉细节用 impeccable**（`impeccable:impeccable`）。
4. 执行产物（截图、日志等）统一存主仓库根的 `tmp/`，不许留在仓库根目录。

启动页面来看：按主仓库 `../.claude/skills/run-app/SKILL.md` 启动前后端
（后端 :8080 + 前端 :3000），再用浏览器工具打开 `http://localhost:3000/`。

> Codex 的对应技能在 `~/.agents/skills/`，浏览器用 Codex 自带 browser 工具；
> 工具调用名可能不同，**按场景选对类别**即可。
> 红线 = 后端契约不变，只动前端。
