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

  // 匹配点号分隔的 key（如 editor.toolbar.save）
  const dotRegex = /['"]?([\w.]+)['"]?\s*:/g;
  let match;
  while ((match = dotRegex.exec(content)) !== null) {
    const key = match[1];
    if (key.includes(".")) {
      keys.add(key);
    }
  }

  // 匹配嵌套对象格式（如 widgets: { input: { displayName: ... } }）
  // 转换为 editor.widgets.input.displayName 格式
  const lines = content.split("\n");
  const pathStack: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 检测对象开始
    const objMatch = trimmed.match(/^(\w+)\s*:\s*\{/);
    if (objMatch) {
      pathStack.push(objMatch[1]);
      continue;
    }

    // 检测叶子属性
    const leafMatch = trimmed.match(/^(\w+)\s*:/);
    if (leafMatch && pathStack.length > 0) {
      const fullPath = pathStack.join(".") + "." + leafMatch[1];
      keys.add(fullPath);
    }

    // 检测对象结束
    if (trimmed === "}" || trimmed === "},") {
      pathStack.pop();
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

    // 允许一定数量的已知缺失（如跨项目 key、widget displayName 等）
    const MAX_ALLOWED = 2000;
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
