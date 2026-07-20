# @editor

Schema 驱动的可视化编辑器：表单设计 + 页面/大屏搭建 + 发布运行时。

| 项 | 值 |
|---|---|
| 包名 | `@editor` |
| 版本 | `1.0.0-rc.1` |
| 端口 | `5100` |
| 线上 | https://pyflow.icu/schema-platform/editor/ |
| 依赖 | `@schema-platform/platform-shared`（`file:` 同仓） |

---

## 定位

面向非开发人员的可视化搭建工具，用 Schema JSON 描述页面结构，实现设计态与运行态分离：

- **表单**：审批单、CRUD 列表、详情页（Flex 流式布局）
- **大屏 / 自由页**：图表运营看板（Free 绝对定位），含「运营大屏 Demo」一键种子
- **发布**：`/view/:schemaCode` 嵌入宿主；支持交互 / 只读模式

---

## 技术栈

- Vue 3.5 `<script setup>` + TypeScript 5.7
- Element Plus 2.9 + ECharts 6.1
- Pinia（**12** Store，大量 `shallowRef`）
- Vue Router 4（qiankun / micro-app）
- Vite 5 + Vitest（**99** 规格文件）
- immer（撤销/重做 patches）
- CSS Module（`.module.scss`）强制隔离

---

## 能力一览（2026-07-20）

| 能力 | 状态 | 说明 |
|------|------|------|
| Free / Flex 双布局 | ✅ | board.layoutMode |
| 85 Widget / 91 注册项 | ✅ | 8 分组，registry 注册 |
| 四大配置系统 | ✅ | 事件 / 联动 / API / 变量 |
| 视口剔除（大屏编辑） | ✅ | `useViewportCulling` |
| immer 撤销重做 | ✅ | `editorStore` patches |
| 大屏 Demo 模板 | ✅ | 新建实例 → 自由布局 → 运营大屏 Demo |
| 4 种交互模式 | ✅ | edit / preview / publish-interactive / publish-readonly |
| 发布态 query 切换 | ✅ | `?interaction=readonly\|interactive` |
| 埋点客户端 | 🟡 | track 已接入；server dashboard 未就绪 |
| i18n | 🟡 | vue-i18n 框架 + 核心语言包；覆盖率未满 80% |
| 第三方 Widget | 🟡 | `createWidgetPlugin` + 指南；无市场/脚手架 |

---

## 快速开始

```bash
cd editor
pnpm install
pnpm dev          # http://localhost:5100
pnpm test
pnpm build
pnpm build:widgets   # 独立打包 Widget 库
```

仓库根目录打包部署：

```bash
bash deploy/pack.sh --target editor
bash deploy/deploy.sh --target editor
```

---

## 核心概念

### Schema

```json
{
  "widgets": [ /* Widget 树 */ ],
  "board": {
    "canvas": { "width": 1920, "height": 1080, "layoutMode": "free", "themePreset": "dashboard-dark" },
    "variables": [],
    "events": []
  }
}
```

### 布局模式

| 模式 | 渲染 | 场景 |
|------|------|------|
| `free` | 绝对定位 + EditorOverlay | 大屏、自由画布 |
| `flex` | WidgetRenderer 流式 | 表单、列表、详情页 |

### 交互模式

| 模式 | 行为 |
|------|------|
| `edit` | 设计态，可拖拽编辑 |
| `preview` | 编辑器内预览 |
| `publish-interactive` | 发布态可交互 |
| `publish-readonly` | 发布态只读 |

---

## Widget 体系

**85** 个目录，**91** 次 `registerWidget`，分组统计：

| 分组 | 数量 | 代表 |
|------|------|------|
| form | 27 | input, select, date, upload, cascader… |
| chart | 19 | bar/line/pie/scatter/radar/gauge/heatmap/funnel/candlestick… |
| business | 15 | crud-list-page, user-management, approval-*… |
| layout | 11 | form, card, tabs, dialog, *-col… |
| static | 8 | title, banner, divider… |
| container | 5 | search-list, tab-container… |
| table | 3 | table, advanced-table, tree-table |
| action | 3 | button, toolbar-buttons… |

