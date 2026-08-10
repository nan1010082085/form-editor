/**
 * @vitest-environment node
 *
 * 静态扫描：代码里 t/tt("editor.xxx") 必须在中英文 locale 都有叶子文案。
 * 防止出现按钮直接露出 editor.editorView.confirmLeave 这类 raw key。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import zhMod from "@/locales/editor-zh-CN";
import enMod from "@/locales/editor-en-US";

const zhEditor = (zhMod as { editor: Record<string, unknown> }).editor;
const enEditor = (enMod as { editor: Record<string, unknown> }).editor;

/**
 * 收集对象树叶子路径（相对 editor）
 */
function leafKeys(
  obj: Record<string, unknown>,
  prefix = "",
): Set<string> {
  const out = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const child of leafKeys(v as Record<string, unknown>, path)) {
        out.add(child);
      }
    } else {
      out.add(path);
    }
  }
  return out;
}

/**
 * 判断 editor 相对路径是否存在且为字符串
 */
function hasLeaf(
  root: Record<string, unknown>,
  relativePath: string,
): boolean {
  const parts = relativePath.split(".");
  let cur: unknown = root;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return false;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string";
}

/**
 * 递归收集源码文件
 */
function walkSrc(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "dist", "coverage"].includes(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walkSrc(path, acc);
    else if (/\.(vue|ts|tsx)$/.test(name) && !name.endsWith(".spec.ts")) {
      acc.push(path);
    }
  }
  return acc;
}

/**
 * 从源码提取静态 editor.* i18n key（不含模板字符串插值）
 */
function collectUsedEditorKeys(srcRoot: string): string[] {
  const files = walkSrc(srcRoot);
  const used = new Set<string>();
  const re = /(?:^|[^.\w])(?:t|tt)\(\s*['"`](editor\.[^'"`$]+?)['"`]/g;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    let match: RegExpExecArray | null;
    while ((match = re.exec(text))) {
      used.add(match[1]);
    }
  }
  return [...used].sort();
}

describe("editor locale coverage", () => {
  const zhLeaves = leafKeys(zhEditor);
  const enLeaves = leafKeys(enEditor);
  const usedKeys = collectUsedEditorKeys(join(process.cwd(), "src"));

  it("中英文 locale 文件无同级重复 key（避免后写覆盖前写）", () => {
    /**
     * 扫描对象字面量同级重复 key（brace depth 跟踪）。
     */
    function findDuplicateKeys(filePath: string): string[] {
      const text = readFileSync(filePath, "utf8");
      const lines = text.split("\n");
      let depth = 0;
      const stackMaps: Array<Map<string, number> | undefined> = [new Map()];
      const dups: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const keyMatch = line.match(/^\s*([A-Za-z_][\w-]*)\s*:/);
        const open = (line.match(/{/g) || []).length;
        const close = (line.match(/}/g) || []).length;
        if (keyMatch && !line.trim().startsWith("//")) {
          const key = keyMatch[1];
          const map = stackMaps[depth] ?? (stackMaps[depth] = new Map());
          if (map.has(key)) {
            dups.push(`${key} @ L${map.get(key)} and L${i + 1}`);
          } else {
            map.set(key, i + 1);
          }
        }
        for (let c = 0; c < open; c++) {
          depth++;
          stackMaps[depth] = new Map();
        }
        for (let c = 0; c < close; c++) {
          stackMaps[depth] = undefined;
          depth = Math.max(0, depth - 1);
        }
      }
      return dups;
    }

    const zhDups = findDuplicateKeys(
      join(process.cwd(), "src/locales/editor-zh-CN.ts"),
    );
    const enDups = findDuplicateKeys(
      join(process.cwd(), "src/locales/editor-en-US.ts"),
    );
    expect(zhDups, `zh duplicate keys: ${zhDups.join("; ")}`).toEqual([]);
    expect(enDups, `en duplicate keys: ${enDups.join("; ")}`).toEqual([]);
  });

  it("中英文 editor 叶子 key 一一对应", () => {
    const missingInZh = [...enLeaves].filter((k) => !zhLeaves.has(k)).sort();
    const missingInEn = [...zhLeaves].filter((k) => !enLeaves.has(k)).sort();
    expect(missingInZh, `en 有而 zh 缺: ${missingInZh.join(", ")}`).toEqual(
      [],
    );
    expect(missingInEn, `zh 有而 en 缺: ${missingInEn.join(", ")}`).toEqual(
      [],
    );
  });

  it("源码静态引用的 editor.* key 中英文都存在", () => {
    const missingZh: string[] = [];
    const missingEn: string[] = [];
    for (const full of usedKeys) {
      const rel = full.startsWith("editor.") ? full.slice(7) : full;
      if (!hasLeaf(zhEditor, rel)) missingZh.push(full);
      if (!hasLeaf(enEditor, rel)) missingEn.push(full);
    }
    expect(missingZh, `代码引用但 zh 缺失: ${missingZh.join(", ")}`).toEqual(
      [],
    );
    expect(missingEn, `代码引用但 en 缺失: ${missingEn.join(", ")}`).toEqual(
      [],
    );
  });

  it("离开确认相关关键 key 齐全", () => {
    const required = [
      "common.unsavedChanges",
      "common.info",
      "common.cancel",
      "editorView.confirmLeave",
    ];
    for (const key of required) {
      expect(hasLeaf(zhEditor, key), `zh missing ${key}`).toBe(true);
      expect(hasLeaf(enEditor, key), `en missing ${key}`).toBe(true);
    }
    expect(zhEditor.editorView).toMatchObject({ confirmLeave: "确定离开" });
    expect(enEditor.editorView).toMatchObject({ confirmLeave: "Leave" });
  });
});
