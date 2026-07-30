#!/usr/bin/env tsx
/**
 * check-docs-sync - 文档同步校验
 *
 * 文档已于 2026-07 独立至 sibling `../docs/` 项目（VitePress 站点，仓库 ai-platform-docs），
 * editor 仓库内不再持有 docs/ 目录。跨仓库的代码-文档同步无法在本仓库 CI 内强制校验，
 * 改由人工遵循 CONTRIBUTING.md「文档与代码同步」约束，在 `../docs/editor/` 下维护。
 */
console.log('✓ 文档已独立至 ../docs/ 项目，editor 仓库内跳过文档同步校验（见 CONTRIBUTING.md）')
process.exit(0)
