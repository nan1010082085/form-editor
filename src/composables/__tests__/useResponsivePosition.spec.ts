import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import { useResponsivePosition } from '../useResponsivePosition'
import type { Widget, PreviewBreakpoint, ResponsivePosition } from '@/widgets/base/types'

function createWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'test-1',
    name: 'TestWidget',
    type: 'input',
    position: { x: 100, y: 200, w: 300, h: 40 },
    ...overrides,
  } as Widget
}

describe('useResponsivePosition', () => {
  describe('edit mode (isPreviewMode = false)', () => {
    it('returns default position ignoring responsive overrides', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          mobile: { x: 0, y: 0, w: 375, h: 60 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(false),
      })

      expect(resolvedPosition.value.x).toBe(100)
      expect(resolvedPosition.value.y).toBe(200)
      expect(resolvedPosition.value.w).toBe(300)
      expect(resolvedPosition.value.h).toBe(40)
      expect(resolvedPosition.value.hidden).toBe(false)
    })
  })

  describe('preview mode — no responsive config', () => {
    it('returns default position when no responsivePosition is set', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('desktop'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.x).toBe(100)
      expect(resolvedPosition.value.y).toBe(200)
      expect(resolvedPosition.value.w).toBe(300)
      expect(resolvedPosition.value.h).toBe(40)
      expect(resolvedPosition.value.hidden).toBe(false)
    })
  })

  describe('preview mode — with responsive config', () => {
    it('applies desktop override when breakpoint is desktop', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          desktop: { x: 50, y: 60, w: 400, h: 80 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('desktop'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.x).toBe(50)
      expect(resolvedPosition.value.y).toBe(60)
      expect(resolvedPosition.value.w).toBe(400)
      expect(resolvedPosition.value.h).toBe(80)
    })

    it('applies tablet override when breakpoint is tablet', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          tablet: { x: 20, y: 30, w: 200, h: 50 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('tablet'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.x).toBe(20)
      expect(resolvedPosition.value.y).toBe(30)
      expect(resolvedPosition.value.w).toBe(200)
      expect(resolvedPosition.value.h).toBe(50)
    })

    it('applies mobile override when breakpoint is mobile', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          mobile: { x: 0, y: 0, w: 375, h: 60 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.x).toBe(0)
      expect(resolvedPosition.value.y).toBe(0)
      expect(resolvedPosition.value.w).toBe(375)
      expect(resolvedPosition.value.h).toBe(60)
    })
  })

  describe('fallback chain', () => {
    it('falls back from mobile to tablet when mobile is not configured', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          tablet: { x: 20, y: 30, w: 200, h: 50 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      // Should fall back to tablet
      expect(resolvedPosition.value.x).toBe(20)
      expect(resolvedPosition.value.y).toBe(30)
      expect(resolvedPosition.value.w).toBe(200)
      expect(resolvedPosition.value.h).toBe(50)
    })

    it('falls back from mobile to desktop when neither mobile nor tablet is configured', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          desktop: { x: 50, y: 60, w: 400, h: 80 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      // Should fall back to desktop
      expect(resolvedPosition.value.x).toBe(50)
      expect(resolvedPosition.value.y).toBe(60)
      expect(resolvedPosition.value.w).toBe(400)
      expect(resolvedPosition.value.h).toBe(80)
    })

    it('falls back from tablet to desktop when tablet is not configured', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          desktop: { x: 50, y: 60, w: 400, h: 80 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('tablet'),
        isPreviewMode: ref(true),
      })

      // Should fall back to desktop
      expect(resolvedPosition.value.x).toBe(50)
      expect(resolvedPosition.value.y).toBe(60)
      expect(resolvedPosition.value.w).toBe(400)
      expect(resolvedPosition.value.h).toBe(80)
    })

    it('falls back to default position when no breakpoints match', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {},
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      // Should fall back to default position
      expect(resolvedPosition.value.x).toBe(100)
      expect(resolvedPosition.value.y).toBe(200)
      expect(resolvedPosition.value.w).toBe(300)
      expect(resolvedPosition.value.h).toBe(40)
    })
  })

  describe('partial override', () => {
    it('merges partial override with default position', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          mobile: { w: 375 },  // only override width
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      // x, y, h should come from default position
      expect(resolvedPosition.value.x).toBe(100)
      expect(resolvedPosition.value.y).toBe(200)
      expect(resolvedPosition.value.w).toBe(375)  // overridden
      expect(resolvedPosition.value.h).toBe(40)
    })
  })

  describe('hidden flag', () => {
    it('returns hidden=true when breakpoint override has hidden=true', () => {
      const widget = createWidget({
        responsivePosition: {
          mobile: { hidden: true },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.hidden).toBe(true)
    })

    it('returns hidden=false when breakpoint override does not set hidden', () => {
      const widget = createWidget({
        responsivePosition: {
          mobile: { w: 375 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.hidden).toBe(false)
    })
  })

  describe('unit override', () => {
    it('uses overridden units', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40, wUnit: 'px', hUnit: 'px' },
        responsivePosition: {
          mobile: { w: 100, h: 100, wUnit: '%', hUnit: '%' },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.w).toBe(100)
      expect(resolvedPosition.value.wUnit).toBe('%')
      expect(resolvedPosition.value.hUnit).toBe('%')
    })

    it('falls back to default units when not overridden', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40, wUnit: '%', hUnit: '%' },
        responsivePosition: {
          mobile: { w: 100 },
        },
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.wUnit).toBe('%')
      expect(resolvedPosition.value.hUnit).toBe('%')
    })
  })

  describe('reactivity', () => {
    it('updates when breakpoint changes', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          desktop: { w: 400 },
          tablet: { w: 200 },
          mobile: { w: 375 },
        },
      })
      const breakpoint = ref<PreviewBreakpoint>('desktop')
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint,
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.w).toBe(400)

      breakpoint.value = 'tablet'
      expect(resolvedPosition.value.w).toBe(200)

      breakpoint.value = 'mobile'
      expect(resolvedPosition.value.w).toBe(375)
    })

    it('updates when isPreviewMode changes', () => {
      const widget = createWidget({
        position: { x: 100, y: 200, w: 300, h: 40 },
        responsivePosition: {
          mobile: { w: 375 },
        },
      })
      const isPreviewMode = ref(false)
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('mobile'),
        isPreviewMode,
      })

      // Edit mode: default position
      expect(resolvedPosition.value.w).toBe(300)

      // Switch to preview mode
      isPreviewMode.value = true
      expect(resolvedPosition.value.w).toBe(375)
    })
  })

  describe('default position fallbacks', () => {
    it('uses default values when position is undefined', () => {
      const widget = createWidget({
        position: undefined as any,
      })
      const { resolvedPosition } = useResponsivePosition({
        widget: ref(widget),
        breakpoint: ref('desktop'),
        isPreviewMode: ref(true),
      })

      expect(resolvedPosition.value.x).toBe(0)
      expect(resolvedPosition.value.y).toBe(0)
      expect(resolvedPosition.value.w).toBe(240)
      expect(resolvedPosition.value.h).toBe(40)
      expect(resolvedPosition.value.xUnit).toBe('px')
      expect(resolvedPosition.value.yUnit).toBe('px')
    })
  })
})
