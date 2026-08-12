/**
 * axe-scan.ts — Editor 可访问性扫描脚本
 *
 * 使用 @axe-core/playwright 扫描关键页面，输出 Critical/Serious 问题。
 *
 * 用法：
 *   npx tsx scripts/axe-scan.ts
 *   npx tsx scripts/axe-scan.ts --url http://localhost:5100/instances
 */

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

interface AxeIssue {
  id: string
  impact: string
  description: string
  help: string
  helpUrl: string
  nodes: number
}

const DEFAULT_URLS = [
  { name: 'Login', url: 'http://localhost:5100/login' },
  { name: 'Instances', url: 'http://localhost:5100/instances' },
  { name: 'Editor', url: 'http://localhost:5100/editor/6655e4f8e4b0e4a3c8a1b2c3' },
]

async function scanPage(url: string, name: string): Promise<AxeIssue[]> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1000) // 等待动态内容加载

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const issues: AxeIssue[] = results.violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => ({
        id: v.id,
        impact: v.impact ?? 'unknown',
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
      }))

    console.log(`\n✅ ${name} (${url}): ${issues.length} issues`)
    return issues
  } catch (err) {
    console.error(`❌ ${name} (${url}): ${err}`)
    return []
  } finally {
    await context.close()
    await browser.close()
  }
}

async function main() {
  console.log('🔍 Editor axe 扫描开始...\n')

  const customUrl = process.argv.find((arg) => arg.startsWith('--url='))
  const urls = customUrl
    ? [{ name: 'Custom', url: customUrl.split('=')[1] }]
    : DEFAULT_URLS

  const allIssues: Array<AxeIssue & { page: string }> = []

  for (const { name, url } of urls) {
    const issues = await scanPage(url, name)
    for (const issue of issues) {
      allIssues.push({ ...issue, page: name })
    }
  }

  // 输出汇总
  console.log('\n' + '='.repeat(60))
  console.log('📊 扫描结果汇总')
  console.log('='.repeat(60))

  if (allIssues.length === 0) {
    console.log('✅ 无 Critical/Serious 问题')
  } else {
    console.log(`❌ 共 ${allIssues.length} 个 Critical/Serious 问题：\n`)

    for (const issue of allIssues) {
      console.log(`[${issue.impact.toUpperCase()}] ${issue.page}: ${issue.help}`)
      console.log(`  ID: ${issue.id}`)
      console.log(`  影响节点: ${issue.nodes}`)
      console.log(`  详情: ${issue.helpUrl}`)
      console.log('')
    }
  }

  // 退出码
  process.exit(allIssues.length > 0 ? 1 : 0)
}

main().catch(console.error)
