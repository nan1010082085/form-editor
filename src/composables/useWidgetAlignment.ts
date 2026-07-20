/**
 * useWidgetAlignment — 多选部件对齐、分布、锁定与隐藏
 */
import { useWidgetStore } from '@/stores/widget'
import { useEditorStore } from '@/stores/editor'
import type { Widget } from '@/widgets/base/types'

type AlignEdge = 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle'
type DistributeAxis = 'horizontal' | 'vertical'

function getSelectedWidgets(): Widget[] {
  const widgetStore = useWidgetStore()
  const editorStore = useEditorStore()
  const ids = editorStore.selectedIds.length > 0
    ? editorStore.selectedIds
    : (editorStore.selectedId ? [editorStore.selectedId] : [])
  return ids
    .map(id => widgetStore.findWidget(id))
    .filter((w): w is Widget => !!w && !!w.position)
}

function commitHistory(): void {
  const widgetStore = useWidgetStore()
  const editorStore = useEditorStore()
  editorStore.pushHistory([...widgetStore.widgets])
}

export function useWidgetAlignment() {
  const widgetStore = useWidgetStore()

  function align(edge: AlignEdge): void {
    const widgets = getSelectedWidgets()
    if (widgets.length < 2) return

    const xs = widgets.map(w => w.position.x)
    const ys = widgets.map(w => w.position.y)
    const rights = widgets.map(w => w.position.x + w.position.w)
    const bottoms = widgets.map(w => w.position.y + w.position.h)

    let targetX = Math.min(...xs)
    let targetY = Math.min(...ys)

    if (edge === 'right') targetX = Math.max(...rights)
    if (edge === 'center') {
      const minX = Math.min(...xs)
      const maxR = Math.max(...rights)
      targetX = (minX + maxR) / 2
    }
    if (edge === 'bottom') targetY = Math.max(...bottoms)
    if (edge === 'middle') {
      const minY = Math.min(...ys)
      const maxB = Math.max(...bottoms)
      targetY = (minY + maxB) / 2
    }

    for (const w of widgets) {
      let x = w.position.x
      let y = w.position.y
      if (edge === 'left') x = targetX
      if (edge === 'right') x = targetX - w.position.w
      if (edge === 'center') x = targetX - w.position.w / 2
      if (edge === 'top') y = targetY
      if (edge === 'bottom') y = targetY - w.position.h
      if (edge === 'middle') y = targetY - w.position.h / 2
      widgetStore.updateWidget(w.id, { position: { ...w.position, x, y } })
    }
    commitHistory()
  }

  function distribute(axis: DistributeAxis): void {
    const widgets = getSelectedWidgets()
    if (widgets.length < 3) return

    const sorted = [...widgets].sort((a, b) =>
      axis === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y,
    )

    if (axis === 'horizontal') {
      const first = sorted[0].position.x
      const last = sorted[sorted.length - 1].position.x + sorted[sorted.length - 1].position.w
      const totalWidth = sorted.reduce((sum, w) => sum + w.position.w, 0)
      const gap = (last - first - totalWidth) / (sorted.length - 1)
      let cursor = first
      for (const w of sorted) {
        widgetStore.updateWidget(w.id, { position: { ...w.position, x: cursor } })
        cursor += w.position.w + gap
      }
    } else {
      const first = sorted[0].position.y
      const last = sorted[sorted.length - 1].position.y + sorted[sorted.length - 1].position.h
      const totalHeight = sorted.reduce((sum, w) => sum + w.position.h, 0)
      const gap = (last - first - totalHeight) / (sorted.length - 1)
      let cursor = first
      for (const w of sorted) {
        widgetStore.updateWidget(w.id, { position: { ...w.position, y: cursor } })
        cursor += w.position.h + gap
      }
    }
    commitHistory()
  }

  function toggleLock(): void {
    const widgets = getSelectedWidgets()
    if (widgets.length === 0) return
    const allLocked = widgets.every(w => w.locked === true)
    for (const w of widgets) {
      widgetStore.updateWidget(w.id, { locked: !allLocked })
    }
    commitHistory()
  }

  function toggleHidden(): void {
    const widgets = getSelectedWidgets()
    if (widgets.length === 0) return
    const allHidden = widgets.every(w => w.hidden === true)
    for (const w of widgets) {
      widgetStore.updateWidget(w.id, { hidden: !allHidden })
    }
    commitHistory()
  }

  return { align, distribute, toggleLock, toggleHidden }
}
