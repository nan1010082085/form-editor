import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createWidget, generateWidgetId } from '@/widgets/registry'
import type { SchemaType, Widget } from '@/widgets/base/types'
import { useWidgetStore } from '@/stores/widget'
import { useEditorStore } from '@/stores/editor'
import {
  parseSchemaDragData,
  resolveFlexInsertIndex,
  mapFilteredIndexToFull,
  renderFlexInsertIndicator,
  clearFlexInsertIndicator,
} from '@/utils/flexCanvasDrop'

export function useFlexDropZone(
  containerRef: Ref<HTMLElement | null>,
  parentId: () => string | null,
  siblings: () => Widget[],
  enabled: () => boolean,
  insertMeta?: () => Partial<Widget> | null,
  /**
   * 未过滤的全量子节点（用于 tabs 按 activeKey / col 按 colIndex 过滤场景）。
   * 传入时，拖放落点索引会从"过滤后列表"映射回"全量列表"，避免多 tab / 多 col 错位。
   * 根级拖放 siblings 即全量，无需传入。
   */
  allChildren?: () => Widget[],
) {
  const widgetStore = useWidgetStore()
  const editorStore = useEditorStore()
  const isDragOver = ref(false)
  /** 当前拖拽落点对应的插入索引（-1 表示未拖拽） */
  const insertIndex = ref(-1)

  /** 将过滤后索引映射为全量索引（无 allChildren 时原样返回） */
  function resolveFullIndex(filteredIdx: number): number {
    if (!allChildren) return filteredIdx
    return mapFilteredIndexToFull(siblings(), allChildren(), filteredIdx)
  }

  function handleDragOver(event: DragEvent) {
    if (!enabled()) return
    const types = event.dataTransfer?.types ?? []
    const allowed = types.includes('schema-type') || types.includes('application/schema-drag')
    if (!allowed) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer!.dropEffect = 'copy'
    isDragOver.value = true
    // 实时计算插入索引，并渲染指示线
    const container = containerRef.value
    if (container) {
      const idx = resolveFlexInsertIndex(container, event.clientY, siblings())
      insertIndex.value = idx
      renderFlexInsertIndicator(container, siblings(), idx)
    }
  }

  function handleDragLeave(event: DragEvent) {
    if (!enabled()) return
    const related = event.relatedTarget as HTMLElement | null
    const container = containerRef.value
    if (related && container?.contains(related)) return
    isDragOver.value = false
    insertIndex.value = -1
    if (container) clearFlexInsertIndicator(container)
  }

  function handleDrop(event: DragEvent) {
    if (!enabled()) return
    event.preventDefault()
    event.stopPropagation()
    isDragOver.value = false
    insertIndex.value = -1

    const container = containerRef.value
    if (!container) return
    clearFlexInsertIndicator(container)

    const payload = parseSchemaDragData(event)
    if (!payload) return

    const filteredIdx = resolveFlexInsertIndex(container, event.clientY, siblings())
    const insertIndexValue = resolveFullIndex(filteredIdx)
    const pid = parentId()
    const meta = insertMeta?.() ?? undefined

    if (payload.source === 'canvas' && payload.id) {
      widgetStore.moveWidgetToIndex(payload.id, pid, insertIndexValue, meta)
      editorStore.select(payload.id)
      editorStore.pushHistory([...widgetStore.widgets])
      return
    }

    const schemaType = payload.type as SchemaType | undefined
    if (!schemaType) return

    const widget = createWidget(schemaType, generateWidgetId(schemaType))
    if (!widget) {
      ElMessage.error(`未知部件类型: ${schemaType}`)
      return
    }

    widgetStore.insertWidgetAt(pid, widget, insertIndexValue, meta)
    editorStore.select(widget.id)
    editorStore.pushHistory([...widgetStore.widgets])
  }

  return {
    isDragOver,
    insertIndex,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
