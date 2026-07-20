import { describe, it, expect } from 'vitest'
import {
  computeViewportRect,
  isRectInViewport,
  isWidgetVisibleInViewport,
} from '@/composables/useViewportCulling'

describe('useViewportCulling', () => {
  it('computeViewportRect maps scroll + zoom to canvas coordinates', () => {
    const rect = computeViewportRect(100, 50, 800, 600, 100, 0)
    expect(rect).toEqual({
      minX: 100,
      minY: 50,
      maxX: 900,
      maxY: 650,
    })
  })

  it('computeViewportRect applies zoom scale', () => {
    const rect = computeViewportRect(200, 100, 400, 300, 50, 0)
    expect(rect.minX).toBe(400)
    expect(rect.minY).toBe(200)
    expect(rect.maxX).toBe(1200)
    expect(rect.maxY).toBe(800)
  })

  it('isRectInViewport detects intersection', () => {
    const viewport = { minX: 0, minY: 0, maxX: 500, maxY: 400 }
    expect(isRectInViewport(10, 10, 100, 50, viewport)).toBe(true)
    expect(isRectInViewport(600, 10, 100, 50, viewport)).toBe(false)
    expect(isRectInViewport(450, 350, 100, 100, viewport)).toBe(true)
  })

  it('isWidgetVisibleInViewport returns true when viewport is null', () => {
    expect(isWidgetVisibleInViewport(0, 0, 100, 100, null)).toBe(true)
  })
})
