/**
 * useViewportCulling — 画布视口剔除
 *
 * 自由布局画布使用绝对定位，通过视口矩形判断 widget 是否应渲染。
 * 剔除仅影响 DOM 渲染层，交互命中仍基于全量 widget 数据（EditorOverlay）。
 */
import type { InjectionKey, Ref } from 'vue'

/** 画布坐标系下的可视矩形（含缓冲区） */
export interface ViewportRect {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export const VIEWPORT_CULLING_KEY: InjectionKey<Ref<ViewportRect | null>> = Symbol('viewportCulling')

const DEFAULT_BUFFER = 200

/**
 * 根据滚动容器状态计算画布坐标系可视矩形。
 * scroll/zoom 将视口映射到画布内容坐标。
 */
export function computeViewportRect(
  scrollLeft: number,
  scrollTop: number,
  clientWidth: number,
  clientHeight: number,
  zoom: number,
  buffer = DEFAULT_BUFFER,
): ViewportRect {
  const scale = zoom / 100
  return {
    minX: scrollLeft / scale - buffer,
    minY: scrollTop / scale - buffer,
    maxX: (scrollLeft + clientWidth) / scale + buffer,
    maxY: (scrollTop + clientHeight) / scale + buffer,
  }
}

/** 矩形与视口是否相交 */
export function isRectInViewport(
  x: number,
  y: number,
  w: number,
  h: number,
  viewport: ViewportRect,
): boolean {
  if (w <= 0 || h <= 0) return true
  return (
    x + w >= viewport.minX
    && x <= viewport.maxX
    && y + h >= viewport.minY
    && y <= viewport.maxY
  )
}

/** widget 在画布绝对坐标下是否可见 */
export function isWidgetVisibleInViewport(
  canvasX: number,
  canvasY: number,
  width: number,
  height: number,
  viewport: ViewportRect | null | undefined,
): boolean {
  if (!viewport) return true
  return isRectInViewport(canvasX, canvasY, width, height, viewport)
}
