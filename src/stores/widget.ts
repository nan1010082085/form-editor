/**
 * useWidgetStore — Widget 集合的 CRUD 和树结构操作
 *
 * 职责：
 * - Widget[] 的增删改查
 * - 树结构遍历（递归搜索、父节点查找）
 * - 位置操作（移动、缩放、层级）
 * - 容器操作（添加到容器、从容器移除、重新挂载）
 * - 表单容器绑定（formId）
 * - 页签绑定（tabKey）
 * - 行列绑定（colIndex）
 * - 表单值收集
 *
 * 这是 Widget 数据的唯一 source of truth。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Widget, ContainerType, BoardLayoutMode } from '../widgets/base/types'
import { useAllContainerTypes } from '../composables/useConstant'
import { adaptWidgetToBoardLayout, adaptWidgetsToBoardLayout } from '../utils/widgetLayoutAdapter'
import { getWidget } from '../widgets/registry'
import { useBoardStore } from './board'

/** 获取容器组件类型集合（动态） */
function getContainerTypes(): Set<string> {
  return useAllContainerTypes() as Set<string>
}

/** 容器嵌套深度上限：根级容器 -> 一级子容器，不允许多于 2 层（见 docs/container-nesting-decision.md） */
const MAX_CONTAINER_DEPTH = 1

/** 默认 position */
const DEFAULT_POSITION = { x: 0, y: 0, w: 240, h: 40, xUnit: 'px' as const, yUnit: 'px' as const, wUnit: 'px' as const, hUnit: 'px' as const, zIndex: 1 }

/** 将 position 宽高同步到 style，供仍读取 style.width/height 的部件使用 */
function syncStyleDimensions(widget: Widget): void {
  const pos = widget.position ?? DEFAULT_POSITION
  const wUnit = pos.wUnit ?? 'px'
  const hUnit = pos.hUnit ?? 'px'
  widget.style = {
    ...(widget.style ?? {}),
    width: `${pos.w}${wUnit}`,
    height: `${pos.h}${hUnit}`,
  }
}

/**
 * 递归补全 widget 的 position 字段。
 * 数据库中的旧数据可能缺少 position，导致渲染崩溃。
 */
function normalizePosition(widgets: Widget[]): Widget[] {
  return widgets.map((w) => {
    if (!w.position || typeof w.position !== 'object') {
      w.position = { ...DEFAULT_POSITION }
    } else {
      w.position.x = w.position.x ?? 0
      w.position.y = w.position.y ?? 0
      w.position.w = w.position.w ?? 240
      w.position.h = w.position.h ?? 40
      if (w.position.xUnit === undefined) w.position.xUnit = 'px'
      if (w.position.yUnit === undefined) w.position.yUnit = 'px'
      if (w.position.wUnit === undefined) w.position.wUnit = 'px'
      if (w.position.hUnit === undefined) w.position.hUnit = 'px'
      if (w.position.zIndex === undefined) w.position.zIndex = 1
    }
    syncStyleDimensions(w)
    if (w.children?.length) {
      w.children = normalizePosition(w.children) as Widget[]
    }
    return w
  })
}

/**
 * 列容器容量检查与自动分配 colIndex
 * 返回 true 表示容量已满，无法添加
 */
function checkAndAssignColIndex(
  widget: Widget,
  container: Widget,
  colContainerColumns: number,
): boolean {
  if (widget.colIndex === undefined) {
    const colCounts = new Array(colContainerColumns).fill(0)
    for (const child of container.children ?? []) {
      const ci = (child as Widget).colIndex ?? 0
      if (ci < colContainerColumns) colCounts[ci]++
    }
    widget.colIndex = colCounts.indexOf(Math.min(...colCounts))
  }
  const targetCol = widget.colIndex ?? 0
  const existing = container.children?.filter(c => (c as Widget).colIndex === targetCol) ?? []
  return existing.length >= 1
}

/**
 * 计算列容器中子部件的位置和尺寸
 * 列宽支持固定 px（>0）和自适应（0），固定列优先占位，剩余空间均分给自适应列。
 */
