# Editor UI/UX Path to A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Editor 走查从整体 **B+** / 可访问性 **B** 提升到 **A**（可访问性同步到 A）。

**Architecture:** Wave 1 先消「一票否决」硬伤（跨项目登录 + editor 键盘/skip/axe）；Wave 2 再做密度、令牌、对比度与 CI 防回归。跨项目任务必须先切仓，禁止在 editor 上下文直接改 `shared/`。

**Tech Stack:** Vue 3 + SCSS Modules + Element Plus + AppIcon + Vitest；axe / Chrome DevTools；`platform-shared`（A1–A2）

**基线（已归档）:** [archive/2026-08-11-ui-ux-fix.md](./archive/2026-08-11-ui-ux-fix.md)（T0–T9）· [archive/2026-08-11-ui-ux-round2.md](./archive/2026-08-11-ui-ux-round2.md)  
**索引:** [README.md](./README.md)  
**看板:** [editor-ui-ux-path-to-a.canvas.tsx](/Users/yangdongnan/.cursor/projects/Users-yangdongnan-work-schema-platform-server/canvases/editor-ui-ux-path-to-a.canvas.tsx)

**状态:** 🟡 **唯一活跃 UI/UX 计划** · 11/12 完成，仅剩 A5（axe 扫描）

## Global Constraints

- A1–A2：**仅** `shared/platform-shared/`（需用户确认切仓）；A3–A12：**仅** `editor/`
- 禁止 git 回滚；渐进提交
- 图标只用已注册 AppIcon name
- 编辑器 UI 与画布 Widget 样式隔离（`editor-ui-tokens` 边界不可破坏）
- 每个 Task 结束后：可手动验证 + 必要时 `pnpm test`

## File Map

| 区域 | 主要文件 | Task |
|------|----------|------|
| 登录跳转 | `shared/platform-shared/utils/authPaths.ts` | A1 |
| 登录表单 | `shared/platform-shared/components/auth/LoginView.vue` (+ scss) | A2 |
| 组件面板键盘 | `editor/src/components/Editor/ComponentPanel.vue` | A3 |
| Skip link | `editor/src/views/EditorView.vue`, `AppLayout.vue`, locales | A4 |
| axe 清单 | 走查笔记 / 本计划验收节 | A5 |
| 实例卡密度 | `editor/src/views/InstancesView.vue` | A6 |
| 缩放入口 | `EditorViewToolbar.vue`, `ZoomIndicator.vue`, `editor` store | A7 |
| z-index | `variables.scss` + 各 `*.module.scss` 硬编码处 | A8 |
| EmptyState | 四大配置弹窗入口组件 | A9 |
| 对比度 | `variables.scss` / `editor-ui-tokens.scss` + 抽检表 | A10 |
| 方向键微调 | `useDrag` / Overlay / editor store 快捷键 | A11 |
| CI 防回归 | `editor` scripts / vitest / lint | A12 |

## Task Index

| ID | Wave | 仓 | 优先级 | 标题 | 状态 |
|----|------|-----|--------|------|------|
| A1 | 1 | platform-shared | P0 | authPaths standalone → `/login` | `- [x]` 已实现 |
| A2 | 1 | platform-shared | P0 | LoginView 可见 label | `- [x]` 已实现 |
| A3 | 1 | editor | P0 | 键盘添加部件 | `- [x]` |
| A4 | 1 | editor | P0 | Skip link → 画布 | `- [x]` |
| A5 | 1 | 两边 | P0 | axe 清 Critical/Serious | `- [ ]` |
| A6 | 2 | editor | P1 | 实例卡「更多」溢出 | `- [x]` |
| A7 | 2 | editor | P1 | 缩放单一入口 | `- [x]` |
| A8 | 2 | editor | P1 | z-index `$z-*` 全局替换 | `- [x]` |
| A9 | 2 | editor | P2 | EmptyState 覆盖配置弹窗 | `- [x]` |
| A10 | 2 | editor | P1 | 对比度 WCAG AA 表 | `- [x]` |
| A11 | 2 | editor | P2 | 方向键微调选中 Widget | `- [x]` |
| A12 | 2 | editor | P2 | CI：raw-key / 无名 icon | `- [x]` |

