# 可视化编辑器 · 产品迭代进化路线（本轮已收口）

> 视角：从产品成熟度与用户价值出发，规划 Editor 从「表单设计器」到「页面/大屏搭建器」再到「开放搭建平台」的演进。
> 日期：2026-07-20 · **状态：本轮计划已关闭（E1 完成，E2/E3 部分完成）**
> 执行计划文档 `dev-execution-plan.md` 已随本轮收口删除；后续缺口见文末「残留 Backlog」。

---

## 本轮结论（2026-07-20）

| 阶段 | 结论 | 说明 |
|------|------|------|
| **E1 大屏地基** | ✅ 完成 | 文档对齐、视口剔除、immer 撤销、大屏 Demo、主题/动画骨架、deprecated 别名清理 |
| **E2 体验深化** | 🟡 部分 | 发布态模式、快捷键、埋点客户端、PropertyPanel 初拆、嵌套决策文档已有；i18n 覆盖、埋点 dashboard、面板 &lt;10KB 未达标 |
| **E3 开放生态** | 🟡 部分 | SchemaType 注册式 + createWidgetPlugin + 指南已有；脚手架、市场、外部包接入未做 |

**产品判断**：表单能力仍是基本盘；大屏「可编辑可发布」门槛已跨过，但「丝滑可度量」与「第三方生态」尚未闭环。下一轮应优先可观测性（server 上报）与真实用户大屏场景验证，而非继续铺开放市场。

---

## 一、现状诊断（收口时快照）

### 1.1 定位

Schema 驱动的可视化表单设计器，已具备页面/大屏双模式地基；开放平台仍处雏形。

### 1.2 不足清单（收口时状态）

| 编号 | 不足 | 收口状态 |
|------|------|----------|
| E-01 | 文档统计脱节 | ✅ 已对齐主要数字；CI 文档校验未上 |
| E-02 | 画布无虚拟化 | ✅ 视口剔除已接入编辑态 |
| E-03 | 撤销 JSON 深拷贝 | ✅ immer patches |
| E-04 | Widget 类型硬编码 | ✅ SchemaType=string + registry |
| E-05 | i18n 空转 | 🟡 框架+语言包+Toolbar 部分接入 |
| E-06 | 4 种模式只用 2 种 | ✅ 编辑器 + PublishView query |
| E-07 | 无生产监控 | 🟡 客户端埋点；无 server/dashboard |
| E-08 | deprecated 未清理 | 🟡 别名已删；WidgetRule 类型仍保留 |
| E-09 | PropertyPanel 过大 | 🟡 已拆子组件，主文件仍 &gt;10KB |
| E-10 | 容器不能嵌套 | 🟡 决策：有限 2 层；代码仍偏单层提升 |

---

## 二、成功度量（本轮勾选）

### E1（硬性）

- [x] 文档三处 Store/Widget 主数字对齐（README/CLAUDE/architecture）
- [ ] CI「改代码必改文档」校验（未做，转入 Backlog）
- [x] 视口剔除 + 专项性能测试（latency；非 FPS 探针）
- [x] immer 撤销；大 schema 基准测试覆盖
- [x] 大屏 Demo（dashboard-demo：10+ 图表 + 联动 + 自动刷新 + 深色主题）
- [x] deprecated 别名清零（WidgetRule 类型残留见 Backlog）

### E2

- [x] 关键路径埋点客户端（save/publish/delete/undo）
- [ ] 监控 dashboard 上线（依赖 server）
- [ ] i18n 覆盖率 ≥ 80%
- [x] publish-interactive / publish-readonly 可用
- [ ] PropertyPanel 单文件 &lt; 10KB

### E3

- [x] 新增类型无需改联合类型字面量（SchemaType=string）
- [x] 第三方开发指南（无脚手架）
- [ ] 至少 1 个外部 widget 包接入

---

## 三、残留 Backlog（下一轮产品输入）

1. **P0** server `/telemetry` + 行为漏斗 dashboard（否则体验优化无数据）
2. **P1** 真实大屏用户场景走查（100+ widget FPS 体感、Demo 发布链路）
3. **P1** i18n 按模块扩到 PropertyPanel / InstancesView
4. **P2** PropertyPanel 继续拆到 &lt;10KB；移除 WidgetRule
5. **P2** 嵌套策略代码对齐决策（最多 2 层，而非一律提升）
6. **P3** Widget SDK 脚手架 + 市场（开放生态第二阶段再开）

---

## 四、历史决策（保留）

| 决策 | 倾向 | 备注 |
|------|------|------|
| D1 表单与大屏 | A 单一编辑器双模式 | 维持 |
| D2 撤销方案 | immer patches（落地） | 完成 |
| D3 容器嵌套 | 有限 2 层 | 决策已写；实现待对齐 |
| D4 监控 | 自研对接平台 | 前端已备；等 server |
| D5 i18n | 按模块渐进 | 进行中 |

---

## 五、与 roadmap 关系

本文档本轮收口后，**不再作为活跃执行清单**。技术细项以代码与 [editor-review-and-roadmap.md](./editor-review-and-roadmap.md) 为准；新一轮产品规划请另开文档，并以上表 Backlog 为输入。
