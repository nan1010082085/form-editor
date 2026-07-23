import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useChartLinkage } from '../useChartLinkage'
import type { Widget, ChartLinkageRule } from '@/widgets/base/types'

function createChartWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: `widget-${Math.random().toString(36).slice(2, 8)}`,
    name: 'FgBarChart',
    type: 'bar-chart',
    position: { x: 0, y: 0, w: 400, h: 300 },
    ...overrides,
  }
}

function createLinkageRule(overrides: Partial<ChartLinkageRule> = {}): ChartLinkageRule {
  return {
    id: `clr-${Math.random().toString(36).slice(2, 8)}`,
    sourceWidgetId: '',
    trigger: 'click',
    targetWidgetIds: [],
    paramMapping: {},
    action: 'filter',
    ...overrides,
  }
}

describe('useChartLinkage', () => {
  let widgets: ReturnType<typeof ref<Widget[]>>
  let updateWidget: ReturnType<typeof vi.fn>
  let getChartData: ReturnType<typeof vi.fn>

  beforeEach(() => {
    widgets = ref([])
    updateWidget = vi.fn()
    getChartData = vi.fn().mockReturnValue([])
  })

  it('returns empty state by default', () => {
    const { drilldownState, getBreadcrumbs, getActiveFilters, getHighlights, hasDrilldown } = useChartLinkage({
      widgets,
      updateWidget,
    })

    expect(drilldownState.value.history.size).toBe(0)
    expect(drilldownState.value.activeFilters.size).toBe(0)
    expect(drilldownState.value.highlights.size).toBe(0)
    expect(getBreadcrumbs('any-id')).toEqual([])
    expect(getActiveFilters('any-id')).toEqual({})
    expect(getHighlights('any-id').size).toBe(0)
    expect(hasDrilldown('any-id')).toBe(false)
  })

  it('handles filter action on chart click', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'filter',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    const { handleChartClick, getActiveFilters } = useChartLinkage({
      widgets,
      updateWidget,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    const filters = getActiveFilters('target-1')
    expect(filters).toEqual({ filterCategory: 'Electronics' })
  })

  it('handles drilldown action and maintains history', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'drilldown',
      drilldownField: 'category',
      drilldownLabel: 'Product Category',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    const { handleChartClick, getBreadcrumbs, hasDrilldown, getActiveFilters } = useChartLinkage({
      widgets,
      updateWidget,
    })

    // First drilldown
    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    expect(hasDrilldown('source-1')).toBe(true)
    expect(getBreadcrumbs('source-1')).toHaveLength(1)
    expect(getBreadcrumbs('source-1')[0]).toEqual({
      value: 'Electronics',
      field: 'category',
      label: 'Product Category', // Uses drilldownLabel when provided
      filters: { filterCategory: 'Electronics' },
    })
    expect(getActiveFilters('target-1')).toEqual({ filterCategory: 'Electronics' })

    // Second drilldown
    handleChartClick('source-1', {
      dataIndex: 1,
      name: 'Phones',
      value: 50,
      seriesName: 'Sales',
      data: { category: 'Phones', value: 50 },
    })

    expect(getBreadcrumbs('source-1')).toHaveLength(2)
    expect(getActiveFilters('target-1')).toEqual({ filterCategory: 'Phones' })
  })

  it('handles drilldown back to previous level', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'drilldown',
      drilldownField: 'category',
      drilldownLabel: 'Product Category',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    const { handleChartClick, drilldownBack, getBreadcrumbs, getActiveFilters, hasDrilldown } = useChartLinkage({
      widgets,
      updateWidget,
    })

    // Two levels of drilldown
    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })
    handleChartClick('source-1', {
      dataIndex: 1,
      name: 'Phones',
      value: 50,
      seriesName: 'Sales',
      data: { category: 'Phones', value: 50 },
    })

    expect(getBreadcrumbs('source-1')).toHaveLength(2)

    // Go back one level
    drilldownBack('source-1')
    expect(getBreadcrumbs('source-1')).toHaveLength(1)
    expect(getActiveFilters('target-1')).toEqual({ filterCategory: 'Electronics' })

    // Go back to top
    drilldownBack('source-1')
    expect(getBreadcrumbs('source-1')).toHaveLength(0)
    expect(hasDrilldown('source-1')).toBe(false)
    expect(getActiveFilters('target-1')).toEqual({})
  })

  it('handles drilldown back to specific level', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'drilldown',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    const { handleChartClick, drilldownBack, getBreadcrumbs, getActiveFilters } = useChartLinkage({
      widgets,
      updateWidget,
    })

    // Three levels
    handleChartClick('source-1', {
      dataIndex: 0, name: 'A', value: 1, seriesName: 'S', data: { category: 'A' },
    })
    handleChartClick('source-1', {
      dataIndex: 1, name: 'B', value: 2, seriesName: 'S', data: { category: 'B' },
    })
    handleChartClick('source-1', {
      dataIndex: 2, name: 'C', value: 3, seriesName: 'S', data: { category: 'C' },
    })

    expect(getBreadcrumbs('source-1')).toHaveLength(3)

    // Go back to level 0
    drilldownBack('source-1', 0)
    expect(getBreadcrumbs('source-1')).toHaveLength(1)
    expect(getActiveFilters('target-1')).toEqual({ filterCategory: 'A' })
  })

  it('handles highlight action', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'category' },
      action: 'highlight',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    getChartData.mockReturnValue([
      { category: 'Electronics', value: 100 },
      { category: 'Phones', value: 50 },
      { category: 'Electronics', value: 80 },
    ])

    const { handleChartClick, getHighlights } = useChartLinkage({
      widgets,
      updateWidget,
      getChartData,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    const highlights = getHighlights('target-1')
    expect(highlights.size).toBe(2)
    expect(highlights.has(0)).toBe(true)
    expect(highlights.has(2)).toBe(true)
  })

  it('ignores rules from other source widgets', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const otherWidget = createChartWidget({ id: 'source-2' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-2',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'filter',
    })

    otherWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, otherWidget, targetWidget]

    const { handleChartClick, getActiveFilters } = useChartLinkage({
      widgets,
      updateWidget,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    // Should not apply filter because the rule is for source-2
    expect(getActiveFilters('target-1')).toEqual({})
  })

  it('ignores rules with non-click triggers', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'filter',
      trigger: 'hover',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    const { handleChartClick, getActiveFilters } = useChartLinkage({
      widgets,
      updateWidget,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    expect(getActiveFilters('target-1')).toEqual({})
  })

  it('handles multiple targets for a single rule', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const target1 = createChartWidget({ id: 'target-1' })
    const target2 = createChartWidget({ id: 'target-2' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1', 'target-2'],
      paramMapping: { category: 'filterCategory' },
      action: 'filter',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, target1, target2]

    const { handleChartClick, getActiveFilters } = useChartLinkage({
      widgets,
      updateWidget,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    expect(getActiveFilters('target-1')).toEqual({ filterCategory: 'Electronics' })
    expect(getActiveFilters('target-2')).toEqual({ filterCategory: 'Electronics' })
  })

  it('handles multiple rules on same source widget', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const target1 = createChartWidget({ id: 'target-1' })
    const target2 = createChartWidget({ id: 'target-2' })

    const rule1 = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'cat' },
      action: 'filter',
    })
    const rule2 = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-2'],
      paramMapping: { value: 'val' },
      action: 'filter',
    })

    sourceWidget.chartLinkages = [rule1, rule2]
    widgets.value = [sourceWidget, target1, target2]

    const { handleChartClick, getActiveFilters } = useChartLinkage({
      widgets,
      updateWidget,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    expect(getActiveFilters('target-1')).toEqual({ cat: 'Electronics' })
    expect(getActiveFilters('target-2')).toEqual({ val: 100 })
  })

  it('resetAll clears all state', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'drilldown',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    const { handleChartClick, resetAll, getBreadcrumbs, getActiveFilters, hasDrilldown } = useChartLinkage({
      widgets,
      updateWidget,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    expect(hasDrilldown('source-1')).toBe(true)

    resetAll()

    expect(hasDrilldown('source-1')).toBe(false)
    expect(getBreadcrumbs('source-1')).toEqual([])
    expect(getActiveFilters('target-1')).toEqual({})
  })

  it('clears linkage state when going back to top level', () => {
    const sourceWidget = createChartWidget({ id: 'source-1' })
    const targetWidget = createChartWidget({ id: 'target-1' })
    const rule = createLinkageRule({
      sourceWidgetId: 'source-1',
      targetWidgetIds: ['target-1'],
      paramMapping: { category: 'filterCategory' },
      action: 'drilldown',
    })

    sourceWidget.chartLinkages = [rule]
    widgets.value = [sourceWidget, targetWidget]

    const { handleChartClick, drilldownBack, getActiveFilters, getHighlights } = useChartLinkage({
      widgets,
      updateWidget,
    })

    handleChartClick('source-1', {
      dataIndex: 0,
      name: 'Electronics',
      value: 100,
      seriesName: 'Sales',
      data: { category: 'Electronics', value: 100 },
    })

    drilldownBack('source-1') // Goes back to top (level -1)

    expect(getActiveFilters('target-1')).toEqual({})
    expect(getHighlights('target-1').size).toBe(0)
  })
})