function calculateColPosition(
  widget: Widget,
  container: Widget,
  colContainerColumns: number,
): void {
  const colWidths = (container.props?.colWidths as number[]) || []
  const gutter = (container.props?.gutter as number) || 0
  const colCount = colContainerColumns
  const colIdx = widget.colIndex ?? 0

  const boardStore = useBoardStore()
  const canvasWidth = boardStore.getCanvasWidthPx()
  const canvasHeight = boardStore.getCanvasHeightPx()
  const containerWUnit = container.position?.wUnit ?? 'px'
  const containerHUnit = container.position?.hUnit ?? 'px'
  const containerW = containerWUnit === '%' ? (canvasWidth * container.position.w / 100) : container.position.w
  const containerH = containerHUnit === '%' ? (canvasHeight * container.position.h / 100) : container.position.h

  const totalGutter = gutter * (colCount - 1)
  const availableW = containerW - totalGutter

  const fixedWidths: number[] = []
  let fixedTotal = 0
  let autoCount = 0
  for (let j = 0; j < colCount; j++) {
    const w = colWidths[j] ?? 0
    if (w > 0) {
      fixedWidths[j] = w
      fixedTotal += w
    } else {
      autoCount++
    }
  }
  const autoWidth = autoCount > 0 ? (availableW - fixedTotal) / autoCount : 0

  let xOffset = 0
  for (let j = 0; j < colIdx; j++) {
    const w = colWidths[j] ?? 0
    xOffset += (w > 0 ? w : autoWidth) + gutter
  }
  const myWidth = colWidths[colIdx] > 0 ? colWidths[colIdx] : autoWidth

  widget.position.x = xOffset
  widget.position.y = 0
  widget.position.w = myWidth
  widget.position.h = containerH
}

/** 列容器类型 → 列数映射 */
const COL_CONTAINER_COLUMNS: Record<string, number> = {
  'single-col': 1,
  'double-col': 2,
  'triple-col': 3,
  'quad-col': 4,
}

/** 获取列容器的列数，非列容器返回 0 */
function getColContainerColumns(type: string): number {
  return COL_CONTAINER_COLUMNS[type] ?? 0
}

/**
 * 容器嵌套治理：容器之间允许互相嵌套（dialog 装表单、card 装 tabs、tabs 嵌套 tabs 等），
 * 但限制最多 2 层（根级容器 -> 一级子容器，见 docs/container-nesting-decision.md）。
 *
 * 加载时：
 * 1. 递归去重 id（防御性）
 * 2. 超过 MAX_CONTAINER_DEPTH 的容器子节点提升到最近的合法父级列表（扁平化），
 *    保证旧 schema 不会因嵌套过深而无法编辑。
 *
 * 返回 { kept, promoted }：kept 为本层保留节点，promoted 为本层超限提升出来的节点，
 * 由调用方决定提升到何处（根级或父级 children）。
 */
function sanitizeContainerNesting(widgets: Widget[]): Widget[] {
  const seenIds = new Set<string>()
  const containerTypes = getContainerTypes()

  function walk(list: Widget[], depth: number): { kept: Widget[]; promoted: Widget[] } {
    const kept: Widget[] = []
    const promoted: Widget[] = []
    for (const w of list) {
      if (seenIds.has(w.id)) continue
      seenIds.add(w.id)
      if (w.children?.length) {
        const childDepth = containerTypes.has(w.type) ? depth + 1 : depth
        const childKept: Widget[] = []
        const childPromoted: Widget[] = []
        for (const child of w.children) {
          const isContainer = containerTypes.has(child.type)
          // 容器子节点且已达深度上限：提升
          if (isContainer && childDepth > MAX_CONTAINER_DEPTH) {
            childPromoted.push(child)
          } else {
            childKept.push(child)
          }
        }
        const sub = walk(childKept, childDepth)
        w.children = sub.kept
        kept.push(w)
        // 子层提升的 + 本层超限提升的，交给上层处理
        promoted.push(...sub.promoted, ...childPromoted)
      } else {
        kept.push(w)
      }
    }
    return { kept, promoted }
  }

  const { kept, promoted } = walk(widgets, 0)
  return promoted.length ? [...kept, ...promoted] : kept
}

