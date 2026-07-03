/**
 * widgetLayoutAdapter — Board 布局模式 ↔ Widget 骨架适配
 *
 * Board.canvas.layoutMode 是地基，Widget 树是骨架；
 * 加载/切换布局/拖入部件时需统一 style 与 position 语义。
 */
import type { BoardLayoutMode, Widget } from '@/widgets/base/types'

/** Flex 模式下默认撑满容器宽度的部件 */
const FLEX_FULL_WIDTH_TYPES = new Set<string>([
  'form',
  'card',
  'tabs',
  'single-col',
  'double-col',
  'triple-col',
  'quad-col',
  'tree-layout',
  'crud-list-page',
  'advanced-table',
  'table',
  'tree-table',
  'title',
  'banner',
  'descriptions',
  'toolbar-buttons',
  'user-management',
  'role-management',
  'flow-timeline',
  'flow-task-actions',
  'adhoc-query',
  'notification',
  'calendar',
  'kanban',
])

/** Flex 模式下高度随内容伸缩的块级部件 */
const FLEX_AUTO_HEIGHT_TYPES = new Set<string>([
  'form',
  'crud-list-page',
  'advanced-table',
  'table',
  'tree-table',
  'user-management',
  'role-management',
  'descriptions',
  'calendar',
  'kanban',
])

function walkWidgets(widgets: Widget[], visitor: (w: Widget) => void): void {
  for (const w of widgets) {
    visitor(w)
    if (w.children?.length) walkWidgets(w.children as Widget[], visitor)
  }
}

function adaptWidgetToFlex(widget: Widget): void {
  if (FLEX_FULL_WIDTH_TYPES.has(widget.type)) {
    widget.style = { ...widget.style, width: '100%' }
  }
  if (FLEX_AUTO_HEIGHT_TYPES.has(widget.type)) {
    widget.style = {
      ...widget.style,
      height: 'auto',
      minHeight: widget.style?.minHeight ?? '120px',
    }
  }
  if (!widget.style?.marginBottom && widget.type !== 'spacer' && widget.type !== 'divider') {
    widget.style = { ...widget.style, marginBottom: '12px' }
  }
}

function adaptWidgetToFree(widget: Widget): void {
  const pos = widget.position
  if (!pos) return
  const wUnit = pos.wUnit ?? 'px'
  const hUnit = pos.hUnit ?? 'px'
  widget.style = {
    ...(widget.style ?? {}),
    width: `${pos.w}${wUnit}`,
    height: `${pos.h}${hUnit}`,
  }
}

/** 按 Board 布局模式适配整棵 Widget 树 */
export function adaptWidgetsToBoardLayout(
  widgets: Widget[],
  layoutMode: BoardLayoutMode = 'free',
): Widget[] {
  walkWidgets(widgets, (w) => {
    if (layoutMode === 'flex') {
      adaptWidgetToFlex(w)
    } else {
      adaptWidgetToFree(w)
    }
  })
  return widgets
}

/** 新建/拖入的单个 Widget 适配当前 Board 布局 */
export function adaptWidgetToBoardLayout(
  widget: Widget,
  layoutMode: BoardLayoutMode = 'free',
): Widget {
  adaptWidgetsToBoardLayout([widget], layoutMode)
  return widget
}

/** Flex 模式下拖入根级部件的默认流式样式（无绝对坐标依赖） */
export function flexRootWidgetDefaults(type: string): Partial<Widget['style']> {
  const base: Partial<Widget['style']> = { marginBottom: '12px' }
  if (FLEX_FULL_WIDTH_TYPES.has(type)) {
    base.width = '100%'
  }
  if (FLEX_AUTO_HEIGHT_TYPES.has(type)) {
    base.height = 'auto'
    base.minHeight = '120px'
  }
  return base
}
