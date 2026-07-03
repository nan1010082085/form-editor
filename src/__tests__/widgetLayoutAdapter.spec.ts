import { describe, it, expect } from 'vitest'
import { adaptWidgetsToBoardLayout, flexRootWidgetDefaults } from '@/utils/widgetLayoutAdapter'
import type { Widget } from '@/widgets/base/types'

function mockWidget(type: string, partial: Partial<Widget> = {}): Widget {
  return {
    id: `${type}_1`,
    type: type as Widget['type'],
    name: type,
    label: type,
    position: { x: 0, y: 0, w: 400, h: 300, zIndex: 1 },
    style: {},
    props: {},
    ...partial,
  } as Widget
}

describe('widgetLayoutAdapter', () => {
  it('flex mode sets full width on crud-list-page', () => {
    const widgets = [mockWidget('crud-list-page')]
    adaptWidgetsToBoardLayout(widgets, 'flex')
    expect(widgets[0].style?.width).toBe('100%')
    expect(widgets[0].style?.height).toBe('auto')
  })

  it('free mode syncs style from position', () => {
    const widgets = [mockWidget('input', { position: { x: 10, y: 20, w: 280, h: 40, zIndex: 1 } })]
    adaptWidgetsToBoardLayout(widgets, 'free')
    expect(widgets[0].style?.width).toBe('280px')
    expect(widgets[0].style?.height).toBe('40px')
  })

  it('flexRootWidgetDefaults returns width 100% for table types', () => {
    expect(flexRootWidgetDefaults('advanced-table').width).toBe('100%')
  })
})
