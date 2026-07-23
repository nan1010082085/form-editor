/**
 * useCanvasScale — 发布视图多分辨率自适应
 *
 * 根据 canvas 配置尺寸和容器实际尺寸，计算 CSS transform scale。
 * 仅用于 publish / preview 模式，不影响编辑器缩放（boardStore.zoom）。
 *
 * 支持 4 种 scaleMode：
 * - fit-width  按容器宽度等比缩放
 * - fit-height 按容器高度等比缩放
 * - contain    等比缩放至完全容纳于容器（默认）
 * - stretch    拉伸填满容器（忽略宽高比）
 */
import { ref, computed, watch, onUnmounted, type Ref, type CSSProperties } from 'vue'
import type { ScaleMode } from '@/widgets/base/types'

export interface UseCanvasScaleOptions {
  canvasWidth: Ref<number>
  canvasHeight: Ref<number>
  containerRef: Ref<HTMLElement | null>
  scaleMode?: Ref<ScaleMode>
}

export interface UseCanvasScaleReturn {
  containerWidth: Ref<number>
  containerHeight: Ref<number>
  scale: Ref<number>
  canvasStyle: Ref<CSSProperties>
  /** 手动销毁 ResizeObserver（非组件上下文时使用） */
  dispose: () => void
}

export function useCanvasScale(options: UseCanvasScaleOptions): UseCanvasScaleReturn {
  const { canvasWidth, canvasHeight, containerRef, scaleMode } = options

  const containerWidth = ref(0)
  const containerHeight = ref(0)

  let resizeObserver: ResizeObserver | null = null

  function updateContainerSize(el: HTMLElement | null) {
    if (!el) {
      containerWidth.value = 0
      containerHeight.value = 0
      return
    }
    containerWidth.value = el.clientWidth
    containerHeight.value = el.clientHeight
  }

  function setupObserver(el: HTMLElement | null) {
    resizeObserver?.disconnect()
    resizeObserver = null
    if (!el) return
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        containerWidth.value = entry.contentRect.width
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(el)
    updateContainerSize(el)
  }

  function dispose() {
    resizeObserver?.disconnect()
    resizeObserver = null
  }

  // 立即初始化（兼容非组件上下文）
  if (containerRef.value) {
    setupObserver(containerRef.value)
  }

  watch(containerRef, (el) => {
    setupObserver(el)
  })

  // 组件上下文中自动清理
  onUnmounted(dispose)

  const effectiveMode = computed<ScaleMode>(() => scaleMode?.value ?? 'contain')

  const scale = computed(() => {
    const cw = canvasWidth.value
    const ch = canvasHeight.value
    const vw = containerWidth.value
    const vh = containerHeight.value

    if (cw <= 0 || ch <= 0 || vw <= 0 || vh <= 0) return 1

    switch (effectiveMode.value) {
      case 'fit-width':
        return vw / cw
      case 'fit-height':
        return vh / ch
      case 'stretch':
        return 1 // stretch 不用 scale，改用 width/height
      case 'contain':
      default:
        return Math.min(vw / cw, vh / ch)
    }
  })

  const canvasStyle = computed<CSSProperties>(() => {
    const cw = canvasWidth.value
    const ch = canvasHeight.value
    const mode = effectiveMode.value

    if (mode === 'stretch') {
      return {
        width: '100%',
        height: '100%',
        transform: 'none',
        transformOrigin: 'top left',
      }
    }

    return {
      width: `${cw}px`,
      height: `${ch}px`,
      transform: `scale(${scale.value})`,
      transformOrigin: 'top left',
    }
  })

  return {
    containerWidth,
    containerHeight,
    scale,
    canvasStyle,
    dispose,
  }
}