**里程碑:** Wave1 全部勾选 → 目标 **A-**；Wave2 全部勾选 + DoD 走查 → 目标 **A**。

---

## Wave 1 — 摸到 A-

### Task A1: authPaths standalone 登录 URL（跨项目）

**Priority:** P0  
**Estimate:** 1–2h  
**Depends on:** 用户确认可改 `platform-shared`  
**Files:**
- Modify: `shared/platform-shared/utils/authPaths.ts`
- Test: 若 shared 有单测则补；否则 editor 手动：未登录访问 `http://localhost:5100/instances`

**根因:** `resolveLoginUrl` 在非 Shell 嵌入时仍 fallback 到 `${origin}${SHELL_BASE}/login`（如 `/schema-platform/login`），独立 Vite dev 无该路由 → 404。

- [ ] **Step 1: 确认切仓**  
  在 `shared/platform-shared`（或 monorepo 根）上下文修改；勿从 editor 规则绕过隔离。

- [ ] **Step 2: 修正 `resolveLoginUrl`**  
  非 `isShellEmbedded()` 且 pathname 不含 `${SHELL_BASE}/(editor|flow|ai)` 时，返回  
  `${origin}/login?redirect=...`（相对当前 origin 的子应用自有 `/login`）。  
  Shell 嵌入分支保持 `${SHELL_BASE}/login`。

- [ ] **Step 3: 手测**  
  清 token → 打开 `:5100/instances` → 应进 editor 登录页，非 404。  
  若有 qiankun 嵌入路径，回归仍进 shell login。

- [ ] **Step 4: Commit（shared 仓）**  
  `fix(auth): resolve standalone login to /login instead of shell base`

---

### Task A2: LoginView 可见 label（跨项目）

**Priority:** P0  
**Estimate:** 1–2h  
**Depends on:** A1（可同 PR，但验收独立）  
**Files:**
- Modify: `shared/platform-shared/components/auth/LoginView.vue`
- Modify: `shared/platform-shared/components/auth/LoginView.module.scss`（如需）

- [ ] **Step 1: 表单加可见 `<label for>`**  
  用户名 / 密码字段：可见文字 label + `id`/`for` 关联；placeholder 仅作示例，不得当唯一名称。

- [ ] **Step 2: a11y 抽检**  
  DevTools Accessibility：inputs 的 `labels` 非空；对比度 ≥4.5:1。

- [ ] **Step 3: Commit（shared 仓）**  
  `a11y(auth): add visible labels to LoginView fields`

---

### Task A3: 键盘添加部件（editor）

**Priority:** P0  
**Estimate:** 2–3h  
**Depends on:** —  
**Files:**
- Modify: `src/components/Editor/ComponentPanel.vue`
- Modify: locales（如需 `editor.componentPanel.addToCanvas`）
- 复用: 已有 `handleDoubleClick` → `createWidget` + `widgetStore.addWidget`

**现状:** 双击可添加；键盘用户无等价路径（列表项通常不可聚焦或无 Enter）。

- [ ] **Step 1: 列表项可聚焦**  
  组件项加 `tabindex="0"`（或 button/role=button），保留拖拽。

- [ ] **Step 2: Enter / Space 触发与双击相同逻辑**  
  `@keydown.enter.prevent` / `@keydown.space.prevent` → `handleDoubleClick(type)`。

- [ ] **Step 3: aria**  
  `aria-label` 含部件显示名 +「添加到画布」（i18n）。

- [ ] **Step 4: 手测**  
  Tab 到某部件 → Enter → 画布出现该 Widget；拖拽仍可用。

- [ ] **Step 5: Commit**  
  `a11y(editor): keyboard add widget from ComponentPanel`

---

### Task A4: Skip link → 画布

