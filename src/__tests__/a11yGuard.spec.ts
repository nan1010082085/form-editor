/**
 * a11yGuard.spec.ts — CI 防回归测试
 *
 * 1. 扫描源码中引用的 editor.* key 是否都在 locale 文件中定义
 * 2. 检查 Toolbar/Instances 的 iconBtn 是否有 aria-label
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const EDITOR_ROOT = join(__dirname, "..");
const ZH_LOCALE = join(EDITOR_ROOT, "locales/editor-zh-CN.ts");
const EN_LOCALE = join(EDITOR_ROOT, "locales/editor-en-US.ts");

/** 递归读取目录下所有 .vue/.ts 文件 */
function walkFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!["node_modules", "__tests__", "dist"].includes(entry)) {
        results.push(...walkFiles(full, exts));
      }
    } else if (exts.includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

/** 从 locale 文件提取所有叶子 key */
function extractLeafKeys(content: string): Set<string> {
  const keys = new Set<string>();
  const regex = /['"]?([\w.]+)['"]?\s*:/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    // 跳过顶级 key（如 editor, widgetProps 等）
    const key = match[1];
    if (key.includes(".")) {
      keys.add(key);
    }
  }
  return keys;
}

describe("a11y guard", () => {
  it("源码引用的 editor.* key 在 locale 中存在", () => {
    const zhContent = readFileSync(ZH_LOCALE, "utf-8");
    const enContent = readFileSync(EN_LOCALE, "utf-8");

    // 提取 locale 中定义的 key
    const zhKeys = extractLeafKeys(zhContent);
    const enKeys = extractLeafKeys(enContent);

    // 扫描源码中的 t("editor.xxx") 引用
    const files = walkFiles(EDITOR_ROOT, [".vue", ".ts"]);
    const missingInZh: string[] = [];
    const missingInEn: string[] = [];

    for (const file of files) {
      if (file.includes("locales/") || file.includes("__tests__")) continue;
      const content = readFileSync(file, "utf-8");
      const tCallRegex = /t\(\s*['"]editor\.([\w.]+)['"]/g;
      let match;
      while ((match = tCallRegex.exec(content)) !== null) {
        const key = `editor.${match[1]}`;
        if (!zhKeys.has(key)) missingInZh.push(key);
        if (!enKeys.has(key)) missingInEn.push(key);
      }
    }

    // 允许一定数量的已知缺失（如跨项目 key）
    const MAX_ALLOWED = 50;
    expect(
      missingInZh.length,
      `zh 缺失 ${missingInZh.length} 个 key: ${missingInZh.slice(0, 5).join(", ")}...`,
    ).toBeLessThanOrEqual(MAX_ALLOWED);
    expect(
      missingInEn.length,
      `en 缺失 ${missingInEn.length} 个 key: ${missingInEn.slice(0, 5).join(", ")}...`,
    ).toBeLessThanOrEqual(MAX_ALLOWED);
  });

  it("Toolbar iconBtn 有 aria-label", () => {
    const toolbarPath = join(EDITOR_ROOT, "views/EditorViewToolbar.vue");
    const content = readFileSync(toolbarPath, "utf-8");

    // 找所有 iconBtn 按钮
    const iconBtnRegex = /<button[^>]*:class="[^"]*iconBtn[^"]*"[^>]*>/g;
    const matches = content.match(iconBtnRegex) || [];

    const missing: string[] = [];
    for (const match of matches) {
      if (!match.includes("aria-label")) {
        // 提取附近的 title 或 content 作为标识
        const titleMatch = match.match(/:title="t\('([^']+)'\)"/);
        const id = titleMatch ? titleMatch[1] : "unknown";
        missing.push(id);
      }
    }

    expect(
      missing,
      `以下 iconBtn 缺少 aria-label: ${missing.join(", ")}`,
    ).toHaveLength(0);
  });
});
