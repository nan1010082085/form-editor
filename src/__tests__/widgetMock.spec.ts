import { describe, it, expect } from 'vitest'
import {
  getWidgetMock,
  getChartStaticDataFromMock,
  getTableRowsFromMock,
  shouldUseWidgetMock,
  COMPLEX_WIDGET_MOCK_TYPES,
} from '@/widgets/base/widgetMock'

describe('widgetMock', () => {
  it('shouldUseWidgetMock only on editor surface without API', () => {
    expect(shouldUseWidgetMock('editor', false)).toBe(true)
    expect(shouldUseWidgetMock('editor', true)).toBe(false)
    expect(shouldUseWidgetMock('runtime', false)).toBe(false)
    expect(shouldUseWidgetMock(undefined, false)).toBe(false)
  })

  it('getTableRowsFromMock returns advanced-table rows', () => {
    const result = getTableRowsFromMock('advanced-table')
    expect(result).toBeDefined()
    expect(result!.rows.length).toBeGreaterThan(0)
    expect(result!.total).toBeGreaterThan(0)
    expect(result!.rows[0]).toHaveProperty('applicantName')
  })

  it('getTableRowsFromMock returns table and user-management rows', () => {
    const table = getTableRowsFromMock('table')
    expect(table?.rows[0]).toHaveProperty('name')
    const users = getTableRowsFromMock('user-management')
    expect(users?.rows[0]).toHaveProperty('username')
  })

  it('getWidgetMock resolves flow-task-actions record mock', () => {
    expect(getWidgetMock('flow-task-actions')?.kind).toBe('record')
  })

  it('getWidgetMock resolves remaining chart aliases', () => {
    const aliases = [
      'scatter-chart', 'bubble-chart', 'radar', 'filled-radar',
      'gauge', 'multi-gauge', 'heatmap', 'funnel', 'compare-funnel', 'candlestick',
    ]
    for (const type of aliases) {
      expect(getWidgetMock(type)?.kind, type).toBe('chart')
    }
  })

  it('every complex widget type has mock registered', () => {
    for (const type of COMPLEX_WIDGET_MOCK_TYPES) {
      expect(getWidgetMock(type), type).toBeDefined()
    }
  })

  it('getChartStaticDataFromMock returns chart staticData', () => {
    const data = getChartStaticDataFromMock('bar-chart')
    expect(Array.isArray(data)).toBe(true)
    expect(data!.length).toBeGreaterThan(0)
  })

  it('getWidgetMock resolves chart aliases', () => {
    expect(getWidgetMock('stacked-bar-chart')?.kind).toBe('chart')
    expect(getWidgetMock('donut-chart')?.kind).toBe('chart')
  })

  it('getWidgetMock returns statistic and descriptions mocks', () => {
    expect(getWidgetMock('statistic')?.kind).toBe('statistic')
    expect(getWidgetMock('descriptions')?.kind).toBe('record')
  })
})
