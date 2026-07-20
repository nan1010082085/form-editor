# 可视化编辑器 · 开发执行计划

> 视角：资深架构师 + 开发负责人。把 [iteration-evolution.md](./iteration-evolution.md) 的产品演进路线，转化为可分配、可排期、可验收的开发执行计划。
> 本文聚焦技术方案选型、任务拆解（WBS）、排期里程碑、预研项、测试策略、跨项目协同与风险。
> 日期：2026-07-20 · 工时单位：人日（d）· 排期单位：周（W）

---

## 一、技术方案选型

> 基于真实依赖现状：editor 未装 i18n / 虚拟滚动 / immer / 监控库；platform-shared 仅有 logger / apiClient / authSession / socket。

| 问题 | 选定方案 | 新增依赖 | 关键文件 | 风险 |
|------|----------|----------|----------|------|
| 画布虚拟化（E1.2） | 自研视口剔除（viewport culling） | 无 | `SchemaRender.vue` / `widget.ts` | 拖拽/选中/辅助线命中计算需适配 |
| 撤销重做（E1.3） | immer produce + patches 替代全量深拷贝 | immer（~16KB gz） | `editor.ts` | 现有快照逻辑重写，回归风险 |
| i18n（E2.2） | platform-shared 新建 i18n 模块，vue-i18n + 共享框架，各项目维护语言包 | vue-i18n（platform-shared 引入） | `platform-shared/utils/i18n.ts`（新建）/ `editor/src/locales/` | 文案抽取工作量大，需渐进 |
| 前端埋点/监控（E2.1） | platform-shared 新建 telemetry 模块，track + reportError + 批量上报 | 无前端库（复用 apiClient） | `platform-shared/utils/telemetry.ts`（新建） | 依赖 server 新增上报端点 |
| PropertyPanel 拆分（E2.4） | 按分组拆子组件，动态组件分发 | 无 | `PropertyPanel.vue` → 5 个子组件 | 无 |
| Widget 类型注册式（E3.1） | 联合类型改为从 registry 派生：`type WidgetType = WidgetRegistryItem['type']` | 无 | `base/types.ts` / `registry.ts` | 85+ widget 迁移，需兼容层 |

### 1.1 画布虚拟化技术要点

editor 画布是自研绝对定位渲染（widget 有 position x/y/w/h），**不能用现成列表虚拟滚动库**（vue-virtual-scroller 是列表向）。方案：

```
SchemaRender
  ├── 视口计算（useViewportCulling composable）
  │     输入：canvas scroll offset + zoom + viewport size + buffer（如 200px）
  │     输出：可视矩形 { minX, minY, maxX, maxY }
  ├── widget 可见性判断
  │     widget.position 与可视矩形求交，不在矩形内 → 渲染占位 div（保留尺寸占位，不影响布局/辅助线）
  │     在矩形内 → 正常渲染 SchemaNode
  └── EditorOverlay 命中适配
        拖拽/选中/辅助线计算仍基于全量 widget 数据（不依赖 DOM），仅渲染层剔除
```

关键：剔除只影响 DOM 渲染，**不影响数据层与交互命中计算**（EditorOverlay 用数据算命中，不用 DOM）。这样拖拽/辅助线/对齐在虚拟化后仍正确。

### 1.2 撤销重做 immer 方案要点

```typescript
// 现状：全量深拷贝
pushHistory() { history.push(JSON.parse(JSON.stringify(widgets))) }

// 目标：immer patches
import { produce, enablePatches } from 'immer'
enablePatches()
const next = produce(widgets, draft => { /* mutate */ }, (patches) => {
  history.push(patches)  // 只存 patch，不存全量
})
// undo: applyPatches(current, inversePatches)
```

收益：大 schema（> 500 widget）下 patch 体积远小于全量快照；保留函数/Date 类型（immer 不序列化）。

### 1.3 i18n 架构决策

决策：**platform-shared 统一引入 vue-i18n**，而非各项目自引。

理由：editor / flow / ai 三项目共用 platform-shared，统一引入避免三处重复配置；语言包按项目隔离（editor 维护自己的 zh-CN/en-US），框架统一。

```typescript
// platform-shared/utils/i18n.ts（新建）
export function createI18n(messages: Record<string, Record<string, any>>) {
  return createI18nInstance({ locale: 'zh-CN', fallbackLocale: 'zh-CN', messages })
}
// editor/src/main.ts
import { createI18n } from '@schema-platform/platform-shared'
const i18n = createI18n({ 'zh-CN': editorZhCN, 'en-US': editorEnUS })
app.use(i18n)
```

