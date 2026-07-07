# Editor 文档

`@editor` — Vue 3 + Vite + Element Plus 可视化表单设计器

## 快速开始

```bash
pnpm dev:editor    # 启动开发服务器（端口 5100）
pnpm --filter @editor build
pnpm --filter @editor test
```

## 外部集成

参见 [平台集成指南](../../docs/integration-guide.md#一editor表单设计器)：
- qiankun 微前端接入
- REST API（Schema CRUD、发布）
- PublishView postMessage 嵌入协议
- Widget 渲染器独立使用

## 文档目录

### 架构与开发

- [组件架构](./architecture.md) — Widget 系统、分层、Store
- [Widget 开发](./widget-development.md) — 新 Widget 开发指南
- [属性面板](./property-panel.md) — propertyPanel 配置机制
- [Schema 校验](./schema-validation-testing.md) — 校验体系与测试
- [qiankun 集成](./qiankun-integration.md) — 微前端接入
- [微应用容器](./micro-app-container-design.md) — FgMicroAppContainer

### 设计与运行时（线框 & Mermaid）

- [设计文档索引](./design/README.md)
- [信息架构与布局](./design/overview.md) — 路由、qiankun、Store 关系
- [设计器](./design/designer.md) — 三栏布局、拖拽、保存发布
- [实例与发布](./design/instances-publish.md) — 列表、PublishView、postMessage
- [运行时架构](./design/runtime.md) — WidgetRenderer、事件引擎、联动、校验

> 旧版 [Store 设计](./store-design.md) 仅列 7 个 Store，请以 architecture.md 与 runtime.md 中的 11 Store 为准。
