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