**Priority:** P0  
**Estimate:** 1–2h  
**Depends on:** —  
**Files:**
- Modify: `src/views/EditorView.vue`（或壳层布局）
- Modify: `src/views/EditorView.module.scss` / `a11y.scss`
- Modify: `src/locales/editor-zh-CN.ts`, `editor-en-US.ts`
- 目标焦点: 画布 `main` 或带 `id="editor-canvas-main"` 的区域

- [ ] **Step 1: 增加 skip 链接**  
  编辑器页首个可聚焦元素：`a.skip-link` → `#editor-canvas-main`；文案 i18n「跳到画布」。

- [ ] **Step 2: 样式**  
  默认屏外；`:focus` 时可见（沿用 `a11y.scss` 模式）。

- [ ] **Step 3: 目标可聚焦**  
  画布容器 `id="editor-canvas-main"` + `tabindex="-1"`，点击 skip 后 `.focus()`。

- [ ] **Step 4: 手测**  
  进入编辑器 → 首个 Tab 出现 skip → 激活后焦点在画布区。

- [ ] **Step 5: Commit**  
  `a11y(editor): add skip link to canvas main`

---

### Task A5: axe 扫描并清 Critical/Serious

**Priority:** P0  
**Estimate:** 0.5–1.5d（视问题量）  
**Depends on:** A1–A4 尽量先完成（减少噪音）  
**范围页:** Login → Instances → Editor（含左右栏）→ 任选一配置弹窗

- [ ] **Step 1: 跑 axe（或 Lighthouse a11y）**  
  记录 Critical / Serious 列表到本文件「A5 扫描记录」小节。

- [ ] **Step 2: 修 editor 内问题**  
  每修一类单独小提交；跨项目问题回写 A1/A2 或新开 shared 任务。

- [ ] **Step 3: 复扫**  
  **验收:** Critical = 0；Serious ≤ 2 且有书面豁免理由。

- [ ] **Step 4: 勾选 Wave1 里程碑**  
  此时目标分数：**整体 A- / 可访问性 A-**。

#### A5 扫描记录

| 页 | Critical | Serious | 处理 |
|----|----------|---------|------|
| Login | | | |
| Instances | | | |
| Editor | | | |

---

## Wave 2 — 拉到 A

### Task A6: 实例卡操作「更多」溢出

**Priority:** P1  
**Estimate:** 3–4h  
**Depends on:** —  
**Files:** `src/views/InstancesView.vue` (+ module scss)  
**来源:** R3-07

- [ ] **Step 1: 主操作保留 ≤3**（如打开 / 编辑 / 删除或产品指定）
- [ ] **Step 2: 其余收入 `ElDropdown`「更多」**；每项有文字 + 可选 icon
- [ ] **Step 3: 全部菜单项 `aria-label` / 可读名称**
- [ ] **Step 4: 手测窄卡与键盘打开菜单**
- [ ] **Step 5: Commit** — `ux(editor): collapse instance card actions into overflow menu`

---

### Task A7: 缩放单一入口

**Priority:** P1  
**Estimate:** 2–3h  
**Depends on:** —  
**Files:** `EditorViewToolbar.vue`, `ZoomIndicator.vue` / store `showZoomIndicator`  
**来源:** R3-08

- [ ] **Step 1: 产品选择** — Toolbar 缩放 **或** 浮动 ZoomIndicator 为主；另一为联动只读或可关
- [ ] **Step 2: 实现联动**（同一 `editorStore` zoom 源）；避免两套独立步进
- [ ] **Step 3: 手测** ± / 滑块 / 快捷键一致
- [ ] **Step 4: Commit** — `ux(editor): unify zoom controls to single source`

---

### Task A8: z-index `$z-*` 全局替换

**Priority:** P1  
**Estimate:** 0.5–1d  
**Depends on:** T7 token 已存在（`variables.scss`）  
**来源:** Round2 R2-02 延期

