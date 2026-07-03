import { describe, it, expect } from 'vitest'
import { buildSearchParams, initSearchFormValues } from '@/utils/searchFormUtils'
import type { SearchFieldSchema } from '@/components/WidgetRenderer/types'

describe('searchFormUtils', () => {
  const fields: SearchFieldSchema[] = [
    { type: 'input', field: 'keyword', label: '关键词' },
    { type: 'select', field: 'status', label: '状态' },
    { type: 'checkbox', field: 'onlyMine', label: '仅我的' },
    {
      type: 'date-range',
      field: 'createdAt',
      label: '创建时间',
      props: { rangeStartField: 'beginTime', rangeEndField: 'endTime' },
    },
  ]

  it('initSearchFormValues sets defaults by type', () => {
    const values = initSearchFormValues(fields)
    expect(values.keyword).toBe('')
    expect(values.status).toBe('')
    expect(values.onlyMine).toBe(false)
    expect(values.createdAt).toEqual([])
  })

  it('buildSearchParams skips unchecked checkbox', () => {
    const form = initSearchFormValues(fields)
    form.keyword = 'test'
    expect(buildSearchParams(fields, form)).toEqual({ keyword: 'test' })
  })

  it('buildSearchParams includes checked checkbox', () => {
    const form = initSearchFormValues(fields)
    form.onlyMine = true
    expect(buildSearchParams(fields, form)).toEqual({ onlyMine: true })
  })

  it('buildSearchParams splits date-range into start/end keys', () => {
    const form = initSearchFormValues(fields)
    form.createdAt = ['2026-01-01', '2026-01-31']
    expect(buildSearchParams(fields, form)).toEqual({
      beginTime: '2026-01-01',
      endTime: '2026-01-31',
    })
  })
})
