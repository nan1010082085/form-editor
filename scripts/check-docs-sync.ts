#!/usr/bin/env tsx
/**
 * check-docs-sync — 改代码必改文档校验
 *
 * 检查当前改动中，src/ 下的关键文件是否同步更新了 docs/ 或 README。
 * 用法：scripts/check-docs-sync.ts（CI 或 pre-push hook 中调用）
 *
 * 规则：
 * - 若改动仅在 src/__tests__/ 或 src/locales/，不要求文档更新（测试/翻译不算功能变更）
 * - 若改动在 src/stores/、src/composables/、src/widgets/（config.ts）、src/routes/、docs/ 下，
 *   则要求 docs/ 或 README.md 也有变更
 * - 若 docs/ 本身有变更，直接通过
 */
import { execSync } from 'node:child_process'

function getChangedFiles(): string[] {
  try {
    // 获取相对于 main 分支的变更文件（CI 环境）或最近一次 commit（本地）
    const base = process.env.CI_BASE_REF || 'HEAD~1'
    const out = execSync(`git diff --name-only ${base}...HEAD 2>/dev/null || git diff --name-only HEAD~1`, {
      encoding: 'utf-8',
      timeout: 5000,
    })
    return out.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function main() {
  const files = getChangedFiles()
  if (files.length === 0) {
    console.log('✓ 无文件变更，跳过文档校验')
    process.exit(0)
  }

  const docsChanged = files.some(f => f.startsWith('docs/') || f === 'README.md' || f === 'CHANGELOG.md')

  // 排除测试和翻译文件
  const codeChanged = files.some(f =>
    (f.startsWith('src/') || f.startsWith('server/src/'))
    && !f.includes('__tests__')
    && !f.includes('.spec.')
    && !f.includes('/locales/')
    && !f.includes('.module.scss')
    && !f.endsWith('.css')
  )

  // 仅配置/样式/测试变更不要求文档
  if (!codeChanged) {
    console.log('✓ 仅测试/样式/配置变更，不要求文档更新')
    process.exit(0)
  }

  // 有代码变更但无文档变更
  if (!docsChanged) {
    console.error('✗ 检测到代码变更但未更新文档：')
    const codeFiles = files.filter(f =>
      (f.startsWith('src/') || f.startsWith('server/src/'))
      && !f.includes('__tests__')
      && !f.includes('.spec.')
    )
    for (const f of codeFiles.slice(0, 10)) {
      console.error(`  - ${f}`)
    }
    if (codeFiles.length > 10) console.error(`  ... and ${codeFiles.length - 10} more`)
    console.error('\n请同步更新 docs/ 或 README.md')
    process.exit(1)
  }

  console.log('✓ 代码与文档变更同步')
  process.exit(0)
}

main()
