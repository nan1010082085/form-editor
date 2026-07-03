import { describe, it, expect } from 'vitest'
import { registerAllWidgets } from '@/widgets'
import {
  createBoardFromTemplate,
  resolveRendererLayout,
  buildContentFrameStyle,
} from '@/utils/boardTemplates'

registerAllWidgets()

describe('boardTemplates', () => {
  it('creates flex form template with seeded widgets', () => {
    const { widgets, canvas } = createBoardFromTemplate({
      layoutMode: 'flex',
      flexTemplate: 'form',
    })
    expect(canvas.layoutMode).toBe('flex')
    expect(canvas.flexTemplate).toBe('form')
    expect(widgets.length).toBeGreaterThan(0)
    expect(widgets.some((w) => w.type === 'form')).toBe(true)
  })

  it('creates flex list template with crud-list-page and search fields', () => {
    const { widgets, canvas } = createBoardFromTemplate({
      layoutMode: 'flex',
      flexTemplate: 'list',
    })
    expect(canvas.layoutMode).toBe('flex')
    const crud = widgets.find((w) => w.type === 'crud-list-page')
    expect(crud).toBeTruthy()
    const searchBar = crud?.props?.searchBar as { fields?: Array<{ type?: string }> }
    expect(searchBar?.fields?.length).toBeGreaterThan(0)
    expect(searchBar?.fields?.some((f) => f.type === 'date-range')).toBe(true)
  })

  it('creates free layout with center margin preset', () => {
    const { canvas } = createBoardFromTemplate({
      layoutMode: 'free',
      freePreset: 'list-standard',
    })
    expect(canvas.layoutMode).toBe('free')
    expect(canvas.freeLayout?.maxContentWidth).toBe(1200)
    expect(canvas.freeLayout?.contentAlign).toBe('center')
  })

  it('resolveRendererLayout maps flex to flow', () => {
    expect(resolveRendererLayout({ layoutMode: 'flex' })).toBe('flow')
    expect(resolveRendererLayout({ layoutMode: 'free' })).toBe('absolute')
    expect(resolveRendererLayout(undefined)).toBe('absolute')
  })

  it('buildContentFrameStyle applies max width centering', () => {
    const style = buildContentFrameStyle({
      layoutMode: 'free',
      freeLayout: { maxContentWidth: 960, contentAlign: 'center', marginX: '24px' },
    })
    expect(style.maxWidth).toBe('960px')
    expect(style.marginLeft).toBe('auto')
    expect(style.paddingLeft).toBe('24px')
  })
})
