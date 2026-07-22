import type { Widget } from '@/widgets/base/types'

export interface SchemaDragPayload {
  source: 'panel' | 'canvas'
  type?: string
  id?: string
}

export function parseSchemaDragData(event: DragEvent): SchemaDragPayload | null {
  const raw = event.dataTransfer?.getData('application/schema-drag')
  if (raw) {
    try {
      return JSON.parse(raw) as SchemaDragPayload
    } catch {
      return null
    }
  }
  const schemaType = event.dataTransfer?.getData('schema-type')
  if (schemaType) return { source: 'panel', type: schemaType }
  return null
}

/** 根据落点 Y 计算根级 Widget 插入索引 */
export function resolveFlexInsertIndex(
  container: HTMLElement,
  clientY: number,
  rootWidgets: Widget[],
): number {
  for (let i = 0; i < rootWidgets.length; i++) {
    const el = container.querySelector(`[data-widget-id="${rootWidgets[i].id}"]`)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    if (clientY < mid) return i
  }
  return rootWidgets.length
}

/**
 * 将"过滤后 siblings 列表"中的索引映射回"未过滤全量 children"中的索引。
 *
 * tabs 容器按 activeKey 过滤、col 容器按 colIndex 过滤后，拖放落点索引是相对
 * 过滤列表的；而 insertWidgetAt/moveWidgetToIndex 直接 splice 进未过滤的
 * container.children。若不做映射，多 tab / 多 col 场景插入位置会错位。
 *
 * - filteredIndex 指向 filtered 末尾之后：返回 full 末尾（full.length）
 * - 否则：返回 filtered[filteredIndex] 在 full 中的真实下标
 */
export function mapFilteredIndexToFull(
  filtered: Widget[],
  full: Widget[],
  filteredIndex: number,
): number {
  if (filteredIndex >= filtered.length) return full.length
  if (filteredIndex < 0) return 0
  const anchor = filtered[filteredIndex]
  if (!anchor) return full.length
  const fullIdx = full.findIndex((w) => w.id === anchor.id)
  return fullIdx < 0 ? full.length : fullIdx
}

/** 插入指示线标记 class（dragover 时挂到目标 widget 元素上） */
export const FLEX_INSERT_BEFORE_CLASS = 'flex-insert-before'
export const FLEX_INSERT_AFTER_CLASS = 'flex-insert-after'

/**
 * 在 drop zone 内渲染插入指示线：根据 insertIndex 给对应 widget 元素挂标记 class。
 * - insertIndex < N：第 insertIndex 个 widget 加 `flex-insert-before`
 * - insertIndex === N：最后一个 widget 加 `flex-insert-after`
 * 调用方需在 dragleave/drop 时调用 clearFlexInsertIndicator 清除。
 */
export function renderFlexInsertIndicator(
  container: HTMLElement,
  rootWidgets: Widget[],
  insertIndex: number,
): void {
  clearFlexInsertIndicator(container)
  if (insertIndex < 0 || rootWidgets.length === 0) return

  if (insertIndex >= rootWidgets.length) {
    const last = container.querySelector(
      `[data-widget-id="${rootWidgets[rootWidgets.length - 1].id}"]`,
    )
    last?.classList.add(FLEX_INSERT_AFTER_CLASS)
    return
  }

  const target = container.querySelector(`[data-widget-id="${rootWidgets[insertIndex].id}"]`)
  target?.classList.add(FLEX_INSERT_BEFORE_CLASS)
}

/** 清除 drop zone 内所有插入指示标记 */
export function clearFlexInsertIndicator(container: HTMLElement): void {
  container
    .querySelectorAll(`.${FLEX_INSERT_BEFORE_CLASS}, .${FLEX_INSERT_AFTER_CLASS}`)
    .forEach((el) => {
      el.classList.remove(FLEX_INSERT_BEFORE_CLASS, FLEX_INSERT_AFTER_CLASS)
    })
}
