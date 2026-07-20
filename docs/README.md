# Editor 文档索引

`@editor` — Schema 驱动的可视化表单 / 页面 / 大屏编辑器（Vue 3 + Vite + Element Plus）

线上：https://pyflow.icu/schema-platform/editor/  
本地：`cd editor && pnpm dev` → http://localhost:5100

---

## 快速导航

| 我想… | 看这里 |
|--------|--------|
| 了解产品能做什么 | [能力总览](./capabilities.md) |
| 理解架构与分层 | [架构文档](./architecture.md) |
| 新做一个 Widget | [Widget 开发](./widget-development.md) · [第三方指南](./third-party-widget-guide.md) |
| 配属性面板 | [属性面板](./property-panel.md) |
| 接 qiankun / 嵌入发布页 | [qiankun](./qiankun-integration.md) · [实例与发布设计](./design/instances-publish.md) |
| 看本轮产品结论 | [迭代进化（已收口）](./iteration-evolution.md) |
| 改代码同步文档 | [../CONTRIBUTING.md](../CONTRIBUTING.md) |

---

## 文档目录

### 产品

| 文档 | 说明 |
|------|------|
| [capabilities.md](./capabilities.md) | **产品能力矩阵、验收路径、已知缺口**（入口） |
| [iteration-evolution.md](./iteration-evolution.md) | 本轮演进结论（E1 完成 / E2–E3 部分）与 Backlog |
| [container-nesting-decision.md](./container-nesting-decision.md) | 容器嵌套：有限 2 层决策 |
| [editor-review-and-roadmap.md](./editor-review-and-roadmap.md) | 历史技术评审与 roadmap（参考） |

### 架构与开发

| 文档 | 说明 |
|------|------|
| [architecture.md](./architecture.md) | 分层、Store、渲染双路径、Schema |
| [widget-development.md](./widget-development.md) | 内置 Widget 开发步骤 |
| [third-party-widget-guide.md](./third-party-widget-guide.md) | `createWidgetPlugin` 扩展 |
| [property-panel.md](./property-panel.md) | propertyPanel 声明与编辑器 |
| [schema-validation-testing.md](./schema-validation-testing.md) | 校验与测试 |
| [qiankun-integration.md](./qiankun-integration.md) | 微前端接入 |
| [micro-app-container-design.md](./micro-app-container-design.md) | FgMicroAppContainer |
| [store-design.md](./store-design.md) | 旧版 Store 设计（**以 architecture 为准**） |

### 设计与运行时（线框 / Mermaid）

| 文档 | 说明 |
|------|------|
| [design/README.md](./design/README.md) | 设计文档索引 |
| [design/overview.md](./design/overview.md) | 信息架构、路由、Store |
| [design/designer.md](./design/designer.md) | 三栏设计器、拖拽、保存发布 |
| [design/instances-publish.md](./design/instances-publish.md) | 实例列表、PublishView、postMessage |
| [design/runtime.md](./design/runtime.md) | WidgetRenderer、事件、联动、校验 |

---

## 统计基准（与代码同步 · 2026-07-20）

| 指标 | 数量 |
|------|------|
| Pinia Store | 12 |
| Composable | 46 |
| Widget 目录 | 85 |
| registerWidget | 91 |
| Vitest `*.spec.ts` | 99 |
| API 模块 | 11 |

变更上述数字时，同步更新：根目录 [README.md](../README.md)、[CLAUDE.md](../CLAUDE.md)、[architecture.md](./architecture.md)、[CONTRIBUTING.md](../CONTRIBUTING.md)。

---

## 外部集成

平台级集成说明见仓库文档（若存在）`docs/integration-guide.md`：

- qiankun 子应用
- Schema CRUD / 发布 REST API
- PublishView `postMessage` 协议（`fg:set-mode` 等）
- WidgetRenderer 独立嵌入
