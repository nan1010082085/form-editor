/**
 * i18n 覆盖率检测脚本
 * 扫描 src/ 下所有 .vue/.ts 文件，统计硬编码中文字符串
 * 用法: tsx scripts/check-i18n-coverage.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, extname } from 'path'

const SRC_DIR = join(import.meta.dirname, '..', 'src')
const ZH_LOCALE = join(SRC_DIR, 'locales', 'editor-zh-CN.ts')

// 排除的目录
const EXCLUDE_DIRS = ['node_modules', 'dist', '__tests__', 'workers']
// 排除的文件模式
const EXCLUDE_FILES = ['.test.ts', '.spec.ts', 'editor-zh-CN.ts', 'editor-en-US.ts', 'zh-CN.ts', 'en-US.ts']

// 匹配中文字符的正则（排除注释和 import 语句）
const CHINESE_REGEX = /[\u4e00-\u9fff]/
// 匹配 t('xxx') 或 t("xxx") 调用
const T_CALL_REGEX = /\bt\s*\(\s*['"]([\w.]+)['"]/

interface FileInfo {
  path: string
  relativePath: string
  chineseLines: { line: number; content: string }[]
  translatedLines: { line: number; key: string }[]
}

function walkDir(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry)) {
        files.push(...walkDir(fullPath))
      }
    } else {
      const ext = extname(entry)
      if (ext === '.vue' || ext === '.ts') {
        const isExcluded = EXCLUDE_FILES.some(pattern => entry.includes(pattern))
        if (!isExcluded) {
          files.push(fullPath)
        }
      }
    }
  }
  return files
}

function analyzeFile(filePath: string): FileInfo {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const relativePath = relative(SRC_DIR, filePath)

  const chineseLines: { line: number; content: string }[] = []
  const translatedLines: { line: number; key: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // 跳过注释行
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue
    }

    // 检查 t() 调用
    const tMatch = line.match(T_CALL_REGEX)
    if (tMatch) {
      translatedLines.push({ line: lineNum, key: tMatch[1] })
    }

    // 检查硬编码中文（排除 import 语句和类型定义）
    if (CHINESE_REGEX.test(line) && !trimmed.startsWith('import ') && !trimmed.startsWith('type ') && !trimmed.startsWith('interface ')) {
      // 排除 t() 调用中的中文（已翻译）
      if (!tMatch) {
        chineseLines.push({ line: lineNum, content: trimmed.slice(0, 100) })
      }
    }
  }

  return { path: filePath, relativePath, chineseLines, translatedLines }
}

// 主逻辑
console.log('=== Editor i18n 覆盖率报告 ===\n')

const allFiles = walkDir(SRC_DIR)
const results = allFiles.map(analyzeFile)

// 统计
const totalFiles = results.length
const filesWithChinese = results.filter(r => r.chineseLines.length > 0)
const filesWithTranslation = results.filter(r => r.translatedLines.length > 0)
const totalChineseLines = results.reduce((sum, r) => sum + r.chineseLines.length, 0)
const totalTranslatedLines = results.reduce((sum, r) => sum + r.translatedLines.length, 0)

// 统计 locale key 数量
let localeKeyCount = 0
try {
  const zhContent = readFileSync(ZH_LOCALE, 'utf-8')
  const keyMatches = zhContent.matchAll(/(\w+):\s*['"]/g)
  localeKeyCount = [...keyMatches].length
} catch {}

console.log('--- 总体统计 ---')
console.log(`扫描文件数:       ${totalFiles}`)
console.log(`含中文文件数:     ${filesWithChinese.length}`)
console.log(`已翻译文件数:     ${filesWithTranslation.length}`)
console.log(`硬编码中文行数:   ${totalChineseLines}`)
console.log(`已翻译 key 数:    ${totalTranslatedLines}`)
console.log(`Locale key 数:    ${localeKeyCount}`)
console.log(`覆盖率(文件):     ${((filesWithTranslation.length / totalFiles) * 100).toFixed(1)}%`)
console.log(`覆盖率(行):       ${totalTranslatedLines > 0 ? ((totalTranslatedLines / (totalTranslatedLines + totalChineseLines)) * 100).toFixed(1) : 0}%`)

// 按目录分组
console.log('\n--- 按目录统计 ---')
const dirStats = new Map<string, { total: number; translated: number; chinese: number }>()
for (const r of results) {
  const dir = r.relativePath.split('/').slice(0, 2).join('/')
  const existing = dirStats.get(dir) || { total: 0, translated: 0, chinese: 0 }
  existing.total++
  existing.translated += r.translatedLines.length > 0 ? 1 : 0
  existing.chinese += r.chineseLines.length
  dirStats.set(dir, existing)
}

const sortedDirs = [...dirStats.entries()].sort((a, b) => b[1].chinese - a[1].chinese)
for (const [dir, stats] of sortedDirs.slice(0, 20)) {
  const coverage = stats.total > 0 ? ((stats.translated / stats.total) * 100).toFixed(0) : '0'
  console.log(`  ${dir.padEnd(40)} ${stats.translated}/${stats.total} files (${coverage}%)  ${stats.chinese} hardcoded lines`)
}

// Top 硬编码中文文件
console.log('\n--- Top 20 硬编码中文文件 ---')
const topFiles = results
  .filter(r => r.chineseLines.length > 0)
  .sort((a, b) => b.chineseLines.length - a.chineseLines.length)
  .slice(0, 20)

for (const f of topFiles) {
  console.log(`  ${f.chineseLines.length.toString().padStart(4)} lines  ${f.relativePath}`)
}