---

## 二、任务拆解（WBS）

> 工时为估算区间（人日），假设 2-3 人前端团队。角色：FE-A/B（前端工程师）、ARCH（架构师）、QA。
> 依赖列：前置任务编号。

### Phase E1：大屏地基

#### Epic E1.0 技术预研（Spike）

| 编号 | 任务 | 工时 | 角色 | 依赖 | 交付 |
|------|------|------|------|------|------|
| E1.0.1 | 画布虚拟化 PoC | 2-3d | ARCH | - | 视口剔除原型 + 性能基准（100 widget FPS） |
| E1.0.2 | immer patches PoC | 1-2d | ARCH | - | undo/redo patch 方案验证 + 兼容性 |

#### Epic E1.1 文档与债务治理

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E1.1.1 | 文档统计对齐（README/CLAUDE.md/architecture.md） | 0.5d | FE-A | - | 三处 Store/Widget/Composable 数量一致 |
| E1.1.2 | CONTRIBUTING 加「改代码必改文档」约束 | 0.5d | FE-A | E1.1.1 | CI lint 校验文档路径 |
| E1.1.3 | deprecated 标记清理（WidgetRule/getAllContainerTypes/getTypesByGroup） | 1d | FE-B | - | 无引用后删除，全量测试通过 |

#### Epic E1.2 画布虚拟化

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E1.2.1 | useViewportCulling composable | 2d | FE-B | E1.0.1 | 可视矩形计算 + 缓冲区 + 单测 |
| E1.2.2 | SchemaRender 接入剔除渲染 | 2d | FE-B | E1.2.1 | 不在视口的 widget 渲染占位 |
| E1.2.3 | EditorOverlay 命中适配 | 1-2d | FE-A | E1.2.2 | 拖拽/选中/辅助线在虚拟化下正确 |
| E1.2.4 | 性能测试扩展 | 1d | QA | E1.2.3 | 100/200/500 widget FPS 基准 |

#### Epic E1.3 撤销重做优化

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E1.3.1 | 引入 immer + enablePatches | 0.5d | FE-A | E1.0.2 | 依赖安装 |
| E1.3.2 | editor.ts 历史栈改 patch 方案 | 2-3d | FE-A | E1.3.1 | undo/redo 用 patch |
| E1.3.3 | 回归测试 + 500 widget 基准 | 1d | QA | E1.3.2 | 大 schema 响应 < 100ms |

#### Epic E1.4 大屏主题与动画

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E1.4.1 | 深色主题预设系统 | 2d | FE-A | - | 主题切换 + 大屏预设 |
| E1.4.2 | widget 入场/数据变化动画 | 2d | FE-B | - | 动画配置项 + 默认效果 |

### Phase E2：体验与质量深化

#### Epic E2.1 可观测性

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E2.1.1 | platform-shared telemetry 模块 | 2d | ARCH | server 端点 | track/reportError API + 批量上报 |
| E2.1.2 | editor 接入埋点（5 关键路径） | 1.5d | FE-A | E2.1.1 | 拖入/删除/发布/模板/撤销埋点 |
| E2.1.3 | 错误上报接入（全局 + ErrorBoundary） | 1d | FE-A | E2.1.1 | 不再仅 console |
| E2.1.4 | 监控 dashboard 对接 | 1d | FE-B | E2.1.2 | 用户行为漏斗可见 |

#### Epic E2.2 i18n

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E2.2.1 | platform-shared i18n 模块 | 1d | ARCH | - | createI18n + 切换能力 |
| E2.2.2 | editor 文案抽取（EditorView/Toolbar） | 2d | FE-A | E2.2.1 | 核心交互接入 |
| E2.2.3 | editor 文案抽取（PropertyPanel） | 2-3d | FE-B | E2.2.2 | 属性面板接入 |
| E2.2.4 | en-US 语言包补全 | 1.5d | FE-A | E2.2.3 | 覆盖率 ≥ 80% |

#### Epic E2.3 发布态模式

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E2.3.1 | publish-interactive / publish-readonly 实现 | 2-3d | FE-B | E1 | 模式切换可用 |
| E2.3.2 | 已发布页交互/只读切换 | 1d | FE-B | E2.3.1 | /view/:code 支持 |

