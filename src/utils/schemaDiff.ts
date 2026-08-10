/**
 * Schema Diff 算法
 *
 * 递归比较两棵 Widget 树, 生成差异ActionColumn表。
 * 支持识别：Create / Delete / 修改 / 移动（父子关系变化）
 */
import type { Widget } from "@/widgets/base/types";

// ============================================================
// Type定义
// ============================================================

/** Field级变化 */
export interface FieldChange {
  /** 变化的Field路径（如 'props.placeholder'） */
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/** 单个 Widget 差异 */
export interface WidgetDiff {
  /** Widget ID */
  id: string;
  /** Widget Name */
  name: string;
  /** Widget Type */
  type: string;
  /** Widget Label */
  label?: string;
  /** 树中的路径（如 'card-001 / input-002'） */
  path: string;
  /** 具体Field变化（修改Hrs有Value） */
  changes?: FieldChange[];
}

/** 差异结果 */
export interface DiffResult {
  added: WidgetDiff[];
  removed: WidgetDiff[];
  modified: WidgetDiff[];
  moved: WidgetDiff[];
}

// ============================================================
// 内部工具
// ============================================================

/** 要忽略比较的Field — 这些是运RowHrsStatusor由子节点 diff 单独处理 */
const IGNORED_KEYS = new Set(["disabled", "children"]);

/**
 * 递归展平 Widget 树为 Map<id, { widget, path, parentId }>。
 */
function flattenTree(
  widgets: Widget[],
  parentPath = "",
  parentId?: string,
): Map<
  string,
  { widget: Widget; path: string; parentId?: string; parentWidget?: Widget }
> {
  const map = new Map<
    string,
    { widget: Widget; path: string; parentId?: string; parentWidget?: Widget }
  >();
  for (const w of widgets) {
    const displayLabel = w.label || w.field || w.name || w.type;
    const segment = `${displayLabel}(${w.type})`;
    const path = parentPath ? `${parentPath} / ${segment}` : segment;
    map.set(w.id, { widget: w, path, parentId });
    if (w.children) {
      for (const [id, entry] of flattenTree(w.children, path, w.id)) {
        map.set(id, entry);
      }
    }
  }
  return map;
}

/**
 * 递归收集Field级变化。
 */
function collectFieldChanges(
  oldVal: unknown,
  newVal: unknown,
  prefix: string,
  changes: FieldChange[],
): void {
  if (oldVal === newVal) return;
  if (oldVal == null && newVal == null) return;

  // 如果其中一个是原始Valueor null, 直接比较
  if (
    typeof oldVal !== "object" ||
    oldVal === null ||
    typeof newVal !== "object" ||
    newVal === null ||
    Array.isArray(oldVal) !== Array.isArray(newVal)
  ) {
    changes.push({ field: prefix, oldValue: oldVal, newValue: newVal });
    return;
  }

  // 数组比较
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);
    if (oldStr !== newStr) {
      changes.push({ field: prefix, oldValue: oldVal, newValue: newVal });
    }
    return;
  }

  // 对象比较 — 遍历所有 key
  const oldObj = oldVal as Record<string, unknown>;
  const newObj = newVal as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of allKeys) {
    if (IGNORED_KEYS.has(key)) continue;
    const childPath = prefix ? `${prefix}.${key}` : key;
    collectFieldChanges(oldObj[key], newObj[key], childPath, changes);
  }
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 比较两棵 Widget 树, Back差异结果。
 *
 * @param oldWidgets - 旧Version Widget 数组
 * @param newWidgets - 新Version Widget 数组
 * @returns DiffResult
 */
export function diffSchema(
  oldWidgets: Widget[],
  newWidgets: Widget[],
): DiffResult {
  const oldMap = flattenTree(oldWidgets);
  const newMap = flattenTree(newWidgets);

  const added: WidgetDiff[] = [];
  const removed: WidgetDiff[] = [];
  const modified: WidgetDiff[] = [];
  const moved: WidgetDiff[] = [];

  // 遍历旧Version：检测 removed / modified / moved
  for (const [id, oldEntry] of oldMap) {
    const newEntry = newMap.get(id);
    if (!newEntry) {
      // 被Delete
      removed.push({
        id,
        name: oldEntry.widget.name,
        type: oldEntry.widget.type,
        label: oldEntry.widget.label,
        path: oldEntry.path,
      });
      continue;
    }

    // 检查父节点变化（移动）
    if (oldEntry.parentId !== newEntry.parentId) {
      moved.push({
        id,
        name: newEntry.widget.name,
        type: newEntry.widget.type,
        label: newEntry.widget.label,
        path: newEntry.path,
      });
    }

    // 检查内容变化
    const changes: FieldChange[] = [];
    collectFieldChanges(oldEntry.widget, newEntry.widget, "", changes);
    if (changes.length > 0) {
      modified.push({
        id,
        name: newEntry.widget.name,
        type: newEntry.widget.type,
        label: newEntry.widget.label,
        path: newEntry.path,
        changes,
      });
    }
  }

  // 遍历新Version：检测 added
  for (const [id, newEntry] of newMap) {
    if (!oldMap.has(id)) {
      added.push({
        id,
        name: newEntry.widget.name,
        type: newEntry.widget.type,
        label: newEntry.widget.label,
        path: newEntry.path,
      });
    }
  }

  return { added, removed, modified, moved };
}

/**
 * 计算差异Statistics摘要。
 */
export function getDiffSummary(result: DiffResult): string {
  const parts: string[] = [];
  if (result.added.length) parts.push(`${result.added.length}  added`);
  if (result.removed.length) parts.push(`${result.removed.length}  removed`);
  if (result.modified.length) parts.push(`${result.modified.length}  modified`);
  if (result.moved.length) parts.push(`${result.moved.length}  moved`);
  return parts.length > 0 ? parts.join(", ") : "No differences";
}