export const useWidgetStore = defineStore('widget', () => {
  // ================================================================
  // 数据
  // ================================================================

  const widgets = ref<Widget[]>([])

  // ================================================================
  // 多页面 Widget 管理
  // ================================================================

  /** 页面 Widget 缓存（pageId → widgets） */
  const pageWidgets = new Map<string, Widget[]>()

  /** 将当前 widgets 保存到指定页面缓存 */
  function savePageWidgets(pageId: string): void {
    if (!pageId) return
    pageWidgets.set(pageId, [...widgets.value])
  }

  /** 从页面缓存加载 widgets（返回加载的 widgets 数量） */
  function loadPageWidgets(pageId: string): number {
    const cached = pageWidgets.get(pageId)
    if (cached) {
      widgets.value = cached
      return cached.length
    }
    return 0
  }

  /** 切换页面：保存当前页 → 加载目标页 */
  function switchPage(fromPageId: string, toPageId: string, toPageWidgets?: Widget[]): void {
    savePageWidgets(fromPageId)
    const cached = pageWidgets.get(toPageId)
    if (cached) {
      widgets.value = cached
    } else if (toPageWidgets) {
      loadWidgets(toPageWidgets)
      pageWidgets.set(toPageId, [...widgets.value])
    } else {
      widgets.value = []
    }
  }

  /** 清除页面缓存 */
  function clearPageCache(): void {
    pageWidgets.clear()
  }

  // ================================================================
  // Widget 索引（O(1) 查找，避免递归 DFS）
  // ================================================================

  /** 建立 id → Widget 的平坦索引 */
  function buildIndex(list: Widget[]): Map<string, Widget> {
    const index = new Map<string, Widget>()
    function walk(items: Widget[]) {
      for (const item of items) {
        index.set(item.id, item)
        if (item.children?.length) {
          walk(item.children as Widget[])
        }
      }
    }
    walk(list)
    return index
  }

  /** Widget 索引 — 每次 widgets 引用变化时重建 */
  const widgetIndex = computed(() => buildIndex(widgets.value))

  // ================================================================
  // 树结构遍历
  // ================================================================

  /**
   * 查找 Widget。优先 O(1) 索引查找，回退到递归 DFS。
   */
  function findWidget(id: string, list?: Widget[]): Widget | null {
    // 快速路径：使用索引（仅当从默认 widgets 查找时）
    if (!list) {
      return widgetIndex.value.get(id) ?? null
    }
    // 指定列表时回退到递归
    for (const widget of list) {
      if (widget.id === id) return widget
      if (widget.children) {
        const found = findWidget(id, widget.children)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 查找包含目标 Widget 的父 Widget。
   * 目标在根级时返回 null。
   */
  function findParent(id: string, list: Widget[] = widgets.value): Widget | null {
    for (const widget of list) {
      if (widget.children?.some((c) => c.id === id)) return widget
      if (widget.children) {
        const found = findParent(id, widget.children)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 判断目标是否在根级。
   */
  function isRootWidget(id: string): boolean {
    return widgets.value.some((w) => w.id === id)
  }

  function isDescendantOf(ancestorId: string, descendantId: string): boolean {
    const ancestor = findWidget(ancestorId)
    if (!ancestor?.children?.length) return false
    const walk = (list: Widget[]): boolean => {
      for (const w of list) {
        if (w.id === descendantId) return true
        if (w.children?.length && walk(w.children as Widget[])) return true
      }
      return false
    }
    return walk(ancestor.children as Widget[])
  }

  function extractWidgetFromTree(id: string): Widget | null {
    const rootIdx = widgets.value.findIndex((w) => w.id === id)
    if (rootIdx >= 0) {
      const list = [...widgets.value]
      const [item] = list.splice(rootIdx, 1)
      widgets.value = list
      return item
    }
    const parent = findParent(id)
    if (!parent?.children) return null
    const idx = parent.children.findIndex((c) => c.id === id)
    if (idx < 0) return null
    return parent.children.splice(idx, 1)[0] as Widget
  }

  /**
   * 计算容器在树中的嵌套深度（根级=0，根级容器的子容器=1，依此类推）。
   * 用于实施「最多 2 层容器嵌套」决策（见 docs/container-nesting-decision.md）。
   */
  function getContainerDepth(widgetId: string): number {
    let depth = 0
    let parent = findParent(widgetId)
    while (parent) {
      if (getContainerTypes().has(parent.type)) depth += 1
      parent = findParent(parent.id)
    }
    return depth
  }

  /** 将部件放入容器前设置 tabKey / 列索引等元数据，返回 false 表示无法放入 */
  function prepareContainerChild(widget: Widget, container: Widget): boolean {
    // 容器允许嵌套（dialog 装表单、card 装 tabs、tabs 嵌套 tabs 等），
    // 但限制最多 2 层（根级容器 -> 一级子容器）。目标容器已是子容器时，
    // 拒绝再放入容器类型，由调用方 fallback 到根级，避免无限嵌套。
    if (getContainerTypes().has(widget.type)) {
      const containerDepth = getContainerDepth(container.id)
      if (containerDepth >= MAX_CONTAINER_DEPTH) {
        console.warn(`[widgetStore] 容器嵌套超过 ${MAX_CONTAINER_DEPTH + 1} 层，已提升到根级`)
        return false
      }
    }

    if (container.type === 'tabs' && !widget.tabKey) {
      const tabs = container.props?.tabs as Array<{ key: string }> | undefined
      const activeKey = container.props?.activeKey as string | undefined
      widget.tabKey = activeKey || tabs?.[0]?.key || 'tab1'
    }

    const colContainerColumns = getColContainerColumns(container.type)
    if (colContainerColumns > 0) {
      if (checkAndAssignColIndex(widget, container, colContainerColumns)) return false
      calculateColPosition(widget, container, colContainerColumns)
    }

    // row-container 子节点填满单元格（span 控制单元格宽度，控件本身 100% 撑满）
    if (container.type === 'row-container') {
      widget.style = { ...(widget.style ?? {}), width: '100%' }
    }

    return true
  }

  /**
   * 从指定列表中按 ID 移除 Widget（递归）。
   * 返回是否成功移除。
   */
  function removeFromList(id: string, list: Widget[]): boolean {
    const idx = list.findIndex((w) => w.id === id)
    if (idx >= 0) {
      list.splice(idx, 1)
      return true
    }
    for (const widget of list) {
      if (widget.children && removeFromList(id, widget.children)) return true
    }
    return false
  }

  /**
   * 获取所有 Widget 的最大 zIndex（递归）。
   */
  function getMaxZIndex(list: Widget[] = widgets.value): number {
    let max = 0
    for (const widget of list) {
      if ((widget.position.zIndex ?? 0) > max) max = widget.position.zIndex ?? 0
      if (widget.children) {
        const childMax = getMaxZIndex(widget.children)
        if (childMax > max) max = childMax
      }
    }
    return max
  }

  // ================================================================
  // CRUD
  // ================================================================

  function getBoardLayoutMode(): BoardLayoutMode {
    return useBoardStore().canvas.layoutMode ?? 'free'
  }

  function addWidget(widget: Widget): void {
    const toAdd = prepareWidgetForAdd(widget)
    widgets.value = [...widgets.value, ...toAdd]
  }

  function prepareWidgetForAdd(widget: Widget): Widget[] {
    if (!widget.position || typeof widget.position !== 'object') {
      const config = getWidget(widget.type)
      widget.position = { ...DEFAULT_POSITION, ...(config?.defaultPosition ?? {}) }
    }
    // 先按 position 同步 style.width/height（free 模式默认值），
    // 再用 Board 布局模式适配覆盖：flex 下 width 改为 100%/auto。
    // 顺序不能反，否则 syncStyleDimensions 会把 flex 的 100% 覆盖回固定 px。
    syncStyleDimensions(widget)
    const layoutMode = getBoardLayoutMode()
    adaptWidgetToBoardLayout(widget, layoutMode)
    const toAdd: Widget[] = [widget]
    let nextZ = getMaxZIndex() + 1
    widget.position.zIndex = nextZ++
    if (widget.children?.length) {
      // 容器允许嵌套，子节点（含容器）保留在父节点下，仅统一 zIndex 与布局适配
      const walk = (list: Widget[]): Widget[] =>
        list.map((child) => {
          child.position.zIndex = nextZ++
          adaptWidgetToBoardLayout(child, layoutMode)
          if (child.children?.length) {
            child.children = walk(child.children as Widget[])
          }
          return child
        })
      widget.children = walk(widget.children as Widget[])
    }
    return toAdd
  }

  function insertRootWidgetAt(widget: Widget, index: number): void {
    insertWidgetAt(null, widget, index)
  }

  function insertWidgetAt(parentId: string | null, widget: Widget, index: number, meta?: Partial<Widget>): void {
    if (meta) Object.assign(widget, meta)
    const prepared = prepareWidgetForAdd(widget)
    const [primary, ...promoted] = prepared

    if (parentId === null) {
      const list = [...widgets.value]
      const clamped = Math.max(0, Math.min(index, list.length))
      list.splice(clamped, 0, primary)
      if (promoted.length) list.push(...promoted)
      widgets.value = list
      return
    }

    const container = findWidget(parentId)
    if (!container || !prepareContainerChild(primary, container)) {
      widgets.value = [...widgets.value, primary, ...promoted]
      return
    }

    if (!container.children) container.children = []
    const clamped = Math.max(0, Math.min(index, container.children.length))
    container.children.splice(clamped, 0, primary)
    if (promoted.length) widgets.value = [...widgets.value, ...promoted]
  }

  function moveRootWidgetToIndex(id: string, toIndex: number): void {
    moveWidgetToIndex(id, null, toIndex)
  }

  function moveWidgetToIndex(id: string, parentId: string | null, toIndex: number, meta?: Partial<Widget>): void {
    if (parentId === id) return
    if (parentId && isDescendantOf(id, parentId)) return

    const widget = findWidget(id)
    if (!widget) return

    const currentParent = findParent(id)
    const currentParentId = currentParent?.id ?? null
    const isSameParent = currentParentId === parentId

    let fromIdx = -1
    if (isRootWidget(id)) {
      fromIdx = widgets.value.findIndex((w) => w.id === id)
    } else {
      fromIdx = currentParent?.children?.findIndex((c) => c.id === id) ?? -1
    }
    if (fromIdx < 0) return

    const extracted = extractWidgetFromTree(id)
    if (!extracted) return
    if (meta) Object.assign(extracted, meta)

    let target = toIndex
    if (isSameParent && fromIdx < target) target -= 1

    if (parentId === null) {
      const list = [...widgets.value]
      target = Math.max(0, Math.min(target, list.length))
      list.splice(target, 0, extracted)
      widgets.value = list
      return
    }

    const container = findWidget(parentId)
    if (!container || !prepareContainerChild(extracted, container)) {
      widgets.value = [...widgets.value, extracted]
      return
    }

    if (!container.children) container.children = []
    target = Math.max(0, Math.min(target, container.children.length))
    container.children.splice(target, 0, extracted)
  }

  function removeWidget(id: string): void {
    const newList = [...widgets.value]
    removeFromList(id, newList)
    widgets.value = newList
  }

  function updateWidget(id: string, patch: Partial<Widget>): void {
    const widget = findWidget(id)
    if (widget) {
      Object.assign(widget, patch)
      if (patch.position) {
        syncStyleDimensions(widget)
      }
    }
  }

  // ================================================================
  // 位置操作
  // ================================================================

  function moveWidget(id: string, x: number, y: number): void {
    const widget = findWidget(id)
    if (widget) {
      widget.position.x = x
      widget.position.y = y
    }
  }

  function resizeWidget(id: string, w: number, h: number): void {
    const widget = findWidget(id)
    if (widget) {
      widget.position.w = Math.max(20, w)
      widget.position.h = Math.max(20, h)
      syncStyleDimensions(widget)
    }
  }

  function setZIndex(id: string, zIndex: number): void {
    const widget = findWidget(id)
    if (widget) {
      widget.position.zIndex = Math.max(1, zIndex)
    }
  }

  // ================================================================
  // 容器操作
  // ================================================================

  /**
   * 将 Widget 从当前位置移除，添加到目标容器的 children。
   * 坐标保持不变（调用方负责坐标转换）。
   */
  function addToContainer(widgetId: string, containerId: string): void {
    const widget = findWidget(widgetId)
    const container = findWidget(containerId)
    if (!widget || !container) return
    if (widgetId === containerId) return
    // 已经是目标容器的直接子节点
    if (container.children?.some((c) => c.id === widgetId)) return

    // tabs 容器：自动分配 tabKey
    if (container.type === 'tabs' && !widget.tabKey) {
      const tabs = container.props?.tabs as Array<{ key: string }> | undefined
      const activeKey = container.props?.activeKey as string | undefined
      widget.tabKey = activeKey || tabs?.[0]?.key || 'tab1'
    }

    // 列容器：容量检查必须在 removeFromList 之前，否则 widget 会从画布消失
    const colContainerColumns = getColContainerColumns(container.type)
    if (colContainerColumns > 0) {
      if (checkAndAssignColIndex(widget, container, colContainerColumns)) return
    }

    const newList = [...widgets.value]
    removeFromList(widgetId, newList)
    widgets.value = newList

    if (colContainerColumns > 0) {
      calculateColPosition(widget, container, colContainerColumns)
    }

    if (!container.children) container.children = []
    container.children.push(widget)
  }

  /**
   * 从容器的 children 中移除 Widget，放回根级。
   * 坐标保持不变。
   */
  function removeFromContainer(widgetId: string): void {
    const parent = findParent(widgetId)
    if (!parent) return
    const widget = findWidget(widgetId)
    if (!widget) return

    // 从父容器移除
    if (parent.children) {
      const idx = parent.children.findIndex((c) => c.id === widgetId)
      if (idx >= 0) {
        parent.children.splice(idx, 1)
      }
    }

    // 放回根级
    widgets.value = [...widgets.value, widget]
  }

  /**
   * 将 Widget 重新挂载到根级。
   * 不修改坐标。
   */
  function reparentToRoot(id: string): void {
    const widget = findWidget(id)
    if (!widget) return
    if (isRootWidget(id)) return

    const newList = [...widgets.value]
    removeFromList(id, newList)
    newList.push(widget)
    widgets.value = newList
  }

  /**
   * 将 Widget 重新挂载到目标容器。
   * x/y 为目标容器的局部坐标。
   */
  function reparentToContainer(id: string, targetId: string, x: number, y: number): void {
    const widget = findWidget(id)
    const target = findWidget(targetId)
    if (!widget || !target) return
    if (id === targetId) return
    if (target.children?.some((c) => c.id === id)) return

    // tabs 容器：自动分配 tabKey
    if (target.type === 'tabs' && !widget.tabKey) {
      const tabs = target.props?.tabs as Array<{ key: string }> | undefined
      const activeKey = target.props?.activeKey as string | undefined
      widget.tabKey = activeKey || tabs?.[0]?.key || 'tab1'
    }

    // 列容器：容量检查必须在 removeFromList 之前，否则 widget 会从画布消失
    const colContainerColumns = getColContainerColumns(target.type)
    if (colContainerColumns > 0) {
      if (checkAndAssignColIndex(widget, target, colContainerColumns)) return
    }

    const newList = [...widgets.value]
    removeFromList(id, newList)
    widgets.value = newList

    widget.position.x = x
    widget.position.y = y

    if (colContainerColumns > 0) {
      calculateColPosition(widget, target, colContainerColumns)
    }

    if (!target.children) target.children = []
    target.children.push(widget)
  }

  // ================================================================
  // 表单容器绑定
  // ================================================================

  /**
   * 将 Widget 绑定到指定表单容器。
   */
  function bindToForm(widgetId: string, formId: string): void {
    const widget = findWidget(widgetId)
    if (widget) {
      widget.formId = formId
    }
  }

  /**
   * 解除 Widget 的表单容器绑定。
   */
  function unbindFromForm(widgetId: string): void {
    const widget = findWidget(widgetId)
    if (widget) {
      delete widget.formId
    }
  }

  /**
   * 收集指定表单容器下所有子 Widget 的字段值。
   * 只收集有 field 属性且在同一 formId 下的 Widget。
   */
  function collectFormValues(formId: string): Record<string, unknown> {
    const values: Record<string, unknown> = {}

    function walk(list: Widget[]): void {
      for (const widget of list) {
        if (widget.formId === formId && widget.field) {
          values[widget.field] = widget.defaultValue ?? null
        }
        if (widget.children) {
          walk(widget.children)
        }
      }
    }

    walk(widgets.value)
    return values
  }

  // ================================================================
  // 页签操作
  // ================================================================

  /**
   * 设置 Widget 绑定的页签 key。
   */
  function setTabKey(widgetId: string, tabKey: string): void {
    const widget = findWidget(widgetId)
    if (widget) {
      widget.tabKey = tabKey
    }
  }

  // ================================================================
  // 行列操作
  // ================================================================

  /**
   * 设置 Widget 绑定的列索引。
   */
  function setColIndex(widgetId: string, colIndex: number): void {
    const widget = findWidget(widgetId)
    if (widget) {
      widget.colIndex = colIndex
    }
  }

  // ================================================================
  // 批量操作
  // ================================================================

  /**
   * 批量替换所有 Widget（从 API 加载时使用）。
   */
  function loadWidgets(data: Widget[], layoutMode?: BoardLayoutMode): void {
    // 过滤掉 undefined 和 null 元素，确保数据干净
    const validWidgets = (data || []).filter((w): w is Widget => w != null && typeof w === 'object' && 'id' in w)
    // 补全 position 字段（旧数据可能缺失）
    const normalized = normalizePosition(validWidgets)
    const mode = layoutMode ?? getBoardLayoutMode()
    adaptWidgetsToBoardLayout(normalized, mode)
    widgets.value = sanitizeContainerNesting(normalized)
  }

  /** Board 布局模式切换后，同步 Widget 骨架样式 */
  function adaptAllToLayoutMode(layoutMode: BoardLayoutMode): void {
    adaptWidgetsToBoardLayout(widgets.value, layoutMode)
  }

  /**
   * 清空所有 Widget。
   */
  function clearWidgets(): void {
    widgets.value = []
  }

  // ================================================================
  // 导出
  // ================================================================

  return {
    // 数据
    widgets,
    // 树结构遍历
    findWidget,
    findParent,
    isRootWidget,
    // CRUD
    addWidget,
    insertRootWidgetAt,
    insertWidgetAt,
    moveRootWidgetToIndex,
    moveWidgetToIndex,
    removeWidget,
    updateWidget,
    // 位置操作
    moveWidget,
    resizeWidget,
    setZIndex,
    // 容器操作
    addToContainer,
    removeFromContainer,
    reparentToRoot,
    reparentToContainer,
    // 表单容器绑定
    bindToForm,
    unbindFromForm,
    collectFormValues,
    // 页签操作
    setTabKey,
    // 行列操作
    setColIndex,
    // 批量操作
    loadWidgets,
    adaptAllToLayoutMode,
    clearWidgets,
    // 多页面
    pageWidgets,
    savePageWidgets,
    loadPageWidgets,
    switchPage,
    clearPageCache,
  }
})
