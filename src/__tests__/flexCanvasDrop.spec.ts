import { describe, it, expect } from 'vitest'
import { parseSchemaDragData, resolveFlexInsertIndex, mapFilteredIndexToFull } from '@/utils/flexCanvasDrop'
import type { Widget } from '@/widgets/base/types'

describe('flexCanvasDrop', () => {
  it('parseSchemaDragData reads schema-type', () => {
    const event = {
      dataTransfer: {
        getData: (key: string) => (key === 'schema-type' ? 'input' : ''),
        types: ['schema-type'],
      },
    } as unknown as DragEvent
    expect(parseSchemaDragData(event)).toEqual({ source: 'panel', type: 'input' })
  })

  it('resolveFlexInsertIndex picks index from clientY', () => {
    const container = document.createElement('div')
    const a = document.createElement('div')
    a.setAttribute('data-widget-id', 'w1')
    a.getBoundingClientRect = () => ({ top: 100, height: 40 } as DOMRect)
    const b = document.createElement('div')
    b.setAttribute('data-widget-id', 'w2')
    b.getBoundingClientRect = () => ({ top: 160, height: 40 } as DOMRect)
    container.append(a, b)

    const widgets = [
      { id: 'w1' },
      { id: 'w2' },
    ] as Widget[]

    expect(resolveFlexInsertIndex(container, 110, widgets)).toBe(0)
    expect(resolveFlexInsertIndex(container, 170, widgets)).toBe(1)
    expect(resolveFlexInsertIndex(container, 220, widgets)).toBe(2)
  })

  it('mapFilteredIndexToFull maps tabs/col filtered index back to full array', () => {
    // 模拟 tabs 容器：full = [A(tab1), B(tab2), C(tab1)]，activeKey=tab1
    // filtered = [A, C]，拖到 C 之前(filteredIdx=1) 应映射到 full 的 index=2
    const full = [{ id: 'A' }, { id: 'B' }, { id: 'C' }] as Widget[]
    const filtered = [{ id: 'A' }, { id: 'C' }] as Widget[]

    expect(mapFilteredIndexToFull(filtered, full, 0)).toBe(0) // A 之前
    expect(mapFilteredIndexToFull(filtered, full, 1)).toBe(2) // C 之前（跳过 B）
    expect(mapFilteredIndexToFull(filtered, full, 2)).toBe(3) // 末尾
    expect(mapFilteredIndexToFull(filtered, full, -1)).toBe(0) // 负值兜底
  })

  it('mapFilteredIndexToFull returns full length when filtered is empty', () => {
    const full = [{ id: 'A' }] as Widget[]
    const filtered: Widget[] = []
    expect(mapFilteredIndexToFull(filtered, full, 0)).toBe(1)
  })
})

describe('useFlexCanvasDropEnabled handler 暴露（回归：EditorCanvas 解构名匹配）', () => {
  it('返回 handleDragOver/handleDragLeave/handleDrop（EditorCanvas 用别名解构）', async () => {
    const { setActivePinia, createPinia } = await import('pinia')
    const { ref } = await import('vue')
    setActivePinia(createPinia())
    const { useFlexCanvasDropEnabled } = await import('@/composables/useFlexCanvasDrop')
    const containerRef = ref<HTMLElement | null>(null)
    const enabled = ref(true)
    const zone = useFlexCanvasDropEnabled(containerRef, enabled)
    // EditorCanvas 用 handleDragOver: handleFlexDragOver 别名解构，故源必须暴露 handleDragOver 等
    expect(typeof zone.handleDragOver).toBe('function')
    expect(typeof zone.handleDragLeave).toBe('function')
    expect(typeof zone.handleDrop).toBe('function')
    expect(typeof zone.isDragOver).toBe('object') // ComputedRef
  })
})
