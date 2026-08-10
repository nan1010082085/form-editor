import type { Widget } from "@/widgets/base/types";

export interface SchemaDragPayload {
  source: "panel" | "canvas";
  type?: string;
  id?: string;
}

/**
 * dragover 阶段无法 getData, 将Type编码进 MIME 名, 供 types Column表Parse。
 * 例：application/x-schema-type/input
 */
export const SCHEMA_TYPE_MIME_PREFIX = "application/x-schema-type/";

/**
 * 从 dataTransfer.types Parse面板拖入的 schema type（dragover 可用）。
 */
export function resolveSchemaTypeFromDragTypes(
  types: readonly string[] | DOMStringList,
): string | undefined {
  const list = Array.from(types as ArrayLike<string>);
  for (const t of list) {
    if (t.startsWith(SCHEMA_TYPE_MIME_PREFIX)) {
      return t.slice(SCHEMA_TYPE_MIME_PREFIX.length) || undefined;
    }
  }
  return undefined;
}

/**
 * 根据 dataTransfer.types 选择合法的 dropEffect。
 * 面板拖入带 `schema-type`（effectAllowed=copy）；画布重排仅有
 * `application/schema-drag`（effectAllowed=move）。dropEffect 必须落在
 * effectAllowed 内, 否则浏览器拒绝 drop。
 */
export function resolveSchemaDragDropEffect(
  types: readonly string[] | DOMStringList,
): "copy" | "move" {
  const list = Array.from(types as ArrayLike<string>);
  return list.includes("schema-type") ||
    list.some((t) => t.startsWith(SCHEMA_TYPE_MIME_PREFIX))
    ? "copy"
    : "move";
}

export function parseSchemaDragData(
  event: DragEvent,
): SchemaDragPayload | null {
  const raw = event.dataTransfer?.getData("application/schema-drag");
  if (raw) {
    try {
      return JSON.parse(raw) as SchemaDragPayload;
    } catch {
      return null;
    }
  }
  const schemaType = event.dataTransfer?.getData("schema-type");
  if (schemaType) return { source: "panel", type: schemaType };
  return null;
}

/** 根据落点 Y 计算根级 Widget 插入Index */
export function resolveGridInsertIndex(
  container: HTMLElement,
  clientY: number,
  rootWidgets: Widget[],
): number {
  for (let i = 0; i < rootWidgets.length; i++) {
    const el = container.querySelector(
      `[data-widget-id="${rootWidgets[i].id}"]`,
    );
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (clientY < mid) return i;
  }
  return rootWidgets.length;
}

/**
 * 将"Filter后 siblings Column表"中的IndexMap回"未Filter全量 children"中的Index。
 *
 * tabs Container按 activeKey Filter、col Container按 colIndex Filter后, 拖放落点Index是相对
 * FilterColumn表的；而 insertWidgetAt/moveWidgetToIndex 直接 splice 进未Filter的
 * container.children。若不做Map, 多 tab / 多 col 场景插入位置会错位。
 *
 * - filteredIndex 指向 filtered 末尾之后：返回 full 末尾（full.length）
 * - 否则：返回 filtered[filteredIndex] 在 full 中的真实下标
 */
export function mapFilteredIndexToFull(
  filtered: Widget[],
  full: Widget[],
  filteredIndex: number,
): number {
  if (filteredIndex >= filtered.length) return full.length;
  if (filteredIndex < 0) return 0;
  const anchor = filtered[filteredIndex];
  if (!anchor) return full.length;
  const fullIdx = full.findIndex((w) => w.id === anchor.id);
  return fullIdx < 0 ? full.length : fullIdx;
}

/** 插入指示线标记 class（dragover Hrs挂到目标 widget 元素上） */
export const GRID_INSERT_BEFORE_CLASS = "grid-insert-before";
export const GRID_INSERT_AFTER_CLASS = "grid-insert-after";

/**
 * 在 drop zone 内渲染插入指示线：根据 insertIndex 给对应 widget 元素挂标记 class。
 * - insertIndex < N：第 insertIndex 个 widget 加 `grid-insert-before`
 * - insertIndex === N：最后一个 widget 加 `grid-insert-after`
 * 调用方需在 dragleave/drop Hrs调用 clearGridInsertIndicator 清除。
 */
export function renderGridInsertIndicator(
  container: HTMLElement,
  rootWidgets: Widget[],
  insertIndex: number,
): void {
  clearGridInsertIndicator(container);
  if (insertIndex < 0 || rootWidgets.length === 0) return;

  if (insertIndex >= rootWidgets.length) {
    const last = container.querySelector(
      `[data-widget-id="${rootWidgets[rootWidgets.length - 1].id}"]`,
    );
    last?.classList.add(GRID_INSERT_AFTER_CLASS);
    return;
  }

  const target = container.querySelector(
    `[data-widget-id="${rootWidgets[insertIndex].id}"]`,
  );
  target?.classList.add(GRID_INSERT_BEFORE_CLASS);
}

/** 清除 drop zone 内所有插入指示标记 */
export function clearGridInsertIndicator(container: HTMLElement): void {
  container
    .querySelectorAll(
      `.${GRID_INSERT_BEFORE_CLASS}, .${GRID_INSERT_AFTER_CLASS}`,
    )
    .forEach((el) => {
      el.classList.remove(GRID_INSERT_BEFORE_CLASS, GRID_INSERT_AFTER_CLASS);
    });
}
