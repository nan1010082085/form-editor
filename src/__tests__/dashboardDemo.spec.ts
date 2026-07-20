import { describe, it, expect, beforeEach } from 'vitest'
import { registerAllWidgets } from '@/widgets'
import { seedDashboardDemo } from '@/utils/dashboardDemo'
import { createBoardFromTemplate } from '@/utils/boardTemplates'

describe('dashboard demo seed (E1 acceptance)', () => {
  beforeEach(() => {
    registerAllWidgets()
  })

  it('seeds 10+ chart/widgets with dark theme', () => {
    const { widgets, canvas } = seedDashboardDemo()
    expect(widgets.length).toBeGreaterThanOrEqual(14)
    expect(canvas.themePreset).toBe('dashboard-dark')
    expect(canvas.width).toBe(1920)
    expect(canvas.layoutMode).toBe('free')

    const types = new Set(widgets.map(w => w.type))
    expect(types.has('bar-chart')).toBe(true)
    expect(types.has('line-chart')).toBe(true)
    expect(types.has('pie-chart')).toBe(true)
    expect(types.has('gauge')).toBe(true)
    expect(types.has('realtime-clock')).toBe(true)
    expect(types.has('select')).toBe(true)
  })

  it('charts have region visibility linkage', () => {
    const { widgets } = seedDashboardDemo()
    const charts = widgets.filter(w => w.field?.startsWith('chart_'))
    expect(charts.length).toBeGreaterThanOrEqual(10)
    for (const c of charts) {
      expect(c.linkages?.[0]?.type).toBe('visible')
      expect(c.linkages?.[0]?.watchFields).toContain('region')
    }
  })

  it('createBoardFromTemplate dashboard-demo works', () => {
    const { widgets, canvas } = createBoardFromTemplate({
      layoutMode: 'free',
      freePreset: 'dashboard-demo',
    })
    expect(widgets.length).toBeGreaterThan(10)
    expect(canvas.themePreset).toBe('dashboard-dark')
  })
})