- [ ] **Step 1: `rg 'z-index:\s*\d+' src --glob '*.scss'` 清单**
- [ ] **Step 2: 壳层 / Overlay / ContextMenu / Zoom 等映射到 `$z-*`**（画布内 widget 层级谨慎，勿破坏层叠语义）
- [ ] **Step 3: 回归右键菜单、弹层、浮动缩放不被挡**
- [ ] **Step 4: Commit** — `refactor(editor): replace hardcoded z-index with $z-* tokens`

---

### Task A9: EmptyState 覆盖四大配置弹窗

**Priority:** P2  
**Estimate:** 3–4h  
**Depends on:** 已有 `EmptyState.vue`（T5）  
**目标:** events / linkages / api / variables 空列表统一 EmptyState + CTA

- [ ] **Step 1: 定位四个编辑器空列表渲染点**
- [ ] **Step 2: 接入 EmptyState（说明 + 主按钮文案 i18n）**
- [ ] **Step 3: 手测四条空路径**
- [ ] **Step 4: Commit** — `ux(editor): EmptyState in four config editors`

---

### Task A10: 关键色对比度 WCAG AA 表

**Priority:** P1  
**Estimate:** 2–3h  
**Depends on:** —

- [ ] **Step 1: 列出 token** — 主文 / 次文 / 禁用 / 边框 / 主按钮 / 危险
- [ ] **Step 2: 对 `#fff` 与画布底实测比值**；不达标则调 `variables` / `editor-ui-tokens`
- [ ] **Step 3: 把结果表贴到本计划「对比度表」**
- [ ] **Step 4: Commit（若有色值变更）**

#### 对比度表

| Token / 用途 | 前景 | 背景 | 比值 | AA |
|--------------|------|------|------|-----|
| | | | | |

---

### Task A11: 方向键微调选中 Widget

**Priority:** P2  
**Estimate:** 0.5d  
**Depends on:** —  
**Files:** 快捷键处理处（editor store / Overlay / `useDrag` 相关）

- [ ] **Step 1: 选中且非输入焦点时** Arrow 移动 1px（Shift=10px）
- [ ] **Step 2: 锁定 Widget 不响应**
- [ ] **Step 3: 手测 + 不与画布滚动抢键（按产品约定）**
- [ ] **Step 4: Commit** — `a11y(editor): nudge selected widget with arrow keys`

---

### Task A12: CI 防 raw-key / 无名 icon-btn

**Priority:** P2  
**Estimate:** 0.5–1d  
**Depends on:** T0/T1 模式已稳定

- [ ] **Step 1: 脚本或 vitest** — 扫描 locales 引用 vs 定义；或 snapshot 关键路由无 `editor.` 裸 key
- [ ] **Step 2: 静态检查** — Toolbar/Instances 等 `iconBtn` 必须有 `aria-label`（AST 或约定注释豁免表）
- [ ] **Step 3: 接入 `pnpm test` 或 lint script**
- [ ] **Step 4: Commit** — `test(editor): guard against i18n raw keys and unlabeled icon buttons`

---

## A 的 Definition of Done

- [ ] 未登录 → 登录 → 实例 → 编辑器：零错误 404、零用户可见 raw key
- [ ] axe Critical = 0；正文对比度抽检 ≥ 4.5:1（A10 表完成）
- [ ] 不依赖拖拽可完成「添加部件」（A3）
- [ ] Skip link 可用（A4）；收起面板不进读屏（既有 inert 保持）
- [ ] 空状态有说明 + CTA（A9）；破坏性操作确认框保持
- [ ] 独立走查报告可复现上述项（截图 + a11y snapshot）→ 勾选本 DoD → 分数记为 **A**

## 决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 计划落点 | `editor/plans/2026-08-12-…` | 与 T0–T9 计划同目录；docs 仓不改 |
| A1/A2 归属 | platform-shared | 根因不在 editor；隔离规则要求切仓 |
| Wave 分界 | A5 后为 A- | 硬伤清除即可宣称 A-；密度/CI 属 A 证明 |
| 缩放策略 | A7 内再定主入口 | 需产品二选一，计划不锁死 UI |
