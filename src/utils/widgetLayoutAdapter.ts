/**
 * widgetLayoutAdapter - Board Layout模式 <-> Widget 骨架适配
 *
 * Board.canvas.layoutMode 是地基, Widget 树是骨架；
 * 加载/切换Layout/拖入WidgetHrs需统一 style 与 position 语义。
 *
 * grid 模式：
 * - 满宽Type width: 100% + gridSpan=-1
 * - 默认 height: auto（随内容）, 避免 free 的 position.h 锁死视觉Height
 * - Chart等保留/补齐显式Height
 */
import type { BoardLayoutMode, Widget } from "@/widgets/base/types";

/** Grid 模式下默认撑满ContainerWidth的Widget */
const GRID_FULL_WIDTH_TYPES = new Set<string>([
  "form",
  "card",
  "tabs",
  "single-col",
  "double-col",
  "triple-col",
  "quad-col",
  "row-container",
  "tree-layout",
  "crud-list-page",
  "advanced-table",
  "table",
  "tree-table",
  "title",
  "banner",
  "descriptions",
  "toolbar-buttons",
  "user-management",
  "role-management",
  "flow-timeline",
  "flow-task-actions",
  "adhoc-query",
  "notification",
  "calendar",
  "kanban",
]);

/** Grid 模式下Height随内容伸缩, 并给MinHeight的块级Widget */
const GRID_AUTO_HEIGHT_TYPES = new Set<string>([
  "form",
  "card",
  "tabs",
  "single-col",
  "double-col",
  "triple-col",
  "quad-col",
  "row-container",
  "tree-layout",
  "crud-list-page",
  "advanced-table",
  "table",
  "tree-table",
  "user-management",
  "role-management",
  "descriptions",
  "calendar",
  "kanban",
  "dialog",
]);

/**
 * 需要显式像素Height的Widget（Chart/嵌入等）。
 * Grid 下不能改成 auto, 否则画布坍缩。
 */
const GRID_FIXED_HEIGHT_TYPES = new Set<string>([
  "bar-chart",
  "stacked-bar-chart",
  "horizontal-bar-chart",
  "line-chart",
  "area-chart",
  "pie-chart",
  "donut-chart",
  "scatter-chart",
  "bubble-chart",
  "radar",
  "gauge",
  "heatmap",
  "funnel",
  "candlestick",
  "gantt-chart",
  "micro-app-container",
]);

/**
 * 判断 style.height 是否仍是 free Layout从 position.h Sync来的Default value。
 * 这类Height在 Grid 流式Layout中应改为 auto, 否则Property面板数Value与实际渲染不一致。
 */
export function isPositionSyncedHeight(widget: Widget): boolean {
  const h = widget.style?.height;
  if (h == null || h === "") return true;
  if (typeof h !== "string") return false;
  if (h === "auto" || h.endsWith("%")) return false;
  const posH = widget.position?.h;
  if (posH == null) return false;
  const unit = widget.position?.hUnit ?? "px";
  return h === `${posH}${unit}` || h === `${posH}px`;
}

function walkWidgets(widgets: Widget[], visitor: (w: Widget) => void): void {
  for (const w of widgets) {
    visitor(w);
    if (w.children?.length) walkWidgets(w.children as Widget[], visitor);
  }
}

/**
 * @param widget - 待适配Widget
 */
function adaptWidgetToGrid(widget: Widget): void {
  // 根级默认满Row：未Config gridSpan Hrs用 -1, 避免 span=1 挤在窄Column里「看不见/不可用」
  if (widget.gridSpan === undefined) {
    widget.gridSpan = -1;
  }

  // 流式Layout：Width跟所在Column走, 清掉 free 默认的 240px 等固定宽
  widget.style = { ...widget.style, width: "100%" };

  if (GRID_FIXED_HEIGHT_TYPES.has(widget.type)) {
    const h = widget.style?.height;
    if (!h || h === "auto" || isPositionSyncedHeight(widget)) {
      const px = Math.max(widget.position?.h ?? 0, 200);
      widget.style = { ...widget.style, height: `${px}px` };
    }
    return;
  }

  // 默认随内容增高：清掉 position Sync来的固定 px, 保留User自定义 height
  if (isPositionSyncedHeight(widget)) {
    const next: Record<string, unknown> = {
      ...(widget.style ?? {}),
      height: "auto",
    };
    if (GRID_AUTO_HEIGHT_TYPES.has(widget.type)) {
      next.minHeight = (widget.style?.minHeight as string) ?? "48px";
    }
    widget.style = next;
    return;
  }

  if (GRID_AUTO_HEIGHT_TYPES.has(widget.type)) {
    widget.style = {
      ...widget.style,
      height: (widget.style?.height as string) || "auto",
      minHeight: (widget.style?.minHeight as string) ?? "48px",
    };
  }
}

/**
 * @param widget - 待适配Widget
 */
function adaptWidgetToFree(widget: Widget): void {
  const pos = widget.position;
  if (!pos) return;
  const wUnit = pos.wUnit ?? "px";
  const hUnit = pos.hUnit ?? "px";
  widget.style = {
    ...(widget.style ?? {}),
    width: `${pos.w}${wUnit}`,
    height: `${pos.h}${hUnit}`,
  };
}

/** 按 Board Layout模式适配整棵 Widget 树 */
export function adaptWidgetsToBoardLayout(
  widgets: Widget[],
  layoutMode: BoardLayoutMode = "free",
): Widget[] {
  walkWidgets(widgets, (w) => {
    if (layoutMode === "grid") {
      adaptWidgetToGrid(w);
    } else {
      adaptWidgetToFree(w);
    }
  });
  return widgets;
}

/** 新建/拖入的单个 Widget 适配当前 Board Layout */
export function adaptWidgetToBoardLayout(
  widget: Widget,
  layoutMode: BoardLayoutMode = "free",
): Widget {
  adaptWidgetsToBoardLayout([widget], layoutMode);
  return widget;
}

/** Grid 模式下拖入根级Widget的默认Style（Gap由画布 gap 控制, 无需 margin） */
export function gridRootWidgetDefaults(type: string): {
  style: Partial<Widget["style"]>;
  gridSpan?: number;
} {
  const style: Partial<Widget["style"]> = {};
  let gridSpan: number | undefined;

  if (GRID_FULL_WIDTH_TYPES.has(type)) {
    style.width = "100%";
    gridSpan = -1;
  }
  if (GRID_FIXED_HEIGHT_TYPES.has(type)) {
    style.height = "300px";
  } else {
    style.height = "auto";
    if (GRID_AUTO_HEIGHT_TYPES.has(type)) {
      style.minHeight = "48px";
    }
  }
  return { style, gridSpan };
}

export {
  GRID_FULL_WIDTH_TYPES,
  GRID_AUTO_HEIGHT_TYPES,
  GRID_FIXED_HEIGHT_TYPES,
};