新增 Widget：**只需** `registerWidget` / `createWidgetPlugin`，无需改 `SchemaType` 联合类型（已为 `string`）。

详见 [第三方 Widget 指南](./docs/third-party-widget-guide.md)、[Widget 开发](./docs/widget-development.md)。

---

## 状态管理（12 Store）

| Store | 职责 |
|-------|------|
| `widget` | Widget 树 CRUD、reparent、布局适配 |
| `editor` | 选中、模式、immer 历史、剪贴板 |
| `board` | 画布尺寸/缩放/主题/变量/多页 |
| `drag` | 拖拽态、辅助线、碰撞 |
| `api` | Schema 列表/保存/发布 |
| `dataSource` | 全局数据源中心 |
| `app` | 运行时上下文（user/request/global） |
| `request` | HTTP 请求缓存 |
| `schemaVersion` | 版本对比 |
| `template` | 模板 |
| `credential` | 凭证 |
| `tenant` | 租户 |

---

## 性能与编辑体验

- **视口剔除**：编辑态仅渲染可视区 + buffer（`useViewportCulling`）
- **撤销/重做**：immer patches，避免全量 JSON 深拷贝
- **shallowRef**：widgets / history / request Map
- **快捷键**：撤销重做、复制粘贴、对齐/分布、锁定/隐藏（见工具栏帮助）

---

## 路由

| 路径 | 说明 |
|------|------|
| `/instances` | 实例列表（默认入口） |
| `/editor` | 可视化设计器 |
| `/preview` | 草稿预览 |
| `/view/:schemaCode` | 已发布页面 |
| `/templates` | 模板 |
| `/credentials` | 凭证 |
| `/tenants` | 租户 |
| `/widget-docs` | Widget 文档 |
| `/login` · `/auth/callback` | 认证 |

发布页模式：`/view/{code}?interaction=readonly` 或 `interactive`；`?showModeToggle=1` 显示切换按钮。

---

## 项目结构

```
editor/
├── src/
│   ├── api/                 # 11 个领域 API
│   ├── components/
│   │   ├── Editor/          # 设计器 UI（Canvas / Overlay / PropertyPanel…）
│   │   └── WidgetRenderer/  # SchemaRender → SchemaNode → WidgetNode
│   ├── composables/         # 46 个组合式 API
│   ├── engine/              # eventEngine
│   ├── locales/             # zh-CN / en-US（含 editor-* 扩展包）
│   ├── stores/              # 12 Pinia Store
│   ├── utils/               # boardTemplates / dashboardDemo / boardThemes…
│   ├── views/               # 页面
│   ├── widgets/             # 85 目录 + registry（createWidgetPlugin）
│   └── workers/             # IndexedDB / cache Worker
├── docs/                    # 产品 / 架构 / 设计文档
├── CONTRIBUTING.md          # 改代码必改文档
└── package.json
```

---

## 文档

完整索引见 **[docs/README.md](./docs/README.md)**。

| 文档 | 内容 |
|------|------|
| [产品能力总览](./docs/capabilities.md) | 功能矩阵、验收路径、残留缺口 |
| [产品迭代（已收口）](./docs/iteration-evolution.md) | E1–E3 结论与 Backlog |
| [架构](./docs/architecture.md) | 分层、Store、渲染路径 |
| [第三方 Widget](./docs/third-party-widget-guide.md) | Plugin API |
| [贡献指南](./CONTRIBUTING.md) | 文档同步约束 |

---

## 开发约定（摘要）

1. 全局状态 → Pinia；公共逻辑 → `useXxx`；API → `src/api/`（禁止组件直调 `fetch`）
2. 图标统一 `AppIcon`（`platform-shared` iconRegistry）
3. 样式：编辑器 UI tokens 与画布 Widget 样式隔离
4. 改 Store / Widget / Composable 数量时同步更新 README、CLAUDE.md、architecture.md

---

## 统计基准（2026-07-20）

| 指标 | 数量 |
|------|------|
| Pinia Store | 12 |
| Composable | 46 |
| Widget 目录 | 85 |
| registerWidget | 91 |
| Vitest 规格 | 99 |
| API 模块 | 11 |
