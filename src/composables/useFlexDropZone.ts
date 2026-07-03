import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createWidget, generateWidgetId } from '@/widgets/registry'
import type { SchemaType, Widget } from '@/widgets/base/types'
import { useWidgetStore } from '@/stores/widget'
import { useEditorStore } from '@/stores/editor'
import { parseSchemaDragData, resolveFlexInsertIndex } from '@/utils/flexCanvasDrop'

export function useFlexDropZone(
  containerRef: Ref<HTMLElement | null>,
  parentId: () => string | null,
  siblings: () => Widget[],
  enabled: () => boolean,
  insertMeta?: () => Partial<Widget> | null,
) {
  const widgetStore = useWidgetStore()
  const editorStore = useEditorStore()
  const isDragOver = ref(false)

  function handleDragOver(event: DragEvent) {
    if (!enabled()) return
    const types = event.dataTransfer?.types ?? []
    const allowed = types.includes('schema-type') || types.includes('application/schema-drag')
    if (!allowed) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer!.dropEffect = 'copy'
    isDragOver.value = true
  }

  function handleDragLeave(event: DragEvent) {
    if (!enabled()) return
    const related = event.relatedTarget as HTMLElement | null
    const container = containerRef.value
    if (related && container?.contains(related)) return
    isDragOver.value = false
  }

  function handleDrop(event: DragEvent) {
    if (!enabled()) return
    event.preventDefault()
    event.stopPropagation()
    isDragOver.value = false

    const container = containerRef.value
    if (!container) return

    const payload = parseSchemaDragData(event)
    if (!payload) return

    const insertIndex = resolveFlexInsertIndex(container, event.clientY, siblings())
    const pid = parentId()
    const meta = insertMeta?.() ?? undefined

    if (payload.source === 'canvas' && payload.id) {
      widgetStore.moveWidgetToIndex(payload.id, pid, insertIndex, meta)
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

    widgetStore.insertWidgetAt(pid, widget, insertIndex, meta)
    editorStore.select(widget.id)
    editorStore.pushHistory([...widgetStore.widgets])
  }

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