#### Epic E2.4 PropertyPanel 拆分

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E2.4.1 | 按分组拆 5 子组件 | 2d | FE-A | - | 单文件 < 10KB |
| E2.4.2 | 动态组件分发 + 回归 | 1d | FE-A | E2.4.1 | 属性编辑全通过 |

#### Epic E2.5 容器嵌套评估

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E2.5.1 | 嵌套需求调研 + 决策 | 1d | ARCH | - | 决策文档（放开/不放开/有限放开） |
| E2.5.2 | 若放开：递归碰撞 + reparent 加固 | 3-5d | FE-B | E2.5.1 | 2 层嵌套可用 |

#### Epic E2.6 快捷键补齐

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E2.6.1 | 对齐/分布/成组/锁定/隐藏 | 2d | FE-B | - | 快捷键面板可查 |

### Phase E3：开放生态

#### Epic E3.1 类型注册式

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E3.1.1 | registry 作为类型真源改造 | 2-3d | ARCH | - | 新增类型无需改 base/types.ts |
| E3.1.2 | 85+ widget 兼容层 + 分批迁移 | 3-5d | FE-A | E3.1.1 | 全量通过 |

#### Epic E3.2 第三方 SDK

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E3.2.1 | createWidgetPlugin API + 类型 | 2d | ARCH | E3.1.2 | API 可用 |
| E3.2.2 | 打包配置 + 脚手架 | 2d | FE-B | E3.2.1 | 外部可独立打包 |
| E3.2.3 | 开发指南文档 | 1.5d | FE-B | E3.2.2 | 含示例 |

#### Epic E3.3 市场

| 编号 | 任务 | 工时 | 角色 | 依赖 | 验收 |
|------|------|------|------|------|------|
| E3.3.1 | Widget 市场入口升级 | 2d | FE-A | E3.2.2 | 可安装外部包 |
| E3.3.2 | 安全审计（沙箱/权限/来源） | 2d | ARCH | E3.3.1 | 审计报告 |

---

## 三、排期与里程碑

> 假设 2-3 人并行，W1 起。Spike 与治理先行。

| 周次 | E1 | E2 | E3 | 里程碑 |
|------|-----|-----|-----|--------|
| W1 | Spike E1.0 + E1.1 治理 | - | - | M1: 文档对齐 + deprecated 清理 |
| W2 | E1.2 虚拟化 | - | - | - |
| W3 | E1.2 虚拟化 + E1.3 撤销 | - | - | - |
| W4 | E1.3 撤销 + E1.4 主题 | - | - | M2: 画布虚拟化可用 |
| W5 | E1.4 动画 + 大屏 demo | - | - | **M3: E1 大屏地基完成（可发布大屏 demo）** |
| W6 | - | E2.1 可观测性 + E2.4 拆分 | - | M4: 埋点上线 |
| W7 | - | E2.2 i18n | - | - |
| W8 | - | E2.2 i18n + E2.3 发布态 | - | M5: i18n 覆盖 ≥ 80% |
| W9 | - | E2.5 容器 + E2.6 快捷键 | - | **M6: E2 体验深化完成** |
| W10 | - | - | E3.1 类型改造 | - |
| W11 | - | - | E3.1 迁移 + E3.2 SDK | - |
| W12 | - | - | E3.2 SDK + 文档 | **M7: E3 开放生态 V1** |

关键依赖链：
```
E1.0.1 Spike → E1.2 虚拟化 → M3 大屏地基
E1.0.2 Spike → E1.3 撤销 → M3
E2.1.1 telemetry（依赖 server 端点）→ E2.1.2 埋点 → M4
E2.2.1 i18n 框架 → E2.2.2/3 文案抽取 → M5
E3.1.1 类型改造 → E3.1.2 迁移 → E3.2 SDK → M7
```

---

## 四、技术预研（Spike）

| Spike | 问题 | 产出 | 工时 | 阻塞 |
|-------|------|------|------|------|
| S1 画布虚拟化 PoC | 视口剔除在绝对定位画布的可行性 + EditorOverlay 命中是否需重写 | 原型 + 100 widget FPS 基准 + 命中方案 | 2-3d | E1.2 全部 |
| S2 immer patches PoC | patch 方案对 500 widget 的体积/性能 + 函数/Date 保留验证 | 方案验证 + 兼容报告 | 1-2d | E1.3 全部 |
| S3 i18n 复用边界 | platform-shared 引入 vue-i18n 是否影响 flow/ai 现有 ElConfigProvider | 影响评估 + 接入方案 | 0.5d | E2.2.1 |
| S4 容器嵌套调研 | 嵌套容器是否高频需求 + 递归碰撞性能 | 决策文档 | 1d | E2.5.2 |

