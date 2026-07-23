import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCanvasScale } from '../useCanvasScale'

// Mock ResizeObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockUnobserve = vi.fn()

let resizeCallback: ResizeObserverCallback | null = null

class MockResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback
  }
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = mockUnobserve
}

describe('useCanvasScale', () => {
  const disposables: Array<() => void> = []

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    mockObserve.mockClear()
    mockDisconnect.mockClear()
    mockUnobserve.mockClear()
    resizeCallback = null
  })

  afterEach(() => {
    disposables.forEach((d) => d())
    disposables.length = 0
    vi.unstubAllGlobals()
  })

  function createContainer(width: number, height: number): HTMLElement {
    const el = document.createElement('div')
    Object.defineProperty(el, 'clientWidth', { value: width, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true })
    return el
  }

  function triggerResize(el: HTMLElement, width: number, height: number) {
    if (!resizeCallback) return
    resizeCallback(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      {} as ResizeObserver,
    )
  }

  it('returns scale 1 when container dimensions are zero', () => {
    const containerRef = ref<HTMLElement | null>(null)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
    })
    disposables.push(result.dispose)
    expect(result.scale.value).toBe(1)
  })

  it('calculates contain scale (default) correctly', () => {
    const container = createContainer(960, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('contain'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 540)
    // contain = min(960/1920, 540/1080) = min(0.5, 0.5) = 0.5
    expect(result.scale.value).toBeCloseTo(0.5)
  })

  it('calculates contain scale with aspect ratio mismatch', () => {
    const container = createContainer(1920, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('contain'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 1920, 540)
    // contain = min(1920/1920, 540/1080) = min(1, 0.5) = 0.5
    expect(result.scale.value).toBeCloseTo(0.5)
  })

  it('calculates fit-width scale correctly', () => {
    const container = createContainer(960, 800)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('fit-width'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 800)
    // fit-width = 960/1920 = 0.5
    expect(result.scale.value).toBeCloseTo(0.5)
  })

  it('calculates fit-height scale correctly', () => {
    const container = createContainer(1920, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('fit-height'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 1920, 540)
    // fit-height = 540/1080 = 0.5
    expect(result.scale.value).toBeCloseTo(0.5)
  })

  it('returns scale 1 for stretch mode', () => {
    const container = createContainer(960, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('stretch'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 540)
    expect(result.scale.value).toBe(1)
  })

  it('stretch mode returns 100% width/height style', () => {
    const container = createContainer(960, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('stretch'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 540)
    expect(result.canvasStyle.value.width).toBe('100%')
    expect(result.canvasStyle.value.height).toBe('100%')
    expect(result.canvasStyle.value.transform).toBe('none')
    expect(result.canvasStyle.value.transformOrigin).toBe('top left')
  })

  it('contain mode returns transform scale style', () => {
    const container = createContainer(960, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('contain'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 540)
    expect(result.canvasStyle.value.width).toBe('1920px')
    expect(result.canvasStyle.value.height).toBe('1080px')
    expect(result.canvasStyle.value.transform).toContain('scale(')
    expect(result.canvasStyle.value.transformOrigin).toBe('top left')
  })

  it('defaults to contain mode when scaleMode is not provided', () => {
    const container = createContainer(960, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 540)
    // default = contain = min(0.5, 0.5) = 0.5
    expect(result.scale.value).toBeCloseTo(0.5)
  })

  it('scales up when container is larger than canvas', () => {
    const container = createContainer(3840, 2160)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode: ref('contain'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 3840, 2160)
    // contain = min(3840/1920, 2160/1080) = min(2, 2) = 2
    expect(result.scale.value).toBeCloseTo(2)
  })

  it('updates scale when canvas dimensions change', async () => {
    const container = createContainer(1920, 1080)
    const containerRef = ref<HTMLElement | null>(container)
    const canvasWidth = ref(1920)
    const canvasHeight = ref(1080)
    const result = useCanvasScale({
      canvasWidth,
      canvasHeight,
      containerRef,
      scaleMode: ref('contain'),
    })
    disposables.push(result.dispose)
    triggerResize(container, 1920, 1080)
    expect(result.scale.value).toBeCloseTo(1)

    canvasWidth.value = 3840
    canvasHeight.value = 2160
    await nextTick()
    // contain = min(1920/3840, 1080/2160) = min(0.5, 0.5) = 0.5
    expect(result.scale.value).toBeCloseTo(0.5)
  })

  it('updates scale when scaleMode changes', async () => {
    const container = createContainer(960, 1080)
    const containerRef = ref<HTMLElement | null>(container)
    const scaleMode = ref<'contain' | 'fit-width' | 'fit-height'>('contain')
    const result = useCanvasScale({
      canvasWidth: ref(1920),
      canvasHeight: ref(1080),
      containerRef,
      scaleMode,
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 1080)
    // contain = min(960/1920, 1080/1080) = min(0.5, 1) = 0.5
    expect(result.scale.value).toBeCloseTo(0.5)

    scaleMode.value = 'fit-height'
    await nextTick()
    // fit-height = 1080/1080 = 1
    expect(result.scale.value).toBeCloseTo(1)
  })

  it('returns 1 for zero or negative canvas dimensions', () => {
    const container = createContainer(960, 540)
    const containerRef = ref<HTMLElement | null>(container)
    const result = useCanvasScale({
      canvasWidth: ref(0),
      canvasHeight: ref(1080),
      containerRef,
    })
    disposables.push(result.dispose)
    triggerResize(container, 960, 540)
    expect(result.scale.value).toBe(1)
  })
})
