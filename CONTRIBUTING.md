# Editor 贡献指南

## 文档与代码同步

修改以下内容时，**必须同步更新**文档中的统计数字与描述：

| 变更类型 | 需更新的文档 |
|----------|-------------|
| 新增/删除 Pinia Store | `README.md`、`CLAUDE.md`、`docs/architecture.md`、`docs/README.md`、本文 |
| 新增/删除 composable | 同上 |
| 新增/删除 Widget / registerWidget | 同上 + `docs/capabilities.md` 分组表（若有） |
| 新增/删除测试文件 | 同上测试数量 |
| 产品能力变更 | `docs/capabilities.md`、必要时 `docs/iteration-evolution.md` Backlog |

### 当前基准（2026-07-20）

| 指标 | 数量 |
|------|------|
| Pinia Store | **12** |
| Composable | **46** |
| Widget 目录 | **85** |
| registerWidget | **91** |
| Vitest `*.spec.ts` | **99** |
| API 模块 | **11** |

## 校验

```bash
cd editor && pnpm test
```

性能相关变更额外确认：

- `src/__tests__/dragOptimization.spec.ts`
- `src/__tests__/performance.spec.ts`
- `src/__tests__/useViewportCulling.spec.ts`
- `src/__tests__/dashboardDemo.spec.ts`（若改大屏种子）

## 新增 Widget

1. `src/widgets/<name>/`：组件 + `config.ts`
2. `registerWidget`（或 `createWidgetPlugin`）于 `widgets/index.ts`
3. **无需**修改 `SchemaType` 联合字面量（已为 `string`）
4. 更新文档统计数字

详见 [docs/widget-development.md](./docs/widget-development.md)、[docs/third-party-widget-guide.md](./docs/third-party-widget-guide.md)。