---

## 五、测试策略

| 层级 | 范围 | 工具 | 门槛 |
|------|------|------|------|
| 单元测试 | 新增 composable（useViewportCulling）、telemetry、i18n | vitest | 新增代码覆盖率 ≥ 70% |
| 集成测试 | 撤销重做、虚拟化 + 拖拽、PropertyPanel 拆分 | vitest | 核心场景全过 |
| 性能测试 | 100/200/500 widget 编辑 FPS、undo/redo 响应 | dragOptimization.spec.ts 扩展 | 100 widget FPS ≥ 30 |
| 回归测试 | 现有 55 个测试 + 85 widget 全量渲染 | vitest 全量 | 0 失败 |
| E2E | 大屏 demo 搭建到发布全流程 | 待补（现仅 e2e-smoke） | demo 可发布 |

**重点回归项**：虚拟化后拖拽/选中/辅助线/对齐、撤销重做后 widget 状态、i18n 切换后布局、PropertyPanel 拆分后所有属性编辑。

---

## 六、跨项目依赖与协同

| 依赖项 | 依赖方 | 协同方 | 阻塞任务 | 处理 |
|--------|--------|--------|----------|------|
| server 新增 /api/telemetry 上报端点 | editor + ai | server 团队 | E2.1.1 | 早期提接口契约，server 排期 |
| platform-shared i18n 模块 | editor | platform-shared 维护者 | E2.2.1 | editor 侧主导，shared 侧 review |
| platform-shared telemetry 模块 | editor + ai | platform-shared 维护者 | E2.1.1 | 同上 |
| Widget 类型迁移影响 server VALID_WIDGET_TYPES | editor | server 团队 | E3.1.2 | 同步类型清单 |

**红线**（CLAUDE.md）：前端禁止改 server。所有 server 侧工作走协同，前端按已有接口适配。

---

## 七、风险登记（技术维度）

| 风险 | 等级 | 影响 | 应对 |
|------|------|------|------|
| 虚拟化重写 EditorOverlay 命中计算导致拖拽回归 | 高 | 交互全错 | Spike S1 先验证命中方案；影子实现 + 回归全覆盖后切换 |
| immer patches 重写撤销重做 | 高 | 历史功能全坏 | S2 PoC 验证；保留旧方案分支，灰度切换 |
| server /api/telemetry 排期滞后 | 中 | 埋点阻塞 | 先用 console + 本地存储过渡，端点就绪后切换上报 |
| 85+ widget 类型迁移工作量大 | 中 | E3 延期 | 兼容层 + 分批迁移，非一次性 |
| i18n 文案抽取遗漏 | 低 | 英文界面残留中文 | CI 扫描硬编码中文，门槛逐步收紧 |

---

## 八、交付物清单

| 里程碑 | 交付物 | 验收人 |
|--------|--------|--------|
| M1 | 文档对齐 + deprecated 清理 | 架构师 |
| M2 | 画布虚拟化可用（100 widget FPS ≥ 30） | 架构师 + QA |
| M3 | **可发布大屏 demo**（10+ 图表 + 联动 + 实时刷新 + 主题） | 产品 + 架构师 |
| M4 | 埋点 dashboard 可见用户漏斗 | 产品 |
| M5 | i18n 覆盖 ≥ 80%，可切英文 | 架构师 |
| M6 | 发布态模式 + PropertyPanel 拆分 + 快捷键 | 架构师 |
| M7 | 第三方 widget SDK + 开发指南 + 1 个外部包接入 | 架构师 |

---

## 九、执行建议

1. **W1 先做 Spike + 治理**：S1/S2 不通过则 E1.2/E1.3 方案要调整，避免返工。
2. **E1 是硬阻塞**：大屏 demo 跑不起来，后续 E2/E3 价值打折。M3 是第一道硬关。
3. **跨项目依赖早协同**：W1 就与 server 团队对齐 /api/telemetry 契约。
4. **渐进迁移**：E3.1.2 widget 类型迁移分批，每批验证通过再继续。
5. **每周回归**：现有 55 个测试 + 85 widget 渲染是安全网，每周全量跑。
