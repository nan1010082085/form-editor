# editor

`@editor` — Schema 驱动的可视化自由布局表单 / 页面 / 大屏编辑器。

## 技术栈

- Vue 3.5 + `<script setup>` + TypeScript 5.7
- Element Plus 2.9 + ECharts 6.1 + immer（撤销 patches）
- CSS Module 样式隔离（全局强制，`.module.scss`）
- Pinia 状态管理 + Vitest 测试

## 架构概览

```
src/
├── api/                 # API 接口层（11：auth/data/flow/schema/widget/runtime…）
├── components/
│   ├── Editor/          # 编辑器 UI（Canvas/Overlay/PropertyPanel/LeftPanel/RightPanel/Toolbar 等）
│   ├── WidgetRenderer/  # 渲染引擎（SchemaRender → SchemaNode → WidgetNode + 视口剔除）
│   ├── Credential/      # 凭证管理
│   └── System/          # 系统级组件
├── composables/         # 组合式 API（46 个）
├── engine/              # 事件引擎（eventEngine.ts）
├── locales/             # i18n（zh-CN/en-US + editor-*）
├── microapp/            # qiankun 微前端集成
├── router/              # Vue Router
├── stores/              # Pinia Store（12：api/app/board/credential/dataSource/drag/editor/request/schemaVersion/template/tenant/widget）
├── styles/              # 全局样式
├── types/               # TypeScript 类型定义
├── utils/               # boardTemplates/dashboardDemo/boardThemes/坐标/校验等
├── views/               # 页面级视图
├── widgets/             # Widget 组件库（85 目录 / 91 registerWidget）
│   ├── base/types.ts    # SchemaType=string；KnownSchemaType 文档用
│   ├── registry.ts      # 注册表 + createWidgetPlugin
│   └── index.ts         # 统一注册入口
└── workers/             # Web Worker（cacheWorker/indexedDb）
```

文档入口：`README.md` · `docs/README.md` · `docs/capabilities.md` · `docs/architecture.md`
## 核心架构规则

### 组件嵌套规则
- **基础组件、业务组件禁止互相嵌套**，只允许嵌套在布局组件（single-col/double-col/triple-col/quad-col）内部
- 容器组件（form/card/tabs/dialog）可直接包含基础组件

### 样式规则
- **样式 100% Schema 驱动**：删除所有硬编码样式、固定宽高，所有组件样式由 Schema 配置驱动
- **CSS Module 强制**：所有组件样式使用 `.module.scss`，禁止全局样式污染
- **编辑器 UI 与 Widget 画布严格隔离**：
  - 编辑器（属性面板、events/api/rules/variables 配置弹窗）使用 `src/styles/editor-ui-tokens.scss`，统一 32px 控件高度，标记 `editor-ui` 类
  - Widget 画布（`.fg` / `SchemaNode`）尺寸由 `useWidgetControlSize` + 各 widget 的 `module.scss` 控制
  - **禁止**在 `variables.scss` 全局写 `.el-input` / `.el-select` 高度，避免污染画布内 widget
  - 两者仅通过属性配置 / 四大配置系统耦合（读写 widget 配置对象），样式层不得交叉

### 属性面板规则
- 每个 Widget 必须有对应属性配置面板（config.ts 中 propertyPanel 声明）
- 配置项必须能正常生效，支持 basic/style/props 三个分组

### Widget 注册规则
- Widget 目录：`src/widgets/<name>/`，包含组件 `.vue` + 配置 `config.ts`
- 通过 `registry.ts` 注册；`SchemaType` 为 `string`（注册表为真源）
- 新增 Widget：`registerWidget` 或 `createWidgetPlugin`，**无需**改类型联合字面量
- 必须在 `src/widgets/index.ts` 中 import 并注册（内置包）

### Widget 位置单位
- Widget position 支持 `xUnit/yUnit/wUnit/hUnit`（`'px' | '%'`），默认 `'px'`
- 百分比单位相对于画布尺寸计算，编辑器和渲染器均支持

## 分层规范

1. **全局状态** → Pinia Store（`src/stores/`）
2. **公共逻辑** → 组合式 API（`src/composables/`）
3. **API 接口** → `src/api/`（禁止组件直接 fetch）
4. **UI 组件** → 只做渲染，不写复杂业务逻辑

## 四大配置系统

所有 Widget 通过 config.ts 声明以下配置，编辑器统一弹窗编辑：

| 系统 | 类型 | 入口 | 说明 |
|---|---|---|---|
| 事件配置 | `events` | ActionListEditor | 18 种动作类型，支持 confirm + condition |
| 联动配置 | `linkages` | LinkageEditor | 6 种联动类型（visible/disabled/required/options/set-value/reset-fields） |
| API 配置 | `api` | ApiConfig | 动态数据源，支持 dictCode/url/ttl/retry/cache |
| 变量配置 | `variables` | VariableEditor | Widget 内部变量 |

## 条件表达式系统

- `visibleOn` / `disabledOn` / `requiredOn` — 字符串表达式，编译为 `(formData, ctx) => boolean`
- 沙箱执行：禁止访问 `constructor/__proto__/prototype`，LRU 缓存编译结果
- 安全检查：`utils/expression.ts` 中 `checkSecurity()` 阻断原型链攻击

## 事件引擎

