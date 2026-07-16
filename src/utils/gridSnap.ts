/**
 * gridSnap — 网格吸附工具
 *
 * 提供单轴和矩形吸附功能，用于自由布局模式下的拖拽和缩放。
 */

/** 单轴网格吸附 */
export function snapToGrid(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 0) return value
  return Math.round(value / gridSize) * gridSize
}

/** 矩形网格吸附（位置 + 尺寸） */
export function snapRectToGrid(
  x: number,
  y: number,
  w: number,
  h: number,
  gridW: number,
  gridH: number,
  enabled: boolean,
): { x: number; y: number; w: number; h: number } {
  if (!enabled) return { x, y, w, h }
  return {
    x: Math.round(x / gridW) * gridW,
    y: Math.round(y / gridH) * gridH,
    w: Math.max(gridW, Math.round(w / gridW) * gridW),
    h: Math.max(gridH, Math.round(h / gridH) * gridH),
  }
}

/** 从 boardStore canvas 配置计算网格参数 */
export function getGridParams(
  freeLayout?: { snapToGrid?: boolean; gridColumns?: number; gridRowHeight?: number },
  canvasWidth?: number,
): { enabled: boolean; gridW: number; gridH: number } {
  const enabled = freeLayout?.snapToGrid === true
  const columns = freeLayout?.gridColumns ?? 24
  const gridW = (canvasWidth ?? 1920) / columns
  const gridH = freeLayout?.gridRowHeight ?? 8
  return { enabled, gridW, gridH }
}
