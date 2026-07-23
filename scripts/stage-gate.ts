/**
 * 阶段门禁检查脚本
 * 检查当前阶段是否满足进入下一阶段的条件
 * 用法: tsx scripts/stage-gate.ts [phase]
 * phase: r | m | l (默认 r)
 */

import { execSync } from 'child_process'

interface GateResult {
  name: string
  passed: boolean
  detail: string
}

const phase = process.argv[2] || 'r'

function run(cmd: string): { ok: boolean; output: string } {
  try {
    const output = execSync(cmd, { encoding: 'utf-8', cwd: import.meta.dirname + '/..' })
    return { ok: true, output: output.trim() }
  } catch (e: any) {
    return { ok: false, output: (e.stdout || e.stderr || '').trim() }
  }
}

function checkTests(): GateResult {
  const result = run('pnpm test 2>&1')
  const passed = result.ok
  const match = result.output.match(/(\d+) passed/)
  return {
    name: '测试通过率 100%',
    passed,
    detail: passed ? `${match?.[1] || '?'} tests passed` : 'Tests failed',
  }
}

function checkI18nCoverage(minPct: number): GateResult {
  const result = run('npx tsx scripts/check-i18n-coverage.ts 2>&1')
  const match = result.output.match(/覆盖率\(行\):\s*([\d.]+)%/)
  const pct = match ? parseFloat(match[1]) : 0
  return {
    name: `i18n 覆盖率 ≥ ${minPct}%`,
    passed: pct >= minPct,
    detail: `当前 ${pct}%`,
  }
}

function checkWidgetCount(min: number): GateResult {
  const result = run('grep -r "registerWidget" src/widgets/ | wc -l')
  const count = parseInt(result.output) || 0
  return {
    name: `Widget 注册数 ≥ ${min}`,
    passed: count >= min,
    detail: `当前 ${count}`,
  }
}

function checkTestSpecCount(min: number): GateResult {
  const result = run('find src -name "*.test.ts" -o -name "*.spec.ts" | wc -l')
  const count = parseInt(result.output) || 0
  return {
    name: `测试规格文件 ≥ ${min}`,
    passed: count >= min,
    detail: `当前 ${count}`,
  }
}

// 定义各阶段门禁
const gates: Record<string, GateResult[]> = {
  r: [
    checkTests(),
    checkI18nCoverage(80),
    checkWidgetCount(97),
    checkTestSpecCount(103),
    {
      name: 'Flex 插入指示线可用',
      passed: false, // 手动检查
      detail: '需手动验证',
    },
    {
      name: 'Flex 拖拽重排可用',
      passed: false,
      detail: '需手动验证',
    },
    {
      name: '样式面板增强完成',
      passed: false,
      detail: '需手动验证',
    },
  ],
  m: [
    checkTests(),
    checkWidgetCount(103), // 新增 6 个 widget
    checkTestSpecCount(110),
    {
      name: '地图 Widget 可用',
      passed: false,
      detail: '需手动验证',
    },
    {
      name: '图表钻取联动可用',
      passed: false,
      detail: '需手动验证',
    },
  ],
  l: [
    checkTests(),
    checkI18nCoverage(90),
    {
      name: 'AI 页面生成增强',
      passed: false,
      detail: '需手动验证',
    },
  ],
}

const currentGates = gates[phase] || gates.r
const allPassed = currentGates.every(g => g.passed)
const passedCount = currentGates.filter(g => g.passed).length

console.log(`\n========================================`)
console.log(`  Phase ${phase.toUpperCase()} 阶段门禁检查`)
console.log(`  ${new Date().toLocaleString()}`)
console.log(`========================================\n`)

for (const gate of currentGates) {
  const icon = gate.passed ? '✅' : '❌'
  console.log(`  ${icon} ${gate.name} — ${gate.detail}`)
}

console.log(`\n----------------------------------------`)
console.log(`  通过: ${passedCount}/${currentGates.length}`)
console.log(`  状态: ${allPassed ? '✅ 可进入下一阶段' : '❌ 未满足门禁条件'}`)
console.log(`========================================\n`)

process.exit(allPassed ? 0 : 1)
