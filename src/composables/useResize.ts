import { ref } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useEditorStore } from '../stores/editor'
import { useBoardStore } from '../stores/board'
import { scaleDelta } from '../utils/coordinate'
import { getGridParams, snapToGrid } from '../utils/gridSnap'

/** 缩放手柄方向 */
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/**
 * useResize — 组件缩放逻辑
 *
 * 处理八向缩放手柄的拖拽，维护缩放状态，操作结束后推入历史。
 * 支持 px 和 % 两种单位，支持等比缩放（Shift 键）。
 */
export function useResize() {
  const widgetStore = useWidgetStore()
  const editorStore = useEditorStore()
  const boardStore = useBoardStore()

  const isResizing = ref(false)
  const resizeWidgetId = ref<string | null>(null)
  const resizeHandle = ref<ResizeHandle | null>(null)
  const startX = ref(0)
  const startY = ref(0)
  const startW = ref(0)
  const startH = ref(0)
  const startWUnit = ref<'px' | '%'>('px')
  const startHUnit = ref<'px' | '%'>('px')
  const aspectRatio = ref(1) // 宽高比，用于等比缩放

  /** 开始缩放 */
  function startResize(widgetId: string, handle: ResizeHandle, clientX: number, clientY: number) {
    const widget = widgetStore.findWidget(widgetId)
    if (!widget?.position) return

    isResizing.value = true
    resizeWidgetId.value = widgetId
    resizeHandle.value = handle
    startX.value = clientX
    startY.value = clientY
    startW.value = widget.position.w
    startH.value = widget.position.h
    startWUnit.value = widget.position.wUnit ?? 'px'
    startHUnit.value = widget.position.hUnit ?? 'px'
    aspectRatio.value = widget.position.w / widget.position.h
  }

  /** 更新缩放（mousemove 时调用） */
  function updateResize(clientX: number, clientY: number, shiftKey = false) {
    if (!isResizing.value || !resizeWidgetId.value || !resizeHandle.value) return

    const zoom = boardStore.canvas.zoom
    const { dx, dy } = scaleDelta(clientX - startX.value, clientY - startY.value, zoom)

    const widget = widgetStore.findWidget(resizeWidgetId.value)
    if (!widget?.position) return

    const canvasW = boardStore.getCanvasWidthPx()
    const canvasH = boardStore.getCanvasHeightPx()
    const handle = resizeHandle.value

    // 计算新的像素尺寸
    let newPxW = startW.value
    let newPxH = startH.value

    if (startWUnit.value === '%') {
      // 百分比单位：将起始百分比转换为像素，计算增量，再转回百分比
      const startPxW = canvasW * startW.value / 100
      const startPxH = canvasH * startH.value / 100

      let targetPxW = startPxW
      let targetPxH = startPxH

      if (handle.includes('e')) targetPxW = Math.max(20, startPxW + dx)
      if (handle.includes('w')) targetPxW = Math.max(20, startPxW - dx)
      if (handle.includes('s')) targetPxH = Math.max(20, startPxH + dy)
      if (handle.includes('n')) targetPxH = Math.max(20, startPxH - dy)

      // 等比缩放（Shift 键）
      if (shiftKey) {
        if (handle.includes('e') || handle.includes('w')) {
          targetPxH = targetPxW / aspectRatio.value
        } else {
          targetPxW = targetPxH * aspectRatio.value
        }
      }

      // 限制不超出画布边界
      const maxPxW = canvasW - (widget.position.x ?? 0)
      const maxPxH = canvasH - (widget.position.y ?? 0)
      targetPxW = Math.min(targetPxW, maxPxW)
      targetPxH = Math.min(targetPxH, maxPxH)

      // 转换回百分比
      newPxW = (targetPxW / canvasW) * 100
      newPxH = (targetPxH / canvasH) * 100
    } else {
      // 像素单位
      if (handle.includes('e')) newPxW = Math.max(20, startW.value + dx)
      if (handle.includes('w')) newPxW = Math.max(20, startW.value - dx)
      if (handle.includes('s')) newPxH = Math.max(20, startH.value + dy)
      if (handle.includes('n')) newPxH = Math.max(20, startH.value - dy)

      // 等比缩放（Shift 键）
      if (shiftKey) {
        if (handle.includes('e') || handle.includes('w')) {
          newPxH = newPxW / aspectRatio.value
        } else {
          newPxW = newPxH * aspectRatio.value
        }
      }

      // 限制不超出画布边界
      const maxW = canvasW - (widget.position.x ?? 0)
      const maxH = canvasH - (widget.position.y ?? 0)
      newPxW = Math.min(newPxW, maxW)
      newPxH = Math.min(newPxH, maxH)
    }

    // 确保最小值
    if (startWUnit.value === '%') {
      const minPercentW = (20 / canvasW) * 100
      const minPercentH = (20 / canvasH) * 100
      newPxW = Math.max(minPercentW, newPxW)
      newPxH = Math.max(minPercentH, newPxH)
    } else {
      newPxW = Math.max(20, newPxW)
      newPxH = Math.max(20, newPxH)
    }

    // 网格吸附（仅像素单位模式）
    if (startWUnit.value !== '%') {
      const grid = getGridParams(boardStore.canvas.freeLayout, canvasW)
      if (grid.enabled) {
        newPxW = snapToGrid(newPxW, grid.gridW, true)
        newPxH = snapToGrid(newPxH, grid.gridH, true)
      }
    }

    widgetStore.resizeWidget(resizeWidgetId.value, newPxW, newPxH)
  }

  /** 结束缩放，推入历史 */
  function endResize() {
    if (isResizing.value && resizeWidgetId.value) {
      editorStore.pushHistory([...widgetStore.widgets])
    }
    isResizing.value = false
    resizeWidgetId.value = null
    resizeHandle.value = null
  }

  return {
    isResizing,
    startResize,
    updateResize,
    endResize,
  }
}
