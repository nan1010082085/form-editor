# Editor 贡献指南

## 文档与代码同步

修改以下路径时，**必须同步更新**文档中的统计数字与描述：

| 变更类型 | 需更新的文档 |
|----------|-------------|
| 新增/删除 Pinia Store | `README.md`、`CLAUDE.md`、`docs/architecture.md` 中的 Store 数量与清单 |
| 新增/删除 composable | 同上 Composable 数量 |
| 新增/删除 Widget | 同上 Widget 数量与分组说明 |
| 新增/删除测试文件 | 同上测试数量 |

当前基准（2026-07-20）：

- **12** 个 Pinia Store
- **44** 个 composable
- **85** 个 Widget 目录 / **91** 个 registerWidget 注册项
- **53** 个 vitest 规格文件

## 校验

提交前运行：

```bash
cd editor && pnpm test
```

性能相关变更需额外确认 `src/__tests__/dragOptimization.spec.ts` 与 `performance.spec.ts` 通过。
