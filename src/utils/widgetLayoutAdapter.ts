/**
 * widgetLayoutAdapter - Board 布局模式 <-> Widget 骨架适配
 *
 * Board.canvas.layoutMode 是地基，Widget 树是骨架；
 * 加载/切换布局/拖入部件时需统一 style 与 position 语义。
 *
 * grid 模式：widget 不设 marginBottom（由画布 CSS Grid gap 统一控制间距），
 *           仅设置 width: 100% 和 height: auto。
 */
import type { BoardLayoutMode, Widget } from "@/widgets/base/types";

/** Grid 模式下默认撑满容器宽度的部件 */
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

/** Grid 模式下高度随内容伸缩的块级部件 */
const GRID_AUTO_HEIGHT_TYPES = new Set<string>([
  "form",
  "crud-list-page",
  "advanced-table",
  "table",
  "tree-table",
  "user-management",
  "role-management",
  "descriptions",
  "calendar",
  "kanban",
]);

function walkWidgets(widgets: Widget[], visitor: (w: Widget) => void): void {
  for (const w of widgets) {
    visitor(w);
    if (w.children?.length) walkWidgets(w.children as Widget[], visitor);
  }
}

function adaptWidgetToGrid(widget: Widget): void {
  if (GRID_FULL_WIDTH_TYPES.has(widget.type)) {
    widget.style = { ...widget.style, width: "100%" };
    // 满宽部件默认撑满剩余列（-1 = span remaining）
    if (widget.gridSpan === undefined) widget.gridSpan = -1;
  }
  if (GRID_AUTO_HEIGHT_TYPES.has(widget.type)) {
    widget.style = {
      ...widget.style,
      height: "auto",
      minHeight: widget.style?.minHeight ?? "120px",
    };
  }
}

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

/** 按 Board 布局模式适配整棵 Widget 树 */
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

/** 新建/拖入的单个 Widget 适配当前 Board 布局 */
export function adaptWidgetToBoardLayout(
  widget: Widget,
  layoutMode: BoardLayoutMode = "free",
): Widget {
  adaptWidgetsToBoardLayout([widget], layoutMode);
  return widget;
}

/** Grid 模式下拖入根级部件的默认样式（间距由画布 gap 控制，无需 margin） */
export function gridRootWidgetDefaults(type: string): {
  style: Partial<Widget["style"]>;
  gridSpan?: number;
} {
  const style: Partial<Widget["style"]> = {};
  let gridSpan: number | undefined;

  if (GRID_FULL_WIDTH_TYPES.has(type)) {
    style.width = "100%";
    gridSpan = -1; // 满宽部件撑满剩余列
  }
  if (GRID_AUTO_HEIGHT_TYPES.has(type)) {
    style.height = "auto";
    style.minHeight = "120px";
  }
  return { style, gridSpan };
}
