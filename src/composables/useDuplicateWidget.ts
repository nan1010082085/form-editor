import { useBoardStore } from '@/stores/board'
import { useWidgetStore } from '@/stores/widget'
import { useEditorStore } from '@/stores/editor'
import { generateWidgetId } from '@/widgets/registry'
import type { Widget } from '@/widgets/base/types'

export function useDuplicateWidget() {
  const boardStore = useBoardStore()
  const widgetStore = useWidgetStore()
  const editorStore = useEditorStore()

  function isFlexLayout(): boolean {
    return (boardStore.canvas.layoutMode ?? 'free') === 'flex'
  }

  function cloneWidget(source: Widget): Widget {
    const duplicated = JSON.parse(JSON.stringify(source)) as Widget
    duplicated.id = generateWidgetId(source.type)
    duplicated.name = `${source.name}_copy`
    return duplicated
  }

  function resolveInsertAnchor(anchorId?: string | null): { parentId: string | null; index: number } {
    if (!anchorId) {
      return { parentId: null, index: widgetStore.widgets.length }
    }
    if (widgetStore.isRootWidget(anchorId)) {
      const idx = widgetStore.widgets.findIndex((w) => w.id === anchorId)
      return { parentId: null, index: idx >= 0 ? idx + 1 : widgetStore.widgets.length }
    }
    const parent = widgetStore.findParent(anchorId)
    if (!parent?.id) {
      return { parentId: null, index: widgetStore.widgets.length }
    }
    const children = parent.children ?? []
    const idx = children.findIndex((c) => c.id === anchorId)
    return { parentId: parent.id, index: idx >= 0 ? idx + 1 : children.length }
  }

  function insertDuplicate(duplicated: Widget, anchorId?: string | null) {
    if (isFlexLayout()) {
      const { parentId, index } = resolveInsertAnchor(anchorId)
      widgetStore.insertWidgetAt(parentId, duplicated, index)
    } else {
      if (duplicated.position) {
        duplicated.position.x += 20
        duplicated.position.y += 20
      }
      widgetStore.addWidget(duplicated)
    }
    editorStore.select(duplicated.id)
    editorStore.pushHistory([...widgetStore.widgets])
  }

  function duplicateFromWidget(source: Widget) {
    const duplicated = cloneWidget(source)
    insertDuplicate(duplicated, source.id)
    return duplicated
  }

  function duplicateFromClipboard(source: Widget) {
    const duplicated = cloneWidget(source)
    insertDuplicate(duplicated, editorStore.selectedId)
    return duplicated
  }

  return { duplicateFromWidget, duplicateFromClipboard }
}
