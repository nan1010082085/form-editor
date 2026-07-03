import { describe, it, expect } from 'vitest'
import { parseSchemaDragData, resolveFlexInsertIndex } from '@/utils/flexCanvasDrop'
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
})