- 入口：`engine/eventEngine.ts`
- 通过 `EventExecutionContext` 注入运行时（findWidget/formData/globalVars/messageBus 等）
- 18 种动作类型：show/hide, open-dialog/close-dialog, switch-tab, set-value, submit/reset, emit, set-variable, trigger-event, post-message, close-tab, copy, refresh, api, navigate, startFlow/endFlow

## Widget 类型

- **运行时**：`SchemaType = string`，以 `widgets/registry` 为准
- **文档/fallback**：`KnownSchemaType`（ContainerType | BasicType | EmbedType | BusinessType）
- 容器示例：form, card, tabs, dialog, *-col, micro-app-container
- 图表：bar/line/pie/scatter/radar/gauge/heatmap/funnel/candlestick 及变体
- 业务：crud-list-page, user-management, approval-*, auto-refresh 等

完整清单以 `registerWidget` 注册项为准（91）。

## Composables 清单（46）

| 名称 | 职责 |
|---|---|
| useApiRequest | API 请求封装 |
| useAutoSave | 自动保存 |
| useBoardLayout | 画布 Free/Flex 布局派生 |
| useBreakpoint | 响应式断点 |
| useCache | LRU 缓存 |
| useChartEvents | 图表事件桥接 |
| useClipboard | 剪贴板操作 |
| useConditionReferences | 条件引用解析 |
| useConstant | 全局常量 / 容器类型 / InteractionMode |
| useDataSource | 全局数据源消费 |
| useDrag | 拖拽定位（支持 % 单位） |
| useDragEditor | 编辑器拖拽交互 |
| useDuplicateWidget | 复制部件 |
| useDynamicOptions | 动态选项加载 |
| useEditorLayout | 编辑器布局 |
| useEventLog | 事件日志 |
| useExposeWidget | Widget 暴露值 |
| useFlexCanvasDrop | Flex 画布拖放 |
| useFlexDropZone | Flex 放置区 |
| useFormData | 表单数据管理 |
| useHistory | 通用快照历史（主画布以 editorStore 为准） |
| useIdGenerate | ID 生成 |
| useInteractionControl | 预览设备 / 只读 |
| useLeftPanelManage | 左侧面板管理 |
| useLifecycle | 生命周期 |
| useLinkage | 联动引擎 |
| useListData | 列表数据 |
| useLocale | Widget 运行时 i18n |
| useLogger | 日志工具 |
| useModeControl | 交互模式控制 |
| usePermission | 权限控制 |
| usePropertyAdapters | 属性适配器 |
| useResize | 尺寸调整 |
| useRightPanelConfig | 右侧面板配置 |
| useSchemaValidation | Schema 校验 |
| useSnapshot | 画布快照 |
| useViewportCulling | 画布视口剔除 |
| useWidgetAlignment | 对齐 / 分布 / 锁定 / 隐藏 |
| useWidgetAutoRefresh | 自动刷新 |
| useWidgetControlSize | Widget 控件尺寸 |
| useWidgetIndex | Widget 索引 |
| useWidgetLifecycle | Widget 生命周期执行 |
| useWidgetOptions | Widget 选项管理 |
| useWidgetPanel | Widget 面板 |
| useWidgetRenderState | 渲染态 visible/disabled/required |
| useWorkerRequest | Web Worker 请求 |

## Utils 要点

含 `boardTemplates`（含 dashboard-demo）、`dashboardDemo`、`boardThemes`、`collision`、`coordinate`、`expression`、`schemaValidate`、`unitResolver`、`apiClient` 等。
## 路径别名

- `@/` → `src/`

## 公共包规则

- **同仓开发**：`package.json` 用 `file:` 指向 sibling 公共包；Vite 通过 `scripts/vite-shared-source.mjs` alias 到源码，改公共包后 `pnpm dev` / `pnpm build` 即时生效，无需 npm 发版。

## 环境规则

- **gh CLI 已认证**：`gh` 已登录、`GITHUB_TOKEN` 环境变量已就绪，禁止检查 token、禁止询问用户设置

### 代码质量规则
- **禁止跳过问题**：遇到任何报错、警告、异常，必须找到根因并修复，不能以"预存问题""之前就有""不影响运行"为由跳过。每个问题都要记录原因和修复方式
- **图标必须使用注册表**：使用 `AppIcon` 时 `name` 须在 `platform-shared/utils/iconRegistry.ts` 注册，禁止编造；缺图标则先扩展注册表

### 项目隔离规则
- **前端禁止修改 server 代码**：禁止修改 `server/` 的任何代码。接口对接时，前端必须按照服务端已有的接口规范适配，优先修复前端问题，不能为了方便而去改服务端接口。
- **禁止跨项目修改**：本项目只能修改自己的代码，禁止修改其他项目。需要改其他项目时，明确告知用户。

## 迭代规则

- **禁止回滚 git**，渐进式推进
- 复杂场景必须完整实现，不简化需求
- 能力不够就扩展 Widget，不硬编码绕过

## 常用命令

```bash
pnpm dev          # vite dev server（端口 5100）
pnpm build        # vite build
pnpm build:check  # vue-tsc + vite build
pnpm test         # vitest run
pnpm test:coverage
```

## Claude Code Agent

- `.claude/agents/schema-editor-expert.md` — 全链路专家级工程师 Agent，专注产品设计/开发/迭代/验证
- `.claude/memory/` — Agent 持久化记忆（architecture/widget-system/communication/config-systems/dev-rules/iteration-log）
