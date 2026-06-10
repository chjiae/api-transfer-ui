# Relay 控制台 — UI/UX 重设计记录与待办

> 本次将 `api-transfer-ui` 从「AI 生成的深空科技风后台」系统性重做为面向开发者/运维的产品级控制台。
> 设计语言参照 Linear 的信息层级、Vercel 的工程质感、Stripe 的数据秩序，刻意避开此前数版的发光蓝/AI 紫/炫技动效。

---

## 一、设计系统（`src/styles/index.css`）

- **字体**：Geist（界面）+ Geist Mono（数字/代码，启用 tabular-nums）。自托管变量字体，离线可用。
- **配色**：暖中性基底 + 单一靛蓝（indigo）强调，零 glow。
  - 亮色 = 纸白暖中性；暗色 = 暖石墨（非蓝黑）。
  - 语义状态色：success / warning / danger / info，低饱和、与中性协调。
- **令牌体系**：表面层级（canvas/surface/surface-2/3/overlay）、文本三级、描边三级、强调、间距阶梯、圆角阶梯、阴影（暖调、克制）、动效缓动与时长。一处定义全站换肤。
- **双主题**：`[data-theme]` 切换 + `localStorage` 持久化 + 跟随系统初始值（`src/lib/theme.ts`）。

## 二、新增组件库（`src/components/ui/`）

`UiButton`（5 变体 × 4 尺寸 × loading/disabled）、`UiCard`、`UiBadge`、`UiInput`、`UiSelect`、
`UiSegmented`（分段控件）、`UiSpinner`、`UiSkeleton`（骨架屏）、`UiEmpty`（空状态）、
`UiPageHeader`、`UiModal`（带遮罩/动效/锁滚动）、`UiToaster` + `lib/toast.ts`（全局轻提示）、
`UiConfirmHost` + `lib/confirm.ts`（命令式确认框，替代原生 `confirm`）、`UiThemeToggle`。

## 三、重写的页面

| 页面 | 关键改动 |
|---|---|
| 全局壳层 `DashboardLayout` | Relay 品牌 + 中继 logo；Phosphor 图标；indigo soft 当前页指示；**移除假元素**（通知红点、项目选择器、⌘K、企业版倒计时）；真实用户名 + 真实登出；移动端抽屉 |
| 登录 `LoginView` | 双栏：左品牌 hero（真实能力点）+ 右登录卡；保留登录/注册/租户码/凭证/记住我全部逻辑；双主题门面 |
| 概览 `DashboardView` | 统计卡去 `+0%` 假标签、mono 数字、健康度着色；图表协调色板；通道表 badge 化；骨架屏 |
| 上游通道 `ChannelsView` | 列表 + 工具栏 + 连通测试（toast）+ 删除（确认框）|
| 模型目录 `ModelsView` | 模型卡片网格 + 关联通道 chips |
| 调用明细 `UsageLogsView` | 表格 + mono 数字 + 空状态 |
| 成本分析 `CostAnalysisView` | 汇总卡 + 模型成本条（协调色）+ 趋势 |
| 密钥 `ApiKeysView` | 卡片网格 + 创建走 Modal + 一次性密钥安全提示 + 复制 |
| 成员与权限 `UserManagementView` | 改表格式；角色 badge；额度内联编辑；停用带确认 |
| 审计日志 `AuditLogView` | 表格 + 分页 + 空状态 |
| 调试对话 `ChatView` | 会话侧栏 + 精致气泡 + 欢迎空状态 + 自动增高输入 |
| 占位页 `PlaceholderView` | 优雅「待开放」说明 |

## 四、文案 / 信息架构调整

- 品牌：`SeaSovereign API` → **Relay（中继台）**。
- 菜单更名（更准确、口语化）：通道管理→上游通道、模型管理→模型目录、用量统计→调用明细、
  权限管理→成员与权限、AI 对话→调试对话。
- 占位功能（路由策略/负载均衡/账单）标「待开放」，不再假装可用。
- 危险操作（删除通道/密钥/停用成员）均有人性化后果说明 + 二次确认。
- 移除营销首页（`HomeView`）与发光地球组件（`ModelNetwork`）——内部控制台无需 landing；
  `/` 直接重定向到 `/dashboard`，并新增登录守卫。

## 五、质量门

- ✅ `vue-tsc` typecheck 零错误
- ✅ `rsbuild build` 成功（含字体打包，gzip ~314KB）
- ✅ 全站 Playwright 实看：亮/暗双主题、桌面/移动端、空/加载/错误状态、Modal/Toast/确认框交互
- ✅ 运行时控制台 0 错误 0 警告
- ✅ 无可见 em-dash；单一强调色；统一圆角；按钮/表单对比度达 WCAG AA

---

## 六、后续可继续优化（非阻塞）

### 体验增强
- [ ] 全局搜索（⌘K 命令面板）——当前顶栏未放搜索，可后续做成真正可用的命令面板，而非假装。
- [ ] 表格列排序 / 列宽自适应 / 空列隐藏。
- [ ] Chat 流式输出（SSE）——目前用非流式 `stream:false`，后端已支持 SSE，可接流式提升体感。
- [ ] 通道「配置」按钮目前为占位，需接通道编辑 Modal（新建/编辑通道表单）。
- [ ] 概览页通道表「新建通道」「行内更多操作」目前跳转/占位，可补全。
- [ ] 暗色下图表网格线对比可再微调。

### 需要后端支持才能完善的项
- [ ] **统计卡环比**：当前后端 `/dashboard/overview` 不返回环比（change 恒为 0），已**移除假 `+0%` 标签**。
      若后端补「与上一周期对比」字段，可恢复趋势升降指示。
- [ ] **RPM/额度真实上限**：概览底部 RPM 进度依赖 `rpmLimit`，部分账号（如 ROOT）字段可能为 0/空，已做兜底。
- [ ] **成员 `usedQuota` 等字段**：ROOT 等特殊账号部分数值字段可能为 null，前端已用 `?? 0` 兜底，
      建议后端对所有用户返回完整数值字段。
- [ ] 通道「类型筛选」选项目前由现有数据动态推导，若后端提供「支持的通道类型枚举」可更完整。

### 约束遵守
- 全程**未改后端接口契约**，仅动 `api-transfer-ui/` 表现层与前端状态。
- 未伪造任何业务数据；无数据处一律用空状态/降级态/兜底值处理。
